//------------------------------------------------------------------------------
// Furamon_DashButtonCommon.js
//------------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc ダッシュでコモンイベント実行
 * @author あなたの名前
 * @url
 * @help マップ上でダッシュボタンを押したときに
 * 通常のダッシュの代わりに指定したコモンイベントを実行します。
 *
 * @param commonEventId
 * @text コモンイベントID
 * @desc ダッシュボタンを押したときに実行するコモンイベントのID
 * @type common_event
 * @default 1
 *
 */

(function () {
    const pluginName = 'Furamon_DashButtonCommon';
    const parameters = PluginManager.parameters(pluginName);
    const commonEventId = Number(parameters['commonEventId'] || 1);

    // Input.update を上書きしてダッシュボタンの入力を監視
    const _Input_update = Input.update;
    Input.update = function () {
        _Input_update.call(this);

        // マップシーンでダッシュボタンが押された瞬間を検知
        if (SceneManager._scene instanceof Scene_Map) {
            if (this.isTriggered('shift') || this.isTriggered('ok')) {
                if (!$gameMap.isEventRunning() && !$gameMessage.isBusy()) {
                    // コモンイベントを実行
                    $gameTemp.reserveCommonEvent(commonEventId);
                }
            }
        }
    };

    // ダッシュ機能を無効化（コモンイベント実行のみにする場合）
    Game_Player.prototype.updateDashing = function () {
        this._dashing = false;
    };
})();
