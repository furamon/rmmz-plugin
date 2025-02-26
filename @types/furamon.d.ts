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
}

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
}

interface Game_Actor {
  mlp: number;
  _lp: number;
  lp: number;
  _regeneDeath: boolean;
  maxLPSet(): void;
  recoverLP(): void;
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

interface _Window {
  __TAURI__: any;
}

interface Window_Options {
  _noTouchSelect: boolean;
  _gamepadOptionIndex: number;
  _keyboardConfigIndex: number;
  changeWindowSizeValue(symbol: string, value: number): void;
}
