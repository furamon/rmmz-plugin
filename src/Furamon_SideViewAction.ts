//------------------------------------------------------------------------------
// Furamon_SideViewAction.js
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//------------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc Side View Action System v1.0.0
 * @author Furamon
 * @help Furamon_SideViewAction.js
 *
 * プレイヤーはサイドビューアクションゲームのように動くことができる。
 * 重力システムとジャンプ機能を提供する。
 *
 * -----------------------------------------------------------------------------
 * 特徴
 * -----------------------------------------------------------------------------
 * 重力は常に働き、地面に着地するまで落下する。
 * ダッシュボタンでジャンプし、天井または最大の高さに到達するまで上昇する。
 * ジャンプボタンを離すと早期降下する（オプション）。

 * -----------------------------------------------------------------------------
 * 使用方法
 * -----------------------------------------------------------------------------
 * 1. 地上として機能するタイルに地上リージョンIDを設定する。
 * 2. 天井として機能するタイルに天井リージョンIDを設定する。
 * 3. プラグインを有効にする
 *
 * @param groundRegionId
 * @text 地面のリージョンID
 * @desc 地面のリージョンID
 * @type number
 * @default 1
 *
 * @param ceilingRegionId
 * @text 天井のリージョンID
 * @desc 天井のリージョンID
 * @type number
 * @default 2
 *
 * @param jumpHeight
 * @text ジャンプの高さ
 * @desc 最大のジャンプの高さ
 * @type number
 * @default 4
 *
 * @param gravitySpeed
 * @text 重力の強さ
 * @desc 重力の強さ
 * @type number
 * @default 4
 *
 * @param jumpSpeed
 * @text ジャンプの速さ
 * @desc ジャンプの速さ
 * @type number
 * @default 8
 *
 * @param earlyDescend
 * @text ジャンプボタン長押し調整
 * @desc ジャンプボタンを押した長さで高度調整
 * @type boolean
 * @default true
 */

