/*:
 * @target MZ
 * @plugindesc 敵キャラにSV_Actorsのスプライトシートを適用します。
 * @author Furamon
 * @help 敵キャラにSV_Actorsのスプライトシートを適用します。
 *
 * 【使い方】
 * １．MZツクールのデータベース「敵キャラ」画面で敵を作成します。
 *
 * ２．敵のメモ欄の任意行に以下のいずれかを記述します：
 *     「<svActor:ファイル名>」
 *     「<SVアクター:ファイル名>」
 *       ＜使用例＞Actor1_1.pngを使用したい → 「<svActor:Actor1_1>」
 *
 * ３．MZツクール画面のデータベース「敵グループ」画面で１．で作成した
 *     敵を配置します。
 *
 * ４．既存のイベントコマンドで作成した敵グループを指定して戦闘を開始します。
 *
 * 【特徴】
 * - img/sv_actors/フォルダのスプライトシートがそのまま敵として表示されます
 * - メモ欄でファイル名を直接指定するシンプルな方式です
 * - サイドビューバトルに最適化されています
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
    // --------------------------------------------------------------------------
    // Utils
    /**
     * 敵キャラのメモ欄からSVアクターファイル名を取得
     */
    function getSvActorFileName(enemy) {
        const meta = enemy.meta;
        const fileName = meta['svActor'] || meta['SVアクター'] || null;
        return fileName;
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
        const fileName = enemy.meta['svActor'] || enemy.meta['SVアクター'] || null;
        const result = !!fileName;
        console.log('isSvActorEnemy check:', {
            name: enemy.name,
            meta: enemy.meta,
            svActor: fileName,
            result: result,
        });
        return result;
    }
    // --------------------------------------------------------------------------
    // imageManagerの安全化
    const _ImageManager_loadSvEnemy = ImageManager.loadSvEnemy;
    ImageManager.loadSvEnemy = function (filename) {
        try {
            if (!svEnemyFileExists(filename)) {
                console.log('SvEnemy file not found:', filename);
                return this.loadEmptyBitmap();
            }
            return _ImageManager_loadSvEnemy.call(this, filename);
        }
        catch (e) {
            console.log('Failed to load sv_enemy, using dummy:', filename);
            return this.loadEmptyBitmap();
        }
    };
    ImageManager.loadEmptyBitmap = function () {
        const bitmap = new Bitmap(64, 64);
        bitmap.clear();
        return bitmap;
    };
    function svEnemyFileExists(filename) {
        try {
            const path = 'img/sv_enemies/' + encodeURIComponent(filename) + '.png';
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', path, false);
            xhr.send();
            return xhr.status === 200;
        }
        catch (e) {
            return false;
        }
    }
    // --------------------------------------------------------------------------
    // Game_Enemy
    const _Game_Enemy_battlerName = Game_Enemy.prototype.battlerName;
    Game_Enemy.prototype.battlerName = function () {
        const svActorFile = getSvActorFileName(this.enemy());
        console.log('Game_Enemy battlerName:', this.enemy().name, svActorFile); // デバッグ
        if (svActorFile) {
            return svActorFile;
        }
        return _Game_Enemy_battlerName.call(this);
    };
    // Game_Enemyでのスキル実行時モーション対応
    const _Game_Enemy_performAction = Game_Enemy.prototype.performAction;
    Game_Enemy.prototype.performAction = function (action) {
        _Game_Enemy_performAction.call(this, action);
        if (isSvActorEnemy(this)) {
            // BattleMotionMZのmakeSPName対応
            let motionName = 'attack';
            if (this.makeSPName) {
                motionName = this.makeSPName(action);
            }
            else {
                // フォールバック
                if (action.isAttack()) {
                    motionName = 'attack';
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
            }
            this.requestMotion(motionName);
        }
    };
    const _Game_Enemy_screenX = Game_Enemy.prototype.screenX;
    Game_Enemy.prototype.screenX = function () {
        // SVアクター使用の敵も通常の座標計算を使用
        return _Game_Enemy_screenX.call(this);
    };
    const _Game_Enemy_screenY = Game_Enemy.prototype.screenY;
    Game_Enemy.prototype.screenY = function () {
        // SVアクター使用の敵も通常の座標計算を使用
        return _Game_Enemy_screenY.call(this);
    };
    // --------------------------------------------------------------------------
    // Game_Enemy のモーション状態管理
    // ダメージ時のモーション制御
    const _Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
    Game_Enemy.prototype.performDamage = function () {
        _Game_Enemy_performDamage.call(this);
        if (isSvActorEnemy(this)) {
            console.log('Enemy performDamage - requesting damage motion');
            this.requestMotion('damage');
        }
    };
    // 回避時のモーション制御
    const _Game_Enemy_performEvasion = Game_Enemy.prototype.performEvasion;
    Game_Enemy.prototype.performEvasion = function () {
        _Game_Enemy_performEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this.requestMotion('evade');
        }
    };
    // 魔法反射時のモーション制御
    const _Game_Enemy_performMagicEvasion = Game_Enemy.prototype.performMagicEvasion;
    Game_Enemy.prototype.performMagicEvasion = function () {
        _Game_Enemy_performMagicEvasion.call(this);
        if (isSvActorEnemy(this)) {
            this.requestMotion('evade');
        }
    };
    // モーション要求システムの追加
    Game_Enemy.prototype.requestMotion = function (motionType) {
        this._motionType = motionType;
        this._motionRefresh = true;
    };
    const _Game_Enemy_refresh = Game_Enemy.prototype.refresh;
    Game_Enemy.prototype.refresh = function () {
        _Game_Enemy_refresh.call(this);
        if (isSvActorEnemy(this)) {
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
    if (typeof Game_Battler !== 'undefined' &&
        Game_Battler.prototype.makeSPName) {
        Game_Enemy.prototype.makeSPName = Game_Battler.prototype.makeSPName;
    }
    // --------------------------------------------------------------------------
    // Sprite_Enemy
    Sprite_Enemy.prototype.loadBitmap = function (name, hue) {
        console.log('loadBitmap called with:', name, 'isSvActorEnemy:', this._isSvActorEnemy);
        if (this._isSvActorEnemy) {
            console.log('Using SV Actor bitmap for:', name);
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
    };
    const _Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function (battler) {
        console.log('setBattler called with:', battler ? battler.name() : 'null', 'enemy data:', battler ? battler.enemy() : null);
        _Sprite_Enemy_setBattler.call(this, battler);
        // 判定を実行時に再確認
        this._isSvActorEnemy = isSvActorEnemy(this._battler);
        console.log('_isSvActorEnemy set to:', this._isSvActorEnemy, 'battler:', this._battler);
        // SVアクター用の場合の処理
        if (this._isSvActorEnemy && this._battler) {
            console.log('Setting up SVActor enemy');
            this.hideOriginalSprite();
            this.createSvActorSprite();
        }
    };
    Sprite_Enemy.prototype.loadBitmap = function (name, hue) {
        // 実行時に再判定
        this._isSvActorEnemy = isSvActorEnemy(this._battler);
        console.log('loadBitmap called with:', name, 'isSvActorEnemy:', this._isSvActorEnemy, 'battler:', this._battler);
        if (this._isSvActorEnemy) {
            console.log('Using SV Actor bitmap for:', name);
            this.bitmap = new Bitmap(1, 1);
            this.bitmap.clear();
            this.visible = false;
            return;
        }
        // 通常の敵の処理
        if ($gameSystem.isSideView()) {
            this.bitmap = ImageManager.loadSvEnemy(name, hue);
        }
        else {
            this.bitmap = ImageManager.loadEnemy(name, hue);
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
        console.log('createSvActorSprite called');
        this.visible = false;
        this._svActorSprite = new Sprite_SvActor();
        this._svActorSprite.setup(this._battler);
        if (prmAutoMirror) {
            this._svActorSprite.scale.x = -1;
        }
        // 親の親（戦闘フィールド）にSVアクタースプライトを直接追加
        if (this.parent) {
            this.parent.addChild(this._svActorSprite);
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
            console.log('SV Actor sprite added to battlefield at position:', this.x, this.y);
        }
        else {
            this.addChild(this._svActorSprite);
            this.visible = true;
            console.log('SV Actor sprite added as child (fallback)');
        }
    };
    // 位置同期メソッド（DynamicMotion用）
    Sprite_Enemy.prototype.updateSvActorPosition = function () {
        if (this._svActorSprite && this._svActorSprite.parent === this.parent) {
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
            this._svActorSprite.opacity = this.opacity;
            this._svActorSprite.visible = this.visible;
            const baseScaleX = prmAutoMirror ? -1 : 1;
            this._svActorSprite.scale.x = this.scale.x * baseScaleX;
            this._svActorSprite.scale.y = this.scale.y;
            this._svActorSprite.rotation = this.rotation;
        }
    };
    // モーション制御（シンプル化）
    Sprite_Enemy.prototype.startMotion = function (motionType) {
        console.log('Enemy startMotion called:', motionType, 'isSvActorEnemy:', this._isSvActorEnemy);
        if (this._isSvActorEnemy && this._svActorSprite) {
            console.log('Calling SvActor startMotion');
            this._svActorSprite.startMotion(motionType);
        }
    };
    Sprite_Enemy.prototype.forceMotion = function (motionType) {
        console.log('Enemy forceMotion called:', motionType, 'isSvActorEnemy:', this._isSvActorEnemy);
        if (this._isSvActorEnemy && this._svActorSprite) {
            console.log('Calling SvActor forceMotion');
            this._svActorSprite.forceMotion(motionType);
        }
    };
    // refreshMotionをSpriteレベルで実装
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
        }
        else if (_Sprite_Enemy_stepForward) {
            _Sprite_Enemy_stepForward.call(this);
        }
    };
    const _Sprite_Enemy_stepBack = Sprite_Enemy.prototype.stepBack;
    Sprite_Enemy.prototype.stepBack = function () {
        if (this._isSvActorEnemy) {
            this.startMotion('escape');
        }
        else if (_Sprite_Enemy_stepBack) {
            _Sprite_Enemy_stepBack.call(this);
        }
    };
    // updateStateSprite の修正
    const _Sprite_Enemy_updateStateSprite = Sprite_Enemy.prototype.updateStateSprite;
    Sprite_Enemy.prototype.updateStateSprite = function () {
        if (this._isSvActorEnemy) {
            // SVアクター用は完全にスキップ（子スプライトで処理される）
            return;
        }
        _Sprite_Enemy_updateStateSprite.call(this);
    };
    // --------------------------------------------------------------------------
    // 位置更新の処理
    const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;
    Sprite_Enemy.prototype.updatePosition = function () {
        _Sprite_Enemy_updatePosition.call(this);
        // SVアクタースプライトの位置も更新
        if (this._isSvActorEnemy &&
            this._svActorSprite &&
            this._svActorSprite.parent === this.parent) {
            this._svActorSprite.x = this.x;
            this._svActorSprite.y = this.y;
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
    Sprite_Enemy.prototype.refreshMotion = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            this._svActorSprite.refreshMotion &&
                this._svActorSprite.refreshMotion();
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
    Sprite_Enemy.prototype.forceMotion = function (motionType) {
        console.log('Enemy forceMotion called:', motionType, 'isSvActorEnemy:', this._isSvActorEnemy); // デバッグ
        if (this._isSvActorEnemy && this._svActorSprite) {
            console.log('Calling SvActor forceMotion'); // デバッグ
            this._svActorSprite.forceMotion(motionType);
        }
        else if (_Sprite_Enemy_forceMotion) {
            _Sprite_Enemy_forceMotion.call(this, motionType);
        }
    };
    // 位置情報の同期（DynamicMotion用）
    const _Sprite_Enemy_updateMove = Sprite_Enemy.prototype.updateMove;
    Sprite_Enemy.prototype.updateMove = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // DynamicMotionの移動を子スプライトに反映
            if (this._svActorSprite.parent === this.parent) {
                this._svActorSprite.x = this.x;
                this._svActorSprite.y = this.y;
                this._svActorSprite.opacity = this.opacity;
                this._svActorSprite.visible = this.visible;
                this._svActorSprite.scale.x =
                    this.scale.x * (prmAutoMirror ? -1 : 1);
                this._svActorSprite.scale.y = this.scale.y;
                this._svActorSprite.rotation = this.rotation;
            }
        }
        if (_Sprite_Enemy_updateMove) {
            _Sprite_Enemy_updateMove.call(this);
        }
    };
    // --------------------------------------------------------------------------
    // ダメージ表示との連携
    const _Sprite_Enemy_setupDamagePopup = Sprite_Enemy.prototype.setupDamagePopup;
    Sprite_Enemy.prototype.setupDamagePopup = function () {
        if (this._isSvActorEnemy) {
            if (this._battler.isDamagePopupRequested()) {
                this.startMotion('damage');
                // ダメージモーション後に通常状態に戻る
                setTimeout(() => {
                    if (this._svActorSprite && this._battler) {
                        this._svActorSprite.refreshMotion();
                    }
                }, 1200); // 少し長めに設定
            }
        }
        if (_Sprite_Enemy_setupDamagePopup) {
            _Sprite_Enemy_setupDamagePopup.call(this);
        }
    };
    // --------------------------------------------------------------------------
    // 更新処理の統合修正
    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function () {
        if (this._isSvActorEnemy) {
            // 基本的な更新処理
            Sprite_Battler.prototype.update.call(this);
            // DynamicMotion用の更新
            this.updateMove && this.updateMove();
            this.updatePosition();
            if (this._svActorSprite) {
                this._svActorSprite.update();
            }
            this.updateEffect();
            this.updateSelectionEffect();
        }
        else {
            _Sprite_Enemy_update.call(this);
        }
    };
    // NUUN_ButlerHPGauge用のメソッド追加
    Sprite_Enemy.prototype.getBattlerOverlayHeight = function () {
        if (this._isSvActorEnemy && this._svActorSprite) {
            // SVアクタースプライトの高さを返す
            return this._svActorSprite.height || 64;
        }
        // 通常の敵の高さ
        return this.bitmap ? this.bitmap.height : 0;
    };
    Sprite_Enemy.prototype.getBattlerOverlayConflict = function () {
        return 1; // スケール値
    };
    // --------------------------------------------------------------------------
    // Sprite_SvActor（独自）- 重複削除と修正
    function Sprite_SvActor() {
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
    const _Sprite_SvActor_setup = Sprite_SvActor.prototype.setup;
    Sprite_SvActor.prototype.setup = function (battler) {
        // 同じバトラーで再セットアップされる場合をチェック
        if (this._battler === battler && this._setupComplete) {
            console.log('Same battler already setup, skipping');
            return;
        }
        console.log('Sprite_SvActor setup with:', battler ? battler.name() : 'null');
        this._battler = battler;
        this._setupComplete = true;
        this.refreshBitmap();
        console.log('Setup: calling startMotion(wait)');
        this.startMotion('wait');
        if (this._stateSprite && battler) {
            this._stateSprite.setup(battler);
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
    // --------------------------------------------------------------------------
    // メインのモーション制御（重複削除）
    Sprite_SvActor.prototype.startMotion = function (motionType) {
        console.log('SvActor startMotion called:', motionType);
        // BattleMotionMZの存在チェック
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.MOTIONS &&
            typeof Sprite_Battler.prototype.startMotion === 'function';
        if (hasBattleMotionMZ) {
            console.log('Using BattleMotionMZ motions');
            motionType = this.remakeDeadMotion(motionType);
            var newMotion = Sprite_Battler.MOTIONS[motionType];
            if (!newMotion) {
                console.log('Motion not found in BattleMotionMZ:', motionType, 'using wait');
                motionType = 'wait';
                newMotion = Sprite_Battler.MOTIONS[motionType];
            }
            if (!this._motion || this._motion.index !== newMotion.index) {
                this.setupMotionForBattleMotionMZ();
                this.setupValue(motionType);
            }
        }
        else {
            console.log('Using default Sprite_Actor motions');
            // 通常のSprite_Actorの処理
            const newMotion = Sprite_Actor.MOTIONS[motionType];
            if (newMotion) {
                if (!this._motion || this._motion !== newMotion) {
                    this._motion = newMotion;
                    this._motionCount = 0;
                    this._pattern = 0;
                    console.log('Default motion started:', motionType, 'motion:', this._motion);
                }
            }
            else {
                console.log('Motion not found in default:', motionType, 'using wait');
                if (motionType !== 'wait') {
                    this.startMotion('wait');
                }
            }
        }
    };
    Sprite_SvActor.prototype.forceMotion = function (motionType) {
        console.log('SvActor forceMotion called:', motionType);
        if (typeof Sprite_Battler !== 'undefined' &&
            Sprite_Battler.MOTIONS &&
            Sprite_Battler.prototype.forceMotion) {
            // BattleMotionMZの処理
            motionType = this.remakeDeadMotion(motionType);
            this.setupMotionForBattleMotionMZ();
            this.setupValue(motionType);
        }
        else {
            // 通常の処理
            this._motion = null;
            this.startMotion(motionType);
        }
    };
    // BattleMotionMZ用のモーション初期化（メソッド名を変更）
    Sprite_SvActor.prototype.setupMotionForBattleMotionMZ = function () {
        if (!this._motion) {
            this._motion = { index: 0, loop: true, speed: 12 };
        }
    };
    // BattleMotionMZ用のメソッドを条件付きで適用
    Sprite_SvActor.prototype.setupValue = function (motionType) {
        const motions = typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS
            ? Sprite_Battler.MOTIONS
            : Sprite_Actor.MOTIONS;
        if (!motions[motionType]) {
            console.log('Motion type not found:', motionType, 'using wait');
            motionType = 'wait';
        }
        if (!motions[motionType]) {
            console.log('Wait motion also not found, creating default');
            this._motion = { index: 1, loop: true, speed: 12 };
            return;
        }
        this._motion.index = motions[motionType].index;
        this._motion.loop = motions[motionType].loop;
        this._motion.speed = motions[motionType].speed;
        this._motionCount = 0;
        this._pattern = 0;
        // BattleMotionMZ特有のプロパティ（BattleMotionMZがある場合のみ）
        if (typeof Sprite_Battler !== 'undefined' && Sprite_Battler.MOTIONS) {
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
        console.log('setupValue completed for:', motionType, this._motion);
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
    // --------------------------------------------------------------------------
    // 更新処理
    Sprite_SvActor.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (this._battler) {
            this.updateBitmap();
            this.updateFrame();
            this.updateMotion();
            this.updateStateSprite();
            // モーションリフレッシュの処理
            if (this._battler._motionRefresh) {
                this.refreshMotion();
                this._battler._motionRefresh = false;
            }
            // NUUN_ButlerHPGauge対応
            if (typeof this.updateHpGauge === 'function') {
                this.updateHpGauge();
            }
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
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            this.cs &&
            typeof Sprite_Battler.prototype.updateFrame === 'function';
        if (hasBattleMotionMZ && this._mainSprite) {
            console.log('Using BattleMotionMZ updateFrame');
            // BattleMotionMZ処理
            const bitmap = this._mainSprite.bitmap;
            if (!bitmap || !bitmap.isReady())
                return;
            if (this.getRemake &&
                this.getRemake() === true &&
                bitmap.isReady()) {
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
        }
        else {
            // デフォルト処理
            const bitmap = this._mainSprite.bitmap;
            if (bitmap && bitmap.isReady()) {
                const motionIndex = this._motion ? this._motion.index : 0;
                const pattern = this._pattern;
                const cw = bitmap.width / 9;
                const ch = bitmap.height / 6;
                const cx = Math.floor(motionIndex / 2) * 3 + pattern;
                const cy = motionIndex % 2;
                this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
                // フレーム更新時のデバッグログを削減
                if (this._pattern % 4 === 0) {
                    // 4フレームごとにログ
                    console.log('Frame updated:', {
                        motion: this._motion?.index,
                        pattern: this._pattern,
                        frame: [cx * cw, cy * ch, cw, ch],
                    });
                }
            }
        }
    };
    Sprite_SvActor.prototype.updateMotion = function () {
        const hasBattleMotionMZ = typeof Sprite_Battler !== 'undefined' &&
            this.updateMotionCount &&
            typeof Sprite_Battler.prototype.updateMotionCount === 'function';
        if (hasBattleMotionMZ) {
            // BattleMotionMZの処理
            this.updateMotionCount();
        }
        else {
            // デフォルトの処理（修正版）
            if (this._motion && ++this._motionCount >= this.motionSpeed()) {
                if (this._motion.loop) {
                    this._pattern = (this._pattern + 1) % 4;
                }
                else {
                    if (this._pattern < 2) {
                        this._pattern++;
                    }
                    else {
                        // 非ループモーション終了時の処理
                        this.refreshMotion();
                    }
                }
                this._motionCount = 0;
                console.log('Motion updated - pattern:', this._pattern, 'motion:', this._motion.index);
            }
        }
    };
    Sprite_SvActor.prototype.motionSpeed = function () {
        if (this._motion && this._motion.speed) {
            return this._motion.speed;
        }
        return this.speed || 12;
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
    // refreshMotion の修正
    Sprite_SvActor.prototype.refreshMotion = function () {
        if (!this._battler)
            return;
        console.log('SvActor refreshMotion called');
        // ダメージモーションの優先処理
        if (this._battler._motionType) {
            console.log('Playing damage motion:', this._battler._motionType);
            this.startMotion(this._battler._motionType);
            this._battler._motionType = null;
            return;
        }
        // 状態に基づくモーション
        const stateMotion = this._battler.stateMotionIndex();
        console.log('State motion index:', stateMotion);
        if (stateMotion === 3) {
            this.startMotion('dead');
        }
        else if (stateMotion === 2) {
            this.startMotion('sleep');
        }
        else if (this._battler.isChanting()) {
            this.startMotion('chant');
        }
        else if (this._battler.isGuard() || this._battler.isGuardWaiting()) {
            this.startMotion('guard');
        }
        else if (stateMotion === 1) {
            this.startMotion('abnormal');
        }
        else {
            this.startMotion('wait');
        }
    };
    Sprite_SvActor.prototype.getBattlerOverlayHeight = function () {
        return this.height || 64;
    };
    Sprite_SvActor.prototype.getBattlerOverlayConflict = function () {
        return 1;
    };
    // SVアクター用のHPゲージメソッドをコピー
    if (typeof Sprite_Enemy.prototype.updateHpGauge === 'function') {
        Sprite_SvActor.prototype.updateHpGauge = function () {
            if (!this._battler ||
                this.noHpGaugePosition() ||
                this.noHpGauge()) {
                return;
            }
            if (this.parent && this.parent.battlerOverlay && !this._battlerHp) {
                this.createHPGauge();
            }
            this.setHpGaugePosition();
        };
        Sprite_SvActor.prototype.noHpGaugePosition = function () {
            return this._battler.isEnemy(); // 敵として扱うのでHPゲージ表示
        };
        Sprite_SvActor.prototype.noHpGauge = function () {
            return this._battler.enemy().meta.NoHPGauge;
        };
        Sprite_SvActor.prototype.createHPGauge = function () {
            // NUUN_ButlerHPGaugeの実装に合わせる
            if (typeof getSplit === 'function') {
                // グローバルのenemyHPGaugeLengthを設定
                window.enemyHPGaugeLength = getSplit(this._battler.enemy().meta.HPGaugeLength);
            }
            else {
                // getSplitがない場合のフォールバック
                const meta = this._battler.enemy().meta.HPGaugeLength;
                window.enemyHPGaugeLength = meta ? meta.split(',') : null;
            }
            const sprite = new Sprite_EnemyHPGauge();
            this.parent.battlerOverlay.addChild(sprite);
            this._battlerHp = sprite;
            sprite.setup(this._battler, 'hp');
            sprite.show();
            sprite.move(0, 0);
            $gameTemp.enemyHPGaugeRefresh = true;
        };
        Sprite_SvActor.prototype.setHpGaugePosition = function () {
            if (this._battlerHp) {
                const enemy = this._battler.enemy();
                const x = (enemy.meta.HPGaugeX ? Number(enemy.meta.HPGaugeX) : 0) +
                    (typeof Gauge_X !== 'undefined' ? Gauge_X : 0) +
                    this._battler.getHPGaugePositionX();
                const y = (enemy.meta.HPGaugeY ? Number(enemy.meta.HPGaugeY) : 0) +
                    (typeof Gauge_Y !== 'undefined' ? Gauge_Y : 0) +
                    this._battler.getHPGaugePositionY();
                this._battlerHp.x = x;
                this._battlerHp.y = y - this.getBattlerHpPosition();
            }
        };
        Sprite_SvActor.prototype.getBattlerHpPosition = function () {
            const scale = this.getBattlerOverlayConflict();
            const HPPosition = typeof window.HPPosition !== 'undefined'
                ? window.HPPosition
                : 0;
            if (HPPosition === 0) {
                return this.getBattlerOverlayHeight() * scale;
            }
            else if (HPPosition === 2) {
                return Math.floor((this.getBattlerOverlayHeight() * scale) / 2);
            }
            else {
                return 0;
            }
        };
    }
    // getSplit関数がグローバルに存在しない場合のフォールバック
    if (typeof getSplit === 'undefined') {
        window.getSplit = function (tag) {
            return tag ? tag.split(',') : null;
        };
    }
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
                console.log('Migrated method:', methodName);
            }
        });
        // updateMotionCountは条件付きで移植
        if (Sprite_Battler.prototype.updateMotionCount) {
            Sprite_SvActor.prototype.updateMotionCount =
                Sprite_Battler.prototype.updateMotionCount;
        }
    }
    // サイズプロパティ
    Object.defineProperty(Sprite_SvActor.prototype, 'width', {
        get: function () {
            const bitmap = this._mainSprite.bitmap;
            return bitmap ? bitmap.width / 9 : 0;
        },
        configurable: true,
    });
    Object.defineProperty(Sprite_SvActor.prototype, 'height', {
        get: function () {
            const bitmap = this._mainSprite.bitmap;
            return bitmap ? bitmap.height / 6 : 0;
        },
        configurable: true,
    });
})();
