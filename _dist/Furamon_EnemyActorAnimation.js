//------------------------------------------------------------------------------
// Furamon_EnemyActorAnimation.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/13 1.0.0 公開！
// 2025/06/14 1.0.1 DynamicMotionのNear型で敵のそばにちゃんと移動するよう修正
/*:
 * @target MZ
 * @plugindesc 敵キャラにSV_Actorsのスプライトシートを適用します。
 * @author Furamon
 * @help 敵キャラにSV_Actorsのスプライトシートを適用します。
 *
 * 敵のメモ欄に以下のいずれかを記述します：
 * 「<SVActor:ファイル名>」
 * 「<SVアクター:ファイル名>」
 * ＜使用例＞Actor1_1.pngを使いたいなら=>「<SVActor:Actor1_1>」
 *
 * そのうえでenemyまたはsv_enemiesフォルダに指定画像と同名の画像ファイルを
 * 何でもいいので配置してください。
 * リポジトリトップにダミー画像ファイルを用意してありますのでご入用なら。
 *
 * -----------------------------------------------------------------------------
 * # あてんしょん #
 * -----------------------------------------------------------------------------
 * SVアクター敵と通常敵をまたいで変身すると敵が透明になります。
 * 特殊すぎるシチュエーションであるため修正の予定はありません。
 * もしこの場面になった際は通常敵をGimpかなんかで
 * 9x6に並べ、SV敵にしてください。ごめんね。
 *
 * BattleMotionMZ(Lib様)、及びNRP_DynamicMotionMZ(砂川赳様)と併用できます。
 *
 * -----------------------------------------------------------------------------
 * # 謝辞 #
 * -----------------------------------------------------------------------------
 * Claude 4 sonnetの力を借りて借りて借りまくりました。
 *
 * @-----------------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------------
 *
 * @param autoMirror
 * @text 敵スプライトを自動反転するか
 * @desc 敵として出現するスプライトを左右反転するか設定します。
 * @type boolean
 * @on 反転する
 * @off 反転しない
 * @default true
 *
 */
