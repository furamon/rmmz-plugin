//------------------------------------------------------------------------------
// Furamon_EnemyActorDynamicMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/06/17 1.0.0 公開！
// 2025/06/20 1.1.0 NRP_EnemyCollapse対応
/*:
 * @target MZ
 * @plugindesc 敵キャラのDynamicMotion対応パッチ
 * @author Furamon
 * @base Furamon_EnemyActorAnimation
 * @orderAfter Furamon_EnemyActorAnimation
 * @base NRP_DynamicMotionMZ
 * @orderAfter NRP_DynamicMotionMZ
 * @help SVアクター敵キャラをDynamicMotionに対応させます。
 *
 * NRP_DynamicMotionMZとFuramon_EnemyActorAnimationが必要です。
 *
 * 使用順序：
 * 1. NRP_DynamicAnimationMZ
 * 2. NRP_DynamicMotionMZ
 * 3. Furamon_EnemyActorAnimation
 * 4. このプラグイン（Furamon_EnemyActorDynamicMotion）
 */
(function () {
    ('use strict');
    const PLUGIN_NAME = 'Furamon_EnemyActorDynamicMotion';
    const parameters = PluginManager.parameters(PLUGIN_NAME);
    // NRP_DynamicMotionMZが存在するかチェック
    const existNRP_DynamicMotionMZ = PluginManager._scripts.some(function (scriptName) {
        return scriptName.includes('NRP_DynamicMotionMZ');
    });
    if (!existNRP_DynamicMotionMZ) {
        console.warn('[Furamon] NRP_DynamicMotionMZ is required for EnemyActorDynamicMotion');
        return;
    }
    // NRP_EnemyCollapseのプラグインパラメータ取得
    const prmEnemyCollapse = PluginManager._scripts.includes('NRP_EnemyCollapse') &&
        PluginManager.parameters('NRP_EnemyCollapse');
    // SVアクター敵かどうかを判定する関数
    function isSvActorEnemy(battler) {
        if (!battler || !(battler instanceof Game_Enemy)) {
            return false;
        }
        const enemy = battler.enemy();
        if (!enemy || !enemy.meta) {
            return false;
        }
        const fileName = enemy.meta['SVActor'] || enemy.meta['SVアクター'] || null;
        return !!fileName;
    }
    /**
     * ●SVキャラクターモーションの実行（敵版）
     */
    Sprite_Enemy.prototype.startDynamicSvMotion = function (dynamicMotion) {
        // SVアクター敵でなければ何もしない
        if (!this._isSvActorEnemy ||
            !this._svActorSprite ||
            !dynamicMotion.motion) {
            return;
        }
        const bm = dynamicMotion.baseMotion;
        const dm = dynamicMotion;
        // eval参照用
        const a = dm.referenceSubject;
        const subject = bm.getReferenceSubject();
        const b = dm.referenceTarget;
        const repeat = dm.repeat;
        const r = dm.r;
        // SVアクタースプライトに対してモーション設定
        const svSprite = this._svActorSprite;
        // モーションリセット
        svSprite._motionCount = 0;
        svSprite._pattern = 0;
        // モーション時間
        svSprite._motionDuration = dm.motionDuration;
        // モーションパターン
        svSprite._motionPattern = dm.motionPattern;
        // モーション開始パターン
        if (dm.motionStartPattern != undefined) {
            svSprite._motionStartPattern = eval(dm.motionStartPattern);
        }
        // 敵キャラクターには武器がないため、デフォルト値を設定
        let weaponId = 0;
        let weaponType = 0;
        // 武器関連の処理（敵キャラクターなのでデフォルト値を使用）
        if (dm.weaponId) {
            try {
                weaponId = eval(dm.weaponId) || 0;
            }
            catch (e) {
                weaponId = 0;
            }
        }
        if (dm.weaponType) {
            try {
                weaponType = eval(dm.weaponType) || 0;
            }
            catch (e) {
                weaponType = 0;
            }
        }
        // DynamicMotionのモーションをSVアクタースプライトに適用
        if (dm.motion) {
            // 武器を使用するかどうかの判定
            if (dm.isUseWeapon && dm.isUseWeapon()) {
                // 武器使用時の処理
                this._battler.performAttackDynamicMotion(weaponId, weaponType);
            }
            else {
                // 武器非使用時は直接モーションを設定
                if (svSprite._weaponSprite) {
                    svSprite._weaponSprite._weaponImageId = 0;
                    svSprite._weaponSprite.updateFrame();
                }
                // DynamicMotionで指定されたモーションを開始
                svSprite.startMotion(dm.motion);
            }
        }
    };
    /**
     * ●SVアクター敵のスプライト用motionSpeedメソッド
     */
    const _Sprite_Enemy_motionSpeed = Sprite_Enemy.prototype.motionSpeed;
    Sprite_Enemy.prototype.motionSpeed = function () {
        // SVアクター敵の場合はアクターと同じモーション速度を使用
        if (this._isSvActorEnemy && this._svActorSprite) {
            return this._svActorSprite.motionSpeed
                ? this._svActorSprite.motionSpeed()
                : 12;
        }
        return _Sprite_Enemy_motionSpeed
            ? _Sprite_Enemy_motionSpeed.call(this)
            : 12;
    };
    /**
     * ●敵キャラクター用のperformAttackDynamicMotionメソッド
     */
    Game_Enemy.prototype.performAttackDynamicMotion = function (weaponId, weaponType) {
        // 敵キャラクターには武器がないため、基本的なモーション処理のみ
        const sprite = getBattlerSprite(this);
        if (sprite && sprite._svActorSprite) {
            const svSprite = sprite._svActorSprite;
            // 武器表示は無効化
            if (svSprite._weaponSprite) {
                svSprite._weaponSprite._weaponImageId = 0;
                svSprite._weaponSprite.updateFrame();
            }
            // 攻撃モーションを開始
            svSprite.startMotion('thrust'); // デフォルトの攻撃モーション
            svSprite.updateFrame();
        }
    };
    /**
     * 以下NRP_EnemyCollapse借用（まいど）
     */
    let prmCollapseList = [];
    let prmDefaultCollapseId = '';
    let prmDefaultBossCollapseId = '';
    if (prmEnemyCollapse) {
        // CollapseListはstructの配列なので、二重パースが必要
        const collapseListParam = prmEnemyCollapse['CollapseList'] || '[]';
        const parsedArray = JSON.parse(collapseListParam);
        prmCollapseList = parsedArray.map((item) => JSON.parse(item));
        prmDefaultCollapseId = prmEnemyCollapse['DefaultCollapseId'] || '';
        prmDefaultBossCollapseId =
            prmEnemyCollapse['DefaultBossCollapseId'] || '';
    }
    /**
     * ●独自の消滅データを取得するメソッド
     */
    Game_Enemy.prototype.originalCollapseData = function () {
        // 演出の指定があった場合
        const originalCollapseId = this.originalCollapseId();
        if (originalCollapseId != null) {
            // 条件を満たす消滅データを取得
            const foundData = prmCollapseList.find((collapseData) => collapseData.Id == originalCollapseId);
            return foundData;
        }
        return null;
    };
    /**
     * ●SVアクター敵の独自消滅演出処理
     */
    const _Sprite_Enemy_startOriginalCollapse = Sprite_Enemy.prototype.startOriginalCollapse;
    Sprite_Enemy.prototype.startOriginalCollapse = function () {
        // SVアクター敵の場合は完全に独自処理
        if (this._isSvActorEnemy && this._svActorSprite) {
            const collapseData = this._battler.originalCollapseData();
            if (collapseData) {
                this.startSvActorOriginalCollapse();
                return; // 元の処理をスキップ
            }
        }
        // 通常の敵の場合のみ元の処理を呼び出し
        if (_Sprite_Enemy_startOriginalCollapse) {
            _Sprite_Enemy_startOriginalCollapse.call(this);
        }
    };
    /**
     * ●SVアクター敵用の独自消滅演出開始
     */
    Sprite_Enemy.prototype.startSvActorOriginalCollapse = function () {
        // eval参照用
        const a = this._battler;
        const collapseData = this._battler.originalCollapseData();
        if (!collapseData)
            return;
        const duration = eval(collapseData.Duration);
        this._effectDuration = duration || 32;
        this._appeared = false;
        // SVアクタースプライトの初期化
        if (this._svActorSprite) {
            this._svActorSprite._collapsing = true;
            this._svActorSprite._collapseData = collapseData;
            if (collapseData.CollapseType === 'Sink') {
                this._svActorSprite._svSinkCollapse = true;
                this._svActorSprite._svOriginalHeight =
                    this._svActorSprite.height;
            }
        }
        // DynamicAnimation&Motion実行
        if (collapseData.DynamicId) {
            const dynamicId = eval(collapseData.DynamicId);
            if (dynamicId && typeof callDynamic === 'function') {
                callDynamic(this, dynamicId);
            }
        }
        // スクリプトの実行
        if (collapseData.Script != null && collapseData.Script !== '') {
            eval(collapseData.Script);
        }
    };
    /**
     * ●SVアクター敵の独自消滅演出更新
     */
    const _Sprite_Enemy_updateOriginalCollapse = Sprite_Enemy.prototype.updateOriginalCollapse;
    Sprite_Enemy.prototype.updateOriginalCollapse = function () {
        // SVアクター敵の場合は独自処理
        if (this._isSvActorEnemy && this._svActorSprite) {
            const collapseData = this._battler.originalCollapseData();
            if (collapseData) {
                this.updateSvActorOriginalCollapse();
                return; // 元の処理をスキップ
            }
        }
        // 通常の敵の場合は元の処理を呼び出し
        if (_Sprite_Enemy_updateOriginalCollapse) {
            _Sprite_Enemy_updateOriginalCollapse.call(this);
        }
    };
    /**
     * ●SVアクター敵用の独自消滅演出更新
     */
    Sprite_Enemy.prototype.updateSvActorOriginalCollapse = function () {
        const collapseData = this._battler.originalCollapseData();
        if (!collapseData)
            return;
        // 消さない場合
        if (collapseData.CollapseType == 'None') {
            return;
        }
        const effectDuration = Math.floor(this._effectDuration);
        const svSprite = this._svActorSprite;
        // SVアクタースプライトに効果を適用
        if (svSprite) {
            // 振動
            const shakeStrength = eval(collapseData.ShakeStrength) || 0;
            svSprite._shake =
                effectDuration % 2 == 0 ? -shakeStrength : shakeStrength;
            // 合成方法
            const blendMode = eval(collapseData.BlendMode) || 1;
            svSprite.blendMode = blendMode;
            // 色調
            const blendColor = eval(collapseData.BlendColor) || [
                255, 128, 128, 128,
            ];
            svSprite.setBlendColor(blendColor);
            // 透明度の変更
            svSprite.opacity *=
                this._effectDuration / (this._effectDuration + 1);
            // 沈む処理
            if (collapseData.CollapseType == 'Sink') {
                const duration = eval(collapseData.Duration);
                const progress = 1 - this._effectDuration / duration;
                // SVアクタースプライトの _mainSprite を対象にする
                const mainSprite = svSprite._mainSprite;
                if (mainSprite &&
                    mainSprite.bitmap &&
                    mainSprite.bitmap.isReady()) {
                    // 初期Y座標を保存
                    if (!svSprite._originalY) {
                        svSprite._originalY = svSprite.y;
                    }
                    // 現在のフレーム情報を取得
                    const currentFrame = mainSprite._frame || {
                        x: 0,
                        y: 0,
                        width: mainSprite.bitmap.width / 9,
                        height: mainSprite.bitmap.height / 6,
                    };
                    // 下からマスクする高さを計算
                    const sinkHeight = currentFrame.height * progress;
                    const visibleHeight = currentFrame.height - sinkHeight;
                    // フレームを下からカットして上部のみ表示
                    if (visibleHeight > 0) {
                        mainSprite.setFrame(currentFrame.x, currentFrame.y, // Y座標はそのまま（上から表示）
                        currentFrame.width, visibleHeight // 高さを減らして下をカット
                        );
                    }
                    else {
                        // 完全に沈んだ場合は非表示
                        mainSprite.setFrame(currentFrame.x, currentFrame.y, currentFrame.width, 0);
                    }
                }
                else {
                    console.warn('MainSprite bitmap not ready');
                }
            }
        }
        // 効果音２
        if (collapseData.Sound2 && collapseData.Sound2Interval) {
            const sound2Interval = eval(collapseData.Sound2Interval);
            if (effectDuration % sound2Interval === sound2Interval - 1) {
                AudioManager.playSe({
                    name: collapseData.Sound2,
                    volume: 90,
                    pitch: 100,
                    pan: 0,
                });
            }
        }
    };
    /**
     * ●SVアクター敵の消滅演出用フレーム更新
     */
    Sprite_Enemy.prototype.updateSvActorCollapseFrame = function () {
        const collapseData = this._battler.originalCollapseData();
        if (!collapseData || !this._svActorSprite) {
            return;
        }
        // 基本的なフレーム更新を先に実行
        if (this._svActorSprite.updateFrame) {
            this._svActorSprite.updateFrame();
        }
        // 沈む場合の追加処理
        if (collapseData.CollapseType == 'Sink') {
            const duration = eval(collapseData.Duration);
            const progress = 1 - this._effectDuration / duration;
            const svSprite = this._svActorSprite;
            const mainSprite = svSprite._mainSprite;
            if (mainSprite &&
                mainSprite.bitmap &&
                mainSprite.bitmap.isReady()) {
                // 初期Y座標を保存
                if (!svSprite._originalY) {
                    svSprite._originalY = svSprite.y;
                }
                // 現在のフレーム情報を取得（モーション更新後の情報）
                const currentFrame = mainSprite._frame;
                if (currentFrame) {
                    const sinkHeight = currentFrame.height * progress;
                    const visibleHeight = currentFrame.height - sinkHeight;
                    // 下からマスクして上部のみ表示
                    if (visibleHeight > 0) {
                        mainSprite.setFrame(currentFrame.x, currentFrame.y, currentFrame.width, visibleHeight);
                    }
                }
            }
        }
    };
    // SVアクター敵のスプライトを取得する汎用関数
    function getBattlerSprite(battler) {
        if (!battler || !$gameParty.inBattle()) {
            return undefined;
        }
        const spriteset = BattleManager._spriteset;
        if (!spriteset) {
            return undefined;
        }
        const sprites = spriteset.battlerSprites();
        return sprites.find((s) => s._battler === battler);
    }
    // DynamicAnimation&Motionを呼び出し(NRP様から拝借)
    function callDynamic(sprite, dynamicId) {
        const battler = sprite._battler;
        // 実行するDynamicAnimation情報を持ったアクション
        const dynamicAction = makeAction(dynamicId, battler, false);
        // バトラーを対象にする。
        const targets = [battler];
        // 引き継ぎたい情報をセット
        const mapAnimation = makeMapAnimationEvent(battler, dynamicId, dynamicAction);
        // バトラーを行動主体にする。
        mapAnimation.subject = battler;
        // ウェイトしないように並列実行
        mapAnimation.isParallel = true;
        // 空のWindow_BattleLogを作成し、DynamicAnimationを起動
        const win = new Window_BattleLog(new Rectangle(0, 0, 0, 0));
        win.showDynamicAnimation(targets, dynamicAction, false, mapAnimation);
    }
    function makeAction(itemId, battleSubject, isItem) {
        // 適当に先頭のキャラを行動主体にしてアクションを作成
        // ※行動主体の情報は基本的に使わないので実際はほぼダミー
        let subject = $gameParty.members()[0];
        if (battleSubject) {
            subject = battleSubject;
        }
        const action = new Game_Action(subject);
        // アイテムかスキルかで分岐
        if (isItem) {
            action.setItem(itemId);
        }
        else {
            action.setSkill(itemId);
        }
        return action;
    }
    function makeMapAnimationEvent(event, skillId, action) {
        // 始点となる行動主体
        const subject = event;
        // 引き継ぎたい情報をセット
        const mapAnimation = [];
        mapAnimation.subject = subject;
        mapAnimation.noWait = false;
        mapAnimation.onScroll = true;
        mapAnimation.isDynamicAuto = true;
        mapAnimation.skillId = skillId;
        mapAnimation.isParallel = true;
        // 開始時間の設定
        if (typeof window.setStartTiming === 'function') {
            window.setStartTiming(mapAnimation, action, event);
        }
        return mapAnimation;
    }
})();
