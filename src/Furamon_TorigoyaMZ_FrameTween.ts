//------------------------------------------------------------------------------
// Furamon_TorigoyaMZ_FrameTween.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/29 1.0.0 公開！

/*:
 * @target MZ
 * @plugindesc Torigoya_FrameTweenをパラメータ指定して扱えるようにします。
 * @author Furamon
 * @base TorigoyaMZ_FrameTween
 * @orderAfter TorigoyaMZ_FrameTween
 *
 * @help Torigoya_FrameTween(https://torigoya-plugin.rutan.dev/base/tween/)を
 * パラメータ指定して扱えるようにします。
 * ウィンドウクラスを指定してトゥイーンアニメーションを再生します。
 * ウィンドウがシーンに追加されたときとアニメーションを、
 * シーンが閉じられるときのアニメーションを指定できます。
 *
 * どのウィンドウにどのアニメーションを適用するかは、プラグインパラメータ
 * 「カスタム対象」で設定します。
 *
 * パラメータの「X方向の移動量」「Y方向の移動量」では、
 * 数値や割合(%)の他に、簡単なJavaScriptの式を使用できます。
 *
 * 例:
 *   -100%       ... ウィンドウの幅/高さの分だけ移動
 *   50          ... 50ピクセル移動
 *   window.width / 2 ... ウィンドウの幅の半分だけ移動
 *   Graphics.boxWidth - window.width ... 画面右端に寄せる
 *
 * 使用できる変数:
 *   window, w: 対象のウィンドウオブジェクト
 *   width, height: 対象ウィンドウの幅・高さ
 *   Graphics, g: Graphicsクラス
 *   boxWidth, boxHeight: ゲーム画面の幅・高さ
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * 以下のプラグインをベースにしています。m（＿ ＿）m ﾏｲﾄﾞ
 * - Ruたん様 ー Tweenアニメーション
 * (https://torigoya-plugin.rutan.dev/base/tween/)
 *
 * Geminiの力を盛大に借りました。
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param CustomTween
 * @text カスタム対象
 * @desc 汎用的なトゥイーン設定です。ウィンドウのクラス名をキーにアニメーションを設定します。
 * @type struct<CustomTween>[]
 * @default ["{\"WindowClass\":\"Window_MenuStatus\",\"SceneClass\":\"\",\"openEnable\":\"true\",\"openMoveX\":\"100%\",\"openMoveY\":\"0\",\"openAlpha\":\"0\",\"openEasing\":\"easeOutCircular\",\"openDuration\":\"15\",\"openDelay\":\"0\",\"closeEnable\":\"true\",\"closeMoveX\":\"-100%\",\"closeMoveY\":\"0\",\"closeAlpha\":\"0\",\"closeEasing\":\"easeInCircular\",\"closeDuration\":\"15\",\"closeDelay\":\"0\"}","{\"WindowClass\":\"Window_Help\",\"SceneClass\":\"Scene_Menu\",\"openEnable\":\"true\",\"openMoveX\":\"0\",\"openMoveY\":\"-100%\",\"openAlpha\":\"0\",\"openEasing\":\"easeOutCircular\",\"openDuration\":\"15\",\"openDelay\":\"0\",\"closeEnable\":\"true\",\"closeMoveX\":\"0\",\"closeMoveY\":\"-100%\",\"closeAlpha\":\"0\",\"closeEasing\":\"easeInCircular\",\"closeDuration\":\"15\",\"closeDelay\":\"0\"}"]
 */

