export class ControllerInteraction {

    constructor({
                    gamepad,
                    view,
                    nipplejs = globalThis.nipplejs
                }) {
        this.gamepad = gamepad;
        this.view = view;
        this.nipplejs = nipplejs;

        this.zones = [];
        this.joysticks = [];

        this.setup();
    }

    setup() {
        console.log("[ControllerInteraction] Initializing layout:", this.view.layout);
        console.log("[ControllerInteraction] Total overlays:", this.view.layout.overlays.length);

        const dpad = [];

        for (const overlay of this.view.layout.overlays) {
            console.debug("[ControllerInteraction] Overlay:", {
                target: overlay.target,
                type: overlay.type,
                inputKind: overlay.inputKind,
                inputCode: overlay.inputCode,
                x: overlay.x,
                y: overlay.y,
                w: overlay.w,
                h: overlay.h
            });

            if (overlay.type === "stickRing" ||
                overlay.type === "stickClick"
            ) {
                continue;
            }

            if (overlay.type === "touchpad") {
                this.setupTouchpad(overlay);
                continue;
            }
            if (overlay.target === "TouchpadClick") {
                this.setupTouchpadClick(overlay);
                continue;
            }

            if (overlay.target?.startsWith("DPad")) {
                dpad.push(overlay);
                continue;
            }

            if (overlay.inputKind === "button") {
                this.setupButton(overlay);
                continue;
            }

            if (overlay.inputKind === "axis" &&
                overlay.type === "trigger"
            ) {
                this.setupTrigger(overlay);
            }
        }

        if (dpad.length > 0) {
            this.setupDpad(dpad);
        }

        this.setupSticks();
    }

    createZone(overlay) {

        const zone =
            document.createElement("div");

        zone.className =
            "touch-zone";

        const padX =
            overlay.w * 0.2;

        const padY =
            overlay.h * 0.2;

        zone.style.left =
            `${(overlay.x - padX) /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.top =
            `${(overlay.y - padY) /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.width =
            `${(overlay.w + padX * 2) /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.height =
            `${(overlay.h + padY * 2) /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.zIndex =
            overlay.type === "trigger"
                ? "12"
                : this.isPriorityButton(overlay)
                    ? "15"
                    : "14";

        this.view.touchLayer.appendChild(
            zone
        );

        this.zones.push(zone);

        return zone;
    }

    isPriorityButton(overlay) {

        const priorityButtons = [
            "ButtonBack",
            "ButtonStart",
            "ButtonGuide",
            "TouchpadClick",
            "Share",
            "Options",
            "Create",
            "Menu"
        ];

        return priorityButtons.includes(
            overlay.target
        );
    }

    createExactZone(
        overlay,
        zIndex = 15
    ) {

        const zone =
            document.createElement("div");

        zone.className =
            "touch-zone";

        zone.style.left =
            `${overlay.x /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.top =
            `${overlay.y /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.width =
            `${overlay.w /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.height =
            `${overlay.h /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.zIndex =
            String(zIndex);

        this.view.touchLayer.appendChild(
            zone
        );

        this.zones.push(zone);

        return zone;
    }

    setupButton(overlay) {
        // const zone = this.createZone(
        //     overlay
        // );
        const zone = this.createExactZone(overlay, 14);

        const code = Number(overlay.inputCode);

        const down = event => {
            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "button",
                code,
                value: 1
            });

            this.view.setButtonState(
                code,
                1
            );

            this.vibrate();
        };

        const up = event => {

            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "button",
                code,
                value: 0
            });

            this.view.setButtonState(
                code,
                0
            );
        };

        this.bindPressEvents(
            zone,
            down,
            up
        );
    }

    setupTrigger(overlay) {

        const zone =
            this.createZone(
                overlay
            );

        const code =
            Number(overlay.inputCode);

        const down = event => {

            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "axis",
                code,
                value: 65535
            });

            this.view.setAxisState(
                code,
                65535
            );

