// Furamon plugins: project-local ambient typings / augmentations
// NOTE: Avoid redeclaring core RMMZ globals as `any` (it breaks downstream typing).
declare var obtainSkill: string;
declare let EnemyStatePosition: number;
declare let State_X: number;
declare let State_Y: number;
declare let stateVisible: number;

// Furamon_CursorEnhance.ts で参照される内部フィールド（実行環境依存のため optional）
interface SceneManager {
    _deltaTime?: number;
}

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
    export function gainExp(): void;
    export function makeRewards(): void;
    export function gainRewards(): void;
    interface Spriteset {
        battlerSprites(): Sprite_Battler[];
    }
    let _rewards: {
        gold: number;
        exp: number;
        items: MZ.Item[];
        classExp: number;
    };
    function gainClassExp(): void;
    function displayExp(): void;
    let _subject: Game_Actor | Game_Enemy | null;
    function startInput(): void;
    /**
     * Returns whether the battle manager is currently in inputting state.
     * Declared here to match runtime API that exposes BattleManager.isInputting().
     */
    export function isInputting(): boolean;
    function battleCommandRefresh(): void;
    function endTurn(): void;
    function rangeEx(
        action: Game_Action,
        target: Game_Battler[]
    ): Game_Battler[];
    function setup(troopId: number, canEscape: boolean, canLose: boolean): void;
    function endBattle(result: number): void;
    let _escaped: boolean;
    /**
     * Indicates whether auto-battle mode is active; declared here so code
     * referencing BattleManager._autoBattleMode type-checks correctly.
     */
    let _autoBattleMode: boolean;
    function canEscape(): boolean;
    function selectPreviousCommand(): void;
    function actor(): Game_Actor;
    function inputtingAction(): Game_Action;
    function startTurn(): void;
}

declare namespace TextManager {
    const file: string;
    const autosave: string;
    const obtainSkill: string;
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

declare namespace PluginManager {
    function isLoaded(name: string): boolean;
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
    _actorStatus: Window_Status;
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

// Furamon_LRMenuCore.ts で追加するコマンド説明ウィンドウ
interface Scene_Menu {
    _infoWindow?: Window_MenuInfo;
    createInfoWindow(): void;
    infoWindowRect(): Rectangle;
}

interface Scene_Map {
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

interface Game_CharacterBase {
    moveCallback(
        this: Game_CharacterBase & EventRangeEvent,
        moved: boolean,
        dpf: number
    ): void;
}

interface Game_Player {
    setJumpSpeed(speed: number): void;
    setJumpHeight(height: number): void;
    isHalfMove(): boolean;
    _lastMoveDirection: number;
    startMapEventFront(
        this: Game_Player & PlayerWithRange,
        x: number,
        y: number,
        d: number,
        triggers: TriggerList,
        normal: boolean,
        isTouch: boolean
    ): void;
}

interface Game_BattlerBase {
    isDummyEnemy(): boolean;
}

interface Game_Battler {
    _reservedResults: Game_ActionResult;
    isUsedSlot(slotId: number): boolean;
    _usedItemSlots: number[];
    makeSPName?(action?: Game_Action): string | null;
    enemy(): MZ.Enemy;
    setWt(battler): void;
    gainClassExp?(classExp: number, ignoreBench?: boolean): void;
}

declare class Sprite_EnemyHPGauge extends Sprite {
    constructor();
    setup(battler: Game_Battler, type: string): void;
    show(): void;
    hide(): void;
    update(): void;
}
// furamon.d.ts
interface Game_Actor {
    // 既存のプロパティ
    mlp: number;
    _lp: number;
    lp: number;
    _regeneDeath: boolean;
    _resurrect: boolean;
    _additionalClassId: number;
    _masteredClassIds: number[];

