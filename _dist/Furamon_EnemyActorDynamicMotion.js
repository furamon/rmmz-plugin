//------------------------------------------------------------------------------
// Furamon_EnemyActorDynamicMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc 敵キャラのDynamicMotion対応パッチ
 * @author Furamon
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
    const pluginName = 'Furamon_EnemyActorDynamicMotion';
    // NRP_DynamicMotionMZが存在するかチェック
    const NRP_DMMZ = PluginManager._scripts.some(function (scriptName) {
        return scriptName.includes('NRP_DynamicMotionMZ');
    });
    if (!NRP_DMMZ) {
        console.warn('[Furamon] NRP_DynamicMotionMZ is required for EnemyActorDynamicMotion');
        return;
    }
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
    const _Game_Enemy_initMembers = Game_Enemy.prototype.initMembers;
    Game_Enemy.prototype.initMembers = function () {
        _Game_Enemy_initMembers.call(this);
        this._isDynamicMotionActive = false; // DynamicMotion実行中フラグ
        this._dynamicMotionEndTime = 0; // DynamicMotion終了予定時刻
        this._dynamicMotionCheckInterval = null; // 終了チェック用タイマー
    };
    Game_Enemy.prototype.startDynamicMotion = function (motion, duration = 60) {
        if (isSvActorEnemy(this)) {
            this._isDynamicMotionActive = true;
            // this._dynamicMotionEndTime = Graphics.frameCount + duration;
            // // 定期的な終了チェックを開始
            // this.startDynamicMotionEndCheck();
            // 最高優先度でDynamicMotionを要求
            this.requestMotion(motion, MOTION_PRIORITY.DYNAMIC_MOTION, duration);
        }
    };
    Game_Enemy.prototype.checkDynamicMotionEnd = function () {
        if (!this._isDynamicMotionActive)
            return;
        const currentFrame = Graphics.frameCount;
        const shouldEnd = this._dynamicMotionEndTime > 0 &&
            currentFrame >= this._dynamicMotionEndTime;
        if (shouldEnd) {
            console.log(`DynamicMotion should end: ${currentFrame} >= ${this._dynamicMotionEndTime}`);
            this.endDynamicMotion();
        }
    };
    // DynamicMotion終了処理を強化
    Game_Enemy.prototype.endDynamicMotion = function () {
        if (this._isDynamicMotionActive) {
            console.log('DynamicMotion ended');
            this._isDynamicMotionActive = false;
            this._dynamicMotionEndTime = 0;
            // チェック用タイマーをクリア
            this.clearDynamicMotionEndCheck();
            // SVスプライト側の状態もリセット
            const sprite = getBattlerSprite(this);
            if (sprite && sprite._svActorSprite) {
                sprite._svActorSprite._isDynamicMotion = false;
                sprite._svActorSprite._dynamicMotionDuration = 0;
                sprite._svActorSprite._dynamicMotionStartTime = 0;
                console.log('SVSprite DynamicMotion state cleared');
            }
            // 優先度をリセットして次のモーションを決定
            if (this._motionPriority === MOTION_PRIORITY.DYNAMIC_MOTION) {
                this._motionPriority = MOTION_PRIORITY.NEUTRAL;
                console.log('Resetting motion priority, determining next motion');
                // 少し遅らせて確実に処理
                setTimeout(() => {
                    this.determineNextMotion();
                }, 50);
            }
        }
    };
    // DynamicMotion終了チェックをクリア
    Game_Enemy.prototype.clearDynamicMotionEndCheck = function () {
        if (this._dynamicMotionCheckInterval) {
            clearInterval(this._dynamicMotionCheckInterval);
            this._dynamicMotionCheckInterval = null;
        }
    };
    const _Game_Enemy_updateMotionSystem = Game_Enemy.prototype.updateMotionSystem;
    Game_Enemy.prototype.updateMotionSystem = function () {
        // DynamicMotion終了チェックを実行
        if (this._isDynamicMotionActive) {
            this.checkDynamicMotionEnd();
        }
        if (_Game_Enemy_updateMotionSystem) {
            _Game_Enemy_updateMotionSystem.call(this);
        }
    };
    // バトル終了時の整理処理を追加
    const _Game_Enemy_onBattleEnd = Game_Enemy.prototype.onBattleEnd;
    Game_Enemy.prototype.onBattleEnd = function () {
        if (_Game_Enemy_onBattleEnd) {
            _Game_Enemy_onBattleEnd.call(this);
        }
        // DynamicMotion関連の状態をクリア
        this._isDynamicMotionActive = false;
        this._dynamicMotionEndTime = 0;
        this.clearDynamicMotionEndCheck();
    };
    const _Game_Enemy_determineNextMotion = Game_Enemy.prototype.determineNextMotion;
    Game_Enemy.prototype.determineNextMotion = function () {
        // DynamicMotion実行中は何もしない
        if (this._isDynamicMotionActive) {
            console.log('DynamicMotion active, skipping motion determination');
            return;
        }
        console.log('Determining next motion after DynamicMotion');
        // 通常のモーション決定処理
        if (_Game_Enemy_determineNextMotion) {
            _Game_Enemy_determineNextMotion.call(this);
        }
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
            // DynamicMotionとして攻撃モーションを開始
            this.startDynamicMotion('thrust', 40);
            svSprite.startMotion('thrust');
            svSprite._isDynamicMotion = true;
            svSprite._dynamicMotionDuration = 40;
            svSprite._dynamicMotionStartTime = Graphics.frameCount;
            // this.startDynamicMotionEndCheck();
            svSprite.updateFrame();
        }
    };
    /**
     * ●SVアクター敵用のattackSkillIdメソッド
     */
    const _Game_Enemy_attackSkillId = Game_Enemy.prototype.attackSkillId;
    Game_Enemy.prototype.attackSkillId = function () {
        // SVアクター敵の場合はアクターと同じように通常攻撃スキルIDを返す
        if (isSvActorEnemy(this)) {
            return this._battlerName ? 1 : _Game_Enemy_attackSkillId.call(this);
        }
        return _Game_Enemy_attackSkillId.call(this);
    };
    /**
     * ●SVアクター敵用のweaponsメソッドを追加
     */
    Game_Enemy.prototype.weapons = function () {
        if (isSvActorEnemy(this)) {
            return [{ wtypeId: 1 }];
        }
        return [];
    };
    /**
     * ●SVアクター敵用のweaponメソッドも追加（単数形）
     */
    Game_Enemy.prototype.weapon = function () {
        if (isSvActorEnemy(this)) {
            return { wtypeId: 1 };
        }
        return null;
    };
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
        console.log('startDynamicSvMotion called:', dynamicMotion.motion);
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
        // モーション時間を取得（デフォルト値を設定）
        let motionDuration = 60; // デフォルト1秒
        if (dm.motionDuration !== undefined && dm.motionDuration > 0) {
            motionDuration = dm.motionDuration;
        }
        // DynamicMotionで時間指定がない場合のフォールバック
        else if (dm.motion === 'escape') {
            motionDuration = 90; // escapeは少し長めに
        }
        console.log(`DynamicMotion duration set to: ${motionDuration} frames`);
        // SVアクタースプライト用のDynamicMotionプロパティ設定
        svSprite._motionDuration = motionDuration;
        // モーションパターン
        if (dm.motionPattern !== undefined) {
            svSprite._motionPattern = dm.motionPattern;
        }
        // モーション開始パターン
        if (dm.motionStartPattern !== undefined) {
            try {
                svSprite._motionStartPattern = eval(dm.motionStartPattern);
            }
            catch (e) {
                svSprite._motionStartPattern = 0;
            }
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
        // バトラー側でDynamicMotion開始を通知
        if (this._battler && this._battler.startDynamicMotion) {
            this._battler.startDynamicMotion(dm.motion, motionDuration);
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
                // DynamicMotionで指定されたモーションを直接SVスプライトで開始
                console.log(`Starting DynamicMotion: ${dm.motion}`);
                svSprite.startMotion(dm.motion);
                // DynamicMotion固有のプロパティをSVスプライトに設定
                svSprite._isDynamicMotion = true;
                svSprite._dynamicMotionDuration = motionDuration;
                svSprite._dynamicMotionStartTime = Graphics.frameCount;
                // // SVスプライト側でも終了チェックを開始
                // svSprite.startDynamicMotionEndCheck();
            }
        }
        if (this._battler && this._battler.startDynamicMotion) {
            this._battler.startDynamicMotion(dm.motion, motionDuration);
        }
        // DynamicMotionで指定されたモーションを直接SVスプライトで開始
        if (dm.motion) {
            console.log(`Starting DynamicMotion: ${dm.motion}`);
            svSprite.startMotion(dm.motion);
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
    //--------------------------------------------------------------------------
    // ヘルパー関数
    //--------------------------------------------------------------------------
    /**
     * ●指定した敵のスプライトを取得する
     */
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
})();
