//------------------------------------------------------------------------------
// Furamon_SmartJump.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/11 1.0.0 公開！

/*:ja
 * @target MZ
 * @plugindesc 障害物を飛び越えるジャンプを実装します。
 * @author Furamon
 * @url
 * @orderAfter HalfMove
 * @help プレイヤーの向いている方向に、障害物を飛び越せるジャンプをする機能を提供します。
 *
 * - 2マス先が通行可能なら2マスジャンプ（すり抜け有効）
 * - 2マス先が通行不可で1マス先が通行可能なら1マスジャンプ
 * - どちらも通行不可ならその場でジャンプ
 *
 * キーを設定するかプラグインコマンドをイベント内で実行してください。
 * トリアコンタン氏のHalfMove.jsとの併用に対応しています。
 * その場合あちらのプラグインの下にこのプラグインを配置してください。
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * Claude 4 sonnetの力を盛大に借りました。
 *
 @-----------------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------------
 * @command execute
 * @text スマートジャンプ実行
 * @desc スマートジャンプを実行します
 *
 * @command executeWithSwitch
 * @text スイッチ条件付き実行
 * @desc 指定したスイッチがONの時にスマートジャンプを実行します
 *
 * @arg switchId
 * @type switch
 * @text 条件スイッチ
 * @desc 条件となるスイッチを指定
 * @default 1
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param jumpSoundName
 * @text ジャンプ効果音
 * @desc ジャンプ時に再生する効果音ファイル名
 * @type file
 * @dir audio/se/
 * @default Jump1
 *
 * @param jumpSoundVolume
 * @text 効果音音量
 * @desc ジャンプ効果音の音量（0-100）
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param jumpSoundPitch
 * @text 効果音ピッチ
 * @desc ジャンプ効果音のピッチ（50-150）
 * @type number
 * @min 50
 * @max 150
 * @default 80
 *
 * @param jumpSpeed
 * @text ジャンプ速度
 * @desc ジャンプアニメーションの速度（%）
 * @type number
 * @min 10
 * @max 200
 * @default 50
 *
 * @param jumpHeight
 * @text ジャンプ高度
 * @desc ジャンプアニメーションの高度（%）
 * @type number
 * @min 50
 * @max 300
 * @default 200
 *
 * @param enableThrough
 * @text すり抜け有効化
 * @desc 2マスジャンプ時にすり抜けを有効にするか
 * @type boolean
 * @default true
 *
 * @param jumpKey
 * @text ジャンプキー
 * @desc スマートジャンプを実行するキー
 * @type select
 * @option なし
 * @value none
 * @option Ctrl
 * @value control
 * @option Shift
 * @value shift
 * @option Alt
 * @value alt
 * @option Space
 * @value space
 * @option Enter
 * @value ok
 * @option Escape
 * @value escape
 * @option Tab
 * @value tab
 * @option Z
 * @value z
 * @option X
 * @value x
 * @option C
 * @value c
 * @option V
 * @value v
 * @option A
 * @value a
 * @option S
 * @value s
 * @option D
 * @value d
 * @option Q
 * @value q
 * @option W
 * @value w
 * @option E
 * @value e
 * @default control
 *
 * @param requireSwitch
 * @text 必須スイッチ
 * @desc キー入力時に必要なスイッチ（0で無条件）
 * @type switch
 * @default 0
 *
 * @param disableInMenu
 * @text メニュー中無効化
 * @desc メニューやイベント中はキー入力を無効にするか
 * @type boolean
 * @default true
 */
