import { send, connect } from "./forge.js"

export class Gamepad {

    constructor(inputs) {
        //properties
        this.name = inputs.name;
        this.client = inputs.client;
        this.targetHost = inputs.targetHost;
        this.targetPort = inputs.targetPort;
        this.hasTouchpad = inputs.hasTouchpad;

        //inputs
        this.buttons = inputs.buttons ?? {};
        this.sticks = inputs.sticks ?? {};
        this.triggers = inputs.triggers ?? {};
        this.povs = inputs.povs ?? {};

        //service
        this.send = send;
        this.listeners = new Set();
        this.axisValues = {}; // hold values for Stick/Triggers (axis)
        for (const stick of Object.keys(this.sticks)) {
            this.axisValues[stick] = 32767; // Sticks: centered
        }
        for (const trigger of Object.keys(this.triggers)) {
            this.axisValues[trigger] = 0; // Triggers: released
        }
        connect(
            inputs.name,
            inputs.client,
            inputs.hasTouchpad,
            inputs.targetHost,
            inputs.targetPort
        );
    }

    validInputs() {
        return [
            ...Object.keys(this.buttons),
            ...Object.keys(this.sticks),
            ...Object.keys(this.triggers),
            ...Object.keys(this.povs)
        ];
    }

    // submit inputs to virtual gamepad
    press(input) {
        const name = input.toLowerCase();

        if (name in this.buttons) {
            this.setButton(name, true);
            return;
        }
        if (name in this.povs) {
            this.setPOV(name, true);
            return;
        }
        if (name in this.triggers) {
            this.setTrigger(name, 65535);
            return;
        }

        throw new Error(`[${this.name}] Unknown input: ${input}`);
    }
    release(input) {
        const name = input.toLowerCase();

        if (name in this.buttons) {
            this.setButton(name, false);
            return;
        }
        if (name in this.povs) {
            this.setPOV(name, false);
            return;
        }
        if (name in this.triggers) {
            this.setTrigger(name, 0);
            return;
        }

        throw new Error(`[${this.name}] Unknown input: ${input}`);
    }
    reset() {
        for (const button of Object.keys(this.buttons)) {
            this.release(button);
        }
        for (const stick of Object.keys(this.sticks)) {
            this.setStick(stick, 32767); // Sticks: centered
        }
        for (const trigger of Object.keys(this.triggers)) {
            this.setTrigger(trigger, 0); // Triggers: released
        }

        for (const pov of Object.keys(this.povs)) {
            this.povs[pov] = false;
        }
        const povValue = this.computePov(this.povs)

        this.send({
            type: "input",
            kind: "pov",
            code: 0,
            value: povValue
        });
        this.notifyInput({
            input: null,
            kind: "pov",
            code: 0,
            value: povValue
        });
    }

    // update layout view when input received
    onInput(callback) {
        this.listeners.add(callback);

        return () => {
            this.listeners.delete(callback);
        };
    }
    notifyInput(input) {
        for (const listener of this.listeners) {
            listener(input);
        }
    }

    // send button state (to PadForge)
    setButton(name, pressed) {
        const code = this.buttons[name];
        const value = pressed ? 1 : 0;
        if (code === undefined) {
            throw new Error(`[${this.name}] Unknown button: ${name}`);
        }

        this.send({
            type: "input",
            kind: "button",
            code,
            value
        });
        this.notifyInput({
            input: name,
            kind: "button",
            code,
            value
        });
    }

    // send POV state (to PadForge)
    setPOV(name, value) {
        if ((name === "up" || name === "u") && !this.povs["d"]) {
            this.povs["u"] = value;
            this.povs["up"] = value;
        } else if ((name === "down" || name === "d") && !this.povs["u"]) {
            this.povs["d"] = value;
            this.povs["down"] = value;
        } else if ((name === "left" || name === "l") && !this.povs["r"]) {
            this.povs["l"] = value;
            this.povs["left"] = value;
        } else if ((name === "right" || name === "r") && !this.povs["l"]) {
            this.povs["r"] = value;
            this.povs["right"] = value;
        }

        const povValue = this.computePov(this.povs);
        this.send({
            type: "input",
            kind: "pov",
            code: 0,
            value: povValue
        });
        this.notifyInput({
            input: name,
            kind: "pov",
            code: 0,
            value: povValue
        });
    }

    // send AXIS (trigger) state (to PadForge)
    setTrigger(name, value) {
        const code = this.triggers[name];
        if (code === undefined) {
            throw new Error(
                `[${this.name}] Unknown axis(trigger): ${name}`
            );
        }

        const normalizedValue = this.normalizeAxisValue(name, value);
        if (this.axisValues[name] === normalizedValue) {
            return;
        }
        this.axisValues[name] = normalizedValue;

        this.send({
            type: "input",
            kind: "axis",
            code,
            value: normalizedValue
        });
        this.notifyInput({
            input: name,
            kind: "axis",
            code,
            value: normalizedValue
        });
    }

    // send AXIS (stick) state (to PadForge)
    setStick(name, value) {
        const code = this.sticks[name];
        if (code === undefined) {
            throw new Error(
                `[${this.name}] Unknown axis(stick): ${name}`
            );
        }

        const normalizedValue = this.normalizeAxisValue(name, value);
        if (this.axisValues[name] === normalizedValue) {
            return;
        }
        this.axisValues[name] = normalizedValue;

        this.send({
            type: "input",
            kind: "axis",
            code,
            value: normalizedValue
        });
        this.notifyInput({
            input: name,
            kind: "axis",
            code,
            value: normalizedValue
        });
    }

    //private methods
    computePov(directions) {
        if (directions.up && directions.right) return 4500;
        if (directions.down && directions.right) return 13500;
        if (directions.down && directions.left) return 22500;
        if (directions.up && directions.left) return 31500;
        if (directions.up) return 0;
        if (directions.right) return 9000;
        if (directions.down) return 18000;
        if (directions.left) return 27000;
        return -1;
    }
    normalizeAxisValue(name, value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            throw new Error(
                `[${this.name}] Invalid axis value: ${value}`
            );
        }

        return Math.max(
            0,
            Math.min(
                65535,
                Math.round(number)
            )
        );
    }
}