import { Gamepad } from "./gamepad.js";

export class DUALSENSEgamepad extends Gamepad {

    constructor(client, targetHost, targetPort) {
        super({
            name: "dualsense",
            client: client,
            targetHost: targetHost,
            targetPort: targetPort,
            hasTouchpad: true,
            // send: send,

            // send({ type: "input", kind: "button", code: 0, value: value })
            buttons: {
                a: 0,     // a
                b: 1,     // b
                x: 2,     // x
                y: 3,     // y
                lb: 4,    // left  bumper
                rb: 5,    // right bumper
                back: 6,  //back
                start: 7, //start
                ls: 8,    //left  stick - press
                rs: 9,    //right stick - press
                home: 10, //ps button
                tpad: 16  //touchpad click
            },

            // send({ type: "input", kind: "axis", code: 0, value: value })
            sticks: {
                lx: 0,    //left stick - X axes
                ly: 1,    //left stick - Y axes
                rx: 3,    //right stick - X axes
                ry: 4,    //right stick - Y axes
            },

            triggers: {
                lt: 2,    // left trigger
                rt: 5     // right trigger
            },

            // send({ type: "input", kind: "pov", code: 0, value: value })
            povs: {
                u: false,      // up
                up: false,     // up

                r: false,      // right
                right: false,  // right

                d: false,      // down
                down: false,   // down

                l: false,      // left
                left: false    // left
            }
        });
    }
}