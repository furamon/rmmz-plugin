//------------------------------------------------------------------------------
// Furamon_CursorEnhance.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc カーソルの横に任意画像を出すなどの機能を追加します。
 * @author Furamon
 * @help カーソルの横に任意画像を出すなどの機能を追加します。
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * 以下のプラグインを着想および参考にさせていただきました。 m（＿ ＿）m ﾏｲﾄﾞ
 * https://raw.githubusercontent.com/munokura/MNKR-MZ-plugins/master/MNKR_KMS_CursorAnimationMZ.js
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param ImageName
 * @text カーソル画像
 * @type file
 * @dir img/pictures
 * @default
 * @desc カーソルの横に表示する画像（img/pictures に入れてください）。空欄で機能オフ。
 *
 * @param OffsetX
 * @text Xオフセット
 * @type number
 * @default 8
 * @desc カーソル画像の選択肢右端からのXオフセット（ピクセル）
 *
 * @param OffsetY
 * @text Yオフセット
 * @type number
 * @default 0
 * @desc カーソル画像のYオフセット（ピクセル）
 *
 * @param Scale
 * @text スケール
 * @type number
 * @default 1.0
 * @decimals 2
 * @desc 画像の拡大率（1 = 等倍）
 *
 * @param CursorPosition
 * @text カーソル位置
 * @type select
 * @option 左側
 * @value left
 * @option 右側
 * @value right
 * @default left
 * @desc カーソルを表示する位置
 *
 * @param Columns
 * @text アニメーション列数
 * @type number
 * @default 1
 * @min 1
 * @desc スプライトシートの列数（横に並ぶフレーム数）。1なら通常画像。
 *
 * @param Rows
 * @text アニメーション行数
 * @type number
 * @default 1
 * @min 1
 * @desc スプライトシートの行数（縦に並ぶフレーム数）。1なら通常画像。
 *
 * @param AnimationSpeed
 * @text アニメーション速度
 * @type number
 * @default 12
 * @desc 1秒あたりのフレーム数。0ならアニメーションなし。
 *
 * @param ShowWhenInactive
 * @text 非アクティブ時にも表示
 * @type boolean
 * @default false
 * @desc ウィンドウが非アクティブでも画像を表示するか
 *
 * @param WindowPadding
 * @text ウィンドウ内側余白
 * @type number
 * @default 12
 * @desc カーソル画像がウィンドウからはみ出さないための内側余白（ピクセル）
 *
 * @param EnabledWindows
 * @text 有効ウィンドウ一覧
 * @type string[]
 * @default []
 * @desc カーソルを表示するウィンドウクラス名の一覧。空なら全ウィンドウで表示。例: "Window_MenuCommand"
 *
 * @param DisabledWindows
 * @text 無効ウィンドウ一覧
 * @type string[]
 * @default []
 * @desc カーソルを表示しないウィンドウクラス名の一覧。有効一覧より優先。例: "Window_BattleLog"
 */
