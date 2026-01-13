"use strict";
// @ts-nocheck
//------------------------------------------------------------------------------
// Furamon_StateRateLuck.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/23 v1.0.0 公開！（Furamon_LRBattleCoreから改良して分割）
// 2025/06/30 v1.0.1 計算式が100倍で反映される上スキルのステート付与率が機能してなかったひどすぎる不具合修正
/*:
 * @target MZ
 * @plugindesc ステート付与率の仕様を改造します。
 * @author Furamon
 *
 * @help ステート付与率の仕様を改造します。
 * - ステート付与率を任意式にできる
 *   - お互いのステータスを参照可能（ex. 基本付与率に「(自分運-相手運)*3」を加算）
 * - 追加効果によるステート付与が外れた場合任意のステートを付与(他のプラグインと組み合わせてのミス表示用)
 *
 * -----------------------------------------------------------------------------
 * # 仕様 #
 * -----------------------------------------------------------------------------
 * スキル側で設定したステート付与率にこのプラグインで設定した
 * 計算式が加算または乗算されます。
 * ex. 計算式に「(a.luk-b.luk)*3」、加算を設定して付与率60%のスキルを放った場合
 * a.luk-b.lukが10なら「60+(10*3)」=90%
 *
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * - Game_Action.prototype.itemEffectAddAttackState
 * - Game_Action.prototype.itemEffectAddNormalState
 * 以上を盛大に書き換えます。
 * 可能な限り上の方で適用したほうが競合しないはずです。
 *
 * またClaude 4 sonnetの力を盛大に借りました。
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------

 * @param EvalStateRate
 * @text ステート付与率の計算式
 * @desc ステート付与率に加える計算式です。
 * 例：(a.luk-b.luk)*3
 * @default (a.luk-b.luk)*3
 * @type text
 *
 * @param EvalStateRateMethod
 * @text ステート付与率の計算方式
 * @desc ステート付与率に計算式をどう加えるか。
 * @default add
 * @type select
 * @option add
 * @option multi
 *
 * @param ResistState
 * @text 無効時のステート
 * @desc 無効時のステートを設定します。
 * @type state
 * @default 4
 *
 * @param FailureState
 * @text 失敗時のステート
 * @desc 失敗時のステートを設定します。
 * @type state
 * @default 5
 *
 * @param StateResistToFailure
 * @type boolean
 * @text レジスト時は失敗扱いする
 * @desc レジスト時は行動を失敗扱いするか？
 * @on 失敗扱いする
 * @off 失敗扱いしない
 * @default false
 */
