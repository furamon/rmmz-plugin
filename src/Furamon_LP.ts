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
// 2024/12/29 1.0.6 戦闘開始時にもLPが残っていれば復活するよう修正。
// 2025/01/03 1.1.0 コンボボックスをテキストモードにして変数をいれる機能を追加。
//                  競合を起きにくく調整。
// 2025/01/26 1.2.0 かかるとLPが増減するステートを設定可能に。
// 2025/02/16 1.2.1 1行だけリファクタ
// 2025/02/21 1.3.0 現在値の色をLP値に連動させた。
//                  オーバーキル時もダメージ音を鳴らすようにした。
//                  吸収攻撃時にLPダメージの嘘ポップアップが出る不具合修正。
// 2025/02/22 1.4.0 戦闘後LPが残っていればHP全快処理追加。
//                  途中セーブへも適用可能に。
//                  リファクタリング。
// 2025/02/23 1.4.1 Lvアップ時LPが全快する不具合修正。
//                  Game_Action.prototype.applyを書き換えることの明記。
//                  並びにNRP_StateExより前に置くとあちらが動かなくなるので順番明記。
//                  NRP_SkillRangeEX.jsとの競合処理を追加。
// 2025/02/23 1.4.2 LP増減ステートでLPが0になるとLPが最大値になってしまうひっどい不具合修正。
// 2025/02/25 1.5.0 TypeScriptに移行。

/*:
 * @target MZ
 * @plugindesc 戦闘不能に関わるライフポイントを実装します。
 * @author Furamon
 * @orderAfter NRP_StateEx
 *
 * @help 戦闘不能に関わるライフポイントを実装します。
 *
 * - アクターが戦闘不能になった際に、LPが1削れる
 * - 戦闘不能のアクターが複数対象攻撃に巻き込まれた場合もLPが1削れる
 * - LPが残っていれば戦闘不能アクターに対して回復スキルを使用できる
 * - プラグインパラメータの「戦闘後全快」ONで戦闘終了後LPが残っていればHPが全快する
 *
 * プラグインパラメータにLPの計算式を入れてください。
 *
 * スキルのメモ欄に<LP_Recover:x>を記入すると、使った対象のLPを回復するスキルやアイテムが作れます。
 * スキルのメモ欄に<LP_Cost:x>を記入すると、LPを消費するスキルが作れます。身を削る大技かなんかに。
 * ステートのメモ欄に<LP_Gain:x>を記入すると、そのステートにかかるとLPが増減します。
 * アクター、職業、装備、ステートのメモ欄に<LP_Bonus:x>を記入すると、最大LPを増減できます。
 * プラグインコマンドでLPの増減もできます。
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * Game_Action.prototype.applyを盛大に書き換えます。可能な限り下の方で運用したほうが競合しないと思います。
 * 参考までに、例えばNRP_StateExより前においてしまうとあちらのステート拡張が機能しなくなります。
 *
 * 描画の際はTP欄を潰すため、「TPを表示」をオフにしてください。
 * もしTPを使っている場合はご容赦いただくか、ほかのプラグインでなんとかしてください。（丸投げ）
 * actor._lpで取得できるはずです。
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
 * テキストで変数($gameVariables)も使えます。
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
 * @default 3 + a.level / 6
 * @desc アクターの最大LPです。
 * 例: 3 + a.level / 6
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
 *
 * @param BattleEndRecover
 * @text 戦闘後全快？
 * @type boolean
 * @default false
 * @desc 戦闘後LPが残っていればHPが全回復します。
 *
 */
const PLUGIN_NAME = "Furamon_LP";
const parameters = PluginManager.parameters(PLUGIN_NAME);
const prmMaxLP = parameters["MaxLP"];
const prmLPBreakMessage = parameters["LPBreakMessage"];
const prmLPGainMessage = parameters["LPGainMessage"];
const prmBattleEndRecover = parameters["BattleEndRecover"];

