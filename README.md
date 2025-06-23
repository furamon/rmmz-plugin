# Furamon's RPG Maker MZ Plugins

ふらもんという見習い制作者が書いたプラグインの置き場。  
あくまで自分用のものを誰かあわよくば……という思いで配布しているものなので不具合などはご容赦ください。報告（XやGitHub Issue、[自サイト](https://magialabs.blog)から）あれば可能な限りで対応いたします。  

すべてMIT Licenseです。Furamonの名前をREADMEなどに書きさえすればあとは好きにしていいのよ。  
自作と言えるものはニッチなものばかりであとはちょこちょことしたものや既存のものの改造がほとんど。それでも役に立てば嬉しいです。

| 名前                        | ファイル名                                                                                                       | 説明                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ライフポイント              | [Furamon_LP](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_LP.js)                               | 戦闘不能に関わるライフポイントを実装します。<br>いわゆる残機システム。SaGa シリーズのあれ。                                                      |
| 能力特徴底上げ式            | [Furamon_TraitRaiseBottom](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_TraitRaiseBottom.js)   | 能力値乗算特徴が複数ついているときに一番高いものだけを反映させます。<br> 要するにFF5の「弓矢装備」「格闘」みたいなアレの補正特徴の再現をします。                                                                           |
| ステート付加率操作            | [Furamon_StateRateLuck](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_StateRateLuck.js)   | ステート付与式に計算式を加えます。<br>「基本計算式+運の差」みたいなステート付与式が作れます。                                                                           |
| 壁越えジャンプ              | [Furamon_SmartJump](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_SmartJump.js)                 | 障害物を飛び越せるジャンプができるようになります。                                                                                               |
| 汎用ウィンドウ | [Furamon_VariableWindow](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_VariableWindow.js) | プラグインコマンドで指定したテキストを指定時間表示します。 |
| メニュー高さ調整            | [Furamon_MenuHeight](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_MenuHeight.js)               | メニュー画面の各項目の高さをフォントサイズに合わせて変えられるようにします。                                                                     |
| ダッシュボタン無効化        | [Furamon_DashButtonDisable](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_DashButtonDisable.js) | ダッシュボタンを押したときに何も起きなくし、常時ダッシュを固定化します。                                                                         |
| Tauri時ウィンドウサイズ調整 | [Furamon_TauriforMZ](https://github.com/furamon/rmmz_plugin/blob/main/_dist/Furamon_TauriforMZ.js)               | Tauriでツクールを動かすのにいろいろ便利な機能を追加します。<br> これだけでは動かず、src-tauri/src/lib.rsを弄る必要があります。追って追記します。 |

## Thanks!

[DarkPlasma氏の型定義ファイル](https://github.com/elleonard/rmmz-types)
