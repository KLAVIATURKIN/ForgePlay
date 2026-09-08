import { onRumble } from "./forge.js";

export class PhysicalGamepad {

    constructor(
        target,
        {
            deadzone = 0.08,
            axisThreshold = 0.01
        } = {}
    ) {
        this.target = target;

        this.deadzone =
            deadzone;

        this.axisThreshold =
            axisThreshold;

        this.index = null;
        this.running = false;
        this.frame = null;

        this.buttonStates =
            new Map();

        this.axisValues =
            new Map();

        this.unsubscribeRumble =
            onRumble(
                ({ left, right }) => {
                    this.rumble(
                        left,
                        right
                    );
                }
            );

        this.handleConnected =
            event => {

                if (this.index !== null) {
                    return;
                }

                this.index =
                    event.gamepad.index;

                console.log(
                    "[PHYSICAL] Connected:",
                    event.gamepad.id
                );

                console.log(
                    "[PHYSICAL] mapping:",
                    event.gamepad.mapping,
                    "axes:",
                    event.gamepad.axes.length,
                    "buttons:",
                    event.gamepad.buttons.length
                );
            };

        this.handleDisconnected =
            event => {

                if (
                    event.gamepad.index !==
                    this.index
                ) {
                    return;
                }

                console.log(
                    "[PHYSICAL] Disconnected:",
                    event.gamepad.id
                );

                this.target.reset();

                this.buttonStates.clear();
                this.axisValues.clear();

                this.index = null;
            };
    }

    start() {

        if (this.running) {
            return;
        }

        this.running = true;

        window.addEventListener(
            "gamepadconnected",
            this.handleConnected
        );

        window.addEventListener(
            "gamepaddisconnected",
            this.handleDisconnected
        );

        this.findInitialGamepad();

        this.tick();
    }

    stop() {

        if (!this.running) {
            return;
        }

        this.running = false;

        window.removeEventListener(
            "gamepadconnected",
            this.handleConnected
        );

        window.removeEventListener(
            "gamepaddisconnected",
            this.handleDisconnected
        );

        if (this.frame !== null) {
            cancelAnimationFrame(
                this.frame
            );

            this.frame = null;
        }

        this.target.reset();

        this.buttonStates.clear();
        this.axisValues.clear();

        this.index = null;

        if (this.unsubscribeRumble) {
            this.unsubscribeRumble();
            this.unsubscribeRumble = null;
        }
    }

    findInitialGamepad() {

        const pads =
            navigator.getGamepads();

        const pad =
            Array.from(pads)
                .find(
                    pad => pad?.connected
                );

        if (!pad) {
            return;
        }

        this.index =
            pad.index;

        console.log(
            "[PHYSICAL] Already connected:",
            pad.id
        );

        console.log(
            "[PHYSICAL] mapping:",
            pad.mapping,
            "axes:",
            pad.axes.length,
            "buttons:",
            pad.buttons.length
        );
    }

    tick() {

        if (!this.running) {
            return;
        }

        this.update();

        this.frame =
            requestAnimationFrame(
                () => this.tick()
            );
    }

    update() {

        if (this.index === null) {
            return;
        }

        const pad = navigator.getGamepads()[this.index];
        if (!pad?.connected) {
            return;
        }

        this.updateStick(
            "lx",
            pad.axes[0]
        );
        this.updateStick(
            "ly",
            pad.axes[1]
        );
        this.updateStick(
            "rx",
            pad.axes[2]
        );
        this.updateStick(
            "ry",
            pad.axes[3]
        );

        this.updateButtons(pad);
        this.updateTriggers(pad);
    }

    updateStick(
        name,
        rawValue
    ) {
        if (
            !Number.isFinite(rawValue)
        ) {
            return;
        }

        const value =
            this.applyDeadzone(
                rawValue
            );

        const previous =
            this.axisValues.get(name) ?? 0;

        if (
            Math.abs(
                value - previous
            ) <
            this.axisThreshold
        ) {
            return;
        }

        this.axisValues.set(
            name,
            value
        );

        // Browser Gamepad API: -1..1
        // Internal Gamepad format: 0..65535
        const value65535 =
            Math.round(
                ((value + 1) / 2) *
                65535
            );

        // Existing input path.
        // Gamepad.setStick() calls notifyInput().
        this.target.setStick(
            name,
            value65535
        );
    }

    updateButtons(pad) {

        const buttons = {
            0: "a",
            1: "b",
            2: "x",
            3: "y",

            4: "lb",
            5: "rb",

            8: "back",
            9: "start",

            10: "ls",
            11: "rs",

            16: "home",
            17: "tpad"
        };

        for (const [index, name] of Object.entries(buttons)) {

            const button = pad.buttons[Number(index)];
            if (!button) {
                continue;
            }

            const pressed = button.pressed;
            const previous = this.buttonStates.get(name) ?? false;
            if (pressed === previous) {
                continue;
            }

            this.buttonStates.set(
                name,
                pressed
            );

            if (pressed) {
                this.target.press(name);
            } else {
                this.target.release(name);
            }
        }

        const dpad = {
            12: "up",
            13: "down",
            14: "left",
            15: "right"
        };

        for (const [index, name] of Object.entries(dpad)) {

            const button = pad.buttons[Number(index)];
            if (!button) {
                continue;
            }

            const pressed = button.pressed;
            const previous = this.buttonStates.get(name) ?? false;
            if (pressed === previous) {
                continue;
            }

            this.buttonStates.set(
                name,
                pressed
            );

            if (pressed) {
                this.target.press(name);
            } else {
                this.target.release(name);
            }
        }
    }

    updateTriggers(pad) {

        const triggers = {
            6: "lt",
            7: "rt"
        };

        for (
            const [index, name]
            of Object.entries(triggers)
            ) {

            const button =
                pad.buttons[
                    Number(index)
                    ];

            if (!button) {
                continue;
            }

            const value =
                this.applyDeadzone(
                    button.value
                );

            const previous =
                this.axisValues.get(name) ??
                0;

            if (
                Math.abs(
                    value - previous
                ) <
                this.axisThreshold
            ) {
                continue;
            }

            this.axisValues.set(
                name,
                value
            );

            this.target.setTrigger(
                name,
                Math.round(
                    value * 65535
                )
            );
        }
    }

    applyDeadzone(value) {

        if (
            Math.abs(value) <=
            this.deadzone
        ) {
            return 0;
        }

        const sign =
            Math.sign(value);

        const magnitude =
            (
                Math.abs(value) -
                this.deadzone
            ) /
            (1 - this.deadzone);

        return sign * magnitude;
    }

    reset() {
        this.target.reset();
        this.buttonStates.clear();
        this.axisValues.clear();
    }

    async rumble(
        left,
        right
    ) {

        const pad =
            this.index === null
                ? null
                : navigator.getGamepads()[
                    this.index
                    ];

        const actuator =
            pad?.vibrationActuator;

        if (
            !actuator?.playEffect
        ) {
            return;
        }

        try {

            await actuator.playEffect(
                "dual-rumble",
                {
                    startDelay: 0,
                    duration: 100,

                    strongMagnitude:
                        Math.max(
                            0,
                            Math.min(
                                1,
                                left / 65535
                            )
                        ),

                    weakMagnitude:
                        Math.max(
                            0,
                            Math.min(
                                1,
                                right / 65535
                            )
                        )
                }
            );

        } catch {
            // Controller/browser does not support haptics.
        }
    }
}