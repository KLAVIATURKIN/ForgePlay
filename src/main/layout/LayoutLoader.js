import { ControllerLayout } from "../model/ControllerLayout.js";

export class LayoutLoader {

    constructor(
        baseUrl = "./fetch/api/layout",
        resourceUrl = "./layouts"
    ) {
        this.baseUrl = baseUrl;
        this.resourceUrl = resourceUrl;
    }

    //xbox360, ds4, DualSense, XBOXONE, XBOXSERIES
    async load(
        type,
        color = "default"
    ) {
        if (color !== "default") { // try load requested color
            const colorLayout = await this.#loadFromResource(type, color);
            if (colorLayout !== null) {
                console.log(`[LayoutLoader] loaded layout: ${type}/${color}`)
                return colorLayout;
            }
            console.log(`[LayoutLoader] unable to load layout: ${type}/${color}`);
        }

        const defaultLayout = await this.#loadFromResource(type, "default");
        if (defaultLayout !== null) {
            console.log(`[LayoutLoader] loaded layout: ${type}/default`)
            return defaultLayout;
        }
        console.log(`[LayoutLoader] unable to load layout: ${type}/default`);

        let remoteLayout = this.#loadFromRemote(type);
        console.log("[LayoutLoader] remote layout", remoteLayout);
        return remoteLayout;
    }

    async #loadFromResource(
        type,
        color = "default"
    ) {
        const typeName = encodeURIComponent(type);
        const colorName = encodeURIComponent(color);
        const url = `${this.resourceUrl}/${typeName}/${colorName}.json`;

        return this.#loadJson(url, true);
    }

    // https://github.com/hifihedgehog/PadForge/blob/4d7da981a0630615e05d651419f2cfcc8c9a5e5b/PadForge.App/Models2D/ControllerOverlayLayout.cs#L2
    // https://github.com/hifihedgehog/PadForge/blob/main/PadForge.App/Services/WebControllerServer.cs#L613
    async #loadFromRemote(type) {
        const url = `${this.baseUrl}?type=${encodeURIComponent(type)}`;
        return this.#loadJson(url);
    }

    async #loadJson(path, allowNotFound = false) {
        const response = await fetch(path);
        if (response.status === 404 && allowNotFound) {
            return null;
        }
        if (!response.ok) {
            throw new Error(
                `[LayoutLoader] Failed to load layout: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        return new ControllerLayout(data);
    }
}