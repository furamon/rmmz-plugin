# コーディング規約

## 全般
- 現状、厳密なリンターやフォーマッターは導入されていない
- TypeScriptの一般的なベストプラクティスに従う
- RMMZの既存のコードスタイル（命名規則など）を尊重し、一貫性を保つ

## ファイル構造

### ヘッダーコメント
```typescript
//------------------------------------------------------------------------------
// Furamon_<PluginName>.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// <バージョン履歴>
```

### プラグインメタデータ
```typescript
/*:
 * @target MZ
 * @plugindesc <プラグインの説明>
 * @author Furamon
 * @url <URL（オプション）>
 * @help <詳細なヘルプテキスト>
 *
 * @param <ParamName>
 * @text <表示名>
 * @type <型>
 * @default <デフォルト値>
 * @desc <説明>
 */
```

### 実装部分
- IIFE（即時関数）で全体をラップ
```typescript
(function () {
    const pluginName = 'Furamon_<PluginName>';
    const parameters = PluginManager.parameters(pluginName);
    
    console.log(`[Furamon] ${pluginName} is loaded.`);
    
    // プラグインの実装
})();
```

## 命名規則

### 変数・定数
- プラグイン名: `pluginName` または `PLUGIN_NAME` (camelCase または UPPER_SNAKE_CASE)
- パラメータ: `parameters`
- ローカル変数: camelCase

### プロトタイプ拡張
- RMMZの既存クラスのメソッドをオーバーライド/拡張する際は、元のメソッドを保存
```typescript
const _Original_method = ClassName.prototype.method;
ClassName.prototype.method = function() {
    // 新しい実装
};
```

## TypeScript特有

### 型定義
- 厳格な型チェックを使用（strict: true）
- 型エラーが発生した場合は`@types/furamon.d.ts`に型定義を追加

### コメント
- 日本語でのコメントを使用
- 複雑なロジックには説明を追加

## その他
- インデントはスペース4つ（tsconfigのデフォルト）
- セミコロンを使用
- シングルクォート推奨（一貫性を保つ）
