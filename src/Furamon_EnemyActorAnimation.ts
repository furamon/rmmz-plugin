//------------------------------------------------------------------------------
// Furamon_EnemyActorAnimation.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc 敵キャラにSV_Actorsのスプライトシートを適用します。
 * @author Furamon
 * @help 敵キャラにSV_Actorsのスプライトシートを適用します。
 *
 * 敵のメモ欄に以下のいずれかを記述します：
 * 「<svActor:ファイル名>」
 * 「<SVアクター:ファイル名>」
 * ＜使用例＞Actor1_1.pngを使いたいなら=>「<svActor:Actor1_1>」
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

    // NUUN_ButlerHPGaugeのパラメータを取得
    let nuunHpGaugeParams = {};
    try {
        nuunHpGaugeParams =
            PluginManager.parameters('NUUN_ButlerHPGauge') || {};
    } catch (e) {
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
    function getSvActorFileName(enemy: MZ.Enemy) {
        const meta = enemy.meta;
        const fileName = meta['svActor'] || meta['SVアクター'];
        // 値が空でない文字列の場合のみファイル名を返すように修正
        // タグのみ (<svActor>) が記述された場合に true が返るのを防ぐ
        if (typeof fileName === 'string' && fileName.length > 0) {
            return fileName;
        }
        return undefined;
    }

    /**
     * SVアクター使用の敵かどうか判定
     */

    function isSvActorEnemy(battler: Game_Battler) {
        if (!battler || !(battler instanceof Game_Enemy)) {
            return false;
        }

        const enemy = battler.enemy();
        if (!enemy || !enemy.meta) {
            return false;
        }

        const fileName =
            enemy.meta['svActor'] || enemy.meta['SVアクター'] || null;
        const result = !!fileName;
        return result;
    }

    // imageManagerの安全化
    const _ImageManager_loadSvEnemy = ImageManager.loadSvEnemy;
    ImageManager.loadSvEnemy = function (filename) {
        try {
            if (!svEnemyFileExists(filename)) {
                console.log('SvEnemy file not found:', filename);
                return this.loadEmptyBitmap();
            }
            return _ImageManager_loadSvEnemy.call(this, filename);
        } catch (e) {
            console.log('Failed to load sv_enemy, using dummy:', filename);
            return this.loadEmptyBitmap();
        }
    };
    ImageManager.loadEmptyBitmap = function () {
        const bitmap = new Bitmap(64, 64);
        bitmap.clear();
        return bitmap;
    };

    function svEnemyFileExists(filename: string) {
        try {
            const path =
                'img/sv_enemies/' + encodeURIComponent(filename) + '.png';
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', path, false);
            xhr.send();
            return xhr.status === 200;
        } catch (e) {
            return false;
        }
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
    Game_Enemy.prototype.performAction = function (this: Game_Enemy, action) {
        _Game_Enemy_performAction.call(this, action);

        if (isSvActorEnemy(this as any)) {
            let motionName = 'thrust'; // デフォルトを攻撃モーションに

            // アクションタイプに応じてモーションを決定
            if (action.isAttack()) {
                motionName = 'thrust';
            } else if (action.isGuard()) {
                motionName = 'guard';
            } else if (action.isMagicSkill()) {
                motionName = 'spell';
            } else if (action.isSkill()) {
                motionName = 'skill';
            } else if (action.isItem()) {
                motionName = 'item';
            }
            this.requestMotion(motionName);

            // アクション終了後に待機モーション（walk）に戻る
            setTimeout(() => {
                if (this && !this._motionType) {
                    this.requestMotion('walk');
                }
            }, 100); // 100msに短縮
        }
    };

    // Game_Enemy のモーション状態管理

    // ダメージ時のモーション制御
    const _Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
    Game_Enemy.prototype.performDamage = function () {
        _Game_Enemy_performDamage.call(this);
        if (isSvActorEnemy(this as any)) {
            this.requestMotion('damage');
        }
    };

    // 回避時のモーション制御
    const _Game_Enemy_performEvasion = Game_Enemy.prototype.performEvasion;
    Game_Enemy.prototype.performEvasion = function () {
        _Game_Enemy_performEvasion.call(this);
        if (isSvActorEnemy(this as any)) {
            this.requestMotion('evade');
        }
    };

    // 魔法反射時のモーション制御
    const _Game_Enemy_performMagicEvasion =
        Game_Enemy.prototype.performMagicEvasion;
    Game_Enemy.prototype.performMagicEvasion = function () {
        _Game_Enemy_performMagicEvasion.call(this);
        if (isSvActorEnemy(this as any)) {
            this.requestMotion('evade');
        }
    };

    // モーション要求の修正
    Game_Enemy.prototype.requestMotion = function (motionType) {
        this._motionType = motionType;
        this._motionRefresh = true;
    };

    const _Game_Enemy_refresh = Game_Enemy.prototype.refresh;
    Game_Enemy.prototype.refresh = function () {
        _Game_Enemy_refresh.call(this);
        if (isSvActorEnemy(this as any)) {
            this._motionRefresh = true;
        }
    };

    // Game_Enemyでのアクター判定（DynamicMotion用）
    const _Game_Enemy_isSvActor = Game_Enemy.prototype.isSvActor;
    Game_Enemy.prototype.isSvActor = function () {
        if (getSvActorFileName(this.enemy())) {
            return true; // DynamicMotionでSVアクターとして認識
        }
        return _Game_Enemy_isSvActor ? _Game_Enemy_isSvActor.call(this) : false;
    };

    // Game_EnemyにBattleMotionMZメソッドを移植
    if (
        typeof Game_Battler !== 'undefined' &&
        Game_Battler.prototype.makeSPName
    ) {
        Game_Enemy.prototype.makeSPName = Game_Battler.prototype.makeSPName;
    }

    // --------------------------------------------------------------------------
    // Sprite_Enemy
    // 直接表示はしない、位置だけ渡す

    Sprite_Enemy.prototype.loadBitmap = function (name: string) {
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
        } else {
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
    Sprite_Enemy.prototype.setBattler = function (battler: Game_Battler) {
        _Sprite_Enemy_setBattler.call(this, battler);

        // 判定を実行時に再確認
        this._isSvActorEnemy = isSvActorEnemy(this._battler);

        // SVアクター用の場合の処理
        if (this._isSvActorEnemy && this._battler) {
            this.hideOriginalSprite();
            this.createSvActorSprite();
        }
    };

    Sprite_Enemy.prototype.loadBitmap = function (name: string) {
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
        } else {
            this.bitmap = ImageManager.loadEnemy(name);
        }
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

        this._svActorSprite = new (Sprite_SvActor as any)();
        this._svActorSprite.setup(this._battler);

        if (prmAutoMirror) {
            this._svActorSprite.scale.x = -1;
        }

        // 親の親（戦闘フィールド）にSVアクタースプライトを直接追加
        if (this.parent) {
            this.parent.addChild(this._svActorSprite);
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
        } else {
            this.addChild(this._svActorSprite);
            this.visible = true;
        }
    };

    Sprite_Enemy.prototype.startMotion = function (motionType: string) {
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.startMotion(motionType);
        }
    };

    Sprite_Enemy.prototype.forceMotion = function (motionType: string) {
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.forceMotion(motionType);
        }
    };

    Sprite_Enemy.prototype.refreshMotion = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.refreshMotion();
        }
    };

    // DynamicMotionからのモーション要求を取得
    const _Sprite_Enemy_stepForward = Sprite_Enemy.prototype.stepForward;
    Sprite_Enemy.prototype.stepForward = function () {
        if (this._isSvActorEnemy) {
            this.startMotion('walk');
        } else if (_Sprite_Enemy_stepForward) {
            _Sprite_Enemy_stepForward.call(this);
        }
    };

    const _Sprite_Enemy_stepBack = Sprite_Enemy.prototype.stepBack;
    Sprite_Enemy.prototype.stepBack = function () {
        if (this._isSvActorEnemy) {
            this.startMotion('escape');
        } else if (_Sprite_Enemy_stepBack) {
            _Sprite_Enemy_stepBack.call(this);
        }
    };

    // updateStateSprite の修正
    const _Sprite_Enemy_updateStateSprite =
        Sprite_Enemy.prototype.updateStateSprite;
    Sprite_Enemy.prototype.updateStateSprite = function () {
        if (this._isSvActorEnemy) {
            // SVアクター用は完全にスキップ（子スプライトで処理される）
            return;
        }
        _Sprite_Enemy_updateStateSprite.call(this);
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

    const _Sprite_Enemy_destroy = Sprite_Enemy.prototype.destroy;
    Sprite_Enemy.prototype.destroy = function () {
        // SVアクタースプライトも削除
        if (this._svActorSprite && this._svActorSprite.parent) {
            this._svActorSprite.parent.removeChild(this._svActorSprite);
            this._svActorSprite.destroy();
            this._svActorSprite = null;
        }
        _Sprite_Enemy_destroy.call(this);
    };

    // SVアクターとして認識されるためのメソッドを追加
    Sprite_Enemy.prototype.setupMotion = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // DynamicMotionでSVアクターとして認識されるように
            this._svActorSprite.setupMotion();
        }
    };

    // DynamicMotionでアクターかどうか判定されるメソッド
    const _Sprite_Enemy_isActor = Sprite_Enemy.prototype.isActor;
    Sprite_Enemy.prototype.isActor = function () {
        if (this._isSvActorEnemy) {
            return true; // DynamicMotionでアクターとして扱われるようにする
        }
        return _Sprite_Enemy_isActor ? _Sprite_Enemy_isActor.call(this) : false;
    };

    // DynamicMotionでのモーション制御
    const _Sprite_Enemy_forceMotion = Sprite_Enemy.prototype.forceMotion;
    Sprite_Enemy.prototype.forceMotion = function (motionType: string) {
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.forceMotion(motionType);
        } else if (_Sprite_Enemy_forceMotion) {
            _Sprite_Enemy_forceMotion.call(this, motionType);
        }
    };

    const _Sprite_Enemy_setupDamagePopup =
        Sprite_Enemy.prototype.setupDamagePopup;
    Sprite_Enemy.prototype.setupDamagePopup = function () {
        if (
            this._isSvActorEnemy &&
            this._svActorSprite &&
            this._battler.isDamagePopupRequested()
        ) {
            // 強制的にダメージモーションを設定
            this._svActorSprite.forceMotion('damage');
            // 12フレーム後に戻す
            setTimeout(() => {
                this._svActorSprite.forceMotion('walk');
            }, 600);
        }
        _Sprite_Enemy_setupDamagePopup.call(this);
    };

    // 更新処理の統合修正
    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function () {
        if (this._isSvActorEnemy) {
            this._svActorSprite.update();
            this._svActorSprite.updateFrame();
            this._svActorSprite.updateMotion();
            this._svActorSprite.updateStateSprite();
            this._svActorSprite.updateBitmap();
        }
        _Sprite_Enemy_update.call(this);
    };

    Sprite_Enemy.prototype.getBattlerOverlayHeight = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // SVアクタースプライトの高さを返す
            return this._svActorSprite.height * 0.8;
        } else {
            return this.bitmap ? Math.floor(this.bitmap.height * 0.9) : 0;
        }
    };

    // --------------------------------------------------------------------------
    // Sprite_SvActor（独自）- 重複削除と修正

    function Sprite_SvActor(this: any) {
        this.initialize(...arguments);
    }

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

    Sprite_SvActor.prototype.setup = function (battler: Game_Battler) {
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
        } else if (bitmap) {
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

        // 初期モーションをwalk（待機）に設定
        this.startMotion('walk');

        // モーションリフレッシュフラグをリセット
        if (this._battler) {
            this._battler._motionRefresh = false;
            this._battler._motionType = null;
        }
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
    Sprite_SvActor.prototype.startMotion = function (motionType: string) {
        this._motionFinished = false;

        // 戦闘不能時は何もしない
        if (this._battler && this._battler.isDead()) {
            return;
        }

        // ダメージモーションの場合は強制的に実行
        if (motionType === 'damage') {
            this._motion = null; // 現在のモーションをリセット
            this._motionCount = 0;
            this._pattern = 0;
        }

        // BattleMotionMZの存在チェック
        const hasBattleMotionMZ =
            typeof Sprite_Battler !== 'undefined' &&
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
                this.absStop = false;
                this.animLoop = true;
                this.remake = true;
                this.speed = newMotion.speed || 12;
                this.nextMotionNo = -1;
                this.offsetX = 0;
                this.offsetY = 0;
            } else {
                this.startMotion('walk');
            }
        } else {
            // 標準のSprite_Actorのモーション定義を使用
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
            } else {
                // 正しいRPGツクールMZの標準モーション定義
                const standardMotions = {
                    walk: { index: 0, loop: true, speed: 12 },
                    wait: { index: 1, loop: true, speed: 12 },
                    chant: { index: 2, loop: true, speed: 12 },
                    guard: { index: 3, loop: true, speed: 12 },
                    damage: { index: 4, loop: false, speed: 12 },
                    evade: { index: 5, loop: false, speed: 12 },
                    thrust: { index: 6, loop: false, speed: 12 },
                    swing: { index: 7, loop: false, speed: 12 },
                    missile: { index: 8, loop: false, speed: 12 },
                    skill: { index: 9, loop: false, speed: 12 },
                    spell: { index: 10, loop: false, speed: 12 },
                    item: { index: 11, loop: false, speed: 12 },
                    escape: { index: 12, loop: true, speed: 12 },
                    victory: { index: 13, loop: true, speed: 12 },
                    dying: { index: 14, loop: true, speed: 12 },
                    abnormal: { index: 15, loop: true, speed: 12 },
                    sleep: { index: 16, loop: true, speed: 12 },
                    dead: { index: 17, loop: true, speed: 12 },
                };

                const standardMotion =
                    standardMotions[motionType] || standardMotions['walk'];

                this._motion = {
                    index: standardMotion.index,
                    loop: standardMotion.loop,
                    speed: standardMotion.speed,
                };
                this._motionCount = 0;
                this._pattern = 0;
            }
        }
    };

    Sprite_SvActor.prototype.forceMotion = function (motionType: string) {
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
            this._motion = { index: 0, loop: true, speed: 12 };
        }
    };

    // BattleMotionMZ用のメソッドを条件付きで適用
    Sprite_SvActor.prototype.setupValue = function (motionType: string) {
        const motions =
            typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS
                ? Sprite_Battler.MOTIONS
                : Sprite_Actor.MOTIONS;

        if (!motions[motionType]) {
            motionType = 'walk';
        }

        if (!motions[motionType]) {
            this._motion = { index: 0, loop: true, speed: 12 };
            return;
        }

        this._motion.index = motions[motionType].index;
        this._motion.loop = motions[motionType].loop;
        this._motion.speed = motions[motionType].speed;
        this._motionCount = 0;
        this._pattern = 0;

        // BattleMotionMZ特有のプロパティ（BattleMotionMZがある場合のみ）
        if (typeof Sprite_Battler !== 'undefined') {
            this._animCount = 0;
            this.fpsMotion = 0;
            this.motionType = motionType;
            this.absStop = false;
            this.animLoop = true;
            this.remake = true;
            this.speed = motions[motionType].speed;
            this.nextMotionNo = -1;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    };

    Sprite_SvActor.prototype.remakeDeadMotion = function (motionType: string) {
        if (motionType === 'dead') {
            var note = $dataStates[1].note;
            var xx = note.match(/<motionSP(\w+)>/);
            if (xx) {
                motionType = 'motionSP' + RegExp.$1;
            }
        } else {
            var x2 = motionType.match(/motionsp(\w+)/);
            if (x2) {
                motionType = 'motionSP' + RegExp.$1;
            }
        }
        return motionType;
    };

    Sprite_SvActor.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (!this._battler) return;

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
        if (!this._battler) return;

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
        if (!bitmap || !bitmap.isReady()) return;

        const hasBattleMotionMZ =
            typeof Sprite_Battler !== 'undefined' &&
            this.cs &&
            typeof this.cs === 'function';

        if (hasBattleMotionMZ) {
            try {
                // BattleMotionMZ処理
                if (this.getRemake && this.getRemake() === true) {
                    this.addMotionData && this.addMotionData(this._mainSprite);
                    this.setMotionFps && this.setMotionFps(this._mainSprite);
                    this.setMotionArray && this.setMotionArray();
                    this.setRemake && this.setRemake(false);
                }

                const ch = this.cs(this._mainSprite);
                const cw = this.cs(this._mainSprite);
                const cx = this.cx ? this.cx() : 0;
                const cy = this.cy ? this.cy() : 0;

                this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
            } catch (e) {
                this.updateFrameDefault(bitmap);
            }
        } else {
            this.updateFrameDefault(bitmap);
        }
    };

    Sprite_SvActor.prototype.updateMotion = function () {
        if (!this._motion) return;

        this._motionCount++;
        if (this._motionCount >= this._motion.speed * 3) {
            this._motionCount = 0;
            this._pattern++;

            if (this._pattern >= 3) {
                if (this._motion.loop) {
                    this._pattern = 0;
                } else {
                    this._pattern = 2;
                    // ループしないモーションの場合は一度だけrefreshMotionを呼ぶ
                    if (!this._motionFinished) {
                        this._motionFinished = true;
                        this.refreshMotion();
                    }
                }
            }
        }
    };

    // デフォルトのモーション更新処理を分離
    Sprite_SvActor.prototype.updateMotionDefault = function () {
        if (this._motion) {
            this._motionCount++;
            const speed = this.motionSpeed();

            if (this._motionCount >= speed) {
                if (this._motion.loop) {
                    // ループ処理
                    if (this._pattern === 0) {
                        this._pattern = 1;
                        this._patternDirection = 1;
                    } else if (this._pattern === 1) {
                        // Move to 2 if coming from 0, or to 0 if coming from 2
                        this._pattern = this._patternDirection === 1 ? 2 : 0;
                    } else if (this._pattern === 2) {
                        this._pattern = 1;
                        this._patternDirection = -1;
                    }
                } else {
                    // 非ループモーション終了時
                    if (this._pattern < 2) {
                        this._pattern++;
                    } else {
                        // 修正: 即座にwalkモーションに遷移
                        this.startMotion('walk');
                        return; // 追加処理をスキップ
                    }
                }
                this._motionCount = 0;
            }
        }
    };


    Sprite_SvActor.prototype.updateFrameDefault = function (bitmap: Bitmap) {
        if (!this._motion) {
            this.startMotion('walk');
            return;
        }

        const cw = bitmap.width / 9; // 9コマ幅
        const ch = bitmap.height / 6; // 6コマ高

        const motionIndex = this._motion.index;
        const pattern = this._pattern;

        const motionsPerColumn = 6; // 1列に6モーション
        const patternsPerMotion = 3; // 1モーションに3パターン

        const column = Math.floor(motionIndex / motionsPerColumn); // どの列か
        const row = motionIndex % motionsPerColumn; // 列内での行位置
        const col = column * patternsPerMotion + pattern; // 実際の列位置

        // 範囲チェック
        if (col >= 6 || row >= 9) {
            console.warn('Frame out of bounds, using fallback');
            this._mainSprite.setFrame(0, 0, cw, ch);
            return;
        }

        this._mainSprite.setFrame(col * cw, row * ch, cw, ch);
    };

    Sprite_SvActor.prototype.motionSpeed = function () {
        // 優先順位: _motion.speed > this.speed > デフォルト値
        if (this._motion && typeof this._motion.speed === 'number') {
            return this._motion.speed;
        }
        if (typeof this.speed === 'number') {
            return this.speed;
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
        if (!this._battler) return;

        // ステート確認
        if (
            this._battler.states &&
            typeof this._battler.states === 'function'
        ) {
            const states = this._battler.states();

            for (let i = 0; i < states.length; i++) {
                const state = states[i];
                if (state && state.meta) {
                    const enemyMotion = state.meta['EnemyMotion'];
                    if (
                        typeof enemyMotion === 'string' &&
                        enemyMotion.trim().length > 0
                    ) {
                        this.forceMotion(enemyMotion.trim());
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

        // デフォルトモーション
        this.startMotion('walk');
    };


    // モーションインデックス取得のヘルパー関数
    Sprite_SvActor.prototype.getMotionIndex = function (
        motionType: string
    ): number {
        const hasBattleMotionMZ =
            typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS;

        const motions = hasBattleMotionMZ
            ? Sprite_Battler.MOTIONS
            : typeof Sprite_Actor !== 'undefined' && Sprite_Actor.MOTIONS
            ? Sprite_Actor.MOTIONS
            : null;

        if (motions && motions[motionType]) {
            return motions[motionType].index;
        }

        const fallbackMotions = {
            walk: { index: 0, loop: true, speed: 12 },
            wait: { index: 1, loop: true, speed: 12 },
            chant: { index: 2, loop: true, speed: 12 },
            guard: { index: 3, loop: false, speed: 12 },
            damage: { index: 4, loop: false, speed: 12 },
            evade: { index: 5, loop: false, speed: 12 },
            thrust: { index: 6, loop: false, speed: 12 },
            swing: { index: 7, loop: false, speed: 12 },
            missile: { index: 8, loop: false, speed: 12 },
            skill: { index: 9, loop: false, speed: 12 },
            spell: { index: 10, loop: false, speed: 12 },
            item: { index: 11, loop: false, speed: 12 },
            escape: { index: 12, loop: true, speed: 12 },
            victory: { index: 13, loop: true, speed: 12 },
            dying: { index: 14, loop: true, speed: 12 },
            abnormal: { index: 15, loop: true, speed: 12 },
            sleep: { index: 16, loop: true, speed: 12 },
            dead: { index: 17, loop: true, speed: 12 },
        };

        return fallbackMotions[motionType]
            ? fallbackMotions[motionType].index
            : 0;
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
        window.getSplit = function (tag: string | null | undefined) {
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
})();
