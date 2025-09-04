//------------------------------------------------------------------------------
// Furamon_SVSheetWeapon.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
// 2025/08/10 1.0.0-Beta 仮作成
// 2025/08/27 1.1.0-Beta モーション毎に武器画像を変更する機能、メニュー画面で武器を描画しない機能(NUUN_MenuScreenEX用)を追加
// 2025/09/04 1.1.1-Beta 余分な武器スプライトを消した

/*:
 * @target MZ
 * @plugindesc SVアクターに武器スプライトシートを表示します。
 * @author Furamon
 * @orderAfter BattleMotionMZ
 * @help サイドビューアクターに、アクターのスプライトと同じ規格の
 * スプライトシートを使って武器を表示します。
 * 武器のスプライトシートを `img/sv_weapons/` フォルダに配置してください。
 *
 * 武器に武器画像を紐づけるには、データベースの武器のメモ欄に
 * 以下の書式で記述してください:
 *   <SVWeapon:ファイル名>
 *
 * "ファイル名"の部分を`img/sv_weapons/`フォルダ内の
 * 画像ファイル名（拡張子なし）に置き換えてください。
 * 例: `img/sv_weapons/Broadsword.png` を使いたい場合
 *   <SVWeapon:Broadsword>
 *
 * 特定のアクターが特定のモーション中だけ武器画像を変更することもできます。
 * 武器のメモ欄に以下の書式で記述してください。
 *   <SVWeaponActor[アクターID]:モーション名,ファイル名>
 *
 * モーション名は walk, wait, attack など、SVアクターのモーション名を指定します。
 * 例: アクターID1がこの武器を装備して待機モーションのときだけ
 *     Broadsword_1.pngを使いたい場合
 *     <SVWeaponActor1:walk,Broadsword_1>
 *
 * 武器の描画位置をオフセットすることも可能です。
 * 武器、またはアクターのメモ欄に記述します。
 * アクターのメモ欄の設定が優先されます。
 * <SVWeaponOffset:x,y>
 *
 * xとyにはピクセル単位の数値を指定してください。
 * 例: <SVWeaponOffset:10,-5>
 */