/*~struct~CustomTween:
 * @param WindowClass
 * @text ウィンドウクラス名
 * @desc 対象のウィンドウのクラス名（コンストラクタ名）を指定します。例: Window_Help
 * @type string
 *
 * @param SceneClass
 * @text シーンクラス名
 * @desc 対象のシーンのクラス名を指定します。空欄の場合は全てのシーンが対象です。例: Scene_Menu
 * @type string
 * @default
 *
 * @param openEnable
 * @text 開くアニメーションを有効にする
 * @type boolean
 * @default true
 *
 * @param openMoveX
 * @text [開く] X方向の移動量
 * @desc ウィンドウの幅に対する割合(%)やピクセル、式で指定。例: -100%, 50, window.width / 2
 * @type string
 * @default 0
 *
 * @param openMoveY
 * @text [開く] Y方向の移動量
 * @desc ウィンドウの高さに対する割合(%)やピクセル、式で指定。例: 100%, -50, -window.height
 * @type string
 * @default 0
 *
 * @param openAlpha
 * @text [開く] 開始時の透明度
 * @desc 0(透明) から 255(不透明)で指定します。
 * @type number
 * @min 0
 * @max 255
 * @default 0
 *
 * @param openEasing
 * @text [開く] イージング
 * @desc アニメーションの変化の仕方を指定します。
 * @type select
 * @option linear
 * @option easeInSine
 * @option easeOutSine
 * @option easeInOutSine
 * @option easeInQuad
 * @option easeOutQuad
 * @option easeInOutQuad
 * @option easeInCubic
 * @option easeOutCubic
 * @option easeInOutCubic
 * @option easeInCircular
 * @option easeOutCircular
 * @option easeInOutCircular
 * @default easeOutCircular
 *
 * @param openDuration
 * @text [開く] 時間（フレーム）
 * @type number
 * @min 1
 * @default 15
 *
 * @param openDelay
 * @text [開く] 遅延（フレーム）
 * @type number
 * @min 0
 * @default 0
 *
 * @param closeEnable
 * @text 閉じるアニメーションを有効にする
 * @type boolean
 * @default true
 *
 * @param closeMoveX
 * @text [閉じる] X方向の移動量
 * @desc ウィンドウの幅に対する割合(%)やピクセル、式で指定。例: -100%, 50, window.width / 2
 * @type string
 * @default 0
 *
 * @param closeMoveY
 * @text [閉じる] Y方向の移動量
 * @desc ウィンドウの高さに対する割合(%)やピクセル、式で指定。例: 100%, -50, -window.height
 * @type string
 * @default 0
 *
 * @param closeAlpha
 * @text [閉じる] 終了時の透明度
 * @desc 0(透明) から 255(不透明)で指定します。
 * @type number
 * @min 0
 * @max 255
 * @default 0
 *
 * @param closeEasing
 * @text [閉じる] イージング
 * @desc アニメーションの変化の仕方を指定します。
 * @type select
 * @option linear
 * @option easeInSine
 * @option easeOutSine
 * @option easeInOutSine
 * @option easeInQuad
 * @option easeOutQuad
 * @option easeInOutQuad
 * @option easeInCubic
 * @option easeOutCubic
 * @option easeInOutCubic
 * @option easeInCircular
 * @option easeOutCircular
 * @option easeInOutCircular
 * @default easeInCircular
 *
 * @param closeDuration
 * @text [閉じる] 時間（フレーム）
 * @type number
 * @min 1
 * @default 15
 *
 * @param closeDelay
 * @text [閉じる] 遅延（フレーム）
 * @type number
 * @min 0
 * @default 0
 */

