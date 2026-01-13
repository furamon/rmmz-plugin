"use strict";
//------------------------------------------------------------------------------
// Furamon_EnemyActorDynamicMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/17 1.0.0 公開！
// 2025/06/20 1.1.0 NRP_EnemyCollapse対応
// 2025/06/24 1.1.1 関数参照が抜けておりSVアクターを倒すとエラーで止まることがあるのを修正
// 2025/06/29 1.2.0 NRP_DynamicMotionMZとの連携を再実装
// 2025/08/22 1.3.0 複数のSVアクター画像を連結する機能を追加
/*:
 * @target MZ
 * @plugindesc 敵キャラのDynamicMotion対応パッチ
 * @author Furamon
 * @base Furamon_EnemyActorAnimation
 * @orderAfter Furamon_EnemyActorAnimation
 * @base NRP_DynamicMotionMZ
 * @orderAfter NRP_DynamicMotionMZ
 * @base NRP_EnemyCollapse
 * @orderAfter NRP_EnemyCollapse
 * @help SVアクター敵キャラをDynamicMotionに対応させます。
 *
 * 必須プラグイン:
 * - NRP_DynamicAnimationMZ
 * - NRP_DynamicMotionMZ
 * - Furamon_EnemyActorAnimation
 *
 * 連携プラグイン:
 * - NRP_EnemyCollapse (導入している場合、消滅演出を引き継ぎます)
 *
 * 使用順序：
 * 1. NRP_DynamicAnimationMZ
 * 2. NRP_DynamicMotionMZ
 * 3. NRP_EnemyCollapse (任意)
 * 4. Furamon_EnemyActorAnimation
 * 5. このプラグイン（Furamon_EnemyActorDynamicMotion）
 */
