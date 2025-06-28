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
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param CustomTween
 * @text カスタム対象
 * @desc 汎用的なトゥイーン設定です。ウィンドウのクラス名をキーにアニメーションを設定します。
 * @type struct<CustomTween>[]
 * @default ["{\"WindowClass\":\"Window_MenuStatus\",\"enable\":\"true\",\"moveX\":\"100%\",\"moveY\":\"\\\"0\\\"\",\"alpha\":\"0\",\"easing\":\"easeOutCircular\",\"duration\":\"15\",\"delay\":\"0\"}"]
 */
/*~struct~CustomTween:
 * @param WindowClass
 * @text ウィンドウクラス名
 * @desc 対象のウィンドウのクラス名（コンストラクタ名）を指定します。例: Window_Help
 * @type string
 *
 * @param enable
 * @text アニメーションを有効にする
 * @type boolean
 * @default true
 *
 * @param moveX
 * @text X方向の移動量
 * @desc ピクセルを入力して移動量を指定します。
 * @type string
 * @default 0
 *
 * @param moveY
 * @text Y方向の移動量
 * @desc ピクセルを入力して移動量を指定します。
 * @type string
 * @default 0
 *
 * @param alpha
 * @text 開始時の透明度
 * @desc 0(透明) から 255(不透明)で指定します。
 * @type number
 * @min 0
 * @max 255
 * @default 0
 *
 * @param easing
 * @text イージング
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
 * @param duration
 * @text 時間（フレーム）
 * @type number
 * @min 1
 * @default 15
 *
 * @param delay
 * @text 遅延（フレーム）
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
            setting: {
                enable: obj.enable === 'true',
                moveX: obj.moveX || 0,
                moveY: obj.moveY || 0,
                alpha: Number(obj.alpha || 0),
                easing: Torigoya.FrameTween.Easing[obj.easing] || Torigoya.FrameTween.Easing.linear,
                duration: Number(obj.duration || 15),
                delay: Number(obj.delay || 0),
            },
        };
    });
    function findSettingForWindow(windowObject) {
        if (!windowObject)
            return null;
        const className = windowObject.constructor.name;
        const customSetting = parsedCustomSettings.find(s => s.windowClass === className);
        return customSetting ? customSetting.setting : null;
    }
    // -------------------------------------------------------------------------
    // TweenManager
    const TweenManager = {
        applyOpen(windowObject, setting) {
            if (!setting || !setting.enable || !windowObject)
                return;
            const moveX = this.parseMoveValue(setting.moveX, windowObject.width);
            const moveY = this.parseMoveValue(setting.moveY, windowObject.height);
            const finishParams = {};
            if (moveX !== 0) {
                windowObject.x += moveX;
                finishParams.x = windowObject.x - moveX;
            }
            if (moveY !== 0) {
                windowObject.y += moveY;
                finishParams.y = windowObject.y - moveY;
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
            const moveX = this.parseMoveValue(setting.moveX, windowObject.width);
            const moveY = this.parseMoveValue(setting.moveY, windowObject.height);
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
        parseMoveValue(value, baseValue) {
            if (value.includes('%')) {
                const percentage = Number(value.replace('%', '')) / 100;
                return baseValue * percentage;
            }
            return Number(value.replace('px', ''));
        },
    };
    // -------------------------------------------------------------------------
    // 各シーンへの適用
    const _Scene_Base_initialize = Scene_Base.prototype.initialize;
    Scene_Base.prototype.initialize = function () {
        _Scene_Base_initialize.apply(this, arguments);
        this._tweenableWindows = [];
        this._isPoppingWithTween = false;
    };
    const _Scene_Base_addWindow = Scene_Base.prototype.addWindow;
    Scene_Base.prototype.addWindow = function (windowObject) {
        _Scene_Base_addWindow.apply(this, arguments);
        const setting = findSettingForWindow(windowObject);
        if (setting) {
            this._tweenableWindows.push({ window: windowObject, setting: setting });
            TweenManager.applyOpen(windowObject, setting);
        }
    };
    const _Scene_Base_popScene = Scene_Base.prototype.popScene;
    Scene_Base.prototype.popScene = function () {
        if (this._isPoppingWithTween)
            return;
        if (this._tweenableWindows && this._tweenableWindows.length > 0) {
            const tweens = this._tweenableWindows
                .map(w => TweenManager.applyClose(w.window, w.setting))
                .filter((tween) => !!tween);
            if (tweens.length > 0) {
                this._isPoppingWithTween = true;
                const lastTween = tweens.sort((a, b) => {
                    const durationA = (a.stacks[0]?.duration || 0) + (a.stacks[0]?.delay || 0);
                    const durationB = (b.stacks[0]?.duration || 0) + (b.stacks[0]?.delay || 0);
                    return durationB - durationA;
                })[0];
                lastTween.call(() => _Scene_Base_popScene.call(this)).start();
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
