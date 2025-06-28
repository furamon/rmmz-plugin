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
                : // Window_MenuStatusなら完全透明
                this.constructor.name === 'Window_MenuStatus'
                ? 0
                : 1 / 3;
    };

    // // Window_MenuStatusならカーソル透明
    // Window_MenuStatus.prototype._refreshCursor = function () {
    //     if (this.constructor.name === 'Window_MenuStatus') {
    //         this._cursorSprite.alpha = 0;
    //     }
    // }

    // ZinCursorTween.jsをWindow_MenuStatusでだけ無効にする
    if (Window_Selectable.prototype.setCursorRect) {
        const _Window_Selectable_setCursorRect = Window_Selectable.prototype.setCursorRect;
         Window_Selectable.prototype.setCursorRect = function(x, y, width, height) {
            if (this instanceof Window_MenuStatus) {
                return;
            }
            _Window_Selectable_setCursorRect.call(this,x,y,width,height);
        };
    }

	const _Window_MenuStatus_prototype_processOk = Window_MenuStatus.prototype.processOk;
	Window_MenuStatus.prototype.processOk = function() {
		_Window_MenuStatus_prototype_processOk.call(this);
		// this._cursorSprite.ztSetHandler(this.doLoopCursorTween.bind(this));
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
})();
