//------------------------------------------------------------------------------
// Furamon_TraitRaiseBottom.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/04/28 1.0.0 公開！（拙作用秘伝のタレ的プラグインから分割）
/*:
 * @target MZ
 * @plugindesc 能力特徴を底上げ式にする
 * @author Furamon
 *
 * @help 能力値乗算特徴がアクターや職業、装備などに複数ついている場合、一番高いものを返すよう挙動を改変します。
 * 例えば
 * - 魔法力が120%の職業のアクターが魔法力150%の装備をつけていると150%のみ反映
 * - 魔法防御が80%の職業のアクターが魔法防御110%の装備をつけていると110%のみ反映
 * という挙動、要はFF5の装備系アビリティっぽくなります。
 * ただし最大HPだけは加算処理(130%と120%なら150%になる)か従来の乗算処理になります（パラメータで選べます）。
 * また、装備能力上昇値がアクター側の補正を受けないようにできる機能もあります。(ステートは普通に乗算)
 *
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * Game_Actor.prototype.paramやparamRateあたりを盛大に書き換えます。可能な限り上の方で運用したほうが競合しないと思います。
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * 以下のプラグインを着想および参考にさせていただきました。 m（＿ ＿）m ﾏｲﾄﾞ
 * - 砂川赳様 ー 加算式特徴
 * (https://newrpg.seesaa.net/article/483215411.html)
 *
 * @------------------------------------------------------------------
 * @ プラグインパラメータ
 * @------------------------------------------------------------------
 *
 * @param HPPlus
 * @text HPの処理方式
 * @type select
 * @default mul
 * @option 加算 @value add
 * @option 乗算 @value mul
 * @desc 最大HP補正特徴の処理方式。加算式か乗算式か？
 *
 *
 */
(function () {
    const PLUGIN_NAME = 'Furamon_TraitRaiseBottom';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const prmHPPlus = parameters['HPPlus'] || 'mul';
    // ステートの特徴計算
    Game_Actor.prototype.getStateParamRate = function (paramId) {
        // 現在かかっているステートを取得
        return this.states().reduce((rate, state) => {
            // 各ステートが持つ特徴の中から、対象パラメータの乗算特徴を探し、レートに乗算
            return (rate *
                state.traits.reduce((r, trait) => {
                    if (trait.code === Game_BattlerBase.TRAIT_PARAM &&
                        trait.dataId === paramId) {
                        return r * trait.value;
                    }
                    return r;
                }, 1)); // ステートごとの初期レートは1
        }, 1); // 全体の初期レートは1
    };
    // 上書き
    Game_Actor.prototype.param = function (paramId) {
        // 基本値の取得
        const baseValue = this.paramBase(paramId);
        // 装備やその他の加算値
        const plusValue = this.paramPlus(paramId);
        // アクター/職業/パッシブスキル由来のレート (ステート除く)
        const actorClassPassiveRate = this.paramRate(paramId); // 修正後の paramRate
        // ステート由来のレート
        const stateRate = this.getStateParamRate(paramId);
        // バフ/デバフのレート
        const buffRate = this.paramBuffRate(paramId);
        // 計算式: (基本値 * アクター/職業/パッシブスキルレート + 加算値) * ステートレート * バフ/デバフ倍率
        let value = (baseValue * actorClassPassiveRate + plusValue) *
            stateRate *
            buffRate;
        // 最小値/最大値の処理
        const maxValue = this.paramMax(paramId);
        const minValue = this.paramMin(paramId);
        return Math.round(value.clamp(minValue, maxValue));
    };
    // 上書き。paramRate関数からステートを除外、パッシブスキルは含める
    Game_Actor.prototype.paramRate = function (paramId) {
        // 現在かかっているステートのIDリストを作成
        const currentStateIds = this.states().map((state) => state.id);
        // NUUN_PassiveSkill 由来のオブジェクトリストを取得 (プラグインが存在する場合)
        const passiveObjects = Imported.NUUN_PassiveSkill
            ? this.passiveObject()
            : [];
        // 全ての特徴を持つオブジェクトから特徴を収集（装備データと現在のステートデータを除外、パッシブスキルは含める）
        const traits = this.traitObjects().reduce((acc, obj) => {
            // obj が有効で traits プロパティを持つか？
            if (obj && obj.traits) {
                // obj が装備データか？ (wtypeId or etypeId を持つか)
                const isEquip = 'etypeId' in obj || 'wtypeId' in obj;
                // obj が NUUN_PassiveSkill 由来のオブジェクトか？
                const isPassive = passiveObjects.includes(obj);
                // obj がステートデータである可能性を判定し、
                // かつ、そのIDが現在のステートIDリストに含まれるか？
                const isCurrentState = typeof obj.id === 'number' &&
                    'restriction' in obj &&
                    currentStateIds.includes(obj.id);
                // (装備データではない、またはパッシブスキル由来である) かつ (現在のステートデータではない) 場合
                // → 通常の装備は除外し、パッシブスキル由来の武器データは含める
                if ((!isEquip || isPassive) && !isCurrentState) {
                    // obj.traits が配列であることを念のため確認
                    if (Array.isArray(obj.traits)) {
                        const paramTraits = obj.traits.filter((trait) => trait.code === Game_BattlerBase.TRAIT_PARAM &&
                            trait.dataId === paramId);
                        return acc.concat(paramTraits);
                    }
                }
            }
            return acc;
        }, []);
        // アクター/職業/パッシブスキルの特徴からレートを計算
        if (traits.length === 0) {
            return 1; // 特徴がなければレートは1
        }
        // 最大HPの場合 (プラグインパラメータで処理分岐)
        if (paramId === 0) {
            if (prmHPPlus === 'add') {
                // 加算モード: (特徴値 - 1) の合計 + 1
                return traits.reduce((total, trait) => total + (trait.value - 1), 1);
            }
            else {
                // 乗算モード (デフォルト): 特徴値の積
                return traits.reduce((total, trait) => total * trait.value, 1);
            }
        }
        // HP以外の場合: 最も高い特徴値を採用 (最低1を保証)
        else {
            return Math.max(1, ...traits.map((trait) => trait.value));
        }
    };
})();
