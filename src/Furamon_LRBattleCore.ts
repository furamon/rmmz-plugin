/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - 初期TPの変更
 * - 被ダメージ時のTP回復の廃止
 * - メモ欄に<IgnoreExp>のついた特徴を持つアクターがいる場合は
 * 戦闘勝利時の獲得経験値を0
 * - メモ欄に<DoubleExp>のついた特徴を持つアクターがいる場合は
 * 戦闘勝利時の獲得経験値を倍増
 * - メモ欄に<DummyEnemy>をつけた敵はダミーターゲット（完全無敵の敵）になる
 * - ショップ画面のレイアウト調整
 *
 * @param initialTp
 * @text 初期TP
 * @desc 初期TP、数式可
 * @default
 * @type text
 *
 * @param noChargeTpByDamage
 * @type boolean
 * @text 被ダメージ時にTPを回復しない
 * @desc 被ダメージ時にTPを回復するか？
 * @on 回復しない
 * @off 回復する
 * @default true
 *
 * @param expRate
 * @type number
 * @text 獲得経験値倍率
 * @desc DoubleExp時の獲得経験値倍率
 * @default 2.00
 * @decimals 2
 */

(() => {
  const PLUGIN_NAME = "Furamon_LRBattleCore";
  const parameters = PluginManager.parameters(PLUGIN_NAME);
  const prmInitialTP = parameters["initialTp"];
  const prmNoChargeTpByDamage =
    parameters["noChargeTpByDamage"] === "true" ? true : false;
  const prmExpRate = parseFloat(parameters["expRate"]);

  // 初期TP
  const _Game_Battler_initTp = Game_Battler.prototype.initTp;
  Game_Battler.prototype.initTp = function () {
    if (prmInitialTP != undefined) {
      this.setTp(eval(prmInitialTP));
      return;
    }
    _Game_Battler_initTp.call(this);
  };

  // 被ダメージ時のTP回復
  if (prmNoChargeTpByDamage) {
    Game_Battler.prototype.chargeTpByDamage = () => {};
  }

  // <IgnoreExp>のついた特徴を持つアクターがいる場合は
  // 戦闘勝利時の獲得経験値を0にする
  // またメモ欄に<DoubleExp>のついた特徴を持つアクターがいる場合は
  // 戦闘勝利時の獲得経験値を倍増
  const _Game_Enemy_exp = Game_Enemy.prototype.exp;
  Game_Enemy.prototype.exp = function () {
    // パーティの特徴を持つオブジェクトのmetaデータを抽出
    const party = $gameParty.allMembers();
    let allTraitsMeta: MetaObject[] = []; // 初期化

    party.forEach((actor) => {
      const objects: MetaObject[] = actor
        .skills()
        .map((skill) => ({
          meta: skill.meta,
        }))
        .concat(this.traitObjects().map((obj) => ({ meta: obj.meta })));
      allTraitsMeta = allTraitsMeta.concat(objects);
    });

    if (
      allTraitsMeta.some(
        (trait) => trait.meta && Object.hasOwn(trait.meta, "IgnoreEXP"),
      )
    ) {
      return 0;
    }
    if (
      allTraitsMeta.some(
        (trait) => trait.meta && Object.hasOwn(trait.meta, "DoubleEXP"),
      )
    ) {
      return Math.floor(_Game_Enemy_exp.call(this) * (prmExpRate || 1));
    }
    return _Game_Enemy_exp.call(this);
  };

  // アクターコマンドから逃げられるようにする
  const _Scene_Battle_createActorCommandWindow =
    Scene_Battle.prototype.createActorCommandWindow;

  Scene_Battle.prototype.createActorCommandWindow = function () {
    _Scene_Battle_createActorCommandWindow.call(this);
    this._actorCommandWindow.setHandler(
      "escape",
      this.commandEscape.bind(this),
    );
  };

  const _Window_ActorCommand_makeCommandList =
    Window_ActorCommand.prototype.makeCommandList;

  Window_ActorCommand.prototype.makeCommandList = function () {
    _Window_ActorCommand_makeCommandList.call(this);
    if (this._actor)
      this._list.splice(5, 0, {
        name: "逃げる",
        symbol: "escape",

        enabled: BattleManager.canEscape(),
        ext: null,
      });
  };

  // ダミーターゲット処理。スキル効果を全て無効化する
  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target: Game_Battler) {
    if (target.isDummyEnemy()) {
      const result = target.result();
      this.subject().clearResult();
      result.clear();
      if (result._isHitConfirm === false) {
        result._isHitConfirm = true;
      }
      return;
    }
    _Game_Action_apply.call(this, target);
  };

  Game_BattlerBase.prototype.isDummyEnemy = function () {
    return this.traitObjects().some((object) => object.meta.DummyEnemy);
  };

  // 対象選択中はコマンド・スキルウィンドウを閉じる
  const _Scene_Battle_startEnemySelection =
    Scene_Battle.prototype.startEnemySelection;
  Scene_Battle.prototype.startEnemySelection = function () {
    this._actorCommandWindow.hide();
    this._skillWindow.hide();
    _Scene_Battle_startEnemySelection.apply(this);
  };

  const _Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
  Scene_Battle.prototype.onEnemyCancel = function () {
    if (this._actorCommandWindow.currentSymbol() === "attack") {
      this._actorCommandWindow.show();
    }
    _Scene_Battle_onEnemyCancel.apply(this);
  };
})();
