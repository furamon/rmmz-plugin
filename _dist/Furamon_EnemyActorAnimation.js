//------------------------------------------------------------------------------
// Furamon_EnemyActorAnimation.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/13 1.0.0 公開！
// 2025/06/14 1.0.1 DynamicMotionのNear型で敵のそばにちゃんと移動するよう修正
//                  モーション制御が不安定だったので見直し
// 2025/06/16 1.0.2 BattleMotionMZに実は対応してなかったのを直した
// 2025/06/17 1.1.0 BattleMotionMZ関連を分離した
// 2025/06/19 1.2.0 BattleMotionMZの透明ピクセルを考慮するよう修正
/*:
 * @target MZ
 * @plugindesc 敵キャラにSV_Actorsのスプライトシートを適用します。
 * @author Furamon
 * @orderAfter BattleMotionMZ
 * @orderAfter NRP_DynamicMotionMZ
 * @orderBefore Furamon_EnemyActorBattleMotion
 * @orderBefore Furamon_EnemyActorDynamicMotion
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
 * Furamon_EnemyActorBattleMotion、Furamon_EnemyActorDynamicMotionをこのプラグインの下に置いてください。
 * なお、BattleMotionMZのモーションカラー右上で次モーションにつなげる機能には
 * 対応していません。DynamicMotionMZをうまく使って代用してください。
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
    const hasBattleMotion = PluginManager._scripts.includes('BattleMotionMZ');
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
            const actualSize = this._svActorSprite.getActualSize();
            const frameSize = this._svActorSprite.getFrameSize();
            if (actualSize && frameSize) {
                return {
                    width: actualSize.width,
                    height: actualSize.height,
                    frameWidth: frameSize.frameWidth,
                    frameHeight: frameSize.frameHeight,
                };
            }
        }
        return null;
    };
    // 元の敵スプライトを非表示にする
    Sprite_Enemy.prototype.hideOriginalSprite = function () {
        this.visible = false;
        this.bitmap = null;
    };
    // SVアクタースプライトを作成
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
    const _Sprite_Enemy_updateStateSprite = Sprite_Enemy.prototype.updateStateSprite;
    Sprite_Enemy.prototype.updateStateSprite = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            if (this._stateIconSprite) {
                const size = this.getSvActorSpriteSize();
                if (size) {
                    // 実際のスプライトサイズに基づく位置調整
                    this._stateIconSprite.x = this._svActorSprite.x;
                    this._stateIconSprite.y =
                        this._svActorSprite.y - size.height - 10;
                }
                else {
                    // フォールバック位置
                    this._stateIconSprite.x = this._svActorSprite.x;
                    this._stateIconSprite.y = this._svActorSprite.y - 80;
                }
            }
            return;
        }
        // 通常の敵の場合は元の処理
        _Sprite_Enemy_updateStateSprite.call(this);
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
    // ステートアイコンの位置を取得するメソッドを追加
    Sprite_Enemy.prototype.getStateIconPosition = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            const svSprite = this._svActorSprite;
            const mainSprite = svSprite._mainSprite;
            if (mainSprite &&
                mainSprite.bitmap &&
                mainSprite.bitmap.isReady()) {
                const frameHeight = mainSprite.height / 6;
                return {
                    x: svSprite.x,
                    y: svSprite.y - frameHeight,
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
                if (hasBattleMotion) {
                    // BattleMotionMZの場合は正方形セルサイズを返す
                    return size ? size.cellSize || size.width : 64;
                }
                else {
                    // 通常SVアクターの場合
                    return size ? size.width : 64;
                }
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
                if (hasBattleMotion) {
                    // BattleMotionMZの場合は正方形セルサイズを返す
                    return size ? size.cellSize || size.height : 64;
                }
                else {
                    // 通常SVアクターの場合
                    return size ? size.height : 64;
                }
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
    class Sprite_SvActor extends Sprite {
        _battler;
        _motion;
        _motionCount;
        _pattern;
        _mainSprite;
        _shadowSprite;
        _weaponSprite;
        _stateSprite;
        _setupComplete;
        _processingMotion;
        _patternDirection;
        _actualSize; // セットアップ時に計算
        _frameSize;
        constructor() {
            super();
            this._battler = null;
            this._motion = null;
            this._motionCount = 0;
            this._pattern = 0;
            this._setupComplete = false;
            this._processingMotion = false;
            this._patternDirection = 1;
            this._actualSize = null;
            this._frameSize = null;
            this.createMainSprite();
            this.createShadowSprite();
            this.createWeaponSprite();
            this.createStateSprite();
        }
        createMainSprite() {
            this._mainSprite = new Sprite();
            this._mainSprite.anchor.x = 0.5;
            this._mainSprite.anchor.y = 1;
            this.addChild(this._mainSprite);
        }
        createShadowSprite() {
            this._shadowSprite = new Sprite();
            this._shadowSprite.bitmap = ImageManager.loadSystem('Shadow2');
            this._shadowSprite.anchor.x = 0.5;
            this._shadowSprite.anchor.y = 0.5;
            this._shadowSprite.y = -2;
            this._shadowSprite.opacity = 160;
            this.addChild(this._shadowSprite);
        }
        createWeaponSprite() {
            this._weaponSprite = new Sprite_Weapon();
            this.addChild(this._weaponSprite);
        }
        createStateSprite() {
            this._stateSprite = new Sprite_StateOverlay();
            this.addChild(this._stateSprite);
        }
        calculateAndCacheActualSize() {
            const bitmap = this._mainSprite.bitmap;
            if (!bitmap || !bitmap.isReady()) {
                this._actualSize = null;
                this._frameSize = null;
                return;
            }
            let frameWidth, frameHeight;
            if (hasBattleMotion) {
                // BattleMotionMZの場合：1セルは正方形（高さ÷6）
                const cellSize = bitmap.height / 6;
                frameWidth = cellSize;
                frameHeight = cellSize;
            }
            else {
                // 標準のSVアクター（9x6）
                frameWidth = bitmap.width / 9;
                frameHeight = bitmap.height / 6;
            }
            this._frameSize = { frameWidth, frameHeight };
            // 透明ピクセルを考慮したサイズを計算
            this._actualSize = this.detectActualSize(bitmap, frameWidth, frameHeight);
        }
        // 透明ピクセルを検出して実際のサイズを返す（セットアップ時のみ実行）
        detectActualSize(bitmap, frameWidth, frameHeight) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = frameWidth;
            canvas.height = frameHeight;
            // RPGツクールMZのBitmapからcanvasまたは_imageを取得
            const source = bitmap.canvas || bitmap._image;
            if (!source) {
                return { width: frameWidth, height: frameHeight };
            }
            try {
                // 最初のフレーム（待機モーション）を描画して解析
                ctx.drawImage(source, 0, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
                const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
                const data = imageData.data;
                let minX = frameWidth, minY = frameHeight;
                let maxX = 0, maxY = 0;
                // 透明でないピクセルの範囲を検出
                for (let y = 0; y < frameHeight; y++) {
                    for (let x = 0; x < frameWidth; x++) {
                        const alpha = data[(y * frameWidth + x) * 4 + 3];
                        if (alpha > 0) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }
                // 透明でないピクセルが見つからない場合は元のサイズを返す
                if (minX >= frameWidth || minY >= frameHeight) {
                    return { width: frameWidth, height: frameHeight };
                }
                return {
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                };
            }
            catch (error) {
                console.warn('detectActualSize error:', error);
                return { width: frameWidth, height: frameHeight };
            }
        }
        // キャッシュされたサイズを取得
        getActualSize() {
            return this._actualSize || { width: 64, height: 64 };
        }
        getFrameSize() {
            return this._frameSize || { frameWidth: 64, frameHeight: 64 };
        }
        setup(battler) {
            this._battler = battler;
            this._setupComplete = true;
            this.refreshBitmap();
            this._motion = null;
            this._motionCount = 0;
            this._pattern = 0;
            const bitmap = this._mainSprite.bitmap;
            if (bitmap && bitmap.isReady()) {
                this.calculateAndCacheActualSize();
                this.setupInitialMotion();
            }
            else if (bitmap) {
                bitmap.addLoadListener(() => {
                    this.calculateAndCacheActualSize();
                    this.setupInitialMotion();
                });
            }
            if (this._stateSprite && battler) {
                this._stateSprite.setup(battler);
            }
        }
        setupInitialMotion() {
            this._motion = null;
            this._motionCount = 0;
            this._pattern = 0;
            this.startMotion('walk');
            if (this._battler) {
                this._battler._motionRefresh = false;
                this._battler._motion = null;
            }
        }
        startMotion(motion) {
            const standardMotions = getStandardMotions();
            const standardMotion = standardMotions[motion] || standardMotions['walk'];
            this._motion = {
                index: standardMotion.index,
                loop: standardMotion.loop,
            };
            this._motionCount = 0;
            this._pattern = 0;
            if (this._motion && this._motion.loop) {
                this._patternDirection = 1;
            }
        }
        forceMotion(motionType) {
            this._motion = null;
            this._motionCount = 0;
            this._pattern = 0;
            this.startMotion(motionType);
        }
        update() {
            if (!this._battler)
                return;
            // this.updateBitmap();
            this.updateFrame();
            this.updateMotion();
            this.updateStateSprite();
            const battlerAny = this._battler;
            if (battlerAny._damageMotionCount > 0) {
                battlerAny._damageMotionCount -= 1;
            }
            else {
                battlerAny._damaged = false;
            }
            if (battlerAny._motion && !this._processingMotion) {
                this._processingMotion = true;
                const requestedMotion = battlerAny._motion;
                battlerAny._motion = null;
                this.startMotion(requestedMotion);
                this._processingMotion = false;
            }
        }
        updateBitmap() {
            if (!this._battler)
                return;
            const fileName = this._battler.battlerName();
            if (fileName) {
                const newBitmap = ImageManager.loadSvActor(fileName);
                if (this._mainSprite.bitmap !== newBitmap) {
                    this._mainSprite.bitmap = newBitmap;
                }
            }
        }
        updateFrame() {
            const bitmap = this._mainSprite.bitmap;
            if (!bitmap || !bitmap.isReady())
                return;
            if (this._battler && this._battler.isDead()) {
                this.startMotion('damage');
                return;
            }
            if (!this._motion)
                return;
            if (hasBattleMotion) {
                // BattleMotionMZ用のフレーム計算
                const cellSize = bitmap.height / 6; // 1セルのサイズ（正方形）
                const motionIndex = this._motion.index;
                const pattern = this._pattern;
                // BattleMotionMZでは横並びでモーションが配置される
                const col = motionIndex * 3 + pattern; // 各モーション3フレーム
                const row = 0; // とりあえず1行目を使用
                // 範囲チェック
                const maxCols = Math.floor(bitmap.width / cellSize);
                if (col >= maxCols) {
                    console.warn('BattleMotionMZ frame out of bounds, using fallback');
                    this._mainSprite.setFrame(0, 0, cellSize, cellSize);
                    return;
                }
                this._mainSprite.setFrame(col * cellSize, row * cellSize, cellSize, cellSize);
            }
            else {
                // 標準SVアクター用のフレーム計算
                const cw = bitmap.width / 9;
                const ch = bitmap.height / 6;
                const motionIndex = this._motion.index;
                const pattern = this._pattern;
                const motionsPerColumn = 6;
                const patternsPerMotion = 3;
                const column = Math.floor(motionIndex / motionsPerColumn);
                const row = motionIndex % motionsPerColumn;
                const col = column * patternsPerMotion + pattern;
                if (col >= 9 || row >= 6) {
                    console.warn('Frame out of bounds, using fallback');
                    this._mainSprite.setFrame(0, 0, cw, ch);
                    return;
                }
                this._mainSprite.setFrame(col * cw, row * ch, cw, ch);
            }
        }
        updateMotion() {
            const battlerAny = this._battler;
            if (battlerAny._motionRefresh && !battlerAny._damaged) {
                battlerAny._motionRefresh = false;
                this.refreshMotion();
            }
            if (this._motion) {
                this._motionCount++;
                const speed = 12;
                if (this._motionCount >= speed) {
                    if (this._motion.loop) {
                        if (this._patternDirection === undefined) {
                            this._patternDirection = 1;
                        }
                        if (this._pattern === 0) {
                            this._pattern = 1;
                            this._patternDirection = 1;
                        }
                        else if (this._pattern === 1) {
                            this._pattern =
                                this._patternDirection === 1 ? 2 : 0;
                        }
                        else if (this._pattern === 2) {
                            this._pattern = 1;
                            this._patternDirection = -1;
                        }
                    }
                    else {
                        if (this._pattern < 2) {
                            this._pattern++;
                        }
                        else {
                            this._pattern = 2;
                        }
                    }
                    this._motionCount = 0;
                }
            }
        }
        updateStateSprite() {
            if (this._stateSprite && this._battler) {
                this._stateSprite.setup(this._battler);
            }
        }
        refreshBitmap() {
            if (this._battler) {
                const fileName = this._battler.battlerName();
                if (fileName) {
                    this._mainSprite.bitmap =
                        ImageManager.loadSvActor(fileName);
                }
            }
        }
        refreshMotion() {
            if (!this._battler)
                return;
            if (this._battler.hp <= 0) {
                this.startMotion('damage');
                return;
            }
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
            const battlerAny = this._battler;
            if (battlerAny._motion) {
                const requestedMotion = battlerAny._motion;
                battlerAny._motion = null;
                this.startMotion(requestedMotion);
                return;
            }
            this.startMotion('walk');
        }
        getMotionIndex(motionType) {
            const motions = (typeof window.Sprite_Battler !== 'undefined' &&
                window.Sprite_Battler.MOTIONS) ||
                (typeof window.Sprite_Actor !== 'undefined' &&
                    window.Sprite_Actor.MOTIONS) ||
                {};
            return motions[motionType]?.index ?? 0;
        }
    }
    // グローバルに公開
    window.Sprite_SvActor = Sprite_SvActor;
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
                const size = this.getSvActorSpriteSize();
                if (size) {
                    const enemyStatePosition = typeof EnemyStatePosition !== 'undefined'
                        ? EnemyStatePosition
                        : 0;
                    if (enemyStatePosition === 0) {
                        // 敵画像の上
                        return size.height + 20;
                    }
                    else if (enemyStatePosition === 2) {
                        // 敵画像の中心
                        return Math.floor(size.height / 2);
                    }
                    else {
                        // 敵画像の下
                        return 0;
                    }
                }
                // フォールバック
                return 80;
            }
            return _Sprite_Enemy_getBattlerStatePosition.call(this);
        };
    }
})();
