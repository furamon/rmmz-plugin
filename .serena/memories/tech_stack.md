# 技術スタック

## 言語
- **TypeScript** (ES2023ターゲット)

## フレームワーク/ターゲット
- **RPGツクールMZ (RMMZ)**

## ビルドツール
- **TypeScript Compiler (tsc)** - TypeScriptをJavaScriptにトランスパイル

## パッケージマネージャ
- **pnpm** - Node.jsパッケージの管理

## 主要な依存関係
- `typescript@^5.9.3` - TypeScript言語のコンパイラ
- `@types/node` - Node.jsの型定義（推測）

## TypeScript設定
- ターゲット: ES2023
- モジュール: ESNext
- モジュール解決: Node
- 厳格モード: 有効 (strict: true)
- 出力ディレクトリ: `_dist/`
- strictPropertyInitialization: false (RMMZプラグインの性質上)
- alwaysStrict: false (RMMZの実行環境に合わせて)

## 型定義
- `@types/`ディレクトリにRMMZのコアスクリプトとライブラリの型定義ファイル (.d.ts) を配置
- 型エラーが発生した場合は`furamon.d.ts`に追記する
