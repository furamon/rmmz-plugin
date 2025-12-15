"use strict";
(() => {
    const registeredPlugins = new Map();
    const activeRenderers = new Set();
    const installPlugin = (renderer, name, PluginClass) => {
        if (!name || typeof PluginClass !== "function") {
            return;
        }
        const plugins = renderer.plugins || (renderer.plugins = {});
        if (plugins[name]) {
            return;
        }
        try {
            plugins[name] = new PluginClass(renderer);
        }
        catch (error) {
            console.warn("PixiJS v7 registerPlugin compat failed to instantiate plugin", name, error);
        }
    };
    const installAllPlugins = (renderer) => {
        for (const [name, PluginClass] of registeredPlugins) {
            installPlugin(renderer, name, PluginClass);
        }
    };
    const registerPluginCompat = (name, PluginClass) => {
        registeredPlugins.set(name, PluginClass);
        for (const renderer of activeRenderers) {
            installPlugin(renderer, name, PluginClass);
        }
    };
    const applyCompat = () => {
        const PIXI = window.PIXI;
        if (!PIXI) {
            return false;
        }
        const OriginalRenderer = PIXI.Renderer;
        if (!OriginalRenderer) {
            return false;
        }
        if (OriginalRenderer.__pixi7CompatRegisterPlugin) {
            return true;
        }
        if (!OriginalRenderer.registerPlugin) {
            OriginalRenderer.registerPlugin = registerPluginCompat;
        }
        class CompatRenderer extends OriginalRenderer {
            constructor(...args) {
                super(...args);
                const renderer = this;
                installAllPlugins(renderer);
                activeRenderers.add(renderer);
            }
            destroy(...args) {
                try {
                    return super.destroy(...args);
                }
                finally {
                    activeRenderers.delete(this);
                }
            }
            static registerPlugin = registerPluginCompat;
        }
        Object.defineProperty(CompatRenderer, "__pixi7CompatRegisterPlugin", {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false,
        });
        PIXI.Renderer = CompatRenderer;
        return true;
    };
    const scheduleCompat = () => {
        if (applyCompat()) {
            return;
        }
        if (typeof window.requestAnimationFrame === "function") {
            requestAnimationFrame(scheduleCompat);
        }
        else {
            setTimeout(scheduleCompat, 16);
        }
    };
    let pixiValue = window.PIXI;
    let compatInstalled = false;
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "PIXI");
    const restorePixiProperty = () => {
        Object.defineProperty(window, "PIXI", {
            value: pixiValue,
            enumerable: true,
            configurable: true,
            writable: true,
        });
    };
    const tryApplyWithCurrentPixi = () => {
        if (applyCompat()) {
            if (!compatInstalled) {
                compatInstalled = true;
            }
            if (!originalDescriptor || originalDescriptor.configurable) {
                restorePixiProperty();
            }
            return true;
        }
        return false;
    };
    if (!originalDescriptor || (originalDescriptor.configurable ?? true)) {
        Object.defineProperty(window, "PIXI", {
            configurable: true,
            enumerable: true,
            get: () => pixiValue,
            set(value) {
                pixiValue = value;
                if (!compatInstalled) {
                    tryApplyWithCurrentPixi();
                }
            },
        });
    }
    else {
        tryApplyWithCurrentPixi();
    }
    if (!compatInstalled && tryApplyWithCurrentPixi()) {
        compatInstalled = true;
    }
    scheduleCompat();
})();
