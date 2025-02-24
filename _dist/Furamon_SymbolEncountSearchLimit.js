"use strict";
//------------------------------------------------------------------------------
// Furamon_SymbolEncountSearchLimit.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
/*:
 * @target MV MZ
 * @plugindesc シンボルエンカウント用の経路探索上限調整
 * @author 湿度ケイ（改変：Furamon）
 *
 * @help 湿度ケイ氏のローンチプラグイン改変。
 * プレイヤーのタッチ経路探索上限を減らすことで、エンカウントシンボルにぶつかれるようにします。
 *
 * ----以下元説明----
 * このプラグインには、プラグインコマンドはありません。
 * このプラグインは、RPGツクールMVとMZに対応しています。
 *
 * ■概要
 * タッチ移動時の経路探索上限を減らすことで、イベントシンボルを避けないようにし、シンボルエンカウントとのエンカウント率を上げます。
 * ※注意：副作用として通常のタッチ移動のスペックを大きく損ないます。
 *
 * ■ライセンス表記
 * このプラグインは MIT ライセンスで配布されます。
 * ご自由にお使いください。
 * http://opensource.org/licenses/mit-license.php
 */
(function () {
    Game_Player.prototype.searchLimit = function () {
        return 1;
    };
})();
