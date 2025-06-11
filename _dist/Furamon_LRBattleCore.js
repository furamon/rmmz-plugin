/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - 初期TPの変更
 * - 被ダメージ時のTP回復の廃止
 * - ステート付与率の運の影響を大きく+加算式に、TP(レベル)も参照
 * - 追加効果によるステート付与が外れた場合、
 * 及び無効化された場合に任意のステートを付与(ミス表示用)
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
    // デフォの運の影響廃止
    // そもそもlukEffectRateがある場所を潰したが他プラグインのことも考えて念の為
    Game_Action.prototype.lukEffectRate = function (target) {
        return 1;
    };
    // ステート付与率の運の影響を大きく+加算式に、TP(レベル)も参照
    // 追加効果によるステート付与が外れた場合任意のステートを付与(ミス表示用)
    const _Game_Action_itemEffectAddAttackState = Game_Action.prototype.itemEffectAddAttackState;
    Game_Action.prototype.itemEffectAddAttackState = function (target, effect) {
        // NRP_CalcResultFirst の事前計算中かどうかの推測
        // target._reservedResults が配列として存在し、かつ target.result() が存在するかで判断
        // (NRP_CalcResultFirst.js が calcResultFirst の開始時に初期化/設定するため)
        const isNrpPreCalc = Array.isArray(target._reservedResults) && target.result();
        const result = target.result(); // result オブジェクトを取得 (事前計算中/通常処理中共通)
        if (isNrpPreCalc) {
            const initialSuccess = result.success; // StateResistToFailure 用に初期状態を保持
            for (const stateId of this.subject().attackStates()) {
                let chance = effect.value1;
                chance *= this.subject().attackStatesRate(stateId);
                chance +=
                    (this.subject().luk - target.luk) * 0.03 +
                        (this.subject().tp - target.tp) * 0.01;
                chance *= target.stateRate(stateId);
                chance = Math.max(chance, 0);
                if (target.isStateResist(stateId)) {
                    // レジストステート(4)を result に記録
                    result.pushAddedState(4);
                    if (pStateResistToFailure) {
                        result.success = initialSuccess; // 成功状態を元に戻す
                    }
                }
                else if (Math.random() < chance) {
                    // 付与成功ステートを result に記録
                    result.pushAddedState(stateId);
                    result.success = true; // 成功フラグを立てる
                }
                else {
                    // 付与失敗ステート(5)を result に記録
                    result.pushAddedState(5);
                    // 失敗時は success フラグを変更しない（他の効果で成功している可能性があるため）
                }
            }
            // 事前計算中はここで処理を終了
            return;
        }
        else {
            // 通常処理時 (NRPの事前計算外、またはNRPが無効の場合)
            // 元のロジックに近い形で target.addState を呼ぶ
            for (const stateId of this.subject().attackStates()) {
                let chance = effect.value1;
                chance *= this.subject().attackStatesRate(stateId);
                chance +=
                    (this.subject().luk - target.luk) * 0.03 +
                        (this.subject().tp - target.tp) * 0.01;
                chance *= target.stateRate(stateId);
                chance = Math.max(chance, 0);
                if (target.isStateResist(stateId)) {
                    target.addState(4); // 通常の addState
                }
                else if (Math.random() < chance) {
                    target.addState(stateId); // 通常の addState
                    this.makeSuccess(target); // 通常処理では success を設定
                }
                else {
                    target.addState(5); // 通常の addState
                }
            }
        }
    };
    const _Game_Action_itemEffectAddNormalState = Game_Action.prototype.itemEffectAddNormalState;
    Game_Action.prototype.itemEffectAddNormalState = function (target, effect) {
        const isNrpPreCalc = Array.isArray(target._reservedResults) && target.result();
        const result = target.result();
        if (isNrpPreCalc) {
            const initialSuccess = result.success; // StateResistToFailure 用
            let chance = effect.value1;
            // isCertainHit は result を参照しないので事前計算中でも使える
            if (!this.isCertainHit()) {
                chance +=
                    (this.subject().luk - target.luk) * 0.03 +
                        (this.subject().tp - target.tp) * 0.01;
                chance *= target.stateRate(effect.dataId);
                chance = Math.max(chance, 0);
            }
            // isCertainHit() が true の場合の分岐を追加 (コアスクリプトの挙動に合わせる)
            if (this.isCertainHit()) {
                if (target.isStateResist(effect.dataId)) {
                    result.pushAddedState(4); // Resist state
                    if (pStateResistToFailure) {
                        result.success = initialSuccess;
                    }
                }
                else {
                    result.pushAddedState(effect.dataId); // Success state
                    result.success = true;
                }
            }
            else {
                // isCertainHit() が false の場合 (元のロジック)
                if (target.isStateResist(effect.dataId)) {
                    result.pushAddedState(4); // Resist state
                    if (pStateResistToFailure) {
                        result.success = initialSuccess;
                    }
                }
                else if (Math.random() < chance) {
                    result.pushAddedState(effect.dataId); // Success state
                    result.success = true;
                }
                else {
                    result.pushAddedState(5); // Miss state
                }
            }
            // 事前計算中はここで処理を終了
            return;
        }
        else {
            // 通常処理時
            let chance = effect.value1;
            if (!this.isCertainHit()) {
                chance +=
                    (this.subject().luk - target.luk) * 0.03 +
                        (this.subject().tp - target.tp) * 0.01;
                chance *= target.stateRate(effect.dataId);
                chance = Math.max(chance, 0);
            }
            if (this.isCertainHit()) {
                // 必中時の処理 (コアに合わせる)
                if (target.isStateResist(effect.dataId)) {
                    target.addState(4);
                }
                else {
                    target.addState(effect.dataId);
                    this.makeSuccess(target);
                }
            }
            else {
                // 通常の確率計算
                if (target.isStateResist(effect.dataId)) {
                    target.addState(4);
                }
                else if (Math.random() < chance) {
                    target.addState(effect.dataId);
                    this.makeSuccess(target);
                }
                else {
                    target.addState(5);
                }
            }
        }
    };
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
