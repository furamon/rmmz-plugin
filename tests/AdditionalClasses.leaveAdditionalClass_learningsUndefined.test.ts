/**
 * 変更部分のテスト（簡易）
 *
 * `additionalClass._data?.learnings` が undefined の場合でも安全に反復できることを検証します。
 *
 * 実行例:
 *   bun tests/AdditionalClasses.leaveAdditionalClass_learningsUndefined.test.ts
 */

import assert from "node:assert/strict";

type Learning = { skillId: number };

type AdditionalClassLike = {
  _data?: {
    learnings?: Learning[];
  };
};

function getLearningSkillIds(additionalClass: AdditionalClassLike): number[] {
  const ids: number[] = [];

  // 本体側で採用した修正と同じパターン
  for (const learning of (additionalClass._data?.learnings ?? [])) {
    ids.push(learning.skillId);
  }

  return ids;
}

assert.deepEqual(getLearningSkillIds({}), []);
assert.deepEqual(getLearningSkillIds({ _data: {} }), []);
assert.deepEqual(
  getLearningSkillIds({ _data: { learnings: [{ skillId: 1 }, { skillId: 2 }] } }),
  [1, 2],
);

console.log("OK: learnings が undefined でも安全に処理できました");
