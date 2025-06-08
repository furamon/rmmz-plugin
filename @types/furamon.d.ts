interface MetaObject {
    meta: Metadata; // metaプロパティの型をMetadata型で定義
}

declare var ApngLoader: any;
declare var SceneManager: any;
declare var Sprite_Enemy: any;

declare class TextManager {
    public static readonly file: string;
    public static readonly autosave: string;
    public static readonly escapeFailure: string;
}

declare namespace ConfigManager {
    let tauriWindowSize: number;
    function readTauriWindowSize(config: Config);
    interface Config {
        tauriWindowSize: number;
    }
    let messageSpeed: number;
}

interface PluginManager {
    public static checkErrors(): void;
    public static isLoaded(name: string): boolean;
}

declare let Imported: {
    [key: string]: boolean | undefined;
    NUUN_PassiveSkill?: boolean;
};

interface BattleManager {
    rangeEx(action: Game_Action, target: Game_Battler[]): Game_Battler[];
}

interface Scene_Base {
    _partyCommandWindow: Window_PartyCommand;
    _actorCommandWindow: Window_ActorCommand;
}

interface Scene_Battle {
    _enemyNameWindow: Window_EnemyName;
}

declare class Scene_KeyConfig {
    smoothSelect(index: number): void;
    drawItemBackground(): void;
    maxVisibleItems(): number;
    itemRectWithPadding(): Rectangle;
}
interface Game_Map {
    tileUnit?: number;
}

interface Game_Map {
    tileUnit: number;
}

declare namespace Game_Map {
    let tileUnit: number;
}
interface Game_Player {
    setJumpSpeed(speed: number): void;
    setJumpHeight(height: number): void;
    isHalfMove(): boolean;
}

interface Game_BattlerBase {
    isDummyEnemy(): boolean;
}

interface Game_Battler {
    stepBack(): void;
    _reservedResults: Game_ActionResult;
    isUsedSlot(slotId: number): boolean;
    _usedItemSlots: number[];
}

interface Game_Actor {
    mlp: number;
    _lp: number;
    lp: number;
    _regeneDeath: boolean;
    _resurrect: boolean;
    maxLPSet(): void;
    recoverLP(): void;
    getActorClass(): (MZ.Actor | MZ.Class)[];
    getActorClassParamRate(paramId: number): number;
    getStateParamRate(paramId: number): number;
    getEquipParamRate(paramId: number): number;
    passiveObject(): any[];
}

interface Game_Action {
    lpRecover: number;
}

interface Game_ActionResult {
    lpDamage: number;
    _isHitConfirm: boolean;
}

interface Sprite_Damage {
    _isRegenerationWait: boolean;
    _spriteBattler: Sprite_Battler;
    _diffX: number;
    _diffY: number;
    setupLpBreak(target: Game_Battler): void;
    _lpDamage: number;
    _delay: number;
}

interface Sprite_Gauge {
    _lpColor1: string;
    _lpColor2: string;
    _lpTextColorMax: string;
    _lpTextColorZero: string;
    _lpTextColorNormal: string;
}

interface Sprite_Battler {
    _dynamicMotionDuration: number;
}

interface Sprite_Enemy {
    _battler: Game_Battler;
    _dynamicMotionDuration: number;
    startMove(x: number, y: number, duration: number): void;
}

interface _Window {
    __TAURI__: any;
}

interface Window_Options {
    _noTouchSelect: boolean;
    _gamepadOptionIndex: number;
    _keyboardConfigIndex: number;
    changeWindowSizeValue(symbol: string, value: number): void;
}

interface Game_Interpreter {
    _temporaryWindow: Window_TemporaryText;
}
