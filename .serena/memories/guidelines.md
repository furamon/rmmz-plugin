# 開発ガイドライン

## プラグイン設計の原則

### 1. RMMZの既存システムとの互換性
- RMMZの既存クラスとメソッドを尊重
- プロトタイプ拡張時は元のメソッドを保存・活用
- 他のプラグインとの競合を最小限に

### 2. プラグインの独立性
- 各プラグインは単一の機能に集中
- 依存関係は明示的に文書化
- プラグインコマンドやパラメータで設定を制御

### 3. ユーザーフレンドリー
- プラグインパラメータで主要な設定を調整可能に
- ヘルプテキストを日本語でわかりやすく記載
- デフォルト値は一般的な使用例に基づいて設定

## 実装パターン

### プロトタイプ拡張の標準パターン
```typescript
// 元のメソッドを保存
const _Original_method = ClassName.prototype.method;

// メソッドをオーバーライド
ClassName.prototype.method = function(...args) {
    // 前処理
    
    // 元のメソッド呼び出し（必要に応じて）
    const result = _Original_method.call(this, ...args);
    
    // 後処理
    
    return result;
};
```

### プラグインパラメータの処理
```typescript
const parameters = PluginManager.parameters(pluginName);
const boolParam = parameters['boolParam'] === 'true';
const numberParam = Number(parameters['numberParam']) || 0;
const stringParam = parameters['stringParam'] || 'default';
```

### プラグインコマンドの登録
```typescript
PluginManager.registerCommand(pluginName, 'commandName', args => {
    // コマンドの実装
});
```

## TypeScript特有の考慮事項

### 型の安全性
- RMMZの既存クラスは型定義ファイル（@types/）を参照
- 新しいプロパティやメソッドを追加する場合は型定義を更新
- `any`の使用は最小限に

### グローバルスコープ
- RMMZのグローバルクラス（`Game_Player`、`Scene_Battle`など）を直接参照
- TypeScriptの型システムと組み合わせて使用

## デバッグとロギング

### コンソールログ
```typescript
console.log(`[Furamon] ${pluginName} is loaded.`);
console.log('[Furamon] Debug info:', debugData);
console.warn('[Furamon] Warning:', warningMessage);
console.error('[Furamon] Error:', errorMessage);
```

### デバッグ用の条件付きログ
```typescript
if ($gameTemp.isPlaytest()) {
    console.log('[Furamon Debug]', debugInfo);
}
```

## パフォーマンス考慮

- 頻繁に呼び出されるメソッドでは計算を最小限に
- キャッシュ可能な値はキャッシュ
- 不要なループや検索を避ける

## ドキュメント

### プラグインヘルプ
- プラグインの目的と機能を簡潔に説明
- 使用方法と設定項目を記載
- 既知の問題や制限事項を明記
- 謝辞セクションで使用したリソースやツールを記載

### コードコメント
- 複雑なロジックには日本語で説明を追加
- なぜそのような実装をしたかを記録
- 将来の自分や他の開発者が理解しやすいように

## テンプレートの使用

新しいプラグインを作成する際は`src/_Template.ts`を複製して使用:
```powershell
Copy-Item src\_Template.ts src\Furamon_NewPlugin.ts
```

その後、プラグイン名と機能に合わせて内容を編集。

## セキュリティとベストプラクティス

- ユーザー入力を適切にバリデーション
- グローバルスコープの汚染を避ける（IIFEを使用）
- エラーハンドリングを適切に実装
- RMMZのバージョンアップに備えて柔軟な実装を心がける
