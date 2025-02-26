/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - 初期TPの変更
 * - 被ダメージ時のTP回復の廃止
 * - ステート付与率の運の影響を大きく+加算式に、TP(レベル)も参照
 * - 追加効果によるステート付与が外れた場合、及び無効化された場合に任意のステートを付与(ミス表示用)
 * - 負の速度補正を魔法防御で相殺
 * - メモ欄に<IgnoreExp>のついた特徴を持つアクターがいる場合は戦闘勝利時の獲得経験値を0
 * - メモ欄に<DoubleExp>のついた特徴を持つアクターがいる場合は戦闘勝利時の獲得経験値を倍増
 * - 能力値乗算特徴を一番高いもののみ反映するようにする。要は底上げ方式にする
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

(function () {
  const PLUGIN_NAME = "Furamon_LRBattleCore";
  const parameters = PluginManager.parameters(PLUGIN_NAME);
  const prmInitialTP = parameters["initialTp"];
  const prmNoChargeTpByDamage =
    parameters["noChargeTpByDamage"] === "true" ? true : false;
  const prmExpRate = parseFloat(parameters["expRate"]);

  // 初期TP
  const _Game_Battler_initTp = Game_Battler.prototype.initTp;
  Game_Battler.prototype.initTp = function () {
    const a = this;
    if (prmInitialTP != undefined) {
      this.setTp(eval(prmInitialTP));
      return;
    }
    _Game_Battler_initTp.apply(this);
  };

  // 被ダメージ時のTP回復
  if (prmNoChargeTpByDamage) {
    Game_Battler.prototype.chargeTpByDamage = function () {};
  }

  // デフォの運の影響廃止
  // そもそもlukEffectRateがある場所を潰したが他プラグインのことも考えて念の為
  Game_Action.prototype.lukEffectRate = function (target: Game_Battler) {
    return 1;
  };

  // ステート付与率の運の影響を大きく+加算式に、TP(レベル)も参照
  // 追加効果によるステート付与が外れた場合任意のステートを付与(ミス表示用)
  Game_Action.prototype.itemEffectAddAttackState = function (
    target: Game_Battler,
    effect: MZ.Effect
  ) {
    for (const stateId of this.subject().attackStates()) {
      let chance = effect.value1;
      chance *= target.stateRate(stateId);
      chance *= this.subject().attackStatesRate(stateId);
      chance +=
        (this.subject().luk - target.luk) * 0.03 +
        (this.subject().tp - target.tp) * 0.01;

      chance = Math.max(chance, 0);
      if (target.isStateResist(stateId)) {
        target.addState(4);
        return;
      }

      if (Math.random() < chance) {
        target.addState(stateId);
        this.makeSuccess(target);
      } else {
        target.addState(5);
      }
    }
  };

  Game_Action.prototype.itemEffectAddNormalState = function (
    target: Game_Battler,
    effect: MZ.Effect
  ) {
    let chance = effect.value1;
    if (!this.isCertainHit()) {
      chance *= target.stateRate(effect.dataId);
      chance +=
        (this.subject().luk - target.luk) * 0.03 +
        (this.subject().tp - target.tp) * 0.01;

      chance = Math.max(chance, 0);
    }
    if (target.isStateResist(effect.dataId)) {
      target.addState(4);
      return;
    }

    if (Math.random() < chance) {
      target.addState(effect.dataId);
      this.makeSuccess(target);
    } else {
      target.addState(5);
    }
  };

  // 速度補正が負の行動なら魔法防御で割合相殺
  const _Game_Action_speed = Game_Action.prototype.speed;
  Game_Action.prototype.speed = function () {
    const speed = _Game_Action_speed.call(this);
    if (this.item()!.speed < 0) {
      return (
        speed +
        (-this.item()!.speed * this.subject().agi * this.subject().mdf) / 10000
      );
    } else {
      return speed;
    }
  };

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
        (trait) => trait.meta && trait.meta.hasOwnProperty("IgnoreEXP")
      )
    ) {
      return 0;
    }
    if (
      allTraitsMeta.some(
        (trait) => trait.meta && trait.meta.hasOwnProperty("DoubleEXP")
      )
    ) {
      return Math.floor(_Game_Enemy_exp.call(this) * (prmExpRate || 1));
    }
    return _Game_Enemy_exp.call(this);
  };

  // 能力値乗算特徴がアクターや職業、装備などに複数ついている場合、
  // 一番高いものを返すよう挙動を改変
  // 最大HPだけは加算処理(130%と120%なら150%になる)
  // また、装備能力上昇値がアクター側の補正を受けないよう改変
  // (ステートは普通に乗算)
  Game_Actor.prototype.param = function (paramId: number) {
    // 基本値の取得
    let value = this.paramBase(paramId);
    // 特徴による乗算補正を適用
    value *= this.paramRate(paramId);

    // 装備やその他の加算値をそのあとから追加（乗算補正の影響を受けない）
    value += this.paramPlus(paramId);

    // バフ/デバフの効果を適用
    value *= this.paramBuffRate(paramId);

    // 最小値の処理
    const maxValue = this.paramMax(paramId);
    const minValue = this.paramMin(paramId);

    return Math.round(value.clamp(minValue, maxValue));
  };

  Game_Actor.prototype.paramRate = function (paramId: number) {
    // 全ての特徴を持つオブジェクトから特徴を収集（装備は除外）
    const traits = this.traitObjects().reduce((acc, actor) => {
      if (actor && actor.traits && !(actor instanceof Game_Item)) {
        const paramTraits = actor.traits.filter(
          (trait) =>
            trait.code === Game_BattlerBase.TRAIT_PARAM &&
            trait.dataId === paramId
        );
        return acc.concat(paramTraits);
      }
      return acc;
    }, [] as MZ.Trait[]);

    // ステートとそれ以外の特徴に分離
    const stateTraits = traits.filter((trait) =>
      this.states().some((state) => state.traits.includes(trait))
    );
    const otherTraits = traits.filter(
      (trait) => !this.states().some((state) => state.traits.includes(trait))
    );

    // ステートの効果は乗算で計算
    const stateRate = stateTraits
      .map((trait) => trait.value)
      .reduce((acc: number, cur: number) => acc * cur, 1);

    // その他の特徴の計算
    let otherRate;
    if (otherTraits.length === 0) {
      otherRate = 1;
    } else if (paramId === 0) {
      // 最大HPの場合
      otherRate = otherTraits.reduce(
        (total, trait) => total + (trait.value - 1),
        1
      );
    } else {
      otherRate = Math.max(...otherTraits.map((trait) => trait.value));
    }

    // 両方の効果を乗算して返す
    return stateRate * otherRate;
  };

  // アクターコマンドから逃げられるようにする
  const _Scene_Battle_createActorCommandWindow =
    Scene_Battle.prototype.createActorCommandWindow;

  Scene_Battle.prototype.createActorCommandWindow = function () {
    _Scene_Battle_createActorCommandWindow.call(this);
    this._actorCommandWindow.setHandler(
      "escape",
      this.commandEscape.bind(this)
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
    return this.traitObjects().some((traitObject) => ({
      meta: traitObject.meta,
    }));
  };

  // NRP_BattleTargetCursorが開いている間はスキルウィンドウを閉じる
  const _Scene_Battle_update = Scene_Battle.prototype.update;
  Scene_Battle.prototype.update = function () {
    _Scene_Battle_update.call(this);
    if (BattleManager.isInputting()) {
      if (this._skillWindow.visible) {
        // 敵選択ウィンドウが開いているなら
        if (this._enemyWindow.visible || this._enemyNameWindow.visible) {
          this._skillWindow.visible = false;
        } else {
          this._skillWindow.visible = true;
        }
      }
    }
  };

  // ショップ画面のレイアウト調整
  Scene_Shop.prototype.statusWidth = function () {
    return Graphics.boxWidth / 2 - 40;
  };

  // Window_ShopBuy.prototype.maxCols = function(){
  //   return 2;
  // };

  Window_ShopSell.prototype.maxCols = function () {
    return 3;
  };
})();
