"use strict";
//------------------------------------------------------------------------------
// Furamon_MenuHeight.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
/*:
 * @plugindesc メニュー項目の文字サイズと間隔を調整
 * @target MZ
 * @author Furamon
 *
 * @help メニュー画面の各項目の高さをフォントサイズに合わせて変えられるようにします。
 *
 * 導入するだけでフォントサイズに合わせてメニュー項目の高さが変わります。
 * パラメータから微調整も可能です。
 *
 * @param commandSpacing
 * @text メニュー項目の間隔
 * @desc デフォルトの間隔からどれだけ変えるか
 * @type number
 * @default 0
 * @min -1000
 *
 * @param helpAreaRow
 * @text ヘルプウィンドウの行数
 * @desc ヘルプウィンドウの行数
 * @type number
 * @default 3
 */
(() => {
    const pluginName = "Furamon_MenuHeight";
    const params = PluginManager.parameters(pluginName);
    Window_Base.prototype.lineHeight = () => $gameSystem.mainFontSize() + 10 + parseFloat(params["commandSpacing"] ?? "0");
    Window_Selectable.prototype.lineHeight = () => $gameSystem.mainFontSize() + 10 + parseFloat(params["commandSpacing"] ?? "0");
    Scene_MenuBase.prototype.helpAreaHeight = function () {
        return this.calcWindowHeight(parseInt(params["helpAreaRow"] ?? "2", 10), false);
    };
})();
