/*:
 * @target MZ
 * @plugindesc Tauriでツクールを動かすのにいろいろ便利な機能を追加
 * @author Furamon
 *
 * @help Tauriでツクールを動かすのにいろいろ便利な機能を追加します。
 *
 * 現在の機能:
 * - F4 or Alt + Enterキーでフルスクリーンを切り替える
 * - オプション画面から画面サイズを変更(Thanks to NRP_GameWindowSize!)
 *
 * @--- Plugin Parameters ---
 *
 * @param <FullScreen>
 * @text フルスクリーン設定
 *
 * @param Fullscreen Key
 * @text フルスクリーンキー
 * @parent <FullScreen>
 * @type string
 * @desc フルスクリーンにするキー
 * @default F4
 *
 * @param <WindowSize>
 * @text ウィンドウサイズ設定
 *
 * @param optionPosition
 * @text オプション位置
 * @parent <WindowSize>
 * @type number
 * @default 2
 * @desc オプション画面の表示位置 Deleteで項目削除
 *
 * @param optionName
 * @text オプション名
 * @parent <WindowSize>
 * @type string
 * @default ウィンドウサイズ
 * @desc オプション画面での表示名
 *
 */

(function () {
  const pluginName = "Furamon_TauriforMZ";

  const parameters = PluginManager.parameters(pluginName);
  // フルスクリーン
  const fullscreenKey = parameters["Fullscreen Key"] || "F4";
  // ウィンドウサイズ
  const optionPosition = Number(parameters["optionPosition"] || 2);
  const optionName = parameters["optionName"] || "ウィンドウサイズ";

  const TAURI_WINDOW_SIZE_SYMBOL = "tauriWindowSize";

  let tauri: any; // Tauriが利用可能かどうか
  let emit:any; // Tauriのemit関数
  let platform: string; // Tauriを動かしているOSを取得

  // NW.jsの場合はここで終了
  if (Utils.isNwjs()) {
    console.log("This is NW.js. Aborted.");
    return;
  }

  // Tauriの初期化を待つPromise
  const tauriReady = new Promise<void>((resolve) => {
    const checkTauri = function () {
      if (window.__TAURI__) {
        // Tauri が利用可能な場合の処理
        tauri = window.__TAURI__;
        emit = tauri.event.emit;
        platform = tauri.os.platform(); // OS取得
        resolve(); // Promiseをresolve
      } else {
        // Tauriがまだ利用できない場合は、少し待って再試行
        setTimeout(checkTauri, 50); // 50msごとにチェック
      }
    };
    checkTauri(); // 初回チェック
  });

  // 初期ウィンドウサイズ変更処理
  async function applyInitialWindowSize() {
    try {
      await Promise.race([
        tauriReady,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Tauri initialization timeout")),
            5000
          )
        ),
      ]); // Tauriの初期化を待つ, 5秒タイムアウト
      DataManager.loadGlobalInfo();
      if (platform !== "android" && platform !== "ios") {
        changeWindowSize();
      }
    } catch (error) {
      console.error("Failed to initialize Tauri or load window size:", error);
    }
  }

  // 起動時
  const _Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function () {
    _Scene_Boot_start.apply(this, []);
    applyInitialWindowSize(); // Tauriが初期化されていればウィンドウサイズを変更
  };

  /**
   * ウィンドウリサイズ時のCanvas調整
   */

  const _Graphics_updateCanvas = Graphics._updateCanvas;
  Graphics._updateCanvas = function () {
    _Graphics_updateCanvas.call(this);
    if (tauri) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      const targetAspect = 16 / 9;
      let targetWidth, targetHeight;
      if (aspect >= targetAspect) {
        targetWidth = height * targetAspect;
        targetHeight = height;
      } else {
        targetWidth = width;
        targetHeight = width / targetAspect;
      }

      this._canvas!.style.width = `${targetWidth}px`;
      this._canvas!.style.height = `${targetHeight}px`;
      this._canvas!.style.imageRendering = "pixelated";

      // クリック座標のずれを解決
      this._realScale = targetWidth / this._width;
    }
  };

  // リサイズ時のCanvas調整
  const _Graphics_onWindowResize = Graphics._onWindowResize;
  Graphics._onWindowResize = function () {
    _Graphics_onWindowResize.call(this);
    if (tauri) {
      this._updateCanvas();
    }
  };

  /**
   * ブラウザ検索は不要なので無効化
   */

  document.addEventListener("keydown", (event) => {
    if (event.key === "F3") {
      event.preventDefault();
    }
  });

  /**
   * F4 or Alt + Enterキーでフルスクリーンを切り替える
   */

  // フルスクリーン切り替え
  document.addEventListener("keydown", (event) => {
    if (event.key === fullscreenKey) {
      // "toggle_fullscreen" イベントを Tauri に送信
      emit("toggle_fullscreen");
    }
  });

  /**
   * オプション画面から画面サイズを変更
   */

  // ウィンドウサイズ初期選択ナンバー
  ConfigManager.tauriWindowSize = 1;

  // 項目生成
  const _ConfigManager_makeData = ConfigManager.makeData;
  ConfigManager.makeData = function () {
    const config = _ConfigManager_makeData.apply(this, []);

    config.tauriWindowSize = this.tauriWindowSize;
    return config;
  };

  const _ConfigManager_applyData = ConfigManager.applyData;
  ConfigManager.applyData = function (config) {
    _ConfigManager_applyData.apply(this, [config]);
    this.tauriWindowSize = this.readTauriWindowSize(
      config,
    );
  };

  // ウィンドウサイズ選択ナンバーをコンフィグから読込
  ConfigManager.readTauriWindowSize = function (config) {
    const value = config.tauriWindowSize;
    if (value != null) {
      return Number(value).clamp(1, 4);
    } else {
      return 1;
    }
  };

  // 表示状態
  var _Window_Options_statusText = Window_Options.prototype.statusText;
  Window_Options.prototype.statusText = function (index: number) {
    const symbol = this.commandSymbol(index);
    const value = this.getConfigValue(symbol);
    if (symbol === TAURI_WINDOW_SIZE_SYMBOL) {
      return currentWindowSizeText(value);
    }
    return _Window_Options_statusText.apply(this, [index]);
  };

  // 表示名
  function currentWindowSizeText(value:number) {
    // ハードコーディングでゴリ押す。
    // どのみちTauriの仕様上プラグインパラメータから選ばせるような実装は難しい
    if (tauri) {
      if (value === 1) {
        return "1280x720";
      } else if (value === 2) {
        return "1600x900";
      } else if (value === 3) {
        return "1920x1080";
      } else if (value === 4) {
        return "2560x1440";
      }
    }
    return "Error!";
  }

  // カーソル右
  const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
  Window_Options.prototype.cursorRight = function () {
    const index = this.index();
    const symbol = this.commandSymbol(index);
    let value = this.getConfigValue(symbol);
    if (tauri) {
      if (symbol === TAURI_WINDOW_SIZE_SYMBOL) {
        value += 1;
        if (value > 4) {
          value = 1;
        }
        this.changeWindowSizeValue(TAURI_WINDOW_SIZE_SYMBOL, value);
        return;
      }
    }
    _Window_Options_cursorRight.apply(this, []);
  };

  // カーソル左
  const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
  Window_Options.prototype.cursorLeft = function () {
    const index = this.index();
    const symbol = this.commandSymbol(index);
    let value = this.getConfigValue(symbol);
    if (tauri) {
      if (symbol === TAURI_WINDOW_SIZE_SYMBOL) {
        value -= 1;
        if (value < 1) {
          value = 4;
        }
        this.changeWindowSizeValue(TAURI_WINDOW_SIZE_SYMBOL, value);
        return;
      }
    }
    _Window_Options_cursorLeft.apply(this, []);
  };

  // 決定ボタン
  const _Window_Options_processOk = Window_Options.prototype.processOk;
  Window_Options.prototype.processOk = function () {
    const index = this.index();
    const symbol = this.commandSymbol(index);
    let value = this.getConfigValue(symbol);
    if (tauri) {
      if (symbol === TAURI_WINDOW_SIZE_SYMBOL) {
        value += 1;
        if (value > 4) {
          value = 1;
        }
        this.changeWindowSizeValue(TAURI_WINDOW_SIZE_SYMBOL, value);
        return;
      }
    }
    _Window_Options_processOk.apply(this, []);
  };

  // 項目に応じてウィンドウサイズを変更
  Window_Options.prototype.changeWindowSizeValue = function (symbol, value) {
    value = value.clamp(1, 4);
    this.changeValue(symbol, value);
    this._noTouchSelect = true; // ウィンドウサイズ変更で選択状態が変わらないようタッチ選択禁止
  };

  // こっちでもタッチ選択禁止
  const _Window_Options_onTouchSelect = Window_Options.prototype.onTouchSelect;
  Window_Options.prototype.onTouchSelect = function (trigger) {
    this._noTouchSelect = true;
    _Window_Options_onTouchSelect.apply(this, [trigger]);
  };

  // ウィンドウサイズ項目追加
  const _Window_Options_makeCommandList =
    Window_Options.prototype.makeCommandList;
  Window_Options.prototype.makeCommandList = function () {
    _Window_Options_makeCommandList.apply(this, []);

    this._list.splice(optionPosition, 0, {
      name: optionName,
      symbol: TAURI_WINDOW_SIZE_SYMBOL,
      enabled: true,
      ext: null,
    });
    // Mano_InputConfig.jsとの競合対処
    if (this._gamepadOptionIndex >= optionPosition) {
      this._gamepadOptionIndex += 1;
    }
    if (this._keyboardConfigIndex >= optionPosition) {
      this._keyboardConfigIndex += 1;
    }
  };

  // 設定値反映
  const _Window_Options_setConfigValue =
    Window_Options.prototype.setConfigValue;
  Window_Options.prototype.setConfigValue = function (symbol, volume) {
    _Window_Options_setConfigValue.apply(this, [symbol, volume]);

    if (symbol === TAURI_WINDOW_SIZE_SYMBOL) {
      // ウィンドウサイズを反映
      changeWindowSize();
    }
  };

  // ウィンドウサイズ変更
  // 項目に応じてlib.rsを発火させる
  function changeWindowSize() {
    const value = ConfigManager.tauriWindowSize;
    if (value === 1) {
      emit("resize_window", 1);
    } else if (value === 2) {
      emit("resize_window", 2);
    } else if (value === 3) {
      emit("resize_window", 3);
    } else if (value === 4) {
      emit("resize_window", 4);
    }

    Graphics._updateCanvas(); // ここでも念の為Canvasをリサイズ
  }

  // コマンド数加算
  const _Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
  Scene_Options.prototype.maxCommands = function () {
    return _Scene_Options_maxCommands.apply(this, []) + 1;
  };
})();
