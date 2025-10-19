タスク完了時には、以下のビルドコマンドを実行して、`src/`内のTypeScriptファイルをJavaScriptにトランスパイルし、`_dist/`に出力されたファイルをRMMZプロジェクトにコピーします。
```bat
pnpm tsc; xcopy /Y .\_dist\* ..\src\js\plugins\Furamon\
```