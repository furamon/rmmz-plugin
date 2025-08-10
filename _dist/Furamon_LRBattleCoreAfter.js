/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore After
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - NRP_EquipItemのキャラ入れ替えでnullエラー修正
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
})();