(() => {
    const PLUGIN_NAME = 'Furamon_SVSheetWeapon';
    const hasBattleMotion = PluginManager._scripts.includes('BattleMotionMZ');

    //-----------------------------------------------------------------------------
    // ImageManager
    //
    // 画像をロードする静的クラスです。

    ImageManager.loadSvWeapon = function(filename: string) {
        return this.loadBitmap("img/sv_weapons/", filename);
    };


    //-----------------------------------------------------------------------------
    // Sprite_SVWeapon
    //
    // サイドビューアクター用の武器を表示するためのスプライトです。

    class Sprite_SVWeapon extends Sprite {
        _battler: Sprite_Actor | null;
        _weaponName: string;
        _motion: any;
        _pattern: number;
        _offsetX: number;
        _offsetY: number;

        constructor() {
            super();
            this.initMembers();
        }

        initMembers() {
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this._battler = null;
            this._weaponName = '';
            this._motion = null;
            this._pattern = 0;
            this._offsetX = 0;
            this._offsetY = 0;
        }

        setup(battler: Sprite_Actor) {
            this._battler = battler;
        }

        update() {
            super.update();
            // (NUUN_MenuScreenEX用)メニュー画面では描画しない
            if (this._battler && SceneManager._scene.constructor !== Scene_Menu) {
                this.updateBitmap();
                this.updateFrame();
                this.x = this._offsetX;
                this.y = this._offsetY;
            }
        }

        updateBitmap() {
            if (!this._battler || !this._battler._actor) return;
            const actor = this._battler._actor;
            if (actor) {
                const weapons = actor.weapons();
                const weapon = weapons[0];
                // デフォルトの武器画像名
                let weaponName = weapon && weapon.meta.SVWeapon ? String(weapon.meta.SVWeapon) : '';

                // アクターIDとモーションに応じた武器画像の上書き処理
                if (weapon) {
                    const actorId = actor.actorId();
                    const motionType = this._battler._motionType;
                    const dynamicTag = `SVWeaponActor${actorId}`;

                    if (weapon.meta[dynamicTag] && motionType) {
                        const motionSettings = Array.isArray(weapon.meta[dynamicTag])
                            ? weapon.meta[dynamicTag]
                            : [weapon.meta[dynamicTag]];

                        for (const setting of motionSettings) {
                            const [motion, file] = String(setting).split(',').map(s => s.trim());
                            if (motion === motionType) {
                                weaponName = file;
                                break;
                            }
                        }
                    }
                }

                if (this._weaponName !== weaponName) {
                    this._weaponName = weaponName;
                    this._offsetX = 0;
                    this._offsetY = 0;
                    if (this._weaponName) {
                        this.bitmap = ImageManager.loadSvWeapon(this._weaponName);

                        // アクターのメモ欄を優先し、次に武器のメモ欄を確認
                        const actorMeta = actor.actor().meta;
                        const weaponMeta = weapon ? weapon.meta : {};
                        const offsetString = actorMeta.SVWeaponOffset || weaponMeta.SVWeaponOffset;

                        if (offsetString) {
                            const offsetData = String(offsetString).split(',');
                            if (offsetData.length === 2) {
                                const ox = parseInt(offsetData[0].trim(), 10);
                                const oy = parseInt(offsetData[1].trim(), 10);
                                if (!isNaN(ox) && !isNaN(oy)) {
                                    this._offsetX = ox;
                                    this._offsetY = oy;
                                }
                            }
                        }
                    } else {
                        this.bitmap = null;
                    }
                }
            }
        }

        updateFrame() {
            if (!this._battler || !this._battler._motion) return;
            const bitmap = this.bitmap;
            if (bitmap && bitmap.isReady()) {
                if (hasBattleMotion) {
                    this.updateFrameBmmz(bitmap);
                } else {
                    this.updateFrameStandard(bitmap);
                }
            }
        }

        updateFrameStandard(bitmap: Bitmap) {
            if (!this._battler || !this._battler._motion) return;
            const motionIndex = this._battler._motion.index;
            const pattern = this._battler._pattern;
            const cw = bitmap.width / 9;
            const ch = bitmap.height / 6;
            const cx = Math.floor(motionIndex / 6) * 3 + pattern;
            const cy = motionIndex % 6;
            this.setFrame(cx * cw, cy * ch, cw, ch);
        }

        updateFrameBmmz(bitmap: Bitmap) {
            if (!this._battler || !this._battler._motion) return;
            const motionIndex = this._battler._motion.index;
            const pattern = this._battler._pattern;
            const cellSize = bitmap.height / 6;
            const totalFrames = bitmap.width / cellSize;
            const motionCount = Object.keys(Sprite_Battler.MOTIONS).length;
            const motionsPerRow = 6;
            const totalColumns = motionCount / motionsPerRow;
            const actualFramesPerMotion = Math.floor(totalFrames / totalColumns);

            const motionColumn = Math.floor(motionIndex / motionsPerRow);
            const motionRow = motionIndex % motionsPerRow;

            const cx = motionColumn * actualFramesPerMotion + pattern;
            const cy = motionRow;
            this.setFrame(cx * cellSize, cy * cellSize, cellSize, cellSize);
        }
    }

    //-----------------------------------------------------------------------------
    // Sprite_Actor
    //
    // アクターを表示するためのスプライトです。

    const _Sprite_Actor_createWeaponSprite = Sprite_Actor.prototype.createWeaponSprite;
    Sprite_Actor.prototype.createWeaponSprite = function() {
        // _Sprite_Actor_createWeaponSprite.call(this);
        // 武器スプライトを上書き
        this._weaponSprite = new Sprite_SVWeapon();
        this._weaponSprite.setup(this);
        this.addChild(this._weaponSprite);
    };

    const _Sprite_Actor_startMotion = Sprite_Actor.prototype.startMotion;
    Sprite_Actor.prototype.startMotion = function(motionType: string) {
        _Sprite_Actor_startMotion.call(this, motionType);
        this._motionType = motionType;
    };

    Sprite_Actor.prototype.setupWeaponAnimation = function() {
        if (this._actor && this._actor.isWeaponAnimationRequested()) {
            this._actor.clearWeaponAnimation();
        }
    };

})();
