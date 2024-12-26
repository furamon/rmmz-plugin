//------------------------------------------------------------------------------
// Furamon_LP.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2024/12/14 1.0.0-Beta 非公開作成
// 2024/12/15 1.0.0 公開！
// 2024/12/16 1.0.1 <LP_Bonus>が負の値の時の処理を追加。
// 2024/12/19 1.0.2 回復量のつじつま合わせ処理を修正。
//                  LP減少のポップアップ処理をアクターのみに。
//                  戦闘不能にされた際（HPダメージと同時）のLP減少ポップアップを遅延させる処理追加。
//                  NRP_DynamicReturningAction.jsとの競合処理を追加。
// 2024/12/21 1.0.3 全体攻撃でオーバーキルされたときにLPがマイナスになってしまうひでえ不具合修正。
// 2024/12/23 1.0.4 敵に範囲が味方全体（つまり敵が敵グループ自身へ）のスキルを使わせるとアクター側を対象にしてしまうひっどい不具合修正。
// 2024/12/27 1.0.5 味方側全体回復で戦闘不能メンバーを復活できるよう修正。

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
    actor._lp = (actor._lp + value).clamp(0, actor.mlp);
  }

  // LP監視関数。LPが0なら戦闘不能に
  function lpUpdate() {
    const deadActor = $gameParty
      .aliveMembers()
      .filter((member) => member._lp <= 0);
    if (deadActor.length > 0) {
      deadActor.map((member) => member.addNewState(1)); // ﾃｰﾚｯﾃｰ
    }
  }

  // 新しいプロパティを追加するための前処理
  const _Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
  Game_BattlerBase.prototype.initMembers = function () {
    _Game_BattlerBase_initMembers.apply(this, arguments);
    // 独立したライフポイント（LP）を追加
    this._lp = 1;
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
      this.mlp = Math.max(Math.floor(eval(prmMaxLP)) + bonusLP, 0);
    } else {
      this.mlp = Math.floor(eval(prmMaxLP));
    }
    this._lp = Math.min(this._lp, this.mlp);
  };

  // 装備やステートなどの更新時にMaxLPも更新
  const _Game_Actor_prototype_refresh = Game_Actor.prototype.refresh;
  Game_Actor.prototype.refresh = function () {
    _Game_Actor_prototype_refresh.apply(this, arguments);
    this.maxLPSet();
  };

  const _Game_Actor_prototype_setup = Game_Actor.prototype.setup;
  Game_Actor.prototype.setup = function (actorId) {
    _Game_Actor_prototype_setup.apply(this, arguments, actorId);
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
    _DataManager_setupNewGame.apply(this, arguments);
    $gameParty.members().forEach((actor) => actor.initLP());
  };

  // レベルアップ時必要ならMaxLPを更新
  const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
  Game_Actor.prototype.levelUp = function () {
    _Game_Actor_levelUp.apply(this, arguments);
    this.maxLPSet(); // MaxLPを設定する
  };

  // ターゲット選択にLPを組み込む
  Game_Unit.prototype.smoothTarget = function (index) {
    const member = this.members()[Math.max(0, index)];
    return member && (member._lp > 0 || member.isAlive())
      ? member
      : this.aliveMembers()[0];
  };

  // 攻撃対象選択にLPを組み込む
  const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
  Game_Action.prototype.makeTargets = function () {
    let targets = _Game_Action_makeTargets.apply(this, arguments);

    // 対象のLPが0ならターゲットから除外
    targets = targets.filter((target) => target._lp > 0);

    // 敵側の全体攻撃の場合、戦闘不能アクターも強制的に追加
    if (this.subject().isEnemy() && this._item.scope === 2) {
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
    if (target._lp > 0 && target.isDead() && this.isHpRecover()) {
      target.removeState(1);
      resurrect = true;
    }

    _Game_Action_apply.apply(this, arguments, target);

    // 蘇生時に勝手にHPが1回復するためつじつまを合わせる。
    // 全回復ならそのまま。
    if (resurrect && -target.result().hpDamage < target.mhp) {
      target._hp -= 1;
    }

    // LP減少処理
    if (target.isDead() && (this.isDamage() || this.isDrain())) {
      target.result().lpDamage = target._lp > 0 ? 1 : 0;
      gainLP(target, -1);
      if (!target.result().hpAffected) {
        // 強制的にポップアップを表示
        target.startDamagePopup();
      }
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
        gainLP(target, -1);
        target.result().lpDamage = 1;
        return;
      }
      gainLP(target, recoverValue);
      target.result().lpDamage = -recoverValue;
    }

    lpUpdate();
  };

  // 負のHP再生で戦闘不能時の処理
  const _Game_Battler_regenerateHp = Game_Battler.prototype.regenerateHp;
  Game_Battler.prototype.regenerateHp = function (n) {
    _Game_Battler_regenerateHp.apply(this, arguments);
    if (this.isDead()) {
      gainLP(this,-1)
      this.result().lpDamage = 1;
      // NRP_DynamicReturningAction.jsの再生待ち組み込み
      const _parameters = PluginManager.parameters(
        "NRP_DynamicReturningAction"
      );
      if (_parameters["WaitRegeneration"] === "true" || true) {
        this._regeneDeath = true;
      }
    }
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
      const LPCost = skill.meta["LP_Cost"];
      if (LPCost) {
        gainLP(this,-LPCost)
      }
    }
  };

  const _BattleManager_startInput = BattleManager.startInput;
  BattleManager.startInput = function () {
    _BattleManager_startInput.apply(this, arguments);
    lpUpdate();
  };

  // エネミーは最大LP1で固定
  const _Game_Enemy_initMembers = Game_Enemy.prototype.initMembers;
  Game_Enemy.prototype.initMembers = function () {
    _Game_Enemy_initMembers.apply(this, arguments);
    this._lp = 1;
  };

  // 戦闘終了時にLPが残っていれば復活
  const _BattleManager_endBattle = BattleManager.endBattle;
  BattleManager.endBattle = function (result) {
    _BattleManager_endBattle.apply(this, arguments, result);
    if (result === 0 || this._escaped) {
      $gameParty.members().forEach((member) => {
        if (member._lp > 0) {
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
    const battler = this._battler;
    if (battler.result().lpDamage != 0 && battler.isActor()) {
      // 負の再生ダメージで死んだ、かつ
      // NRP_DynamicReturningAction.jsの再生待ちがONの場合の処理。
      // 苦肉の策として処理を移植。
      if (battler._regeneDeath) {
        const hpDamage = this._damages[this._damages.length - 1];
        hpDamage._isRegenerationWait = true;
        hpDamage._spriteBattler = this;
        hpDamage.visible = false;
        const firstSprite = this._damages[0];
        hpDamage._diffX = hpDamage.x - firstSprite.x;
        hpDamage._diffY = hpDamage.y - firstSprite.y;
      }
      const last = this._damages[this._damages.length - 1];
      const lpDamage = new Sprite_Damage();
      lpDamage.setupLpBreak(battler);
      lpDamage.x = last.x;
      lpDamage.y = last.y;
      lpDamage._spriteBattler = this;
      this._damages.push(lpDamage);
      this.parent.addChild(lpDamage);
    }
  };

  // LP減少の表示
  Sprite_Damage.prototype.setupLpBreak = function (target) {
    const result = target.result();
    this._lpDamage = result.lpDamage;
    // HPダメージと同時ならディレイ
    this._delay = result.hpAffected ? 90 : 0;
    this.visible = false;
    this.createDigits(result.lpDamage);
  };

  const _Sprite_Damage_damageColor = Sprite_Damage.prototype.damageColor;
  Sprite_Damage.prototype.damageColor = function () {
    if (!this._lpDamage) {
      return _Sprite_Damage_damageColor.apply(this, arguments);
    } else {
      const color = this._lpDamage > 0 ? "#ff2020" : "#2020ff";
      return color;
    }
  };

  const _Sprite_Damage_update = Sprite_Damage.prototype.update;
  Sprite_Damage.prototype.update = function () {
    // NRP_DynamicReturningAction.jsとの競合処理。
    // 帰還後にthis.visibleがtrueになってしまうため、
    // こちら側で上書きしておく。
    if (PluginManager.parameters("NRP_DynamicReturningAction")) {
      this.visible = false;
    }
    if (this._delay > 0) {
      this._delay--;
      return;
    }
    this.visible = true;
    _Sprite_Damage_update.apply(this, arguments);
  };

  const _Window_BattleLog_prototype_displayDamage =
    Window_BattleLog.prototype.displayDamage;
  Window_BattleLog.prototype.displayDamage = function (target) {
    _Window_BattleLog_prototype_displayDamage.apply(this, arguments, target);
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
    _Sprite_Gauge_initMembers.apply(this, arguments);
    this._lpColor1 = ColorManager.textColor(21); // LPゲージの色1（濃い色）
    this._lpColor2 = ColorManager.textColor(22); // LPゲージの色2（薄い色）
  };

  const _Sprite_Gauge_setup = Sprite_Gauge.prototype.setup;
  Sprite_Gauge.prototype.setup = function (battler, statusType) {
    _Sprite_Gauge_setup.apply(this, arguments, battler, statusType);
    if (statusType === GAUGE_TYPE_LP) {
      this._value = battler._lp;
      this._maxValue = battler.mlp;
      this._statusType = GAUGE_TYPE_LP;
    }
  };

  const _Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;
  Sprite_Gauge.prototype.currentValue = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._battler._lp;
    }
    return _Sprite_Gauge_currentValue.apply(this, arguments);
  };

  const _Sprite_Gauge_currentMaxValue = Sprite_Gauge.prototype.currentMaxValue;
  Sprite_Gauge.prototype.currentMaxValue = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._battler.mlp;
    }
    return _Sprite_Gauge_currentMaxValue.apply(this, arguments);
  };

  const _Sprite_Gauge_gaugeColor1 = Sprite_Gauge.prototype.gaugeColor1;
  Sprite_Gauge.prototype.gaugeColor1 = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._lpColor1;
    }
    return _Sprite_Gauge_gaugeColor1.apply(this, arguments);
  };

  const _Sprite_Gauge_gaugeColor2 = Sprite_Gauge.prototype.gaugeColor2;
  Sprite_Gauge.prototype.gaugeColor2 = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return this._lpColor2;
    }
    return _Sprite_Gauge_gaugeColor2.apply(this, arguments);
  };

  const _Sprite_Gauge_label = Sprite_Gauge.prototype.label;
  Sprite_Gauge.prototype.label = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      return TextManager.lpA;
    }
    return _Sprite_Gauge_label.apply(this, arguments);
  };

  // Window_StatusBaseの拡張
  const _Window_StatusBase_placeGauge = Window_StatusBase.prototype.placeGauge;
  Window_StatusBase.prototype.placeGauge = function (actor, type, x, y) {
    _Window_StatusBase_placeGauge.apply(this, arguments, actor, type, x, y);
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
    _Window_Status_drawBlock2.apply(this, arguments, y + lineHeight); // 他のゲージの位置を下にずらす
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
      (this.item().meta["LP_Recover"] > 0 && target._lp < target.mlp) ||
      this.item().meta["LP_Recover"] < 0
    ) {
      return true;
    }
    return Game_Action_prototype_testApply.apply(this, arguments, target);
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
