interface MetaObject {
  meta: Metadata; // metaプロパティの型をMetadata型で定義
}

declare namespace ConfigManager {
  let tauriWindowSize: number;
  function readTauriWindowSize(config: Config);
  interface Config {
    tauriWindowSize: number;
  }
}

interface PluginManager {
  public static checkErrors(): void;
  public static isLoaded(name: string): boolean;
}

declare let Imported: {
    [key: string]: boolean | undefined;
    NUUN_PassiveSkill?: boolean; // 例: NUUN_PassiveSkill のフラグ
    // 他のプラグインのフラグもここに追加可能
};

interface BattleManager {
  rangeEx(action: Game_Action, target: Game_Battler[]): Game_Battler[];
}

interface Scene_Battle {
  _enemyNameWindow: Window_EnemyName;
}

interface Game_BattlerBase {
  isDummyEnemy(): boolean;
}

interface Game_Battler {
  stepBack(): void;
  _reservedResults: Game_ActionResult;
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

interface _Window {
  __TAURI__: any;
}

interface Window_Options {
  _noTouchSelect: boolean;
  _gamepadOptionIndex: number;
  _keyboardConfigIndex: number;
  changeWindowSizeValue(symbol: string, value: number): void;
}

declare class Scene_KeyConfig{
    /** Smoothly select an item by index */
    smoothSelect(index: number): void;
    /** Draw background for an item */
    drawItemBackground(): void;
    /** Number of visible items */
    maxVisibleItems(): number;
    /** Item rectangle with padding */
    itemRectWithPadding(): Rectangle;
}
