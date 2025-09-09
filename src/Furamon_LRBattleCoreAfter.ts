/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore After
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - NRP_EquipItemのキャラ入れ替えでnullエラー修正
 * - NRP_CountTimeBattle.jsでアクターコマンドキャンセルを差し替え
 * - NRP_CountTimeBattle.jsとNUUN_BattleStyleEX.jsの競合修正
 *
 */
(function () {
    const PLUGIN_NAME = 'Furamon_LRBattleCoreAfter';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    // メソッドを上書き
    Game_Battler.prototype.isUsedSlot = function (slotId) {
        this._usedItemSlots = this._usedItemSlots || [];
        return this._usedItemSlots.includes(slotId);
    };

    // NRP_CountTimeBattle.jsのselectPreviousCommandを上書きして、
    // アクターコマンドのキャンセルでパーティコマンドに戻るのを防ぐ
    const _BattleManager_selectPreviousCommand =
        BattleManager.selectPreviousCommand;
    BattleManager.selectPreviousCommand = function () {
        // NRP_CountTimeBattle.js が有効な場合
        if (
            PluginManager._scripts.includes('NRP_CountTimeBattle') &&
            this.actor()
        ) {
            // アクションを防御に設定
            const action = this.inputtingAction();
            if (action) {
                action.setGuard();
            }
            // ターンを開始して行動を実行させる
            this.startTurn();
        } else {
            // 元の処理を呼び出す
            _BattleManager_selectPreviousCommand.call(this);
        }
    };

    // NUUN_BattleStyleEX.js と NRP_CountTimeBattle.js の競合対策
    // CTBでターンが回ってきたアクターのステータスを点灯させ、行動後も維持する
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);

        if (this._statusWindow && !this._statusWindow._statusInputPatched) {
            this._statusWindow._statusInputDisabled = false;

            // 入力処理を無効化するパッチ
            const _statusWindow_CursorMove = this._statusWindow.processCursorMove;
            this._statusWindow.processCursorMove = function() {
                if (this._statusInputDisabled) return;
                _statusWindow_CursorMove.call(this);
            };
            const _statusWindow_Handling = this._statusWindow.processHandling;
            this._statusWindow.processHandling = function() {
                if (this._statusInputDisabled) return;
                _statusWindow_Handling.call(this);
            };
            const _statusWindow_Touch = this._statusWindow.processTouch;
            this._statusWindow.processTouch = function() {
                 if (this._statusInputDisabled) return;
                _statusWindow_Touch.call(this);
            };

            this._statusWindow._statusInputPatched = true;
        }
    };
})();