(() => {
  const PLUGIN_NAME = "Furamon_CursorEnhance";
  const parameters = PluginManager.parameters(PLUGIN_NAME);

  // プラグインパラメータ（デフォルト値）
  const prmImageName = String(parameters.ImageName || "");
  const prmOffsetX = Number(parameters.OffsetX || 8);
  const prmOffsetY = Number(parameters.OffsetY || 0);
  const prmScale = Number(parameters.Scale || 1.0);
  const prmPosition = String(parameters.CursorPosition || "left");
  const prmColumns = Number(parameters.Columns || 1);
  const prmRows = Number(parameters.Rows || 1);
  const prmAnimSpeed = Number(parameters.AnimationSpeed || 12);
  const prmShowWhenInactive =
    (parameters.ShowWhenInactive || "false") === "true";
  const _prmWindowPadding = Number(parameters.WindowPadding || 12);

  // ウィンドウクラス制御用パラメータ
  const prmEnabledWindows = parameters.EnabledWindows
    ? JSON.parse(parameters.EnabledWindows)
    : [];
  const prmDisabledWindows = parameters.DisabledWindows
    ? JSON.parse(parameters.DisabledWindows)
    : [];

  // アニメーション状態（全カーソルスプライトで共有）
  let _animationTime = 0;
  let _currentFrame = 0;
  const _totalFrames = prmColumns * prmRows;
  let _frameWidth = 0; // スプライト読み込み時に設定
  let _frameHeight = 0;
  let _lastUpdateFrame = 0; // 最後にアニメーション更新したフレーム番号

  // ウィンドウでカーソルを表示するか判定
  function isWindowEnabled(win: Window_Selectable): boolean {
    const className = win.constructor.name;

    // 無効リストに含まれていたら表示しない
    if (
      prmDisabledWindows.length > 0 &&
      prmDisabledWindows.includes(className)
    ) {
      return false;
    }

    // 有効リストが空なら全て表示
    if (prmEnabledWindows.length === 0) {
      return true;
    }

    // 有効リストに含まれているか
    return prmEnabledWindows.includes(className);
  }

  // スプライトのアニメーションフレームを更新
  function updateSpriteFrame(sprite: Sprite) {
    if (!sprite.bitmap || !sprite.bitmap.isReady()) return;

    // ビットマップ読み込み時に一度だけ計算
    if (_frameWidth === 0) {
      _frameWidth = sprite.bitmap.width / prmColumns;
      _frameHeight = sprite.bitmap.height / prmRows;
    }

    if (prmAnimSpeed <= 0 || _totalFrames <= 1) return;

    const frameX = _currentFrame % prmColumns;
    const frameY = Math.floor(_currentFrame / prmColumns);
    sprite.setFrame(
      frameX * _frameWidth,
      frameY * _frameHeight,
      _frameWidth,
      _frameHeight,
    );
  }

  // アニメーションの更新（毎フレーム呼び出し）
  function updateAnimation() {
    if (prmAnimSpeed <= 0 || _totalFrames <= 1) return;

    // 現在のフレーム番号を取得（Graphics.frameCount が利用可能）
    const currentFrame = Graphics.frameCount || 0;

    // 同じフレーム内で複数回呼ばれても1回だけ更新
    if (_lastUpdateFrame === currentFrame) {
      return;
    }
    _lastUpdateFrame = currentFrame;

    _animationTime += SceneManager._deltaTime || 1 / 60;
    const frameTime = 1 / prmAnimSpeed;

    while (_animationTime >= frameTime) {
      _animationTime -= frameTime;
      _currentFrame = (_currentFrame + 1) % _totalFrames;
    }
  }

  // ウィンドウにカーソル画像スプライトを作成
  function createCursorEnhanceSprite(win: Window_Selectable) {
    if (!prmImageName) return;
    // ウィンドウクラスのチェック
    if (!isWindowEnabled(win)) return;

    const sprite = new Sprite();
    sprite.bitmap = ImageManager.loadPicture(prmImageName);
    // 縦方向の中心を基準に
    sprite.anchor.y = 0.5;
    sprite.anchor.x = 0;
    sprite.x = 0;
    sprite.y = 0;
    sprite.scale.set(prmScale, prmScale);
    sprite.visible = false;
    // ウィンドウにスプライトを保存（型チェック回避のためany使用）
    (win as any)._cursorEnhanceSprite = sprite;
    win.addChild(sprite);
  }

  function updateCursorEnhanceForWindow(win: Window_Selectable) {
    const sprite = (win as any)._cursorEnhanceSprite as Sprite & {
      _targetX?: number;
      _targetY?: number;
      _tweenCount?: number;
      _initialized?: boolean;
    };
    if (!sprite) return;
    const idx = win.index();
    if (idx < 0 || (!win.active && !prmShowWhenInactive)) {
      sprite.visible = false;
      return;
    }

    // itemRect はウィンドウコンテンツ相対の矩形を返す（スクロール前の位置）
    let rect: Rectangle;
    try {
      rect = (win as any).itemRect(idx) as Rectangle;
    } catch (_e) {
      // フォールバック: cursorRect を試す
      rect = (win as any).cursorRectForItem
        ? (win as any).cursorRectForItem(idx)
        : new Rectangle(0, 0, 0, 0);
    }

    // アニメーションフレームを更新
    updateAnimation();
    updateSpriteFrame(sprite);

    // ウィンドウの origin からスクロールオフセットを取得（途中のスクロール量にも対応）
    const originY = (win as any).origin ? (win as any).origin.y : 0;

    // ウィンドウの itemPadding を取得（通常は 8 または 12px）
    const itemPadding = (win as any).itemPadding()
      ? (win as any).itemPadding()
      : 8;

    // 目標位置を計算（rect はコンテンツ座標系、origin.y でスクロール調整）
    // itemPadding 分を加算して正確な中心位置を計算
    const targetX =
      rect.x +
      (prmPosition === "right" ? rect.width + prmOffsetX : -prmOffsetX);
    const targetY =
      rect.y - originY + rect.height / 2 + itemPadding * 1.5 + prmOffsetY;

    // トゥイーンプロパティの初期化
    if (sprite._tweenCount === undefined) {
      sprite._tweenCount = 0;
    }

    // 初回: 即座に位置を設定
    if (!sprite._initialized) {
      sprite.x = targetX;
      sprite.y = targetY;
      sprite._initialized = true;
      sprite.visible = true;
      return;
    }

    // 新しいトゥイーンが必要かチェック
    const needsUpdate =
      sprite._tweenCount === 0 &&
      (Math.abs(targetX - sprite.x) > 1 || Math.abs(targetY - sprite.y) > 1);

    if (needsUpdate) {
      // 新しいトゥイーンを開始
      sprite._targetX = targetX;
      sprite._targetY = targetY;
      sprite._tweenCount = 6;
    }

    if (sprite._tweenCount > 0) {
      // トゥイーン継続
      const t = sprite._tweenCount;
      sprite.x = (sprite.x * (t - 1) + (sprite._targetX || targetX)) / t;
      sprite.y = (sprite.y * (t - 1) + (sprite._targetY || targetY)) / t;
      sprite._tweenCount--;
    }

    sprite.visible = true;
  }

  // Window_Selectable.initialize をフックしてスプライトを作成
  const _Window_Selectable_initialize = Window_Selectable.prototype.initialize;
  Window_Selectable.prototype.initialize = function (
    this: Window_Selectable,
    ...args: any[]
  ) {
    _Window_Selectable_initialize.apply(this, args as any);
    try {
      createCursorEnhanceSprite(this);
    } catch (_e) {
      // エラーを無視
    }
  };

  // Window_Selectable.update をフックしてスプライトを移動
  const _Window_Selectable_update = Window_Selectable.prototype.update;
  Window_Selectable.prototype.update = function (
    this: Window_Selectable,
    ...args: any[]
  ) {
    _Window_Selectable_update.apply(this, args as any);
    try {
      updateCursorEnhanceForWindow(this);
    } catch (_e) {
      // エラーを無視
    }
  };

  // ウィンドウが initialize フックを経由せずに作成された場合のヘルパー（エッジケース対応）
  (Window_Selectable.prototype as any).createCursorEnhanceSprite = function () {
    createCursorEnhanceSprite(this as Window_Selectable);
  };
})();