(() => {
  if (!Torigoya || !Torigoya.FrameTween) {
    const error =
      "「[鳥小屋.txt ベースプラグイン] Tweenアニメーション」が見つかりません。";
    console.error(error);
    alert(error);
    return;
  }

  const PLUGIN_NAME = "Furamon_TorigoyaMZ_FrameTween";
  const params = PluginManager.parameters(PLUGIN_NAME);

  const customTweenParams = JSON.parse(params.CustomTween || "[]") as string[];
  const parsedCustomSettings = customTweenParams.map((json: string) => {
    const obj = JSON.parse(json);
    return {
      windowClass: String(obj.WindowClass),
      sceneClass: String(obj.SceneClass || ""),
      openSetting: {
        enable: obj.openEnable === "true",
        moveX: obj.openMoveX || "0",
        moveY: obj.openMoveY || "0",
        alpha: Number(obj.openAlpha || 0),
        easing:
          Torigoya.FrameTween.Easing[obj.openEasing] ||
          Torigoya.FrameTween.Easing.linear,
        duration: Number(obj.openDuration || 15),
        delay: Number(obj.openDelay || 0),
      },
      closeSetting: {
        enable: obj.closeEnable === "true",
        moveX: obj.closeMoveX || "0",
        moveY: obj.closeMoveY || "0",
        alpha: Number(obj.closeAlpha || 0),
        easing:
          Torigoya.FrameTween.Easing[obj.closeEasing] ||
          Torigoya.FrameTween.Easing.linear,
        duration: Number(obj.closeDuration || 15),
        delay: Number(obj.closeDelay || 0),
      },
    };
  });

  function findSettingForWindow(windowObject: WindowLike) {
    if (!windowObject) return null;
    const windowClassName = (windowObject.constructor as any).name;
    const sceneClassName = ((SceneManager._scene?.constructor as any)?.name ??
      "") as string;

    const customSetting = parsedCustomSettings.find((s) => {
      if (s.windowClass !== windowClassName) return false;
      if (s.sceneClass && s.sceneClass !== sceneClassName) return false;
      return true;
    });

    return customSetting
      ? {
          openSetting: customSetting.openSetting,
          closeSetting: customSetting.closeSetting,
        }
      : null;
  }

  // -------------------------------------------------------------------------
  // TweenManager

  const TweenManager = {
    applyOpen(windowObject: WindowLike, setting: TweenSetting | null): void {
      if (!setting || !setting.enable || !windowObject) return;

      const moveX = this.parseMoveValue(
        setting.moveX,
        windowObject,
        windowObject.width,
      );
      const moveY = this.parseMoveValue(
        setting.moveY,
        windowObject,
        windowObject.height,
      );

      const finishParams: { [key: string]: number } = {};

      if (moveX !== 0) {
        windowObject.x -= moveX;
        finishParams.x = windowObject.x + moveX;
      }
      if (moveY !== 0) {
        windowObject.y -= moveY;
        finishParams.y = windowObject.y + moveY;
      }
      if (setting.alpha !== windowObject.opacity) {
        finishParams.opacity = windowObject.opacity;
        windowObject.opacity = setting.alpha;
      }

      if (Object.keys(finishParams).length === 0) return;

      Torigoya.FrameTween.create(windowObject)
        .wait(setting.delay)
        .to(finishParams, setting.duration, setting.easing)
        .start();
    },

    applyClose(
      windowObject: WindowLike,
      setting: TweenSetting | null,
    ): TorigoyaTween | null {
      if (!setting || !setting.enable || !windowObject) return null;

      const moveX = this.parseMoveValue(
        setting.moveX,
        windowObject,
        windowObject.width,
      );
      const moveY = this.parseMoveValue(
        setting.moveY,
        windowObject,
        windowObject.height,
      );

      const finishParams: { [key: string]: number } = {};

      if (moveX !== 0) {
        finishParams.x = windowObject.x + moveX;
      }
      if (moveY !== 0) {
        finishParams.y = windowObject.y + moveY;
      }
      if (setting.alpha !== windowObject.opacity) {
        finishParams.opacity = setting.alpha;
      }

      if (Object.keys(finishParams).length === 0) return null;

      return Torigoya.FrameTween.create(windowObject)
        .wait(setting.delay)
        .to(finishParams, setting.duration, setting.easing);
    },

    parseMoveValue(
      value: string,
      windowObject: WindowLike,
      baseValue: number,
    ): number {
      if (!value) return 0;

      if (value.includes("%")) {
        const percentage = parseFloat(value) / 100;
        return baseValue * percentage;
      }

      try {
        const scope = {
          window: windowObject,
          w: windowObject,
          width: windowObject.width,
          height: windowObject.height,
          Graphics: Graphics,
          g: Graphics,
          boxWidth: Graphics.boxWidth,
          boxHeight: Graphics.boxHeight,
        };
        const func = new Function(...Object.keys(scope), `return (${value})`);
        const result = func(...Object.values(scope));
        if (typeof result === "number" && !Number.isNaN(result)) {
          return result;
        }
      } catch (_e) {
        // Not a valid expression, fall back to simple parsing.
      }

      return parseFloat(value);
    },
  };

  // -------------------------------------------------------------------------
  // 各シーンへの適用

  const _Scene_Base_initialize = Scene_Base.prototype.initialize;
  Scene_Base.prototype.initialize = function () {
    _Scene_Base_initialize.call(this);
    this._tweenableWindows = [];
    this._isPoppingWithTween = false;
  };

  const _Scene_Base_addWindow = Scene_Base.prototype.addWindow;
  Scene_Base.prototype.addWindow = function (windowObject) {
    const settings = findSettingForWindow(windowObject as WindowLike);
    if (settings) {
      this._tweenableWindows.push({ window: windowObject, setting: settings });
      TweenManager.applyOpen(windowObject as WindowLike, settings.openSetting);
    }
    _Scene_Base_addWindow.call(this, windowObject);
  };

  const _Scene_Base_popScene = Scene_Base.prototype.popScene;
  Scene_Base.prototype.popScene = function () {
    if (this._isPoppingWithTween) return;

    if (this._tweenableWindows && this._tweenableWindows.length > 0) {
      const tweens = this._tweenableWindows
        .filter((w) => w?.window)
        .map((w) => TweenManager.applyClose(w.window, w.setting.closeSetting))
        .filter((tween): tween is TorigoyaTween => !!tween);

      if (tweens.length > 0) {
        this._isPoppingWithTween = true;
        const lastTween = tweens.sort((a, b) => {
          const durationA = a.stacks.reduce(
            (acc, s) => acc + (s.duration || 0) + (s.delay || 0),
            0,
          );
          const durationB = b.stacks.reduce(
            (acc, s) => acc + (s.duration || 0) + (s.delay || 0),
            0,
          );
          return durationB - durationA;
        })[0];
        lastTween.call(() => _Scene_Base_popScene.call(this)).start();
        tweens.forEach((tween) => {
          if (tween !== lastTween) tween.start();
        });
      } else {
        _Scene_Base_popScene.call(this);
      }
    } else {
      _Scene_Base_popScene.call(this);
    }
  };
})();
