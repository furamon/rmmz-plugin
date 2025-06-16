//------------------------------------------------------------------------------
// Furamon_EnemyActorBattleMotion.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------

/*:
 * @target MZ
 * @plugindesc 敵キャラのBattleMotion対応パッチ
 * @author Furamon
 * @base Furamon_EnemyActorAnimation
 * @orderAfter Furamon_EnemyActorAnimation
 * @base BattleMotionMZ
 * @orderAfter BattleMotionMZ
 * @help SVアクター敵キャラをBattleMotionに対応させます。
 *
 * BattleMotionMZとFuramon_EnemyActorAnimationが必要です。
 *
 * 使用順序：
 * 1. BattleMotionMZ
 * 2. Furamon_EnemyActorAnimation
 * 3. このプラグイン（Furamon_EnemyActorBattleMotion）
 *
 * BattleMotionMZのモーションカラー機能に対応：
 * - 青色要素でFPS制御
 * - 赤色要素でアニメーション終了制御
 * - 緑色要素でループ制御
 * - 右上ピクセルでの次モーション制御（未対応）
 */

(function () {
    'use strict';

    const pluginName = 'Furamon_EnemyActorBattleMotion';

    // BattleMotionMZの存在確認
    const prmBattleMotion =
        PluginManager._scripts.includes('BattleMotionMZ') &&
        PluginManager.parameters('BattleMotionMZ');
    const prmMotionCol =
        prmBattleMotion && prmBattleMotion['motionCol'] === 'true';
    const prmBlueFps = prmBattleMotion && prmBattleMotion['blueFps'] === 'true';

    if (!prmBattleMotion) {
        console.warn(`${pluginName}: BattleMotionMZ not found`);
        return;
    }

    // BattleMotionMZ対応のupdateMotion処理を上書き
    const _Sprite_SvActor_updateMotion = Sprite_SvActor.prototype.updateMotion;
    Sprite_SvActor.prototype.updateMotion = function () {
        // モーション更新要求があれば即座に処理
        if (
            this._battler &&
            this._battler._motionRefresh &&
            !this._battler._damaged
        ) {
            this._battler._motionRefresh = false;
            this.refreshMotion();
        }

        if (prmBattleMotion) {
            try {
                this.updateMotionBMMZ();
            } catch (e) {
                console.log(
                    'BattleMotionMZ updateMotion failed, using default:',
                    e
                );
                _Sprite_SvActor_updateMotion.call(this);
            }
        } else {
            _Sprite_SvActor_updateMotion.call(this);
        }
    };

    // BattleMotionMZ対応のupdateFrame処理を上書き
    const _Sprite_SvActor_updateFrame = Sprite_SvActor.prototype.updateFrame;
    Sprite_SvActor.prototype.updateFrame = function () {
        const bitmap = this._mainSprite.bitmap;
        if (!bitmap || !bitmap.isReady()) return;

        if (prmBattleMotion) {
            try {
                this.updateFrameBMMZ(bitmap);
            } catch (e) {
                console.warn(
                    'BattleMotionMZ updateFrame failed, using default:',
                    e
                );
                _Sprite_SvActor_updateFrame.call(this);
            }
        } else {
            _Sprite_SvActor_updateFrame.call(this);
        }
    };

    // BattleMotionMZ用のフレーム更新処理
    Sprite_SvActor.prototype.updateFrameBMMZ = function (bitmap:Bitmap) {
        // BattleMotionMZ処理
        if (this.getRemake && this.getRemake() === true) {
            this.addMotionData && this.addMotionData(this._mainSprite);
            this.setMotionFps && this.setMotionFps(this._mainSprite);
            this.setMotionArray && this.setMotionArray();
            this.setRemake && this.setRemake(false);
        }

        const cellSize = this.cs
            ? this.cs(this._mainSprite)
            : bitmap.height / 6;
        let cx = 0,
            cy = 0;

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

        // 範囲チェック
        const maxCx = Math.floor(bitmap.width / cellSize);
        if (cx >= maxCx || cy >= 6 || cx < 0 || cy < 0) {
            console.warn(
                `Frame out of bounds: cx=${cx}, cy=${cy}, maxCx=${maxCx}, resetting to 0,0`
            );
            cx = 0;
            cy = 0;
        }

        this._mainSprite.setFrame(
            cx * cellSize,
            cy * cellSize,
            cellSize,
            cellSize
        );
    };

    // BattleMotionMZ用のモーション更新処理
    Sprite_SvActor.prototype.updateMotionBMMZ = function () {
        this._motionCount++;

        // 独自実装のモーションスピードを使用
        let speed = this.getCustomMotionSpeed();

        if (this._motionCount >= speed) {
            const bitmap = this._mainSprite.bitmap;
            if (!bitmap || !bitmap.isReady()) return;

            const cellSize = this.cs
                ? this.cs(this._mainSprite)
                : bitmap.height / 6;
            const motionIndex = this._motion ? this._motion.index : 0;
            const frameInfo = this.getMotionFrameInfo(
                bitmap,
                cellSize,
                motionIndex
            );
            const frameCount = frameInfo.frameCount - 1;
            const animType = frameInfo.animType;

            if (animType === 'freeze') {
                // R255のみ = 最後のコマで停止
                if (this._pattern < frameCount - 1) {
                    this._pattern++;
                } else {
                    this._pattern = frameCount - 1;
                }
            } else if (animType === 'pingpong') {
                // R255G255 = ping-pong（往復ループ）
                if (this._patternDirection === undefined) {
                    this._patternDirection = 1;
                }

                if (this._pattern <= 0) {
                    this._pattern = 1;
                    this._patternDirection = 1;
                } else if (this._pattern >= frameCount - 1) {
                    this._pattern = frameCount - 2;
                    this._patternDirection = -1;
                } else {
                    this._pattern += this._patternDirection;
                }
            } else if (animType === 'loop') {
                // G255のみ = 一方通行ループ (0->1->2->0->...)
                this._pattern = (this._pattern + 1) % frameCount;
            } else {
                // 通常処理
                if (this._motion && this._motion.loop) {
                    this._pattern = (this._pattern + 1) % frameCount;
                } else {
                    if (this._pattern < frameCount - 1) {
                        this._pattern++;
                    } else {
                        this._pattern = frameCount - 1;
                    }
                }
            }
            this._motionCount = 0;
        }
    };

    // モーションフレーム情報を取得
    Sprite_SvActor.prototype.getMotionFrameInfo = function (
        bitmap:Bitmap,
        cellSize:number,
        motionIndex:number
    ) {
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

        // 終端カラーフレームを探す
        let endFrameIndex = maxFramesPerMotion - 1; // デフォルトは最後のフレーム

        for (let i = 1; i <= maxFramesPerMotion; i++) {
            const frameX = motionStartX + (i - 1) * cellSize;

            if (
                this.isEndFrame(
                    bitmap,
                    frameX,
                    motionStartY,
                    cellSize,
                    maxFramesPerMotion,
                    i
                )
            ) {
                endFrameIndex = i - 1;
                break;
            }
        }

        // 終端フレームの色情報を取得
        const endFrameX = motionStartX + endFrameIndex * cellSize;
        const colorInfo = this.getEndFrameColorInfo(
            bitmap,
            endFrameX,
            motionStartY,
            cellSize
        );

        return {
            frameCount: endFrameIndex + 1, // 実際のフレーム数
            animType: colorInfo.animType,
        };
    };

    // 終端フレームかどうかを判定
    Sprite_SvActor.prototype.isEndFrame = function (
        bitmap:Bitmap,
        frameX:number,
        frameY:number,
        cellSize:number,
        maxFramesPerMotion:number,
        currentFrame:number
    ) {
        try {
            // フレームの左上から右1下1の色を取得
            const checkX = frameX + 1;
            const checkY = frameY + 1;

            const canvas = bitmap.canvas || bitmap._canvas;
            if (!canvas) return false;

            const context = canvas.getContext('2d');
            const imageData = context!.getImageData(checkX, checkY, 1, 1);
            const [r, g, b, a] = imageData.data;

            // 透明でなく、かつ黒でない場合は終端フレーム
            if (a > 128 && !(r === 0 && g === 0 && b === 0)) {
                return true;
            }

            return false;
        } catch (e) {
            console.warn('isEndFrame check failed:', e);
            return false;
        }
    };

    // 終端フレームの色情報を解析
    Sprite_SvActor.prototype.getEndFrameColorInfo = function (
        bitmap:Bitmap,
        x:number,
        y:number,
        cellSize:number
    ) {
        try {
            const canvas = bitmap.canvas || bitmap._canvas;
            if (!canvas) {
                return { animType: 'normal' };
            }

            const context = canvas.getContext('2d');

            // 終端フレームの左上から右1下1の色を取得
            const sampleX = x + 1;
            const sampleY = y + 1;

            const imageData = context!.getImageData(sampleX, sampleY, 1, 1);
            const [r, g, b, a] = imageData.data;

            // 透明でない場合のみ色制御を適用
            if (a > 128) {
                if (r === 255 && g === 255 && b < 255) {
                    // R255G255 = ping-pong（往復ループ）
                    return { animType: 'pingpong' };
                } else if (r === 255 && g < 255 && b < 255) {
                    // R255のみ = 最後のコマで停止
                    return { animType: 'freeze' };
                } else if (r < 255 && g === 255 && b < 255) {
                    // G255のみ = 一方通行ループ
                    return { animType: 'loop' };
                }
            }

            return { animType: 'normal' };
        } catch (e) {
            console.warn('Color detection failed:', e);
            return { animType: 'normal' };
        }
    };

    // 独自のモーションスピード計算
    Sprite_SvActor.prototype.getCustomMotionSpeed = function () {
        const bitmap = this._mainSprite.bitmap;
        if (!bitmap || !bitmap.isReady()) return 12;

        if (!prmBlueFps) {
            // motionColが無効な場合は標準速度
            return this._motion && this._motion.speed ? this._motion.speed : 12;
        }

        try {
            const motionIndex = this._motion ? this._motion.index : 0;
            const cellSize = this.cs
                ? this.cs(this._mainSprite)
                : bitmap.height / 6;
            const motionsPerRow = 6;
            const motionCount = Object.keys(Sprite_Battler.MOTIONS).length;
            const totalColumns = motionCount / motionsPerRow;
            const maxFramesPerMotion = Math.floor(
                bitmap.width / cellSize / totalColumns
            );

            // このモーションの位置を計算
            const motionColumn = Math.floor(motionIndex / motionsPerRow);
            const motionRow = motionIndex % motionsPerRow;
            const motionStartX = motionColumn * maxFramesPerMotion * cellSize;
            const motionStartY = motionRow * cellSize;

            // 終端フレームを探す
            for (let i = 1; i <= maxFramesPerMotion; i++) {
                const frameX = motionStartX + (i - 1) * cellSize;

                if (
                    this.isEndFrame(
                        bitmap,
                        frameX,
                        motionStartY,
                        cellSize,
                        maxFramesPerMotion,
                        i
                    )
                ) {
                    // 終端フレームの青色要素を取得してスピードを計算
                    const blueValue = this.getEndFrameBlueValue(
                        bitmap,
                        frameX,
                        motionStartY
                    );

                    if (blueValue > 0 && blueValue < 255) {
                        // 青色要素をそのままスピードとして使用
                        const speed = blueValue;
                        return speed;
                    }
                    break;
                }
            }
        } catch (e) {
            console.warn('Custom motion speed calculation failed:', e);
        }

        // フォールバック：標準速度を返す
        return this._motion && this._motion.speed ? this._motion.speed : 12;
    };

    // 終端フレームの青色要素を取得
    Sprite_SvActor.prototype.getEndFrameBlueValue = function (bitmap:Bitmap, x:number, y:number) {
        try {
            const canvas = bitmap.canvas || bitmap._canvas;
            if (!canvas) return 0;

            const context = canvas.getContext('2d');
            const imageData = context!.getImageData(x + 1, y + 1, 1, 1);
            const [r, g, b, a] = imageData.data;

            // 透明でない場合のみ青色要素を返す
            if (a > 128) {
                return b;
            }
            return 0;
        } catch (e) {
            console.warn('Blue value detection failed:', e);
            return 0;
        }
    };
})();
