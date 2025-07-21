//------------------------------------------------------------------------------
// Furamon_BattleStateList.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc 戦闘中に発動しているステートの説明リストを表示するウィンドウを追加します。
 * @author Furamon
 * @help 戦闘中に発動しているステートの説明リストを出す機能を実装します。
 * プラグインパラメータで指定したボタンを戦闘中に押すことでウィンドウが開閉します。
 * 説明文が設定されているステートのみがリストに表示されます。
 * 
 * ウィンドウは同じボタンか、キャンセルボタンで閉じることができます。
 *
 * @param StateButton
 * @text ステート説明ボタン
 * @desc ステート説明ウィンドウを開くためのボタンを指定します。
 * @type select
 * @option Ctrl
 * @value control
 * @option Shift
 * @value shift
 * @option Alt
 * @value alt
 * @option Tab
 * @value tab
 * @default tab
 *
 * @param StateDescriptions
 * @text ステート説明リスト
 * @desc ステートの説明文を設定します。説明文が空のステートは表示されません。
 * @type struct<StateDescription>[]
 * @default []
 * 
 * @param WindowWidth
 * @text ウィンドウ幅
 * @desc ウィンドウの幅をピクセル単位で指定します。0を指定すると画面幅の90%になります。
 * @type number
 * @default 0
 * 
 * @param WindowHeight
 * @text ウィンドウ高さ
 * @desc ウィンドウの高さをピクセル単位で指定します。0を指定すると画面高さの90%になります。
 * @type number
 * @default 0
 * 
 * @param ItemSpacing
 * @text 項目間の間隔
 * @desc 各ステートの説明の間の縦の間隔をピクセル単位で指定します。
 * @type number
 * @default 12
 */

/*~struct~StateDescription:
 * @param StateId
 * @text 対象ステート
 * @desc 説明文を設定するステートID。
 * @type state
 * @default 1
 *
 * @param Description
 * @text 説明文
 * @desc ステートの説明文です。制御文字が使えます。
 * @type multiline_string
 * @default ""
 */
(function () {
    const pluginName = 'Furamon_BattleStateList';
    const params = PluginManager.parameters(pluginName);

    const stateButton = String(params.StateButton || 'tab');
    const stateDescriptionsRaw: string[] = JSON.parse(params.StateDescriptions || '[]');
    const stateDescriptions = stateDescriptionsRaw.map((item: string) => {
        const parsed = JSON.parse(item);
        return {
            stateId: parseInt(parsed.StateId, 10),
            description: parsed.Description || ''
        };
    });
    const stateDescMap = new Map(stateDescriptions.map(d => [d.stateId, d.description]));

    const windowWidth = Number(params.WindowWidth || 0);
    const windowHeight = Number(params.WindowHeight || 0);
    const itemSpacing = Number(params.ItemSpacing || 12);

    //-----------------------------------------------------------------------------
    // Window_BattleStateList
    //
    // 戦闘中のステート説明ウィンドウです。

    class Window_BattleStateList extends Window_Base {
        _dataStates: MZ.State[];

        constructor(rect: Rectangle) {
            super(rect);
            this.openness = 0;
            this._dataStates = [];
        }

        makeItemList() {
            const actorStates = $gameParty.allMembers().reduce<MZ.State[]>((acc, member) => {
                return acc.concat(member.states());
            }, []);
            const enemyStates = $gameTroop.members().reduce<MZ.State[]>((acc, member) => {
                return acc.concat(member.states());
            }, []);

            const allStates = actorStates.concat(enemyStates);
            const uniqueStateIds = [...new Set(allStates.map(state => state.id))];
            
            this._dataStates = uniqueStateIds
                .filter(id => {
                    const desc = stateDescMap.get(id);
                    return desc && desc.trim() !== '';
                })
                .map(id => $dataStates[id])
                .filter((state): state is MZ.State => !!state);
        }

        refresh() {
            this.contents.clear();
            this.makeItemList();
            
            let y = 0;
            for (const state of this._dataStates) {
                const description = stateDescMap.get(state.id) || '';
                const lineHeight = this.lineHeight();
                
                // アイコンと名前を描画
                this.drawIcon(state.iconIndex, 0, y + 2);
                this.drawText(state.name, 36, y, this.contentsWidth() - 36);
                
                // 説明文を描画し、その高さを計算
                const textState = this.createTextState(description, 0, y + lineHeight, this.contentsWidth());
                this.processAllText(textState);
                const itemHeight = textState.y - y;
                
                y += itemHeight + itemSpacing + this.contents.fontSize;
            }
        }
    }

    //-----------------------------------------------------------------------------
    // Scene_Battle
    //
    // ステートリストウィンドウの呼び出し処理を追加します。

    const _Scene_Battle_initialize = Scene_Battle.prototype.initialize;
    Scene_Battle.prototype.initialize = function() {
        _Scene_Battle_initialize.call(this);
        this._openedStateListFrom = null;
    };

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createStateListWindow();
    };

    Scene_Battle.prototype.createStateListWindow = function() {
        const rect = this.stateListWindowRect();
        this._stateListWindow = new Window_BattleStateList(rect);
        this.addWindow(this._stateListWindow);
    };

    Scene_Battle.prototype.stateListWindowRect = function() {
        const ww = windowWidth > 0 ? windowWidth : Graphics.boxWidth * 0.9;
        const wh = windowHeight > 0 ? windowHeight : Graphics.boxHeight * 0.9;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        return new Rectangle(wx, wy, ww, wh);
    };

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        this.updateStateListWindow();
    };

    Scene_Battle.prototype.updateStateListWindow = function() {
        if (this.isStateListTriggered()) {
            this.toggleStateListWindow();
        } else if (this._stateListWindow.isOpen() && Input.isTriggered("cancel")) {
            this.closeStateListWindow();
        }
    };

    Scene_Battle.prototype.isStateListTriggered = function() {
        return Input.isTriggered(stateButton);
    };

    Scene_Battle.prototype.toggleStateListWindow = function() {
        if (this._stateListWindow.isOpen()) {
            this.closeStateListWindow();
        } else if (!this.isAnyInputWindowActive() || this._partyCommandWindow.active || this._actorCommandWindow.active) {
            this.openStateListWindow();
        }
    };

    Scene_Battle.prototype.openStateListWindow = function() {
        this._openedStateListFrom = null;
        if (this._partyCommandWindow.active) {
            this._openedStateListFrom = "party";
            this._partyCommandWindow.deactivate();
            this._partyCommandWindow.close();
        } else if (this._actorCommandWindow.active) {
            this._openedStateListFrom = "actor";
            this._actorCommandWindow.deactivate();
            this._actorCommandWindow.close();
        }

        this._stateListWindow.refresh();
        if (this._stateListWindow._dataStates.length > 0) {
            this._stateListWindow.open();
            this._stateListWindow.activate();
        } else {
            SoundManager.playBuzzer();
            this.closeStateListWindow();
        }
    };

    Scene_Battle.prototype.closeStateListWindow = function() {
        this._stateListWindow.close();
        this._stateListWindow.deactivate();
        if (this._openedStateListFrom === "party") {
            this._partyCommandWindow.open();
            this._partyCommandWindow.activate();
        } else if (this._openedStateListFrom === "actor") {
            this._actorCommandWindow.open();
            this._actorCommandWindow.activate();
        }
        this._openedStateListFrom = null;
    };
    
    const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        if (this._stateListWindow && this._stateListWindow.active) {
            return true;
        }
        return _Scene_Battle_isAnyInputWindowActive.call(this);
    };

})();