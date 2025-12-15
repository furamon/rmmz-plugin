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
// 2025/02/27 1.5.1 LPダメージ時のポップアップが出なくなっていた不具合修正。
//                  LP回復でエラー落ちするひどい不具合を修正。
// 2025/02/28 1.5.2 ニューゲーム時にLP初期化がされないひどい不具合修正。
// 2025/03/16 1.5.3 1.5.2の修正に残念なミスが合ったので再修正。
//                  NRP_CalcResultFirst.jsとの競合処理を追加。
//                  HP全快処理を戦闘前にも挟んだ。
// 2025/03/16 1.5.4 競合処理を微修正。
// 2025/05/10 1.5.5 リファクタリング。
// 2025/09/09 1.5.6 HP回復がフェードアウト中にチラ見えするの修正。
// 2025/09/12 1.5.7 戦闘開始時にもHPが回復するよう戻した。
// 2025/09/15 1.5.8 リファクタリング。
// 2025/10/24 1.6.0 LP0時に指定ステートを付加する機能を追加。
//                  戦闘不能でも勝利モーション優先と全滅時は戦闘不能モーションを強制する機能を追加。

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
 * - プラグインパラメータの「戦闘後全快」ONで戦闘終了後、
 * LPが残っていればHPが全快する
 *
 * プラグインパラメータにLPの計算式を入れてください。
 *
 * - スキルのメモ欄に<LP_Recover:x>を記入すると、
 * 使った対象のLPを回復するスキルやアイテムが作れます。
 * - スキルのメモ欄に<LP_Cost:x>を記入すると、LPを消費するスキルが作れます。
 * 身を削る大技かなんかに。
 * - ステートのメモ欄に<LP_Gain:x>を記入すると、
 * そのステートにかかるとLPが増減します。
 * -アクター、職業、装備、ステートのメモ欄に<LP_Bonus:x>を記入すると、
 * 最大LPを増減できます。
 * - プラグインコマンドでLPの増減もできます。
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * Game_Action.prototype.applyを盛大に書き換えます。
 * 可能な限り下の方で運用したほうが競合しないと思います。
 * 参考までに、例えばNRP_StateExより前においてしまうと
 * あちらのステート拡張が機能しなくなります。
 *
 * 描画の際はTP欄を潰すため、「TPを表示」をオフにしてください。
 * もしTPを使っている場合はご容赦いただくか、
 * ほかのプラグインでなんとかしてください。（丸投げ）
 * actor.lpで取得できるはずです。
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
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
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
 * @param LPZeroStateId
 * @text LP0時付加ステート
 * @type state
 * @default 0
 * @desc LPが0になったときに自動で付加するステート。0なら付加しません。
 *
 * @param PreferVictoryOnDeadIfLP
 * @text 戦闘不能でも勝利モーション優先
 * @type boolean
 * @default true
 * @desc 戦闘終了時、LPが残っているなら戦闘不能状態でも勝利モーションを優先します。
 *
 * @param ForceCollapseOnWipe
 * @text 全滅時は戦闘不能モーション
 * @type boolean
 * @default true
 * @desc 全滅時は勝利モーションではなく戦闘不能モーションを表示します。
 *
 */
