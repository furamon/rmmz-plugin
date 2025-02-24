declare interface BattleManager {
  rangeEx(action: Game_Action, targets: Game_Battler[]): Game_Battler[];
}

declare interface Game_Battler {
  stepBack(): Promise<void>;
  _lp: number;
  mlp: number;

  maxLPSet: () => void;
  lp(lp: number, mlp: number): number;
  recoverLP: () => void;
  _regeneDeath: boolean;
}

declare interface BattleManager {
  rangeEx(arg0: Game_Action, targets: Game_Battler[]): Game_Battler[];
}

declare interface Game_ActionResult {
  lpDamage: number;
}

declare interface Sprite_Damage {
  _isRegenerationWait: boolean;
  _spriteBattler: Sprite_Battler;
  _diffX: number;
  _diffY: number;
  setupLpBreak(battler: Game_Battler & Game_Actor): void;
  _lpDamage: number;
  _delay: number;
}

declare interface Sprite_Gauge {
  _lpColor1: string;
  _lpColor2: string;
  _lpTextColorMax: string;
  _lpTextColorZero: string;
  _lpTextColorNormal: string;
}

declare interface TextManager {
  lpA: string;
}
