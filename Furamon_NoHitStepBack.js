/*:
 * @target MZ
 * @plugindesc 相手の行動をかわした・外された際、バックステップさせてかわしてるっぽくする
 * @author Furamon
 *
 * @help
 * 相手の行動をかわした・外された際、バックステップさせてかわしてるっぽくします。
 *
 */

(() => {
  ("use strict");

  // バトラーのミス・回避・魔法回避に処理追加
  const _Game_Battler_performMiss = Game_Battler.prototype.performMiss;
  Game_Battler.prototype.performMiss = async function () {
    _Game_Battler_performMiss.apply(this, arguments);
    await delay(16); // ポップアップ処理の時間のため1フレームウェイト
    this.stepBack();
  };

  const _Game_Battler_performEvasion = Game_Battler.prototype.performEvasion;
  Game_Battler.prototype.performEvasion = async function () {
    _Game_Battler_performEvasion.apply(this, arguments);
    await delay(16);
    this.stepBack();
  };

  const _Game_Battler_performMagicEvasion =
    Game_Battler.prototype.performMagicEvasion;
  Game_Battler.prototype.performMagicEvasion = async function () {
    _Game_Battler_performMagicEvasion.apply(this, arguments);
    await delay(16);
    this.stepBack();
  };

  Game_Battler.prototype.stepBack = async function () {
    const scene = SceneManager._scene;
    if (scene instanceof Scene_Battle) {
      let sprite;
      if (this.isEnemy()) {
       sprite = scene._spriteset._enemySprites.find(
          (s) => s._battler === this
        );
      }
      if (this.isActor()) {
        sprite = scene._spriteset._actorSprites.find(
          (s) => s._battler === this
        );
      }
      if (sprite) {
        const duration = 6;

        sprite.startMove(this.isEnemy() ? -192 : 192, 0, duration);
        await delay((duration + duration/2) * 16); // フレームレートを考慮してウェイト
        sprite.startMove(0, 0, duration);
      }
    }
  };
  // ウェイト処理
  function delay(wait) {
    return new Promise((resolve) => setTimeout(resolve, wait));
  }
})();
