/*:
 * @target MZ
 * @plugindesc Lightning Rubellum MenuCore
 * @author Furamon
 */
(function () {
    // getAlphaPixelに整数でない値が渡されることへの対策
    const _Bitmap_getAlphaPixel = Bitmap.prototype.getAlphaPixel;
    Bitmap.prototype.getAlphaPixel = function (x, y) {
        return _Bitmap_getAlphaPixel.call(this, Math.round(x), Math.round(y));
    };
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
                : 0.3;
    };
    // Window_MenuStatusなら背景なし
    const _Window_MenuStatus_initialize = Window_MenuStatus.prototype.initialize;
    Window_MenuStatus.prototype.initialize = function (rect) {
        _Window_MenuStatus_initialize.call(this, rect);
        this._contentsBackSprite.alpha = 0;
    };
    // カーソルを9patch風に拡縮
    Window.prototype._refreshCursor = function () {
        const drect = this._cursorRect.clone();
        const srect = new Rectangle(96, 96, 48, 48);
        const m = 4;
        for (const child of this._cursorSprite.children) {
            child.bitmap = this._windowskin;
        }
        // 四隅の角は拡縮しない、辺のみ拡縮
        this._setRectPartsGeometry(this._cursorSprite, srect, drect, m);
    };
    // WASD移動デフォ
    Input.keyMapper[87] = 'up'; //Wキー
    Input.keyMapper[65] = 'left'; //Aキー
    Input.keyMapper[83] = 'down'; //Sキー
    Input.keyMapper[68] = 'right'; //Dキー
    Input.keyMapper[69] = 'pagedown'; //Eキー
    // --- セーブファイルリストの改変 ---
    // セーブシーンではリストの項目数を2(オートとクイック)減らす
    const _Window_SavefileList_maxItems = Window_SavefileList.prototype.maxItems;
    Window_SavefileList.prototype.maxItems = function () {
        const originalMax = _Window_SavefileList_maxItems.call(this);
        if (this._mode === 'save') {
            return originalMax - 2;
        }
        return originalMax;
    };
    // セーブシーンではファイルID:0(オートセーブ)と1をスキップする
    const _Window_SavefileList_indexToSavefileId = Window_SavefileList.prototype.indexToSavefileId;
    Window_SavefileList.prototype.indexToSavefileId = function (index) {
        if (this._mode === 'save') {
            return index + 2;
        }
        return _Window_SavefileList_indexToSavefileId.call(this, index);
    };
    const _Window_SavefileList_savefileIdToIndex = Window_SavefileList.prototype.savefileIdToIndex;
    Window_SavefileList.prototype.savefileIdToIndex = function (savefileId) {
        if (this._mode === 'save') {
            return savefileId - 2;
        }
        return _Window_SavefileList_savefileIdToIndex.call(this, savefileId);
    };
    // セーブファイル名表示改変
    Window_SavefileList.prototype.drawTitle = function (savefileId, x, y) {
        if (savefileId === 0) {
            this.drawText(TextManager.autosave, x, y, 180);
        }
        else if (savefileId === 1) {
            this.drawText('クイックセーブ', x, y, 240);
        }
        else {
            const fileNo = savefileId - 1;
            this.drawText(TextManager.file + ' ' + fileNo, x, y, 180);
        }
    };
    // NUUN_SaveScreen_3.js 競合対策
    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function () {
        _Scene_File_start.call(this);
        // セーブモードの場合、初期カーソル位置を調整
        if (this.mode() === 'save') {
            let savefileId = this.firstSavefileId();
            // オートセーブかクイックセーブが選択されるはずだった場合、
            // 最初の有効なセーブファイル(ID:2)を選択する
            if (savefileId <= 1) {
                savefileId = 2;
            }
            this._listWindow.selectSavefile(savefileId);
        }
        // _listWindowの存在と、NUUN_SaveScreen_3.jsの有効性を確認
        if (this._listWindow &&
            typeof this._listWindow.isSaveFileShowAutoSave === 'function') {
            // selectLast() によって設定された index を元にスクロールさせる
            this._listWindow.ensureCursorVisible(true); // NUUN_SaveScreen_3.js v3.1.1以降はtrue推奨
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
    // 装備選択時のウィンドウに「空」表示を追加
    const _Window_EquipItem_isEnabled = Window_EquipItem.prototype.isEnabled;
    Window_EquipItem.prototype.isEnabled = function (item) {
        if (item === null) {
            return true;
        }
        return _Window_EquipItem_isEnabled.call(this, item);
    };
    const _Window_EquipItem_drawItem = Window_EquipItem.prototype.drawItem;
    Window_EquipItem.prototype.drawItem = function (index) {
        const item = this.itemAt(index);
        if (item === null) {
            const rect = this.itemLineRect(index);
            this.resetTextColor();
            this.changePaintOpacity(true);
            this.drawText('空', rect.x, rect.y, rect.width);
        }
        else {
            _Window_EquipItem_drawItem.call(this, index);
        }
    };
    // トランジションを高速化
    Scene_Base.prototype.fadeSpeed = function () {
        return 16;
    };
    Scene_Base.prototype.slowFadeSpeed = function () {
        return this.fadeSpeed() * 1.5;
    };
    // 隊列歩行OFFでも隊列メンバーの集合使用可能
    Game_Followers.prototype.areGathered = function () {
        return this._data.every((follower) => follower.isGathered());
    };
    // NUUN_BattleStyleEX内のアクターステータスはZinTweenのトゥイーンさせない
    const _Scene_Battle_startActorCommandSelection = Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function () {
        _Scene_Battle_startActorCommandSelection.call(this);
        if (this._statusWindow) {
            this._statusWindow.setCursorRect = Window.prototype.setCursorRect;
        }
    };
    // NUUN_SceneFormation内のアクター選択ウィンドウもトゥイーンさせない
    Window_FormationBattleMember.prototype.setCursorRect =
        Window.prototype.setCursorRect;
    Window_FormationMember.prototype.setCursorRect =
        Window.prototype.setCursorRect;
    // 戦闘BGMをOFFだとレベルアップME後BGMが消えることがあるので二段構え
    const _Game_Actor_displayLevelUp = Game_Actor.prototype.displayLevelUp;
    Game_Actor.prototype.displayLevelUp = function (newSkills) {
        if ($gameParty.inBattle()) {
            const bgm = AudioManager.saveBgm();
            _Game_Actor_displayLevelUp.call(this, newSkills);
            AudioManager.replayBgm(bgm);
            return;
        }
        _Game_Actor_displayLevelUp.call(this, newSkills);
    };
})();
