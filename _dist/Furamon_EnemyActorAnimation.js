//------------------------------------------------------------------------------
// Furamon_EnemyActorAnimation.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/13 1.0.0 公開！
// 2025/06/14 1.0.1 DynamicMotionのNear型で敵のそばにちゃんと移動するよう修正
//                  モーション制御が不安定だったので見直し
// 2025/06/15 1.0.2 BattleMotionMZに実は対応してなかったのを直した
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
 * ステートのメモ欄に<EnemyMotion:xxx>を記述すると
 * そのステートの間指定したモーションをとります。
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
 * 後者はFuramon_EnemyActorDynamicMotionをこのプラグインの下に置いてください。
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
    const prmBattleMotion = PluginManager.parameters('BattleMotionMZ');
    const prmMotionCol = prmBattleMotion['motionCol'] === 'true';
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
            ? Number(nuunHpGaugeParams.HPPosition)
            : 0;
    }
    if (typeof window.Gauge_X === 'undefined') {
        window.Gauge_X = nuunHpGaugeParams.Gauge_X
            ? Number(nuunHpGaugeParams.Gauge_X)
            : 0;
    }
    if (typeof window.Gauge_Y === 'undefined') {
        window.Gauge_Y = nuunHpGaugeParams.Gauge_Y
            ? Number(nuunHpGaugeParams.Gauge_Y)
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
    function getStandardMotions() {
        return {
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
    }
    // --------------------------------------------------------------------------
    // Game_Enemy
    const _Game_Enemy_initialize = Game_Enemy.prototype.initialize;
    Game_Enemy.prototype.initialize = function (enemyId, x, y) {
        _Game_Enemy_initialize.call(this, enemyId, x, y);
        // SvActorEnemyで使用するプロパティを初期化
        this._damaged = false;
        this._damageMotionCount = 0;
    };
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
        if (isSvActorEnemy(this) &&
            !PluginManager._scripts.includes('Furamon_EnemyActorDynamicMotion')) {
            let motionName = 'walk';
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
    const _Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
    Game_Enemy.prototype.performDamage = function () {
        _Game_Enemy_performDamage.call(this);
        if (isSvActorEnemy(this)) {
            this._damaged = true; // ダメージ受けてるフラグ
            this._damageMotionCount = 18; // ダメージモーションを取るフレーム
            this.requestMotion('damage');
        }
    };
    const _Game_Enemy_performEvasion = Game_Enemy.prototype.performEvasion;
    Game_Enemy.prototype.performEvasion = function () {
        _Game_Enemy_performEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this._damaged = true; // 回避フラグ(ダメージと共用)
            // 回避モーションを取るフレーム(ダメージと共用)
            this._damageMotionCount = 18;
            this.requestMotion('evade');
        }
    };
    const _Game_Enemy_performMagicEvasion = Game_Enemy.prototype.performMagicEvasion;
    Game_Enemy.prototype.performMagicEvasion = function () {
        _Game_Enemy_performMagicEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this._damaged = true; // 回避フラグ(ダメージと共用)
            // 回避モーションを取るフレーム(ダメージと共用)
            this._damageMotionCount = 18;
            this.requestMotion('evade');
        }
    };
    Game_Enemy.prototype.requestMotion = function (motion) {
        this._motion = motion;
        this._motionRefresh = true; // 即座に更新フラグを立てる
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
            // SVアクター用の場合は1x1の透明ビットマップを設定
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
    };
    const _Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function (battler) {
        _Sprite_Enemy_setBattler.call(this, battler);
        this._isSvActorEnemy = isSvActorEnemy(this._battler);
        // SVアクター用の場合の処理
        if (this._isSvActorEnemy && this._battler) {
            this.hideOriginalSprite();
            this.createSvActorSprite();
        }
    };
    Sprite_Enemy.prototype.getSvActorSpriteSize = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            const mainSprite = this._svActorSprite._mainSprite;
            if (mainSprite &&
                mainSprite.bitmap &&
                mainSprite.bitmap.isReady()) {
                const bitmap = mainSprite.bitmap;
                if (prmBattleMotion) {
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
        // _motionがundefinedの場合はnullに変換
        if (this._battler._motion === undefined) {
            this._battler._motion = null;
        }
        this._svActorSprite = new Sprite_SvActor();
        this._svActorSprite.setup(this._battler);
        if (prmAutoMirror) {
            this._svActorSprite.scale.x = -1;
        }
        // 親の親（戦闘フィールド）にSVアクタースプライトを直接追加
        if (this.parent) {
            this.parent.addChild(this._svActorSprite);
            // 初期位置を設定
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
            // 敵の初期位置情報を保持
            this._originalX = this.x;
            this._originalY = this.y;
            // 位置同期処理フラグ
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
            // SVアクター用は子スプライトで処理するため、フレーム更新をスキップ
            // ただし、bitmapがnullの場合は1x1ビットマップを設定
            if (!this.bitmap) {
                this.bitmap = new Bitmap(1, 1);
                this.bitmap.clear();
            }
            return;
        }
        _Sprite_Enemy_updateFrame.call(this);
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
    };
    Sprite_Enemy.prototype.move = function (x, y) {
        this.setPosition(this.x + x, this.y + y);
    };
    Sprite_Enemy.prototype.getMotionDefinition = function (motionType) {
        // BattleMotionMZのモーション定義を優先
        if (typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS) {
            return Sprite_Battler.MOTIONS[motionType];
        }
        // 標準のSVアクターモーション定義
        const standardMotions = getStandardMotions();
        return standardMotions[motionType] || standardMotions['walk'];
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
            // bitmapがnullの場合は0を返す
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
            // bitmapがnullの場合は0を返す
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
        if (prmBattleMotion) {
            this._animCount = 0;
            this.fpsMotion = 0;
            this.motionType = null;
            this.animLoop = true;
            this.remake = true;
            this.speed = 12;
            this.nextMotionNo = -1;
            this.offsetX = 0;
            this.offsetY = 0;
        }
        // 初期モーションをwalk（待機）に設定
        this.startMotion('walk');
        // モーションリフレッシュフラグをリセット
        if (this._battler) {
            this._battler._motionRefresh = false;
            this._battler._motion = null;
        }
    };
    Sprite_SvActor.prototype.getMotionFrameCount = function () {
        const bitmap = this._mainSprite.bitmap;
        if (!bitmap || !bitmap.isReady())
            return 3;
        if (prmBattleMotion) {
            try {
                const cellSize = bitmap.height / 6;
                const motionIndex = this._motion ? this._motion.index : 0;
                const frameInfo = this.getMotionFrameInfo(bitmap, cellSize, motionIndex);
                return frameInfo.frameCount;
            }
            catch (e) {
                console.warn('Frame count calculation failed:', e);
                return 3;
            }
        }
        return 3;
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
    Sprite_SvActor.prototype.startMotion = function (motion) {
        // バトラーが死亡している場合は死亡モーション以外受け付けない
        if (this._battler && this._battler.isDead && this._battler.isDead()) {
            if (motion !== 'dead' && motion !== 'dying') {
                motion = 'dead';
            }
        }
        if (prmBattleMotion) {
            const newMotion = Sprite_Battler.MOTIONS[motion];
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
                this.motionType = motion;
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
            // 標準のモーション処理（共通関数を使用）
            const standardMotions = getStandardMotions();
            const standardMotion = standardMotions[motion] || standardMotions['walk'];
            this._motion = {
                index: standardMotion.index,
                loop: standardMotion.loop,
            };
            this._motionCount = 0;
            this._pattern = 0;
        }
        // パターン方向の初期化（ループアニメーション用）
        if (this._motion && this._motion.loop) {
            this._patternDirection = 1;
        }
    };
    Sprite_SvActor.prototype.isMotionRequested = function () {
        return this._battler && this._battler._motion;
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
    Sprite_SvActor.prototype.setupMotionBMMZ = function () {
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
    Sprite_SvActor.prototype.update = function () {
        if (!this._battler)
            return;
        this.updateBitmap();
        this.updateFrame();
        this.updateMotion();
        this.updateStateSprite();
        // damageMotionCountが0になったらモーションを再開する
        if (this._battler._damageMotionCount > 0) {
            this._battler._damageMotionCount -= 1;
        }
        else {
            this._battler._damaged = false;
        }
        // requestMotionで設定されたモーションを即座に反映
        if (this._battler._motion && !this._processingMotion) {
            this._processingMotion = true;
            const requestedMotion = this._battler._motion;
            this._battler._motion = null;
            this.startMotion(requestedMotion);
            this._processingMotion = false;
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
        if (prmBattleMotion) {
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
                // BattleMotionMZの処理を使わず、独自計算で実際のフレーム数を使用
                const motionIndex = this._motion ? this._motion.index : 0;
                const pattern = this._pattern || 0;
                // 実際のフレーム数を計算
                const totalFrames = bitmap.width / cellSize;
                const motionCount = Object.keys(Sprite_Battler.MOTIONS).length;
                const motionsPerRow = 6; // 縦に6モーション
                const totalColumns = motionCount / motionsPerRow; // 横の列数
                const actualFramesPerMotion = Math.floor(totalFrames / totalColumns);
                // 正しいcx, cy計算（BattleMotionMZの制限を無視）
                const motionColumn = Math.floor(motionIndex / motionsPerRow); // 何列目か
                const motionRow = motionIndex % motionsPerRow; // 何行目か
                cx = motionColumn * actualFramesPerMotion + pattern;
                cy = motionRow;
                console.log(`Custom calculation: motionIndex=${motionIndex}, pattern=${pattern}, actualFrames=${actualFramesPerMotion}, cx=${cx}, cy=${cy}`);
                // 範囲チェック
                const maxCx = Math.floor(bitmap.width / cellSize);
                if (cx >= maxCx || cy >= 6 || cx < 0 || cy < 0) {
                    console.warn(`Frame out of bounds: cx=${cx}, cy=${cy}, maxCx=${maxCx}, resetting to 0,0`);
                    cx = 0;
                    cy = 0;
                }
                console.log(`Final frame: x=${cx * cellSize}, y=${cy * cellSize}, size=${cellSize}`);
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
        // モーション更新要求があれば即座に処理
        if (this._battler._motionRefresh && !this._battler._damaged) {
            this._battler._motionRefresh = false;
            this.refreshMotion();
        }
        if (prmBattleMotion) {
            try {
                // BattleMotionMZの処理
                this.updateMotionBMMZ();
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
    // BattleMotionMZ用のモーション更新処理を新規作成
    Sprite_SvActor.prototype.updateMotionBMMZ = function () {
        this._motionCount++;
        let speed = 12;
        try {
            // blueFpsはこれで機能する
            speed = this.motionSpeed();
        }
        catch (e) {
            console.warn('motionSpeed call failed, using default speed');
        }
        if (this._motionCount >= speed) {
            const bitmap = this._mainSprite.bitmap;
            if (!bitmap || !bitmap.isReady())
                return;
            const cellSize = this.cs(this._mainSprite);
            const motionIndex = this._motion ? this._motion.index : 0;
            const frameInfo = this.getMotionFrameInfo(bitmap, cellSize, motionIndex);
            const frameCount = frameInfo.frameCount - 1;
            const animType = frameInfo.animType;
            console.log(`Motion update: frameCount=${frameCount}, animType=${animType}, currentPattern=${this._pattern}`);
            if (animType === 'freeze') {
                // R255のみ = 最後のコマで停止
                if (this._pattern < frameCount - 1) {
                    this._pattern++;
                }
                else {
                    this._pattern = frameCount - 1;
                }
            }
            else if (animType === 'pingpong') {
                // R255G255 = ping-pong（往復ループ）
                if (this._patternDirection === undefined) {
                    this._patternDirection = 1;
                }
                if (this._pattern <= 0) {
                    this._pattern = 1;
                    this._patternDirection = 1;
                }
                else if (this._pattern >= frameCount - 1) {
                    this._pattern = frameCount - 2;
                    this._patternDirection = -1;
                }
                else {
                    this._pattern += this._patternDirection;
                }
            }
            else if (animType === 'loop') {
                // G255のみ = 一方通行ループ (0->1->2->0->...)
                this._pattern = (this._pattern + 1) % (frameCount);
            }
            else {
                // 通常処理（animType === 'normal' または BattleMotionMZの標準動作）
                if (this._motion && this._motion.loop) {
                    this._pattern = (this._pattern + 1) % frameCount;
                }
                else {
                    if (this._pattern < frameCount) {
                        this._pattern++;
                    }
                    else {
                        this._pattern = frameCount;
                    }
                }
            }
            console.log(`Pattern updated to: ${this._pattern}, direction: ${this._patternDirection}`);
            this._motionCount = 0;
        }
    };
    Sprite_SvActor.prototype.getMotionFrameInfo = function (bitmap, cellSize, motionIndex) {
        const totalFrames = bitmap.width / cellSize;
        const motionCount = Object.keys(Sprite_Battler.MOTIONS).length;
        const motionsPerRow = 6;
        const totalColumns = motionCount / motionsPerRow;
        const maxFramesPerMotion = Math.floor(totalFrames / totalColumns);
        if (!prmMotionCol) {
            // motionColが無効な場合は通常の処理
            return { frameCount: maxFramesPerMotion, animType: 'normal' };
        }
        // 色制御による実際のフレーム数とアニメーションタイプを取得
        const motionColumn = Math.floor(motionIndex / motionsPerRow);
        const motionRow = motionIndex % motionsPerRow;
        // このモーションの開始位置
        const motionStartX = motionColumn * maxFramesPerMotion * cellSize;
        const motionStartY = motionRow * cellSize;
        // 終端カラーコマを探す（maxFramesPerMotionの倍数個目）
        let endFrameIndex = maxFramesPerMotion - 1; // デフォルトは最後のフレーム
        for (let i = 1; i <= maxFramesPerMotion; i++) {
            const frameX = motionStartX + (i - 1) * cellSize;
            if (this.isEndFrame(bitmap, frameX, motionStartY, cellSize, maxFramesPerMotion, i)) {
                endFrameIndex = i - 1;
                break;
            }
        }
        // 終端フレームの色情報を取得
        const endFrameX = motionStartX + endFrameIndex * cellSize;
        const colorInfo = this.getEndFrameColorInfo(bitmap, endFrameX, motionStartY, cellSize);
        return {
            frameCount: endFrameIndex + 1, // 実際のフレーム数
            animType: colorInfo.animType,
        };
    };
    // 終端フレームかどうかを判定
    Sprite_SvActor.prototype.isEndFrame = function (bitmap, frameX, frameY, cellSize, maxFramesPerMotion, currentFrame) {
        try {
            // maxFramesPerMotionの倍数個目かチェック
            if (currentFrame % maxFramesPerMotion !== 0 &&
                currentFrame !== maxFramesPerMotion) {
                return false;
            }
            // フレームの左上から右1下1の色を取得
            const checkX = frameX + 1;
            const checkY = frameY + 1;
            const canvas = bitmap.canvas || bitmap._canvas;
            if (!canvas)
                return false;
            const context = canvas.getContext('2d');
            const imageData = context.getImageData(checkX, checkY, 1, 1);
            const [r, g, b, a] = imageData.data;
            // 透明でなく、かつ黒でない場合は終端フレーム
            if (a > 128 && !(r === 0 && g === 0 && b === 0)) {
                return true;
            }
            return false;
        }
        catch (e) {
            console.warn('isEndFrame check failed:', e);
            return false;
        }
    };
    // 終端フレームの色情報を解析
    Sprite_SvActor.prototype.getEndFrameColorInfo = function (bitmap, x, y, cellSize) {
        try {
            // キャンバスコンテキストを取得
            const canvas = bitmap.canvas || bitmap._canvas;
            if (!canvas) {
                return { animType: 'normal' };
            }
            const context = canvas.getContext('2d');
            // 終端フレームの左上から右1下1の色を取得
            const sampleX = x + 1;
            const sampleY = y + 1;
            const imageData = context.getImageData(sampleX, sampleY, 1, 1);
            const [r, g, b, a] = imageData.data;
            console.log(`End frame color check at (${sampleX}, ${sampleY}): R${r} G${g} B${b} A${a}`);
            // 透明でない場合のみ色制御を適用
            if (a > 128) {
                // 半透明以上
                if (r === 255 && g === 255 && b < 255) {
                    // R255G255 = ping-pong（往復ループ）
                    return { animType: 'pingpong' };
                }
                else if (r === 255 && g < 255 && b < 255) {
                    // R255のみ = 最後のコマで停止（一方通行）
                    return { animType: 'freeze' };
                }
                else if (r < 255 && g === 255 && b < 255) {
                    // G255のみ = 一方通行ループ
                    return { animType: 'loop' };
                }
            }
            // その他 = 通常処理
            return { animType: 'normal' };
        }
        catch (e) {
            console.warn('Color detection failed:', e);
            return { animType: 'normal' };
        }
    };
    // デフォルトのモーション更新処理（標準SV用）
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
                    // ループ処理の修正（標準SV: 3コマ）
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
                    // 非ループ処理 - 最後のコマ（2）で止まる
                    if (this._pattern < 2) {
                        this._pattern++;
                    }
                    else {
                        this._pattern = 2; // 最後のコマで維持
                    }
                }
                this._motionCount = 0;
            }
        }
        else {
            if (this._battler._motionRefresh && !this._battler._damaged) {
                this._battler._motionRefresh = false;
                this.refreshMotion();
            }
        }
    };
    Sprite_SvActor.prototype.updateFrameDefault = function (bitmap) {
        // 標準のSVアクター処理（9x6）のみ
        const cw = bitmap.width / 9;
        const ch = bitmap.height / 6;
        // 敵が死んでるならフォールバック
        if (this._battler && this._battler.isDead()) {
            this._mainSprite.setFrame(0, 0, cw, ch);
            return;
        }
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
        // HP0なら死亡処理
        if (this._battler.hp <= 0) {
            this.startMotion('damage');
            return;
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
        if (this._battler._motion) {
            const requestedMotion = this._battler._motion;
            this._battler._motion = null;
            this.startMotion(requestedMotion);
            return;
        }
        // デフォルトのモーション
        this.startMotion('walk');
    };
    // モーションインデックス取得のヘルパー関数
    Sprite_SvActor.prototype.getMotionIndex = function (motionType) {
        const motions = (typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS) ||
            (typeof Sprite_Actor !== 'undefined' && Sprite_Actor.MOTIONS) ||
            {};
        // 安全なアクセス
        return motions[motionType]?.index ?? 0;
    };
    // BattleMotionMZ用のメソッドを条件付きで移植
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
})();