(() => {
    ("use strict");
    const PLUGIN_NAME = "Furamon_StateRateLuck";
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const prmEvalStateRate = parameters["EvalStateRate"] || "stateRate";
    const prmEvalStateRateMethod = parameters["EvalStateRateMethod"] || "add";
    const prmResistState = parseInt(parameters["ResistState"], 10);
    const prmFailureState = parseInt(parameters["FailureState"], 10);
    const prmStateResistToFailure = parameters["StateResistToFailure"] === "true";
    // 計算式評価用のヘルパー関数
    function evaluateStateRate(subject, target) {
        const _a = subject; // 行動者
        const _b = target; // 対象
        try {
            // biome-ignore lint/security/noGlobalEval: プラグインパラメータの計算式を評価するため（ローカル実行前提）
            return eval(prmEvalStateRate) / 100;
        }
        catch (e) {
            console.warn(`StateRateLuck: 計算式エラー - ${prmEvalStateRate}`, e);
            return 0; // エラー時は例外で0を返す
        }
    }
    // デフォの運の影響廃止
    // そもそもlukEffectRateがある場所を潰したが他プラグインのことも考えて念の為
    Game_Action.prototype.lukEffectRate = (_target) => 1;
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
                if (prmEvalStateRateMethod === "add") {
                    // 指定計算式をchanceに加える
                    chance += evaluateStateRate(this.subject(), target);
                }
                else {
                    // 指定計算式をchanceにかける
                    chance *= evaluateStateRate(this.subject(), target);
                }
                chance *= target.stateRate(stateId);
                chance = Math.max(chance, 0);
                if (target.isStateResist(stateId)) {
                    // レジストステートを result に記録
                    result.pushAddedState(prmResistState);
                    if (prmStateResistToFailure) {
                        result.success = initialSuccess; // 成功状態を元に戻す
                    }
                }
                else if (Math.random() < chance) {
                    // 付与成功ステートを result に記録
                    result.pushAddedState(stateId);
                    result.success = true; // 成功フラグを立てる
                }
                else {
                    // 付与失敗ステートを result に記録
                    result.pushAddedState(prmFailureState);
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
                if (prmEvalStateRateMethod === "add") {
                    // 指定計算式をchanceに加える
                    chance += evaluateStateRate(this.subject(), target);
                }
                else {
                    // 指定計算式をchanceにかける
                    chance *= evaluateStateRate(this.subject(), target);
                }
                chance *= target.stateRate(stateId);
                chance = Math.max(chance, 0);
                if (target.isStateResist(stateId)) {
                    target.addState(prmResistState); // 通常の addState
                }
                else if (Math.random() < chance) {
                    target.addState(stateId); // 通常の addState
                    this.makeSuccess(target); // 通常処理では success を設定
                }
                else {
                    target.addState(prmFailureState); // 通常の addState
                }
            }
        }
    };
    Game_Action.prototype.itemEffectAddNormalState = function (target, effect) {
        const isNrpPreCalc = Array.isArray(target._reservedResults) && target.result();
        const result = target.result();
        if (isNrpPreCalc) {
            const initialSuccess = result.success; // StateResistToFailure 用
            let chance = effect.value1;
            chance *= this.subject().stateRate(effect.dataId);
            if (prmEvalStateRateMethod === "add") {
                // 指定計算式をchanceに加える
                chance += evaluateStateRate(this.subject(), target);
            }
            else {
                // 指定計算式をchanceにかける
                chance *= evaluateStateRate(this.subject(), target);
            }
            chance *= target.stateRate(effect.dataId);
            chance = Math.max(chance, 0);
            // isCertainHit() が true の場合の分岐を追加 (コアスクリプトの挙動に合わせる)
            if (this.isCertainHit()) {
                if (target.isStateResist(effect.dataId)) {
                    result.pushAddedState(prmResistState); // Resist state
                    if (prmStateResistToFailure) {
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
                    result.pushAddedState(prmResistState); // Resist state
                    if (prmStateResistToFailure) {
                        result.success = initialSuccess;
                    }
                }
                else if (Math.random() < chance) {
                    result.pushAddedState(effect.dataId); // Success state
                    result.success = true;
                }
                else {
                    result.pushAddedState(prmFailureState); // Miss state
                }
            }
            // 事前計算中はここで処理を終了
            return;
        }
        else {
            // 通常処理時
            let chance = effect.value1;
            if (!this.isCertainHit()) {
                chance *= this.subject().attackStatesRate(effect.dataId);
                if (prmEvalStateRateMethod === "add") {
                    // 指定計算式をchanceに加える
                    chance += evaluateStateRate(this.subject(), target);
                }
                else {
                    // 指定計算式をchanceにかける
                    chance *= evaluateStateRate(this.subject(), target);
                }
                chance *= target.stateRate(effect.dataId);
                chance = Math.max(chance, 0);
            }
            if (this.isCertainHit()) {
                // 必中時の処理 (コアに合わせる)
                if (target.isStateResist(effect.dataId)) {
                    target.addState(prmResistState);
                }
                else {
                    target.addState(effect.dataId);
                    this.makeSuccess(target);
                }
            }
            else {
                // 通常の確率計算
                if (target.isStateResist(effect.dataId)) {
                    target.addState(prmResistState);
                }
                else if (Math.random() < chance) {
                    target.addState(effect.dataId);
                    this.makeSuccess(target);
                }
                else {
                    target.addState(prmFailureState);
                }
            }
        }
    };
})();
