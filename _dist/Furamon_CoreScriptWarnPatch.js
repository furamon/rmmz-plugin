/*:
 * @target MZ
 * @plugindesc コアスクリプト修正パッチ
 * @author Furamon
 */
Bitmap.prototype._createCanvas = function (width, height) {
    this._canvas = document.createElement('canvas');
    const context = this._canvas.getContext('2d', {
        willReadFrequently: true, // ここを追加
    });
    // contextがnullでないことを確認
    if (context) {
        this._context = context;
        this._canvas.width = width;
        this._canvas.height = height;
        this._createBaseTexture(this._canvas);
    }
    else {
        // コンテキストが取得できなかった場合のエラー処理（必要に応じて）
        console.error('Failed to get 2D rendering context.');
        // もしくはエラーを投げるなど
        // throw new Error("Failed to get 2D rendering context.");
    }
};
Bitmap.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {
    // [Note] Different browser makes different rendering with
    //   textBaseline == 'top'. So we use 'alphabetic' here.
    const context = this.context;
    const alpha = context.globalAlpha;
    maxWidth = maxWidth || 0xffffffff;
    let tx = x;
    let ty = Math.round(y + lineHeight / 2 + this.fontSize * 0.35);
    // align が undefined や不正値の場合のデフォルト値を設定
    const textAlign = (align === 'center' || align === 'right') ? align : 'left';
    // textAlign の値に基づいて tx を調整
    if (textAlign === 'center') {
        tx += maxWidth / 2;
    }
    if (textAlign === 'right') {
        tx += maxWidth;
    }
    context.save();
    context.font = this._makeFontNameText();
    // 検証済みの textAlign を使用
    context.textAlign = textAlign;
    context.textBaseline = 'alphabetic';
    context.globalAlpha = 1;
    this._drawTextOutline(text, tx, ty, maxWidth);
    context.globalAlpha = alpha;
    this._drawTextBody(text, tx, ty, maxWidth);
    context.restore();
    this._baseTexture.update();
};
