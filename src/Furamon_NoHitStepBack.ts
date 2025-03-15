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
    let missed = false; // 外したかのフラグ

    // バトラーのミス・回避・魔法回避に処理追加
    const _Game_Battler_performMiss = Game_Battler.prototype.performMiss;

    Game_Battler.prototype.performMiss = async function () {
        _Game_Battler_performMiss.call(this);
        missed = true;
        await delay(16); // ポップアップ処理の時間のため1フレームウェイト
        this.stepBack();
    };

    const _Game_Battler_performEvasion = Game_Battler.prototype.performEvasion;

    Game_Battler.prototype.performEvasion = async function () {
        _Game_Battler_performEvasion.call(this);
        missed = true;
        await delay(16);
        this.stepBack();
    };

    const _Game_Battler_performMagicEvasion =
        Game_Battler.prototype.performMagicEvasion;

    Game_Battler.prototype.performMagicEvasion = async function () {
        _Game_Battler_performMagicEvasion.call(this);
        missed = true;
        await delay(16);
        this.stepBack();
    };

    Game_Battler.prototype.stepBack = async function () {
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle) {
            let sprite;
            if (this.isEnemy()) {
                sprite = scene._spriteset._enemySprites.find(
                    (s: Sprite_Enemy) => s._battler === this
                );
            }
            if (this.isActor()) {
                sprite = scene._spriteset._actorSprites.find(
                    (s: Sprite_Actor) => s._battler === this
                );
            }
            if (sprite) {
                const duration = 4;

                sprite.startMove(this.isEnemy() ? -192 : 192, 0, duration);
                await delay(duration * 16 * 2); // フレームレートを考慮してウェイト
                sprite.startMove(0, 0, duration);
            }
        }
    };

    // ウェイト処理
    function delay(wait: number) {
        return new Promise((resolve) => setTimeout(resolve, wait));
    }

    // アニメーションごと後退しないようにする
    const _Sprite_Animation_targetPosition =
        Sprite_Animation.prototype.targetPosition;
    Sprite_Animation.prototype.targetPosition = function (renderer) {
        if (missed) {
            const pos = new Point(0,0);
            if (this._animation?.displayType === 2) {
                pos.x = renderer.view.width / 2;
                pos.y = renderer.view.height / 2;
            } else {
                for (const target of this._targets as Sprite_Battler[]) {
                    const tpos = this.targetSpritePosition(target);
                    pos.x += target._homeX;
                    pos.y += tpos.y;
                }
                pos.x /= this._targets.length;
                pos.y /= this._targets.length;
            }
            return pos;
        } else {
            return _Sprite_Animation_targetPosition.call(this, renderer);
        }
    };
})();
