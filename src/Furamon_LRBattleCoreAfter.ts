/*:
 * @target MZ
 * @plugindesc Lightning Rubellum BattleCore After
 * @author Furamon
 *
 * @help 以下の処理を加えます。
 * - NRP_EquipItemのキャラ入れ替えでnullエラー修正
 * - NRP_HealAssistのLPが残っているなら戦闘不能者も選択
 *
 */
(function () {
    const PLUGIN_NAME = 'Furamon_LRBattleCoreAfter';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    const pApplyHpHeal = Boolean(
        PluginManager.parameters('NRP_HealAssist')['ApplyHpHeal']
    );

    // 既存のメソッドを保持
    const _Game_Battler_isUsedSlot = Game_Battler.prototype.isUsedSlot;

    // メソッドを上書き
    Game_Battler.prototype.isUsedSlot = function (slotId) {
        // 元のメソッドが存在する場合は呼び出す
        if (_Game_Battler_isUsedSlot) {
            const result = _Game_Battler_isUsedSlot.call(this, slotId);
            if (result) return result;
        }

        // 新しい処理
        this._usedItemSlots = this._usedItemSlots || [];
        return this._usedItemSlots.includes(slotId);
    };

    // NRP_HealAssistをオーバーライド、LPが残っているなら戦闘不能者も選択
    const _Scene_Battle_startActorSelection =
        Scene_Battle.prototype.startActorSelection;
    Scene_Battle.prototype.startActorSelection = function () {
        _Scene_Battle_startActorSelection.call(this);

        // スキルデータを取得
        const action = BattleManager.inputtingAction();
        if (!action) return;
        // 対象をアシスト選択
        setAssistTarget(action, this._actorWindow);
    };

    // 本来の処理を持ってくる

    function setAssistTarget(action: Game_Action, win: Window_BattleActor) {
        // 単体かつ仲間が対象以外は処理しない。
        if (action.isForUser() || !action.isForOne() || !action.isForFriend()) {
            return;
        }

        // ＨＰ回復の場合
        if (
            pApplyHpHeal &&
            (action.isHpRecover() ||
                action
                    .item()
                    ?.effects.some(
                        (effect) => effect.code == Game_Action.EFFECT_RECOVER_HP
                    ))
        ) {
            // 最もＨＰ％の低い生存メンバーを取得
            const member = getHpRecoverTarget();
            if (member) {
                win.select(member.index());
                return;
            }
        }

        function getHpRecoverTarget(): Game_Actor | null {
            // 対象の中で、ＨＰの割合が最も低い者
            // 追加：戦闘不能者も生き返せる場合は選択
            const lpMembers = $gameParty.members().filter((m) => m._lp > 0);
            if (lpMembers.length > 0) {
                // LPが残っていて、HPの割合が最も低い者
                const member = lpMembers.reduce(function (a, b) {
                    return a.hpRate() <= b.hpRate() ? a : b;
                });

                // ＨＰが減っている場合のみ返す
                if (member.hpRate() < 1) {
                    return member;
                }
            }

            // 全快の場合は対象外
            return null;
        }
    }
})();
