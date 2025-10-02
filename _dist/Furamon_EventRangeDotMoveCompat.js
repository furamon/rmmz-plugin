/*:
 * @target MZ
 * @plugindesc NUUN_EventRangeとDotMoveSystemの互換パッチ
 * @author Furamon
 * @base DotMoveSystem
 * @orderAfter DotMoveSystem
 * @orderAfter NUUN_EventRange
 * @help
 * DotMoveSystem使用時にNUUN_EventRangeのイベント接触判定が動作しなくなる問題を修正します。
 * このプラグインは両プラグインより後に読み込んでください。
 * プラグインコマンドはありません。
 */
/*:ja
 * @target MZ
 * @plugindesc DotMoveSystem使用時にNUUN_EventRangeの判定を復旧する互換パッチ
 * @author Furamon
 * @base DotMoveSystem
 * @orderAfter DotMoveSystem
 * @orderAfter NUUN_EventRange
 * @help
 * DotMoveSystemを併用した際にNUUN_EventRangeの各種イベント接触判定が無効化される現象を抑制します。
 * DotMoveSystemおよびNUUN_EventRangeより後に配置してください。
 * プラグインコマンドはありません。
 */
(() => {
    const hasDotMove = PluginManager._scripts.some((name) => name.toLowerCase() === 'dotmovesystem');
    const hasEventRange = PluginManager._scripts.some((name) => name.toLowerCase() === 'nuun_eventrange');
    if (!hasDotMove || !hasEventRange) {
        return;
    }
    const toGrid = (value) => Math.round(value);
    const startRangeEvents = (tileX, tileY, triggers, normal) => {
        if (!Array.isArray(triggers) || triggers.length === 0) {
            return;
        }
        if ($gameMap.isEventRunning()) {
            return;
        }
        const mapAny = $gameMap;
        const candidates = mapAny.eventsRangeEventPlayerXy?.(tileX, tileY) ?? [];
        if (candidates.length === 0) {
            return;
        }
        for (const candidate of candidates) {
            const event = candidate;
            if (!event || typeof event.isTriggerIn !== 'function') {
                continue;
            }
            if (!event.isTriggerIn(triggers)) {
                continue;
            }
            if (event.isNormalPriority() !== normal) {
                continue;
            }
            event.start();
            if ($gameMap.isEventRunning()) {
                break;
            }
        }
    };
    const originalStartMapEvent = Game_Player.prototype.startMapEvent;
    Game_Player.prototype.startMapEvent = function (x, y, triggers, normal) {
        this.setDistanceFrom?.(0, 0);
        originalStartMapEvent.call(this, x, y, triggers, normal);
        if ($gameMap.isEventRunning()) {
            return;
        }
        const gridX = toGrid(x);
        const gridY = toGrid(y);
        startRangeEvents(gridX, gridY, triggers, normal);
    };
    const originalStartMapEventFront = Game_Player.prototype.startMapEventFront;
    Game_Player.prototype.startMapEventFront = function (x, y, d, triggers, normal, isTouch) {
        this.setDistanceFrom?.(0, 0);
        originalStartMapEventFront.call(this, x, y, d, triggers, normal, isTouch);
        if ($gameMap.isEventRunning()) {
            return;
        }
        const originX = toGrid(x);
        const originY = toGrid(y);
        const targetX = $gameMap.roundXWithDirection(originX, d);
        const targetY = $gameMap.roundYWithDirection(originY, d);
        startRangeEvents(targetX, targetY, triggers, normal);
    };
    const originalMoveCallback = Game_CharacterBase.prototype.moveCallback;
    Game_CharacterBase.prototype.moveCallback = function (moved, dpf) {
        originalMoveCallback.call(this, moved, dpf);
        if (!moved) {
            return;
        }
        if (!($gameMap && $gamePlayer)) {
            return;
        }
        if ($gameMap.isEventRunning()) {
            return;
        }
        if (!(this instanceof Game_Event)) {
            return;
        }
        const event = this;
        if (typeof event.range !== 'function') {
            return;
        }
        const hasRangeTag = typeof event.getEventRangeTag === 'function' &&
            !!event.getEventRangeTag();
        if (!hasRangeTag) {
            return;
        }
        if (event._trigger !== 2) {
            return;
        }
        if (!event.isNormalPriority()) {
            return;
        }
        const player = $gamePlayer;
        const px = toGrid(player.x);
        const py = toGrid(player.y);
        const collidedWithPlayer = event.range(px, py);
        let collidedWithFollower = false;
        if (!collidedWithPlayer && typeof player.rangeFollower === 'function') {
            collidedWithFollower = player.rangeFollower(px, py, event);
        }
        if (!collidedWithPlayer && !collidedWithFollower) {
            return;
        }
        const eventTileX = toGrid(event.x);
        const eventTileY = toGrid(event.y);
        if (player.pos(eventTileX, eventTileY)) {
            return;
        }
        player.setDistanceFrom?.(0, 0);
        if (!event.isJumping()) {
            event.start();
        }
    };
})();
