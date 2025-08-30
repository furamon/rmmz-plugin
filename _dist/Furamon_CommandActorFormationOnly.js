/*:
 * @target MZ
 * @plugindesc コマンドアクターのみ入れ替え自由
 * @author Furamon
 * @base NUUN_SceneBattleFormation
 * @orderAfter NUUN_SceneBattleFormation
 * @base NRP_CountTimeBattle
 * @orderAfter NRP_CountTimeBattle
 *
 * @help
 * Thanks to NUUN and NRP!
 *
 * 戦闘中でアクターコマンドから並び替えを行う時に、現在コマンドが回っているアクターのみ入れ替えを行えるようにするプラグインです。
 * 入れ替え可能及びCTB前提。
 *
 * 利用規約
 * このプラグインはMITライセンスで配布しています。
 * http://opensource.org/licenses/mit-license.php
 *
 */
(() => {
    Window_FormationBattleMember.prototype.isFormationChangeActorEnabled =
        function (actor) {
            return this.isChangeActorActive(actor);
        };
    Window_FormationMember.prototype.isFormationChangeActorEnabled = function (actor) {
        return this.isChangeActorActive(actor);
    };
    const _Window_FormationBattleMember_initialize = Window_FormationBattleMember.prototype.initialize;
    Window_FormationBattleMember.prototype.initialize = function (rect, formation) {
        _Window_FormationBattleMember_initialize.call(this, rect, formation);
        this._contentsBackSprite.alpha = 1;
    };
    const _Window_FormationMember_initialize = Window_FormationMember.prototype.initialize;
    Window_FormationMember.prototype.initialize = function (rect, formation) {
        _Window_FormationMember_initialize.call(this, rect, formation);
        this._contentsBackSprite.alpha = 1;
    };
    Window_StatusBase.prototype.isChangeActorActive = function (actor) {
        if ($gameParty.inBattle()) {
            // 「アクターのターンが回っている」「アクターが死んでいる」「アクターが前衛にいない」のいずれかか
            if (actor === BattleManager._subject ||
                (actor && actor.isDead()) ||
                !$gameParty.battleMembers().includes(actor) ||
                actor == null) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    };
    const _Window_StatusBase_getFormationSelectActor = Window_StatusBase.prototype.getFormationSelectActor;
    Window_StatusBase.prototype.getFormationSelectActor = function () {
        if ($gameParty.inBattle()) {
            return _Window_StatusBase_getFormationSelectActor.call(this);
        }
    };
    // ターンが回っている味方は背景を緑に
    const _Window_StatusBase_drawBackGroundActor = Window_StatusBase.prototype.drawBackGroundActor;
    Window_StatusBase.prototype.drawBackGroundActor = function (index) {
        const actor = this.actor(index);
        const rect = this.itemRect(index);
        const y = rect.y + (this.itemHeight() - this.rowSpacing() - 51);
        if ($gameParty.inBattle()) {
            if (actor === BattleManager._subject) {
                this.contentsBack.fillRect(rect.x, y - 4, rect.width, 51, ColorManager.textColor(11));
            }
        }
        this.contentsBack.paintOpacity = 255;
        _Window_StatusBase_drawBackGroundActor.call(this, index);
    };
    // 交代直後に動けるように後衛のWTを毎ターン0に
    const _BattleManager_startInput = BattleManager.startInput;
    BattleManager.startInput = function () {
        _BattleManager_startInput.call(this);
        const backYard = $gameParty.allMembers().slice(4);
        backYard.map((actor) => actor.setWt(0));
    };
    // 交代直後に強制的にターン再計算
    const _BattleManager_battleCommandRefresh = BattleManager.battleCommandRefresh;
    BattleManager.battleCommandRefresh = function () {
        if ($gameTemp.formationRefresh) {
            BattleManager.endTurn();
        }
        _BattleManager_battleCommandRefresh.call(this);
    };
})();