(function () {
    const PLUGIN_NAME = 'Furamon_SmartJump';
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    const prmJumpSoundName = parameters['jumpSoundName'] || 'Jump1';
    const prmJumpSoundVolume = Number(parameters['jumpSoundVolume']) || 90;
    const prmJumpSoundPitch = Number(parameters['jumpSoundPitch']) || 80;
    const prmJumpSpeed = Number(parameters['jumpSpeed']) || 50;
    const prmJumpHeight = Number(parameters['jumpHeight']) || 200;
    const prmEnableThrough = parameters['enableThrough'] === 'true';
    const prmJumpKey = parameters['jumpKey'] || 'control';
    const prmRequireSwitch = Number(parameters['requireSwitch']) || 0;
    const prmDisableInMenu = parameters['disableInMenu'] === 'true';

    /**
     * HalfMove.jsの有無を検出
     */
    function isHalfMoveActive() {
        return (
            typeof Game_Map.tileUnit !== 'undefined' &&
            $gamePlayer.isHalfMove &&
            $gamePlayer.isHalfMove()
        );
    }

    /**
     * 方向に応じたオフセットを取得（常に1マス単位）
     */
    function getDirectionOffset(direction: number) {
        const offsets: Record<number, number[]> = {
            2: [0, 1], // 下
            4: [-1, 0], // 左
            6: [1, 0], // 右
            8: [0, -1], // 上
        };
        return offsets[direction] || [0, 0];
    }

    /**
     * 通行判定を行う（HalfMove対応版）
     */
    function canPassToPosition(
        fromX: number,
        fromY: number,
        direction: number,
        distance: number
    ) {
        // 着地予定地点の座標を計算
        const [dx, dy] = getDirectionOffset(direction);
        const targetX = fromX + dx * distance;
        const targetY = fromY + dy * distance;

        if (isHalfMoveActive()) {
            // HalfMoveがアクティブな場合、着地点での通行可能性をチェック
            const player = $gamePlayer;
            const tempX = player._x;
            const tempY = player._y;

            // 着地点に一時的に設定して通行可能かチェック
            player._x = targetX;
            player._y = targetY;

            // 着地点が通行可能かチェック（方向は関係ないので適当な方向を指定）
            const canLand =
                $gameMap.isPassable(
                    Math.floor(targetX),
                    Math.floor(targetY),
                    2
                ) ||
                $gameMap.isPassable(Math.ceil(targetX), Math.ceil(targetY), 2);

            // 元の位置に戻す
            player._x = tempX;
            player._y = tempY;

            return canLand;
        } else {
            // 通常の場合、着地点の通行判定
            return $gameMap.isPassable(targetX, targetY, 2); // 下方向で通行判定
        }
    }
    /**
     * ジャンプ効果音を再生
     */
    function playJumpSound() {
        const se = {
            name: prmJumpSoundName,
            volume: prmJumpSoundVolume,
            pitch: prmJumpSoundPitch,
            pan: 0,
        };
        AudioManager.playSe(se);
    }

    /**
     * ジャンプを実行
     */
    function executeJump(jumpX: number, jumpY: number, useThrough = false) {
        const player = $gamePlayer;

        // すり抜け設定
        if (useThrough && prmEnableThrough) {
            player.setThrough(true);
        }

        // ジャンプ設定と実行
        player.setJumpSpeed(prmJumpSpeed);
        player.setJumpHeight(prmJumpHeight);
        player.jump(jumpX, jumpY);

        // すり抜け解除（ジャンプ完了後）
        if (useThrough && prmEnableThrough) {
            const originalUpdate = player.updateJump;
            player.updateJump = function () {
                originalUpdate.call(this);
                if (!this.isJumping()) {
                    this.setThrough(false);
                    this.updateJump = originalUpdate;
                }
            };
        }
    }

    /**
     * スマートジャンプのメイン処理
     */
    function executeSmartJump() {
        const player = $gamePlayer;
        const direction = player.direction();
        const [px, py] = [player.x, player.y];

        // 効果音再生
        playJumpSound();

        // 1マス先と2マス先への着地可能性を判定
        const can1Pass = canPassToPosition(px, py, direction, 1);
        const can2Pass = canPassToPosition(px, py, direction, 2);

        // ジャンプ距離を決定（常に通常の1マス＝1単位で計算）
        const [dx, dy] = getDirectionOffset(direction);

        if (can2Pass) {
            // 2マス先が通れる場合：2マスジャンプ（すり抜け有効）
            executeJump(dx * 2, dy * 2, true);
        } else if (can1Pass) {
            // 1マス先だけ通れる場合：1マスジャンプ
            executeJump(dx, dy, false);
        } else {
            // どちらも通れない場合：その場ジャンプ
            executeJump(0, 0, false);
        }
    }

    /**
     * スイッチ条件付きでスマートジャンプを実行
     */
    function executeSmartJumpWithSwitch(switchId: number) {
        if ($gameSwitches.value(switchId)) {
            executeSmartJump();
        }
    }

    /**
     * プレイヤーが移動中でないかチェック
     */
    function canExecuteSmartJump() {
        return !$gamePlayer.isMoving() && !$gamePlayer.isJumping();
    }

    /**
     * キー入力でジャンプ可能かチェック
     */
    function canExecuteByKey() {
        if (!canExecuteSmartJump()) return false;

        if (prmDisableInMenu) {
            if (SceneManager._scene.constructor !== Scene_Map) return false;
            if ($gameMessage.isBusy()) return false;
            if ($gameMap.isEventRunning()) return false;
        }

        if (prmRequireSwitch > 0) {
            if (!$gameSwitches.value(prmRequireSwitch)) return false;
        }

        return true;
    }

    /**
     * 指定されたキーが押されたかチェック
     */
    function isJumpKeyPressed() {
        if (prmJumpKey === 'none') return false;

        const keyMap: { [key: string]: string } = {
            control: 'control',
            shift: 'shift',
            alt: 'alt',
            space: 'ok',
            ok: 'ok',
            escape: 'escape',
            tab: 'tab',
            z: 'ok',
            x: 'escape',
            c: 'pageup',
            v: 'pagedown',
            a: 'shift',
            s: 'control',
            d: 'tab',
            q: 'pageup',
            w: 'up',
            e: 'pagedown',
        };

        const mappedKey = keyMap[prmJumpKey];
        if (!mappedKey) return false;

        return Input.isTriggered(mappedKey);
    }

    /**
     * キー入力によるスマートジャンプ処理
     */
    function handleKeyInput() {
        if (isJumpKeyPressed() && canExecuteByKey()) {
            executeSmartJump();
        }
    }

    /**
     * 安全にスマートジャンプを実行
     */
    function safeExecuteSmartJump() {
        if (canExecuteSmartJump()) {
            executeSmartJump();
        }
    }

    /**
     * 安全にスイッチ条件付きスマートジャンプを実行
     */
    function safeExecuteSmartJumpWithSwitch(switchId: number) {
        if (canExecuteSmartJump()) {
            executeSmartJumpWithSwitch(switchId);
        }
    }

    function registerKeyHandlers() {
        const originalUpdateInputData = Input.update;
        Input.update = function () {
            originalUpdateInputData.call(this);
            if ($gameMap && $gamePlayer) {
                handleKeyInput();
            }
        };
    }

    /**
     * プラグインコマンド登録
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'execute', (args) => {
        safeExecuteSmartJump();
    });

    PluginManager.registerCommand(PLUGIN_NAME, 'executeWithSwitch', (args) => {
        safeExecuteSmartJumpWithSwitch(Number(args.switchId));
    });

    /**
     * プラグイン初期化
     */
    function initialize() {
        registerKeyHandlers();
    }

    // プラグイン開始時に初期化を実行
    initialize();
})();