(() => {
    'use strict';

    const pluginName = 'Furamon_SideViewAction';
    const parameters = PluginManager.parameters(pluginName);

    const groundRegionId = parseInt(parameters['groundRegionId'] || '1');
    const ceilingRegionId = parseInt(parameters['ceilingRegionId'] || '2');
    const jumpHeight = parseInt(parameters['jumpHeight'] || '4');
    const gravitySpeed = parseInt(parameters['gravitySpeed'] || '4');
    const jumpSpeed = parseInt(parameters['jumpSpeed'] || '8');
    const earlyDescend = parameters['earlyDescend'] === 'true';

    console.log(`[Furamon] ${pluginName} is loaded.`);

    // Player state management
    let playerState = {
        isJumping: false,
        jumpVelocity: 0,
        jumpStartY: 0,
        isGrounded: false,
        jumpButtonPressed: false
    };

    // Get region ID
    function getRegionId(x, y) {
        return $dataMap.data[(5 * $dataMap.height + y) * $dataMap.width + x] || 0;
    }

    // Check if specified coordinates are ground region
    function isGroundTile(x, y) {
        return getRegionId(x, y) === groundRegionId;
    }

    // Check if specified coordinates are ceiling region
    function isCeilingTile(x, y) {
        return getRegionId(x, y) === ceilingRegionId;
    }

    // Check if player's feet are touching ground
    function checkGroundCollision(player) {
        const x = Math.floor(player._realX);
        const y = Math.floor(player._realY + 1);
        return isGroundTile(x, y);
    }

    // Check if player's head is touching ceiling
    function checkCeilingCollision(player) {
        const x = Math.floor(player._realX);
        const y = Math.floor(player._realY - 1);
        return isCeilingTile(x, y);
    }

    // Game_Player extension
    const _Game_Player_initialize = Game_Player.prototype.initialize;
    Game_Player.prototype.initialize = function() {
        _Game_Player_initialize.call(this);
        this._sideViewEnabled = true;
        this._gravityY = 0;
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function() {
        _Game_Player_update.call(this);
        if (this._sideViewEnabled) {
            this.updateSideViewMovement();
        }
    };

    // Update side view movement
    Game_Player.prototype.updateSideViewMovement = function() {
        this.handleHorizontalMovement();
        this.updateGravity();
        this.updateJump();
        this.updateGroundCheck();
    };

    Game_Player.prototype.handleHorizontalMovement = function() {
        if (this.canMove()) {
            if (this.isOnLadder && this.isOnLadder()) {
                return;
            }

            // Check for HalfMove plugin compatibility
            const isHalfMoveActive = typeof Game_Map !== 'undefined' && Game_Map.tileUnit === 0.5;
            let moveSpeed = isHalfMoveActive ? 0.125 : 0.0625;

            if (Input.isPressed('left')) {
                const newX = this._realX - moveSpeed;
                if (this.canMoveToX(newX)) {
                    if (isHalfMoveActive) {
                        // Use HalfMove's movement system if available
                        if (this.canPass(Math.floor(this._realX), Math.floor(this._realY), 4)) {
                            this._realX = newX;
                            this._x = this._realX;
                        }
                    } else {
                        this._realX = newX;
                        this._x = Math.round(this._realX);
                    }
                    this.setDirection(4);
                }
            } else if (Input.isPressed('right')) {
                const newX = this._realX + moveSpeed;
                if (this.canMoveToX(newX)) {
                    if (isHalfMoveActive) {
                        // Use HalfMove's movement system if available
                        if (this.canPass(Math.floor(this._realX), Math.floor(this._realY), 6)) {
                            this._realX = newX;
                            this._x = this._realX;
                        }
                    } else {
                        this._realX = newX;
                        this._x = Math.round(this._realX);
                    }
                    this.setDirection(6);
                }
            }
        }
    };

    // Gravity processing
    Game_Player.prototype.updateGravity = function() {
        // Skip gravity if on ladder
        if (this.isOnLadder && this.isOnLadder()) {
            return;
        }

        // Apply gravity when not grounded (includes falling after jump ends)
        if (!playerState.isGrounded) {
            if (!playerState.isJumping) {
                this._gravityY = gravitySpeed / 48;
                const newY = this._realY + this._gravityY;

                // Ground collision check
                if (this.canMoveToY(newY)) {
                    this._realY = newY;
                } else {
                    // Land on ground
                    this._realY = Math.floor(this._realY);
                    this._gravityY = 0;
                    playerState.isGrounded = true;
                }
            }
        }
    };

    // Jump processing
    Game_Player.prototype.updateJump = function() {
        // Start jump with dash button
        if (Input.isTriggered('shift') && playerState.isGrounded) {
            this.startJump();
        }

        // Jump processing
        if (playerState.isJumping) {
            // Early descent processing
            if (earlyDescend && !Input.isPressed('shift')) {
                playerState.jumpButtonPressed = false;
            } else if (Input.isPressed('shift')) {
                playerState.jumpButtonPressed = true;
            }

            // Jump ascent processing
            if (playerState.jumpButtonPressed || !earlyDescend) {
                playerState.jumpVelocity = -jumpSpeed / 12;
                const newY = this._realY + playerState.jumpVelocity;

                // Ceiling collision check
                if (checkCeilingCollision(this) ||
                    (playerState.jumpStartY - this._realY) >= jumpHeight) {
                    this.endJump();
                    return;
                }

                // Check if movement is possible
                if (this.canMoveToY(newY)) {
                    this._realY = newY;
                } else {
                    this.endJump();
                }
            } else {
                // Early descent
                this.endJump();
            }
        }
    };

    // Start jump
    Game_Player.prototype.startJump = function() {
        playerState.isJumping = true;
        playerState.isGrounded = false;
        playerState.jumpVelocity = 0;
        playerState.jumpStartY = this._realY;
        playerState.jumpButtonPressed = true;
        this._gravityY = 0;
    };

    // End jump
    Game_Player.prototype.endJump = function() {
        playerState.isJumping = false;
        playerState.jumpVelocity = 0;
        playerState.jumpButtonPressed = false;
    };

    // Update ground check
    Game_Player.prototype.updateGroundCheck = function() {
        playerState.isGrounded = checkGroundCollision(this);
        if (playerState.isGrounded) {
            this._gravityY = 0;
            // Always sync position when grounded (including half-step positions)
            this._x = this._realX;
            this._y = Math.round(this._realY);
        }
    };

    // Check if tile is passable (enhanced collision system)
    Game_Player.prototype.isPassableTile = function(x, y) {
        // Map boundary check
        if (x < 0 || x >= $dataMap.width || y < 0 || y >= $dataMap.height) {
            return false;
        }

        // Check passability of all layers
        const layerData = $dataMap.data;
        const width = $dataMap.width;
        const height = $dataMap.height;

        // Check all tile layers (A, B, C, D) - standard 4 layers
        for (let z = 0; z < 4; z++) {
            const tileId = layerData[(z * height + y) * width + x];
            if (tileId > 0 && $dataMap.tilesetFlags && $dataMap.tilesetFlags.length > tileId) {
                // Get tileset flags safely
                const flags = $dataMap.tilesetFlags[tileId];
                if (flags !== undefined) {
                    // Check impassable flag (bit 4)
                    if ((flags & 0x10) !== 0) {
                        return false;
                    }
                }
            }
        }

        // Check events at the position
        if ($gameMap && $gameMap.eventsXy) {
            const events = $gameMap.eventsXy(x, y);
            for (const event of events) {
                if (event.isNormalPriority() && !event.isThrough()) {
                    return false;
                }
            }
        }

        return true;
    };

    // Check tile passability only (without events)
    Game_Player.prototype.isPassableTileOnly = function(x, y) {
        // Map boundary check
        if (x < 0 || x >= $dataMap.width || y < 0 || y >= $dataMap.height) {
            return false;
        }

        // Check passability of all layers
        const layerData = $dataMap.data;
        const width = $dataMap.width;
        const height = $dataMap.height;

        // Check all tile layers (A, B, C, D) - standard 4 layers
        for (let z = 0; z < 4; z++) {
            const tileId = layerData[(z * height + y) * width + x];
            if (tileId > 0 && $dataMap.tilesetFlags && $dataMap.tilesetFlags.length > tileId) {
                // Get tileset flags safely
                const flags = $dataMap.tilesetFlags[tileId];
                if (flags !== undefined) {
                    // Check impassable flag (bit 4)
                    if ((flags & 0x10) !== 0) {
                        return false;
                    }
                }
            }
        }

        // Don't check events - only tile passability
        return true;
    };

    // Check X-direction movement possibility
    Game_Player.prototype.canMoveToX = function(newX) {
        const x = Math.floor(newX);
        const y = Math.floor(this._realY);

        // Map boundary check - fixed for character width
        if (newX < 0 || newX >= $dataMap.width) {
            return false;
        }

        // Only check tile passability, not events (to avoid affecting NPC collision)
        return this.isPassableTileOnly(x, y);
    };

    // Check Y-direction movement possibility
    Game_Player.prototype.canMoveToY = function(newY) {
        const x = Math.floor(this._realX);
        const y = Math.floor(newY);

        // Map boundary check
        if (y < 0 || y >= $dataMap.height) {
            return false;
        }

        // Ground collision check (downward movement)
        if (newY > this._realY && isGroundTile(x, y)) {
            return false;
        }

        // Ceiling collision check (upward movement)
        if (newY < this._realY && isCeilingTile(x, y)) {
            return false;
        }

        return true;
    };

    // Override movement input system completely
    const _Game_Player_moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (this._sideViewEnabled) {
            // Side view movement is completely handled by updateSideViewMovement
            // Don't call original movement system at all
            return;
        }
        _Game_Player_moveByInput.call(this);
    };

    // Restrict other characters (NPCs/Events) to horizontal movement only
    const _Game_Character_executeMove = Game_Character.prototype.executeMove;
    Game_Character.prototype.executeMove = function(direction) {
        // Allow normal movement for player
        if (this instanceof Game_Player) {
            return _Game_Character_executeMove.call(this, direction);
        }

        // Check if side view is enabled (via player reference)
        const player = $gamePlayer;
        if (player && player._sideViewEnabled) {
            // Convert vertical and diagonal movements to horizontal movements
            let newDirection = direction;
            
            // Convert vertical movements to random horizontal movement
            if (direction === 2 || direction === 8) {
                // Convert up/down to left/right randomly
                newDirection = Math.random() < 0.5 ? 4 : 6;
            }
            // Convert diagonal movements to their horizontal component
            else if (direction === 1 || direction === 7) {
                // down-left or up-left → left
                newDirection = 4;
            }
            else if (direction === 3 || direction === 9) {
                // down-right or up-right → right
                newDirection = 6;
            }
            
            // Execute the converted movement
            return _Game_Character_executeMove.call(this, newDirection);
        }

        // Allow normal movement when side view is disabled
        return _Game_Character_executeMove.call(this, direction);
    };

    // Override moveByInput for followers to prevent vertical movement
    const _Game_Follower_moveByInput = Game_Follower.prototype.moveByInput;
    Game_Follower.prototype.moveByInput = function() {
        const player = $gamePlayer;
        if (player && player._sideViewEnabled) {
            // In side view mode, followers should not move vertically via input
            // They will follow the player horizontally through the normal following system
            return;
        }
        _Game_Follower_moveByInput.call(this);
    };

})();
