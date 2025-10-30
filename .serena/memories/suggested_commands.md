# 推奨コマンド

## セットアップ

### 依存関係のインストール
```powershell
pnpm install
```

## ビルド

### TypeScriptのコンパイル
```powershell
pnpm tsc
```
- `src/`内のTypeScriptファイルをJavaScriptにトランスパイル
- 出力先: `_dist/`ディレクトリ

### ビルド＆配置（完全なワークフロー）
```powershell
pnpm tsc
xcopy /Y .\_dist\* ..\src\js\plugins\Furamon\
```
- TypeScriptをコンパイルし、生成されたJSファイルをRMMZプロジェクトにコピー

## 開発中の作業

### 単一ファイルのコンパイル確認
```powershell
pnpm tsc --noEmit
```
- 型チェックのみ実行（ファイル出力なし）

### 監視モードでのコンパイル
```powershell
pnpm tsc --watch
```
- ファイル変更を監視して自動的に再コンパイル

## ファイル操作（Windows）

### ディレクトリ一覧表示
```powershell
ls
# または
dir
```

### ディレクトリ移動
```powershell
cd <ディレクトリパス>
```

### ファイル検索
```powershell
Get-ChildItem -Recurse -Filter "*.ts"
```

### ファイル内容検索
```powershell
Select-String -Path "src\*.ts" -Pattern "<検索パターン>"
```

## Git操作

### 状態確認
```powershell
git status
```

### 変更のコミット
```powershell
git add .
git commit -m "<コミットメッセージ>"
```

### プッシュ
```powershell
git push
```

## 注意事項
- `package.json`には`scripts`エントリがないため、`pnpm`は`node_modules/.bin`にある`tsc`を直接実行
- Windowsの`xcopy`コマンドを使用してファイルをコピー
- PowerShellを使用する場合、パスの区切り文字は`\`（バックスラッシュ）
