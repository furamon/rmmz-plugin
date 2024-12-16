//------------------------------------------------------------------------------
// Furamon_LP.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2024/12/14 1.0.0-Beta 非公開作成
// 2024/12/15 1.0.0 公開！
// 2024/12/16 1.0.1 <LP_Bonus>が負の値の時の処理を追加。

/*:
 * @target MZ
 * @plugindesc 戦闘不能に関わるライフポイントを実装します。
 * @author Furamon
 *
 * @help 戦闘不能に関わるライフポイントを実装します。
 *
 * - アクターが戦闘不能になった際に、LPが1削れる
 * - 戦闘不能のアクターが複数対象攻撃に巻き込まれた場合もLPが1削れる
 * - LPが残っていれば戦闘不能アクターに対して回復スキルを使用できる
 *
 * プラグインパラメータにLPの計算式を入れてください。
 *
 * スキルのメモ欄に<LP_Recover:x>を記入すると、使った対象のLPを回復するスキルやアイテムが作れます。
 * スキルのメモ欄に<LP_Cost:x>を記入すると、LPを消費するスキルが作れます。身を削る大技かなんかに。
 * アクター、職業、装備、ステートのメモ欄に<LP_Bonus:x>を記入すると、最大LPを増減できます。
 * プラグインコマンドでLPの増減もできます。
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * 描画の際はTP欄を潰すため、「TPを表示」をオフにしてください。
 * もしTPを使っている場合はご容赦いただくか、ほかのプラグインでなんとかしてください。（丸投げ）
 * actor._lpで取得できるはずです。
 *
 * <LP_Recover:x>付きスキルを敵に使うと特殊処理で即死させます。
 * 回復だろうが戦闘不能になりますが仕様です。
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * 以下のプラグインを着想および参考にさせていただきました。 m（＿ ＿）m ﾏｲﾄﾞ
 * - Mano様 ー ライフポイント
 * (https://github.com/Sigureya/RPGmakerMV/blob/master/Mano_LifePoint.js)
 * - 砂川赳様 ー 奥義システム
 * (https://newrpg.seesaa.net/article/489968387.html)
 *
 * またClaude 3.5 sonnetの力を盛大に借りました。
 *
 * @-----------------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------------
 *
 * @command growLP
 * @text LPの増減
 * @desc LPを増減させます。
 *
 * @arg actor
 * @text アクター
 * @type actor
 * @desc 対象のアクターを指定します。空白なら全員。
 *
 * @arg value
 * @text 増減量
 * @type number
 * @max 999
 * @min -999
 * @desc 増減するLPの量です。
 *
 * @------------------------------------------------------------------
 * @ プラグインパラメータ
 * @------------------------------------------------------------------
 *
 * @param MaxLP
 * @text アクターの最大LP
 * @type string
 * @default 5 + a.level / 5
 * @desc アクターの最大LPです。
 * 例: 5 + a.level / 5
 *
 * @param LPBreakMessage
 * @text LPが削れたときのメッセージ
 * @type string
 * @default %1は%2のLPを失った！！
 * @desc LPが減少したときのバトルメッセージです。
 * %1にアクターの名前、%2に数値が入ります。
 *
 * @param LPGainMessage
 * @text LPが回復したときのメッセージ
 * @type string
 * @default %1は%2LP回復した！
 * @desc LPが回復したときのバトルメッセージです。
 * %1にアクターの名前、%2に数値が入ります。
 */

const PLUGIN_NAME = "Furamon_LP";
const parameters = PluginManager.parameters(PLUGIN_NAME);
const prmMaxLP = parameters["MaxLP"];
const prmLPBreakMessage = parameters["LPBreakMessage"];
const prmLPGainMessage = parameters["LPGainMessage"];

