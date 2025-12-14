//------------------------------------------------------------------------------
// Furamon_VariableWindow.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/05/01 1.0.0 公開！
// 2025/05/10 1.1.0 メッセージウィンドウっぽい文字送り機能追加。

/*:
 * @target MZ
 * @plugindesc プラグインコマンドで指定したテキストを指定時間表示
 * @author Furamon
 *
 * @help
 * プラグインコマンドで指定されたテキストを、指定された時間だけ
 * 画面上に表示します。
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * Classは「Window_TemporaryText」です。
 * トリアコンタン氏の背景画像プラグインで任意画像を指定時は
 * 以上を指定してください。
 * ……というかこのためのプラグインです。
 *
 * @-----------------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------------
 * @command showTextTemporarily
 * @text テキスト表示
 * @desc 指定したテキストを指定時間表示します。
 *
 * @arg text
 * @type string
 * @text 表示テキスト
 * @desc 表示したいメッセージを入力します。
 *
 * @arg duration
 * @type number
 * @text 表示時間(フレーム)
 * @default 60
 * @min 1
 * @desc テキストを表示しておく時間をフレーム単位で指定します。
 *
 * @arg enableTextScroll
 * @type boolean
 * @on 文字送りする
 * @off 一括表示
 * @default true
 * @text 文字送り有効
 * @desc 文字送り（1文字ずつ表示）を有効にするか。falseで一括表示。
 *
 * @arg position
 * @type select
 * @option 上 @value 0
 * @option 中 @value 1
 * @option 下 @value 2
 * @option カスタム @value -1
 * @default 2
 * @text 表示位置
 * @desc テキストの表示位置を選択します。「カスタム」を選ぶとX,Y座標で指定できます。
 *
 * @arg x
 * @type number
 * @text X座標
 * @default 0
 * @min 0
 * @desc 表示位置で「カスタム」を選んだ場合のX座標（左端）を指定します。
 *
 * @arg y
 * @type number
 * @text Y座標
 * @default 0
 * @min 0
 * @desc 表示位置で「カスタム」を選んだ場合のY座標（上端）を指定します。
 *
 * @arg fontSize
 * @type number
 * @text フォントサイズ
 * @default 26
 * @min 1
 * @desc テキストのフォントサイズを指定します。デフォルトは26です。
 *
 * @arg fullWidth
 * @type boolean
 * @on 画面幅にする
 * @off 内容に合わせる
 * @default false
 * @text ウィンドウ幅
 * @desc ウィンドウの幅を画面全体にするか、テキスト内容に合わせるか選択します。
 *
 * @arg textAlign
 * @type select
 * @option 左揃え @value left
 * @option 中央揃え @value center
 * @default center
 * @text 文字揃え
 * @desc ウィンドウ内でのテキストの水平揃えを指定します。
 *
 * @arg wait
 * @type boolean
 * @on 待つ
 * @off 待たない
 * @default true
 * @text 完了までウェイト
 * @desc このウィンドウが表示されている間、イベントの進行を待つかどうか。
 */
