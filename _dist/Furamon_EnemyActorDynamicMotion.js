//------------------------------------------------------------------------------
// Furamon_EnemyActorDynamicMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
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
    const pluginName = 'Furamon_EnemyActorDynamicMotion';
    // NRP_DynamicMotionMZが存在するかチェック
    const existNRP_DynamicMotionMZ = PluginManager._scripts.some(function (scriptName) {
        return scriptName.includes('NRP_DynamicMotionMZ');
    });
    if (!existNRP_DynamicMotionMZ) {
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
     * NRP_DynamicMotionMZが参照するweapons()メソッドが存在しないためのダミー実装
     */
    Game_Enemy.prototype.weapons = function () {
        // SVアクター敵の場合のみダミーの武器配列を返す
        if (isSvActorEnemy(this)) {
            // 空の武器を返すか、デフォルトの武器タイプを設定
            return [
                {
                    wtypeId: 1, // 剣のデフォルト武器タイプID
                },
            ];
        }
        // 通常の敵の場合は空配列を返す
        return [];
    };
    /**
     * ●SVアクター敵用のweaponメソッドも追加（単数形）
     */
    Game_Enemy.prototype.weapon = function () {
        if (isSvActorEnemy(this)) {
            return {
                wtypeId: 1, // 剣のデフォルト武器タイプID
            };
        }
        return null;
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
