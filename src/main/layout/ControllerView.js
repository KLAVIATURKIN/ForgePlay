class ControllerView {

    constructor() {
        this.layout = null;

        this.viewport = null;
        this.container = null;
        this.baseImage = null;
        this.touchLayer = null;

        this.statusBar = null;
        this.disconnectMessage = null;
        this.warningPortrait = null;

        this.overlayImages = new Map();

        this.stickState = {};
        this.physicalStickState = {
            lx: 0,
            ly: 0,
            rx: 0,
            ry: 0
        };

        this.scaleFactor = 1;

        this.resizeHandler = () => {
            this.resize();
            this.updateOrientation();
        };
    }

    initialize(layout) {
        this.layout = layout;

        this.resolveElements();
        this.clear();
        this.render();
        this.installResizeHandler();
        this.resize();
        this.show();
    }

    resolveElements() {
        this.viewport = document.getElementById("controller-viewport");
        this.container = document.getElementById("controller-container");
        this.baseImage = document.getElementById("base-image");
        this.touchLayer = document.getElementById("touch-layer");

        this.statusBar = document.getElementById("statusBar");
        this.disconnectMessage =document.getElementById("disconnect-message");
        this.warningPortrait = document.getElementById("warning-portrait");

        if (!this.viewport) {
            throw new Error("#controller-viewport not found");
        }
        if (!this.container) {
            throw new Error("#controller-container not found");
        }
        if (!this.baseImage) {
            throw new Error("#base-image not found");
        }
        if (!this.touchLayer) {
            throw new Error("#touch-layer not found");
        }
    }

    clear() {
        this.overlayImages.clear();
        this.stickState = {};
        this.physicalStickState = {
            lx: 0,
            ly: 0,
            rx: 0,
            ry: 0
        };

        while (this.container.children.length > 1) {
            this.container.lastElementChild.remove();
        }
        this.touchLayer.replaceChildren();
    }

    render() {

        this.baseImage.src = `./img/${this.layout.basePath}`;

        for (const overlay of this.layout.overlays) {
            if (overlay.type === "touchpad") {
                continue;
            }

            if (!overlay.image ||
                overlay.image.endsWith("/")
            ) {
                continue;
            }

            const image = document.createElement("img");

            image.src = `./img/${overlay.image}`;
            image.dataset.target = overlay.target ?? "";
            image.className = this.getOverlayClass(overlay.type);

            this.position(
                image,
                overlay
            );

            this.container.appendChild(image);
            this.overlayImages.set(
                overlay.target,
                image
            );
        }
    }

    getOverlayClass(type) {
        switch (type) {
            case "trigger":     return "overlay trigger";
            case "triggerBase": return "overlay trigger-base";
            case "stickRing":   return "overlay stick-ring";
            default:            return "overlay";
        }
    }

    position(element, overlay) {
        element.style.left = `${overlay.x / this.layout.baseWidth  * 100}%`;
        element.style.top  = `${overlay.y / this.layout.baseHeight * 100}%`;
        element.style.width  = `${overlay.w / this.layout.baseWidth  * 100}%`;
        element.style.height = `${overlay.h / this.layout.baseHeight * 100}%`;
    }

    installResizeHandler() {
        window.addEventListener(
            "resize",
            this.resizeHandler
        );
    }

    resize() {
        if (!this.layout) {
            return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const aspectRatio = this.layout.baseWidth / this.layout.baseHeight;

        let width;
        let height;

        if (vw / vh > aspectRatio) {
            height = vh;
            width = height * aspectRatio;
        } else {
            width = vw;
            height = width / aspectRatio;
        }

        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;

        this.scaleFactor = width / this.layout.baseWidth;

        this.touchLayer.style.left = `${(vw - width) / 2}px`;
        this.touchLayer.style.top = `${(vh - height) / 2}px`;
        this.touchLayer.style.width = `${width}px`;
        this.touchLayer.style.height = `${height}px`;
    }

    updateOrientation() {
        if (!this.warningPortrait) {
            return;
        }

        const portrait = window.innerHeight > window.innerWidth;
        this.warningPortrait.style.display = portrait ? "flex" : "none";
    }

    setStatus(text) {
        if (this.statusBar) {
            this.statusBar.textContent = text;
        }
    }

    show() {
        this.viewport.style.display = "";

        if (this.disconnectMessage) {
            this.disconnectMessage.style.display = "none";
        }
    }

    hide() {
        this.viewport.style.display = "none";

        if (this.disconnectMessage) {
            this.disconnectMessage.style.display = "flex";
        }
    }

    setButtonState(code, value) {
        const overlays = this.layout.overlays.filter(overlay =>
            overlay.inputKind === "button" &&
            Number(overlay.inputCode) === Number(code)
        );

        for (const overlay of overlays) {
            this.setOverlayActive(
                overlay.target,
                Number(value) !== 0
            );
        }
    }

    setPovState(value) {
        const directions = this.getPovDirections(value);
        const dpadTargets = {
            up: "DPadUp",
            right: "DPadRight",
            down: "DPadDown",
            left: "DPadLeft"
        };

        for (const [
            direction,
            target
        ] of Object.entries(dpadTargets)) {
            this.setOverlayActive(
                target,
                directions.has(direction)
            );
        }
    }

    getPovDirections(value) {
        const directions = new Set();

        switch (Number(value)) {

            case 0: directions.add("up");
                break;

            case 4500:
                directions.add("up");
                directions.add("right");
                break;

            case 9000: directions.add("right");
                break;

            case 13500:
                directions.add("down");
                directions.add("right");
                break;

            case 18000: directions.add("down");
                break;

            case 22500:
                directions.add("down");
                directions.add("left");
                break;

            case 27000: directions.add("left");
                break;

            case 31500:
                directions.add("up");
                directions.add("left");
                break;
        }

        return directions;
    }

    setPhysicalStick(name, value) {

        const normalized = Math.max(
            -1,
            Math.min(
                1,
                (Number(value) - 32767) / 32767
            )
        );

        if (!(name in this.physicalStickState)) {
            return;
        }

        this.physicalStickState[name] = normalized;

        let target;
        let x;
        let y;

        if (name === "lx" || name === "ly") {
            target = "LeftThumbRing";
            x = this.physicalStickState.lx;
            y = this.physicalStickState.ly;
        } else if (name === "rx" || name === "ry") {
            target = "RightThumbRing";
            x = this.physicalStickState.rx;
            y = this.physicalStickState.ry;
        } else {
            return;
        }

        this.moveStick(
            target,
            x,
            y
        );
    }

    setAxisState(code, value, input = null) {
        const overlay = this.layout.overlays.find(item =>
            (item.inputKind === "axis") &&
            Number(item.inputCode) === Number(code)
        );

        if (!overlay) {
            if (input === "lx" ||
                input === "ly" ||
                input === "rx" ||
                input === "ry"
            ) {
                this.setPhysicalStick(
                    input,
                    value
                );
            }
            return;
        }

        if (overlay.type === "trigger") {
            this.setTrigger(
                overlay.target,
                value
            );

            return;
        }

        this.setStickAxis(
            overlay,
            value
        );
    }

    setTrigger(target, value) {
        const image = this.overlayImages.get(target);

        if (!image) {
            return;
        }

        const fraction = Math.max(
            0,
            Math.min(
                1,
                Number(value) / 65535
            )
        );

        image.style.clipPath = `inset(${(1 - fraction) * 100}% 0 0 0)`;
    }

    setStickAxis(overlay, value) {
        if (!this.stickState) {
            this.stickState = {};
        }

        const target = overlay.target;

        if (!this.stickState[target]) {
            this.stickState[target] = {
                x: 0,
                y: 0
            };
        }

        const normalized = (Number(value) - 32767) / 32767;
        const axis = overlay.axis ?? this.getAxisFromTarget(overlay);

        if (axis === "x") {
            this.stickState[target].x = Math.max(
                -1,
                Math.min(
                    1,
                    normalized
                )
            );
        }

        if (axis === "y") {
            this.stickState[target].y = Math.max(
                -1,
                Math.min(
                    1,
                    normalized
                )
            );
        }

        const state = this.stickState[target];
        this.moveStick(
            target,
            state.x,
            state.y
        );
    }

    getAxisFromTarget(overlay) {
        const target = String(overlay.target ?? "").toLowerCase();

        if (target.includes("leftthumb") &&
            target.includes("x")
        ) {
            return "x";
        }

        if (target.includes("leftthumb") &&
            target.includes("y")
        ) {
            return "y";
        }

        if (target.includes("rightthumb") &&
            target.includes("x")
        ) {
            return "x";
        }

        if (target.includes("rightthumb") &&
            target.includes("y")
        ) {
            return "y";
        }

        return null;
    }

    moveStick(
        target,
        x,
        y
    ) {
        const image = this.overlayImages.get(target);
        if (!image) {
            return;
        }

        const travel = this.layout.stickMaxTravel * this.scaleFactor;
        image.style.transform = `translate(${x * travel}px, ${y * travel}px)`;
    }

    setOverlayActive(
        target,
        active
    ) {
        const image = this.overlayImages.get(target); //TODO no image for TouchapadClick
        if (!image) {
            return;
        }

        image.classList.toggle(
            "active",
            active
        );
    }

    destroy() {
        window.removeEventListener(
            "resize",
            this.resizeHandler
        );

        this.overlayImages.clear();

        if (this.touchLayer) {
            this.touchLayer.replaceChildren();
        }
    }
}

const controllerView = new ControllerView();
export { controllerView };