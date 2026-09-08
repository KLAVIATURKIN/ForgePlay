export class ControllerLayout {

    constructor(data) {
        this.data = data;
    }

    get type() {
        return this.data.type;
    }

    get basePath() {
        return this.data.basePath;
    }

    get baseWidth() {
        return this.data.baseWidth;
    }

    get baseHeight() {
        return this.data.baseHeight;
    }

    get stickMaxTravel() {
        return this.data.stickMaxTravel ?? 0;
    }

    get overlays() {
        return this.data.overlays ?? [];
    }
}