(() => {
  const PLUGIN_NAME = "Furamon_VariableWindow";
  const _parameters = PluginManager.parameters(PLUGIN_NAME);

  // NRP_MessageSpeed連携
  const nrpParams = PluginManager.parameters("NRP_MessageSpeed");
  const nrpDefaultSpeed = Number(nrpParams.DefaultSpeed || 100);
  const nrpSpeedVariable = Number(nrpParams.SpeedVariable || 0);

  type Game_Interpreter_TemporaryText = Game_Interpreter & {
    _temporaryWindow?: Window_TemporaryText | null;
  };

  // --- Window_TemporaryText ---
  // 一時的なテキスト表示用ウィンドウ
  class Window_TemporaryText extends Window_Base {
    _text: string;
    _duration: number;
    _fontSize: number;
    _position: number; // 表示位置を保持
    _fullWidth: boolean; // 画面幅フラグ
    _textAlign: string; // 文字揃え
    _showedTextLength: number; // 現在表示している文字数
    _textSpeed: number; // 1文字あたりのフレーム数
    _textWaitCount: number; // 文字送り用カウンタ
    _isAllShown: boolean; // 全文表示済みか

    constructor(
      rect: Rectangle,
      text: string,
      duration: number,
      fontSize: number,
      position: number,
      fullWidth: boolean,
      textAlign: string,
      enableTextScroll: boolean = true,
    ) {
      super(rect);
      this._text = text;
      this._duration = duration;
      this._fontSize = fontSize;
      this._position = position; // 表示位置を保存
      this._fullWidth = fullWidth; // 画面幅フラグを保存
      this._textAlign = textAlign; // 文字揃えを保存
      this.opacity = 255; // ウィンドウ背景透明度
      this.openness = 0; // 初期状態を閉じた状態にする
      this.contentsOpacity = 255; // 文字透明度
      this._showedTextLength = enableTextScroll ? 0 : text.length; // 文字送り用
      this._textSpeed = nrpParams
        ? 100 / nrpSpeedVariable
          ? $gameVariables.value(nrpSpeedVariable)
          : ConfigManager.messageSpeed
            ? ConfigManager.messageSpeed
            : nrpDefaultSpeed
        : 1;
      this._textWaitCount = 0;
      this._isAllShown = !enableTextScroll; // 送り無効なら最初から全文表示
      this.refresh(); // テキストを描画し、ウィンドウサイズを調整
      this.open(); // オープンアニメーションを開始
    }

    // ウィンドウの幅を内容に合わせて計算
    fittingWidth(text: string, fontSize: number): number {
      const tempBitmap = new Bitmap(1, 1); // 幅計算用の一時Bitmap
      tempBitmap.fontSize = fontSize;
      const textWidth = tempBitmap.measureTextWidth(text);
      tempBitmap.destroy();
      return textWidth + this.padding * 2; // 左右のパディングを追加
    }

    // ウィンドウの高さを内容に合わせて計算
    fittingHeight(fontSize: number): number {
      return fontSize + this.padding * 2; // 上下のパディングを追加
    }

    // ウィンドウの内容を描画・更新
    refresh() {
      // テキストに合わせてウィンドウサイズを再計算
      const height = this.fittingHeight(this._fontSize);
      const width = this._fullWidth
        ? Graphics.boxWidth
        : this.fittingWidth(this._text, this._fontSize); // 幅を決定
      this.width = width;
      this.height = height;
      this.createContents(); // 新しいサイズでコンテンツ領域を作成

      this.contents.clear(); // 前の内容をクリア
      this.contents.fontSize = this._fontSize; // フォントサイズ設定
      const align = this._textAlign; // 揃え位置を決定
      // 文字送り対応
      const showText = this._text.slice(0, this._showedTextLength);
      this.drawText(showText, 0, 0, this.contentsWidth(), align); // テキスト描画

      // 位置調整 (refreshの最後に移動)
      this.adjustPosition();
    }

    // 位置を調整するメソッド
    adjustPosition() {
      // X座標を設定
      this.x = this._fullWidth ? 0 : (Graphics.boxWidth - this.width) / 2;

      // 'カスタム' 以外の場合、コアスクリプトの計算式でY座標を設定
      if (this._position !== -1) {
        this.y = (this._position * (Graphics.boxHeight - this.height)) / 2;
      }
      // 'カスタム' の場合は、コンストラクタで渡された初期座標(rect.x, rect.y)がそのまま使われる (何もしない)
    }

    // フレームごとの更新処理
    update() {
      super.update();
      // 文字送りが終わっていない場合
      if (!this._isAllShown) {
        if (this._showedTextLength < this._text.length) {
          this._textWaitCount++;
          if (this._textWaitCount >= this._textSpeed) {
            this._textWaitCount = 0;
            let charsToShow = 1;
            if (this._textSpeed < 1) {
              charsToShow = Math.floor(1 / this._textSpeed);
            }
            this._showedTextLength += charsToShow;
            if (this._showedTextLength > this._text.length) {
              this._showedTextLength = this._text.length;
            }
            this.refresh();
          }
          // 決定キーで全文表示
          if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
            this._showedTextLength = this._text.length;
            this._isAllShown = true;
            this.refresh();
          }
        } else {
          this._isAllShown = true;
        }
        return; // 文字送り中はタイマー進行しない
      }
      // 全文表示後、通常のタイマー減算
      if (this._duration > 0) {
        this._duration--;
      } else {
        this.close();
        // 必要に応じて this.destroy() で完全に破棄することも検討
      }
    }
  }

  // --- プラグインコマンドの登録 ---
  PluginManager.registerCommand(
    PLUGIN_NAME,
    "showTextTemporarily",
    function (this: Game_Interpreter_TemporaryText, args) {
      const text = String(args.text || "");
      const duration = Number(args.duration || 90);
      const position = Number(args.position || 0);
      const fontSize = Number(args.fontSize || $gameSystem.mainFontSize());
      const fullWidth = args.fullWidth === "true"; // boolean引数は文字列で渡される
      const textAlign = String(args.textAlign || "center");
      // 新規: 文字送り有無・速度
      const enableTextScroll =
        args.enableTextScroll === undefined
          ? true
          : args.enableTextScroll === true || args.enableTextScroll === "true";

      const wait = args.wait !== "false"; // デフォルトtrue。"false"が指定された時だけfalseに
      let x = 0;
      let y = 0;

      // positionが'カスタム' かつ fullWidthがfalse の場合のみx, y引数を読み込む
      // (fullWidth=true の場合はx=0で固定されるため)
      if (position === -1 && !fullWidth) {
        x = Number(args.x || 0);
      }
      if (position === -1) {
        // Y座標はpositionがカスタムなら常に読み込む
        y = Number(args.y || 0);
      }

      // 初期位置(カスタム時)と仮サイズでウィンドウ生成（サイズと最終位置はrefreshで調整される）
      const rect = new Rectangle(x, y, 1, 1);
      const tempWindow = new Window_TemporaryText(
        rect,
        text,
        duration,
        fontSize,
        position,
        fullWidth,
        textAlign,
        enableTextScroll,
      );

      // 現在のシーンにウィンドウを追加
      SceneManager._scene?.addWindow(tempWindow);

      // ウェイトが有効な場合、Interpreterにウィンドウを記憶させ、待機モードを設定
      if (wait) {
        this._temporaryWindow = tempWindow;
        this.setWaitMode("temporaryText");
      }
    },
  );

  // --- Game_Interpreter の拡張 ---
  // updateWaitMode を拡張して、temporaryText モードの待機処理を追加
  const _Game_Interpreter_updateWaitMode =
    Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function (
    this: Game_Interpreter_TemporaryText,
  ): boolean {
    if (this._waitMode === "temporaryText") {
      // _temporaryWindow が存在し、かつ閉じ始めていない（開いている途中か表示中）かチェック
      if (this._temporaryWindow && !this._temporaryWindow.isClosing()) {
        return true; // まだ待機
      } else {
        this._waitMode = ""; // 待機モード解除
        this._temporaryWindow = null; // 参照をクリア
      }
    }

    return _Game_Interpreter_updateWaitMode.call(this);
  };
})();