(function () {
  // プラグインコマンド
  PluginManager.registerCommand(PLUGIN_NAME, "growLP", function (args) {
    const actorId = eval(args.actor);
    const value = eval(args.value);

    if (!value) return;

    // アクターの指定があれば
    if (actorId) {
      const actor = $gameActors.actor(actorId);
      if (actor) gainLP(actor, value);
      return;
    }

    // アクター指定がなければ全員
    $gameParty.members().forEach((actor) => {
      gainLP(actor, value);
    });
  });

  // バトルメッセージ初期化
  function LPBreakMessage(actor, point) {
    const message = prmLPBreakMessage || "%1は%2のLPを失った！！";
    return message.toString().replace("%1", actor).replace("%2", point);
  }

  function LPGainMessage(actor, point) {
    const message = prmLPGainMessage || "%1は%2LP回復した！";
    return message.toString().replace("%1", actor).replace("%2", point);
  }

  // LPを増減させるメソッド
  function gainLP(actor, value) {
    actor._lp = Math.min(actor._lp + value, actor.mlp);
  }

  // LP監視関数。LPが0なら戦闘不能に
  function lpUpdate() {
    const deadActor = $gameParty
      .aliveMembers()
      .filter((member) => member.lp() <= 0);
    if (deadActor.length > 0) {
      deadActor.map((member) => member.addNewState(1)); // ﾃｰﾚｯﾃｰ
    }
  }

  // 新しいプロパティを追加するための前処理
  const _Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
  Game_BattlerBase.prototype.initMembers = function () {
    _Game_BattlerBase_initMembers.call(this);
    // 独立したライフポイント（LP）を追加
    this._lp = 1;
  };

  // LPの取得メソッド
  Game_BattlerBase.prototype.lp = function () {
    return this._lp !== undefined ? this._lp : 0;
  };

  // LPの全回復
  Game_BattlerBase.prototype.recoverLP = function () {
    this._lp = this.mlp;
  };

  // 最大LPを設定するメソッド
  // <LP_Bonus>を持ったオブジェクトを持ったアクターはMaxLP増やす
  Game_Actor.prototype.maxLPSet = function () {
    const a = this; // 参照用
    const objects = this.traitObjects().concat(this.skills());
    let bonusLP = 0;

    for (const obj of objects) {
      if (obj.meta["LP_Bonus"]) {
        bonusLP += Number(obj.meta["LP_Bonus"]);
      }
    }
    if (bonusLP != 0) {
      this.mlp = Math.floor(eval(prmMaxLP)) + bonusLP;
    } else {
      this.mlp = Math.floor(eval(prmMaxLP));
    }
    this._lp = Math.min(this._lp, this.mlp);
  };

  // 装備やステートなどの更新時にMaxLPも更新
  const _Game_Actor_prototype_refresh = Game_Actor.prototype.refresh;
  Game_Actor.prototype.refresh = function () {
    _Game_Actor_prototype_refresh.call(this);
    this.maxLPSet();
  };

  const _Game_Actor_prototype_setup = Game_Actor.prototype.setup;
  Game_Actor.prototype.setup = function (actorId) {
    _Game_Actor_prototype_setup.call(this, actorId);
    this.initLP(); // LPの初期化を行う
  };

  // LPの初期化メソッドを追加
  Game_Actor.prototype.initLP = function () {
    this.maxLPSet(); // MaxLPを設定する
    this.recoverLP();
  };

  // ゲーム開始時にパーティメンバー全員のLPを初期化
  const _DataManager_setupNewGame = DataManager.setupNewGame;
  DataManager.setupNewGame = function () {
    _DataManager_setupNewGame.call(this);
    $gameParty.members().forEach((actor) => actor.initLP());
  };

  // レベルアップ時必要ならMaxLPを更新
  const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
  Game_Actor.prototype.levelUp = function () {
    _Game_Actor_levelUp.call(this);
    this.maxLPSet(); // MaxLPを設定する
  };

  // ターゲット選択にLPを組み込む
  Game_Unit.prototype.smoothTarget = function (index) {
    const member = this.members()[Math.max(0, index)];
    return member && (member.lp() > 0 || member.isAlive())
      ? member
      : this.aliveMembers()[0];
  };

  // 攻撃対象選択にLPを組み込む
  const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
  Game_Action.prototype.makeTargets = function () {
    let targets = _Game_Action_makeTargets.call(this);

    // 対象のLPが0ならターゲットから除外
    targets = targets.filter((target) => target.lp() > 0);

    // 敵側の全体攻撃の場合、戦闘不能アクターも強制的に追加
    if (this.isForAll() && this.subject().isEnemy()) {
      targets = $gameParty
        .members()
        .filter((member) => member.isAlive() || member.isDead());
    }

    return targets;
  };

  // 戦闘不能時のLP減少処理
  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target) {
    let resurrect = false; // 蘇生か？

    // LPが残っているなら戦闘不能回復
    if (target.lp() > 0 && this.isHpRecover()) {
      target.removeState(1);
      resurrect = true;
    }

    _Game_Action_apply.call(this, target);

    // 蘇生時に勝手にHPが1回復するためつじつまを合わせる。
    // 全回復ならそのまま。
    if (resurrect && -this.evalDamageFormula(target) < target.mhp) {
      target._hp -= 1;
    }

    // LP減少処理
    if (target.isDead() && (this.isDamage() || this.isDrain())) {
      const lpDamage = 1;
      target._lp -= lpDamage;
      target.result().lpDamage = lpDamage;
      // 強制的にポップアップを表示
      target.startDamagePopup();
    } else {
      target.result().lpDamage = 0;
    }

    // <LP_Recover>指定があるなら増減
    const lpRecover = this.item().meta["LP_Recover"];
    if (lpRecover) {
      const recoverValue = Math.floor(eval(lpRecover));
      // 対象が敵なら即死させる
      if (target.isEnemy()) {
        this.executeHpDamage(target, target._hp);
        target._lp -= 1;
        target.result().lpDamage = 1;
        return;
      }
      target._lp = Math.min(target._lp + recoverValue, target.mlp);
      target.result().lpDamage = -recoverValue;
    }

    lpUpdate();
  };

  // LPコストスキル

  // <LP_Cost>指定のスキルのLPコストを払えるか？
  const _Game_BattlerBase_canPaySkillCost =
    Game_BattlerBase.prototype.canPaySkillCost;
  Game_BattlerBase.prototype.canPaySkillCost = function (skill) {
    // アクターのみ対象
    if (this.isActor()) {
      const LPCost = skill.meta["LP_Cost"];
      if (LPCost) {
        return (
          _Game_BattlerBase_canPaySkillCost.apply(this, arguments) &&
          this._lp > LPCost
        );
      }
    }
    return _Game_BattlerBase_canPaySkillCost.apply(this, arguments);
  };

  // LP消費
  const _Game_BattlerBase_paySkillCost =
    Game_BattlerBase.prototype.paySkillCost;
  Game_BattlerBase.prototype.paySkillCost = function (skill) {
    _Game_BattlerBase_paySkillCost.apply(this, arguments);

    // アクターのみ対象
    if (this.isActor()) {
      // 奥義の場合
      const LPCost = skill.meta["LP_Cost"];
      if (LPCost) {
        this._lp -= LPCost;
      }
    }
  };

  const _BattleManager_startInput = BattleManager.startInput;
  BattleManager.startInput = function () {
    _BattleManager_startInput.call(this);
    lpUpdate();
  };

  // エネミーは最大LP1で固定
  const _Game_Enemy_initMembers = Game_Enemy.prototype.initMembers;
  Game_Enemy.prototype.initMembers = function () {
    _Game_Enemy_initMembers.call(this);
    this._lp = 1;
  };

  // 戦闘終了時にLPが残っていれば復活
  const _BattleManager_endBattle = BattleManager.endBattle;
  BattleManager.endBattle = function (result) {
    _BattleManager_endBattle.call(this, result);
    if (result === 0 || this._escaped) {
      $gameParty.members().forEach((member) => {
        if (member.lp() > 0) {
          member.revive();
        }
      });
    }
  };

  // ポップアップ処理の調整
  const _Sprite_Battler_createDamageSprite =
    Sprite_Battler.prototype.createDamageSprite;
  Sprite_Battler.prototype.createDamageSprite = function () {
    _Sprite_Battler_createDamageSprite.apply(this);
    const result = this._battler.result();
    if (result.lpDamage != 0) {
      const last = this._damages[this._damages.length - 1];
      const sprite = new Sprite_Damage();
      sprite.x = last.x;
      sprite.y = last.y - 40;
      sprite.setupLpBreak(this._battler);
      this._damages.push(sprite);
      this.parent.addChild(sprite);
    } else if (this._battler.isDead()) {
      const sprite = new Sprite_Damage();
      sprite.x = this.x;
      sprite.y = this.y;
      sprite.setupLpBreak(this._battler);
      this._damages.push(sprite);
      this.parent.addChild(sprite);
    }
  };

  // LP減少の表示
  Sprite_Damage.prototype.setupLpBreak = function (target) {
    const result = target.result();
    this._colorType = result.lpDamage >= 0 ? 2 : 3;
    this.createDigits(result.lpDamage);
  };

  const _Window_BattleLog_prototype_displayDamage =
    Window_BattleLog.prototype.displayDamage;
  Window_BattleLog.prototype.displayDamage = function (target) {
    _Window_BattleLog_prototype_displayDamage.call(this, target);
    if (target.result().lpDamage > 0 && target.isActor()) {
      this.push(
        "addText",
        LPBreakMessage(target.name(), target.result().lpDamage)
      );
    } else if (target.result().lpDamage < 0 && target.isActor()) {
      this.push(
        "addText",
        LPGainMessage(target.name(), target.result().lpDamage)
      );
    }
  };

  // LPをウィンドウに描画

  // LPゲージタイプの定義
  const GAUGE_TYPE_LP = "lp";

  // Sprite_Gaugeの拡張
  const _Sprite_Gauge_initMembers = Sprite_Gauge.prototype.initMembers;
  Sprite_Gauge.prototype.initMembers = function () {
    _Sprite_Gauge_initMembers.call(this);
    this._lpColor1 = ColorManager.textColor(21); // LPゲージの色1（濃い色）
    this._lpColor2 = ColorManager.textColor(22); // LPゲージの色2（薄い色）
  };

  const _Sprite_Gauge_setup = Sprite_Gauge.prototype.setup;
  Sprite_Gauge.prototype.setup = function (battler, statusType) {
    _Sprite_Gauge_setup.call(this, battler, statusType);
    if (statusType === GAUGE_TYPE_LP) {
      this._value = battler.lp();
      this._maxValue = battler.mlp;
      this._statusType = GAUGE_TYPE_LP;
    }
  };

  const _Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;
  Sprite_Gauge.prototype.currentValue = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._battler.lp();
    }
    return _Sprite_Gauge_currentValue.call(this);
  };

  const _Sprite_Gauge_currentMaxValue = Sprite_Gauge.prototype.currentMaxValue;
  Sprite_Gauge.prototype.currentMaxValue = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._battler.mlp;
    }
    return _Sprite_Gauge_currentMaxValue.call(this);
  };

  const _Sprite_Gauge_gaugeColor1 = Sprite_Gauge.prototype.gaugeColor1;
  Sprite_Gauge.prototype.gaugeColor1 = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._lpColor1;
    }
    return _Sprite_Gauge_gaugeColor1.call(this);
  };

  const _Sprite_Gauge_gaugeColor2 = Sprite_Gauge.prototype.gaugeColor2;
  Sprite_Gauge.prototype.gaugeColor2 = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._lpColor2;
    }
    return _Sprite_Gauge_gaugeColor2.call(this);
  };

  const _Sprite_Gauge_label = Sprite_Gauge.prototype.label;
  Sprite_Gauge.prototype.label = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return TextManager.lpA;
    }
    return _Sprite_Gauge_label.call(this);
  };

  // Window_StatusBaseの拡張
  const _Window_StatusBase_placeGauge = Window_StatusBase.prototype.placeGauge;
  Window_StatusBase.prototype.placeGauge = function (actor, type, x, y) {
    _Window_StatusBase_placeGauge.call(this, actor, type, x, y);
    if (type === GAUGE_TYPE_LP) {
      const key = "actor%1-gauge-%2".format(actor.actorId(), type);
      const sprite = this.createInnerSprite(key, Sprite_Gauge);
      sprite.setup(actor, type);
      sprite.move(x, y);
      sprite.show();
    }
  };

  // Window_StatusのdrawBlockの拡張（ステータス画面にLPゲージを追加）
  const _Window_Status_drawBlock2 = Window_Status.prototype.drawBlock2;
  Window_Status.prototype.drawBlock2 = function (y) {
    const lineHeight = this.lineHeight();
    const gaugeY = y + lineHeight;
    this.placeGauge(this._actor, GAUGE_TYPE_LP, 0, gaugeY);
    _Window_Status_drawBlock2.call(this, y + lineHeight); // 他のゲージの位置を下にずらす
  };

  const _Window_StatusBase_prototype_placeBasicGauges =
    Window_StatusBase.prototype.placeBasicGauges;
  Window_StatusBase.prototype.placeBasicGauges = function (actor, x, y) {
    _Window_StatusBase_prototype_placeBasicGauges.apply(this, arguments);
    // LP描画を追加
    this.placeGauge(actor, "lp", x, y + this.gaugeLineHeight() * 2);
  };

  // 移動中のアイテム処理

  // LPが減っていればLP回復アイテムを使用可能にする
  const Game_Action_prototype_testApply = Game_Action.prototype.testApply;
  Game_Action.prototype.testApply = function (target) {
    if (
      (this.item().meta["LP_Recover"] > 0 && target.lp() < target.mlp) ||
      this.item().meta["LP_Recover"] < 0
    ) {
      return true;
    }
    return Game_Action_prototype_testApply.call(this, target);
  };

  // 戦闘ステータスの座標上げ
  const _Window_BattleStatus_basicGaugesY =
    Window_BattleStatus.prototype.basicGaugesY;
  Window_BattleStatus.prototype.basicGaugesY = function (rect) {
    return (
      _Window_BattleStatus_basicGaugesY.apply(this, arguments) -
      this.gaugeLineHeight()
    );
  };

  // TextManagerにLPの略称を追加
  TextManager.lpA = "LP";
})();
