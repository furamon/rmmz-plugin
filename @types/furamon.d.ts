interface MetaObject {
    meta: Metadata; // metaプロパティの型をMetadata型で定義
}

declare var ApngLoader: any;
declare var SceneManager: any;
declare var Sprite_Enemy: any;

declare let EnemyStatePosition: number;
declare let State_X: number;
declare let State_Y: number;
declare let stateVisible: number;

// Motion関連の型定義を修正・追加
interface StandardMotion {
    index: number;
    loop: boolean;
}

interface StandardMotions {
    [key: string]: StandardMotion;
    walk: StandardMotion;
    wait: StandardMotion;
    chant: StandardMotion;
    guard: StandardMotion;
    damage: StandardMotion;
    evade: StandardMotion;
    thrust: StandardMotion;
    swing: StandardMotion;
    missile: StandardMotion;
    skill: StandardMotion;
    spell: StandardMotion;
    item: StandardMotion;
    escape: StandardMotion;
    victory: StandardMotion;
    dying: StandardMotion;
    abnormal: StandardMotion;
    sleep: StandardMotion;
    dead: StandardMotion;
}

interface Motion {
    [key: string]: StandardMotion;
}

declare function getStandardMotions(): StandardMotions;

declare var nuunHpGaugeParams: {
    HPPosition?: number;
    Gauge_X?: number;
    Gauge_Y?: number;
};

declare namespace BattleManager {
    interface Spriteset {
        battlerSprites(): Sprite_Battler[];
    }
}

declare class TextManager {
    public static readonly file: string;
    public static readonly autosave: string;
}

