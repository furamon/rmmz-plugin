declare const PluginManager: any;

interface BattleManager {
  rangeEx(action: Game_Action, target: Game_Battler[]): Game_Battler[];
}

interface Scene_Battle {
  _enemyNameWindow: Window_EnemyName;
}

interface Game_BattlerBase{
  isDummyEnemy(): boolean;
}

interface Game_Battler{
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

interface TextManager {
  lpA: () => string;
}

interface ConfigManager {
  tauriWindowSize: number;
  readTauriWindowSize(): void;
}

interface Window {
  __TAURI__: any;
}
