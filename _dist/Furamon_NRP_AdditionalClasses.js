//------------------------------------------------------------------------------
// Furamon_NRP_AdditionalClasses.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/10/17 1.0.0-Beta 非公開作成
/*:
 * @target MZ
 * @plugindesc NRP様の多重転職プラグインの改造版
 * @author 砂川赳(改変:Furamon)
 * @orderAfter NRP_TraitsPlus
 * @help NRP様の多重転職プラグインをふらもんが改造したものです。
 * FFVのジョブチェンジシステムを目標に手を加えています。
 * 削られたものも多い……というかよっぽどFFVを再現したいんじゃな方以外は
 * もとのプラグインを使ったほうが良いと思われますのでご承知ください。
 * (https://newrpg.seesaa.net/article/483582956.html)
 *
 * # 主な変更点
 * - 転職可能な追加職業を1つに限定。サブ職業の概念をなくした。
 * - 職業やスキルメモ欄に<Addxxx:n>で能力を加算(MHP/MMPのみ
 *   ベース職業の数値への乗算(<AddMhp:30>でMHP+30%))できるようにした。
 *   - これは最高値だけが反映される(ex.<AddMat:25>職が<AddMat:15>
 *   スキル習得時はMat+25だけが反映される)
 * - かつ、職業メモ欄に<Inheritance>でマスター職業の<Addxxx:n>を引き継げる。
 * - 職業メモ欄に<NeedsExp:[n,m,...]>で必要経験値を直指定できるようにした。
 * (ex.[10,40,...]なら最初のLvUPは必要Exp10、次は40(累計50)、……)
 * - スイッチ指定で転職後勝手に最強装備をしたり、即座に装備画面を
 * 出したりできるようにした。
 * - 追加職業のレベルを0始まりにできるようにした。
 * (例えばLv1でデータベースでLv2習得のスキルを覚える)
 * - AbilitySkillと併用時、アビリティスキルを追加職業で習得時
 * その表示がされない競合の修正
 *
 * --- 以下元プラグイン解説（改変内容に合わせて原文から変更） ---
 *
 * アクターに対して、複数の職業を同時に設定することにより、
 * 自由度の高い成長システムを実現します。
 *
 * ＲＰＧツクールＭＺの職業はかなりクセのある仕様になっています。
 * 職業とそのレベルによって、アクターの能力がほぼ確定するため、
 * アクター自身の個性を設定することが困難です。
 *
 * もし、この仕様に基づいて転職を行うと、
 * 全く別の能力を持ったキャラクターになってしまいます。
 * ※いわゆるＤＱ３型およびＦＦ３型
 *
 * 実際のところ、ほとんどの作品ではアクターと職業を
 * 一対一に対応させることで、アクターの個性を表現しています。
 * 事実上、職業という仕組みが機能していない有様です。
 *
 * そこでこのプラグインでは、
 * アクターの能力値のベースとなる職業（ベース職業）を残したまま、
 * さらに追加の職業（追加職業）を付与することで、
 * 自由度の高い転職システムを実現します。
 *
 * ■使用方法
 * 追加用の職業を作成し、
 * プラグインコマンドでアクターに追加すればＯＫです。
 * ベース職業と追加職業の２つの特徴を併せ持ったアクターが誕生します。
 *
 * さらに転職によって自由なアクターのカスタマイズが可能です。
 * 付属の『Furamon_NRP_AdditionalCCScene.js』を利用すれば、
 * 簡単に転職システムを作成できます。
 *
 * その他にも当プラグインは非常にカスタマイズ性が高くなっています。
 * プラグインコマンドやパラメータの解説をお読みください。
 *
 * ■プラグインコマンド
 * ◆職業の追加
 * 追加職業をアクターに設定します。
 *
 * ◆職業の削除
 * 追加職業を削除します。
 *
 * ◆経験値の増減
 * 追加職業に対して経験値を増減させます。
 * イベントコマンドの『経験値の増減』とは異なり、
 * 追加職業に対してのみ増減を行います。
 *
 * ◆レベルの増減
 * 追加職業に対してレベルを増減させます。
 * イベントコマンドの『レベルの増減』とは異なり、
 * 追加職業に対してのみ増減を行います。
 *
 * ◆追加職業の情報を取得
 * アクターが就いている追加職業に関する情報を変数に格納します。
 * 職業ＩＤ、レベル、経験値を取得可能です。
 *
 * 追加職業は通常のイベントコマンドでは判別できないため、
 * このコマンドを使用してください。
 *
 * ■主なプラグインパラメータ
 * ◆パラメータを加算
 * 職業の能力値曲線に設定されている値を、アクターに加算します。
 * レベル成長する職業などに活用できます。
 * 初期値はオフです。
 *
 * ◆スキルを維持する
 * 転職時、習得した追加職業のスキルを維持します。
 * 初期値はオフです。
 *
 * なお、スキル単位での設定も可能です。
 * ※以下の『スキルのメモ欄』を参照
 *
 * ◆通常の経験値を使用
 * 追加職業に対しても、通常の経験値処理を使用します。
 * 戦闘勝利時やイベントコマンドによる
 * 経験値処理の影響を受けるようにします。
 *
 * 初期値はオンです。
 * 熟練度のような独自の経験値処理を行う場合は、オフにしてください。
 *
 * オフの場合もプラグインコマンドで経験値やレベルを操作可能です。
 * また、敵キャラ毎に職業専用の経験値を設定することも可能です。
 * ※以下の『敵キャラのメモ欄』を参照
 *
 * ◆経験値の共有化
 * 職業の経験値をパーティで共有します。
 * つまり、誰が転職しても同じ職業は同じレベルになります。
 * 初期値はオフです。
 *
 * ＦＦ８のＧＦやペルソナ１～２、軌跡シリーズのマスタークオーツのように、
 * アクターとは独立した成長システムを想定しています。
 *
 * ◆職業欄を上書表示、ステータスにレベル表示
 * 追加職業を職業欄やステータス画面に表示します。
 * その代わり、アクターのベース職業や二つ名は非表示になります。
 * 初期値はオンです。
 *
 * ■職業のメモ欄
 * <MaxLevel:?>
 * 追加職業毎に最大レベルを指定します。
 * プラグインパラメータの既定値よりも優先されます。
 *
 * ■スキルのメモ欄
 * <KeepSkill>
 * スキルを維持しない設定でも、転職時にスキルを維持するようにします。
 *
 * <KeepSkill:false>
 * 逆にスキルを維持する設定でも、維持しないようにします。
 *
 * ■敵キャラのメモ欄
 * <ClassExp:?>
 * 追加職業にのみ加算する経験値を指定します。
 *
 * 『通常の経験値を使用』をオフにすることによって、
 * 独自の熟練度のようなものを実装できます。
 *
 * 戦闘終了時の表示には『EXPの表示名』が使用されます。
 *
 * <ClassExpRate:?>
 * 獲得できる追加職業の経験値を指定した%に変更します。
 * 例えば、200ならば200%（２倍）になります。
 * 既定値とのセットで使うことを想定しています。
 *
 * ■アイテムのメモ欄
 * <AddClassExp:?>
 * 職業経験値を増加させます。
 * レベルアップ時はアイテムメニューを閉じてから、メッセージを表示します。
 *
 * ■アクター、職業、装備、ステートのメモ欄
 * <ClassExpRate:?>
 * 職業経験値の獲得量を指定した%に変更します。
 * 200ならば200%（２倍）になります。
 * もし、戦闘不能時に職業経験値を獲得させたくない場合は、
 * 戦闘不能ステートに<ClassExpRate:0>を指定してください。
 *
 * ■スクリプト
 * ◆actor.additionalClass;
 * アクターの追加職業情報を取得します。
 * 例えば、以下で先頭のアクターの職業名や職業レベルを取得できます。
 *
 * $gameParty.members()[0].additionalClass.name;
 * $gameParty.members()[0].additionalClass.level;
 *
 * ※actorはGame_Actorクラスのオブジェクトです。
 * ※追加職業に就いてない場合はエラーになります。
 *
 * ◆actor.isAdditionalClassId(1);
 * アクターが追加職業に就いているかを判定します。
 * 数値は職業ＩＤです。
 *
 * ■注意点
 * 標準では転職すると、その職業で覚えたスキルを忘れる仕様になっています。
 * その際、該当のスキルは他の方法で覚えたスキルであっても、
 * 区別なく忘れてしまいます。
 * （仕様上、区別が大変なので、修正の予定もありません。）
 *
 * 追加職業で習得するスキルと、その他の手段で習得するスキルは、
 * 区別して登録するようにお願いします。
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * 改変元:Furamon_AdditionalClasses(https://newrpg.seesaa.net/article/483582956.html)
 *
 * GeminiCLIの力を盛大に借りました。
 *
 * @-----------------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------------
 *
 *
 * @command AddClass
 * @text 職業の追加
 * @desc 追加職業をアクターに設定します。
 *
 * @arg Actor
 * @text アクター
 * @type actor
 * @desc 対象とするアクターです。
 * 未指定ならパーティ全体を対象とします。
 *
 * @arg VariableActor
 * @text アクター（変数指定）
 * @type variable
 * @desc 対象とするアクターを変数で指定します。
 * こちらのほうが優先されます。
 *
 * @arg AdditionalClass
 * @text 追加職業
 * @type class
 * @desc 追加する職業です。
 *
 * @------------------------------------------------------------------
 *
 * @command RemoveClass
 * @text 職業の削除
 * @desc 追加職業をアクターから削除します。
 *
 * @arg Actor
 * @text アクター
 * @type actor
 * @desc 対象とするアクターです。
 * 未指定ならパーティ全体を対象とします。
 *
 * @arg VariableActor
 * @text アクター（変数指定）
 * @type variable
 * @desc 対象とするアクターを変数で指定します。
 * こちらのほうが優先されます。
 *
 * @------------------------------------------------------------------
 *
 * @command ChangeExp
 * @text 経験値の増減
 * @desc 追加職業の経験値を変更します。
 *
 * @arg Exp
 * @text 経験値
 * @type number @min -9999999 @max 9999999
 * @desc 増減する経験値の量です。マイナス指定可。
 *
 * @arg VariableExp
 * @text 経験値（変数）
 * @type variable
 * @desc 増減する経験値の量を変数で指定します。
 * こちらのほうが優先されます。
 *
 * @arg ShowLvUpMessage
 * @text レベルアップを表示
 * @type boolean
 * @default false
 * @desc レベルアップ時にメッセージを表示します。
 *
 * @arg <Condition>
 * @text ＜対象条件＞
 *
 * @arg Actor
 * @parent <Condition>
 * @text アクター
 * @type actor
 * @desc 対象とするアクターです。
 * 未指定ならパーティ全体を対象とします。
 *
 * @arg VariableActor
 * @parent <Condition>
 * @text アクター（変数指定）
 * @type variable
 * @desc 対象とするアクターを変数で指定します。
 * こちらのほうが優先されます。
 *
 * @------------------------------------------------------------------
 *
 * @command ChangeLevel
 * @text レベルの増減
 * @desc 追加職業のレベルを変更します。
 *
 * @arg Level
 * @text レベル
 * @type number @min -99 @max 99
 * @desc 増減するレベルの量です。マイナス指定可。
 *
 * @arg VariableLevel
 * @text レベル（変数）
 * @type variable
 * @desc 増減するレベルの量を変数で指定します。
 * こちらのほうが優先されます。
 *
 * @arg ShowLvUpMessage
 * @text レベルアップを表示
 * @type boolean
 * @default false
 * @desc レベルアップ時にメッセージを表示します。
 *
 * @arg <Condition>
 * @text ＜対象条件＞
 *
 * @arg Actor
 * @parent <Condition>
 * @text アクター
 * @type actor
 * @desc 対象とするアクターです。
 * 未指定ならパーティ全体を対象とします。
 *
 * @arg VariableActor
 * @parent <Condition>
 * @text アクター（変数指定）
 * @type variable
 * @desc 対象とするアクターを変数で指定します。
 * こちらのほうが優先されます。
 *
 * @------------------------------------------------------------------
 *
 * @command GetInformation
 * @text 追加職業の情報を取得
 * @desc アクターが就いている追加職業に関する情報を取得します。
 *
 * @arg VariableAtClass
 * @text 変数（追加職業）
 * @type variable
 * @desc アクターが就いている追加職業のＩＤを格納する変数です。
 *
 * @arg VariableAtLv
 * @text 変数（レベル）
 * @type variable
 * @desc アクターが就いている追加職業のレベルを格納する変数です。
 *
 * @arg VariableAtExp
 * @text 変数（経験値）
 * @type variable
 * @desc アクターが就いている追加職業の経験値を格納する変数です。
 *
 * @arg <Condition>
 * @text ＜取得条件＞
 *
 * @arg Actor
 * @parent <Condition>
 * @text アクター
 * @type actor
 * @desc 対象とするアクターです。
 *
 * @arg VariableActor
 * @parent <Condition>
 * @text アクター（変数指定）
 * @type variable
 * @desc 対象とするアクターを変数で指定します。
 * こちらのほうが優先されます。
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param ParamPlusByLevel
 * @text レベルで能力値加算
 * @type boolean
 * @default false
 * @desc 職業のレベルに応じて、能力値曲線の値をアクターに加算します。
 *
 * @param ParamPlusByTag
 * @text タグで能力値加算
 * @type boolean
 * @default true
 * @desc 職業やスキル等のメモ欄の<Addxxx:n>タグに応じて、アクターに能力値を加算します。
 *
 * @param KeepSkill
 * @text スキルを維持する
 * @type boolean
 * @default false
 * @desc 転職時、スキルを維持するようにします。
 *
 * @param DefaultMaxLevel
 * @text 最大レベル既定値
 * @type number @max 99
 * @desc 追加職業の最大レベルの既定値です。
 * 特に指定がなければ、この値が使用されます。
 *
 * @param LvUpMessage
 * @text Lvアップメッセージ
 * @type string
 * @default %1は%2レベル %3 に上がった！
 * @desc 職業のレベルアップメッセージを表示します。
 * %1=アクター, %2=職業名, %3=Lvとなります。
 *
 * @param LvName
 * @text Lvの表示名
 * @type string
 * @default Lv
 * @desc 職業のレベルを表す表示名です。
 *
 * @param ExpName
 * @text EXPの表示名
 * @type string
 * @default EXP
 * @desc 職業の経験値を表す表示名です。
 *
 * @param <ClassExp>
 * @text ＜職業経験値関連＞
 *
 * @param UseNormalExp
 * @parent <ClassExp>
 * @text 通常の経験値を使用
 * @type boolean
 * @default true
 * @desc 通常の経験値取得時に、追加職業へも経験値を反映させます。
 * 独自ポイントを使う場合はオフにしてください。
 *
 * @param DefaultClassExp
 * @parent <ClassExp>
 * @text 職業経験値の既定値
 * @type string
 * @desc 職業経験値の既定値を設定します。
 * 数式可（例：1 + Math.floor(a.exp() / 100)）
 *
 * @param ClassExpMessage
 * @parent <ClassExp>
 * @text EXP獲得メッセージ
 * @type string
 * @default %1 の%2を獲得！
 * @desc 職業経験値の獲得メッセージを表示します。
 * %1=数値, %2=EXPの表示名となります。
 *
 * @param ClassLvUpLater
 * @parent <ClassExp>
 * @text 職業Lvアップを後回し
 * @type boolean
 * @default false
 * @desc 職業レベルアップの表示を、アクター全員のレベルアップより後で表示します。
 *
 * @param ClassExpSwitch
 * @parent <ClassExp>
 * @text 職業経験値の有効化ｽｲｯﾁ
 * @type switch
 * @desc 指定のスイッチがオンの際、追加職業への経験値の増減を有効化します。空白なら常に有効。
 *
 * @param BenchClassExpRate
 * @parent <ClassExp>
 * @text 控えの獲得率
 * @type string
 * @default 1.00
 * @desc 控えメンバーの職業経験値の獲得率です。数式可
 * 空白の場合は通常経験値と同率を使用。
 *
 * @param UnificationExp
 * @parent <ClassExp>
 * @text 経験値の共有化
 * @type boolean
 * @default false
 * @desc 職業の経験値をパーティで共有します。
 * 成長する魔石のようなシステムに使えます。
 *
 * @param NoDuplicateExp
 * @parent UnificationExp
 * @text 経験値の重複禁止
 * @type boolean
 * @default false
 * @desc 経験値の共有化を行う場合、かつ複数人が同一の職業に就いている場合、経験値の重複加算を禁止します。
 *
 * @param OverwriteClassField
 * @text 職業欄を上書表示
 * @type boolean
 * @default true
 * @desc 追加職業を職業欄に表示します。（通常の職業は非表示）
 *
 * @param ShowLevelOnMenu
 * @parent OverwriteClassField
 * @text メニューにレベル表示
 * @type select
 * @option 非表示 @value
 * @option 数字のみ @value simple
 * @option 全表示 @value full
 * @desc 追加職業のレベルをメニュー画面に表示します。
 * ただし、全表示にはある程度の画面幅が必要です。
 *
 * @param ShowLevelOnStatus
 * @text ステータスにレベル表示
 * @type boolean
 * @default true
 * @desc 追加職業のレベルをステータス画面に表示します。
 * なお、調整のために二つ名を削除します。
 *
 * @param NormalExpWidth
 * @parent ShowLevelOnStatus
 * @text 通常経験値の横幅
 * @type number
 * @default 110
 * @desc 通常経験値をステータス画面に表示する横幅です。
 *
 * @param ClassExpWidth
 * @parent ShowLevelOnStatus
 * @text 職業経験値の横幅
 * @type number
 * @default 110
 * @desc 職業経験値をステータス画面に表示する横幅です。
 *
 * @param ClassLvMaxExp
 * @parent ShowLevelOnStatus
 * @text 職業レベル最大経験値表記
 * @type string
 * @default -------
 * @desc 職業レベルが最大になった際の経験値欄の表記です。
 *
 * @param ShowMaxLevelMessage
 * @text 最大レベルでメッセージ表示
 * @type boolean
 * @default false
 * @desc 追加職業が最大レベルに到達した際にメッセージを表示します。
 *
 * @param MaxLevelMessage
 * @parent ShowMaxLevelMessage
 * @text 最大レベル時の文章
 * @type string
 * @default %1は%2を極めた！
 * @desc 最大レベル到達時のメッセージです。
 * %1=アクター名, %2=職業名, %3=レベルです。
 *
 * @param ShowBenchMaxLevel
 * @parent ShowMaxLevelMessage
 * @text 控えも強制表示
 * @type boolean
 * @default false
 * @desc 控えメンバーもメッセージを強制表示します。
 * Furamon_BenchMembersExp.js併用時のみ機能。
 *
 * @param ZeroLevel
 * @parent <FuramonOption>
 * @text レベルを0始まりにする
 * @type boolean
 * @default false
 * @desc trueの場合、追加職業のレベルが0から始まります。
 * スキル習得レベルなども1ずれます(DBでLv2習得→Lv1で習得)
 *
 */
