//------------------------------------------------------------------------------
// Furamon_NoHitStepBack.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/2/2 1.0.0 公開！(厳密には数日前からリポジトリにはあった)
// 2025/2/25 1.1.0 TypeScriptに移行。
// 2525/3/15 1.1.1 アニメーションつきスキルを外した際、アニメーションごとバックステップする不具合修正。
/*:
 * @target MZ
 * @plugindesc 相手の行動をかわした・外された際、バックステップさせてかわしてるっぽくする
 * @author Furamon
 *
 * @help
 * 相手の行動をかわした・外された際、バックステップさせてかわしてるっぽくします。
 *
 */
(function () {
    // バトラーのミス・回避・魔法回避に処理追加
    const _Game_Battler_performMiss = Game_Battler.prototype.performMiss;
    Game_Battler.prototype.performMiss = async function () {
        _Game_Battler_performMiss.call(this);
        await delay(16); // ポップアップ処理の時間のため1フレームウェイト
        this.stepBack();
    };
    const _Game_Battler_performEvasion = Game_Battler.prototype.performEvasion;
    Game_Battler.prototype.performEvasion = async function () {
        _Game_Battler_performEvasion.call(this);
        await delay(16);
        this.stepBack();
    };
    const _Game_Battler_performMagicEvasion = Game_Battler.prototype.performMagicEvasion;
    Game_Battler.prototype.performMagicEvasion = async function () {
        _Game_Battler_performMagicEvasion.call(this);
        await delay(16);
        this.stepBack();
    };
    Game_Battler.prototype.stepBack = async function () {
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle) {
            let sprite;
            if (this.isEnemy()) {
                sprite = scene._spriteset._enemySprites.find((s) => s._battler === this);
            }
            if (this.isActor()) {
                sprite = scene._spriteset._actorSprites.find((s) => s._battler === this);
            }
            if (sprite) {
                const duration = 3;
                sprite.startMove(this.isEnemy() ? -192 : 192, 0, duration);
                await delay(duration * 48); // フレームレートを考慮してウェイト
                sprite.startMove(0, 0, duration);
            }
        }
    };
    // ウェイト処理
    function delay(wait) {
        return new Promise((resolve) => setTimeout(resolve, wait));
    }
    // アニメーションごと後退しないようにする
    const _Sprite_Animation_targetSpritePosition = Sprite_Animation.prototype.targetSpritePosition;
    Sprite_Animation.prototype.targetSpritePosition = function (sprite) {
        let pos = _Sprite_Animation_targetSpritePosition.call(this, sprite);
        // 現在の移動量を取得
        const currentOffsetX = sprite._offsetX;
        //sprite.xから移動量を引く
        pos.x = sprite.x - currentOffsetX;
        return pos;
    };
})();