declare namespace ImageManager {
    export function loadSvEnemy(filename: string, hue?: number): Bitmap;
    export function loadSvWeapon(filename: string): Bitmap;
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

// For Furamon_TorigoyaMZ_FrameTween
interface TweenableWindowSetting {
    openSetting: TweenSetting;
    closeSetting: TweenSetting;
}

interface TweenableWindow {
    window: WindowLike;
    setting: TweenableWindowSetting;
}

interface Scene_Base {
    _tweenableWindows: TweenableWindow[];
    _isPoppingWithTween: boolean;
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

interface Scene_MenuBase {
    _statusWindow: Window_Status;
    _slotWindow: Window_Selectable;
}

interface Scene_Map{
    _mapResumeEffectDuration: number;
}

interface MapResumeEffect {
    duration: number;
    maxDuration: number;
    startX: number;
    startY: number;
    startScale: number;
    initialized: boolean;
}

interface Game_Map {
    tileUnit: any;
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
    _reservedResults: Game_ActionResult;
    isUsedSlot(slotId: number): boolean;
    _usedItemSlots: number[];
    makeSPName?(action?: Game_Action): string | null;
    enemy(): MZ.Enemy;
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
    _motion?: string;
    _motionRefresh?: boolean;
    getHPGaugePositionX(): number;
    getHPGaugePositionY(): number;
    performAttackDynamicMotion(weaponId: number, weaponType: string): void;
    _battlerName: string;
    weapons(): any[];
    weapon(): { wtypeId: number } | null;
    _damaged: boolean;
    _damageMotionCount: number;
    originalCollapseId(): number | null;
    originalCollapseData(): CollapseData | null;
}

interface Game_Action {
    lpRecover: number;
}

interface Game_ActionResult {
    lpDamage: number;
    _isHitConfirm: boolean;
}

interface Sprite {
    startDynamicMotion(dynamicMotion: any): void;
    startDynamicSvMotion(dynamicMotion: any): void;
    endDynamicMotion(dynamicMotion: any): void;
    _isDynamicMotionPlaying: boolean;
    _isSvActorEnemy: boolean;
    _svActorSprite: Sprite_Battler;
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
    _motionType: string;
    [key: string]: any; // インデックスシグネチャを追加
}

interface Sprite_Enemy {
    getMotionDefinition(motionType: string): StandardMotion;
    updateMotionCount(): void;
    playDamageMotionTemporary?(): void;
    restoreSavedMotion?(): void;
    playTemporaryMotion?(motionType: string, duration?: number): void;
    clearSvActorMotion?(): void;
    _savedMotion?: any;
    // 既存のプロパティ
    battlerOverlay: PIXI.Container;
    _battler: Game_Enemy;
}

// Game_Temp インターフェースを拡張
declare interface Game_Temp {
    enemyHPGaugeRefresh?: boolean;
    enemyStateRefresh?: boolean;
    refreshOverlay?: boolean;
}

// Sprite_StateIcon インターフェースを拡張
declare class Sprite_StateIcon {
    _pseudo3dType: string;
    stateVisible(): void;
    // 既存のメソッドやプロパティ...
}

// Sprite_SvActor のコンストラクタシグネチャを修正
declare class Sprite_SvActor extends Sprite {
    constructor(...args: any[]);
    initialize(): void;
    update(): void;
    width: number;
    height: number;
    [key: string]: any;
}

// Sprite_SvActorのコンストラクタ関数の型定義
declare interface Sprite_SvActorConstructor {
    prototype: Sprite_SvActor;
    new (...args: any[]): Sprite_SvActor;
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
    Sprite_SvActor?: Sprite_SvActorConstructor;
}

interface Sprite_SvActorConstructor {
    new (...args: any[]): Sprite_SvActor;
}

interface WindowLike extends Window_Base {}

interface Window_Base {
    window: WindowLike;
    setting: TweenSetting;
    enable: boolean;
    moveX: string;
    moveY: string;
    easing: EasingFunc;
    duration: number;
    delay: number;
}

interface Window_BattleLog {
    showDynamicAnimation(
        targets: Game_Battler[],
        action: Game_Action,
        noWait: boolean,
        mapAnimation: makeMapAnimation
    );
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
declare let Gauge_X: number | undefined;
declare let Gauge_Y: number | undefined;
declare let HPPosition: number | undefined;

function makeAction(
    itemId: number,
    battleSubject: any,
    isItem: boolean
): Game_Action;
function makeMapAnimationEvent(
    event: any,
    skillId: number,
    action: any
): {
    subject: any;
    noWait: boolean;
    onScroll: boolean;
    isDynamicAuto: boolean;
    skillId: number;
    isParallel: boolean;
};

function makeMapAnimation(
    interpreter: interpreter,
    subject: Game_Battler,
    wait: boolean,
    noScroll: boolean,
    action: Game_Action
) {}

// 型定義
type EasingFunc = (n: number) => number;

interface TweenSetting {
    enable: boolean;
    moveX: string;
    moveY: string;
    alpha: number;
    easing: EasingFunc;
    duration: number;
    delay: number;
}

interface TorigoyaTween {
    to(params: object, duration: number, easingFunc: EasingFunc): TorigoyaTween;
    wait(duration: number): TorigoyaTween;
    call(func: () => void): TorigoyaTween;
    start(): TorigoyaTween;
    stacks: { duration: number; delay: number }[];
}

interface WindowLike extends PIXI.Container {
    x: number;
    y: number;
    opacity: number;
    width: number;
    height: number;
}

declare const Torigoya: {
    FrameTween: {
        create(obj: any, initParams?: object): TorigoyaTween;
        Easing: { [key: string]: EasingFunc };
    };
};

// For Furamon_BattleStateList.ts
declare class Window_BattleStateList extends Window_Base {
    constructor(rect: Rectangle);
    _dataStates: MZ.State[];
    makeItemList(): void;
    refresh(): void;
}

declare interface Scene_Battle {
    _openedStateListFrom: string | null;
    _stateListWindow: Window_BattleStateList;
    createStateListWindow(): void;
    stateListWindowRect(): Rectangle;
    updateStateListWindow(): void;
    isStateListTriggered(): boolean;
    toggleStateListWindow(): void;
    openStateListWindow(): void;
    closeStateListWindow(): void;
}

interface Bitmap {
    getAlphaPixel(x: number, y: number)
}

declare class Sprite_SVWeapon extends Sprite {
    _battler: Sprite_Actor | null;
    _weaponName: string;
    _motion: any;
    _pattern: number;
    setup(battler: Sprite_Actor): void;
}

declare interface Sprite_Actor extends Sprite_Battler {
    _weaponSprite: Sprite_SVWeapon;
}