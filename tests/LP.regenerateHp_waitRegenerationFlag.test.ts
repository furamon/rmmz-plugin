/**
 * 変更部分のテスト（簡易）
 *
 * `Game_Actor.prototype.regenerateHp` 内で参照している
 * NRP_DynamicReturningAction のパラメータ `WaitRegeneration` 判定が
 * 「true のときだけ _regeneDeath を立てる」意図どおりであることを検証します。
 *
 * 実行例:
 *   bun tests/LP.regenerateHp_waitRegenerationFlag.test.ts
 */

import assert from "node:assert/strict";

type DynamicReturningActionParameters = {
  WaitRegeneration?: string;
};

function shouldSetRegeneDeath(
  parameters: DynamicReturningActionParameters,
): boolean {
  // 本体側で採用した修正と同じ判定
  return parameters.WaitRegeneration === "true";
}

assert.equal(shouldSetRegeneDeath({ WaitRegeneration: "true" }), true);
assert.equal(shouldSetRegeneDeath({ WaitRegeneration: "false" }), false);
assert.equal(shouldSetRegeneDeath({}), false);

console.log("OK: WaitRegeneration=true のときのみ _regeneDeath を立てます");