            this.vibrate();
        };

        const up = event => {

            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "axis",
                code,
                value: 0
            });

            this.view.setAxisState(
                code,
                0
            );
        };

        this.bindPressEvents(
            zone,
            down,
            up
        );
    }

    setupTouchpadClick(overlay) {
        const zone = this.createExactZone(
            overlay,
            15
        );

        const code = Number(overlay.inputCode);

        const down = event => {
            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "button",
                code,
                value: 1
            });
            this.view.setButtonState(
                code,
                1
            )

            this.vibrate();
        };

        const up = event => {
            event.preventDefault();

            this.gamepad.send({
                type: "input",
                kind: "button",
                code,
                value: 0
            });
            this.view.setButtonState(
                code,
                0
            )
        };

        this.bindPressEvents(
            zone,
            down,
            up
        );
    }

    setupTouchpad(overlay) {

        const zone =
            this.createExactZone(
                overlay,
                16
            );

        zone.classList.add(
            "touchpad-zone"
        );

        /*
         * Touchpad finger visualization.
         */
        const dot0 =
            document.createElement("div");

        dot0.className =
            "touchpad-dot f0";

        const dot1 =
            document.createElement("div");

        dot1.className =
            "touchpad-dot f1";

        zone.appendChild(
            dot0
        );

        zone.appendChild(
            dot1
        );

        let finger0Id = null;
        let finger1Id = null;

        const normalizeTouch = touch => {

            const rect =
                zone.getBoundingClientRect();

            return {
                x: Math.max(
                    0,
                    Math.min(
                        1,
                        (touch.clientX - rect.left) /
                        rect.width
                    )
                ),
                y: Math.max(
                    0,
                    Math.min(
                        1,
                        (touch.clientY - rect.top) /
                        rect.height
                    )
                )
            };
        };

        const updateDot = (
            dot,
            position,
            visible
        ) => {

            if (visible) {

                dot.style.display =
                    "block";

                dot.style.left =
                    `${position.x * 100}%`;

                dot.style.top =
                    `${position.y * 100}%`;

            } else {

                dot.style.display =
                    "none";
            }
        };

        const touchStart = event => {

            event.preventDefault();

            for (
                const touch
                of event.changedTouches
                ) {

                const position =
                    normalizeTouch(
                        touch
                    );

                if (
                    finger0Id === null
                ) {

                    finger0Id =
                        touch.identifier;

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 0,
                        x: position.x,
                        y: position.y,
                        down: true
                    });

                    updateDot(
                        dot0,
                        position,
                        true
                    );

                    continue;
                }

                if (
                    finger1Id === null
                ) {

                    finger1Id =
                        touch.identifier;

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 1,
                        x: position.x,
                        y: position.y,
                        down: true
                    });

                    updateDot(
                        dot1,
                        position,
                        true
                    );
                }
            }
        };

        const touchMove = event => {

            event.preventDefault();

            for (
                const touch
                of event.changedTouches
                ) {

                const position =
                    normalizeTouch(
                        touch
                    );

                if (
                    touch.identifier ===
                    finger0Id
                ) {

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 0,
                        x: position.x,
                        y: position.y,
                        down: true
                    });

                    updateDot(
                        dot0,
                        position,
                        true
                    );

                    continue;
                }

                if (
                    touch.identifier ===
                    finger1Id
                ) {

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 1,
                        x: position.x,
                        y: position.y,
                        down: true
                    });

                    updateDot(
                        dot1,
                        position,
                        true
                    );
                }
            }
        };

        const touchEnd = event => {

            event.preventDefault();

            for (
                const touch
                of event.changedTouches
                ) {

                if (
                    touch.identifier ===
                    finger0Id
                ) {

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 0,
                        x: 0,
                        y: 0,
                        down: false
                    });

                    finger0Id =
                        null;

                    updateDot(
                        dot0,
                        null,
                        false
                    );

                    continue;
                }

                if (
                    touch.identifier ===
                    finger1Id
                ) {

                    this.gamepad.send({
                        type: "touchpad",
                        finger: 1,
                        x: 0,
                        y: 0,
                        down: false
                    });

                    finger1Id =
                        null;

                    updateDot(
                        dot1,
                        null,
                        false
                    );
                }
            }
        };

        zone.addEventListener(
            "touchstart",
            touchStart,
            { passive: false }
        );

        zone.addEventListener(
            "touchmove",
            touchMove,
            { passive: false }
        );

        zone.addEventListener(
            "touchend",
            touchEnd,
            { passive: false }
        );

        zone.addEventListener(
            "touchcancel",
            touchEnd,
            { passive: false }
        );
    }

    bindPressEvents(
        zone,
        down,
        up
    ) {
        zone.addEventListener("touchstart", down, { passive: false });
        zone.addEventListener("touchend", up, { passive: false } );
        zone.addEventListener("touchcancel", up, { passive: false } );

        zone.addEventListener("mousedown", down);
        zone.addEventListener("mouseup", up);
        zone.addEventListener("mouseleave", up);

        // zone.addEventListener("pointerdown", down);
        // zone.addEventListener("pointerup", up);
        // zone.addEventListener("pointercancel", up);
        // zone.addEventListener("pointerleave", event => {
        //     if (event.buttons === 0) {
        //         up(event);
        //     }
        // });
    }

    setupDpad(overlays) {

        const minX =
            Math.min(
                ...overlays.map(
                    overlay => overlay.x
                )
            );

        const minY =
            Math.min(
                ...overlays.map(
                    overlay => overlay.y
                )
            );

        const maxX =
            Math.max(
                ...overlays.map(
                    overlay =>
                        overlay.x + overlay.w
                )
            );

        const maxY =
            Math.max(
                ...overlays.map(
                    overlay =>
                        overlay.y + overlay.h
                )
            );

        const width =
            maxX - minX;

        const height =
            maxY - minY;

        const padX =
            width * 0.15;

        const padY =
            height * 0.15;

        const zone =
            document.createElement("div");

        zone.className =
            "touch-zone dpad-zone";

        zone.style.left =
            `${(minX - padX) /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.top =
            `${(minY - padY) /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.width =
            `${(width + padX * 2) /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.height =
            `${(height + padY * 2) /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.zIndex = "13";

        this.view.touchLayer.appendChild(
            zone
        );

        let currentPov = -1;

        const update = event => {

            event.preventDefault();

            const rect =
                zone.getBoundingClientRect();

            const pointer =
                event.changedTouches?.[0] ??
                event.touches?.[0] ??
                event;

            if (!pointer) {
                return;
            }

            const dx =
                (pointer.clientX - rect.left) /
                rect.width -
                0.5;

            const dy =
                (pointer.clientY - rect.top) /
                rect.height -
                0.5;

            const directions =
                this.getDpadDirections(
                    dx,
                    dy
                );

            const pov =
                this.computePov(
                    directions
                );

            if (
                pov === currentPov
            ) {
                return;
            }

            currentPov = pov;

            this.gamepad.send({
                type: "input",
                kind: "pov",
                code: 0,
                value: pov
            });

            this.view.setPovState(
                pov
            );
        };

        const release = event => {

            event.preventDefault();

            currentPov = -1;

            this.gamepad.send({
                type: "input",
                kind: "pov",
                code: 0,
                value: -1
            });

            this.view.setPovState(-1);
        };

        zone.addEventListener(
            "touchstart",
            update,
            { passive: false }
        );

        zone.addEventListener(
            "touchmove",
            update,
            { passive: false }
        );

        zone.addEventListener(
            "touchend",
            release,
            { passive: false }
        );

        zone.addEventListener(
            "touchcancel",
            release,
            { passive: false }
        );

        zone.addEventListener(
            "mousedown",
            update
        );

        zone.addEventListener(
            "mousemove",
            event => {
                if (event.buttons === 1) {
                    update(event);
                }
            }
        );

        zone.addEventListener(
            "mouseup",
            release
        );

        zone.addEventListener(
            "mouseleave",
            release
        );

        this.zones.push(zone);
    }

    getDpadDirections(
        dx,
        dy
    ) {

        const directions = {
            up: false,
            right: false,
            down: false,
            left: false
        };

        const deadzone = 0.15;

        if (
            Math.abs(dx) <= deadzone &&
            Math.abs(dy) <= deadzone
        ) {
            return directions;
        }

        const angle =
            Math.atan2(dy, dx) *
            180 /
            Math.PI;

        if (
            angle >= -67.5 &&
            angle < 67.5
        ) {
            directions.right = true;
        }

        if (
            angle >= 22.5 &&
            angle < 157.5
        ) {
            directions.down = true;
        }

        if (
            angle >= 112.5 ||
            angle < -112.5
        ) {
            directions.left = true;
        }

        if (
            angle >= -157.5 &&
            angle < -22.5
        ) {
            directions.up = true;
        }

        return directions;
    }

    computePov(directions) {

        if (
            directions.up &&
            directions.right
        ) {
            return 4500;
        }

        if (
            directions.down &&
            directions.right
        ) {
            return 13500;
        }

        if (
            directions.down &&
            directions.left
        ) {
            return 22500;
        }

        if (
            directions.up &&
            directions.left
        ) {
            return 31500;
        }

        if (directions.up) return 0;
        if (directions.right) return 9000;
        if (directions.down) return 18000;
        if (directions.left) return 27000;

        return -1;
    }

    setupSticks() {

        if (
            !this.nipplejs
        ) {
            return;
        }

        this.setupStick(
            "left",
            0,
            1,
            "LeftThumbRing",
            "LeftThumbButton"
        );

        this.setupStick(
            "right",
            3,
            4,
            "RightThumbRing",
            "RightThumbButton"
        );
    }

    setupStick(
        side,
        axisX,
        axisY,
        ringTarget,
        clickTarget
    ) {

        const zone =
            this.createStickZone(side);

        if (!zone) {
            return;
        }

        const overlay =
            this.view.layout.overlays.find(
                item =>
                    item.target === ringTarget
            );

        if (!overlay) {
            zone.remove();

            const index =
                this.zones.indexOf(zone);

            if (index >= 0) {
                this.zones.splice(
                    index,
                    1
                );
            }

            return;
        }

        const clickOverlay =
            this.view.layout.overlays.find(
                item =>
                    item.target === clickTarget
            );

        const factor = 2;

        const centerX =
            overlay.x +
            overlay.w / 2;

        const centerY =
            overlay.y +
            overlay.h / 2;

        const width =
            overlay.w * factor;

        const height =
            overlay.h * factor;

        zone.style.left =
            `${(centerX - width / 2) /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.top =
            `${(centerY - height / 2) /
            this.view.layout.baseHeight *
            100}%`;

        zone.style.width =
            `${width /
            this.view.layout.baseWidth *
            100}%`;

        zone.style.height =
            `${height /
            this.view.layout.baseHeight *
            100}%`;

        let lastX = 32767;
        let lastY = 32767;

        let touchStartTime = 0;
        let touchStartDistance = 0;

        const joystick =
            this.nipplejs.create({
                zone,
                mode: "static",
                position: {
                    left: "50%",
                    top: "50%"
                },
                multitouch: true,
                color:
                    "rgba(255,255,255,0.3)"
            });

        joystick.on(
            "start",
            () => {

                touchStartTime =
                    Date.now();

                touchStartDistance =
                    0;
            }
        );

        joystick.on(
            "move",
            (event, data) => {

                const maxDistance = 50;

                const normalized =
                    Math.min(
                        data.distance /
                        maxDistance,
                        1
                    );

                const radians =
                    data.angle.radian;

                const dx =
                    Math.cos(radians) *
                    normalized;

                const dy =
                    -Math.sin(radians) *
                    normalized;

                this.view.moveStick(
                    ringTarget,
                    dx,
                    dy
                );

                touchStartDistance =
                    Math.max(
                        touchStartDistance,
                        data.distance
                    );

                const x =
                    Math.max(
                        0,
                        Math.min(
                            65535,
                            Math.round(
                                32767 +
                                dx * 32767
                            )
                        )
                    );

                const y =
                    Math.max(
                        0,
                        Math.min(
                            65535,
                            Math.round(
                                32767 +
                                dy * 32767
                            )
                        )
                    );

                if (x !== lastX) {

                    this.gamepad.send({
                        type: "input",
                        kind: "axis",
                        code: axisX,
                        value: x
                    });

                    this.view.setAxisState(
                        axisX,
                        x
                    );

                    lastX = x;
                }

                if (y !== lastY) {

                    this.gamepad.send({
                        type: "input",
                        kind: "axis",
                        code: axisY,
                        value: y
                    });

                    this.view.setAxisState(
                        axisY,
                        y
                    );

                    lastY = y;
                }
            }
        );

        joystick.on(
            "end",
            () => {

                this.gamepad.send({
                    type: "input",
                    kind: "axis",
                    code: axisX,
                    value: 32767
                });

                this.gamepad.send({
                    type: "input",
                    kind: "axis",
                    code: axisY,
                    value: 32767
                });

                this.view.setAxisState(
                    axisX,
                    32767
                );

                this.view.setAxisState(
                    axisY,
                    32767
                );

                this.view.moveStick(
                    ringTarget,
                    0,
                    0
                );

                lastX = 32767;
                lastY = 32767;

                /*
                 * a very quick, nearly stationary stick touch is
                 * interpreted as stick-click.
                 */
                if (
                    clickOverlay &&
                    Date.now() - touchStartTime < 200 &&
                    touchStartDistance < 10
                ) {

                    const clickCode =
                        Number(
                            clickOverlay.inputCode
                        );

                    this.gamepad.send({
                        type: "input",
                        kind: "button",
                        code: clickCode,
                        value: 1
                    });

                    this.view.setButtonState(
                        clickCode,
                        1
                    );

                    this.vibrate();

                    setTimeout(
                        () => {

                            this.gamepad.send({
                                type: "input",
                                kind: "button",
                                code: clickCode,
                                value: 0
                            });

                            this.view.setButtonState(
                                clickCode,
                                0
                            );
                        },
                        100
                    );
                }
            }
        );

        this.joysticks.push(
            joystick
        );
    }

    createStickZone(
        side
    ) {

        const id =
            `${side}-stick-zone`;

        /*
         * Reuse an existing element if the page already contains one.
         * Otherwise create it dynamically.
         */
        let zone =
            document.getElementById(
                id
            );

        if (!zone) {

            zone =
                document.createElement(
                    "div"
                );

            zone.id =
                id;

            zone.className =
                "stick-zone";

            this.view.touchLayer.appendChild(
                zone
            );
        }

        zone.style.touchAction =
            "none";

        zone.style.zIndex =
            "11";

        if (
            !this.zones.includes(
                zone
            )
        ) {
            this.zones.push(
                zone
            );
        }

        return zone;
    }

    vibrate() {
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
            return;
        }

        const vibrate =
            navigator.vibrate ||
            navigator.webkitVibrate ||
            navigator.mozVibrate;
        if (!vibrate) {
            return;
        }

        vibrate.call(navigator, 30);
    }

    destroy() {

        for (
            const joystick
            of this.joysticks
            ) {
            joystick.destroy();
        }

        this.joysticks = [];

        for (
            const zone
            of this.zones
            ) {
            zone.remove();
        }

        this.zones = [];
    }
}