(function () {
  // プラグインコマンド
  PluginManager.registerCommand(PLUGIN_NAME, "growLP", function (args: any) {
    const actorId = eval(args.actor);
    const value = eval(args.value);
    const actor = $gameActors.actor(actorId);

    if (!value) return;

    // アクターの指定があれば
    if (actor) {
      gainLP(actor, value);
      return;
    }

    // アクター指定がなければ全員
    $gameParty.members().forEach((actor: any) => {
      gainLP(actor, value);
    });
  });

  // パラメータ追加
  Object.defineProperties(Game_Actor.prototype, {
    lp: {
      get: function () {
        return this._lp;
      },
      configurable: true,
    },
  });

  // バトルメッセージ初期化
  function LPBreakMessage(actor: any, point: any) {
    const message = prmLPBreakMessage || "%1は%2のLPを失った！！";
    return message.toString().replace("%1", actor).replace("%2", point);
  }

  function LPGainMessage(actor: any, point: any) {
    const message = prmLPGainMessage || "%1は%2LP回復した！";
    return message.toString().replace("%1", actor).replace("%2", point);
  }

  // LPを増減させるメソッド
  function gainLP(actor: any, value: any) {
    actor._lp = (actor._lp + value).clamp(0, actor.mlp);
  }

  // LP監視関数。LPが0なら戦闘不能に
  function lpUpdate() {
    const deadActor = $gameParty
      .aliveMembers()
      .filter((member: any) => member.lp <= 0);
    if (deadActor.length > 0) {
      deadActor.map((member: any) => member.addNewState(1)); // ﾃｰﾚｯﾃｰ
    }
  }

  // ロード時に必要ならLPを初期化
  const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
  Game_System.prototype.onAfterLoad = function () {
    _Game_System_onAfterLoad.call(this);

    $gameParty.members().forEach((member: any) => {
      if (member.lp == 0) {
        member.maxLPSet();
        member.recoverLP();
      }
    });
  };

  // 最大LPを設定するメソッド
  // <LP_Bonus>を持ったオブジェクトを持ったアクターはMaxLP増やす
  Game_Actor.prototype.maxLPSet = function () {
    const a = this; // 参照用
    const objects = this.traitObjects().concat(this.skills() as any);
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
    this._lp = Math.min(this.lp, this.mlp);
  };

  // LPの全回復
  Game_Actor.prototype.recoverLP = function () {
    this._lp = this.mlp;
  };

  // 装備やステートなどの更新時にMaxLPも更新
  const _Game_Actor_refresh = Game_Actor.prototype.refresh;
  Game_Actor.prototype.refresh = function () {
    _Game_Actor_refresh.call(this);
    this.maxLPSet();
    if (this.lp == null) {
      this.recoverLP();
    }
  };

  // レベルアップ時必要ならMaxLPを更新
  const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
  Game_Actor.prototype.levelUp = function () {
    _Game_Actor_levelUp.call(this);
    this.maxLPSet(); // MaxLPを設定する
  };

  // ターゲット選択にLPを組み込む
  Game_Unit.prototype.smoothTarget = function (index: any) {
    const member = this.members()[Math.max(0, index)];
    return (member.isActor() && member._lp > 0) || member.isAlive()
      ? member
      : this.aliveMembers()[0];
  };

  // 攻撃対象選択にLPを組み込む
  const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
  Game_Action.prototype.makeTargets = function () {
    let targets = _Game_Action_makeTargets.call(this);

    // NRP_SkillRangeEX.js考慮処理
    if (PluginManager._scripts.includes("NRP_SkillRangeEX")) {
      targets = BattleManager.rangeEx(this, targets); // スキル範囲を拡張したターゲットの配列を取得
    }

    // 対象がアクターでLPが0ならターゲットから除外
    targets = targets.filter(
      (target: any) => target.isEnemy() || (target.isActor() && target.lp > 0)
    );

    // 敵側の全体攻撃の場合、戦闘不能アクターも強制的に追加
    if (this.subject().isEnemy() && this.item()?.scope === 2) {
      targets = targets.filter(
        (member: any) => member.isAlive() || member.isDead()
      );
    }

    return targets;
  };

  // 戦闘不能時のLP減少処理
  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target: any) {
    let resurrect = false; // 蘇生か？

    // LPが残っているなら戦闘不能回復
    if (target.lp > 0 && target.isDead() && this.isHpRecover()) {
      target.removeState(1);
      resurrect = true;
    }

    _Game_Action_apply.call(this, target);

    // 蘇生時に勝手にHPが1回復するためつじつまを合わせる。
    // 全回復ならそのまま。
    if (resurrect && -target.result().hpDamage < target.mhp) {
      target._hp -= 1;
    }

    // LP減少処理
    if (target.hp === 0 && (this.isDamage() || this.isDrain())) {
      target.result().lpDamage = target.lp > 0 ? 1 : 0;
      gainLP(target, -1);
      // なぜかここでもGame_Action.prototype.applyが呼ばれるらしく
      // 吸収攻撃をした場合「0のダメージと自己回復」と解釈され
      // LPダメージのポップアップが出てしまう。
      // なのでthis.isDamage()を判定に追加。
      if (!target.result().hpAffected && this.isDamage()) {
        // 強制的にポップアップを表示
        target.startDamagePopup();
        SoundManager.playActorDamage();
      }
    } else {
      target.result().lpDamage = 0;
    }

    // <LP_Recover>指定があるなら増減
    const lpRecover = String(this.item()?.meta["LP_Recover"] || null);
    if (lpRecover != null) {
      const recoverValue = Math.floor(eval(lpRecover));
      // // 対象が敵なら即死させる
      // if (target.isEnemy()) {
      //   this.executeHpDamage(target, target.hp);
      //   return;
      // }
      gainLP(target, recoverValue);
      target.result().lpDamage = -recoverValue;
    }

    lpUpdate();
  };

  // LP増減ステート
  const _Game_Actor_addNewState = Game_Actor.prototype.addNewState;
  Game_Actor.prototype.addNewState = function (stateId: any) {
    _Game_Actor_addNewState.call(this, stateId);
    const state = $dataStates[stateId];
    const lpGain = state.meta["LP_Gain"];
    if (lpGain) {
      gainLP(this, Number(lpGain));
    }
  };

  // 負のHP再生で戦闘不能時の処理
  const _Game_Actor_regenerateHp = Game_Actor.prototype.regenerateHp;
  Game_Actor.prototype.regenerateHp = function () {
    _Game_Actor_regenerateHp.call(this);
    if (this.hp === 0) {
      gainLP(this, -1);
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
  const _Game_Actor_canPaySkillCost = Game_Actor.prototype.canPaySkillCost;
  Game_Actor.prototype.canPaySkillCost = function (skill: any) {
    // アクターのみ対象
    if (this.isActor()) {
      const LPCost = skill.meta["LP_Cost"];
      if (LPCost) {
        return (
          _Game_Actor_canPaySkillCost.call(this, skill) && this._lp > LPCost
        );
      }
    }
    return _Game_Actor_canPaySkillCost.call(this, skill);
  };

  // LP消費
  const _Game_Actor_paySkillCost = Game_Actor.prototype.paySkillCost;
  Game_Actor.prototype.paySkillCost = function (skill: any) {
    _Game_Actor_paySkillCost.call(this, skill);

    // アクターのみ対象
    if (this.isActor()) {
      const LPCost = skill.meta["LP_Cost"];
      if (LPCost) {
        gainLP(this, -LPCost);
      }
    }
  };

  const _BattleManager_startInput = BattleManager.startInput;
  BattleManager.startInput = function () {
    _BattleManager_startInput.call(this);
    lpUpdate();
  };

  // 戦闘開始時にLPが残っていれば復活
  const _BattleManager_setup = BattleManager.setup;
  BattleManager.setup = function (
    troopId: number,
    canEscape: boolean,
    canLose: boolean
  ) {
    _BattleManager_setup.call(this, troopId, canEscape, canLose);

    $gameParty.members().forEach((member: any) => {
      if (member._lp > 0) {
        member.revive();
      }
    });
  };

  // 戦闘終了時にもLPが残っていれば復活
  // 設定に応じてHP全回復
  const _BattleManager_endBattle = BattleManager.endBattle;
  BattleManager.endBattle = function (result: any) {
    _BattleManager_endBattle.call(this, result);
    if (result === 0 || this._escaped) {
      $gameParty.members().forEach((member: any) => {
        if (member._lp > 0) {
          member.revive();
          if (prmBattleEndRecover) {
            member.setHp(member.mhp);
          }
        }
      });
    }
  };

  // ポップアップ処理の調整
  const _Sprite_Battler_createDamageSprite =
    Sprite_Battler.prototype.createDamageSprite;
  Sprite_Battler.prototype.createDamageSprite = function () {
    _Sprite_Battler_createDamageSprite.call(this);
    const battler = this._battler;
    if (battler) {
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
    }
  };

  // LP減少の表示

  Sprite_Damage.prototype.setupLpBreak = function (target: any) {
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
      return _Sprite_Damage_damageColor.call(this);
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
    _Sprite_Damage_update.call(this);
  };

  const _Window_BattleLog_displayDamage =
    Window_BattleLog.prototype.displayDamage;

  Window_BattleLog.prototype.displayDamage = function (target: any) {
    _Window_BattleLog_displayDamage.call(this, target);
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

    this._lpTextColorMax = ColorManager.textColor(0); // 最大LP時のテキスト色

    this._lpTextColorZero = ColorManager.textColor(18); // LPが0の時のテキスト色

    this._lpTextColorNormal = ColorManager.textColor(17); // 通常時のテキスト色
  };

  const _Sprite_Gauge_setup = Sprite_Gauge.prototype.setup;

  Sprite_Gauge.prototype.setup = function (battler: any, statusType: any) {
    _Sprite_Gauge_setup.call(this, battler, statusType);
    if (statusType === GAUGE_TYPE_LP) {
      this._value = battler._lp;
      this._maxValue = battler.mlp;
      this._statusType = GAUGE_TYPE_LP;
    }
  };

  const _Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;

  Sprite_Gauge.prototype.currentValue = function () {
    if (this._statusType === GAUGE_TYPE_LP && this._battler?.isActor()) {
      return this._battler?._lp;
    }

    return _Sprite_Gauge_currentValue.call(this);
  };

  const _Sprite_Gauge_currentMaxValue = Sprite_Gauge.prototype.currentMaxValue;

  Sprite_Gauge.prototype.currentMaxValue = function () {
    if (this._statusType === GAUGE_TYPE_LP && this._battler?.isActor()) {
      return this._battler?.mlp;
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
      return "LP";
    }
    return _Sprite_Gauge_label.call(this);
  };

  const _Sprite_Gauge_valueColor = Sprite_Gauge.prototype.valueColor;

  Sprite_Gauge.prototype.valueColor = function () {
    if (this._statusType === GAUGE_TYPE_LP) {
      if (this._value === this._maxValue) {
        return this._lpTextColorMax; // 最大値の場合
      } else if (this._value === 0) {
        return this._lpTextColorZero; // 0の場合
      } else {
        return this._lpTextColorNormal; // それ以外の場合
      }
    }
    return _Sprite_Gauge_valueColor.call(this);
  };

  // Window_StatusBaseの拡張

  const _Window_StatusBase_placeGauge = Window_StatusBase.prototype.placeGauge;

  Window_StatusBase.prototype.placeGauge = function (
    actor: any,
    type: any,
    x: any,
    y: any
  ) {
    _Window_StatusBase_placeGauge.call(this, actor, type, x, y);
    if (type === GAUGE_TYPE_LP) {
      const key = "actor%1-gauge-%2".format(actor.actorId(), type);

      const sprite = this.createInnerSprite(key, Sprite_Gauge) as Sprite_Gauge;
      sprite.setup(actor, type);
      sprite.move(x, y);
      sprite.show();
    }
  };

  // Window_StatusのdrawBlockの拡張（ステータス画面にLPゲージを追加）

  const _Window_Status_drawBlock2 = Window_Status.prototype.drawBlock2;

  Window_Status.prototype.drawBlock2 = function (y: any) {
    if (this._actor) {
      const lineHeight = this.lineHeight();
      const gaugeY = y + lineHeight;
      this.placeGauge(this._actor, GAUGE_TYPE_LP, 0, gaugeY);
      _Window_Status_drawBlock2.call(this, y + lineHeight); // 他のゲージの位置を下にずらす
    }
  };

  const _Window_StatusBase_placeBasicGauges =
    Window_StatusBase.prototype.placeBasicGauges;

  Window_StatusBase.prototype.placeBasicGauges = function (
    actor: any,
    x: any,
    y: any
  ) {
    _Window_StatusBase_placeBasicGauges.call(this, actor, x, y);
    // LP描画を追加
    this.placeGauge(actor, "lp", x, y + this.gaugeLineHeight() * 2);
  };

  // 移動中のアイテム処理

  // LPが減っていればLP回復アイテムを使用可能にする
  const Game_Action_testApply = Game_Action.prototype.testApply;
  Game_Action.prototype.testApply = function (target: any) {
    const lpRecover = Number(this.item()?.meta["LP_Recover"]);
    if ((lpRecover > 0 && target._lp < target.mlp) || lpRecover < 0) {
      return true;
    }
    return Game_Action_testApply.call(this, target);
  };

  // 戦闘ステータスの座標上げ
  const _Window_BattleStatus_basicGaugesY =
    Window_BattleStatus.prototype.basicGaugesY;

  Window_BattleStatus.prototype.basicGaugesY = function (rect: any) {
    return (
      _Window_BattleStatus_basicGaugesY.call(this, rect) -
      this.gaugeLineHeight()
    );
  };
})();
