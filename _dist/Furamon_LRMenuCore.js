"use strict";
/*:
 * @target MZ
 * @plugindesc Lightning Rubellum MenuCore
 * @author Furamon
 *
 * @help Furamon_LRMenuCore.ts
 * メニュー画面のカスタマイズを行います。
 */
// ===== コマンドヘルプ設定 =====
const COMMAND_HELP_DATA = [
    { name: "腕輪", text: "腕輪の コアを 換装し バトルスタイルを 変えます。" },
    { name: "装備", text: "装備を 変更します。" },
    { name: "強さ", text: "キャラクターの ステータスを 表示します。" },
    { name: "配置", text: "キャラクターの 並び替えを 行います。" },
];
(() => {
    // getAlphaPixelに整数でない値が渡されることへの対策
    const _Bitmap_getAlphaPixel = Bitmap.prototype.getAlphaPixel;
    Bitmap.prototype.getAlphaPixel = function (x, y) {
        return _Bitmap_getAlphaPixel.call(this, Math.round(x), Math.round(y));
    };
    // ショップ画面のレイアウト調整
    Scene_Shop.prototype.statusWidth = () => Graphics.boxWidth / 2 - 40;
    // Window_ShopBuy.prototype.maxCols = function(){
    //   return 2;
    // };
    Window_ShopSell.prototype.maxCols = () => 3;
    // コマンド背景薄く（Thanks to MNKR!）
    const _Window_Base_initialize = Window_Base.prototype.initialize;
    Window_Base.prototype.initialize = function (rect) {
        _Window_Base_initialize.call(this, rect);
        // Mano_InputConfigなら不透明
        this._contentsBackSprite.alpha =
            SceneManager._scene?.constructor?.name === "Scene_KeyConfig_V10"
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
    Input.keyMapper[87] = "up"; //Wキー
    Input.keyMapper[65] = "left"; //Aキー
    Input.keyMapper[83] = "down"; //Sキー
    Input.keyMapper[68] = "right"; //Dキー
    Input.keyMapper[69] = "pagedown"; //Eキー
    // --- セーブファイルリストの改変 ---
    // セーブシーンではリストの項目数を2(オートとクイック)減らす
    const _Window_SavefileList_maxItems = Window_SavefileList.prototype.maxItems;
    Window_SavefileList.prototype.maxItems = function () {
        const originalMax = _Window_SavefileList_maxItems.call(this);
        if (this._mode === "save") {
            return originalMax - 2;
        }
        return originalMax;
    };
    // セーブシーンではファイルID:0(オートセーブ)と1をスキップする
    const _Window_SavefileList_indexToSavefileId = Window_SavefileList.prototype.indexToSavefileId;
    Window_SavefileList.prototype.indexToSavefileId = function (index) {
        if (this._mode === "save") {
            return index + 2;
        }
        return _Window_SavefileList_indexToSavefileId.call(this, index);
    };
    const _Window_SavefileList_savefileIdToIndex = Window_SavefileList.prototype.savefileIdToIndex;
    Window_SavefileList.prototype.savefileIdToIndex = function (savefileId) {
        if (this._mode === "save") {
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
            this.drawText("クイックセーブ", x, y, 240);
        }
        else {
            const fileNo = savefileId - 1;
            this.drawText(`${TextManager.file} ${fileNo}`, x, y, 180);
        }
    };
    // NUUN_SaveScreen_3.js 競合対策
    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function () {
        _Scene_File_start.call(this);
        // セーブモードの場合、初期カーソル位置を調整
        if (this.mode() === "save") {
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
            typeof this._listWindow.isSaveFileShowAutoSave === "function") {
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
        if (this.constructor.name === "Scene_AdditionalCC") {
            // _statusWindow, _slotWindowを無理やり画面外に
            if (this._statusWindow?.visible) {
                const statusWindowX = 9999; // 画面外
                this._statusWindow.x = statusWindowX;
            }
            if (this._slotWindow?.visible) {
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
            this.drawText("空", rect.x, rect.y, rect.width);
        }
        else {
            _Window_EquipItem_drawItem.call(this, index);
        }
    };
    // ===== メニュー画面のカスタマイズ =====
    // Scene_Menuの改変
    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createCommandWindow();
        this.createInfoWindow();
        this.createStatusWindow();
    };
    Scene_Menu.prototype.createCommandWindow = function () {
        const rect = this.commandWindowRect();
        const commandWindow = new Window_MenuCommand(rect);
        commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(commandWindow);
        this._commandWindow = commandWindow;
        // コマンド選択時の処理
        commandWindow.setHandler("item", this.commandItem.bind(this));
        commandWindow.setHandler("ability", this.commandPersonal.bind(this));
        commandWindow.setHandler("equip", this.commandPersonal.bind(this));
        commandWindow.setHandler("status", this.commandPersonal.bind(this));
        commandWindow.setHandler("formation", this.commandFormation.bind(this));
        commandWindow.setHandler("options", this.commandOptions.bind(this));
        commandWindow.setHandler("save", this.commandSave.bind(this));
        commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
    };
    // コマンドウィンドウのスタート処理をオーバーライドして初期ヘルプを設定
    const _Scene_Menu_start = Scene_Menu.prototype.start;
    Scene_Menu.prototype.start = function () {
        _Scene_Menu_start.call(this);
        // 初回のコマンドヘルプを設定
        if (this._commandWindow && this._infoWindow) {
            const commandData = this._commandWindow.currentData();
            this._infoWindow.setCommandName(commandData ? commandData.name : "");
        }
    };
    // アクター選択からのキャンセル処理を追加
    Scene_Menu.prototype.onPersonalCancel = function () {
        this._statusWindow.deselect();
        this._commandWindow.activate();
    };
    Scene_Menu.prototype.onFormationCancel = function () {
        if (this._statusWindow.pendingIndex() >= 0) {
            this._statusWindow.setPendingIndex(-1);
            this._statusWindow.activate();
        }
        else {
            this._statusWindow.deselect();
            this._commandWindow.activate();
        }
    };
    Scene_Menu.prototype.commandWindowRect = () => {
        const ww = 150;
        const wh = 596;
        const wx = Graphics.boxWidth - ww;
        const wy = 116;
        return new Rectangle(wx, wy, ww, wh);
    };
    // Window_MenuCommandの拡張: コマンド選択変更時にヘルプを更新
    const _Window_MenuCommand_update = Window_MenuCommand.prototype.update;
    Window_MenuCommand.prototype.update = function () {
        const lastIndex = this.index();
        _Window_MenuCommand_update.call(this);
        // インデックスが変わったらヘルプを更新
        if (this.index() !== lastIndex) {
            const scene = SceneManager._scene;
            if (scene?._infoWindow) {
                const commandData = this.currentData();
                scene._infoWindow.setCommandName(commandData ? commandData.name : "");
            }
        }
    };
    Scene_Menu.prototype.createInfoWindow = function () {
        const rect = this.infoWindowRect();
        this._infoWindow = new Window_MenuInfo(rect);
        this.addWindow(this._infoWindow);
    };
    Scene_Menu.prototype.infoWindowRect = () => {
        const wx = 0;
        const wy = 0;
        const ww = Graphics.boxWidth;
        const wh = 112;
        return new Rectangle(wx, wy, ww, wh);
    };
    Scene_Menu.prototype.createStatusWindow = function () {
        const rect = this.statusWindowRect();
        this._statusWindow = new Window_MenuStatus_Custom(rect);
        this.addWindow(this._statusWindow);
    };
    Scene_Menu.prototype.statusWindowRect = () => {
        const wx = 0;
        const wy = 116;
        const ww = Graphics.boxWidth - 150; // 右側のコマンドウィンドウ分を除く
        const wh = 202 * 3 + 12 * 2; // itemHeight(202) × 3行 + パディング
        return new Rectangle(wx, wy, ww, wh);
    };
    // ===== インフォウィンドウ =====
    class Window_MenuInfo extends Window_Base {
        _commandName;
        constructor(rect) {
            super(rect);
            this._commandName = "";
            this.refresh();
        }
        update() {
            super.update();
            // プレイ時間を毎フレーム更新
            if (Graphics.frameCount % 60 === 0) {
                this.refresh();
            }
        }
        setCommandName(name) {
            if (this._commandName !== name) {
                this._commandName = name;
                this.refresh();
            }
        }
        refresh() {
            this.contents.clear();
            // 現在地表示
            const mapName = $gameMap.displayName() || "不明";
            this.drawText("現在地:", 0, 4, 160);
            this.drawText(mapName, 116, 4, 500);
            // 陣形表示
            const formationName = $gameParty.currentFormation
                ? $gameParty.currentFormation()._name
                : "???";
            this.drawText("陣形:", 494, 4, 120);
            this.drawText(formationName, 580, 4, 400);
            // プレイ時間表示
            const playTime = $gameSystem.playtimeText();
            this.drawText("プレイ時間:", Graphics.boxWidth - 360, 4, 180);
            this.drawText(playTime, Graphics.boxWidth - 180, 4, 220, "left");
            // コマンド説明
            const helpData = COMMAND_HELP_DATA.find((h) => h.name === this._commandName);
            const helpText = helpData ? helpData.text : "";
            this.drawText(helpText, 0, 48, Graphics.boxWidth - 300, "left");
            // 所持金
            const currencyUnit = $dataSystem.currencyUnit;
            this.contents.fontSize -= 8;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(currencyUnit, Graphics.boxWidth - 68, 50, 64, "left");
            this.resetFontSettings();
            this.drawText($gameParty.gold().toString(), Graphics.boxWidth - 520, 48, 448, "right");
        }
    }
    // ===== カスタムステータスウィンドウ =====
    class Window_MenuStatus_Custom extends Window_Selectable {
        _statusBackgrounds;
        _formationMode;
        _pendingIndex;
        _lastFrameCount;
        constructor(rect) {
            super(rect);
            this._statusBackgrounds = [];
            this._formationMode = false;
            this._pendingIndex = -1;
            this._lastFrameCount = 0;
            this.opacity = 0;
            this.padding = 0;
            this.refresh();
        }
        update() {
            super.update();
            // 6フレームごとにアニメーション更新(SVアクターのデフォルト速度)
            if (Graphics.frameCount - this._lastFrameCount >= 6) {
                this._lastFrameCount = Graphics.frameCount;
                this.contents.clear();
                this.drawAllItems();
            }
        }
        // Window_MenuStatus互換メソッド
        numVisibleRows() {
            // 3行固定(2列×3行で最大6人表示)
            return 3;
        }
        actor(index) {
            return $gameParty.members()[index];
        }
        drawActorClass(actor, x, y, width) {
            this.resetTextColor();
            this.drawText(actor.currentClass().name, x, y, width);
        }
        setFormationMode(formationMode) {
            this._formationMode = formationMode;
        }
        pendingIndex() {
            return this._pendingIndex;
        }
        setPendingIndex(index) {
            const lastPendingIndex = this._pendingIndex;
            this._pendingIndex = index;
            if (lastPendingIndex >= 0) {
                this.redrawItem(lastPendingIndex);
            }
            if (this._pendingIndex >= 0) {
                this.redrawItem(this._pendingIndex);
            }
        }
        isCurrentItemEnabled() {
            if (this._formationMode) {
                const actor = $gameParty.members()[this.index()];
                return actor?.isFormationChangeOk();
            }
            else {
                return true;
            }
        }
        processOk() {
            super.processOk();
            $gameParty.setMenuActor($gameParty.members()[this.index()]);
        }
        selectLast() {
            this.smoothSelect($gameParty.menuActor().index() || 0);
        }
        drawPendingItemBackground(index) {
            if (index === this._pendingIndex) {
                const rect = this.itemRect(index);
                const color = ColorManager.pendingColor();
                this.changePaintOpacity(false);
                this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
                this.changePaintOpacity(true);
            }
        }
        drawItemImage(_index) {
            // 実装不要(drawItemで描画)
        }
        drawItemStatus(_index) {
            // 実装不要(drawItemで描画)
        }
        // 以下、追加の互換メソッド(NUUN_MenuScreenEX等の互換性用)
        formationMode() {
            return this._formationMode;
        }
        isChangeActorActive() {
            return this._formationMode && this._pendingIndex >= 0;
        }
        getFormationSelectActor() {
            return this.actor(this.index());
        }
        drawBackGroundActor(_index) {
            // 背景は既にdrawItemで描画済み
        }
        drawBackGroundActorContents(_index) {
            // 背景は既にdrawItemで描画済み
        }
        actorBackGroundImage(_index) {
            return "";
        }
        actorFrontImageDate(_index) {
            return null;
        }
        actorFrontImageEX(_index) {
            return null;
        }
        actorName(n) {
            const actor = this.actor(n);
            return actor ? actor.name() : "";
        }
        drawActorNameEx(actor, x, y, _width) {
            this.drawTextEx(actor.name(), x, y);
        }
        drawActorSimpleStatus(_actor, _x, _y) {
            // 実装不要(drawItemで描画)
        }
        drawItemBackground(_index) {
            // 実装不要
        }
        lineHeight() {
            return 36;
        }
        gaugeLineHeight() {
            return 24;
        }
        itemPadding() {
            return 8;
        }
        drawContentsBackground(_x, _y, _width, _height) {
            // 実装不要
        }
        contentsBackGroundImage() {
            return "";
        }
        drawAdditionalClassLevel(_additionalClass, _x, _y) {
            // 実装不要(drawItemで描画)
        }
        _additionalSprites = {};
        loadFaceImages() {
            // 実装不要
        }
        hideAdditionalSprites() {
            // 実装不要
        }
        showAdditionalSprites() {
            // 実装不要
        }
        actorBackImg(_actor) {
            return "";
        }
        actorFrontImg(_actor) {
            return "";
        }
        actorBackGroundImageContents(_actor) {
            return null;
        }
        drawActorGraphicImg(_index) {
            // 実装不要
        }
        drawActorFrontImg(_index) {
            // 実装不要
        }
        graphicMode(_actor) {
            return "img";
        }
        placeActorName(actor, x, y) {
            this.drawTextEx(actor.name(), x, y);
        }
        placeStateIcon(_actor, _x, _y) {
            // 実装不要
        }
        placeGauge(_actor, _type, _x, _y) {
            // 実装不要
        }
        createInnerSprite(_key, _spriteClass) {
            // 実装不要
            return new Sprite();
        }
        placeTimeGauge(_actor, _x, _y) {
            // 実装不要
        }
        drawIcon(_iconIndex, _x, _y) {
            // 実装不要(基本クラスに存在)
        }
        drawFace(_faceName, _faceIndex, _x, _y, _width, _height) {
            // 実装不要(基本クラスに存在)
        }
        drawCharacter(_characterName, _characterIndex, _x, _y) {
            // 実装不要(基本クラスに存在)
        }
        placeBasicGauges(_actor, _x, _y) {
            // 実装不要
        }
        drawActorCharacter(actor, x, y) {
            this.drawCharacter(actor.characterName(), actor.characterIndex(), x, y);
        }
        drawActorFace(actor, x, y, width, height) {
            this.drawFace(actor.faceName(), actor.faceIndex(), x, y, width, height);
        }
        drawActorName(actor, x, y, _width) {
            this.drawTextEx(actor.name(), x, y);
        }
        drawActorLevel(actor, x, y) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.levelA, x, y, 48);
            this.resetTextColor();
            this.drawText(String(actor.level), x + 48, y, 36, "right");
        }
        drawActorIcons(_actor, _x, _y, _width) {
            // 実装不要
        }
        drawActorNickname(actor, x, y, width) {
            this.drawText(actor.nickname(), x, y, width);
        }
        actorSlotName(actor, index) {
            const slots = actor.equipSlots();
            return $dataSystem.equipTypes[slots[index]];
        }
        maxCols() {
            return 2;
        }
        maxItems() {
            return $gameParty.size(); // 全メンバーを表示
        }
        itemHeight() {
            return 202;
        }
        setCursorRect(x, y, _width, height) {
            super.setCursorRect(x, y, 100, height - 12);
        }
        refresh() {
            // 既存の背景スプライトをクリア
            for (const sprite of this._statusBackgrounds) {
                this.removeChild(sprite);
            }
            this._statusBackgrounds = [];
            // 背景スプライトを作成(アクターの右側に配置)
            const bgBitmap = ImageManager.loadSystem("StatusWindow");
            for (let i = 0; i < this.maxItems(); i++) {
                const rect = this.itemRect(i);
                const sprite = new Sprite(bgBitmap);
                sprite.x = rect.x + 96; // アクターの右に配置
                sprite.y = rect.y;
                this.addChildToBack(sprite);
                this._statusBackgrounds.push(sprite);
            }
            super.refresh();
        }
        drawItem(index) {
            const actor = $gameParty.members()[index];
            if (!actor)
                return;
            const rect = this.itemRect(index);
            const x = rect.x + 12; // 本来のパディングを足す
            const y = rect.y + 12;
            // SVアクター画像(アニメーション対応、左側に配置)
            this.drawSvActor(actor, x + 16, y + 100);
            // 名前
            this.drawTextEx(actor.name(), x + 108, y);
            // レベル
            this.changeFontSize(-6);
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.levelA, x + 290, y + 4, 76, "left");
            this.resetTextColor();
            this.resetFontSettings();
            this.drawText(actor.level.toString(), x + 306, y + 2, 76, "right");
            this.resetFontSettings();
            // 職業(追加クラス)
            const job = actor.additionalClass
                ? actor.additionalClass()
                : null;
            let jobText = "";
            if (job?._data && !job._data.meta.NoGrow) {
                const jobName = job.name.substring(0, 7);
                const levelSuffix = job.level === 6 || (job.id === 24 && job.level === 3)
                    ? "M!"
                    : `L${job.level - 1}`;
                jobText = jobName + levelSuffix;
            }
            this.drawText(jobText, x + 108, y + 43, 280);
            // HP最大値
            this.changeFontSize(-6);
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("HP", x + 392, y + 4, 48);
            this.resetTextColor();
            this.resetFontSettings();
            this.drawText(actor.mhp.toString(), x + 400, y + 2, 120, "right");
            // LP現在値 / LP最大値 (2行目、上に-3px、フォントサイズ-3)
            const lp = actor.lp || 0;
            const mlp = actor.mlp || 99;
            this.changeFontSize(-6);
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("LP", x + 392, y + 45, 48);
            this.resetFontSettings();
            this.drawText(lp.toString(), x + 402, y + 43, 70, "right");
            this.changeFontSize(-12);
            this.drawText("/", x + 472, y + 46, 20, "center");
            this.changeFontSize(-6);
            this.drawText(mlp.toString(), x + 492, y + 47, 30, "left");
            this.resetFontSettings();
            // ステータス
            const statY = y + 83;
            // ステータス(左列)
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("攻撃", x + 108, statY, 72);
            this.resetTextColor();
            this.drawText(actor.param(2).toString(), x + 160, statY, 80, "right");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("器用", x + 108, statY + 40, 72);
            this.resetTextColor();
            this.drawText(actor.param(7).toString(), x + 160, statY + 40, 80, "right");
            // ステータス(中央列)
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("防御", x + 248, statY, 72);
            this.resetTextColor();
            this.drawText(actor.param(3).toString(), x + 300, statY, 80, "right");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("集中", x + 248, statY + 40, 72);
            this.resetTextColor();
            this.drawText(actor.param(5).toString(), x + 300, statY + 40, 80, "right");
            // ステータス(右列)
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("増幅", x + 388, statY, 72);
            this.resetTextColor();
            this.drawText(actor.param(4).toString(), x + 440, statY, 80, "right");
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("素早", x + 388, statY + 40, 72);
            this.resetTextColor();
            this.drawText(actor.param(6).toString(), x + 440, statY + 40, 80, "right");
        }
        drawSvActor(actor, x, y) {
            const name = actor.battlerName();
            const bitmap = ImageManager.loadSvActor(name);
            if (!bitmap.isReady())
                return;
            // BattleMotionMZ対応チェック
            const hasBattleMotion = typeof Sprite_Battler !== "undefined" &&
                Sprite_Battler.MOTIONS;
            let motionIndex = 0; // walkモーション
            if (hasBattleMotion) {
                // BattleMotionMZ使用時
                const cellSize = bitmap.height / 6; // 正方形セル
                const motions = Sprite_Battler.MOTIONS;
                const walkMotion = motions.walk;
                if (walkMotion) {
                    motionIndex = walkMotion.index;
                }
                const motionCount = Object.keys(motions).length;
                const motionRows = 6;
                const totalColumns = Math.ceil(motionCount / motionRows);
                const totalFrames = bitmap.width / cellSize;
                const framesPerMotion = Math.floor(totalFrames / totalColumns);
                // モーションのコマ数を検出(透明ピクセル&カラーコマ考慮)
                let actualFrames = 0;
                const col = Math.floor(motionIndex / motionRows);
                const row = motionIndex % motionRows;
                const startX = col * framesPerMotion * cellSize;
                for (let i = 0; i < framesPerMotion; i++) {
                    const checkX = startX + i * cellSize + 1;
                    const checkY = row * cellSize + 1;
                    const color = bitmap.getPixel(checkX, checkY);
                    // カラーコマ(赤・黄・緑のいずれか)が見つかったら終了
                    if (color !== "#000000") {
                        const r = parseInt(color.substring(1, 3), 16);
                        const g = parseInt(color.substring(3, 5), 16);
                        if (r === 255 || g === 255) {
                            actualFrames = i;
                            break;
                        }
                    }
                }
                if (actualFrames === 0)
                    actualFrames = framesPerMotion;
                // 往復アニメーション: 1->2->3->2->1->2...
                const maxFrames = Math.min(3, actualFrames);
                const cycle = maxFrames * 2 - 2; // 3フレームなら4(1,2,3,2の繰り返し)
                const frameIndex = Math.floor(Graphics.frameCount / 12) % cycle;
                let pattern;
                if (frameIndex < maxFrames) {
                    pattern = frameIndex;
                }
                else {
                    pattern = cycle - frameIndex;
                }
                const cx = col * framesPerMotion + pattern;
                const cy = row;
                const sx = cx * cellSize;
                const sy = cy * cellSize;
                // 座標を調整
                // (うちのフォーマットのSVアクターにしか対応しないが自分専用プラグインなので問題はない)
                this.contents.blt(bitmap, sx, sy, cellSize, cellSize, x - 50, y - 100);
            }
            else {
                // 標準SVアクター: 9x6グリッド、往復アニメーション
                const pw = bitmap.width / 9;
                const ph = bitmap.height / 6;
                const cycle = 4; // 0,1,2,1の繰り返し
                const frameIndex = Math.floor(Graphics.frameCount / 12) % cycle;
                let pattern;
                if (frameIndex < 3) {
                    pattern = frameIndex;
                }
                else {
                    pattern = cycle - frameIndex;
                }
                const sx = pattern * pw;
                const sy = motionIndex * ph;
                // 座標を調整(FallBack)
                this.contents.blt(bitmap, sx, sy, pw, ph, x, y - 50);
            }
        }
        changeFontSize(offset) {
            this.contents.fontSize = $gameSystem.mainFontSize() + offset;
        }
    }
    // トランジションを高速化
    Scene_Base.prototype.fadeSpeed = () => 16;
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
})();
