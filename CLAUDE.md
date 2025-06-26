# CLAUDE.md

このファイルは、Claude Code(claude.ai/code)がこのリポジトリのコードを操作する際の手引きを提供する。

## プロジェクト概要

これはFuramonによってTypeScriptで書かれたRPGツクールMZのプラグインのコレクションである。ライフポイント(LP)、バトルシステム、メニュー修正、ユーティリティ機能など、様々なゲームメカニクスを拡張するプラグインがある。

## 開発コマンド

### ビルド

```bash
pnpm tsc
```

src/` ディレクトリの TypeScript ファイルを `_dist/` ディレクトリの JavaScript にコンパイルする。

### タイプチェック

```bash
pnpm tsc --noEmit
```

出力ファイルを生成せずに型チェックを行う。

## プロジェクトの構成

- `src/` - プラグイン用の TypeScript ソースファイル
- `@types/` - RPGツクールMZのコアと拡張機能の型定義
- `_dist/` - コンパイルされたJavaScriptプラグインファイル(出力ディレクトリ)
- `tsconfig.json` - ES2023 をターゲットとした TypeScript 設定、厳密な型チェックを行う

## プラグインのアーキテクチャ

### プラグイン・テンプレートの構造

各プラグインは標準のRPGツクールMZプラグインフォーマットに従う：

- プラグインのメタデータを含むヘッダーコメント（`@target MZ`、`@plugindesc`、`@author`など）
- コメント内のバージョン履歴
- PluginManager.parameters()`によるプラグインパラメータの抽出
- メインのプラグインロジックをIIFEでラップする

### 主なプラグインカテゴリ

**コアシステム拡張:** - フラモンLP.ts` - ライフポイントシステム (残機システム)

- `Furamon_LP.ts` - 複雑なバトルメカニクスを持つライフポイントシステム(残機システム)
- `Furamon_LRBattleCore.ts` - バトルシステムの修正
- `Furamon_LRMenuCore.ts` - メニューシステムの拡張

**ユーティリティ・プラグイン:**

- `Furamon_MenuHeight.ts` - フォントサイズの互換性のためのメニューの高さ調整
- `Furamon_VariableWindow.ts` - 汎用的なウィンドウ表示システム
- `Furamon_TauriforMZ.ts` - タウリフレームワーク統合ユーティリティ

**ゲーム・メカニクス:**

- `Furamon_TraitRaiseBottom.ts` - 能力特性のスタック修正
- `Furamon_SmartJump.ts` - ジャンプメカニクスの強化
- `Furamon_EnemyActor*.ts` - 敵のアニメーションとモーションシステム

### タイプシステム

このプロジェクトではTypeScriptの型定義を広範囲に使用している：

- `@types/rmmz_*.d.ts` - RPGメーカーMZのコア型定義
- `@types/furamon.d.ts` - プラグイン機能のための拡張型定義
- Game_Actor、Game_Enemy、Spriteクラスのカスタムプロパティによるインターフェイス拡張

### プラグインの互換性

多くのプラグインは、他の一般的なプラグインとの互換性処理を含んでいる：

- NRP (New RPG Project) シリーズの互換性
- 実行順序による競合の解決 (`@orderAfter` アノテーション)
- `Imported`オブジェクトと`PluginManager.isLoaded()`を使った機能検出

## 開発ガイドライン

### プラグインの命名規則

すべてのプラグインは `Furamon_[FeatureName].ts` というパターンに従い、コンパイルされた `.js` ファイルが対応する。

### 日本語ドキュメント

プラグインの説明とヘルプは、RPGツクールMZの日本語コミュニティをターゲットとして、日本語で書かれている。

### バージョン管理

各プラグインは、ヘッダーコメントで日付と変更内容を含む詳細なバージョン履歴を管理する。