(function () {
    const pluginName = 'Furamon_EnemyActorAnimation';
    const parameters = PluginManager.parameters(pluginName);
    const prmAutoMirror = parameters['autoMirror'] === 'true';
    // NRP_DynamicMotionMZのパラメータを取得
    const prmDM = PluginManager.parameters('NRP_DynamicMotionMZ');
    const hasDynamicMotion = Object.keys(prmDM).length > 0;
    function getDynamicMotionParameters() {
        // MZの場合
        const isDynamicMotionMZ = PluginManager._scripts.some(function (scriptName) {
            return scriptName == 'NRP_DynamicMotionMZ';
        });
        if (isDynamicMotionMZ) {
            return PluginManager.parameters('NRP_DynamicMotionMZ');
        }
        return undefined;
    }
    const dMotionParams = getDynamicMotionParameters();
    const pSetStepForward = dMotionParams
        ? dMotionParams['setStepForward']
        : null;
    function callDynamicMotion(battler, dynamicId, targets) {
        if (!hasDynamicMotion && !$gameParty.inBattle()) {
            return;
        }
        const dynamicAction = makeAction(dynamicId, battler);
        const actualTargets = targets || [battler];
        const mapAnimation = [];
        mapAnimation.subject = battler;
        const win = new Window_BattleLog(new Rectangle());
        win.showDynamicAnimation(actualTargets, dynamicAction, false, mapAnimation);
    }
    function makeAction(itemId, battler) {
        let subject = $gameTroop.members()[0];
        if (battler) {
            subject = battler;
        }
        const action = new Game_Action(subject);
        action.setSkill(itemId); // ここでitemId（スキルID）を設定
        return action;
    }
    // NUUN_ButlerHPGaugeのパラメータを取得
    let nuunHpGaugeParams = {};
    try {
        nuunHpGaugeParams =
            PluginManager.parameters('NUUN_ButlerHPGauge') || {};
    }
    catch (e) {
        console.log('NUUN_ButlerHPGauge parameters not found');
    }
    // グローバル変数の設定（NUUN_ButlerHPGaugeとの互換性）
    if (typeof window.HPPosition === 'undefined') {
        window.HPPosition = nuunHpGaugeParams.HPPosition
            ? Number(nuunHpGaugeParams.HPPosition) // 文字列を数値に変換
            : 0;
    }
    if (typeof window.Gauge_X === 'undefined') {
        window.Gauge_X = nuunHpGaugeParams.Gauge_X
            ? Number(nuunHpGaugeParams.Gauge_X) // 文字列を数値に変換
            : 0;
    }
    if (typeof window.Gauge_Y === 'undefined') {
        window.Gauge_Y = nuunHpGaugeParams.Gauge_Y
            ? Number(nuunHpGaugeParams.Gauge_Y) // 文字列を数値に変換
            : 0;
    }
    /**
     * 敵キャラのメモ欄からSVアクターファイル名を取得
     */
    function getSvActorFileName(enemy) {
        const meta = enemy.meta;
        const fileName = meta['SVActor'] || meta['SVアクター'];
        // 値が空でない文字列の場合のみファイル名を返すように修正
        // タグのみ (<SVActor>) が記述された場合に true が返るのを防ぐ
        if (typeof fileName === 'string' && fileName.length > 0) {
            return fileName;
        }
        return undefined;
    }
    /**
     * SVアクター使用の敵かどうか判定
     */
    function isSvActorEnemy(battler) {
        if (!battler || !(battler instanceof Game_Enemy)) {
            return false;
        }
        const enemy = battler.enemy();
        if (!enemy || !enemy.meta) {
            return false;
        }
        const fileName = enemy.meta['SVActor'] || enemy.meta['SVアクター'] || null;
        const result = !!fileName;
        return result;
    }
    // --------------------------------------------------------------------------
    // Game_Enemy
    const _Game_Enemy_battlerName = Game_Enemy.prototype.battlerName;
    Game_Enemy.prototype.battlerName = function () {
        const svActorFile = getSvActorFileName(this.enemy());
        if (svActorFile) {
            return svActorFile;
        }
        return _Game_Enemy_battlerName.call(this);
    };
    const _Game_Enemy_performAction = Game_Enemy.prototype.performAction;
    Game_Enemy.prototype.performAction = function (action) {
        _Game_Enemy_performAction.call(this, action);
        if (hasDynamicMotion && isSvActorEnemy(this)) {
            // 使用スキルのIDを取得
            let dynamicId = 1; // デフォルト値
            if (action.item()) {
                // アクションのスキル/アイテムIDを使用
                dynamicId = action.item().id;
            }
            else if (action.isAttack()) {
                // 通常攻撃の場合は攻撃スキルIDまたはデフォルト値
                dynamicId = this.attackSkillId ? this.attackSkillId() : 1;
            }
            // 本来のターゲットを取得
            const originalTargets = action.makeTargets();
            // DynamicMotionを呼び出し（実際のターゲットを渡す）
            callDynamicMotion(this, dynamicId, originalTargets);
            // DynamicMotion実行時は標準のモーション処理をスキップ
            return;
        }
        else if (!hasDynamicMotion && isSvActorEnemy(this)) {
            // DynamicMotionが無い場合は従来のモーション制御
            let motionName = 'thrust';
            if (action.isAttack()) {
                motionName = 'thrust';
            }
            else if (action.isGuard()) {
                motionName = 'guard';
            }
            else if (action.isMagicSkill()) {
                motionName = 'spell';
            }
            else if (action.isSkill()) {
                motionName = 'skill';
            }
            else if (action.isItem()) {
                motionName = 'item';
            }
            this.requestMotion(motionName);
        }
    };
    // Game_Enemy のモーション状態管理
    Game_Enemy.prototype.requestMotion = function (motionType) {
        this._motionType = motionType;
        this.refresh();
    };
    // 回避時もDynamicMotionを使用
    const _Game_Enemy_performEvasion = Game_Enemy.prototype.performEvasion;
    Game_Enemy.prototype.performEvasion = function () {
        _Game_Enemy_performEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this.requestMotion('evade');
        }
    };
    // 魔法反射時もDynamicMotionを使用
    const _Game_Enemy_performMagicEvasion = Game_Enemy.prototype.performMagicEvasion;
    Game_Enemy.prototype.performMagicEvasion = function () {
        _Game_Enemy_performMagicEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this.requestMotion('evade');
        }
    };
    // モーション要求の修正
    Game_Enemy.prototype.requestMotion = function (motionType) {
        this._motionType = motionType;
        this.refresh();
    };
    const _Game_Enemy_refresh = Game_Enemy.prototype.refresh;
    Game_Enemy.prototype.refresh = function () {
        _Game_Enemy_refresh.call(this);
        if (isSvActorEnemy(this)) {
            this._motionRefresh = true;
        }
    };
    // Game_EnemyにBattleMotionMZメソッドを移植
    if (typeof Game_Battler !== 'undefined' &&
        Game_Battler.prototype.makeSPName) {
        Game_Enemy.prototype.makeSPName = Game_Battler.prototype.makeSPName;
    }
    // --------------------------------------------------------------------------
    // Sprite_Enemy
    // 直接表示はしない、位置だけ渡す
    Sprite_Enemy.prototype.loadBitmap = function (name) {
        if (this._isSvActorEnemy) {
            // SVアクター用の場合は完全に非表示
            this.bitmap = new Bitmap(1, 1);
            this.bitmap.clear();
            this.visible = false;
            return;
        }
        // 通常の敵の処理
        if ($gameSystem.isSideView()) {
            this.bitmap = ImageManager.loadSvEnemy(name);
        }
        else {
            this.bitmap = ImageManager.loadEnemy(name);
        }
    };
    const _Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
    Sprite_Enemy.prototype.initMembers = function () {
        _Sprite_Enemy_initMembers.call(this);
        this._isSvActorEnemy = false;
        this._svActorSprite = null;
        this._damages = []; // ダメージ配列を初期化
    };
    const _Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function (battler) {
        _Sprite_Enemy_setBattler.call(this, battler);
        // 判定を実行時に再確認
        this._isSvActorEnemy = isSvActorEnemy(this._battler);
        // SVアクター用の場合の処理
        if (this._isSvActorEnemy && this._battler) {
            this.hideOriginalSprite();
            this.createSvActorSprite();
        }
    };
    Sprite_Enemy.prototype.loadBitmap = function (name) {
        // 実行時に再判定
        this._isSvActorEnemy = isSvActorEnemy(this._battler);
        if (this._isSvActorEnemy) {
            this.bitmap = new Bitmap(1, 1);
            this.bitmap.clear();
            this.visible = false;
            return;
        }
        // 通常の敵の処理
        if ($gameSystem.isSideView()) {
            this.bitmap = ImageManager.loadSvEnemy(name);
        }
        else {
            this.bitmap = ImageManager.loadEnemy(name);
        }
    };
    Sprite_Enemy.prototype.getSvActorSpriteSize = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            const mainSprite = this._svActorSprite._mainSprite;
            if (mainSprite &&
                mainSprite.bitmap &&
                mainSprite.bitmap.isReady()) {
                const bitmap = mainSprite.bitmap;
                // BattleMotionMZの場合のコマ数計算
                const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
                    Sprite_Battler.MOTIONS &&
                    this._svActorSprite.cs;
                if (hasBattleMotionMZ) {
                    // BattleMotionMZのコマ数計算ロジック
                    const cellSize = bitmap.height / 6; // 1セルのサイズ（正方形）
                    const totalFrames = bitmap.width / cellSize; // 総フレーム数
                    // 1モーション辺りの最大フレーム数を計算
                    let motionCount = Object.keys(Sprite_Battler.MOTIONS).length;
                    const maxFramesPerMotion = totalFrames / (motionCount / 6); // 6行分のモーション
                    return {
                        width: cellSize,
                        height: cellSize,
                        frameWidth: cellSize,
                        frameHeight: cellSize,
                        maxFramesPerMotion: maxFramesPerMotion,
                        totalFrames: totalFrames,
                        cellSize: cellSize,
                    };
                }
                else {
                    // 標準のSVアクター（9x6）
                    const frameWidth = bitmap.width / 9;
                    const frameHeight = bitmap.height / 6;
                    return {
                        width: frameWidth,
                        height: frameHeight,
                        frameWidth: frameWidth,
                        frameHeight: frameHeight,
                    };
                }
            }
        }
        return null;
    };
    /**
     * 元の敵スプライトを非表示にする
     */
    Sprite_Enemy.prototype.hideOriginalSprite = function () {
        this.visible = false;
        this.bitmap = null;
    };
    /**
     * SVアクタースプライトを作成
     */
    Sprite_Enemy.prototype.createSvActorSprite = function () {
        // 既に作成済みの場合はスキップ
        if (this._svActorSprite) {
            console.log('SV Actor sprite already exists, skipping creation');
            return;
        }
        this.visible = false;
        // _motionTypeがundefinedの場合はnullに変換
        if (this._battler._motionType === undefined) {
            this._battler._motionType = null;
        }
        this._svActorSprite = new Sprite_SvActor();
        this._svActorSprite.setup(this._battler);
        if (prmAutoMirror) {
            this._svActorSprite.scale.x = -1;
        }
        // 親の親（戦闘フィールド）にSVアクタースプライトを直接追加
        if (this.parent) {
            this.parent.addChild(this._svActorSprite);
            // 初期位置を設定（重要：元の敵スプライトの位置を継承）
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
            // 敵の初期位置情報を保持
            this._originalX = this.x;
            this._originalY = this.y;
            // 位置同期処理を改善
            this._positionSyncEnabled = true;
        }
        else {
            this.addChild(this._svActorSprite);
            this.visible = true;
        }
    };
    const _Sprite_Enemy_updateStateSprite = Sprite_Enemy.prototype.updateStateSprite;
    Sprite_Enemy.prototype.updateStateSprite = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // SVアクター用のステートアイコン位置調整
            if (this._stateIconSprite) {
                // SVアクタースプライトの位置とサイズを基に調整
                const svSprite = this._svActorSprite;
                const mainSprite = svSprite._mainSprite;
                if (mainSprite &&
                    mainSprite.bitmap &&
                    mainSprite.bitmap.isReady()) {
                    const frameHeight = mainSprite.bitmap.height / 6; // 1フレームの高さ
                    // ステートアイコンをSVアクタースプライトの頭上に配置
                    this._stateIconSprite.x = svSprite.x;
                    this._stateIconSprite.y = svSprite.y - frameHeight - 20; // 頭上に配置
                }
                else {
                    // ビットマップが読み込まれていない場合のフォールバック
                    this._stateIconSprite.x = this._svActorSprite.x;
                    this._stateIconSprite.y = this._svActorSprite.y - 60;
                }
            }
            return;
        }
        // 通常の敵の場合は元の処理
        _Sprite_Enemy_updateStateSprite.call(this);
    };
    // ステートアイコンの位置を取得するメソッドを追加
    Sprite_Enemy.prototype.getStateIconPosition = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            const svSprite = this._svActorSprite;
            const mainSprite = svSprite._mainSprite;
            if (mainSprite &&
                mainSprite.bitmap &&
                mainSprite.bitmap.isReady()) {
                const frameHeight = mainSprite.bitmap.height / 6;
                return {
                    x: svSprite.x,
                    y: svSprite.y - frameHeight - 20,
                };
            }
            else {
                return {
                    x: svSprite.x,
                    y: svSprite.y - 60,
                };
            }
        }
        else {
            return {
                x: this.x,
                y: this.y - this.height * 0.8,
            };
        }
    };
    const _Sprite_Enemy_updateBitmap = Sprite_Enemy.prototype.updateBitmap;
    Sprite_Enemy.prototype.updateBitmap = function () {
        if (this._isSvActorEnemy) {
            // SVアクター用のビットマップ更新
            if (this._svActorSprite) {
                this._svActorSprite.refreshBitmap();
            }
            return;
        }
        _Sprite_Enemy_updateBitmap.call(this);
    };
    const _Sprite_Enemy_updateFrame = Sprite_Enemy.prototype.updateFrame;
    Sprite_Enemy.prototype.updateFrame = function () {
        if (this._isSvActorEnemy) {
            return; // SVアクター用は子スプライトで処理
        }
        _Sprite_Enemy_updateFrame.call(this);
    };
    const _Sprite_Enemy_stepForward = Sprite_Enemy.prototype.stepForward;
    Sprite_Enemy.prototype.stepForward = function () {
        // SVアクター敵の場合の処理
        if (this._isSvActorEnemy) {
            const action = BattleManager._action;
            if (BattleManager._phase == 'action' && action) {
                // DynamicMotion使用時は前進制御
                if (dMotionParams && pSetStepForward) {
                    // 1:常に無
                    if (pSetStepForward == 1) {
                        return;
                        // 2:モーション指定時のみ無
                    }
                    else if (pSetStepForward == 2 &&
                        action.isDynamicMotion &&
                        action.isDynamicMotion()) {
                        return;
                    }
                }
                // NoStepの設定があれば前進しない
                if (action.existDynamicSetting &&
                    action.existDynamicSetting('NoStep')) {
                    return;
                }
            }
            // SVアクタースプライトの位置を調整
            if (this._svActorSprite) {
                this._svActorSprite.x += 48; // 前進距離を調整
            }
            return;
        }
        // 通常の敵の場合
        _Sprite_Enemy_stepForward.apply(this, arguments);
    };
    const _Sprite_Enemy_destroy = Sprite_Enemy.prototype.destroy;
    Sprite_Enemy.prototype.destroy = function () {
        // 位置同期を停止
        this._positionSyncEnabled = false;
        // 位置同期インターバルをクリア
        if (this._positionUpdateInterval) {
            clearInterval(this._positionUpdateInterval);
            this._positionUpdateInterval = null;
        }
        // SVアクタースプライトも削除
        if (this._svActorSprite && this._svActorSprite.parent) {
            this._svActorSprite.parent.removeChild(this._svActorSprite);
            this._svActorSprite.destroy();
            this._svActorSprite = null;
        }
        _Sprite_Enemy_destroy.call(this);
    };
    const _Sprite_Enemy_setupDamagePopup = Sprite_Enemy.prototype.setupDamagePopup;
    Sprite_Enemy.prototype.setupDamagePopup = function () {
        if (this._isSvActorEnemy &&
            this._svActorSprite &&
            this._battler.isDamagePopupRequested()) {
            this._svActorSprite.forceMotion('damage');
            // 12フレーム後に戻す
            setTimeout(() => {
                if (this._svActorSprite) {
                    this._svActorSprite.refreshMotion();
                }
            }, 800);
        }
        _Sprite_Enemy_setupDamagePopup.call(this);
    };
    Sprite_Enemy.prototype.updateStateIconPosition = function () {
        if (this._isSvActorEnemy &&
            this._svActorSprite &&
            this._stateIconSprite) {
            const position = this.getStateIconPosition();
            this._stateIconSprite.x = position.x;
            this._stateIconSprite.y = position.y;
        }
    };
    Sprite_Enemy.prototype.getBattlerOverlayHeight = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // SVアクタースプライトの高さを返す
            return this._svActorSprite.height * 0.8;
        }
        else {
            return this.bitmap ? Math.floor(this.bitmap.height * 0.9) : 0;
        }
    };
    Sprite_Enemy.prototype.setPosition = function (x, y) {
        this.x = x;
        this.y = y;
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.x = x;
            this._svActorSprite.y = y;
        }
        if (this._battler) {
            this._battler._screenX = x;
            this._battler._screenY = y;
        }
    };
    Sprite_Enemy.prototype.move = function (x, y) {
        this.setPosition(this.x + x, this.y + y);
    };
    Object.defineProperty(Sprite_Enemy.prototype, '_motionCount', {
        get: function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                return this._svActorSprite._motionCount;
            }
            return this.__motionCount || 0;
        },
        set: function (value) {
            if (this._isSvActorEnemy && this._svActorSprite) {
                this._svActorSprite._motionCount = value;
            }
            else {
                this.__motionCount = value;
            }
        },
    });
    Object.defineProperty(Sprite_Enemy.prototype, '_pattern', {
        get: function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                return this._svActorSprite._pattern;
            }
            return this.__pattern || 0;
        },
        set: function (value) {
            if (this._isSvActorEnemy && this._svActorSprite) {
                this._svActorSprite._pattern = value;
            }
            else {
                this.__pattern = value;
            }
        },
    });
    Object.defineProperty(Sprite_Enemy.prototype, 'width', {
        get: function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                const size = this.getSvActorSpriteSize();
                return size ? size.width : 64;
            }
            return this.bitmap ? this.bitmap.width : 0;
        },
        set: function (value) {
            if (this._isSvActorEnemy && this._svActorSprite) {
                this._svActorSprite.width = value;
            }
            else {
                this.__width = value;
            }
        },
    });
    Object.defineProperty(Sprite_Enemy.prototype, 'height', {
        get: function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                const size = this.getSvActorSpriteSize();
                return size ? size.height : 64;
            }
            return this.bitmap ? this.bitmap.height : 0;
        },
        set: function (value) {
            if (this._isSvActorEnemy && this._svActorSprite) {
                this._svActorSprite.height = value;
            }
            else {
                this.__height = value;
            }
        },
    });
    // --------------------------------------------------------------------------
    // Sprite_SvActor（独自）- 重複削除と修正
    function Sprite_SvActor() {
        this.initialize(...arguments);
    }
    // 連携用
    Sprite_SvActor.prototype = Object.create(Sprite.prototype);
    Sprite_SvActor.prototype.constructor = Sprite_SvActor;
    Sprite_SvActor.prototype.initialize = function () {
        Sprite.prototype.initialize.call(this);
        this._battler = null;
        this._motion = null;
        this._motionCount = 0;
        this._pattern = 0;
        this.createMainSprite();
        this.createShadowSprite();
        this.createWeaponSprite();
        this.createStateSprite();
    };
    Sprite_SvActor.prototype.setup = function (battler) {
        this._battler = battler;
        this._setupComplete = true;
        // ビットマップを先に読み込み
        this.refreshBitmap();
        // 初期化
        this._motion = null;
        this._motionCount = 0;
        this._pattern = 0;
        // ビットマップが読み込まれてから初期モーションを設定
        const bitmap = this._mainSprite.bitmap;
        if (bitmap && bitmap.isReady()) {
            this.setupInitialMotion();
        }
        else if (bitmap) {
            bitmap.addLoadListener(() => {
                this.setupInitialMotion();
            });
        }
        if (this._stateSprite && battler) {
            this._stateSprite.setup(battler);
        }
    };
    Sprite_SvActor.prototype.setupInitialMotion = function () {
        // モーション状態をリセット
        this._motion = null;
        this._motionCount = 0;
        this._pattern = 0;
        // BattleMotionMZ用のプロパティ初期化
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS;
        if (hasBattleMotionMZ) {
            this._animCount = 0;
            this.fpsMotion = 0;
            this.motionType = null;
            this.animLoop = true;
            this.remake = true;
            this.speed = 12;
            this.nextMotionNo = -1;
            this.offsetX = 0;
            this.offsetY = 0;
            this.absStop = false;
        }
        // 初期モーションをwalk（待機）に設定
        this.startMotion('walk');
        // モーションリフレッシュフラグをリセット
        if (this._battler) {
            this._battler._motionRefresh = false;
            this._battler._motionType = null;
        }
    };
    Sprite_SvActor.prototype.getMotionFrameCount = function () {
        const bitmap = this._mainSprite.bitmap;
        if (!bitmap || !bitmap.isReady())
            return 3; // デフォルト値
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.MOTIONS &&
            this.oneMotionFps;
        if (hasBattleMotionMZ) {
            try {
                return this.oneMotionFps(this._mainSprite) || 3;
            }
            catch (e) {
                // フォールバック計算
                const cellSize = bitmap.height / 6;
                const totalMotions = Object.keys(Sprite_Battler.MOTIONS).length;
                const totalFrames = bitmap.width / cellSize;
                return totalFrames / (totalMotions / 6);
            }
        }
        return 3; // 標準のSVアクター
    };
    Sprite_SvActor.prototype.createMainSprite = function () {
        this._mainSprite = new Sprite();
        this._mainSprite.anchor.x = 0.5;
        this._mainSprite.anchor.y = 1;
        this.addChild(this._mainSprite);
    };
    Sprite_SvActor.prototype.createShadowSprite = function () {
        this._shadowSprite = new Sprite();
        this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow2');
        this._shadowSprite.anchor.x = 0.5;
        this._shadowSprite.anchor.y = 0.5;
        this._shadowSprite.y = -2;
        this._shadowSprite.opacity = 160;
        this.addChild(this._shadowSprite);
    };
    Sprite_SvActor.prototype.createWeaponSprite = function () {
        this._weaponSprite = new Sprite_Weapon();
        this.addChild(this._weaponSprite);
    };
    Sprite_SvActor.prototype.createStateSprite = function () {
        this._stateSprite = new Sprite_StateOverlay();
        this.addChild(this._stateSprite);
    };
    // メインのモーション制御
    Sprite_SvActor.prototype.startMotion = function (motionType) {
        // 戦闘不能時はDynamicMotionがある場合のみreturn
        if (this._battler && this._battler.isDead() && hasDynamicMotion) {
            return;
        }
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.MOTIONS &&
            typeof Sprite_Battler.prototype.startMotion === 'function';
        if (hasBattleMotionMZ) {
            motionType = this.remakeDeadMotion(motionType);
            const newMotion = Sprite_Battler.MOTIONS[motionType];
            if (newMotion) {
                this._motion = {
                    index: newMotion.index,
                    loop: newMotion.loop,
                    speed: newMotion.speed || 12,
                };
                this._motionCount = 0;
                this._pattern = 0;
                // BattleMotionMZ特有のプロパティ
                this._animCount = 0;
                this.fpsMotion = 0;
                this.motionType = motionType;
                this.animLoop = newMotion.loop;
                this.remake = true;
                this.speed = newMotion.speed || 12;
                this.nextMotionNo = -1;
                this.offsetX = 0;
                this.offsetY = 0;
            }
            else {
                this.startMotion('walk');
            }
        }
        else {
            // 標準のモーション処理...
            let newMotion = null;
            if (typeof Sprite_Actor !== 'undefined' && Sprite_Actor.MOTIONS) {
                newMotion = Sprite_Actor.MOTIONS[motionType];
            }
            if (newMotion) {
                this._motion = {
                    index: newMotion.index,
                    loop: newMotion.loop,
                    speed: newMotion.speed || 12,
                };
                this._motionCount = 0;
                this._pattern = 0;
            }
            else {
                const standardMotions = {
                    walk: { index: 0, loop: true },
                    wait: { index: 1, loop: true },
                    chant: { index: 2, loop: true },
                    guard: { index: 3, loop: true },
                    damage: { index: 4, loop: false },
                    evade: { index: 5, loop: false },
                    thrust: { index: 6, loop: false },
                    swing: { index: 7, loop: false },
                    missile: { index: 8, loop: false },
                    skill: { index: 9, loop: false },
                    spell: { index: 10, loop: false },
                    item: { index: 11, loop: false },
                    escape: { index: 12, loop: true },
                    victory: { index: 13, loop: true },
                    dying: { index: 14, loop: true },
                    abnormal: { index: 15, loop: true },
                    sleep: { index: 16, loop: true },
                    dead: { index: 17, loop: true },
                };
                const standardMotion = standardMotions[motionType] || standardMotions['walk'];
                this._motion = {
                    index: standardMotion.index,
                    loop: standardMotion.loop,
                };
                this._motionCount = 0;
                this._pattern = 0;
            }
        }
    };
    Sprite_SvActor.prototype.isMotionRequested = function () {
        return this._battler && this._battler._motionType;
    };
    Sprite_SvActor.prototype.motionType = function () {
        return this._motion ? this.motionType : 'walk';
    };
    Sprite_SvActor.prototype.forceMotion = function (motionType) {
        // 現在のモーションを強制的にリセット
        this._motion = null;
        this._motionCount = 0;
        this._pattern = 0;
        // 新しいモーションを開始
        this.startMotion(motionType);
    };
    // BattleMotionMZ用のモーション初期化
    Sprite_SvActor.prototype.setupMotionForBattleMotionMZ = function () {
        if (!this._motion) {
            this._motion = { index: 0, loop: true };
        }
    };
    // BattleMotionMZ用のメソッドを条件付きで適用
    Sprite_SvActor.prototype.setupValue = function (motionType) {
        // 型安全なモーション定義
        const motions = (typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS) ||
            (typeof Sprite_Actor !== 'undefined' && Sprite_Actor.MOTIONS) ||
            {};
        // 安全なアクセスを確保
        const motion = motions[motionType] ||
            motions['walk'] || {
            index: 0,
            loop: true,
            speed: 12,
        };
        // モーションが未初期化の場合の対応
        if (!this._motion) {
            this._motion = { index: 0, loop: true };
        }
        this._motion.index = motion.index;
        this._motion.loop = motion.loop;
        this._motionCount = 0;
        this._pattern = 0;
        // BattleMotionMZ特有のプロパティ（BattleMotionMZがある場合のみ）
        if (typeof Sprite_Battler !== 'undefined') {
            this._animCount = 0;
            this.fpsMotion = 0;
            this.motionType = motionType;
            this.animLoop = true;
            this.remake = true;
            this.speed = motions[motionType].speed;
            this.nextMotionNo = -1;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    };
    Sprite_SvActor.prototype.remakeDeadMotion = function (motionType) {
        if (motionType === 'dead') {
            var note = $dataStates[1].note;
            var xx = note.match(/<motionSP(\w+)>/);
            if (xx) {
                motionType = 'motionSP' + RegExp.$1;
            }
        }
        else {
            var x2 = motionType.match(/motionsp(\w+)/);
            if (x2) {
                motionType = 'motionSP' + RegExp.$1;
            }
        }
        return motionType;
    };
    Sprite_SvActor.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (!this._battler)
            return;
        this.updateBitmap();
        this.updateFrame();
        this.updateMotion();
        this.updateStateSprite();
        // refreshMotionを明示的に呼び出し
        if (this._battler._motionRefresh) {
            this._battler._motionRefresh = false;
            this.refreshMotion();
        }
    };
    Sprite_SvActor.prototype.updateBitmap = function () {
        if (!this._battler)
            return;
        const fileName = this._battler.battlerName();
        if (fileName) {
            const newBitmap = ImageManager.loadSvActor(fileName);
            if (this._mainSprite.bitmap !== newBitmap) {
                this._mainSprite.bitmap = newBitmap;
            }
        }
    };
    Sprite_SvActor.prototype.updateFrame = function () {
        const bitmap = this._mainSprite.bitmap;
        if (!bitmap || !bitmap.isReady())
            return;
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            this.cs &&
            typeof this.cs === 'function' &&
            this.getRemake &&
            typeof this.getRemake === 'function';
        if (hasBattleMotionMZ) {
            try {
                // BattleMotionMZ処理
                if (this.getRemake() === true) {
                    this.addMotionData && this.addMotionData(this._mainSprite);
                    this.setMotionFps && this.setMotionFps(this._mainSprite);
                    this.setMotionArray && this.setMotionArray();
                    this.setRemake && this.setRemake(false);
                }
                const cellSize = this.cs(this._mainSprite);
                let cx = 0, cy = 0;
                if (this.cx && this.cy) {
                    cx = this.cx();
                    cy = this.cy();
                }
                else {
                    // フォールバック計算
                    const motionIndex = this._motion ? this._motion.index : 0;
                    const pattern = this._pattern || 0;
                    const totalMotions = Object.keys(Sprite_Battler.MOTIONS).length;
                    const totalFrames = bitmap.width / cellSize;
                    const maxFramesPerMotion = totalFrames / (totalMotions / 6);
                    cx =
                        Math.floor(motionIndex / 6) * maxFramesPerMotion +
                            pattern;
                    cy = motionIndex % 6;
                }
                // 範囲チェック
                const maxCx = Math.floor(bitmap.width / cellSize);
                if (cx >= maxCx || cy >= 6 || cx < 0 || cy < 0) {
                    console.warn(`BattleMotionMZ frame out of bounds: cx=${cx}, cy=${cy}`);
                    cx = 0;
                    cy = 0;
                }
                this._mainSprite.setFrame(cx * cellSize, cy * cellSize, cellSize, cellSize);
            }
            catch (e) {
                console.warn('BattleMotionMZ updateFrame failed, using default:', e);
                this.updateFrameDefault(bitmap);
            }
        }
        else {
            this.updateFrameDefault(bitmap);
        }
    };
    Sprite_SvActor.prototype.updateMotion = function () {
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            this.updateMotionCount &&
            typeof Sprite_Battler.prototype.updateMotionCount === 'function';
        if (hasBattleMotionMZ && this.remake) {
            try {
                // BattleMotionMZの処理
                this.updateMotionCount();
            }
            catch (e) {
                console.log('BattleMotionMZ updateMotion failed, using default:', e);
                this.updateMotionDefault();
            }
        }
        else {
            this.updateMotionDefault();
        }
    };
    // デフォルトのモーション更新処理を分離
    Sprite_SvActor.prototype.updateMotionDefault = function () {
        if (this._motion) {
            this._motionCount++;
            // motionSpeedメソッドを安全に呼び出し
            let speed = 12; // デフォルト値
            try {
                speed = this.motionSpeed();
            }
            catch (e) {
                console.warn('motionSpeed call failed, using default speed');
            }
            if (this._motionCount >= speed) {
                if (this._motion.loop) {
                    // ループ処理の修正
                    if (this._patternDirection === undefined) {
                        this._patternDirection = 1;
                    }
                    if (this._pattern === 0) {
                        this._pattern = 1;
                        this._patternDirection = 1;
                    }
                    else if (this._pattern === 1) {
                        this._pattern = this._patternDirection === 1 ? 2 : 0;
                    }
                    else if (this._pattern === 2) {
                        this._pattern = 1;
                        this._patternDirection = -1;
                    }
                }
                else {
                    this._pattern < 2 ? this._pattern++ : (this._pattern = 2);
                }
                this._motionCount = 0;
            }
        }
    };
    Sprite_SvActor.prototype.updateFrameDefault = function (bitmap) {
        if (!this._motion) {
            this.startMotion('walk');
            return;
        }
        // BattleMotionMZが利用可能かチェック
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.MOTIONS &&
            this.cs;
        if (hasBattleMotionMZ) {
            // BattleMotionMZのフレーム計算を使用
            const cellSize = bitmap.height / 6; // 1セルのサイズ
            const motionIndex = this._motion.index;
            const pattern = this._pattern;
            // BattleMotionMZのcx, cyメソッドがある場合はそれを使用
            let cx, cy;
            try {
                cx = this.cx ? this.cx() : 0;
                cy = this.cy ? this.cy() : 0;
            }
            catch (e) {
                // フォールバック：手動計算
                const totalMotions = Object.keys(Sprite_Battler.MOTIONS).length;
                const totalFrames = bitmap.width / cellSize;
                const maxFramesPerMotion = totalFrames / (totalMotions / 6);
                cx = Math.floor(motionIndex / 6) * maxFramesPerMotion + pattern;
                cy = motionIndex % 6;
            }
            // 範囲チェック
            const maxCx = Math.floor(bitmap.width / cellSize);
            const maxCy = 6;
            if (cx >= maxCx || cy >= maxCy || cx < 0 || cy < 0) {
                console.warn(`Frame out of bounds: cx=${cx}, cy=${cy}, maxCx=${maxCx}, maxCy=${maxCy}`);
                // フォールバック：最初のフレーム
                cx = 0;
                cy = 0;
            }
            this._mainSprite.setFrame(cx * cellSize, cy * cellSize, cellSize, cellSize);
        }
        else {
            // 標準のSVアクター処理（9x6）
            const cw = bitmap.width / 9;
            const ch = bitmap.height / 6;
            const motionIndex = this._motion.index;
            const pattern = this._pattern;
            const motionsPerColumn = 6;
            const patternsPerMotion = 3;
            const column = Math.floor(motionIndex / motionsPerColumn);
            const row = motionIndex % motionsPerColumn;
            const col = column * patternsPerMotion + pattern;
            // 範囲チェック
            if (col >= 9 || row >= 6) {
                console.warn('Frame out of bounds, using fallback');
                this._mainSprite.setFrame(0, 0, cw, ch);
                return;
            }
            this._mainSprite.setFrame(col * cw, row * ch, cw, ch);
        }
    };
    // motionSpeedメソッドの修正
    Sprite_SvActor.prototype.motionSpeed = function () {
        // BattleMotionMZのmotionSpeedを優先
        if (typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.prototype.motionSpeed) {
            try {
                return Sprite_Battler.prototype.motionSpeed.call(this);
            }
            catch (e) {
                console.warn('BattleMotionMZ motionSpeed call failed, using fallback');
            }
        }
        // 標準処理
        if (this._motion && typeof this._motion.speed === 'number') {
            return this._motion.speed;
        }
        return 12; // デフォルト値
    };
    Sprite_SvActor.prototype.updateStateSprite = function () {
        if (this._stateSprite && this._battler) {
            this._stateSprite.setup(this._battler);
        }
    };
    Sprite_SvActor.prototype.refreshBitmap = function () {
        if (this._battler) {
            const fileName = this._battler.battlerName();
            if (fileName) {
                this._mainSprite.bitmap = ImageManager.loadSvActor(fileName);
            }
        }
    };
    Sprite_SvActor.prototype.refreshMotion = function () {
        if (!this._battler)
            return;
        // ダメージポップアップ中のチェック（追加の安全策）
        if (this._battler.isDamagePopupRequested &&
            this._battler.isDamagePopupRequested()) {
            // ダメージモーションが進行中の場合はスキップ
            if (this._motion && !this._motion.loop && this._motionCount < 36) {
                // 3フレーム×12速度
                return;
            }
        }
        // ステート確認
        if (this._battler.states &&
            typeof this._battler.states === 'function') {
            const states = this._battler.states();
            for (let i = 0; i < states.length; i++) {
                const state = states[i];
                if (state && state.meta) {
                    const enemyMotion = state.meta['EnemyMotion'];
                    if (typeof enemyMotion === 'string' &&
                        enemyMotion.trim().length > 0) {
                        this.forceMotion(enemyMotion);
                        return;
                    }
                }
            }
        }
        // 要求されたモーション確認
        if (this._battler._motionType) {
            const requestedMotion = this._battler._motionType;
            this._battler._motionType = null;
            this.startMotion(requestedMotion);
            return;
        }
        this.startMotion('walk');
    };
    Sprite_SvActor.prototype.setDynamicMotionActive = function (active) {
        this._dynamicMotionActive = active;
    };
    // モーションインデックス取得のヘルパー関数
    Sprite_SvActor.prototype.getMotionIndex = function (motionType) {
        const motions = (typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS) ||
            (typeof Sprite_Actor !== 'undefined' && Sprite_Actor.MOTIONS) ||
            {};
        // 安全なアクセス
        return motions[motionType]?.index ?? 0;
    };
    // BattleMotionMZメソッドの条件付き移植
    if (typeof Sprite_Battler !== 'undefined') {
        const methodsToMigrate = [
            'getRemake',
            'setRemake',
            'oneMotionFps',
            'addMotionData',
            'setMotionFps',
            'setMotionArray',
            'cs',
            'cx',
            'cy',
            'motionIndex',
        ];
        methodsToMigrate.forEach((methodName) => {
            if (Sprite_Battler.prototype[methodName]) {
                Sprite_SvActor.prototype[methodName] =
                    Sprite_Battler.prototype[methodName];
            }
        });
        // updateMotionCountは条件付きで移植
        if (Sprite_Battler.prototype.updateMotionCount) {
            Sprite_SvActor.prototype.updateMotionCount =
                Sprite_Battler.prototype.updateMotionCount;
        }
    }
    // getSplit関数のグローバル定義（NUUN_ButlerHPGaugeで使用）
    if (typeof window.getSplit === 'undefined') {
        window.getSplit = function (tag) {
            return tag ? tag.split(',') : null;
        };
    }
    // NUUN_ButlerHPGaugeとの互換性確保のため、必要なメソッドを追加
    if (typeof Game_Enemy.prototype.getHPGaugePositionX === 'undefined') {
        Game_Enemy.prototype.getHPGaugePositionX = function () {
            return 0;
        };
    }
    if (typeof Game_Enemy.prototype.getHPGaugePositionY === 'undefined') {
        Game_Enemy.prototype.getHPGaugePositionY = function () {
            return 0;
        };
    }
    // getBattlerOverlayHeightをSVアクター敵用に拡張（元の処理は保持）
    if (typeof Sprite_Enemy.prototype.getBattlerOverlayHeight !== 'undefined') {
        const _Sprite_Enemy_getBattlerOverlayHeight = Sprite_Enemy.prototype.getBattlerOverlayHeight;
        Sprite_Enemy.prototype.getBattlerOverlayHeight = function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                const svSprite = this._svActorSprite;
                const mainSprite = svSprite._mainSprite;
                if (mainSprite &&
                    mainSprite.bitmap &&
                    mainSprite.bitmap.isReady()) {
                    // SVアクタースプライトの1フレーム分の高さを返す
                    const frameHeight = mainSprite.bitmap.height / 6;
                    return Math.floor(frameHeight * 0.9);
                }
                else {
                    // ビットマップが読み込まれていない場合のフォールバック
                    return 64; // 標準的なSVアクターの高さ
                }
            }
            // 通常の敵の場合は元の処理
            return _Sprite_Enemy_getBattlerOverlayHeight.call(this);
        };
    }
    if (typeof Sprite_Enemy.prototype.getBattlerStatePosition !== 'undefined') {
        const _Sprite_Enemy_getBattlerStatePosition = Sprite_Enemy.prototype.getBattlerStatePosition;
        Sprite_Enemy.prototype.getBattlerStatePosition = function () {
            if (this._isSvActorEnemy && this._svActorSprite) {
                const svSprite = this._svActorSprite;
                const mainSprite = svSprite._mainSprite;
                if (mainSprite &&
                    mainSprite.bitmap &&
                    mainSprite.bitmap.isReady()) {
                    const frameHeight = mainSprite.bitmap.height / 6;
                    const scale = this.getBattlerOverlayConflict
                        ? this.getBattlerOverlayConflict()
                        : 1;
                    const enemyStatePosition = typeof EnemyStatePosition !== 'undefined'
                        ? EnemyStatePosition
                        : 0;
                    if (enemyStatePosition === 0) {
                        // 敵画像の上 - SVアクターの場合は頭上に表示
                        return frameHeight * scale - 40; // 頭上に調整
                    }
                    else if (enemyStatePosition === 2) {
                        // 敵画像の中心
                        return Math.floor((frameHeight * scale) / 2);
                    }
                    else {
                        // 敵画像の下
                        return 0;
                    }
                }
                else {
                    // ビットマップが読み込まれていない場合のフォールバック
                    const enemyStatePosition = typeof EnemyStatePosition !== 'undefined'
                        ? EnemyStatePosition
                        : 0;
                    if (enemyStatePosition === 0) {
                        return 80; // 頭上
                    }
                    else if (enemyStatePosition === 2) {
                        return 40; // 中心
                    }
                    else {
                        return 0; // 下
                    }
                }
            }
            // 通常の敵の場合は元の処理
            return _Sprite_Enemy_getBattlerStatePosition.call(this);
        };
    }
    if (typeof Sprite_Enemy.prototype.updateStateSpriteEx !== 'undefined') {
        const _Sprite_Enemy_updateStateSpriteEx = Sprite_Enemy.prototype.updateStateSpriteEx;
        Sprite_Enemy.prototype.updateStateSpriteEx = function () {
            if (this._isSvActorEnemy) {
                // SVアクター敵の場合、NUUN_EnemyStateIconEXの処理を実行させるが
                // 位置計算は上記のgetBattlerStatePositionを使用する
                _Sprite_Enemy_updateStateSpriteEx.call(this);
                return;
            }
            // 通常の敵の場合は元の処理
            _Sprite_Enemy_updateStateSpriteEx.call(this);
        };
    }
    if (typeof Sprite_Enemy.prototype.battlerOverlayVisible !== 'undefined') {
        const _Sprite_Enemy_battlerOverlayVisible = Sprite_Enemy.prototype.battlerOverlayVisible;
        Sprite_Enemy.prototype.battlerOverlayVisible = function () {
            if (this._isSvActorEnemy) {
                // SVアクター敵の場合、battlerOverlayの可視性を制御
                if (this.battlerOverlay) {
                    this.battlerOverlay.visible =
                        this._battler && this._battler.isAppeared();
                }
                return;
            }
            if (_Sprite_Enemy_battlerOverlayVisible) {
                _Sprite_Enemy_battlerOverlayVisible.call(this);
            }
        };
    }
    if (typeof Sprite_Enemy.prototype.battlerOverlayOpacity !== 'undefined') {
        const _Sprite_Enemy_battlerOverlayOpacity = Sprite_Enemy.prototype.battlerOverlayOpacity;
        Sprite_Enemy.prototype.battlerOverlayOpacity = function () {
            if (this._isSvActorEnemy) {
                // SVアクター敵の場合のオーバーレイ透明度制御
                if (this.battlerOverlay && this._battler) {
                    const opacity = this._battler.isAppeared() ? 255 : 0;
                    this.battlerOverlay.opacity = opacity;
                }
                return;
            }
            if (_Sprite_Enemy_battlerOverlayOpacity) {
                _Sprite_Enemy_battlerOverlayOpacity.call(this);
            }
        };
    }
})();
