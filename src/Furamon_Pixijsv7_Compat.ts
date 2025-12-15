(() => {
  type RendererLike = {
    plugins?: Record<string | number, unknown>;
  };

  type PluginConstructor = new (renderer: RendererLike) => unknown;

  const registeredPlugins = new Map<string | number, PluginConstructor>();
  const activeRenderers = new Set<RendererLike>();

  const installPlugin = (
    renderer: RendererLike,
    name: string | number,
    PluginClass: PluginConstructor,
  ) => {
    if (!name || typeof PluginClass !== "function") {
      return;
    }
    const plugins = renderer.plugins || (renderer.plugins = {});
    if (plugins[name]) {
      return;
    }
    try {
      plugins[name] = new PluginClass(renderer);
    } catch (error) {
      console.warn(
        "PixiJS v7 registerPlugin compat failed to instantiate plugin",
        name,
        error,
      );
    }
  };

  const installAllPlugins = (renderer: RendererLike) => {
    for (const [name, PluginClass] of registeredPlugins) {
      installPlugin(renderer, name, PluginClass);
    }
  };

  const registerPluginCompat = (
    name: string | number,
    PluginClass: PluginConstructor,
  ) => {
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
    if (
      (
        OriginalRenderer as typeof OriginalRenderer & {
          __pixi7CompatRegisterPlugin?: boolean;
        }
      ).__pixi7CompatRegisterPlugin
    ) {
      return true;
    }

    if (!OriginalRenderer.registerPlugin) {
      OriginalRenderer.registerPlugin = registerPluginCompat;
    }

    type RendererInstance = InstanceType<typeof OriginalRenderer>;

    class CompatRenderer extends OriginalRenderer {
      constructor(...args: ConstructorParameters<typeof OriginalRenderer>) {
        super(...args);
        const renderer = this as RendererLike;
        installAllPlugins(renderer);
        activeRenderers.add(renderer);
      }

      destroy(...args: Parameters<RendererInstance["destroy"]>) {
        try {
          return super.destroy(...args);
        } finally {
          activeRenderers.delete(this as RendererLike);
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
    } else {
      setTimeout(scheduleCompat, 16);
    }
  };

  let pixiValue: typeof window.PIXI = window.PIXI;
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
  } else {
    tryApplyWithCurrentPixi();
  }

  if (!compatInstalled && tryApplyWithCurrentPixi()) {
    compatInstalled = true;
  }

  scheduleCompat();
})();