    // メソッド
    maxLPSet(): void;
    recoverLP(): void;
    getActorClass(): (MZ.Actor | MZ.Class)[];
    getActorClassParamRate(paramId: number): number;
    getStateParamRate(paramId: number): number;
    getEquipParamRate(paramId: number): number;
    getPassiveObject(): any[];
    skills(options?: { includeHasAbilitySkills?: boolean }): MZ.Skill[];
    findNewSkills(lastSkills: MZ.Skill[]): MZ.Skill[];
    additionalClass(): AdditionalClass | undefined;
    additionalClassObject(): MZ.Class | undefined;
    changeAdditionalClass(classId: number): void;
    leaveAdditionalClass(): void;
    setAllAdditionalClassesSkills(): void;
    setAdditionalClassSkills(additionalClass: AdditionalClass): void;
    isAdditionalClass(gameClass: MZ.Class): boolean;
    isAdditionalClassId(classId: number): boolean;
    gainClassExp(classExp: number, ignoreBench?: boolean): void;
    finalClassExpRate(): number;
    benchMembersClassExpRate(): number;
    traitObjects(): (MZ.Actor | MZ.Class | MZ.Weapon | MZ.Armor | MZ.State)[];
    setUnificationExp(): void;
    traitBattlerObjects(): DataManager.TraitObject[];
    currentClass(): MZ.Class | null;
    onLoad(): void;
}



interface Game_Enemy {
    enemy(): MZ.Enemy;
    requestMotion(motionName: string): void;
    makeSPName?(action?: Game_Action): string | null;
    _motion?: string | null;
    _motionRefresh: boolean;
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
    classExp(): number;
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
    _battler: Game_Enemy | null;
}

// Game_Temp インターフェースを拡張
declare interface Game_Temp {
    enemyHPGaugeRefresh?: boolean;
    enemyStateRefresh?: boolean;
    refreshOverlay?: boolean;
    formationRefresh: boolean;
}

// Sprite_StateIcon は既存クラスを再宣言せず、増補で追加する
interface Sprite_StateIcon {
    _pseudo3dType: string;
    stateVisible(): void;
}

// Sprite_SvActor のコンストラクタシグネチャを修正
declare class Sprite_SvActor extends Sprite {
    constructor(...args: any[]);
    initialize(): void;
    update(): void;
    width: number;
    height: number;
    [key: string]: any;
    _collapseMask: PIXI.Graphics | null;
    _collapseStartY: number | null;
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
    requestAnimationFrame(scheduleCompat: () => void): unknown;
    setTimeout(scheduleCompat: () => void, arg1: number): unknown;
    PIXI: any;
    __TAURI__: any;
    enemyHPGaugeLength?: string[] | null;
    getSplit?: (tag: string | null | undefined) => string[] | null;
    HPPosition?: number;
    Gauge_X?: number;
    Gauge_Y?: number;
    Sprite_SvActor?: Sprite_SvActorConstructor;
}

type MakeMapAnimation = (
    interpreter: Game_Interpreter,
    subject: Game_Battler,
    wait: boolean,
    noScroll: boolean,
    action: Game_Action
) => void;

interface Window_BattleLog {
    showDynamicAnimation(
        targets: Game_Battler[],
        action: Game_Action,
        noWait: boolean,
        mapAnimation: MakeMapAnimation
    );
}

interface Window_BattleStatus {
    _statusInputPatched: boolean;
    _statusInputDisabled: boolean;
    select(index: number): void;
}

interface Window_Options {
    _noTouchSelect: boolean;
    _gamepadOptionIndex: number;
    _keyboardConfigIndex: number;
    changeWindowSizeValue(symbol: string, value: number): void;
}

interface Window_SavefileList {
    isSaveFileShowAutoSave: boolean;
}

interface Window_StatusBase {
    isChangeActorActive(actor: Game_Actor): void;
    getFormationSelectActor(): void;
    drawBackGroundActor(index: number): void;
    actor(index: number): Game_Actor;
    drawActorClass(
        actor: Game_Actor,
        x: number,
        y: number,
        width?: number
    ): void; // 追加
    drawAdditionalClassLevel(
        additionalClass: AdditionalClass | undefined,
        x: number,
        y: number
    ): void; // 追加
}

interface Game_Interpreter {
    _temporaryWindow: Window_TemporaryText | null;
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

declare function makeMapAnimation(
    interpreter: Game_Interpreter,
    subject: Game_Battler,
    wait: boolean,
    noScroll: boolean,
    action: Game_Action
): void;

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

interface WindowLike {
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
// Minimal augmentations for Furamon plugin (moved to a separate file)
// This block is intentionally left as a backup. The real augmentations are in @types/furamon_bsl.d.ts


interface Bitmap {
    getAlphaPixel(x: number, y: number);
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

// For NUUN_BattleStyleEX
interface NuunStyleData {
    isSelectBackShow(): boolean;
    activeActorWindow(): boolean;
}

declare const NuunManager: {
    styleData: NuunStyleData;
};

declare class Window_FormationMember extends Window_Base {
    isFormationChangeActorEnabled(actor: Game_Actor): void;
    isChangeActorActive(actor: Game_Actor): void;
}
declare class Window_FormationBattleMember extends Window_Base {
    isFormationChangeActorEnabled(actor: Game_Actor): void;
    isChangeActorActive(actor: Game_Actor): void;
}

interface AdditionalClass {
    _actor: Game_Actor;
    _id: number;
    _data: MZ.Class | null;
    _level: number;
    id: number;
    level: number;
    name: string;
    note: string;
    learnings: MZ.Learning[];
    isNoGrow(): boolean;
    initialize(...arguments): void;
    exp(): number;
    actor(): Game_Actor;
    expActor(): Game_Actor | null;
    setLevel(): void;
    currentExp(showFlg?: boolean): number | string;
    currentLevelExp(): number;
    nextLevelExp(showFlg?: boolean): number | string;
    nextRequiredExp(): number;
    expForLevel(level: number): number;
    isMaxLevel(): boolean;
    maxLevel(): number;
    changeExp(exp: number, show: boolean): void;
    changeLevel(level: number, show: boolean): void;
    levelUp(): void;
    levelDown(): void;
    displayLevelUp(newSkills: MZ.Skill[]): void;
    displayLevelMax(show: boolean): void;
    getNeedsExpData(): number[];
    pUnificationExp: boolean;
    pClassLvMaxExp: string;
    pDefaultMaxLevel: number;
    pLvUpMessage: string;
    pZeroLevel: boolean;
    pShowMaxLevelMessage: boolean;
    pShowBenchMaxLevel: boolean;
    pMaxLevelMessage: string;
    pParamPlusByLevel: boolean;
    [Symbol.iterator](): Iterator<AdditionalClass>;
    pParamPlusByTag: boolean;
    pKeepSkill: boolean;
    mCommandFlg: boolean;
    mForceClassId: number | null;
    isKeepSkill: (skillId: number) => boolean;
}

declare function getExpActor(): Game_Actor;
declare function isKeepSkill(skillId: number): boolean;

// For Furamon_LP.ts
declare interface Game_Temp {
    _justWonBattle: boolean;
    setJustWonBattle(value: boolean): void;
    isJustWonBattle(): boolean;
}

type EventRangeEvent = {
    rangeEventPlayer?: (x: number, y: number) => boolean;
    range?: (x: number, y: number, event?: unknown) => boolean;
    getEventRangeTag?: () => string | undefined;
    getEventRangeCollidedTag?: () => boolean;
    isEventRangeEvent?: () => boolean;
    start?: () => void;
};

declare class DotMoveSystem {}

// EventRange / DotMoveSystem まわり
type TriggerList = readonly number[];

type GameFollowersLike = {
    data?: () => any[];
};

type RealPositionCharacter = {
    x: number;
    y: number;
    _realX?: number;
    _realY?: number;
};

declare function realX(character: RealPositionCharacter): number;
declare function realY(character: RealPositionCharacter): number;

type PlayerWithRange = RealPositionCharacter & {
    setDistanceFrom?: (dx: number, dy: number) => void;
    rangeFollower?: (x: number, y: number, event: unknown) => boolean;
    pos: (x: number, y: number) => boolean;
    followers?: () => GameFollowersLike;
};

type MapWithRange = {
    eventsRangeEventPlayerXy?: (x: number, y: number) => unknown[];
    roundXWithDirection: (x: number, d: number) => number;
    roundYWithDirection: (y: number, d: number) => number;
    isEventRunning: () => boolean;
};

type RangeEvent = {
    isTriggerIn?: (triggers: TriggerList) => boolean;
    isNormalPriority?: () => boolean;
    range?: (x: number, y: number, event?: unknown) => boolean;
    getEventRangeTag?: () => string | null | undefined;
    isJumping?: () => boolean;
    start?: () => void;
    _trigger?: number;
    x: number;
    y: number;
};

interface Game_System {
    isClassExpEnabled(): boolean;
}

interface Game_Troop {
    classExpTotal(): number;
}

declare class Windows_SelectClasses extends Window_Selectable {
    constructor(rect: Rectangle);
    _actor: Game_Actor;
    _data: (MZ.Class | null)[];
    _infoWindow: Windows_ClassInfo;
    refresh(): void;
    makeItemList(): void;
    isActorConditionOK(actorIds: string[]): boolean;
    isClassConditionOK(jsonConditions: any): boolean;
    drawItem(index: number): void;
    isCurrentItemEnabled(): boolean;
    item(): MZ.Class | null;
    itemAt(index: number): MZ.Class | null;
    maxItems(): number;
    drawItemName(item: MZ.Class, x: number, y: number): void;
    drawClassLevel(level: number, x: number, y: number, width: number): void;
    select(index: number): void;
    setInfoWindow(window: Windows_ClassInfo): void;
    setActor(actor: Game_Actor): void;
    selectCurrentClass(): void;
    flushTextState(textState: any): void;
    isUsePage(): boolean;
}

declare class Windows_ClassInfo extends Window_EquipStatus {
    constructor(rect: Rectangle);
    _actor: Game_Actor;
    _tempActor: Game_Actor;
    _isSkillPage: boolean;
    _scrollInterval: number;
    _parameterEndY: number;
    _skillEndY: number;
    _messageEndY: number;
    setActor(actor: Game_Actor): void;
    changePage(): void;
    paint(): void;
    refresh(): void;
    getClass(): AdditionalClass;
    drawAllItems(): void;
    drawActorName(actor: Game_Actor, x: number, y: number, width: number): void;
    drawClassImage(
        actor: Game_Actor,
        x: number,
        y: number,
        width?: number,
        height?: number
    ): void;
    drawPicture(
        imageName: string,
        x: number,
        y: number,
        width?: number,
        height?: number
    ): void;
    drawActorClass(x: number, y: number, width?: number): void;
    drawActorClassLevel(x: number, y: number): void;
    drawExpInfo(x: number, y: number): void;
    expTotalValue(): string | number;
    expNextValue(): string | number;
    levelX(): number;
    drawAllParams(): void;
    drawItem(x: number, y: number, paramId: number): void;
    drawNewParam(x: number, y: number, paramId: number): void;
    isDispNewParam(): boolean;
    paramWidth(): number;
    paramLineHeight(): number;
    paramX(): number;
    paramY(index: number): number;
    drawLearnSkills(x: number, y: number): void;
    drawClassMessage(x: number, y: number): void;
    classMessageY(): number;
    classSkillY(): number;
    setOverallHeight(): void;
    overallHeight(): number;
    processHandling(): void;
    processWheel(): void;
    isScrollEnabled(): boolean;
    updateArrows(): void;
    isPageChangeEnabled(): boolean;
    isPageChangeRequested(): boolean;
    onPageChange(): void;
}

declare class Windows_ClassSlot extends Window_Selectable {
    constructor(rect: Rectangle);
    _actor: Game_Actor;
    _data: (AdditionalClass | null)[];
    _infoWindow: Windows_ClassInfo;
    refresh(): void;
    makeItemList(): void;
    drawItem(index: number): void;
    isCurrentItemEnabled(): boolean;
    item(): AdditionalClass | null;
    itemAt(index: number): AdditionalClass | null;
    maxItems(): number;
    drawItemName(item: AdditionalClass | null, x: number, y: number): void;
    drawClassLevel(level: number, x: number, y: number, width: number): void;
    select(index: number): void;
    setActor(actor: Game_Actor): void;
    selectCurrentClass(): void;
    isUsePage(): boolean;
}

declare class Scene_AdditionalCC extends Scene_MenuBase {
    constructor();
    _isSelectActor: boolean;
    _isMessageClosing: boolean;
    _selectWindow: Windows_SelectClasses;
    _infoWindow: Windows_ClassInfo;
    _statusWindow: Window_MenuStatus;
    _actor: Game_Actor;
    _messageWindow: Window_Message;
    _scrollTextWindow: Window_ScrollText;
    _nameBoxWindow: Window_NameBox;
    _choiceListWindow: Window_ChoiceList;
    _numberInputWindow: Window_NumberInput;
    _eventItemWindow: Window_EventItem;
    _windowLayer: WindowLayer;
    initialize(): void;
    updateActor(): void;
    update(): void;
    create(): void;
    start(): void;
    helpAreaHeight(): number;
    refreshActor(): void;
    isNoActor(): boolean;
    createStatusWindow(): void;
    statusWindowRect(): Rectangle;
    selectActorStart(): void;
    onActorOk(): void;
    onClassChangeSelectStart(): void;
    onClassChangeSelectCancel(): void;
    onClassChangeConfirm(): void;
    onClassChangeOk(): void;
    onClassChangeCancel(): void;
    classChangeEnd(): void;
    onActorChange(): void;
    needsPageButtons(): boolean;
    arePageButtonsEnabled(): boolean;
    stop(): void;
    terminate(): void;
    isMessageWindowClosing(): boolean;
    createMessageWindows(): void;
    createMessageWindow(): void;
    createScrollTextWindow(): void;
    createNameBoxWindow(): void;
    createChoiceListWindow(): void;
    createNumberInputWindow(): void;
    createEventItemWindow(): void;
    messageWindowRect(): Rectangle;
    scrollTextWindowRect(): Rectangle;
    eventItemWindowRect(): Rectangle;
    associateWindows(): void;
    showMessage(message: string): void;
}

declare interface Window_MenuStatus {
    drawActorClass(
        actor: Game_Actor,
        x: number,
        y: number,
        width?: number
    ): void; // 追加
}

declare interface Window_Status {
    drawBlock1(y: number): void; // 追加
    drawActorLevel(actor: Game_Actor, x: number, y: number): void; // 追加
    drawExpInfo(x: number, y: number): void; // 追加
    drawBlock2(y: number): void; // 追加
    drawClassInfo(
        additionalClass: AdditionalClass | undefined,
        x: number,
        y: number
    ): void; // 追加
}

declare let mForceClassId: number | null; // 追加

declare namespace DataManager {
    interface TraitObject {
        code: number;
        dataId: number;
        value: number;
        note?: string;
        meta?: Metadata;
    }
}

interface AdditionalClassConstructor {
    new (actor: Game_Actor, classId: number): AdditionalClass;
    prototype: AdditionalClass;
}

interface TraitObject {
    code: number;
    dataId: number;
    value: number;
    note?: string;
}

// trimmed
