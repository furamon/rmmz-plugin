//------------------------------------------------------------------------------
// Furamon_SmartJump.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/11 1.0.0 公開！
// 2025/08/30 1.0.1 HalfMove.js対応が不完全だったので修正
// 2025/08/31 1.1.0 ジャンプ禁止リージョンを設定可能にした
// 2025/09/29 1.2.0 PD_8DirDash及びHalfMove.jsの8方向移動有効時斜めにジャンプできるようにした

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
 * @param noJumpRegionId
 * @text ジャンプ禁止リージョンID
 * @desc ジャンプを禁止するリージョンID。0で無効
 * @type number
 * @min 0
 * @max 255
 * @default 0
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

    // Game_Playerに最後に移動した方向を記憶するプロパティを追加
    const _Game_Player_initMembers = Game_Player.prototype.initMembers;
    Game_Player.prototype.initMembers = function () {
        _Game_Player_initMembers.call(this);
        this._lastMoveDirection = 2; // 初期値は下向き
    };

    // プレイヤーの移動時に方向を記憶
    const _Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function (direction) {
        if (direction > 0) {
            this._lastMoveDirection = direction;
        }
        _Game_Player_executeMove.call(this, direction);
    };
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    const prmNoJumpRegionId = Number(parameters['noJumpRegionId']) || 0;
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
     * 8方向移動プラグイン（HalfMove.js or PD_8DirDash.js）が有効か検出
     */
    function is8DirMoveActive() {
        const halfMoveRegistered = PluginManager._scripts.some(name => name.toLowerCase() === 'halfmove');
        const pd8DirDashRegistered = PluginManager._scripts.some(name => name.toLowerCase() === 'pd_8dirdash');

        if (pd8DirDashRegistered) {
            return true;
        }

        if (halfMoveRegistered) {
            // isHalfMoveプロパティの存在は、未ロード時のエラーを防ぐためにチェックが必要です。
            if ($gamePlayer.isHalfMove && $gamePlayer.isHalfMove()) {
                return true;
            }
        }
        return false;
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
     * 斜め方向に応じたオフセットを取得
     */
    function getDiagonalDirectionOffset(direction: number) {
        const offsets: Record<number, number[]> = {
            1: [-1, 1], // 左下
            3: [1, 1],  // 右下
            7: [-1, -1], // 左上
            9: [1, -1], // 右上
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
        const player = $gamePlayer;
        let targetX: number, targetY: number;

        if (direction % 2 !== 0 && is8DirMoveActive()) {
            // 斜め方向
            const [dx, dy] = getDiagonalDirectionOffset(direction);
            targetX = fromX + dx * distance;
            targetY = fromY + dy * distance;
        } else {
            // 上下左右
            const [dx, dy] = getDirectionOffset(direction);
            targetX = fromX + dx * distance;
            targetY = fromY + dy * distance;
        }

        // 0. ジャンプ禁止リージョンチェック
        if (prmNoJumpRegionId > 0) {
            const regionId = $gameMap.regionId(Math.floor(targetX), Math.floor(targetY));
            if (regionId === prmNoJumpRegionId) {
                return false;
            }
        }

        // 1. イベントとの衝突チェック
        if (player.isCollidedWithCharacters(targetX, targetY)) {
            return false;
        }

        // 2. タイルの通行可能性チェック
        const isPassableTile = (x: number, y: number) => {
            const player = $gamePlayer;
            // HalfMove.jsが有効な場合、isMapPassableを使って判定する
            if (typeof Game_Map.prototype.tileUnit !== 'undefined' && player.isHalfMove && player.isHalfMove()) {
                // ジャンプ先からいずれかの方向に移動できれば、そこは通行可能とみなす
                return player.isMapPassable(x, y, 2) || player.isMapPassable(x, y, 4) ||
                       player.isMapPassable(x, y, 6) || player.isMapPassable(x, y, 8);
            }
            // 通常のタイル通行判定
            return $gameMap.checkPassage(Math.floor(x), Math.floor(y), 0x0f);
        };

        if (!isPassableTile(targetX, targetY)) {
            return false;
        }

        // 3. HalfMove.js の特殊な通行不可設定（リージョン/地形タグ）をチェック
        if (typeof Game_Map.prototype.tileUnit !== 'undefined' && $gamePlayer.isHalfMove && $gamePlayer.isHalfMove()) {
            // @ts-ignore
            if (!$gameMap.isPassableByHalfRegionAndTag(targetX, targetY)) {
                return false;
            }
        }

        return true;
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
        let direction = Input.dir8;
        if (direction === 0) {
            // @ts-ignore
            direction = player._lastMoveDirection || player.direction();
        }
        const [px, py] = [player.x, player.y];

        // 現在地がジャンプ禁止リージョンの場合、ジャンプしない
        if (prmNoJumpRegionId > 0) {
            const regionId = $gameMap.regionId(Math.floor(px), Math.floor(py));
            if (regionId === prmNoJumpRegionId) {
                return; // 何もせずに終了
            }
        }

        // 効果音再生
        playJumpSound();

        // 1マス先と2マス先への着地可能性を判定
        if (is8DirMoveActive() && direction % 2 !== 0) {
            // 斜めジャンプ処理
            const jumpDistance = 1.5;
            const canPass = canPassToPosition(px, py, direction, jumpDistance);
            if (canPass) {
                const [dx, dy] = getDiagonalDirectionOffset(direction);
                executeJump(dx * jumpDistance, dy * jumpDistance, true);
            } else {
                // 斜めに飛べない場合はその場でジャンプ
                executeJump(0, 0, false);
            }
        } else {
            // 上下左右ジャンプ処理
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
