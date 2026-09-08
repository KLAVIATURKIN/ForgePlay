import { LayoutLoader } from "./LayoutLoader.js";
import { ControllerInteraction } from "./ControllerInteraction.js";

export class LayoutInitializer {

    constructor(
        gamepad,
        color = "default",
        controllerView,
        {
            layoutType = "xbox360",
            layoutUrl = "/fetch/api/layout"
        } = {}
    ) {
        this.gamepad = gamepad;
        this.color = color;
        this.layoutType = gamepad.name ?? layoutType;
        this.layoutLoader = new LayoutLoader(
            layoutUrl
        );

        this.view = controllerView;
        this.interaction = null;
        this.unsubscribe = null;
    }

    async initialize() {
        const layout = await this.layoutLoader.load(
            this.layoutType,
            this.color
        );

        this.view.initialize(layout);
        this.bindGamepad();
        this.interaction = new ControllerInteraction({
            gamepad: this.gamepad,
            view: this.view
        });
        this.view.show();
        this.view.setStatus(
            this.gamepad.name
        );

        return this;
    }

    bindGamepad() {
        this.unsubscribe = this.gamepad.onInput(input =>
            this.handleInput(input)
        );
    }

    handleInput(input) {
        switch (input.kind) {
            case "button": this.view.setButtonState(
                input.code,
                input.value
            );
            break;

            case "axis": this.view.setAxisState(
                input.code,
                input.value,
                input.input
            );
            break;

            case "pov": this.view.setPovState(
                input.value
            );
            break;
        }
    }

    show() {
        this.view.show();
    }

    hide() {
        this.view.hide();
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.interaction) {
            this.interaction.destroy();
            this.interaction = null;
        }
        if (this.view) {
            this.view.destroy();
            this.view = null;
        }
    }
}