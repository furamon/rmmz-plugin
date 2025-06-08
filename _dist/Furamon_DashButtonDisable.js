//------------------------------------------------------------------------------
// Furamon_DashButtonDisable.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/08 1.0.0 公開！
/*:
 * @target MZ
 * @plugindesc ダッシュボタンを無効化するだけ
 * @author Furamon
 * @url
 * @help ダッシュボタンを押したときに何も起きなくします。
 * ついでに常時ダッシュをオプションから抹消します。プラグインパラメータで常時ダッシュの設定を選択できます。
 *
 * @param alwaysDash
 * @text 常時ダッシュ
 * @desc ダッシュボタンを無効化した状態で、常時ダッシュするかどうかを設定します。
 * @type boolean
 * @default true
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * Claude 4 sonnetの力を借りました。
 */
(function () {
    const pluginName = 'Furamon_DashButtonDisable';
    const parameters = PluginManager.parameters(pluginName);
    const alwaysDash = parameters['alwaysDash'] === 'true';
    // Game_Player のダッシュ機能を制御
    Game_Player.prototype.isDashButtonPressed = function () {
        return false; // ダッシュボタンは常に無効
    };
    // 常時ダッシュの設定に応じて歩行速度を制御
    Game_Player.prototype.realMoveSpeed = function () {
        if (alwaysDash) {
            // 常時ダッシュが有効な場合、ダッシュ速度を返す
            return this._moveSpeed + (this.isDashing() ? 1 : 1);
        }
        else {
            // 通常の歩行速度
            return this._moveSpeed + (this.isDashing() ? 1 : 0);
        }
    };
    // Window_Options からalwaysDashオプションを除外
    const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function () {
        _Window_Options_makeCommandList.call(this);
        // alwaysDashコマンドを削除
        for (let i = this._list.length - 1; i >= 0; i--) {
            if (this._list[i].symbol === 'alwaysDash') {
                this._list.splice(i, 1);
            }
        }
    };
})();
