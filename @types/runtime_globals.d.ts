declare const console: {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

declare function alert(message?: any): void;

declare function setInterval(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...args: any[]
): number;

declare function clearInterval(id: number): void;

declare function setTimeout(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...args: any[]
): number;

declare function clearTimeout(id: number): void;

// DOM の lib を外しているため、ゲーム実行環境(NW.js 等)の window を最低限宣言。
// _Window は furamon.d.ts 側で拡張される前提。
declare const window: _Window;
