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

            // deactivateを無効化するパッチ
            const _statusWindow_Deactivate = this._statusWindow.deactivate;
            this._statusWindow.deactivate = function() {
                if (this._statusInputDisabled) return;
                _statusWindow_Deactivate.call(this);
            };

            this._statusWindow._statusInputPatched = true;
        }
    };

    const _Scene_Battle_startActorCommandSelection =
        Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function () {
        _Scene_Battle_startActorCommandSelection.call(this);

        if (PluginManager._scripts.includes('NRP_CountTimeBattle')) {
            if (this._statusWindow) {
                const actor = BattleManager.actor();
                if (actor) {
                    this._statusWindow.select(actor.index());
                    this._statusWindow.activate();
                    if (this._statusWindow._statusInputPatched) {
                        this._statusWindow._statusInputDisabled = true;
                    }
                }
            }
            if (this._actorCommandWindow) {
                this._actorCommandWindow.activate();
            }
        }
    };

    // 味方選択を開始するときは、ステータスウィンドウの入力を有効化
    const _Scene_Battle_startActorSelection = Scene_Battle.prototype.startActorSelection;
    Scene_Battle.prototype.startActorSelection = function() {
        if (this._statusWindow && this._statusWindow._statusInputPatched) {
            this._statusWindow._statusInputDisabled = false;
        }
        _Scene_Battle_startActorSelection.call(this);
    };

    // 味方選択をキャンセルしたときは、再度ステータスウィンドウの入力を無効化
    const _Scene_Battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
    Scene_Battle.prototype.onActorCancel = function() {
        _Scene_Battle_onActorCancel.call(this);
        if (this._statusWindow && this._statusWindow._statusInputPatched) {
            this._statusWindow.select(BattleManager.actor()!.index());
            this._statusWindow._statusInputDisabled = true;
        }
    };

    // 戦闘終了時は入力無効を解除
    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        if (this._statusWindow && this._statusWindow._statusInputPatched) {
            this._statusWindow._statusInputDisabled = false;
        }
        _Scene_Battle_terminate.call(this);
    };

    const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function () {
        if (_Scene_Battle_isAnyInputWindowActive.call(this)) {
            return true;
        }
        // NUUN_BattleStyleEX競合対策でactivateされたステータスウィンドウを
        // 入力中ウィンドウとして扱うことで、ウィンドウアンフォーカス時の無限ループを防止
        if (PluginManager._scripts.includes('NRP_CountTimeBattle')) {
            if (this._statusWindow && this._statusWindow.active) {
                return BattleManager.isInputting();
            }
        }
        return false;
    };
})();
