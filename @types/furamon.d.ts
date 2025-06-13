interface MetaObject {
    meta: Metadata; // metaプロパティの型をMetadata型で定義
}

declare var ApngLoader: any;
declare var SceneManager: any;
declare var Sprite_Enemy: any;

declare var nuunHpGaugeParams: {
    HPPosition?: number; // オプショナルプロパティに変更
    Gauge_X?: number; // オプショナルプロパティに変更
    Gauge_Y?: number; // オプショナルプロパティに変更
};

declare class TextManager {
    public static readonly file: string;
    public static readonly autosave: string;
    public static readonly escapeFailure: string;
}

declare namespace ImageManager {
    export function loadSvEnemy(filename: string, hue?: number): Bitmap;
    export function loadEmptyBitmap(): Bitmap;
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

// Sprite_Battler のコンストラクタ関数の型定義（プロトタイプ操作用）
declare interface Sprite_BattlerConstructor {
    prototype: Sprite_Battler;
    MOTIONS: Record<string, { index: number; loop: boolean; speed: number }>;
    new (): Sprite_Battler;
    [key: string]: any;
}

// グローバルなSprite_Battlerクラス
declare var Sprite_Battler: Sprite_BattlerConstructor;

declare function getSplit(
    metaValue: string | undefined | null
): string[] | null;

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
    isActor(): this is Game_Actor;
    isEnemy(): this is Game_Enemy;
}

interface Game_Battler {
    stepBack(): void;
    _reservedResults: Game_ActionResult;
    isUsedSlot(slotId: number): boolean;
    _usedItemSlots: number[];
    makeSPName?(action?: Game_Action): string | null;
}



declare class Sprite_EnemyHPGauge extends Sprite {
    constructor();
    setup(battler: Game_Battler, type: string): void;
    show(): void;
    hide(): void;
    update(): void;
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

interface Game_Enemy {
    enemy(): MZ.Enemy;
    requestMotion(motionName: string): void;
    makeSPName?(action: Game_Action): string | null;
    isSvActor(): boolean;
    requestSPName(action: Game_Action): string | null;
    isEnemy(): this is Game_Enemy;
    _motionType?: string;
    _motionRefresh?: boolean;
    getActionMotion(action: Game_Action): string;
    getHPGaugePositionX(): number;
    getHPGaugePositionY(): number;
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
    startMotion(motionType: string): void;
    forceMotion(motionType: string): void;
    updateMotionCount(): void;
    refreshMotion(): void;
    _motionCount: number;
    motionSpeed(): number;
    startMove(x: number, y: number, duration: number): void;
    [key: string]: any; // インデックスシグネチャを追加
}

interface Sprite_Enemy {
    battlerOverlay: PIXI.Container;
}

// Sprite_SvActor の型定義
declare class Sprite_SvActor extends Sprite {
    constructor();
    initialize(): void;

    update(): void;
    width: number;
    height: number;
    [key: string]: any; // インデックスシグネチャを追加
}

// Sprite_SvActorのコンストラクタ関数の型定義
declare interface Sprite_SvActorConstructor {
    prototype: Sprite_SvActor;
    new (): Sprite_SvActor;
}

// グローバルなSprite_SvActorクラス
declare var Sprite_SvActor: Sprite_SvActorConstructor;

// Sprite_Actorの型定義（MOTIONSアクセス用）
declare interface Sprite_ActorConstructor {
    MOTIONS: Record<string, any>;
    prototype: any;
}

declare var Sprite_Actor: Sprite_ActorConstructor;

interface _Window {
    __TAURI__: any;
    enemyHPGaugeLength?: string[] | null;
    getSplit?: (tag: string | null | undefined) => string[] | null;
    HPPosition?: number;
    Gauge_X?: number;
    Gauge_Y?: number;
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

declare interface Game_Temp {
    enemyHPGaugeRefresh?: boolean;
}

declare let Gauge_X: number | undefined;
declare let Gauge_Y: number | undefined;
declare let HPPosition: number | undefined;
