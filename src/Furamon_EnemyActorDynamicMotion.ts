//------------------------------------------------------------------------------
// Furamon_EnemyActorDynamicMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/17 1.0.0 公開！
// 2025/06/20 1.1.0 NRP_EnemyCollapse対応
// 2025/06/24 1.1.1 関数参照が抜けておりSVアクターを倒すとエラーで止まることがあるのを修正
// 2025/06/29 1.2.0 NRP_DynamicMotionMZとの連携を再実装

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

(function () {
    'use strict';

    const PLUGIN_NAME = 'Furamon_EnemyActorDynamicMotion';

    // 必須プラグインの存在確認
    if (!PluginManager._scripts.includes('NRP_DynamicMotionMZ')) {
        console.warn(`[${PLUGIN_NAME}] NRP_DynamicMotionMZ is not found.`);
        return;
    }
    if (!PluginManager._scripts.includes('Furamon_EnemyActorAnimation')) {
        console.warn(
            `[${PLUGIN_NAME}] Furamon_EnemyActorAnimation is not found.`
        );
        return;
    }

    const hasNrpCollapse = PluginManager._scripts.includes('NRP_EnemyCollapse');

    // SVアクター敵かどうかを判定する関数
    function isSvActorEnemy(battler: Game_Battler) {
        if (!battler || !(battler instanceof Game_Enemy)) {
            return false;
        }
        const enemy = battler.enemy();
        return !!(enemy?.meta?.SVActor || enemy?.meta?.SVアクター);
    }

    /**
     * ● 動的モーションの実行
     */
    const _Sprite_Enemy_startDynamicMotion =
        Sprite_Enemy.prototype.startDynamicMotion;
    Sprite_Enemy.prototype.startDynamicMotion = function (dynamicMotion: any) {
        if (isSvActorEnemy(this._battler) && this._svActorSprite) {
            this.startDynamicSvMotion(dynamicMotion);
            Sprite_Battler.prototype.startDynamicMotion.call(
                this,
                dynamicMotion
            );
            return;
        }
        _Sprite_Enemy_startDynamicMotion.apply(this, arguments);
    };

    /**
     * ● SVキャラクターモーションの実行���敵版）
     */
    Sprite_Enemy.prototype.startDynamicSvMotion = function (
        dynamicMotion: any
    ) {
        if (
            !isSvActorEnemy(this._battler) ||
            !this._svActorSprite ||
            !dynamicMotion.motion
        ) {
            return;
        }
        const svSprite = this._svActorSprite;
        svSprite._motionCount = 0;
        svSprite._pattern = 0;
        svSprite._motionDuration = dynamicMotion.motionDuration;
        svSprite._motionPattern = dynamicMotion.motionPattern;
        if (dynamicMotion.motionStartPattern != undefined) {
            svSprite._motionStartPattern = dynamicMotion.motionStartPattern;
        }
        if (dynamicMotion.motion) {
            if (dynamicMotion.motion === 'attack') {
                svSprite.startMotion('thrust');
            } else {
                svSprite.startMotion(dynamicMotion.motion);
            }
        }
    };

    // NRP_EnemyCollapse連携
    if (hasNrpCollapse) {
        const _Sprite_Enemy_updateEffect = Sprite_Enemy.prototype.updateEffect;
        Sprite_Enemy.prototype.updateEffect = function() {
            if (
                this._effectType === 'originalCollapse' &&
                isSvActorEnemy(this._battler) &&
                this._svActorSprite
            ) {
                // NRP_EnemyCollapse.jsのupdateEffectを呼び出さずに、
                // 独自の更新処理に切り替える
                this.setupEffect();
                if (this._effectDuration > 0) {
                    this._effectDuration--;
                    this.updateSvActorCollapse();
                    if (this._effectDuration <= 0) {
                        this.opacity = 0;
                        if (this._svActorSprite) {
                            this._svActorSprite.opacity = 0;
                        }
                        this._effectType = null;
                    }
                }
                return;
            }
            _Sprite_Enemy_updateEffect.apply(this, arguments);
        };
    } else {
        // NRP_EnemyCollapseがない場合は、標準の消滅処理をSVアクターにも適用
        const _Sprite_Enemy_startCollapse = Sprite_Enemy.prototype.startCollapse;
        Sprite_Enemy.prototype.startCollapse = function() {
            _Sprite_Enemy_startCollapse.call(this);
            if (isSvActorEnemy(this._battler) && this._svActorSprite) {
                // 本体スプライトと同じエフェクトを再生
                if (this._effectType) {
                    this._svActorSprite.startEffect(this._effectType);
                }
            }
        };
    }

    Sprite_Enemy.prototype.updateSvActorCollapse = function () {
        const collapseData = this._battler.originalCollapseData();
        if (collapseData) {
            this.applySvActorCollapseEffect(collapseData);
        } else {
            // データがなければ即時終了
            this._effectDuration = 0;
            this.opacity = 0;
            if (this._svActorSprite) {
                this._svActorSprite.opacity = 0;
            }
        }
    };

    Sprite_Enemy.prototype.applySvActorCollapseEffect = function (
        collapseData: any
    ) {
        const svSprite = this._svActorSprite;
        if (!svSprite) return;

        // 敵本体のスプライト（静止画）は描画しないようにフレームを空にする
        this.setFrame(0, 0, 0, 0);

        const a = this._battler;
        let duration = 32;
        try {
            duration = Number(eval(collapseData.Duration) || 32);
        } catch (e) { /* ignore */ }
        const progress = (duration - this._effectDuration) / duration;

        let shake = 0;
        try {
            shake = Number(eval(collapseData.ShakeStrength) || 0);
        } catch (e) { /* ignore */ }
        svSprite.x += Math.round(Math.random() * shake * 2) - shake;

        try {
            svSprite.blendMode = Number(eval(collapseData.BlendMode) || 1);
        } catch (e) {
            svSprite.blendMode = 1;
        }

        const colorText = collapseData.BlendColor || '[255, 255, 255, 128]';
        try {
            const color = JSON.parse(colorText);
            svSprite.setBlendColor(color);
        } catch (e) {
            try {
                const color = eval(colorText);
                svSprite.setBlendColor(color);
            } catch (e2) {
                svSprite.setBlendColor([255, 255, 255, 128]);
            }
        }

        svSprite.opacity = 255 * (1 - progress);

        if (collapseData.CollapseType === 'Sink') {
            const mainSprite = svSprite._mainSprite;
            if (mainSprite?.bitmap?.isReady()) {
                const frame = mainSprite._frame;
                const frameSize = svSprite.getFrameSize(); // from Furamon_EnemyActorAnimation
                if (frame && frameSize) {
                    const originalHeight = frameSize.frameHeight;
                    const newHeight = Math.max(
                        0,
                        originalHeight * (1 - progress)
                    );
                    mainSprite.setFrame(
                        frame.x,
                        frame.y,
                        frame.width,
                        newHeight
                    );
                }
            }
        }

        if (collapseData.Sound2 && collapseData.Sound2Interval) {
            try {
                const interval = Number(eval(collapseData.Sound2Interval));
                if (interval > 0 && this._effectDuration % interval === 0) {
                    AudioManager.playSe({
                        name: collapseData.Sound2,
                        volume: 90,
                        pitch: 100,
                        pan: 0,
                    });
                }
            } catch (e) { /* ignore */ }
        }
    };
})();
