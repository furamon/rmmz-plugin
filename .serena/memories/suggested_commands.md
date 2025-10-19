### セットアップ
```shell
pnpm install
```
### コード編集
`src/`ディレクトリ内のTypeScriptファイル（.ts）を編集します。
### ビルド
以下のコマンドを実行して、`src/`内のTypeScriptファイルをJavaScriptにトランスパイルします。ビルドされたファイルは`_dist/`に出力されます。
```bat
pnpm tsc; xcopy /Y .\_dist\* ..\src\js\plugins\Furamon\
```