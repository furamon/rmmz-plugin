//------------------------------------------------------------------------------
// Furamon_StateList.ts
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc アイコンの上に文字を描画します。
 * @author Furamon
 * @url https://github.com/furamon/rmmz-plugin
 * @help アイコンの上に文字を描画します。
 * プラグインパラメータで指定したアイコンIDの上に、
 * 対応する文字を描画します。
 *
 * スキル、アイテム、武器、防具、ステート、バフ/デバフなど、
 * アイコンが表示される全ての場所で有効です。
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param iconNameList
 * @text アイコン名リスト
 * @desc アイコンIDと表示する文字の組み合わせを設定します。
 * @type struct<IconName>[]
 * @default []
 *
 * @param TextSize
 * @text 描画サイズ
 * @type number
 * @default 16
 * @desc 描画テキストのフォントサイズです。
 *
 * @param TextColor
 * @text 文字色
 * @type string
 * @default #ffffff
 * @desc 描画テキストの色をCSSカラー形式で指定します。
 *
 * @param OutlineWidth
 * @text 縁取りの太さ
 * @type number
 * @default 3
 * @desc 描画テキストの縁取りの太さです。
 *
 * @param OutlineColor
 * @text 縁取りの色
 * @type string
 * @default rgba(0, 0, 0, 0.5)
 * @desc 描画テキストの縁取りの色をCSSカラー形式で指定します。
 */
/*~struct~IconName:
 * @param iconIndex
 * @text アイコンID
 * @type icon
 * @min 1
 * @desc 対象のアイコンIDを指定します。
 *
 * @param text
 * @text 表示文字
 * @type string
 * @desc アイコンの上に表示する文字です。
 */
(() => {
    const pluginName = 'Furamon_IconNameText';
    const parameters = PluginManager.parameters(pluginName);
    const textSize = Number(parameters['TextSize'] || 16);
    const textColor = String(parameters['TextColor'] || '#ffffff');
    const outlineWidth = Number(parameters['OutlineWidth'] || 3);
    const outlineColor = String(parameters['OutlineColor'] || 'rgba(0, 0, 0, 0.5)');
    const iconNameListParam = JSON.parse(parameters['iconNameList'] || '[]');
    const iconNameMap = new Map();
    for (const itemStr of iconNameListParam) {
        const item = JSON.parse(itemStr);
        const iconIndex = Number(item.iconIndex);
        const text = String(item.text);
        if (iconIndex > 0 && text) {
            iconNameMap.set(iconIndex, text);
        }
    }
    /**
     * アイコン名を描画するためのヘルパー関数
     * @param {Bitmap} bitmap 描画先のBitmap
     * @param {string} text 描画するテキスト
     * @param {number} x X座標
     * @param {number} y Y座標
     */
    function drawIconName(bitmap, text, x, y) {
        const iconWidth = ImageManager.iconWidth;
        const iconHeight = ImageManager.iconHeight;
        bitmap.fontSize = textSize;
        bitmap.textColor = textColor;
        bitmap.outlineWidth = outlineWidth;
        bitmap.outlineColor = outlineColor;
        bitmap.drawText(text, x, y, iconWidth, iconHeight, 'center');
    }
    //
    // 1. Window_BaseのdrawIconをフックして汎用的に対応
    //
    const _Window_Base_drawIcon = Window_Base.prototype.drawIcon;
    Window_Base.prototype.drawIcon = function (iconIndex, x, y) {
        _Window_Base_drawIcon.call(this, iconIndex, x, y);
        const text = iconNameMap.get(iconIndex);
        if (text) {
            // drawIconは内部で y+2 の位置に描画する場合があるが、
            // Window_StatusBaseなどではyそのままなので、引数のyを基準にする
            drawIconName(this.contents, text, x, y);
        }
    };
    //
    // 2. 戦闘中のステートアイコン表示への対応
    //
    const _Sprite_StateOverlay_initialize = Sprite_StateOverlay.prototype.initialize;
    Sprite_StateOverlay.prototype.initialize = function () {
        _Sprite_StateOverlay_initialize.apply(this, arguments);
        this._iconNameSprites = [];
    };
    const _Sprite_StateOverlay_updateIcons = Sprite_StateOverlay.prototype.updateIcons;
    Sprite_StateOverlay.prototype.updateIcons = function () {
        _Sprite_StateOverlay_updateIcons.apply(this, arguments);
        const self = this;
        // アイコンスプライトが再生成された後に、名前スプライトを追加する
        if (self._iconSprites && self._iconSprites.length > self._iconNameSprites.length) {
            self._iconNameSprites.forEach((s) => s.destroy());
            self._iconNameSprites = [];
            for (let i = 0; i < self._icons.length; i++) {
                const iconIndex = self._icons[i];
                const text = iconNameMap.get(iconIndex);
                if (text) {
                    const iconSprite = self._iconSprites[i];
                    if (iconSprite) {
                        const textSprite = new Sprite(new Bitmap(ImageManager.iconWidth, ImageManager.iconHeight));
                        const bitmap = textSprite.bitmap;
                        drawIconName(bitmap, text, 0, 0);
                        iconSprite.addChild(textSprite);
                        self._iconNameSprites.push(textSprite);
                    }
                }
            }
        }
    };
})();