//-----------------------------------------------------------------------------
// AdditionalClass
//
// 追加職業を保有するクラス
// ※外部プラグインから参照できるように外側に定義
AdditionalClass = function (actor, classId) {
    this.initialize(actor, classId);
};
/**
 * ●初期化
 */
AdditionalClass.prototype.initialize = function (actor, classId) {
    this._actor = actor;
    this._id = classId;
    this._data = $dataClasses[classId];
    this.setLevel();
};
(function () {
    'use strict';
    // function toBoolean(str, def) {
    //     if (str === true || str === 'true') {
    //         return true;
    //     } else if (str === false || str === 'false') {
    //         return false;
    //     }
    //     return def;
    // }
    // function toNumber(str, def) {
    //     if (str == undefined || str == '') {
    //         return def;
    //     }
    //     return isNaN(str) ? def : +(str || def);
    // }
    // function setDefault(str, def) {
    //     if (str == undefined || str == '') {
    //         return def;
    //     }
    //     return str;
    // }
    const PLUGIN_NAME = 'Furamon_NRP_AdditionalClasses';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const pParamPlusByLevel = parameters['ParamPlusByLevel'] === 'true';
    const pParamPlusByTag = parameters['ParamPlusByTag'] === 'true';
    const pKeepSkill = parameters['KeepSkill'] === 'true';
    const pDefaultMaxLevel = Number(parameters['DefaultMaxLevel'] || 99);
    const pLvUpMessage = parameters['LvUpMessage'] || '%1は%2レベル %3 に上がった！';
    const pLvName = parameters['LvName'] || 'Lv';
    const pExpName = parameters['ExpName'] || 'EXP';
    const pUseNormalExp = parameters['UseNormalExp'] == 'true';
    const pDefaultClassExp = parameters['DefaultClassExp'] || '0';
    const pClassExpMessage = parameters['ClassExpMessage'] || '%1 の%2を獲得！';
    const pClassLvUpLater = parameters['ClassLvUpLater'] == 'true';
    const pClassExpSwitch = Number(parameters['ClassExpSwitch'] || 0);
    const pBenchClassExpRate = parameters['BenchClassExpRate'] || '1.00';
    const pUnificationExp = parameters['UnificationExp'] != null
        ? parameters['UnificationExp'] == 'true'
        : false;
    const pNoDuplicateExp = parameters['NoDuplicateExp'] != null
        ? parameters['NoDuplicateExp'] == 'true'
        : false;
    const pOverwriteClassField = parameters['OverwriteClassField'] != null
        ? parameters['OverwriteClassField'] == 'true'
        : true;
    const pShowLevelOnMenu = parameters['ShowLevelOnMenu'] || '';
    const pShowLevelOnStatus = parameters['ShowLevelOnStatus'] != null
        ? parameters['ShowLevelOnStatus'] == 'true'
        : true;
    const pNormalExpWidth = Number(parameters['NormalExpWidth'] || 110);
    const pClassExpWidth = Number(parameters['ClassExpWidth'] || 110);
    const pClassLvMaxExp = parameters['ClassLvMaxExp'] || '-------';
    const pShowMaxLevelMessage = parameters['ShowMaxLevelMessage'] != null
        ? parameters['ShowMaxLevelMessage'] == 'true'
        : false;
    const pMaxLevelMessage = parameters['MaxLevelMessage'] || '%1は%2を極めた！';
    const pShowBenchMaxLevel = parameters['ShowBenchMaxLevel'] != null
        ? parameters['ShowBenchMaxLevel'] == 'true'
        : false;
    const pZeroLevel = parameters['ZeroLevel'] != null
        ? parameters['ZeroLevel'] == 'true'
        : false;
    //----------------------------------------
    // ＭＺ用プラグインコマンド
    //----------------------------------------
    // MVには存在しないため、空で定義しておかないとエラーになる。
    if (!PluginManager.registerCommand) {
        PluginManager.registerCommand = function () { };
    }
    // 重複チェック用
    let mTmpAdditionalClassIds = [];
    let mNoDuplicateExp = false;
    // イベントコマンドから呼び出されたかどうかの判定
    let mCommandFlg = false;
    /**
     * ●職業の追加
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'AddClass', function (args) {
        // // インデックス
        // Furamon:単一職業になったのでいらなくなった、以下インデックス関連は全部CO
        // const index = toNumber(args.Index);
        const additionalClassId = Number(args.AdditionalClass || 0);
        // アクターを取得
        const actor = getActor(args);
        if (!actor) {
            // アクターの指定がない場合は全体を対象化
            if (isForParty(args)) {
                // 通常時
                for (const member of $gameParty.members()) {
                    // 追加職業の追加
                    member.changeAdditionalClass(additionalClassId);
                }
            }
            return;
        }
        // 追加職業の追加
        actor.changeAdditionalClass(additionalClassId);
    });
    /**
     * ●職業の削除
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'RemoveClass', function (args) {
        // // インデックス
        // const index = toNumber(args.Index);
        // // 削除する追加職業ＩＤ
        // const additionalClassId = setDefault(args.AdditionalClass);
        // // 隙間を詰めるかどうか？
        // const fillGap = toBoolean(args.FillGap);
        // アクターを取得
        const actor = getActor(args);
        if (!actor) {
            // アクターの指定がない場合は全体を対象化
            if (isForParty(args)) {
                // 通常時
                for (const member of $gameParty.members()) {
                    // 追加職業の削除
                    member.leaveAdditionalClass();
                    // 追加職業のスキル再習得
                    member.setAllAdditionalClassesSkills();
                }
            }
            return;
        }
        // 追加職業の削除
        actor.leaveAdditionalClass();
        // 追加職業のスキル再習得
        actor.setAllAdditionalClassesSkills();
    });
    /**
     * ●経験値の増減
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'ChangeExp', function (args) {
        // イベントコマンドから呼び出されたかどうかの判定
        mCommandFlg = true;
        // // インデックス
        // const index = toNumber(args.Index);
        // // 追加職業
        // const additionalClassId = setDefault(args.AdditionalClass);
        // 経験値
        let exp = Number(args.Exp || 0);
        // 経験値（変数）
        const variableExp = Number(args.VariableExp || 0);
        // レベルアップを表示
        const show = Boolean(args.ShowLvUpMessage === true);
        // 変数の指定がある場合は優先
        if (variableExp) {
            exp = $gameVariables.value(variableExp);
        }
        // アクターを取得
        const actor = getActor(args);
        if (actor) {
            changeExp(actor, exp, show);
            // アクターの指定がない場合は全体を対象化
        }
        else if (isForParty(args)) {
            // 経験値共有型かつ重複加算禁止の場合
            if (pUnificationExp && pNoDuplicateExp) {
                // 経験値共有用のアクターを対象にする。
                const expActor = getExpActor();
                if (expActor)
                    // // 職業単位で経験値を操作
                    // for (const additionalClass of allPartyAdditionalClasses()) {
                    changeExp(expActor, exp, show);
                // }
            }
            else {
                // 通常時
                for (const actor of $gameParty.members()) {
                    changeExp(actor, exp, show);
                }
            }
        }
        // レベルアップを表示する場合
        // かつ、メッセージが発生した場合
        if (show && $gameMessage.isBusy()) {
            // ウェイトする。
            this.setWaitMode('message');
        }
    });
    /**
     * ●アクターに対して追加職業の経験値を増減させる。
     */
    function changeExp(actor, exp, show) {
        // // 条件指定がある場合
        // if (additionalClassId || index != undefined) {
        //     let additionalClass = undefined;
        //     // インデックスの指定がある場合
        //     if (index != undefined) {
        //         additionalClass = actor.additionalClasses()[index];
        //         if (!additionalClass) {
        //             return;
        //         }
        //     }
        //     // 職業の指定がある場合
        //     if (additionalClassId) {
        //         additionalClass = actor.additionalClass(
        //             additionalClassId,
        //             true
        //         );
        //         if (!additionalClass) {
        //             return;
        //         }
        //     }
        //     if (additionalClass) {
        //         // 経験値の増減
        //         // ※あえて、indexは指定しない。
        //         additionalClass.changeExp(additionalClass.exp() + exp, show);
        //     }
        //     // 未指定ならば、就いている全ての追加職業を対象
        // } else {
        const additionalClass = actor.additionalClass();
        // for (let i = 0; i < additionalClasses.length; i++) {
        //     const additionalClass = additionalClasses[i];
        //     // 経験値の増減
        if (additionalClass) {
            additionalClass.changeExp(additionalClass.exp() + exp, show);
        }
        // }
        // }
    }
    /**
     * ●レベルの増減
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'ChangeLevel', function (args) {
        // イベントコマンドから呼び出されたかどうかの判定
        mCommandFlg = true;
        // // インデックス
        // const index = toNumber(args.Index);
        // // 追加職業
        // const additionalClassId = setDefault(args.AdditionalClass);
        // レベル
        let level = Number(args.Level || 0);
        // レベル（変数）
        const variableLevel = Number(args.VariableLevel || 0);
        // レベルアップを表示
        const show = Boolean(args.ShowLvUpMessage === true);
        // 変数の指定がある場合は優先
        if (variableLevel) {
            level = $gameVariables.value(variableLevel);
        }
        // アクターを取得
        const actor = getActor(args);
        if (actor) {
            changeLevel(actor, level, show);
            // アクターの指定がない場合は全体を対象化
        }
        else if (isForParty(args)) {
            // 経験値共有型かつ重複加算禁止の場合
            if (pUnificationExp && pNoDuplicateExp) {
                // 経験値共有用のアクターを対象にする。
                const expActor = getExpActor();
                if (expActor) {
                    // // 職業単位で経験値を操作
                    const additionalClass = expActor.additionalClass();
                    if (additionalClass) {
                        additionalClass.changeLevel(additionalClass.level + level, show);
                    }
                }
                else {
                    // 通常時
                    for (const actor of $gameParty.members()) {
                        changeLevel(actor, level, show);
                    }
                }
            }
            // レベルアップを表示する場合
            // かつ、メッセージが発生した場合
            if (show && $gameMessage.isBusy()) {
                // ウェイトする。
                this.setWaitMode('message');
            }
        }
    });
    /**
     * ●アクターに対して追加職業のレベルを増減させる。
     */
    function changeLevel(actor, level, show) {
        // // 条件指定がある場合
        // if (additionalClassId || index != undefined) {
        //     let additionalClass = undefined;
        //     // インデックスの指定がある場合
        //     if (index != undefined) {
        //         additionalClass = actor.additionalClasses()[index];
        //         if (!additionalClass) {
        //             return;
        //         }
        //     }
        //     // 職業の指定がある場合
        //     if (additionalClassId) {
        //         additionalClass = actor.additionalClass(
        //             additionalClassId,
        //             true
        //         );
        //         if (!additionalClass) {
        //             return;
        //         }
        //     }
        //     if (additionalClass) {
        //         // 経験値の増減
        //         additionalClass.changeLevel(
        //             additionalClass.level + level,
        //             show
        //         );
        //     }
        //     // 未指定ならば、就いている全ての追加職業を対象
        // } else {
        //     for (const additionalClass of actor.additionalClasses()) {
        // 経験値の増減
        actor.changeLevel(actor.level + level, show);
        // }
        // }
    }
    /**
     * ●追加職業の情報を取得
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'GetInformation', function (args) {
        // アクターを取得
        const actor = getActor(args);
        if (!actor) {
            return;
        }
        // // インデックス
        // const index = Number(args.Index);
        // 追加職業を取得
        const additionalClass = actor.additionalClass();
        // 追加職業のＩＤ
        const variableAtClass = Number(args.VariableAtClass);
        if (variableAtClass) {
            if (additionalClass) {
                $gameVariables.setValue(variableAtClass, additionalClass.id);
            }
            else {
                // 職業情報が取得できない場合も0を設定しておく。
                $gameVariables.setValue(variableAtClass, 0);
            }
        }
        // 追加職業のレベル
        const variableAtLv = Number(args.VariableAtLv);
        if (variableAtLv) {
            if (additionalClass) {
                $gameVariables.setValue(variableAtLv, additionalClass.level);
            }
            else {
                $gameVariables.setValue(variableAtLv, 0);
            }
        }
        // 追加職業の経験値
        const VariableAtExp = Number(args.VariableAtExp);
        if (VariableAtExp) {
            if (additionalClass) {
                $gameVariables.setValue(VariableAtExp, additionalClass.exp());
            }
            else {
                $gameVariables.setValue(VariableAtExp, 0);
            }
        }
    });
    /**
     * ●アクターを取得
     */
    function getActor(args) {
        let actorId = Number(args.Actor || 0);
        // 変数の指定がある場合は優先
        const variablActor = Number(args.VariableActor || 0);
        if (variablActor) {
            actorId = $gameVariables.value(variablActor);
        }
        // アクターを取得
        const actor = $gameActors.actor(actorId);
        return actor;
    }
    /**
     * ●全体が対象かどうか？
     */
    function isForParty(args) {
        const actorId = Number(args.Actor || 0);
        const variablActor = Number(args.VariableActor || 0);
        return !actorId && !variablActor;
    }
    /**
     * ●経験値共有時の参照用のアクターを取得
     */
    function getExpActor() {
        // アクター１で固定
        return $gameActors.actor(1);
    }
    /**
     * ●現在のパーティが就いている全職業を取得
     */
    function allPartyAdditionalClasses() {
        let additionalClasses = [];
        for (const actor of $gameParty.allMembers()) {
            const additionalClass = actor.additionalClass();
            if (additionalClass) {
                // // 重複している場合は次へ
                // if (
                //     additionalClasses.some((ac) => ac.id == additionalClass.id)
                // ) {
                //     continue;
                // }
                // if (additionalClass) {
                // 配列に追加
                additionalClasses.push(additionalClass);
                // }
            }
        }
        // 重複除去して返す
        return additionalClasses;
    }
    //-----------------------------------------------------------------------------
    // AdditionalClass
    //
    // 追加職業を保有するクラス
    /**
     * JSONオブジェクト感覚でアクセスできるようにしておく。
     */
    Object.defineProperties(AdditionalClass.prototype, {
        id: {
            get: function () {
                return this._id;
            },
            configurable: true,
        },
        level: {
            get: function () {
                return this._level;
            },
            configurable: true,
        },
        name: {
            get: function () {
                return this._data.name;
            },
            configurable: false,
        },
        note: {
            get: function () {
                return this._data.note;
            },
            configurable: false,
        },
        learnings: {
            get: function () {
                return this._data.learnings;
            },
            configurable: false,
        },
    });
    /**
     * ●現在の経験値を取得
     */
    AdditionalClass.prototype.exp = function () {
        // 'this' の型を明示
        const actor = this.expActor();
        if (!actor) {
            return 0;
        }
        let exp = actor._exp[this._id];
        // 値が取得できなければ０を設定
        if (!exp) {
            exp = 0;
        }
        return exp;
    };
    /**
     * ●アクターを取得
     */
    AdditionalClass.prototype.actor = function () {
        return this._actor;
    };
    /**
     * ●経験値参照用のアクターを取得
     */
    AdditionalClass.prototype.expActor = function () {
        // ＥＸＰ共有時の場合
        if (pUnificationExp) {
            return getExpActor();
        }
        return this._actor;
    };
    /**
     * ●経験値からレベルを計算
     */
    AdditionalClass.prototype.setLevel = function () {
        const exp = this.exp();
        this._level = 1;
        // 処理高速化のため先に中間レベルをチェックしてもよいかも？
        // exp >= this.expForLevel(50); みたいな感じで
        // 再帰的に現在のレベルを求める。
        while (!this.isMaxLevel() && exp >= Number(this.nextLevelExp())) {
            this._level++;
        }
    };
    /**
     * ●現在の経験値を取得
     */
    AdditionalClass.prototype.currentExp = function (showFlg) {
        // 最大レベル時の表示用
        if (showFlg && this.isMaxLevel()) {
            return pClassLvMaxExp;
        }
        return this.exp();
    };
    /**
     * ●現在レベルまでの経験値を取得
     */
    AdditionalClass.prototype.currentLevelExp = function () {
        return this.expForLevel(this._level);
    };
    /**
     * ●次のレベルの経験値を取得
     */
    AdditionalClass.prototype.nextLevelExp = function (showFlg) {
        // 最大レベル時の表示用
        if (showFlg && this.isMaxLevel()) {
            return pClassLvMaxExp;
        }
        return this.expForLevel(this._level + 1);
    };
    /**
     * ●次のレベルまでの経験値を取得
     */
    AdditionalClass.prototype.nextRequiredExp = function () {
        return Number(this.nextLevelExp()) - Number(this.currentExp());
    };
    // 一時的に強制変更するための職業ＩＤ
    let mForceClassId = null;
    /**
     * ●指定レベルに到達するのに必要な経験値を取得
     */
    AdditionalClass.prototype.expForLevel = function (level) {
        const actor = this.expActor();
        if (!actor) {
            return 0;
        }
        // 参照する職業ＩＤを強制書換
        mForceClassId = this.id;
        // 内部でGame_Actor.prototype.currentClass()を参照
        const exp = actor.expForLevel(level);
        // 職業ＩＤをクリア
        mForceClassId = null;
        return exp;
    };
    /**
     * ●最大レベルかどうか？
     */
    AdditionalClass.prototype.isMaxLevel = function () {
        return this._level >= this.maxLevel();
    };
    /**
     * ●最大レベルを取得
     */
    AdditionalClass.prototype.maxLevel = function () {
        // 職業毎の設定値があれば優先
        if (this._data && this._data.meta.MaxLevel) {
            return Number(this._data.meta.MaxLevel);
        }
        else if (pDefaultMaxLevel) {
            return pDefaultMaxLevel;
        }
        // JSONオブジェクトを取得
        const expActor = this.expActor();
        if (expActor) {
            return expActor.actor().maxLevel;
        }
        // Fallback if expActor is null
        return 99;
    };
    /**
     * ●経験値を変更
     * ※expは加算済みの経験値
     */
    AdditionalClass.prototype.changeExp = function (exp, show) {
        const expActor = this.expActor();
        if (!expActor) {
            return;
        }
        const skillActor = this.actor();
        const classId = this.id;
        // // サブ職業倍率
        // if (index >= 1) {
        //     // 加算前の経験値を求める。
        //     const originalExp = exp - difExp;
        //     // 経験値差分に倍率をかけることでサブ職業の経験値を計算
        //     exp = originalExp + difExp * expActor.subClassExpRate(index);
        // }
        expActor._exp[classId] = Math.max(exp, 0);
        // 変更前のレベル＆スキルを保持
        const lastLevel = this._level;
        const lastSkills = skillActor.skills();
        while (!this.isMaxLevel() &&
            this.exp() >= Number(this.nextLevelExp())) {
            this.levelUp();
        }
        while (this.exp() < this.currentLevelExp()) {
            this.levelDown();
        }
        // レベルアップした場合
        if (this._level > lastLevel) {
            // メッセージを表示
            if (show) {
                this.displayLevelUp(skillActor.findNewSkills(lastSkills));
            }
            // 最大レベル到達を表示
            if (this.maxLevel() == this._level) {
                this.displayLevelMax(show);
            }
        }
        expActor.refresh();
    };
    /**
     * ●レベルを変更
     */
    AdditionalClass.prototype.changeLevel = function (level, show) {
        level = level.clamp(1, this.maxLevel());
        this.changeExp(this.expForLevel(level), show);
    };
    /**
     * ●レベルアップ
     */
    AdditionalClass.prototype.levelUp = function () {
        // 'this' の型を明示
        const actor = this.actor();
        this._level++;
        if (this._data)
            for (const learning of this._data.learnings) {
                if (learning.level === this._level) {
                    // アクターがそのクラスに就いていない場合
                    if (!actor.isAdditionalClassId(this.id)) {
                        // 継続できるスキルを除いて習得しない
                        if (!isKeepSkill(learning.skillId)) {
                            continue;
                        }
                    }
                    // スキルを習得
                    actor.learnSkill(learning.skillId);
                }
            }
    };
    /**
     * ●レベルダウン
     */
    AdditionalClass.prototype.levelDown = function () {
        this._level--;
    };
    // レベルアップ表示の判定用
    let mDisplayLevelUp = false;
    /**
     * ●レベルアップメッセージの表示
     */
    AdditionalClass.prototype.displayLevelUp = function (newSkills) {
        if (pLvUpMessage) {
            const actor = this.actor();
            const text = pLvUpMessage.format(actor.name(), this.name, this._level);
            $gameMessage.newPage();
            $gameMessage.add(text);
        }
        // 習得スキルの表示
        for (const skill of newSkills) {
            $gameMessage.add(TextManager.obtainSkill.format(skill.name));
        }
        mDisplayLevelUp = true;
    };
    /**
     * ●レベルアップ限界の表示
     */
    AdditionalClass.prototype.displayLevelMax = function (show) {
        // 表示しない場合
        if (!pShowMaxLevelMessage) {
            return;
        }
        // コマンド呼び出し、かつ非表示
        if (mCommandFlg && !show) {
            // 表示しない。
            return;
        }
        const actor = this.actor();
        // レベルアップの非表示対象（控え要員）は表示しない。
        // ただし、控えは強制表示する場合は例外
        // ※NRP_BenchMembersExp.jsによる制御
        if (!actor.shouldDisplayLevelUp() && !pShowBenchMaxLevel) {
            return;
        }
        const text = pMaxLevelMessage.format(actor.name(), this.name, this._level);
        // 控え要員の場合のみ改ページする。
        if (!actor.shouldDisplayLevelUp()) {
            $gameMessage.newPage();
        }
        // 改行しながら出力
        for (const line of text.split('\\n')) {
            $gameMessage.add(line);
        }
    };
    //-----------------------------------------------------------------------------
    // 共通処理
    //-----------------------------------------------------------------------------
    /**
     * ●変数初期化
     */
    const _Game_Actor_initMembers = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function () {
        _Game_Actor_initMembers.apply(this, []);
        // 追加職業のＩＤ
        this._additionalClassId = 0;
        // マスター済み職業のＩＤ配列
        this._masteredClassIds = [];
    };
    /**
     * 【独自】追加職業を取得（AdditionalClass型）
     */
    Game_Actor.prototype.additionalClass = function () {
        //  // 全てが対象の場合は、現在就いている職業以外も対象
        // if (targetAll) {
        //     return new AdditionalClass(this, classId);
        // }
        // // 存在チェック
        // const exist = this._additionalClassIds.some(id => id == classId);
        if (this._additionalClassId) {
            return new AdditionalClass(this, this._additionalClassId);
        }
        return undefined;
    };
    /**
     * 【独自】追加職業を取得（JSON）
     */
    Game_Actor.prototype.additionalClassObject = function () {
        return this._additionalClassId
            ? $dataClasses[this._additionalClassId]
            : undefined;
    };
    //  /**
    //  * 【独自】メインの追加職業を取得（AdditionalClass型）
    //  */
    // Game_Actor.prototype.additionalClass = function() {
    //     const classId = this._additionalClassIds[0];
    //     if (classId) {
    //         return new AdditionalClass(this, classId);
    //     }
    //     return undefined;
    // };
    // /**
    //  * 【独自】指定したインデックスの追加職業を取得（AdditionalClass型）
    //  */
    // Game_Actor.prototype.currentAdditionalClass = function(index) {
    //     const classId = this._additionalClassIds[index];
    //     if (classId) {
    //         return new AdditionalClass(this, classId);
    //     }
    //     return undefined;
    // };
    // /**
    //  * 【独自】追加職業の配列を取得（AdditionalClass型）
    //  */
    // Game_Actor.prototype.additionalClasses = function() {
    //     // 空欄を除去
    //     const additionalClassIds = this._additionalClassIds.filter(classId => classId);
    //     return additionalClassIds.map(classId => new AdditionalClass(this, classId));
    // };
    // /**
    //  * 【独自】追加職業の配列を取得（JSON）
    //  */
    // Game_Actor.prototype.additionalClassObjects = function() {
    //     // こちらは構造を残すため、空欄は除去しない。
    //     return this._additionalClassIds.map(classId => classId && $dataClasses[classId]);
    // };
    /**
     * 【独自】追加職業を追加
     */
    Game_Actor.prototype.changeAdditionalClass = function (classId) {
        // インデックスの指定がある場合
        // if (index != undefined) {
        //     // 現在の職業を解除
        //     const currentClassId = this._additionalClassIds[index];
        //     if (currentClassId) {
        //         this.leaveAdditionalClass(currentClassId, index);
        //     }
        //     // 職業を設定
        //     this._additionalClassIds[index] = classId;
        //     // クリア時（classId==null）は終了
        //     if (!classId) {
        //         // 追加職業のスキル再習得
        //         this.setAllAdditionalClassesSkills();
        //         // リフレッシュ（無効になった装備品の解除など）
        //         this.refresh();
        //         return;
        //     }
        // } else {
        //     this._additionalClassIds.push(classId);
        // }
        // 経験値が未設定の場合、初期設定
        if (!this._exp[classId]) {
            this._exp[classId] = 0;
        }
        // ＥＸＰ共有時の場合の初期設定
        if (pUnificationExp) {
            const expActor = getExpActor();
            if (expActor && !expActor._exp[classId]) {
                expActor._exp[classId] = 0;
            }
        }
        // 追加職業のスキル再習得
        this.setAllAdditionalClassesSkills();
        // リフレッシュ（無効になった装備品の解除など）
        this.refresh();
    };
    /**
     * 【独自】追加職業の解除
     */
    Game_Actor.prototype.leaveAdditionalClass = function () {
        // スキルを維持しない場合はスキルを忘れる。
        const additionalClass = this.additionalClass();
        if (additionalClass) {
            // 習得スキルを削除
            for (const learning of additionalClass._data.learnings) {
                // 転職時も維持するスキルなら削除しない。
                if (isKeepSkill(learning.skillId)) {
                    continue;
                }
                this.forgetSkill(learning.skillId);
            }
        }
    };
    /**
     * ●転職時も保持するスキルかどうか？
     */
    function isKeepSkill(skillId) {
        const skillData = $dataSkills[skillId];
        // スキル毎の指定がある場合は優先
        const metaKeepSkill = skillData.meta.KeepSkill != null
            ? String(skillData.meta.KeepSkill) === 'true'
            : undefined;
        if (metaKeepSkill !== undefined) {
            return metaKeepSkill;
        }
        // それ以外は既定値を使用
        return pKeepSkill;
    }
    /**
     * ●現在の職業を取得
     */
    const _Game_Actor_currentClass = Game_Actor.prototype.currentClass;
    Game_Actor.prototype.currentClass = function () {
        // // 'this' の型を明示
        // if (mForceClassId) {
        //     // -1で空白を返す
        //     if (mForceClassId == -1) {
        //         const ret = [];
        //         ret.name = '';
        //         return ret;
        //     }
        //     return $dataClasses[mForceClassId];
        // }
        return _Game_Actor_currentClass.call(this);
    };
    /**
     * 【独自】追加職業のスキルを習得
     */
    Game_Actor.prototype.setAllAdditionalClassesSkills = function () {
        const additionalClass = this.additionalClass();
        if (additionalClass) {
            // 職業のレベルを取得
            const level = additionalClass.level;
            // レベル以下のスキルを取得
            for (const learning of additionalClass.learnings) {
                const learningLevel = pZeroLevel
                    ? learning.level - 1
                    : learning.level;
                if (learningLevel <= level) {
                    this.learnSkill(learning.skillId);
                }
            }
        }
    };
    /**
     * ●職業に紐づくスキルを習得
     */
    const _Game_Actor_initSkills = Game_Actor.prototype.initSkills;
    Game_Actor.prototype.initSkills = function () {
        // 'this' の型を明示
        _Game_Actor_initSkills.apply(this, []);
        // 追加職業のスキル習得
        this.setAllAdditionalClassesSkills();
    };
    /**
     * ●特徴を保有するオブジェクトの取得
     * ※これにより、追加職業の特徴をアクターに反映
     */
    const _Game_Actor_traitObjects = Game_Actor.prototype.traitObjects;
    Game_Actor.prototype.traitObjects = function () {
        const objects = _Game_Actor_traitObjects.apply(this, []);
        const additionalClassObject = this.additionalClassObject();
        if (additionalClassObject) {
            objects.push(additionalClassObject);
        }
        return objects;
    };
    /**
     * ●アクターが追加職業についているか？
     */
    Game_Actor.prototype.isAdditionalClass = function (gameClass) {
        if (!gameClass) {
            return false;
        }
        const currentAdditionalClass = this.additionalClass();
        if (currentAdditionalClass && currentAdditionalClass.id === gameClass.id) {
            return true;
        }
        return false;
    };
    /**
     * ●アクターが追加職業についているか？（ＩＤ）
     */
    Game_Actor.prototype.isAdditionalClassId = function (classId) {
        return this.isAdditionalClass($dataClasses[classId]);
    };
    /**
     * Furamon:パラメータ底上げ処理
     */
    if (pParamPlusByLevel || pParamPlusByTag) {
        const _Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
        Game_Actor.prototype.paramPlus = function (paramId) {
            let value = _Game_Actor_paramPlus.call(this, paramId);
            const additionalClass = this.additionalClass();
            // 追加職業のレベルによる能力値上昇
            if (pParamPlusByLevel && additionalClass && additionalClass._data) {
                const level = additionalClass.level;
                value += additionalClass._data.params[paramId][level];
            }
            // <Addxxx:n>による能力値上昇
            if (pParamPlusByTag) {
                const paramShortNames = [
                    'Mhp',
                    'Mmp',
                    'Atk',
                    'Def',
                    'Mat',
                    'Mdf',
                    'Agi',
                    'Luk',
                ];
                const paramName = paramShortNames[paramId];
                const pattern = new RegExp(`<Add${paramName}:(-?\\d+\\.?\\d*)>`, 'gi'); // 小数点も考慮
                let maxValue = -Infinity;
                const objects = this.traitObjects();
                const noteObjects = [...objects];
                const skillNoteObjects = [];
                // スキルを取得（nullチェック付き）
                const skills = this.skills() || [];
                for (const skill of skills) {
                    if (skill) {
                        skillNoteObjects.push(skill);
                    }
                }
                // <Inheritance> タグがあるかチェック
                if (additionalClass?.note?.includes('<Inheritance>')) {
                    for (const classId of this._masteredClassIds) {
                        const masteredClass = $dataClasses[classId];
                        if (masteredClass) {
                            noteObjects.push(masteredClass);
                        }
                    }
                }
                // TraitObject と Skill 系を結合してノートを走査
                for (const obj of [...noteObjects, ...skillNoteObjects]) {
                    if (obj?.note) {
                        const matches = obj.note.matchAll(pattern);
                        for (const match of matches) {
                            if (match) {
                                const addValue = parseFloat(match[1]);
                                maxValue = Math.max(maxValue, addValue); // 最大値を更新
                            }
                        }
                    }
                }
                // maxValue が -Infinity のままなら、該当するタグがなかったということなので 0 にする
                if (maxValue === -Infinity) {
                    maxValue = 0;
                }
                if (paramName === 'Mhp' || paramName === 'Mmp') {
                    // アクターの基本能力値を取得
                    const baseValue = this.paramBase(paramId);
                    // 基本能力値に乗算を適用し、元のparamPlusの結果に加算
                    value += Math.round(baseValue * (maxValue / 100));
                }
                else {
                    value += maxValue; // 加算
                }
            }
            return value;
        };
    }
    //-----------------------------------------------------------------------------
    // 経験値の加算
    //-----------------------------------------------------------------------------
    if (pUseNormalExp) {
        // 経験値共有型かつ重複加算禁止の場合
        if (pUnificationExp && pNoDuplicateExp) {
            /**
             * ●経験値の増減（イベントコマンド）
             */
            const _Game_Interpreter_command315 = Game_Interpreter.prototype.command315;
            Game_Interpreter.prototype.command315 = function (params) {
                // 重複確認用の一時配列をクリア
                mTmpAdditionalClassIds = [];
                // 経験値の重複加算禁止
                mNoDuplicateExp = true;
                const ret = _Game_Interpreter_command315.call(this, params);
                mNoDuplicateExp = false;
                return ret;
            };
            /**
             * ●戦闘終了時の経験値加算
             */
            const _BattleManager_gainExp = BattleManager.gainExp;
            BattleManager.gainExp = function () {
                // 重複確認用の一時配列をクリア
                mTmpAdditionalClassIds = [];
                // 経験値の重複加算禁止
                mNoDuplicateExp = true;
                _BattleManager_gainExp.apply(this, []);
                mNoDuplicateExp = false;
            };
        }
        /**
         * ●経験値の変更
         * ※イベントコマンド（経験値の増減、レベルの増減）や戦闘終了時など、
         * 　様々な箇所から呼び出される共通処理
         */
        const _Game_Actor_changeExp = Game_Actor.prototype.changeExp;
        Game_Actor.prototype.changeExp = function (exp, show) {
            // 経験値の増減量
            const value = exp - (this.currentExp() || 0);
            _Game_Actor_changeExp.call(this, exp, show);
            // 職業経験値が有効でない場合は変更禁止
            if (!$gameSystem.isClassExpEnabled()) {
                return;
            }
            // 追加職業にも経験値を加算
            const additionalClass = this.additionalClass();
            if (additionalClass) {
                const newExp = additionalClass.exp() + value;
                additionalClass.changeExp(newExp, show);
            }
        };
    }
    //-----------------------------------------------------------------------------
    // 職業経験値の加算
    //-----------------------------------------------------------------------------
    /**
     * 【独自】職業経験値の合計
     */
    Game_Troop.prototype.classExpTotal = function () {
        // 職業経験値が有効でない場合は0
        if (!$gameSystem.isClassExpEnabled()) {
            return 0;
        }
        const total = this.deadMembers().reduce((r, enemy) => r + (enemy instanceof Game_Enemy ? enemy.classExp() : 0), 0);
        // 四捨五入
        return Math.round(total);
    };
    /**
     * 【独自】職業経験値の取得
     */
    Game_Enemy.prototype.classExp = function () {
        const a = this; // eval参照用
        let classExp = 0;
        // 設定値が存在する場合
        const metaClassExp = this.enemy().meta.ClassExp;
        if (metaClassExp != undefined) {
            classExp = Number(metaClassExp);
            // 既定値が存在する場合
        }
        else if (pDefaultClassExp != undefined) {
            classExp = eval(pDefaultClassExp);
        }
        // rateを乗算する。
        const rate = Number(this.enemy().meta.ClassExpRate);
        if (rate != undefined) {
            classExp = (classExp * rate) / 100;
        }
        return classExp;
    };
    /**
     * ●報酬の作成
     */
    const _BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function () {
        // イベントコマンドから呼び出されたかどうかの判定
        mCommandFlg = false;
        _BattleManager_makeRewards.apply(this, []);
        // 報酬に職業経験値を追加
        this._rewards['classExp'] = $gameTroop.classExpTotal();
    };
    /**
     * ●報酬の獲得
     */
    const _BattleManager_gainRewards = BattleManager.gainRewards;
    BattleManager.gainRewards = function () {
        _BattleManager_gainRewards.apply(this, []);
        // 職業経験値が有効なら加算
        if ($gameSystem.isClassExpEnabled()) {
            this.gainClassExp();
        }
    };
    // 職業レベルアップ表示が後回しでない場合
    if (!pClassLvUpLater) {
        /**
         * ●経験値の獲得
         */
        const _Game_Actor_gainExp = Game_Actor.prototype.gainExp;
        Game_Actor.prototype.gainExp = function (exp) {
            _Game_Actor_gainExp.call(this, exp);
            // 職業経験値が有効な場合
            if ($gameSystem.isClassExpEnabled()) {
                // 経験値共有型かつ重複加算禁止の場合は終了
                if (pUnificationExp && pNoDuplicateExp) {
                    return;
                }
                // 職業経験値を加算
                const classExp = BattleManager._rewards.classExp;
                this.gainClassExp(classExp);
            }
        };
    }
    /**
     * 【独自】職業経験値の獲得
     */
    BattleManager.gainClassExp = function () {
        const classExp = this._rewards.classExp;
        // 経験値共有型かつ重複加算禁止の場合
        if (pUnificationExp && pNoDuplicateExp) {
            // 職業単位で経験値を操作
            const additionalClass = getExpActor()?.additionalClass(); // Get the single additional class
            if (additionalClass) {
                // Check if it exists
                const actor = additionalClass.actor();
                const newExp = Number(additionalClass.currentExp()) +
                    Math.round(classExp * actor.finalClassExpRate());
                additionalClass.changeExp(newExp, actor.shouldDisplayLevelUp());
            }
            return;
        }
        // 職業レベルアップ表示を後回しにする場合
        if (pClassLvUpLater) {
            // 通常時はアクター毎に加算
            for (const actor of $gameParty.allMembers()) {
                actor.gainClassExp(classExp);
            }
        }
    };
    /**
     * 【独自】職業経験値の獲得（アクター）
     */
    Game_Actor.prototype.gainClassExp = function (classExp, ignoreBench) {
        const additionalClass = this.additionalClass();
        if (additionalClass) {
            let addExp = classExp;
            // 控えメンバー倍率
            // ※ただし、フラグがオンの場合は無視する。
            //   アイテム使用の場合は控えを無視する必要があるため。
            if (!ignoreBench) {
                addExp *= this.finalClassExpRate();
            }
            const addExpRound = Math.round(addExp);
            const newExp = Number(additionalClass.currentExp()) + addExpRound;
            additionalClass.changeExp(newExp, this.shouldDisplayLevelUp());
        }
    };
    /**
     * 【独自】職業経験値の獲得率
     */
    Game_Actor.prototype.finalClassExpRate = function () {
        // 'this' の型を明示
        let rate = 1;
        const a = this; // eval計算用
        // 倍率計算
        for (const object of this.traitObjects()) {
            const classExpRate = object.meta.ClassExpRate;
            if (classExpRate != null) {
                rate *= eval(classExpRate) / 100;
            }
        }
        return (rate * (this.isBattleMember() ? 1 : this.benchMembersClassExpRate()));
    };
    /**
     * 【独自】控えメンバーの職業経験値比率
     */
    Game_Actor.prototype.benchMembersClassExpRate = function () {
        // 'this' の型を明示
        if (pBenchClassExpRate != undefined) {
            const a = this; // eval計算用
            return eval(pBenchClassExpRate);
        }
        return this.benchMembersExpRate();
    };
    // /**
    //  * 【独自】サブ職業の職業経験値比率
    //  */
    // Game_Actor.prototype.subClassExpRate = function (index) {
    //     if (pSubClassExpRate != undefined) {
    //         // eval計算用
    //         const a = this;
    //         const no = index + 1;
    //         return eval(pSubClassExpRate);
    //     }
    //     return 1;
    // };
    /**
     * ●経験値の表示
     * ※BattleManager.displayRewardsを上書きしたくないので
     * 　こちらの末尾に追加
     */
    const _BattleManager_displayExp = BattleManager.displayExp;
    BattleManager.displayExp = function () {
        _BattleManager_displayExp.apply(this, []);
        // 職業経験値の表示
        const classExp = this._rewards.classExp;
        if (classExp > 0 && pClassExpMessage) {
            const text = pClassExpMessage.format(classExp, pExpName);
            $gameMessage.add('\\.' + text);
        }
    };
    //----------------------------------------
    // 共通関数
    //----------------------------------------
    /**
     * ●職業経験値が有効かどうか？
     */
    Game_System.prototype.isClassExpEnabled = function () {
        // 'this' の型を明示
        // 有効スイッチがオフの場合は変更禁止
        if (pClassExpSwitch && !$gameSwitches.value(pClassExpSwitch)) {
            return false;
        }
        return true;
    };
    //-----------------------------------------------------------------------------
    // 経験値共有用の関数
    //-----------------------------------------------------------------------------
    if (pUnificationExp) {
        /**
         * ●共有用アクターの経験値を反映する。
         */
        Game_Actor.prototype.setUnificationExp = function () {
            // 'this' の型を明示
            const expActor = getExpActor();
            if (expActor) {
                // 共有用アクターなら処理しない。
                if (this == expActor) {
                    return;
                }
                this._exp = expActor._exp;
            }
        };
    }
    //-----------------------------------------------------------------------------
    // 職業欄の表示
    //-----------------------------------------------------------------------------
    if (pOverwriteClassField) {
        /**
         * 【上書】職業の表示
         */
        Window_StatusBase.prototype.drawActorClass = function (actor, x, y, width) {
            // 追加職業の名称を表示し、元の職業は表示しない。
            const additionalClass = actor.additionalClass();
            if (additionalClass) {
                width = width || 168;
                this.resetTextColor();
                this.drawText(additionalClass.name, x, y, width);
            }
        };
        if (pShowLevelOnMenu) {
            /**
             * 【上書】職業の表示
             */
            Window_MenuStatus.prototype.drawActorClass = function (actor, x, y, width) {
                Window_StatusBase.prototype.drawActorClass.call(this, actor, x, y, width);
                // 追加職業のレベルをさらに表示
                const additionalClass = actor.additionalClass();
                if (additionalClass) {
                    // 幅を取得
                    const classNameWidth = this.textSizeEx(additionalClass.name).width;
                    x += classNameWidth + this.itemPadding();
                    // 数字のみ
                    if (pShowLevelOnMenu == 'simple') {
                        this.drawText(String(additionalClass.level), x, y, 30, 'right');
                        // 全表示
                    }
                    else if (pShowLevelOnMenu == 'full') {
                        this.changeTextColor(ColorManager.systemColor());
                        this.drawText(pLvName, x, y, this.innerWidth - x - this.itemPadding() * 2 - 40, 'right');
                        this.resetTextColor();
                        // 追加職業のレベル描画を追加
                        x += 40;
                        this.drawText(String(additionalClass.level), x, y, this.innerWidth - x - this.itemPadding() * 2, 'right');
                    }
                }
            };
        }
    }
    if (pShowLevelOnStatus) {
        /**
         * ●ステータス画面のブロック１
         */
        Window_Status.prototype.drawBlock1 = function () {
            if (!this._actor) {
                return;
            }
            const y = this.block1Y();
            this.drawActorName(this._actor, 6, y, 168);
            this.drawActorLevel(this._actor, 192, y);
            this.drawExpInfo(0, y);
            // this.drawActorClass(this._actor, 192, y, 168);
            // this.drawActorNickname(this._actor, 432, y, 270);
        };
        /**
         * ●アクターレベルの描画
         */
        Window_Status.prototype.drawActorLevel = function (actor, x, y) {
            y = this.block1Y();
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.levelA, x, y, 48);
            this.resetTextColor();
            // 少しＸ座標を詰める
            this.drawText(String(actor.level), x + 42, y, 36, 'right');
            // this.drawText(actor.level, x + 84, y, 36, "right");
        };
        /**
         * ●経験値の描画
         */
        Window_Status.prototype.drawExpInfo = function (x, y) {
            // 'this' の型を明示
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.exp, x - pNormalExpWidth * 2 - 30, y, this.innerWidth - this.itemPadding(), 'right');
            this.resetTextColor();
            // 現在の経験値
            this.drawText(String(this.expTotalValue()), x - pNormalExpWidth - 15, y, this.innerWidth - this.itemPadding(), 'right');
            // "/"
            this.drawText('/', x - pNormalExpWidth, y, this.innerWidth - this.itemPadding(), 'right');
            // 次にレベルアップする経験値
            let nextExp = Number(this.expTotalValue()) + Number(this.expNextValue());
            // 最大レベルの時は-------表記になるので修正
            if (this._actor.isMaxLevel()) {
                nextExp = Number(this.expTotalValue());
            }
            this.drawText(String(nextExp), x, y, this.innerWidth - this.itemPadding(), 'right');
        };
        /**
         * ●ブロック２（２行目）の描画
         */
        Window_Status.prototype.drawBlock2 = function () {
            const y = this.block2Y();
            this.drawActorFace(this._actor, 12, y);
            this.drawBasicInfo(204, y);
            // this.drawExpInfo(456, y);
            // 追加職業の情報
            this.drawClassInfo(this._actor.additionalClass(), 0, y);
            // // サブ職の情報
            // this.drawClassInfo(
            //     this._actor.additionalClasses()[1],
            //     0,
            //     y + this.lineHeight() * 2 + 8
            // );
        };
        /**
         * ●職業経験値の描画
         */
        Window_Status.prototype.drawClassInfo = function (
        // 'this' の型を明示
        additionalClass, x, y) {
            if (!additionalClass) {
                return;
            }
            this.drawText(additionalClass.name, x, y, this.innerWidth - this.itemPadding(), 'right');
            // 下の段に
            y += this.lineHeight();
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(pLvName, x - pClassExpWidth * 2 - 70, y, this.innerWidth - this.itemPadding(), 'right');
            this.resetTextColor();
            // 追加職業のレベル描画を追加
            this.drawText(String(additionalClass.level), x - pClassExpWidth * 2 - 30, y, this.innerWidth - this.itemPadding(), 'right');
            // 現在の経験値
            this.drawText(String(additionalClass.currentExp(true)), x - pClassExpWidth - 15, y, this.innerWidth - this.itemPadding(), 'right');
            // "/"
            this.drawText('/', x - pClassExpWidth, y, this.innerWidth - this.itemPadding(), 'right');
            // 次にレベルアップする経験値
            this.drawText(String(additionalClass.nextLevelExp(true)), x, y, this.innerWidth - this.itemPadding(), 'right');
        };
        /**
         * ●基本情報の出力
         */
        Window_Status.prototype.drawBasicInfo = function (x, y) {
            const lineHeight = this.lineHeight();
            // this.drawActorLevel(this._actor, x, y + lineHeight * 0);
            this.drawActorIcons(this._actor, x, y + lineHeight * 1);
            this.placeBasicGauges(this._actor, x, y + lineHeight * 2);
        };
        /**
         * ●二つ名の描画
         * ※Window_StatusBase.prototype.drawActorNicknameを継承
         */
        Window_Status.prototype.drawActorNickname = function (
        // 'this' の型を明示
        actor, x, y, width) {
            // 描画しない。
        };
    }
    /**
     * 【独自】追加職業のレベル描画
     * ※外部プラグインから参照できるようにpOverwriteClassFieldの外に定義
     */
    Window_StatusBase.prototype.drawAdditionalClassLevel = function (
    // 'this' の型を明示
    additionalClass, x, y) {
        if (!additionalClass) {
            return;
        }
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(pLvName, x, y, 48);
        this.resetTextColor();
        this.drawText(String(additionalClass.level), x + 44, y, 36, 'right');
    };
    //-----------------------------------------------------------------------------
    // 職業経験値の取得（アイテム）
    // （Game_Action）
    //-----------------------------------------------------------------------------
    /**
     * ●効果適用
     */
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function (target) {
        _Game_Action_apply.call(this, target);
        mDisplayLevelUp = false;
        // 職業経験値を加算
        const addClassExp = this.item().meta.AddClassExp;
        if (addClassExp) {
            const result = target.result();
            if (result.isHit()) {
                if (target.gainClassExp) {
                    target.gainClassExp(Number(addClassExp), true);
                }
                this.makeSuccess(target);
            }
        }
        // レベルアップ表示が必要な場合、アイテムメニューを閉じる
        if (mDisplayLevelUp && SceneManager._scene instanceof Scene_Item) {
            SceneManager.goto(Scene_Map);
        }
    };
    /**
     * ●効果適用判定
     */
    const _Game_Action_hasItemAnyValidEffects = Game_Action.prototype.hasItemAnyValidEffects;
    Game_Action.prototype.hasItemAnyValidEffects = function (target) {
        const ret = _Game_Action_hasItemAnyValidEffects.call(this, target);
        // 効果が存在する場合は判定を有効にする。
        return ret || Boolean(this.item().meta.AddClassExp);
    };
    //-----------------------------------------------------------------------------
    // NRP_TraitsPlus.jsとの連携用
    //-----------------------------------------------------------------------------
    /**
     * ●特徴を保有するバトラー系オブジェクトの取得
     */
    const _Game_Actor_traitBattlerObjects = Game_Actor.prototype.traitBattlerObjects;
    Game_Actor.prototype.traitBattlerObjects = function () {
        const objects = _Game_Actor_traitBattlerObjects.call(this);
        // 追加職業を追加（JSON形式で取得）
        const additionalClass = this.additionalClassObject();
        if (additionalClass) {
            objects.push(additionalClass);
        }
        return objects;
    };
    /**
     *  Furamon_AdditionalClassesPatchから移行
     */
    let _lastSkills = []; // 数値またはSkillオブジェクトの配列として宣言
    const _AdditionalClass_changeExp = AdditionalClass.prototype.changeExp;
    AdditionalClass.prototype.changeExp = function (exp, show) {
        _lastSkills = this.actor().skills({
            includeHasAbilitySkills: true,
        });
        _AdditionalClass_changeExp.call(this, exp, show);
    };
    const _AdditionalClass_displayLevelUp = AdditionalClass.prototype.displayLevelUp;
    AdditionalClass.prototype.displayLevelUp = function (newSkills) {
        // 現在のスキル一覧を取得
        const currentSkills = this.actor().skills({
            includeHasAbilitySkills: true,
        });
        // 前回のスキルと比較して新しく習得したスキルを抽出
        const _newSkills = currentSkills
            .filter((skill) => {
            // 前回のスキル一覧に含まれていないスキルを抽出
            return !_lastSkills.some((lastSkill) => (typeof lastSkill === 'number'
                ? lastSkill
                : lastSkill.id) ===
                (typeof skill === 'number' ? skill : skill.id));
        })
            .map((skill) => typeof skill === 'number' ? $dataSkills[skill] : skill);
        _AdditionalClass_displayLevelUp.call(this, _newSkills);
    };
})();
