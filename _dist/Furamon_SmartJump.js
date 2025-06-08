//------------------------------------------------------------------------------
// Furamon_SmartJump.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/08 1.0.0 公開！
/*:ja
 * @target MZ
 * @plugindesc 障害物を飛び越えるジャンプを実装します。
 * @author Furamon
 * @url
 * @help プレイヤーの向いている方向に応じて、障害物を飛び越せるジャンプをする機能を提供します。
 *
 * - 2マス先が通行可能なら2マスジャンプ（すり抜け有効）
 * - 2マス先が通行不可で1マス先が通行可能なら1マスジャンプ
 * - どちらも通行不可ならその場でジャンプ
 *
 * キーを設定するかプラグインコマンドをイベント内で実行してください。
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * Claude 4 sonnetの力を借りました。
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
    'use strict';
    // パラメータ取得
    const pluginName = 'Furamon_SmartJump';
    const parameters = PluginManager.parameters(pluginName);
    const config = {
        jumpSoundName: parameters['jumpSoundName'] || 'Jump1',
        jumpSoundVolume: Number(parameters['jumpSoundVolume']) || 90,
        jumpSoundPitch: Number(parameters['jumpSoundPitch']) || 80,
        jumpSpeed: Number(parameters['jumpSpeed']) || 50,
        jumpHeight: Number(parameters['jumpHeight']) || 200,
        enableThrough: parameters['enableThrough'] === 'true',
        jumpKey: parameters['jumpKey'] || 'control',
        requireSwitch: Number(parameters['requireSwitch']) || 0,
        disableInMenu: parameters['disableInMenu'] === 'true',
    };
    /**
     * 通行可能かチェック
     */
    function canPass(x, y) {
        return $gameMap.isPassable(x, y, $gamePlayer.direction());
    }
    /**
     * 方向に応じたオフセットを取得
     */
    function getDirectionOffset(direction) {
        const offsets = {
            2: [0, 1], // 下
            4: [-1, 0], // 左
            6: [1, 0], // 右
            8: [0, -1], // 上
        };
        return offsets[direction] || [0, 0];
    }
    /**
     * ジャンプ効果音を再生
     */
    function playJumpSound() {
        const se = {
            name: config.jumpSoundName,
            volume: config.jumpSoundVolume,
            pitch: config.jumpSoundPitch,
            pan: 0,
        };
        AudioManager.playSe(se);
    }
    /**
     * ジャンプを実行
     */
    function executeJump(jumpX, jumpY, useThrough = false) {
        const player = $gamePlayer;
        // すり抜け設定
        if (useThrough && config.enableThrough) {
            player.setThrough(true);
        }
        // ジャンプ設定と実行
        player.setJumpSpeed(config.jumpSpeed);
        player.setJumpHeight(config.jumpHeight);
        player.jump(jumpX, jumpY);
        // すり抜け解除（ジャンプ完了後）
        if (useThrough && config.enableThrough) {
            // ジャンプ完了を待ってからすり抜け解除
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
        const [dx, dy] = getDirectionOffset(direction);
        // 効果音再生
        playJumpSound();
        // 2マス先の座標
        const [x2, y2] = [px + dx * 2, py + dy * 2];
        // 1マス先の座標
        const [x1, y1] = [px + dx, py + dy];
        // 通行判定とジャンプ実行
        if (canPass(x2, y2)) {
            // 2マス先が通れる場合：2マスジャンプ（すり抜け有効）
            executeJump(dx * 2, dy * 2, true);
        }
        else if (canPass(x1, y1)) {
            // 1マス先だけ通れる場合：1マスジャンプ
            executeJump(dx, dy, false);
        }
        else {
            // どちらも通れない場合：その場ジャンプ
            executeJump(0, 0, false);
        }
    }
    /**
     * スイッチ条件付きでスマートジャンプを実行
     */
    function executeSmartJumpWithSwitch(switchId) {
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
        // 基本的な実行可能チェック
        if (!canExecuteSmartJump())
            return false;
        // メニュー中無効化設定がONの場合
        if (config.disableInMenu) {
            // メニューシーンやメッセージ表示中は無効
            if (SceneManager._scene.constructor !== Scene_Map)
                return false;
            if ($gameMessage.isBusy())
                return false;
            // イベント実行中は無効
            if ($gameMap.isEventRunning())
                return false;
        }
        // 必須スイッチのチェック
        if (config.requireSwitch > 0) {
            if (!$gameSwitches.value(config.requireSwitch))
                return false;
        }
        return true;
    }
    /**
     * 指定されたキーが押されたかチェック
     */
    function isJumpKeyPressed() {
        if (config.jumpKey === 'none')
            return false;
        // キーマッピング
        const keyMap = {
            control: 'control',
            shift: 'shift',
            alt: 'alt',
            space: 'ok', // スペースキーはokキーとして扱われる
            ok: 'ok',
            escape: 'escape',
            tab: 'tab',
            z: 'ok', // ツクールMZでは通常Zキー = OK
            x: 'escape', // ツクールMZでは通常Xキー = Cancel/Escape
            c: 'pageup',
            v: 'pagedown',
            a: 'shift',
            s: 'control',
            d: 'tab',
            q: 'pageup',
            w: 'up',
            e: 'pagedown',
        };
        const mappedKey = keyMap[config.jumpKey];
        if (!mappedKey)
            return false;
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
     * 安全にスマートジャンプを実行（移動中チェック付き）
     */
    function safeExecuteSmartJump() {
        if (canExecuteSmartJump()) {
            executeSmartJump();
        }
    }
    /**
     * 安全にスイッチ条件付きスマートジャンプを実行
     */
    function safeExecuteSmartJumpWithSwitch(switchId) {
        if (canExecuteSmartJump()) {
            executeSmartJumpWithSwitch(switchId);
        }
    }
    function registerKeyHandlers() {
        // マップシーンでのキー入力処理
        const originalUpdateInputData = Input.update;
        Input.update = function () {
            originalUpdateInputData.call(this);
            if ($gameMap && $gamePlayer) {
                handleKeyInput();
            }
        };
    }
    /**
     * プラグイン初期化
     */
    function initialize() {
        registerKeyHandlers();
        // その他の初期化処理があれば追加
    }
    // プラグイン開始時に初期化を実行
    initialize();
})();
