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
        // Mano_InputConfig以外
        this._contentsBackSprite.alpha =
            SceneManager._scene?.constructor?.name === 'Scene_KeyConfig_V10'
                ? 1
                : 1 / 3;
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
        }
        else if (savefileId === 1) {
            this.drawText("クイックセーブ", x, y, 180);
        }
        else {
            this.drawText(TextManager.file + ' ' + (savefileId - 1), x, y, 180);
        }
    };
})();
