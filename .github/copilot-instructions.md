# Copilot instructions (rmmz-plugin)

## このリポジトリは何？
- RPG Maker MZ 向けプラグインを TypeScript で管理し、JS をビルド出力します。
- ビルド成果物は `rmmz-plugin/_dist/` と、ゲーム側の `../src/js/plugins/Furamon/` の2箇所に出ます（`package.json` の `build` 参照）。

## 触る場所 / 触らない場所
- 変更は基本 `src/*.ts` に入れてください（例: `src/Furamon_LP.ts`）。
- `_dist/*.js` はビルド成果物なので、手編集しないでください。

## 実装パターン（RMMZプラグイン）
- 各プラグインは「1ファイル=自己完結」が基本で、IIFE で包みます: `(() => { /* ... */ })();`
- RPG Maker のグローバル（`$gameParty`, `Game_Actor`, `PluginManager` など）を直接参照し、`prototype` 拡張で機能追加します。
- プラグインヘッダ `/*:`（`@target/@plugindesc/@command/@param` 等）はエディタが読むので、壊さないでください。
- 新規プラグイン作成は `src/_Template.ts` を起点に、既存の書き方に寄せてください。

## 競合・順番・外部プラグイン
- 既存メソッドは「退避→ラップ」で上書きします（例: `const _Game_Action_apply = Game_Action.prototype.apply; ...`）。
- 他プラグインとの競合回避は「存在チェックして分岐」が多いです（例: `PluginManager._scripts.includes("NRP_SkillRangeEX")`）。
- 順番依存がある場合はヘッダの `@orderAfter` などで明示します（例: `src/Furamon_LP.ts` は `@orderAfter NRP_StateEx`）。

## 型定義
- 型は `@types/*.d.ts`（RMMZ + 追加定義）を前提にしています。`tsconfig.json` の `typeRoots` に従ってください。

## よく使うコマンド（Bun）
- 依存導入: `bun install`
- フォーマット/リント: `bun run format` / `bun run check`（Biomeは `src/**/*` を対象）
- ビルド: `bun run build`（`_dist/` と `../src/js/plugins/Furamon/` を更新）

## 変更の確認
- 最低限 `bun run build` が通ること。
- 実機確認はゲーム側の `src/js/plugins/Furamon/` に出力されたJSを読み込む想定です（プラグイン管理画面で順番も要確認）。
