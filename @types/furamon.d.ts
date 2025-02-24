declare interface BattleManager {
  rangeEx(action: Game_Action, targets: Game_Battler[]): Game_Battler[];
}

declare interface Game_BattlerBase {
  isDummyEnemy(): boolean;
}

declare interface Game_Battler extends Game_BattlerBase {
  stepBack(): Promise<void>;
  // isActor(): this is Game_Actor;
}

declare interface Game_Actor extends Game_Battler {
  lp: number;
  _lp: number;
  mlp: number;

  maxLPSet: () => void;
  recoverLP: () => void;
  _regeneDeath: boolean;
}

declare interface Game_ActionResult {
  lpDamage: number;
  _isHitConfirm: boolean;
}

declare interface Sprite_Damage extends Sprite {
  _isRegenerationWait: boolean;
  _spriteBattler: Sprite_Battler;
  _diffX: number;
  _diffY: number;
  setupLpBreak(battler: Game_Battler & Game_Actor): void;
  _lpDamage: number;
  _delay: number;
}

declare interface Sprite extends PIXI.Sprite {
  setup: (target: Game_Actor, type: string) => void;
}

declare interface Sprite_Gauge extends Sprite {
  _lpColor1: string;
  _lpColor2: string;
  _lpTextColorMax: string;
  _lpTextColorZero: string;
  _lpTextColorNormal: string;
}

declare interface TextManager {
  lpA: string;
}

declare interface Scene_Battle {
  _enemyNameWindow: Window_EnemyName;
}

declare interface TraitObject {
  meta: { [key: string]: any };
}

declare interface Skill {
  meta: { [key: string]: any };
}

declare interface Trait {
  code: number;
  dataId: number;
  value: number;
}
