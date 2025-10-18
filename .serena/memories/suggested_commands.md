セットアップ: `pnpm install`
ビルド: `pnpm tsc; xcopy /Y .\_dist\* ..\src\js\plugins\Furamon\`
(注: `package.json`に`scripts`エントリはありませんが、`pnpm`は`node_modules/.bin`にある`tsc`を直接実行できます)