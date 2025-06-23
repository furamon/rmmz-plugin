/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - 初期TPの変更
 * - 被ダメージ時のTP回復の廃止
 * - 負の速度補正を魔法防御で相殺
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
(function () {
    const PLUGIN_NAME = 'Furamon_LRBattleCore';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const prmInitialTP = parameters['initialTp'];
    const prmNoChargeTpByDamage = parameters['noChargeTpByDamage'] === 'true' ? true : false;
    const prmExpRate = parseFloat(parameters['expRate']);
    const nrpParams = PluginManager.parameters('NRP_CalcResultFirst');
    const pStateResistToFailure = nrpParams && nrpParams['StateResistToFailure'] === 'true';
    // 初期TP
    const _Game_Battler_initTp = Game_Battler.prototype.initTp;
    Game_Battler.prototype.initTp = function () {
        const a = this;
        if (prmInitialTP != undefined) {
            this.setTp(eval(prmInitialTP));
            return;
        }
        _Game_Battler_initTp.call(this);
    };
    // 被ダメージ時のTP回復
    if (prmNoChargeTpByDamage) {
        Game_Battler.prototype.chargeTpByDamage = function () { };
    }
    // 速度補正が負の行動なら魔法防御で割合相殺
    const _Game_Action_speed = Game_Action.prototype.speed;
    Game_Action.prototype.speed = function () {
        const speed = _Game_Action_speed.call(this);
        if (this.item().speed < 0) {
            return (speed +
                (-this.item().speed *
                    this.subject().agi *
                    this.subject().mdf) /
                    10000);
        }
        else {
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
        let allTraitsMeta = []; // 初期化
        party.forEach((actor) => {
            const objects = actor
                .skills()
                .map((skill) => ({
                meta: skill.meta,
            }))
                .concat(this.traitObjects().map((obj) => ({ meta: obj.meta })));
            allTraitsMeta = allTraitsMeta.concat(objects);
        });
        if (allTraitsMeta.some((trait) => trait.meta && trait.meta.hasOwnProperty('IgnoreEXP'))) {
            return 0;
        }
        if (allTraitsMeta.some((trait) => trait.meta && trait.meta.hasOwnProperty('DoubleEXP'))) {
            return Math.floor(_Game_Enemy_exp.call(this) * (prmExpRate || 1));
        }
        return _Game_Enemy_exp.call(this);
    };
    // アクターコマンドから逃げられるようにする
    const _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function () {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler('escape', this.commandEscape.bind(this));
    };
    const _Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function () {
        _Window_ActorCommand_makeCommandList.call(this);
        if (this._actor)
            this._list.splice(5, 0, {
                name: '逃げる',
                symbol: 'escape',
                enabled: BattleManager.canEscape(),
                ext: null,
            });
    };
    // ダミーターゲット処理。スキル効果を全て無効化する
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function (target) {
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
    // NRP_BattleTargetCursorが開いている間はスキルウィンドウを閉じる
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this);
        if (BattleManager.isInputting()) {
            if (this._skillWindow.visible) {
                // 敵選択ウィンドウが開いているなら
                if (this._enemyWindow.visible ||
                    this._enemyNameWindow.visible) {
                    this._skillWindow.visible = false;
                }
                else {
                    this._skillWindow.visible = true;
                }
            }
        }
    };
})();
