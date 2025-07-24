/*:
 * @target MZ
 * @plugindesc Lightning Rubellum MenuCore
 * @author Furamon
 */

(function () {
    // ショップ画面のレイアウト調整
    Scene_Shop.prototype.statusWidth = function () {
        return Graphics.boxWidth / 2 - 40;
    };

    // Window_ShopBuy.prototype.maxCols = function(){
    //   return 2;
    // };

    Window_ShopSell.prototype.maxCols = function () {
        return 3;
    };

    // コマンド背景薄く（Thanks to MNKR!）
    const _Window_Base_initialize = Window_Base.prototype.initialize;
    Window_Base.prototype.initialize = function (rect) {
        _Window_Base_initialize.call(this, rect);
        // Mano_InputConfigなら不透明
        this._contentsBackSprite.alpha =
            SceneManager._scene?.constructor?.name === 'Scene_KeyConfig_V10'
                ? 1
                : 0;
    };

    // Window_MenuStatusならカーソル透明
    Window_MenuStatus.prototype._refreshCursor = function () {
        if (this.constructor.name === 'Window_MenuStatus') {
            this._cursorSprite.alpha = 0;
        }
    };

    // WASD移動デフォ
    Input.keyMapper[87] = 'up'; //Wキー
    Input.keyMapper[65] = 'left'; //Aキー
    Input.keyMapper[83] = 'down'; //Sキー
    Input.keyMapper[68] = 'right'; //Dキー
    Input.keyMapper[69] = 'pagedown'; //Eキー

    // セーブファイル名表示改変
    // 1番は「クイックセーブ」と表示、残りは本来の番号-1番を表示
    Window_SavefileList.prototype.drawTitle = function (savefileId, x, y) {
        if (savefileId === 0) {
            this.drawText(TextManager.autosave, x, y, 180);
        } else if (savefileId === 1) {
            this.drawText('クイックセーブ', x, y, 240);
        } else {
            this.drawText(TextManager.file + ' ' + (savefileId - 1), x, y, 180);
        }
    };

    // Window_SavefileListならカーソル透明
    Window_SavefileList.prototype._refreshCursor = function () {
        if (this.constructor.name === 'Window_SavefileList') {
            this._cursorSprite.alpha = 0;
        }
    };

    // NRP_AdditionalCCScene競合
    const _Scene_MenuBase_start = Scene_MenuBase.prototype.start;
    Scene_MenuBase.prototype.start = function () {
        // 元の Scene_MenuBase.prototype.start を呼び出す
        _Scene_MenuBase_start.call(this);

        // 現在のシーンインスタンス (this) が Scene_AdditionalCC かどうかを判定
        // (constructor.name を使う方法。コード圧縮に注意)
        if (this.constructor.name === 'Scene_AdditionalCC') {
            // _statusWindow, _slotWindowを無理やり画面外に
            if (this._statusWindow && this._statusWindow.visible) {
                const statusWindowX = 9999; // 画面外
                this._statusWindow.x = statusWindowX;
            }
            if (this._slotWindow && this._slotWindow.visible) {
                const slotWindowX = 9999; // 画面外
                this._slotWindow.x = slotWindowX;
            }
        }
    };
})();
