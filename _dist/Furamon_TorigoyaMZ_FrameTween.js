/*:
 * @target MZ
 * @plugindesc [Torigoya_FrameTween] ウィンドウに汎用的なトゥイーンアニメーションを追加します。
 * @author Furamon
 * @base TorigoyaMZ_FrameTween
 * @orderAfter TorigoyaMZ_FrameTween
 *
 * @help
 * TorigoyaMZ_FrameTween.js をベースに、各シーンのウィンドウが開閉する際に
 * トゥイーンアニメーションを再生します。
 *
 * このプラグインは、ウィンドウがシーンに追加されたときに開くアニメーションを、
 * シーンが閉じられるときに閉じるアニメーションを再生します。
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
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param CustomTween
 * @text カスタム対象
 * @desc 汎用的なトゥイーン設定です。ウィンドウのクラス名をキーにアニメーションを設定します。
 * @type struct<CustomTween>[]
 * @default ["{\"WindowClass\":\"Window_MenuStatus\",\"openEnable\":\"true\",\"openMoveX\":\"100%\",\"openMoveY\":\"0\",\"openAlpha\":\"0\",\"openEasing\":\"easeOutCircular\",\"openDuration\":\"15\",\"openDelay\":\"0\",\"closeEnable\":\"true\",\"closeMoveX\":\"-100%\",\"closeMoveY\":\"0\",\"closeAlpha\":\"0\",\"closeEasing\":\"easeInCircular\",\"closeDuration\":\"15\",\"closeDelay\":\"0\"}"]
 */
/*~struct~CustomTween:
 * @param WindowClass
 * @text ウィンドウクラス名
 * @desc 対象のウィンドウのクラス名（コンストラクタ名）を指定します。例: Window_Help
 * @type string
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
    'use strict';
    if (!Torigoya || !Torigoya.FrameTween) {
        const error = '「[鳥小屋.txt ベースプラグイン] Tweenアニメーション」が見つかりません。';
        console.error(error);
        alert(error);
        return;
    }
    const PLUGIN_NAME = 'Furamon_TorigoyaMZ_FrameTween';
    const params = PluginManager.parameters(PLUGIN_NAME);
    const customTweenParams = JSON.parse(params.CustomTween || '[]');
    const parsedCustomSettings = customTweenParams.map((json) => {
        const obj = JSON.parse(json);
        return {
            windowClass: String(obj.WindowClass),
            openSetting: {
                enable: obj.openEnable === 'true',
                moveX: obj.openMoveX || '0',
                moveY: obj.openMoveY || '0',
                alpha: Number(obj.openAlpha || 0),
                easing: Torigoya.FrameTween.Easing[obj.openEasing] || Torigoya.FrameTween.Easing.linear,
                duration: Number(obj.openDuration || 15),
                delay: Number(obj.openDelay || 0),
            },
            closeSetting: {
                enable: obj.closeEnable === 'true',
                moveX: obj.closeMoveX || '0',
                moveY: obj.closeMoveY || '0',
                alpha: Number(obj.closeAlpha || 0),
                easing: Torigoya.FrameTween.Easing[obj.closeEasing] || Torigoya.FrameTween.Easing.linear,
                duration: Number(obj.closeDuration || 15),
                delay: Number(obj.closeDelay || 0),
            },
        };
    });
    function findSettingForWindow(windowObject) {
        if (!windowObject)
            return null;
        const className = windowObject.constructor.name;
        const customSetting = parsedCustomSettings.find(s => s.windowClass === className);
        return customSetting ? { openSetting: customSetting.openSetting, closeSetting: customSetting.closeSetting } : null;
    }
    // -------------------------------------------------------------------------
    // TweenManager
    const TweenManager = {
        applyOpen(windowObject, setting) {
            if (!setting || !setting.enable || !windowObject)
                return;
            const moveX = this.parseMoveValue(setting.moveX, windowObject, windowObject.width);
            const moveY = this.parseMoveValue(setting.moveY, windowObject, windowObject.height);
            const finishParams = {};
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
            if (Object.keys(finishParams).length === 0)
                return;
            Torigoya.FrameTween.create(windowObject)
                .wait(setting.delay)
                .to(finishParams, setting.duration, setting.easing)
                .start();
        },
        applyClose(windowObject, setting) {
            if (!setting || !setting.enable || !windowObject)
                return null;
            const moveX = this.parseMoveValue(setting.moveX, windowObject, windowObject.width);
            const moveY = this.parseMoveValue(setting.moveY, windowObject, windowObject.height);
            const finishParams = {};
            if (moveX !== 0) {
                finishParams.x = windowObject.x + moveX;
            }
            if (moveY !== 0) {
                finishParams.y = windowObject.y + moveY;
            }
            if (setting.alpha !== windowObject.opacity) {
                finishParams.opacity = setting.alpha;
            }
            if (Object.keys(finishParams).length === 0)
                return null;
            return Torigoya.FrameTween.create(windowObject)
                .wait(setting.delay)
                .to(finishParams, setting.duration, setting.easing);
        },
        parseMoveValue(value, windowObject, baseValue) {
            if (!value)
                return 0;
            if (value.includes('%')) {
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
                if (typeof result === 'number' && !isNaN(result)) {
                    return result;
                }
            }
            catch (e) {
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
        const settings = findSettingForWindow(windowObject);
        if (settings) {
            this._tweenableWindows.push({ window: windowObject, setting: settings });
            TweenManager.applyOpen(windowObject, settings.openSetting);
        }
        _Scene_Base_addWindow.call(this, windowObject);
    };
    const _Scene_Base_popScene = Scene_Base.prototype.popScene;
    Scene_Base.prototype.popScene = function () {
        if (this._isPoppingWithTween)
            return;
        if (this._tweenableWindows && this._tweenableWindows.length > 0) {
            const tweens = this._tweenableWindows
                .filter(w => w && w.window)
                .map(w => TweenManager.applyClose(w.window, w.setting.closeSetting))
                .filter((tween) => !!tween);
            if (tweens.length > 0) {
                this._isPoppingWithTween = true;
                const lastTween = tweens.sort((a, b) => {
                    const durationA = a.stacks.reduce((acc, s) => acc + (s.duration || 0) + (s.delay || 0), 0);
                    const durationB = b.stacks.reduce((acc, s) => acc + (s.duration || 0) + (s.delay || 0), 0);
                    return durationB - durationA;
                })[0];
                lastTween.call(() => _Scene_Base_popScene.call(this)).start();
                tweens.forEach(tween => {
                    if (tween !== lastTween)
                        tween.start();
                });
            }
            else {
                _Scene_Base_popScene.call(this);
            }
        }
        else {
            _Scene_Base_popScene.call(this);
        }
    };
})();
