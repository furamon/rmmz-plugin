# GEMINI.md

## 1. プロジェクト概要

このリポジトリは、RPGツクールMZ（以下、RMMZ）用のカスタムプラグインを開発・管理するためのものです。作者（ふらもん氏）が自身のゲーム制作で必要となった機能をプラグインとして実装し、他のRMMZ制作者も利用できるよう公開しています。

プラグインは戦闘システム、UI改善、キャラクターの挙動変更など、多岐にわたりますが、個々のプラグインの詳細は各ソースファイルを参照してください。

## 2. 技術スタック

- **言語**: TypeScript
- **フレームワーク/ターゲット**: RPGツクールMZ
- **ビルドツール**: TypeScript Compiler (tsc)
- **パッケージマネージャ**: pnpm
- **主要な依存関係**:
  - `typescript`: TypeScript言語のコンパイラ。
  - `@types/node`: Node.jsの型定義。

## 3. ディレクトリ構造

- `src/`: プラグインのソースコード（.tsファイル）が格納されています。開発は主にこのディレクトリで行います。
- `_dist/`: tscによってトランスパイルされたJavaScriptファイル（.js）が出力されるディレクトリです。RMMZプロジェクトにこのディレクトリ内のファイルを追加します。
- `@types/`: RMMZのコアスクリプトや、プロジェクトで使用するライブラリの型定義ファイル（.d.ts）が格納されています。これにより、TypeScriptでの開発時にコード補完や型チェックの恩恵を受けることができます。型エラーが出たら`furamon.d.ts`に追記してください。
- `node_modules/`: `pnpm install`によってインストールされたNode.jsモジュールが格納されます。
- `package.json`: プロジェクトの依存関係や設定を定義するファイルです。
- `tsconfig.json`: TypeScriptコンパイラの設定ファイルです。ビルドオプション（出力先、ターゲットバージョンなど）が定義されています。
- `GEMINI.md`: このファイルです。AI（Gemini）がプロジェクトを理解し、開発を支援するための情報が記載されています。

## 4. 開発ワークフロー

### 1. セットアップ

```shell
pnpm install
```

を実行し、開発に必要な依存関係をインストールします。

### 2. コード編集

`src/`ディレクトリ内のTypeScriptファイル（.ts）を編集します。

### 3. ビルド

以下のコマンドを実行して、`src/`内のTypeScriptファイルをJavaScriptにトランスパイルします。ビルドされたファイルは`_dist/`に出力されます。

```shell
pnpm tsc
xcopy .\\_dist\\* ..\\src\\js\\plugins\\Furamon /E /I /Y
```

(注: `package.json`に`scripts`エントリはありませんが、`pnpm`は`node_modules/.bin`にある`tsc`を直接実行できます)

## 4. コーディング規約

- 現状、厳密なリンターやフォーマッターは導入されていませんが、TypeScriptの一般的なベストプラクティスに従ってください。
- RMMZの既存のコードスタイル（命名規則など）を尊重し、一貫性を保つようにしてください。

## 5. 注意事項

- **ライセンス**: このリポジトリ内のプラグインはMITライセンスです。詳細はLICENSEファイルを確認してください。
- **不具合報告**: 不具合や改善要望は、GitHubのIssues、または作者のWebサイトから報告してください.
