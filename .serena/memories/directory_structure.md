# ディレクトリ構造

## プロジェクトルート: `rmmz-plugin/`

### 主要ディレクトリ

#### `src/`
- プラグインのソースコード（.tsファイル）を格納
- 開発は主にこのディレクトリで行う
- 命名規則: `Furamon_<PluginName>.ts`
- 各ファイルは単一のプラグインを実装

#### `_dist/`
- tscによってトランスパイルされたJavaScriptファイル（.js）が出力される
- RMMZプロジェクトにはこのディレクトリ内のファイルを追加
- ビルド後、`xcopy`コマンドで`../src/js/plugins/Furamon/`にコピーされる

#### `@types/`
- RMMZのコアスクリプトとライブラリの型定義ファイル（.d.ts）を格納
- TypeScriptでの開発時にコード補完と型チェックを提供
- 型エラーが発生した場合は`furamon.d.ts`に追記

#### `node_modules/`
- `pnpm install`によってインストールされたNode.jsモジュール

### 設定ファイル

- `package.json` - プロジェクトの依存関係と設定
- `tsconfig.json` - TypeScriptコンパイラの設定
- `pnpm-lock.yaml` - pnpmの依存関係ロックファイル
- `AGENTS.md` (または `GEMINI.md`) - AI向けプロジェクト情報
- `README.md` - プロジェクトの概要とプラグイン一覧
- `LICENSE` - MITライセンス

### 関連ディレクトリ (ワークスペース内の他の場所)

- `../src/js/plugins/Furamon/` - ビルドされたプラグインの最終配置先
- `../src/js/` - RMMZプロジェクトのJavaScriptファイル
- `../src/data/D-Txt/` - データテキストファイル