(() => {
    const PLUGIN_NAME = "Furamon_EnemyActorDynamicMotion";
    function asObject(value) {
        return value && typeof value === "object"
            ? value
            : null;
    }
    // 必須プラグインの存在確認
    if (!PluginManager._scripts.includes("NRP_DynamicMotionMZ")) {
        console.warn(`[${PLUGIN_NAME}] NRP_DynamicMotionMZ is not found.`);
        return;
    }
    if (!PluginManager._scripts.includes("Furamon_EnemyActorAnimation")) {
        console.warn(`[${PLUGIN_NAME}] Furamon_EnemyActorAnimation is not found.`);
        return;
    }
    const hasNrpCollapse = PluginManager._scripts.includes("NRP_EnemyCollapse");
    // SVアクター敵かどうかを判定する関数
    function isSvActorEnemy(battler) {
        if (!(battler instanceof Game_Enemy)) {
            return false;
        }
        const enemy = battler.enemy();
        return !!(enemy?.meta?.["SVActor"] || enemy?.meta?.["SVアクター"]);
    }
    /**
     * ● 動的モーションの実行
     */
    const _Sprite_Enemy_startDynamicMotion = Sprite_Enemy.prototype["startDynamicMotion"];
    Sprite_Enemy.prototype["startDynamicMotion"] = function (...args) {
        const dynamicMotion = args[0];
        if (isSvActorEnemy(this._battler) && this["_svActorSprite"]) {
            this["startDynamicSvMotion"](dynamicMotion);
            Sprite_Battler.prototype["startDynamicMotion"].call(this, dynamicMotion);
            return;
        }
        _Sprite_Enemy_startDynamicMotion.apply(this, args);
    };
    /**
     * ● SVキャラクターモーションの実行（敵版）
     */
    /**
     * ● SVキャラクターモーションの実行（敵版）
     */
    Sprite_Enemy.prototype["startDynamicSvMotion"] = function (dynamicMotion) {
        const dm = asObject(dynamicMotion);
        if (!isSvActorEnemy(this._battler) ||
            !this["_svActorSprite"] ||
            !dm ||
            typeof dm.motion !== "string") {
            return;
        }
        const svSprite = this["_svActorSprite"];
        svSprite._motionCount = 0;
        svSprite._pattern = 0;
        if (typeof dm.motionDuration === "number") {
            svSprite._motionDuration = dm.motionDuration;
        }
        if (typeof dm.motionPattern === "number") {
            svSprite._motionPattern = dm.motionPattern;
        }
        if (typeof dm.motionStartPattern === "number") {
            svSprite._motionStartPattern = dm.motionStartPattern;
        }
        if (dm.motion) {
            if (dm.motion === "attack") {
                svSprite.startMotion("thrust");
            }
            else {
                svSprite.startMotion(dm.motion);
            }
        }
    };
    // NRP_EnemyCollapse連携
    if (hasNrpCollapse) {
        const _Sprite_Enemy_updateEffect = Sprite_Enemy.prototype.updateEffect;
        Sprite_Enemy.prototype.updateEffect = function () {
            if (this._effectType === "originalCollapse" &&
                isSvActorEnemy(this._battler) &&
                this["_svActorSprite"]) {
                // NRP_EnemyCollapse.jsのupdateEffectを呼び出さずに、
                // 独自の更新処理に切り替える
                this.setupEffect();
                if (this["_svActorSprite"] &&
                    this["_svActorSprite"]._collapseStartY == null) {
                    this["_svActorSprite"]._collapseStartY = this["_svActorSprite"].y;
                }
                if (this._effectDuration > 0) {
                    this._effectDuration--;
                    this["updateSvActorCollapse"]();
                    if (this._effectDuration <= 0) {
                        this["opacity"] = 0;
                        if (this["_svActorSprite"]) {
                            this["_svActorSprite"].opacity = 0;
                            this["_svActorSprite"]._collapseStartY = null;
                        }
                        if (this["_svActorSprite"]?._collapseMask) {
                            this["_svActorSprite"].mask = null;
                            this["_svActorSprite"].removeChild(this["_svActorSprite"]._collapseMask);
                            this["_svActorSprite"]._collapseMask.destroy();
                            this["_svActorSprite"]._collapseMask = null;
                        }
                        this._effectType = null;
                    }
                }
                return;
            }
            _Sprite_Enemy_updateEffect.call(this);
        };
    }
    else {
        // NRP_EnemyCollapseがない場合は、標準の消滅処理をSVアクターにも適用
        const _Sprite_Enemy_startCollapse = Sprite_Enemy.prototype.startCollapse;
        Sprite_Enemy.prototype.startCollapse = function () {
            _Sprite_Enemy_startCollapse.call(this);
            if (isSvActorEnemy(this._battler) && this["_svActorSprite"]) {
                // 本体スプライトと同じエフェクトを再生
                if (this._effectType) {
                    this["_svActorSprite"].startEffect(this._effectType);
                }
            }
        };
    }
    Sprite_Enemy.prototype["updateSvActorCollapse"] = function () {
        if (!this._battler)
            return;
        const collapseData = this._battler.originalCollapseData();
        if (collapseData) {
            this["applySvActorCollapseEffect"](collapseData);
        }
        else {
            // データがなければ即時終了
            this._effectDuration = 0;
            this["opacity"] = 0;
            if (this["_svActorSprite"]) {
                this["_svActorSprite"].opacity = 0;
            }
        }
    };
    Sprite_Enemy.prototype["applySvActorCollapseEffect"] = function (collapseData) {
        const svSprite = this["_svActorSprite"];
        if (!svSprite)
            return;
        const cd = asObject(collapseData);
        if (!cd)
            return;
        // 敵本体のスプライト（静止画）は描画しないようにフレームを空にする
        // 敵本体のスプライト（静止画）は描画しないようにフレームを空にする
        this["setFrame"](0, 0, 0, 0);
        // const _a = this._battler;
        let duration = 32;
        try {
            // biome-ignore lint/security/noGlobalEval: NRP_EnemyCollapse互換のため、数式文字列を評価する（ローカル実行前提）
            duration = Number(eval(String(cd.Duration)) || 32);
        }
        catch (_e) {
            /* ignore */
        }
        const progress = (duration - this._effectDuration) / duration;
        let shake = 0;
        try {
            // biome-ignore lint/security/noGlobalEval: NRP_EnemyCollapse互換のため、数式文字列を評価する（ローカル実行前提）
            shake = Number(eval(String(cd.ShakeStrength)) || 0);
        }
        catch (_e) {
            /* ignore */
        }
        svSprite.x += Math.round(Math.random() * shake * 2) - shake;
        try {
            // biome-ignore lint/security/noGlobalEval: NRP_EnemyCollapse互換のため、数式文字列を評価する（ローカル実行前提）
            svSprite.blendMode = Number(eval(String(cd.BlendMode)) || 1);
        }
        catch (_e) {
            svSprite.blendMode = 1;
        }
        const colorText = String(cd.BlendColor ?? "[255, 255, 255, 128]");
        try {
            const color = JSON.parse(colorText);
            svSprite.setBlendColor(color);
        }
        catch (_e) {
            try {
                // biome-ignore lint/security/noGlobalEval: 旧書式互換のため、配列式の文字列を評価する（ローカル実行前提）
                const color = eval(colorText);
                svSprite.setBlendColor(color);
            }
            catch (_e2) {
                svSprite.setBlendColor([255, 255, 255, 128]);
            }
        }
        svSprite.opacity = 255 * (1 - progress);
        if (cd.CollapseType === "Sink") {
            // マスクがなければ作成
            if (!svSprite._collapseMask) {
                svSprite._collapseMask = new PIXI.Graphics();
                svSprite.addChild(svSprite._collapseMask);
                svSprite.mask = svSprite._collapseMask;
            }
            const totalHeight = this["height"]; // Sprite_Enemyのheight getter
            const totalWidth = this["width"]; // Sprite_Enemyのwidth getter
            const startY = svSprite._collapseStartY ?? this["y"];
            const sinkAmount = totalHeight * progress;
            svSprite.y = startY + sinkAmount; // スプライト全体を下に移動させる
            const maskHeight = Math.max(0, totalHeight * (1 - progress));
            // Sprite_SvActorのアンカーは(0.5, 1)なので、原点は最下段の中央足元。
            // マスクの矩形は、この原点を基準に描画する必要がある。
            const maskStartX = -totalWidth / 2;
            const maskStartY = -totalHeight;
            svSprite._collapseMask.clear();
            svSprite._collapseMask.beginFill(0xffffff);
            // マスクの開始Y座標を固定し、高さを変えることで下から消えるように見せる
            svSprite._collapseMask.drawRect(maskStartX, maskStartY, totalWidth, maskHeight);
            svSprite._collapseMask.endFill();
        }
        if (cd.Sound2 && cd.Sound2Interval) {
            try {
                // biome-ignore lint/security/noGlobalEval: NRP_EnemyCollapse互換のため、数式文字列を評価する（ローカル実行前提）
                const interval = Number(eval(String(cd.Sound2Interval)));
                if (interval > 0 && this._effectDuration % interval === 0) {
                    AudioManager.playSe({
                        name: String(cd.Sound2),
                        volume: 90,
                        pitch: 100,
                        pan: 0,
                    });
                }
            }
            catch (_e) {
                /* ignore */
            }
        }
    };
})();