(() => {
  const PLUGIN_NAME = "Furamon_LP";
  const parameters = PluginManager.parameters(PLUGIN_NAME);
  const prmMaxLP = parameters.MaxLP;
  const prmLPBreakMessage = parameters.LPBreakMessage;
  const prmLPGainMessage = parameters.LPGainMessage;
  const prmBattleEndRecover = parameters.BattleEndRecover === "true";
  const prmLPZeroStateId = Number(parameters.LPZeroStateId || 0);
  const prmPreferVictoryOnDeadIfLP =
    parameters.PreferVictoryOnDeadIfLP === "true";
  const prmForceCollapseOnWipe = parameters.ForceCollapseOnWipe === "true";

  type ActorMotionMethods = {
    requestMotion?: (motion: string) => void;
    performVictory?: () => void;
    performCollapse?: () => void;
  };

  type BattleManagerProcessDefeat = {
    processDefeat: () => void;
  };
  // プラグインコマンド
  PluginManager.registerCommand(
    PLUGIN_NAME,
    "growLP",
    (args: { [key: string]: string | true }) => {
      const actorId = Number(args.actor);
      const value = Number(args.value);
      const actor = $gameActors.actor(actorId);

      if (!value) return;

      // アクターの指定があれば
      if (actor) {
        gainLP(actor, value);
        return;
      }

      // アクター指定がなければ全員
      $gameParty.members().forEach((actor: Game_Actor) => {
        gainLP(actor, value);
      });
    },
  );

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
  function LPBreakMessage(actor: Game_Actor, point: string) {
    const message = prmLPBreakMessage || "%1は%2のLPを失った！！";
    return message.toString().replace("%1", actor.name()).replace("%2", point);
  }

  function LPGainMessage(actor: Game_Actor, point: string) {
    const message = prmLPGainMessage || "%1は%2LP回復した！";
    return message.toString().replace("%1", actor.name()).replace("%2", point);
  }

  // LPを増減させるメソッド
  function gainLP(actor: Game_Actor, value: number) {
    actor._lp = (actor.lp + value).clamp(0, actor.mlp);
    lpUpdate();
  }

  // LP監視関数。LPが0なら戦闘不能に
  function lpUpdate() {
    const members = $gameParty
      .members()
      .filter((actor): actor is Game_Actor => actor.isActor());

    members.forEach((actor) => {
      if (actor.lp <= 0) {
        if (actor.isAlive()) {
          actor.addNewState(1); // ﾃｰﾚｯﾃｰ♪
        }
        if (prmLPZeroStateId > 0) {
          actor.addNewState(prmLPZeroStateId);
        }
      } else if (prmLPZeroStateId > 0) {
        actor.removeState(prmLPZeroStateId);
      }
    });
  }

  // ロード時に必要ならLPを初期化
  const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
  Game_System.prototype.onAfterLoad = function () {
    _Game_System_onAfterLoad.call(this);

    $gameParty.members().forEach((member: Game_Actor) => {
      if (member.lp == null) {
        member.maxLPSet();
        member.recoverLP();
      }
    });
  };

  // 最大LPを設定するメソッド
  // <LP_Bonus>を持ったオブジェクトを持ったアクターはMaxLP増やす
  Game_Actor.prototype.maxLPSet = function () {
    // 特徴を持つオブジェクトのmetaデータを抽出
    const objects: MetaObject[] = this.skills()
      .map((skill) => ({
        meta: skill.meta,
      }))
      .concat(this.traitObjects().map((obj) => ({ meta: obj.meta })));

    let bonusLP = 0;

    for (const obj of objects) {
      if (obj.meta.LP_Bonus) {
        bonusLP += Number(obj.meta.LP_Bonus);
      }
    }
    if (bonusLP !== 0) {
      // biome-ignore lint/security/noGlobalEval: プラグインパラメータの式を評価（ローカル実行前提）
      this.mlp = Math.max(Math.floor(eval(prmMaxLP)) + bonusLP, 0);
    } else {
      // biome-ignore lint/security/noGlobalEval: プラグインパラメータの式を評価（ローカル実行前提）
      this.mlp = Math.floor(eval(prmMaxLP));
    }
    if (this.lp != null) this._lp = Math.min(this.lp, this.mlp);
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
  Game_Unit.prototype.smoothTarget = function (index: number) {
    const member = this.members()[Math.max(0, index)];
    return (member.isActor() && member.lp > 0) || member.isAlive()
      ? member
      : this.aliveMembers()[0];
  };

  // 攻撃対象選択にLPを組み込む
  const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
  Game_Action.prototype.makeTargets = function () {
    let targets = _Game_Action_makeTargets.call(this);

    // NRP_SkillRangeEX.js考慮処理
    if (
      PluginManager._scripts.includes("NRP_SkillRangeEX") &&
      this.item()?.meta.RangeEx
    ) {
      targets = BattleManager.rangeEx(this, targets); // スキル範囲を拡張したターゲットの配列を取得
    }
    // 敵側の全体攻撃の場合、戦闘不能アクターも強制的に追加
    else if (this.subject().isEnemy() && this.item()?.scope === 2) {
      targets = this.targetsForDeadAndAlive(this.opponentsUnit());
    }
    // 対象がアクターでLPが0ならターゲットから除外
    targets = targets.filter(
      (target: Game_Battler) =>
        target.isEnemy() || (target.isActor() && target.lp > 0),
    );

    return targets;
  };

  // 戦闘不能でもLPがあるなら回復アイテムを使用可能にする
  // LP回復アイテムの使用判定もここで行う
  const Game_Action_testApply = Game_Action.prototype.testApply;
  Game_Action.prototype.testApply = function (target: Game_Battler) {
    const lpRecover = Number(this.item()?.meta.LP_Recover);
    if (
      target.isActor() &&
      target.lp > 0 &&
      target.isDead() &&
      this.isHpRecover()
    ) {
      // 蘇生フラグ
      target._resurrect = true;
      return true;
    }
    if (
      (target.isActor() && lpRecover > 0 && target.lp < target.mlp) ||
      lpRecover < 0
    ) {
      return true;
    }
    return Game_Action_testApply.call(this, target);
  };

  // 戦闘不能時のLP減少処理
  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target: Game_Battler) {
    // 蘇生
    if (target.isActor() && target._resurrect) {
      target._resurrect = false;
      target.removeState(1);
      // 蘇生時に勝手にHPが1回復するためつじつまを合わせる。
      target._hp -= 1;
    }
    _Game_Action_apply.call(this, target);
    // アクターか？
    if (target.isActor()) {
      // result()だとNRP_CalcResultFirstでクリアされてしまう。
      target._result.lpDamage = 0;

      // LP減少処理
      if (target.hp === 0 && (this.isDamage() || this.isDrain())) {
        target._result.lpDamage += target.lp > 0 ? 1 : 0;
        gainLP(target, -1);
        // なぜかここでもGame_Action.prototype.applyが呼ばれるらしく
        // 吸収攻撃をした場合「0のダメージと自己回復」と解釈され
        // LPダメージのポップアップが出てしまう。
        // なのでthis.isDamage()を判定に追加。
        if (!target._result.hpAffected && this.isDamage()) {
          // 強制的にポップアップを表示
          target.startDamagePopup();
          SoundManager.playActorDamage();
        }
      }
      // <LP_Recover>指定があるなら増減
      const lpRecover = String(this.item()?.meta.LP_Recover || null);
      if (lpRecover != null) {
        // biome-ignore lint/security/noGlobalEval: メモ欄の式を評価（ローカル実行前提）
        const recoverValue = Math.floor(eval(lpRecover));
        gainLP(target, recoverValue);
        target._result.lpDamage -= recoverValue;
      }

      // lpUpdate();
    }
  };

  // LP増減ステート
  const _Game_Actor_addNewState = Game_Actor.prototype.addNewState;
  Game_Actor.prototype.addNewState = function (stateId: number) {
    _Game_Actor_addNewState.call(this, stateId);
    const state = $dataStates[stateId];
    const lpGain = state.meta.LP_Gain;
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
      this._result.lpDamage = 1;
      // NRP_DynamicReturningAction.jsの再生待ち組み込み
      const _parameters = PluginManager.parameters(
        "NRP_DynamicReturningAction",
      );
      if (_parameters.WaitRegeneration === "true") {
        this._regeneDeath = true;
      }
    }
  };

  // LPコストスキル

  // <LP_Cost>指定のスキルのLPコストを払えるか？
  const _Game_Actor_canPaySkillCost = Game_Actor.prototype.canPaySkillCost;
  Game_Actor.prototype.canPaySkillCost = function (skill: MZ.Skill) {
    // アクターのみ対象
    if (this.isActor()) {
      const LPCost = Number(skill.meta.LP_Cost);
      if (LPCost) {
        return (
          _Game_Actor_canPaySkillCost.call(this, skill) && this.lp > LPCost
        );
      }
    }
    return _Game_Actor_canPaySkillCost.call(this, skill);
  };

  // LP消費
  const _Game_Actor_paySkillCost = Game_Actor.prototype.paySkillCost;
  Game_Actor.prototype.paySkillCost = function (skill: MZ.Skill) {
    _Game_Actor_paySkillCost.call(this, skill);

    // アクターのみ対象
    if (this.isActor()) {
      const LPCost = Number(skill.meta.LP_Cost);
      if (LPCost) {
        gainLP(this, -LPCost);
      }
    }
  };

  // const _BattleManager_startInput = BattleManager.startInput;
  // BattleManager.startInput = function () {
  //     _BattleManager_startInput.call(this);
  //     lpUpdate();
  // };

  // 戦闘開始時にLPが残っていれば復活
  // 設定に応じてHP全回復
  const _BattleManager_setup = BattleManager.setup;
  BattleManager.setup = function (
    troopId: number,
    canEscape: boolean,
    canLose: boolean,
  ) {
    _BattleManager_setup.call(this, troopId, canEscape, canLose);

    $gameParty.members().forEach((member: Game_Actor) => {
      if (member.lp > 0) {
        member.revive();
        if (prmBattleEndRecover) {
          member.setHp(member.mhp);
        }
      }
    });
  };

  // 戦闘勝利or逃走時にLPが残っていれば復活
  // 設定に応じてHP全回復
  const _Game_Temp_initialize = Game_Temp.prototype.initialize;
  Game_Temp.prototype.initialize = function () {
    _Game_Temp_initialize.call(this);
    this._justWonBattle = false;
  };

  Game_Temp.prototype.setJustWonBattle = function (value: boolean) {
    this._justWonBattle = value;
  };

  Game_Temp.prototype.isJustWonBattle = function () {
    return this._justWonBattle === true;
  };

  // 戦闘終了時に、フェードアウト後の回復をトリガーするためのフラグを立てる
  const _BattleManager_endBattle = BattleManager.endBattle;
  BattleManager.endBattle = function (result: number) {
    _BattleManager_endBattle.call(this, result);
    if (result === 0 || this._escaped) {
      $gameTemp.setJustWonBattle(true);
    }
  };

  // マップシーンに戻った際、フラグが立っていれば回復処理を実行
  const _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function () {
    if ($gameTemp.isJustWonBattle()) {
      $gameTemp.setJustWonBattle(false); // フラグをリセット
      $gameParty.members().forEach((member: Game_Actor) => {
        if (member.lp > 0) {
          member.revive();
          if (prmBattleEndRecover) {
            member.setHp(member.mhp);
          }
        }
      });
    }
    _Scene_Map_start.call(this);
  };

  // ポップアップ処理の調整
  const _Sprite_Battler_createDamageSprite =
    Sprite_Battler.prototype.createDamageSprite;
  Sprite_Battler.prototype.createDamageSprite = function () {
    _Sprite_Battler_createDamageSprite.call(this);
    const battler = this._battler;
    if (battler?._result.lpDamage !== 0 && battler?.isActor()) {
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
  Sprite_Damage.prototype.setupLpBreak = function (target: Game_Battler) {
    const result = target._result;
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

  // 勝利演出時、LP>0の戦闘不能アクターにも勝利モーションを要求
  const _Game_Party_performVictory = Game_Party.prototype.performVictory;
  Game_Party.prototype.performVictory = function () {
    _Game_Party_performVictory.call(this);
    if (!prmPreferVictoryOnDeadIfLP) return;
    this.members()
      .filter((m): m is Game_Actor => m?.isActor())
      .forEach((actor) => {
        if (actor.isDead() && actor.lp > 0) {
          const actorMotion = actor as unknown as ActorMotionMethods;

          if (typeof actorMotion.requestMotion === "function") {
            actorMotion.requestMotion("victory");
          } else if (typeof actorMotion.performVictory === "function") {
            actorMotion.performVictory();
          }
        }
      });
  };

  // 全滅時は戦闘不能モーションを強制
  const battleManager = BattleManager as unknown as BattleManagerProcessDefeat;
  const _BattleManager_processDefeat = battleManager.processDefeat;
  battleManager.processDefeat = function () {
    if (prmForceCollapseOnWipe) {
      $gameParty
        .members()
        .filter((m): m is Game_Actor => m?.isActor())
        .forEach((actor) => {
          const actorMotion = actor as unknown as ActorMotionMethods;

          if (typeof actorMotion.requestMotion === "function") {
            actorMotion.requestMotion("dead");
          } else if (typeof actorMotion.performCollapse === "function") {
            actorMotion.performCollapse();
          }
        });
    }
    _BattleManager_processDefeat.call(this);
  };

  const _Window_BattleLog_displayDamage =
    Window_BattleLog.prototype.displayDamage;

  Window_BattleLog.prototype.displayDamage = function (target: Game_Battler) {
    _Window_BattleLog_displayDamage.call(this, target);
    if (target.isActor()) {
      if (target._result.lpDamage === 0) {
        return;
      } else if (target._result.lpDamage > 0) {
        this.push(
          "addText",
          LPBreakMessage(target, String(target._result.lpDamage)),
        );
      } else if (target._result.lpDamage < 0) {
        this.push(
          "addText",
          LPGainMessage(target, String(-target._result.lpDamage)),
        );
      }
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
  Sprite_Gauge.prototype.setup = function (
    battler: Game_Battler,
    statusType: string,
  ) {
    _Sprite_Gauge_setup.call(this, battler, statusType);
    if (statusType === GAUGE_TYPE_LP && battler.isActor()) {
      this._value = battler.lp;
      this._maxValue = battler.mlp;
      this._statusType = GAUGE_TYPE_LP;
    }
  };

  const _Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;
  Sprite_Gauge.prototype.currentValue = function () {
    if (this._statusType === GAUGE_TYPE_LP && this._battler?.isActor()) {
      return this._battler?.lp;
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
    actor: Game_Battler & Game_Actor,
    type: string,
    x: number,
    y: number,
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
  Window_Status.prototype.drawBlock2 = function (y: number) {
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
    actor: Game_Actor,
    x: number,
    y: number,
  ) {
    _Window_StatusBase_placeBasicGauges.call(this, actor, x, y);
    // LP描画を追加
    this.placeGauge(actor, "lp", x, y + this.gaugeLineHeight() * 2);
  };

  // 戦闘ステータスの座標上げ
  const _Window_BattleStatus_basicGaugesY =
    Window_BattleStatus.prototype.basicGaugesY;
  Window_BattleStatus.prototype.basicGaugesY = function (rect: Rectangle) {
    return (
      _Window_BattleStatus_basicGaugesY.call(this, rect) -
      this.gaugeLineHeight()
    );
  };
})();
