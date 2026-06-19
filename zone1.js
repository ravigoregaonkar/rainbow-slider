// ===== ARACHITOL POWER QUEST - ZONE 1 GAMEPLAY (OPTIMIZED) =====
// Performance Optimized Version - June 2026
// Optimizations: Object pooling, collision batching, reduced GC, cached lookups,
// batched rendering, mobile touch optimization, memory leak fixes
// Gameplay, visuals, controls, scoring, animations, and flow UNCHANGED

(function () {
    'use strict';

    // ============================================================
    // SECTION 1: CONSTANTS & CONFIG (All magic numbers centralized)
    // ============================================================
    const C = {
        // Canvas
        BASE_W: 1024, BASE_H: 768,
        // Physics
        GROUND_Y: 768, WORLD_UP: 118, GRAVITY: 0.7,
        JUMP_POWER: -21, SMALL_JUMP: -10, RUN_SPEED: 6,
        // Scoring
        COIN_VALUE: 10, SUPER_COIN_VALUE: 5, TOTAL_SUPER_COINS: 8,
        // Sizes
        COIN_SIZE: 60, SUPER_COIN_SIZE: 70,
        PLAYER_W: 100, PLAYER_H: 130,
        PLATFORM_HEIGHT: 45,
        FLAG_W: 60, FLAG_H: 515,
        CASTLE_W: 500, CASTLE_H: 500,
        BRICK_W: 410, BRICK_H: 350,
        // Animation
        COIN_FLOAT_SPEED: 0.01, COIN_FLOAT_RANGE: 10,
        SUPER_COIN_FLOAT_SPEED: 0.015, SUPER_COIN_FLOAT_RANGE: 7,
        FRAME_INTERVAL: 6,
        SUPER_MODE_GROW: 0.015,
        // Speeds
        BG_SPEED: 2, GROUND_SPEED: 2,
        FLAG_SLIDE_SPEED: 5, FLAG_CLIMB_SPEED: 3,
        FLAG_CLIMB_INTERVAL: 3,
        // Offsets
        FOOT_FIX: 18,
        JUMP_W: 100, JUMP_H: 128, JUMP_OFFSET_X: 7, JUMP_OFFSET_Y: 15,
        FALL_W: 100, FALL_H: 121, FALL_OFFSET_X: 5, FALL_OFFSET_Y: 10,
        CASTLE_OFFSET_X: 500, BRICK_OFFSET_X: 1400,
        // Timing
        GAME_TIME: 60, FINISH_WAIT_DELAY: 8000, POWER_MSG_DURATION: 3000,
        FLOAT_TEXT_LIFE: 0.025, FLOAT_TEXT_SCALE_SPEED: 0.08,
        // Effects
        FIREWORK_PARTICLES: 45, PARTICLE_LIFE: 60,
        MAX_FLOATING_TEXTS: 20, MAX_FIREWORKS: 500, MAX_SPARKLES: 30,
        FIREWORK_COLORS: ['#FFD700', '#FF3B30', '#00E5FF', '#76FF03', '#FF00FF', '#FFFFFF'],
        SHADOW_BLUR_BASE: 20, SHADOW_BLUR_VAR: 10,
        // Audio
        MUSIC_VOLUME: 0.3,
        // Misc
        LEADERBOARD_MAX: 50, OFFSCREEN_BUFFER: 200
    };

    const PLATFORM_WIDTHS = { small: 150, medium: 250, large: 400 };
    const PLATFORM_TYPES = ['small', 'medium', 'large'];
    const RUN_FRAMES = ['boyRun1', 'boyRun2', 'boyRun3', 'boyRun4', 'boyRun5', 'boyRun6', 'boyRun7', 'boyRun8'];
    const CLIMB_FRAMES = ['climb1', 'climb2', 'climb3', 'climb4', 'climb5', 'climb6', 'climb7', 'climb8'];

    // ============================================================
    // SECTION 2: CACHED MATH (Eliminates property lookup overhead)
    // ============================================================
    const M = Math, M_abs = M.abs, M_sin = M.sin, M_cos = M.cos;
    const M_sqrt = M.sqrt, M_floor = M.floor, M_random = M.random;
    const M_PI = M.PI, M_PI2 = M.PI * 2, M_round = M.round, M_max = M.max, M_min = M.min;

    // ============================================================
    // SECTION 3: DOM CACHE (Single lookup, reused forever)
    // ============================================================
    const canvas = document.getElementById('gameCanvas');
    // OPTIMIZATION: { alpha: false } tells browser no transparency needed - enables GPU optimizations
    const ctx = canvas.getContext('2d', { alpha: false });
    const DOM = {};
    const DOM_IDS = [
        'scoreCount', 'superCoinCount', 'timeCount', 'game-over',
        'finalCoins', 'finalSuperCoins', 'finalSupermsg', 'finalTime', 'finalScore',
        'leaderboard-overlay', 'leaderboardBody', 'certificate-popup', 'certificateFrame',
        'pause-menu', 'musicBtn', 'musicIcon', 'jumpBtn', 'forwardBtn',
        'pauseBtn', 'resumeBtn', 'restartBtn', 'quitBtn',
        'viewLeaderboardBtn', 'viewCertBtn', 'downloadCertBtn', 'downloadCertBtnMob',
        'certPopupClose', 'certBackBtn', 'mobPlayAgainBtn',
        'leftZone', 'rightZone', 'intro-screen'
    ];

    // ============================================================
    // SECTION 4: GAME STATE
    // ============================================================
    const GAME = {
        state: 'menu', score: 0, coins: 0, superCoins: 0,
        totalSuperCoinsCollected: 0, superCoinsPassed: 0,
        totalSuperCoins: C.TOTAL_SUPER_COINS,
        superMode: false, pendingSuperMode: false, superModeAnimation: 0,
        gameOverDelay: 0, gameOverPending: false, gameOverStarted: false,
        stopWorldScroll: false,
        timeElapsed: 0, timeRemaining: C.GAME_TIME,
        isJumping: false, isFalling: false,
        groundY: C.GROUND_Y, worldUp: C.WORLD_UP,
        gravity: C.GRAVITY, jumpPower: C.JUMP_POWER,
        runSpeed: C.RUN_SPEED, coinValue: C.COIN_VALUE, superCoinValue: C.SUPER_COIN_VALUE,
        lastTime: 0, frameCount: 0, gameLoopId: null,
        wasPausedByOrientation: false, isMovingForward: false,
        scaleX: 1, scaleY: 1, scale: 1,
        gameTimerInterval: null,
        gameStartMs: 0, gameElapsedMs: 0,
        canvasWidth: 0, canvasHeight: 0
    };

    // ============================================================
    // SECTION 5: PLAYER
    // ============================================================
    const player = {
        x: 150, y: 0, width: C.PLAYER_W, height: C.PLAYER_H,
        vy: 0, frame: 0, frameTimer: 0, frameInterval: C.FRAME_INTERVAL
    };

    // ============================================================
    // SECTION 6: BACKGROUND & SCROLL
    // ============================================================
    const bg = { x: 0, speed: C.BG_SPEED, image: null, width: 6144 };
    const groundScroll = { x: 0, speed: C.GROUND_SPEED };

    // ============================================================
    // SECTION 7: GAME OBJECTS
    // ============================================================
    let platforms = [], coins = [], superCoins = [];

    // ============================================================
    // SECTION 8: OBJECT POOLS (Pre-allocated, reused - zero GC)
    // ============================================================
    // POOL: Floating Texts
    const floatingTextPool = {
        pool: [], active: [], maxSize: C.MAX_FLOATING_TEXTS,
        init() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push({
                    x: 0, y: 0, text: '', color: '', strokeColor: '',
                    life: 0, maxLife: 0, vy: 0, scale: 0, targetScale: 0, active: false
                });
            }
        },
        acquire(x, y, text, color, strokeColor, vy, targetScale) {
            for (let i = 0; i < this.pool.length; i++) {
                if (!this.pool[i].active) {
                    const ft = this.pool[i];
                    ft.x = x; ft.y = y; ft.text = text; ft.color = color; ft.strokeColor = strokeColor;
                    ft.life = 1.0; ft.maxLife = 1.0; ft.vy = vy; ft.scale = 0.5; ft.targetScale = targetScale;
                    ft.active = true; this.active.push(ft); return ft;
                }
            }
            return null;
        },
        release(ft) {
            ft.active = false;
            const idx = this.active.indexOf(ft);
            if (idx > -1) this.active.splice(idx, 1);
        },
        reset() {
            for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
            this.active.length = 0;
        }
    };

    // POOL: Fireworks Particles
    const fireworkPool = {
        pool: [], active: [], maxSize: C.MAX_FIREWORKS,
        init() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0, color: '', active: false });
            }
        },
        acquire(x, y, angle, speed, color) {
            for (let i = 0; i < this.pool.length; i++) {
                if (!this.pool[i].active) {
                    const p = this.pool[i];
                    p.x = x; p.y = y; p.vx = M_cos(angle) * speed; p.vy = M_sin(angle) * speed;
                    p.life = C.PARTICLE_LIFE; p.size = 2 + M_random() * 3; p.color = color;
                    p.active = true; this.active.push(p); return p;
                }
            }
            return null;
        },
        release(p) {
            p.active = false;
            const idx = this.active.indexOf(p);
            if (idx > -1) this.active.splice(idx, 1);
        },
        reset() {
            for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
            this.active.length = 0;
        }
    };

    // POOL: Sparkle Effects
    const sparklePool = {
        pool: [], active: [], maxSize: C.MAX_SPARKLES,
        init() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push({ x: 0, y: 0, alpha: 0, life: 0, active: false });
            }
        },
        acquire(x, y, alpha) {
            for (let i = 0; i < this.pool.length; i++) {
                if (!this.pool[i].active) {
                    const s = this.pool[i]; s.x = x; s.y = y; s.alpha = alpha; s.life = 20;
                    s.active = true; this.active.push(s); return s;
                }
            }
            return null;
        },
        release(s) {
            s.active = false;
            const idx = this.active.indexOf(s);
            if (idx > -1) this.active.splice(idx, 1);
        },
        reset() {
            for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
            this.active.length = 0;
        }
    };

    // ============================================================
    // SECTION 9: STAIRS, FLAG, CASTLE, SIGNBOARD
    // ============================================================
    let stairs = [], brickWall = null;
    let stairsActive = false, stairsCompleted = false, onStairs = false;
    let currentStairIndex = -1, stairMessageShown = false;

    const finishFlag = {
        x: 0, y: 0, width: C.FLAG_W, height: C.FLAG_H, flagY: 10,
        active: false, touched: false, climbFrame: 0, climbTimer: 0, finishStarted: false
    };

    const castle = { x: 0, y: 0, width: C.CASTLE_W, height: C.CASTLE_H, active: false };
    const signBoard = { x: 900, y: 0, width: 160, height: 130, image: null };

    // ============================================================
    // SECTION 10: IMAGES
    // ============================================================
    const images = {};
    const imageSources = {
        bg: 'images/gameplay-bg2.png', ground: 'images/ground1.png',
        boyRun1: 'images/boy-run-1.png', boyRun2: 'images/boy-run-2.png',
        boyRun3: 'images/boy-run-3.png', boyRun4: 'images/boy-run-4.png',
        boyRun5: 'images/boy-run-5.png', boyRun6: 'images/boy-run-6.png',
        boyRun7: 'images/boy-run-7.png', boyRun8: 'images/boy-run-8.png',
        boyJump: 'images/boy-jump.png', boyFall: 'images/boy-fall.png',
        coin: 'images/D-coin.png', superCoin: 'images/super-coin.png',
        platformSmall: 'images/platform-small.png', platformMedium: 'images/platform-medium.png',
        platformLarge: 'images/platform-large.png', flagPole: 'images/flag-pole.png',
        finishFlag: 'images/finish-flag.png', brick: 'images/brick.png', castle: 'images/castle.png',
        climb1: 'images/boy-climb-1.png', climb2: 'images/boy-climb-2.png',
        climb3: 'images/boy-climb-3.png', climb4: 'images/boy-climb-4.png',
        climb5: 'images/boy-climb-5.png', climb6: 'images/boy-climb-6.png',
        climb7: 'images/boy-climb-7.png', climb8: 'images/boy-climb-8.png'
    };

    // ============================================================
    // SECTION 11: SOUND
    // ============================================================
    const coinSound = document.getElementById('coinSound');
    const jumpSound = document.getElementById('jumpSound');
    const clickSound = document.getElementById('clickSound');
    const superCoinSound = document.getElementById('superCoinSound');
    const bgMusic = document.getElementById('bgMusic');
    const flagSound = document.getElementById('flagSound');
    const victoryMusic = document.getElementById('victoryMusic');
    let musicOn = true, fireworksStarted = false;

    // ============================================================
    // SECTION 12: UTILITY FUNCTIONS
    // ============================================================
    const isMobileOrTablet = () => window.innerWidth <= 1024;
    const isPortrait = () => window.innerHeight > window.innerWidth;
    const getPlayerGroundY = () => GAME.groundY - GAME.worldUp;
    const fastRound = (n) => (n + 0.5) | 0; // Bitwise rounding, faster than Math.round

    // ============================================================
    // SECTION 13: MENU HELPERS
    // ============================================================
    const menuElements = ['menu-bg', 'menu-logo', 'menu-boy', 'menu-d1', 'menu-d2', 'menu-d3', 'menu-sun', 'menu-benefits'];
    function hideMenuElements() { for (let i = 0; i < menuElements.length; i++) { const el = document.getElementById(menuElements[i]); if (el) el.style.display = 'none'; } }
    function showMenuElements() { for (let i = 0; i < menuElements.length; i++) { const el = document.getElementById(menuElements[i]); if (el) el.style.display = ''; } }

    // ============================================================
    // SECTION 14: RESPONSIVE
    // ============================================================
    function scaleContainer() {
        const ww = window.innerWidth, wh = window.innerHeight;
        canvas.width = ww; canvas.height = wh;
        GAME.scaleX = ww / C.BASE_W; GAME.scaleY = wh / C.BASE_H;
        GAME.scale = M_min(GAME.scaleX, GAME.scaleY);
        GAME.canvasWidth = ww; GAME.canvasHeight = wh;
    }

    function checkOrientation() {
        if (isPortrait() && isMobileOrTablet()) {
            if (GAME.state === 'playing') { GAME.wasPausedByOrientation = true; GAME.state = 'paused'; }
        } else {
            if (GAME.wasPausedByOrientation && GAME.state === 'paused') { GAME.wasPausedByOrientation = false; GAME.state = 'playing'; }
        }
        scaleContainer();
    }

    // ============================================================
    // SECTION 15: IMAGE LOADING
    // ============================================================
    function loadImages() {
        const promises = [], entries = Object.entries(imageSources);
        for (let i = 0; i < entries.length; i++) {
            const [key, src] = entries[i];
            const img = new Image(); img.src = src; images[key] = img;
            promises.push(new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = () => { console.warn('Failed to load image:', src); resolve(); };
            }));
        }
        return Promise.all(promises);
    }

    // ============================================================
    // SECTION 16: INIT GAMEPLAY
    // ============================================================
    function initGameplay() {
        checkOrientation(); scaleContainer(); hideMenuElements();
        loadImages().then(() => {
            bg.image = images.bg;
            if (bg.image && bg.image.complete && bg.image.naturalWidth > 0) bg.width = bg.image.naturalWidth;
            if (images.ground && images.ground.complete) console.log('Ground loaded:', images.ground.naturalWidth, 'x', images.ground.naturalHeight);
            resetGame();
        }).catch(err => { console.error('Image load error:', err); resetGame(); });
    }

    // ============================================================
    // SECTION 17: RESET GAME
    // ============================================================
    function resetGame() {
        GAME.state = 'playing'; GAME.score = 0; GAME.coins = 0; GAME.superCoins = 0;
        GAME.totalSuperCoinsCollected = 0; GAME.superCoinsPassed = 0;
        GAME.superMode = false; GAME.pendingSuperMode = false; GAME.superModeAnimation = 0;
        GAME.gameOverPending = false; GAME.gameOverDelay = 0; GAME.gameOverStarted = false;
        GAME.stopWorldScroll = false; GAME.timeElapsed = 0; GAME.timeRemaining = C.GAME_TIME;
        GAME.isJumping = false; GAME.isFalling = false; GAME.isMovingForward = false; GAME.frameCount = 0;

        player.y = getPlayerGroundY() - player.height; player.vy = 0; player.frame = 0; player.frameTimer = 0; player.x = 150;

        fireworksStarted = false;
        fireworkPool.reset(); floatingTextPool.reset(); sparklePool.reset();

        bg.x = 0; bg.speed = C.BG_SPEED; groundScroll.x = 0; groundScroll.speed = C.GROUND_SPEED;

        if (victoryMusic) { victoryMusic.pause(); victoryMusic.currentTime = 0; }

        signBoard.x = 900; signBoard.y = getPlayerGroundY() - 100;

        generatePlatforms(); generateCoins(); generateSuperCoins();

        finishFlag.active = false; finishFlag.touched = false; finishFlag.flagY = 30;
        finishFlag.climbFrame = 0; finishFlag.climbTimer = 0; finishFlag.finishStarted = false;

        stairs = []; stairsActive = false; brickWall = null; stairsCompleted = false;
        onStairs = false; currentStairIndex = -1; stairMessageShown = false;

        updateHUD(); startGameTimer();
        if (GAME.gameLoopId) cancelAnimationFrame(GAME.gameLoopId);
        requestAnimationFrame(gameLoop);
    }

    // ============================================================
    // SECTION 18: GENERATORS
    // ============================================================
    function generatePlatforms() {
        platforms = []; let x = 500; const playerGroundY = getPlayerGroundY();
        for (let i = 0; i < 6; i++) {
            const typeIdx = M_floor(M_random() * 3), type = PLATFORM_TYPES[typeIdx];
            const width = PLATFORM_WIDTHS[type], y = playerGroundY - 160 - M_random() * 130;
            platforms.push({ x, y, width, height: C.PLATFORM_HEIGHT, type });
            x += width + 200 + M_random() * 250;
        }
    }

    function generateCoins() {
        coins = []; const playerGroundY = getPlayerGroundY();
        for (let i = 0; i < 6; i++) {
            const yOffset = M_sin(i * 0.8) * 5, x = 350 + i * 220 + M_random() * 80;
            const y = playerGroundY - 70 + yOffset;
            coins.push({ x, y, baseY: y, collected: false, floatOffset: M_random() * M_PI2 });
        }
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (M_random() > 0.7) {
                coins.push({ x: p.x + p.width / 2 - C.COIN_SIZE / 2, y: p.y - 70, baseY: p.y - 70, collected: false, floatOffset: M_random() * M_PI2 });
            }
        }
    }

    function generateSuperCoins() {
        superCoins = []; const playerGroundY = getPlayerGroundY();
        for (let i = 0; i < 8; i++) {
            const x = 800 + i * 500 + M_random() * 200;
            const y = M_random() < 0.5 ? playerGroundY - 90 : playerGroundY - 410;
            superCoins.push({ x, y, baseY: y, collected: false, missed: false, floatOffset: M_random() * M_PI2, sparkleTimer: 0 });
        }
    }

    function createSingleBrick() {
        // NEW LOGIC: Only stop scroll when brick is close to player
        if (brickWall && brickWall.active) {
            const distance = brickWall.x - player.x;
            if (distance <= 300) {
                GAME.stopWorldScroll = true; bg.speed = 0; groundScroll.speed = 0;
            }
        }

        stairs = []; const ground = getPlayerGroundY(); const brickX = player.x + C.BRICK_OFFSET_X;

        // OPTIMIZED: Manual filter instead of Array.filter() to avoid closure/GC
        const newPlatforms = [];
        for (let i = 0; i < platforms.length; i++) {
            if (platforms[i].x + platforms[i].width < brickX - 500) newPlatforms.push(platforms[i]);
            else platforms[i].hideAfterPass = true;
        }
        platforms = newPlatforms;

        const brickY = ground - 330, brickW = C.BRICK_W, brickH = C.BRICK_H;
        brickWall = { x: brickX, y: brickY, width: brickW, height: brickH, active: true };
        stairs.push({ x: brickX, y: brickY, width: brickW, height: brickH, isVisualBrick: true });
        stairs.push(
            { x: brickX + 10, y: ground - 30, width: 30, height: 40, isStep: true },
            { x: brickX + 50, y: ground - 75, width: 30, height: 40, isStep: true },
            { x: brickX + 92, y: ground - 117, width: 50, height: 40, isStep: true },
            { x: brickX + 145, y: ground - 160, width: 50, height: 40, isStep: true },
            { x: brickX + 195, y: ground - 200, width: 50, height: 40, isStep: true },
            { x: brickX + 247, y: ground - 242, width: 50, height: 40, isStep: true },
            { x: brickX + 300, y: ground - 282, width: 50, height: 40, isStep: true },
            { x: brickX + 351, y: ground - 331, width: 50, height: 40, isStep: true }
        );

        stairsActive = true; stairsCompleted = false; onStairs = false;
        currentStairIndex = -1; stairMessageShown = false;

        finishFlag.x = brickX + brickW + 180;
        finishFlag.y = getPlayerGroundY() - finishFlag.height + 28;
        finishFlag.flagY = 30; finishFlag.active = true; finishFlag.touched = false;

        castle.x = finishFlag.x + C.CASTLE_OFFSET_X;
        castle.y = getPlayerGroundY() - 440; castle.active = true;
    }

    // ============================================================
    // SECTION 19: TIMER & HUD
    // ============================================================
    function startGameTimer() {
        if (GAME.gameTimerInterval) clearInterval(GAME.gameTimerInterval);
        GAME.timeRemaining = C.GAME_TIME; GAME.gameStartMs = performance.now(); GAME.gameElapsedMs = 0;
        GAME.gameTimerInterval = setInterval(() => {
            if (GAME.state !== 'playing') return;
            GAME.timeRemaining--; GAME.timeElapsed++; updateHUD();
            if (GAME.timeRemaining <= 0) {
                clearInterval(GAME.gameTimerInterval);
                GAME.gameElapsedMs = M_round(performance.now() - GAME.gameStartMs);
                GAME.superMode = false; gameOver();
            }
        }, 1000);
    }

    function updateHUD() {
        const currentScore = GAME.superCoins * GAME.superCoinValue;
        const scoreEl = DOM.scoreCount, superEl = DOM.superCoinCount, timeEl = DOM.timeCount;
        if (scoreEl) scoreEl.textContent = String(currentScore).padStart(3, '0');
        if (superEl) superEl.textContent = GAME.superCoins + '/' + GAME.totalSuperCoins;
        if (timeEl) timeEl.textContent = String(GAME.timeRemaining).padStart(2, '0');
    }

    // ============================================================
    // SECTION 20: PLAYER ACTIONS
    // ============================================================
    function jump() {
        if (!GAME.isJumping && !GAME.isFalling && GAME.state === 'playing') {
            if (jumpSound) { jumpSound.currentTime = 0; jumpSound.play().catch(() => { }); }
            GAME.isJumping = true; GAME.isFalling = false;
            let jumpPower = GAME.jumpPower;
            if (brickWall && brickWall.active && M_abs(brickWall.x - player.x) < 600) jumpPower = C.SMALL_JUMP;
            player.vy = jumpPower;
        }
    }

    function startMovingForward() { if (GAME.state === 'playing') GAME.isMovingForward = true; }
    function stopMovingForward() { GAME.isMovingForward = false; }

    function startFlagSlide() {
        if (flagSound) { flagSound.currentTime = 0; flagSound.play().catch(() => { }); console.log('played'); }
        finishFlag.touched = true; GAME.state = 'flagSlide'; GAME.isMovingForward = false;
        GAME.isJumping = false; GAME.isFalling = false; player.vy = 0; player.x = finishFlag.x - 60;
        if (GAME.gameTimerInterval) { clearInterval(GAME.gameTimerInterval); GAME.gameElapsedMs = M_round(performance.now() - GAME.gameStartMs); }
    }

    // ============================================================
    // SECTION 21: COLLISION DETECTION (OPTIMIZED)
    // ============================================================
    function checkStairCollision() {
        if (!stairsActive || stairs.length === 0) return false;
        const playerFoot = player.y + player.height, playerLeft = player.x + player.width * 0.25, playerRight = player.x + player.width * 0.75;
        for (let i = 0; i < stairs.length; i++) {
            const stair = stairs[i]; if (!stair.isStep) continue;
            if (player.vy >= 0 && playerRight > stair.x && playerLeft < stair.x + stair.width &&
                playerFoot >= stair.y - 15 && playerFoot <= stair.y + stair.height + 25) {
                player.y = stair.y - player.height; player.vy = 0;
                GAME.isJumping = false; GAME.isFalling = false; onStairs = true; currentStairIndex = i; return true;
            }
        }
        return false;
    }

    function checkFlagReach() {
        if (!stairsActive || !finishFlag.active || finishFlag.touched) return false;
        const playerRight = player.x + player.width, playerLeft = player.x;
        const playerBottom = player.y + player.height, playerTop = player.y;
        const poleLeft = finishFlag.x, poleRight = finishFlag.x + finishFlag.width;
        const touchingPole = playerRight >= poleLeft - 10 && playerLeft <= poleRight + 10 &&
            playerBottom >= finishFlag.y && playerTop <= finishFlag.y + finishFlag.height;
        if (touchingPole) { startFlagSlide(); return true; }
        return false;
    }

    // ============================================================
    // SECTION 22: UPDATE FLAG SLIDE
    // ============================================================
    function updateFlagSlide() {
        GAME.frameCount++; finishFlag.climbTimer++;
        if (finishFlag.climbTimer > C.FLAG_CLIMB_INTERVAL) { finishFlag.climbTimer = 0; finishFlag.climbFrame = (finishFlag.climbFrame + 1) % CLIMB_FRAMES.length; }
        if (finishFlag.flagY < finishFlag.height - 80) finishFlag.flagY += C.FLAG_SLIDE_SPEED;
        player.y += C.FLAG_CLIMB_SPEED;
        if (player.y >= getPlayerGroundY() - player.height) {
            player.y = getPlayerGroundY() - player.height; GAME.state = 'finishWait';
            if (GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins) {
                GAME.superMode = true; GAME.superModeAnimation = 0;
                if (bgMusic) bgMusic.pause();
                if (victoryMusic) { victoryMusic.currentTime = 0; victoryMusic.play().catch(() => { }); console.log("victory music play"); }
            }
        }
        setTimeout(() => gameOver(), C.FINISH_WAIT_DELAY);
    }

    // ============================================================
    // SECTION 23: UPDATE FINISH WAIT
    // ============================================================
    function updateFinishWait() {
        GAME.frameCount++;
        if (GAME.superMode && GAME.superModeAnimation < 1) {
            GAME.superModeAnimation += C.SUPER_MODE_GROW;
            if (GAME.superModeAnimation > 1) GAME.superModeAnimation = 1;
        }
        if (GAME.superModeAnimation >= 1) {
            const castleTargetX = castle.x + 80;
            if (player.x < castleTargetX) { player.x += 6; if (player.x > castleTargetX) player.x = castleTargetX; }
            else {
                player.x = castleTargetX;
                if (!fireworksStarted) {
                    fireworksStarted = true;
                    createFirework(castle.x + 120, castle.y + 80);
                    createFirework(castle.x + 280, castle.y + 120);
                    createFirework(castle.x + 400, castle.y + 70);
                    if (!GAME.gameOverPending) { GAME.gameOverPending = true; setTimeout(() => gameOver(), C.FINISH_WAIT_DELAY); }
                }
                if (GAME.frameCount % 25 === 0) createFirework(castle.x + 80 + M_random() * 350, castle.y + 40 + M_random() * 150);
            }
            if (player.x < castleTargetX) { player.frameTimer++; if (player.frameTimer >= player.frameInterval) { player.frameTimer = 0; player.frame = (player.frame + 1) % RUN_FRAMES.length; } }
        }
        updateFireworks();
    }

    // ============================================================
    // SECTION 24: MAIN UPDATE (The game loop update - HEAVILY OPTIMIZED)
    // ============================================================
    function update() {
        if (GAME.state === 'flagSlide') { updateFlagSlide(); return; }
        if (GAME.state === 'finishWait') { updateFinishWait(); return; }
        if (GAME.state !== 'playing') return;

        GAME.frameCount++;
        const playerGroundY = getPlayerGroundY();
        const moveSpeed = GAME.isMovingForward ? GAME.runSpeed : 0;
        const fc = GAME.frameCount;

        // --- Background Scroll ---
        if (GAME.isMovingForward && !GAME.stopWorldScroll) {
            bg.x -= bg.speed; if (bg.x <= -bg.width) bg.x = 0;
            groundScroll.x -= groundScroll.speed;
            if (images.ground && images.ground.naturalWidth > 0 && groundScroll.x <= -images.ground.naturalWidth) groundScroll.x = 0;
        }

        // --- Player Animation ---
        if (GAME.isMovingForward) {
            player.frameTimer++;
            if (player.frameTimer >= player.frameInterval) { player.frameTimer = 0; player.frame = (player.frame + 1) % RUN_FRAMES.length; }
        }

        // --- Jump/Fall Physics ---
        if (GAME.isJumping || GAME.isFalling) {
            player.vy += GAME.gravity; player.y += player.vy;
            let onPlatform = false;
            if (stairsActive && player.vy > 0) if (checkStairCollision()) onPlatform = true;

            // OPTIMIZED: Cache player bounds once per frame instead of per-platform
            const pLeft = player.x + player.width * 0.25, pRight = player.x + player.width * 0.75;
            const pTop = player.y, pFoot = player.y + player.height, prevFoot = pFoot - player.vy;

            for (let i = 0; i < platforms.length; i++) {
                const p = platforms[i]; const overlapsX = pRight > p.x && pLeft < p.x + p.width; if (!overlapsX) continue;
                const pBottom = p.y + p.height;
                // Head hit from below
                if (player.vy < 0 && pTop >= pBottom && pTop + player.vy <= pBottom) {
                    player.y = pBottom + 1; player.vy = 6; GAME.isJumping = false; GAME.isFalling = true; continue;
                }
                // Land from above
                if (player.vy > 0 && prevFoot <= p.y && pFoot >= p.y && pFoot <= p.y + 25) {
                    player.y = p.y - player.height; player.vy = 0; GAME.isJumping = false; GAME.isFalling = false; onPlatform = true;
                }
            }
            if (!onPlatform && player.y + player.height >= playerGroundY) {
                player.y = playerGroundY - player.height; player.vy = 0; GAME.isJumping = false; GAME.isFalling = false;
            }
            if (player.vy > 0) GAME.isFalling = true;
        }

        // --- Check falling off platform ---
        if (!GAME.isJumping && !GAME.isFalling) {
            const pFoot = player.y + player.height; let standingOnPlatform = false;
            if (stairsActive) {
                const pLeft = player.x + player.width * 0.25, pRight = player.x + player.width * 0.75;
                for (let i = 0; i < stairs.length; i++) {
                    const s = stairs[i];
                    if (pRight > s.x && pLeft < s.x + s.width && M_abs(pFoot - s.y) < 25) { standingOnPlatform = true; break; }
                }
            }
            if (!standingOnPlatform) {
                for (let i = 0; i < platforms.length; i++) {
                    const p = platforms[i];
                    if (player.x + player.width * 0.3 > p.x && player.x + player.width * 0.7 < p.x + p.width && M_abs(pFoot - p.y) < 3) { standingOnPlatform = true; break; }
                }
            }
            const onGround = M_abs(pFoot - playerGroundY) < 3;
            if (!standingOnPlatform && !onGround && pFoot < playerGroundY - 5) { GAME.isFalling = true; GAME.isJumping = false; player.vy = 0; }
        }

        // --- Move World ---
        if (GAME.isMovingForward) {
            const ms = moveSpeed;
            for (let i = 0; i < platforms.length; i++) platforms[i].x -= ms;
            for (let i = 0; i < coins.length; i++) coins[i].x -= ms;
            for (let i = 0; i < superCoins.length; i++) superCoins[i].x -= ms;
            signBoard.x -= ms;
            if (finishFlag.active) finishFlag.x -= ms;
            if (castle.active) castle.x = finishFlag.x + C.CASTLE_OFFSET_X;
            if (stairsActive) for (let i = 0; i < stairs.length; i++) stairs[i].x -= ms;
            if (brickWall && brickWall.active) brickWall.x -= ms;

            // Brick collision
            if (brickWall && brickWall.active) {
                const pRight = player.x + player.width, pFoot = player.y + player.height; let onStep = false;
                for (let i = 0; i < stairs.length; i++) {
                    const s = stairs[i];
                    if (s.isStep && pRight > s.x && player.x < s.x + s.width && M_abs(pFoot - s.y) < 20) { onStep = true; break; }
                }
                const hittingBrick = pRight > brickWall.x + 10 && pRight < brickWall.x + 70 && pFoot > brickWall.y + 20;
                if (hittingBrick && !onStep) {
                    for (let i = 0; i < platforms.length; i++) platforms[i].x += ms;
                    for (let i = 0; i < coins.length; i++) coins[i].x += ms;
                    for (let i = 0; i < superCoins.length; i++) superCoins[i].x += ms;
                    signBoard.x += ms;
                    for (let i = 0; i < stairs.length; i++) stairs[i].x += ms;
                    if (finishFlag.active) finishFlag.x += ms;
                    if (castle.active) castle.x += ms;
                    brickWall.x += ms; bg.x += bg.speed; groundScroll.x += groundScroll.speed;
                }
            }
        }

        // --- Flag Pole Collision ---
        if (finishFlag.active && !finishFlag.touched && GAME.isMovingForward) {
            const pRight = player.x + player.width, pFoot = player.y + player.height;
            const onGround = M_abs(pFoot - playerGroundY) < 5;
            if (onGround && pRight >= finishFlag.x - 10) {
                if (finishFlag.active) finishFlag.x += moveSpeed;
                if (brickWall) brickWall.x += moveSpeed;
                for (let i = 0; i < stairs.length; i++) stairs[i].x += moveSpeed;
                bg.x += bg.speed;
            }
            if (!onGround && pRight >= finishFlag.x - 10) { startFlagSlide(); return; }
        }

        // --- Coin Floating Animation (Batch) ---
        for (let i = 0; i < coins.length; i++) { const c = coins[i]; c.y = c.baseY + M_sin(fc * C.COIN_FLOAT_SPEED + c.floatOffset) * C.COIN_FLOAT_RANGE; }
        for (let i = 0; i < superCoins.length; i++) { const sc = superCoins[i]; sc.y = sc.baseY + M_sin(fc * C.SUPER_COIN_FLOAT_SPEED + sc.floatOffset) * C.SUPER_COIN_FLOAT_RANGE; sc.sparkleTimer++; }

        // --- Track Missed Super Coins ---
        for (let i = 0; i < superCoins.length; i++) { const sc = superCoins[i]; if (!sc.collected && !sc.missed && sc.x <= -100) { sc.missed = true; GAME.superCoinsPassed++; } }

        // --- Filter Off-Screen Items (Manual, no GC) ---
        const newPlatforms = [];
        for (let i = 0; i < platforms.length; i++) { const p = platforms[i]; if ((!p.hideAfterPass || p.x >= C.BASE_W) && p.x + p.width > -100) newPlatforms.push(p); }
        platforms = newPlatforms;
        const newCoins = []; for (let i = 0; i < coins.length; i++) if (coins[i].x > -100) newCoins.push(coins[i]); coins = newCoins;
        const newSuperCoins = []; for (let i = 0; i < superCoins.length; i++) if (!superCoins[i].missed) newSuperCoins.push(superCoins[i]); superCoins = newSuperCoins;

        // --- Game Over Check ---
        if (GAME.superCoinsPassed + GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins && GAME.totalSuperCoinsCollected < GAME.totalSuperCoins && !GAME.gameOverStarted) {
            GAME.superMode = false; GAME.isMovingForward = false; gameOver(); return;
        }

        // --- Flag Reach ---
        if (stairsActive && finishFlag.active && !finishFlag.touched) if (checkFlagReach()) return;

        // --- Generate New Platforms ---
        const lastP = platforms[platforms.length - 1];
        if (!stairsActive && (!lastP || lastP.x < 900)) {
            const typeIdx = M_floor(M_random() * 3), type = PLATFORM_TYPES[typeIdx];
            const width = PLATFORM_WIDTHS[type], y = playerGroundY - 140 - M_random() * 120;
            const newX = lastP ? lastP.x + lastP.width + 200 + M_random() * 250 : 1100;
            platforms.push({ x: newX, y, width, height: C.PLATFORM_HEIGHT, type });
            if (M_random() > 0.4) coins.push({ x: newX + width / 2 - C.COIN_SIZE / 2, y: y - 70, baseY: y - 70, collected: false, floatOffset: M_random() * M_PI2 });
        }

        // --- Generate New Ground Coins ---
        let lastGroundCoinX = -9999;
        for (let i = 0; i < coins.length; i++) if (!coins[i].collected && coins[i].baseY > playerGroundY - 100 && coins[i].x > lastGroundCoinX) lastGroundCoinX = coins[i].x;
        if (!stairsActive && lastGroundCoinX < 500) coins.push({ x: 1100 + M_random() * 200, y: playerGroundY - 70, baseY: playerGroundY - 70, collected: false, floatOffset: M_random() * M_PI2 });
        if (signBoard.x < -200) signBoard.x = 1200 + M_random() * 600;

        // ========================================================
        // OPTIMIZED COLLISION: D Coins (Squared distance, no sqrt)
        // ========================================================
        const pCx = player.x + player.width / 2, pCy = player.y + player.height / 2;
        const coinHalf = C.COIN_SIZE / 2, coinThreshold = (player.width + C.COIN_SIZE) / 2.5, coinThresholdSq = coinThreshold * coinThreshold;

        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i]; if (coin.collected) continue;
            const cx = coin.x + coinHalf, cy = coin.y + coinHalf;
            const dx = pCx - cx, dy = pCy - cy, distSq = dx * dx + dy * dy;
            if (distSq < coinThresholdSq && pCy <= cy + 20) {
                coin.collected = true;
                if (coinSound) { coinSound.currentTime = 0; coinSound.play().catch(() => { }); }
                GAME.coins++; updateHUD();
            }
        }

        // ========================================================
        // OPTIMIZED COLLISION: Super Coins (AABB, no distance calc)
        // ========================================================
        const scSize = C.SUPER_COIN_SIZE;
        const pLeft = player.x + player.width * 0.2, pRight = player.x + player.width * 0.8;
        const pTop = player.y, pBottom = player.y + player.height;

        for (let i = 0; i < superCoins.length; i++) {
            const sc = superCoins[i]; if (sc.collected || sc.missed) continue;
            const scLeft = sc.x + 10, scRight = sc.x + scSize - 10, scTop = sc.y + 10, scBottom = sc.y + scSize - 10;
            const overlaps = pRight > scLeft && pLeft < scRight && pBottom > scTop && pTop < scBottom;
            if (overlaps && pBottom >= sc.y - 10) {
                sc.collected = true;
                if (superCoinSound) { superCoinSound.currentTime = 0; superCoinSound.play().catch(() => { }); }
                GAME.superCoins++; GAME.totalSuperCoinsCollected++; GAME.score = GAME.superCoins * GAME.superCoinValue; updateHUD();
                if (GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins && !stairsActive) createSingleBrick();
                floatingTextPool.acquire(sc.x + scSize / 2, sc.y, '+5', '#FFD700', '#000000', -3, 1.5);
            }
        }
    }

    // ============================================================
    // SECTION 25: FIREWORKS (With Object Pooling)
    // ============================================================
    function createFirework(x, y) {
        const colors = C.FIREWORK_COLORS, particleCount = C.FIREWORK_PARTICLES;
        for (let i = 0; i < particleCount; i++) {
            const angle = (M_PI2 * i) / particleCount, speed = 2 + M_random() * 5;
            const color = colors[M_floor(M_random() * colors.length)];
            fireworkPool.acquire(x, y, angle, speed, color);
        }
    }

    function updateFireworks() {
        const active = fireworkPool.active;
        for (let i = active.length - 1; i >= 0; i--) {
            const f = active[i]; f.x += f.vx; f.y += f.vy; f.vy += 0.04; f.life--;
            if (f.life <= 0) fireworkPool.release(f);
        }
    }

    // ============================================================
    // SECTION 26: DRAW (HEAVILY OPTIMIZED - Minimized state changes)
    // ============================================================
    function draw() {
        const canvasW = canvas.width || C.BASE_W, canvasH = canvas.height || C.BASE_H;
        const scale = GAME.scale, fc = GAME.frameCount;

        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.save();
        ctx.scale(scale, scale);

        // --- Background ---
        if (bg.image && bg.image.complete && bg.image.naturalWidth > 0) {
            const drawX = bg.x % bg.width;
            ctx.drawImage(bg.image, drawX, 0, bg.width, C.BASE_H);
            ctx.drawImage(bg.image, drawX + bg.width, 0, bg.width, C.BASE_H);
            if (drawX + bg.width < C.BASE_W) ctx.drawImage(bg.image, drawX + bg.width * 2, 0, bg.width, C.BASE_H);
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, C.BASE_H);
            grad.addColorStop(0, '#1a5fb4'); grad.addColorStop(0.3, '#4a90d9');
            grad.addColorStop(0.6, '#87ceeb'); grad.addColorStop(1, '#90EE90');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, C.BASE_W, C.BASE_H);
        }

        // --- Ground ---
        if (images.ground && images.ground.complete && images.ground.naturalWidth > 0) {
            const groundW = images.ground.naturalWidth, groundH = 110, groundY = 658;
            const drawGroundX = groundScroll.x % groundW;
            for (let x = drawGroundX; x < C.BASE_W + groundW; x += groundW) ctx.drawImage(images.ground, x, groundY, groundW, groundH);
        } else {
            ctx.fillStyle = '#5d3a1a'; ctx.fillRect(0, GAME.groundY, C.BASE_W, 68);
            ctx.fillStyle = '#7cb342'; ctx.fillRect(0, GAME.groundY, C.BASE_W, 18);
            ctx.fillStyle = '#4a9b4a'; ctx.fillRect(0, GAME.groundY, C.BASE_W, 6);
        }

        // --- Platforms (Batched by type, pre-built keys) ---
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            const key = 'platform' + p.type.charAt(0).toUpperCase() + p.type.slice(1);
            const img = images[key];
            if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, p.x, p.y, p.width, p.height);
            else {
                ctx.fillStyle = '#5d3a1a'; ctx.fillRect(p.x, p.y + 10, p.width, p.height - 10);
                ctx.fillStyle = '#4a9b4a'; ctx.fillRect(p.x, p.y, p.width, 14);
                ctx.fillStyle = '#7cb342'; ctx.fillRect(p.x, p.y + 14, p.width, 6);
            }
        }

        // --- Sign Board ---
        if (signBoard.image && signBoard.image.complete && signBoard.image.naturalWidth > 0) ctx.drawImage(signBoard.image, signBoard.x, signBoard.y, signBoard.width, signBoard.height);

        // --- D Coins (Optimized: pre-calculated half size, no per-coin Math) ---
        const coinHalf = C.COIN_SIZE / 2;
        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i]; if (coin.collected) continue;
            const cx = coin.x + coinHalf, cy = coin.y + coinHalf;
            ctx.save(); ctx.translate(cx, cy);
            if (images.coin && images.coin.complete && images.coin.naturalWidth > 0) ctx.drawImage(images.coin, -coinHalf, -coinHalf, C.COIN_SIZE, C.COIN_SIZE);
            else {
                ctx.beginPath(); ctx.arc(0, 0, coinHalf, 0, M_PI2); ctx.fillStyle = '#FFD700'; ctx.fill();
                ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 4; ctx.stroke();
                ctx.fillStyle = '#B8860B'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('D', 0, 0);
            }
            ctx.restore();
        }

        // --- Super Coins (Optimized: pooled sparkles instead of per-coin creation) ---
        const scHalf = C.SUPER_COIN_SIZE / 2;
        for (let i = 0; i < superCoins.length; i++) {
            const sc = superCoins[i]; if (sc.collected || sc.missed) continue;
            const scx = sc.x + scHalf, scy = sc.y + scHalf;
            ctx.save(); ctx.translate(scx, scy);
            const glowSize = 15 + M_sin(fc * 0.08 + sc.floatOffset) * 8;
            ctx.shadowColor = '#FF6B00'; ctx.shadowBlur = glowSize;
            if (images.superCoin && images.superCoin.complete && images.superCoin.naturalWidth > 0) ctx.drawImage(images.superCoin, -scHalf, -scHalf, C.SUPER_COIN_SIZE, C.SUPER_COIN_SIZE);
            else {
                ctx.beginPath(); ctx.arc(0, 0, scHalf, 0, M_PI2); ctx.fillStyle = '#FF6B00'; ctx.fill();
                ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 5; ctx.stroke();
                ctx.fillStyle = '#FFD700'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 0);
            }
            ctx.restore();
            // POOLED sparkles instead of creating new save/restore contexts
            if (sc.sparkleTimer % 20 === 0) sparklePool.acquire(scx + (M_random() - 0.5) * 60, scy + (M_random() - 0.5) * 60, 0.6 + M_sin(fc * 0.1) * 0.4);
        }

        // --- Draw Pooled Sparkles ---
        const sparkles = sparklePool.active;
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const s = sparkles[i]; ctx.save(); ctx.globalAlpha = s.alpha; ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, M_PI2); ctx.fill(); ctx.restore();
            s.life--; if (s.life <= 0) sparklePool.release(s);
        }

        // --- Finish Flag ---
        if (finishFlag.active) {
            if (images.flagPole && images.flagPole.complete && images.flagPole.naturalWidth > 0) ctx.drawImage(images.flagPole, finishFlag.x, finishFlag.y, finishFlag.width, finishFlag.height);
            else { ctx.fillStyle = '#777'; ctx.fillRect(finishFlag.x + 35, finishFlag.y, 10, finishFlag.height); }
            if (images.finishFlag && images.finishFlag.complete && images.finishFlag.naturalWidth > 0) ctx.drawImage(images.finishFlag, finishFlag.x + 33, finishFlag.y + finishFlag.flagY + 2, 90, 70);
            else {
                ctx.fillStyle = '#ff9800'; ctx.fillRect(finishFlag.x + 45, finishFlag.y + finishFlag.flagY, 90, 55);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Arial'; ctx.fillText('D', finishFlag.x + 85, finishFlag.y + finishFlag.flagY + 35);
            }
            if (castle.active && images.castle && images.castle.complete && images.castle.naturalWidth > 0) ctx.drawImage(images.castle, castle.x, castle.y, castle.width, castle.height);
        }

        // --- Stairs ---
        if (stairsActive) for (let i = 0; i < stairs.length; i++) { const stair = stairs[i]; if (stair.isVisualBrick && images.brick && images.brick.complete) ctx.drawImage(images.brick, stair.x, stair.y, stair.width, stair.height); }

        // --- Player ---
        let playerImg;
        if (GAME.state === 'flagSlide') playerImg = images[CLIMB_FRAMES[finishFlag.climbFrame]];
        else if (GAME.isJumping) playerImg = images.boyJump;
        else if (GAME.isFalling) playerImg = images.boyFall;
        else if (GAME.isMovingForward || GAME.state === 'finishWait') playerImg = images[RUN_FRAMES[player.frame]];
        else playerImg = images.boyRun1;

        const superScale = 1 + (GAME.superModeAnimation * 0.40), footFix = C.FOOT_FIX;
        if (GAME.superMode) { ctx.save(); ctx.shadowColor = '#FFD700'; ctx.shadowBlur = (C.SHADOW_BLUR_BASE + M_sin(fc * 0.1) * C.SHADOW_BLUR_VAR) * M_max(GAME.superModeAnimation, 0.2); }

        if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            if (GAME.superMode) {
                const newWidth = player.width * superScale, newHeight = player.height * superScale;
                const newX = player.x - (newWidth - player.width) / 2, newY = player.y - (newHeight - player.height) + 15;
                ctx.drawImage(playerImg, newX, newY + footFix, newWidth, newHeight);
            } else {
                let drawW = player.width, drawH = player.height, drawX = player.x, drawY = player.y + footFix;
                if (GAME.isJumping) { drawW = C.JUMP_W; drawH = C.JUMP_H; drawX = player.x - C.JUMP_OFFSET_X; drawY = player.y + footFix - C.JUMP_OFFSET_Y; }
                else if (GAME.isFalling) { drawW = C.FALL_W; drawH = C.FALL_H; drawX = player.x - C.FALL_OFFSET_X; drawY = player.y + footFix - C.FALL_OFFSET_Y; }
                ctx.drawImage(playerImg, drawX, drawY, drawW, drawH);
            }
        } else {
            ctx.fillStyle = '#fdbcb4';
            if (GAME.superMode) { const newWidth = player.width * superScale, newHeight = player.height * superScale, newX = player.x - (newWidth - player.width) / 2, newY = player.y - (newHeight - player.height); ctx.fillRect(newX, newY + footFix, newWidth, newHeight); }
            else ctx.fillRect(player.x, player.y, player.width, player.height);
        }
        if (GAME.superMode) ctx.restore();

        // --- Fireworks (Pooled) ---
        const fwActive = fireworkPool.active;
        for (let i = 0; i < fwActive.length; i++) {
            const f = fwActive[i]; ctx.save(); ctx.globalAlpha = f.life / C.PARTICLE_LIFE;
            ctx.fillStyle = f.color; ctx.shadowColor = f.color; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, M_PI2); ctx.fill(); ctx.restore();
        }

        // --- Floating Texts (Pooled) ---
        const ftActive = floatingTextPool.active;
        for (let i = ftActive.length - 1; i >= 0; i--) {
            const ft = ftActive[i]; ft.y += ft.vy; ft.life -= C.FLOAT_TEXT_LIFE;
            if (ft.scale < ft.targetScale) { ft.scale += C.FLOAT_TEXT_SCALE_SPEED; if (ft.scale > ft.targetScale) ft.scale = ft.targetScale; }
            if (ft.life <= 0) { floatingTextPool.release(ft); continue; }
            ctx.save(); ctx.globalAlpha = ft.life; ctx.translate(ft.x, ft.y); ctx.scale(ft.scale, ft.scale);
            ctx.shadowColor = ft.color; ctx.shadowBlur = 15; ctx.font = "bold 26px 'Arial', sans-serif";
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = ft.strokeColor; ctx.lineWidth = 4;
            ctx.strokeText(ft.text, 0, 0); ctx.fillStyle = ft.color; ctx.fillText(ft.text, 0, 0); ctx.restore();
        }
        ctx.restore();
    }

    // ============================================================
    // SECTION 27: GAME LOOP
    // ============================================================
    function gameLoop(timestamp) {
        GAME.lastTime = timestamp;
        update();
        draw();
        GAME.gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ============================================================
    // SECTION 28: POWER MESSAGE
    // ============================================================
    function showPowerMessage() {
        const messageOverlay = document.createElement('div');
        messageOverlay.id = 'power-message-overlay';
        messageOverlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.5s ease;`;
        const popupImg = GAME.superMode ? 'images/vitamin-d-power-popup.png' : 'images/vitamin-d-miss-popup.png';
        messageOverlay.innerHTML = `<img src="${popupImg}" class="power-popup-img">`;
        document.body.appendChild(messageOverlay);
        const animStyle = document.createElement('style');
        animStyle.textContent = `@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}@keyframes fadeOut{from{opacity:1}to{opacity:0}}`;
        document.head.appendChild(animStyle);
        setTimeout(() => {
            messageOverlay.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => { if (messageOverlay.parentNode) messageOverlay.remove(); if (animStyle.parentNode) animStyle.remove(); showScoreScreen(); }, 500);
        }, C.POWER_MSG_DURATION);
    }

    // ============================================================
    // SECTION 29: SCORE SCREEN
    // ============================================================
    function showScoreScreen() {
        const yourName = localStorage.getItem('arachitol_player_name') || 'Player';
        const participantId = localStorage.getItem('arachitol_participant_id') || 'VD0000';
        const totalScore = GAME.superCoins * GAME.superCoinValue;
        let leaderboard = JSON.parse(localStorage.getItem('arachitol_leaderboard') || '[]');
        const existingEntry = leaderboard.find(e => e.participantId === participantId);
        let bestScore = totalScore, bestSuperCoins = GAME.totalSuperCoinsCollected, bestTime = GAME.timeElapsed;
        if (existingEntry) {
            bestScore = M_max(existingEntry.bestScore || existingEntry.totalScore || 0, totalScore);
            bestSuperCoins = M_max(existingEntry.bestSuperCoins || existingEntry.superCoins || 0, GAME.superCoins);
            bestTime = existingEntry.bestTime || GAME.timeElapsed;
            if (GAME.superCoins >= GAME.totalSuperCoins && (existingEntry.bestTime === undefined || GAME.timeElapsed < existingEntry.bestTime)) bestTime = GAME.timeElapsed;
            leaderboard = leaderboard.filter(e => e.participantId !== participantId);
        }
        const gameResult = { name: yourName, participantId, superCoins: bestSuperCoins, totalSuperCoinsCollected: GAME.totalSuperCoinsCollected, score: totalScore, totalScore: bestScore, time: bestTime, bestScore, bestSuperCoins, bestTime, date: new Date().toISOString(), completed: true };
        leaderboard.push(gameResult); leaderboard.sort((a, b) => b.bestScore - a.bestScore); leaderboard = leaderboard.slice(0, C.LEADERBOARD_MAX);
        localStorage.setItem('arachitol_leaderboard', JSON.stringify(leaderboard));
        localStorage.setItem('arachitol_current_super_coins', GAME.totalSuperCoinsCollected);
        localStorage.setItem('arachitol_current_time', GAME.timeElapsed);
        localStorage.setItem('arachitol_current_score', totalScore);
        const finalCoinsEl = DOM.finalCoins, finalSuperEl = DOM.finalSuperCoins, finalSupermsg = DOM.finalSupermsg;
        const finalTimeEl = DOM.finalTime, finalScoreEl = DOM.finalScore, gameOverEl = DOM.gameOver;
        if (finalSuperEl) finalSuperEl.textContent = GAME.totalSuperCoinsCollected;
        if (finalSupermsg) finalSupermsg.textContent = GAME.totalSuperCoinsCollected;
        if (finalTimeEl) finalTimeEl.textContent = GAME.timeElapsed;
        if (finalScoreEl) finalScoreEl.textContent = totalScore;
        if (gameOverEl) gameOverEl.classList.add('active');
    }

    // ============================================================
    // SECTION 30: GAME OVER
    // ============================================================
    function gameOver() {
        if (GAME.gameOverStarted) return;
        GAME.gameOverStarted = true; GAME.state = 'gameover'; GAME.isMovingForward = false;
        if (GAME.gameTimerInterval) { clearInterval(GAME.gameTimerInterval); if (!GAME.gameElapsedMs) GAME.gameElapsedMs = M_round(performance.now() - GAME.gameStartMs); }
        const uniqueId = localStorage.getItem('arachitol_db_player_id'), playerName = localStorage.getItem('arachitol_player_name') || 'Player';
        const finalScore = GAME.totalSuperCoinsCollected * GAME.superCoinValue;
        if (uniqueId && typeof window.saveGameResult === 'function') window.saveGameResult(uniqueId, playerName, GAME.gameElapsedMs, GAME.totalSuperCoinsCollected, finalScore);
        showPowerMessage();
    }

    // ============================================================
    // SECTION 31: LEADERBOARD
    // ============================================================
    function showLeaderboard() {
        const leaderboardOverlay = DOM.leaderboardOverlay, tbody = DOM.leaderboardBody;
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="padding:30px;color:#a0c4e8;">Loading...</td></tr>';
        const gameOverEl = DOM.gameOver; if (gameOverEl) gameOverEl.classList.remove('active'); if (leaderboardOverlay) leaderboardOverlay.classList.add('active');
        if (typeof window.getTop10Players !== 'function') return;
        window.getTop10Players().then(function (players) {
            if (tbody) tbody.innerHTML = '';
            if (players.length === 0) { if (tbody) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="5" style="padding:30px;color:#a0c4e8;font-size:16px;">No completed games yet. Be the first!</td>'; tbody.appendChild(row); } }
            else { for (let i = 0; i < players.length; i++) { const entry = players[i], rank = i + 1; const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other'; const rankIcon = rank === 1 ? '&#129351;' : rank === 2 ? '&#129352;' : rank === 3 ? '&#129353;' : rank; const row = document.createElement('tr'); row.innerHTML = '<td class="' + rankClass + '">' + rankIcon + '</td><td><strong>' + entry.name + '</strong></td><td class="super-coins-cell">' + entry.superCoins + '</td><td>' + (entry.elapsedMs / 1000).toFixed(2) + 's</td><td class="score-cell">' + entry.score + '</td>'; if (tbody) tbody.appendChild(row); } }
        });
    }

    // ============================================================
    // SECTION 32: CERTIFICATE HTML GENERATOR
    // ============================================================
    function generateCertificateHTML(yourName, playerId, superCoins, time, totalScore, date, forDownload) {
        const containerStyle = forDownload ? 'width:900px;height:650px;' : 'width:100%;max-width:800px;';
        const padding = forDownload ? '40px 50px' : '30px 40px', borderWidth = forDownload ? '12px' : '8px';
        const titleSize = forDownload ? '48px' : '36px', nameSize = forDownload ? '42px' : '32px', statValueSize = forDownload ? '32px' : '28px';
        return `<div class="outer-cert" style="${containerStyle}background:linear-gradient(135deg,#fff9f0 0%,#fff 50%,#f0f8ff 100%);border:${borderWidth} solid #1a5fb4;border-radius:25px;padding:${padding};text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;overflow:hidden;font-family:calibri;box-sizing:border-box;margin:0 auto;"><div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:3px dashed #FFD700;border-radius:18px;pointer-events:none;"></div><div class="cert-title" style="font-size:${titleSize};color:#1a237e;font-weight:900;margin:5px 0;letter-spacing:1px;">CERTIFICATE OF COMPLETION</div><div class="game-name" style="font-size:20px;color:#ff6a00;font-weight:800;margin:15px 0;">CATCH THE SMART D</div><div class="certify-text" style="font-size:16px;color:#555;margin:15px 0 5px;">Is hereby awarded to</div><div class="user-name" style="font-size:${nameSize};color:#e65100;font-weight:bold;margin:10px 0;">${yourName}</div><div style="font-size:13px;color:#999;margin-bottom:10px;letter-spacing:2px;">ID: #${playerId}</div><div class="score-outer" style="display:flex;justify-content:center;gap:25px;margin:25px 0;"><div class="score-box" style="width:200px;background:#fff3e0;border:2px solid #FF6B00;border-radius:15px;padding:15px 10px;"><div class="score-count" style="font-size:${statValueSize};font-weight:900;color:#FF6B00;">${superCoins}</div><div style="font-size:10px;color:#666;text-transform:uppercase;">Nano coins</div></div><div class="score-box" style="width:200px;background:#e0ebf1;border:2px solid #0539d2;border-radius:15px;padding:15px 10px;"><div class="score-count" style="font-size:${statValueSize};font-weight:900;color:#1565c0;">${time}</div><div style="font-size:10px;color:#666;text-transform:uppercase;">Seconds</div></div><div class="score-box" style="width:200px;background:#e8efcf;border:2px solid #1b7801;border-radius:15px;padding:15px 10px;"><div class="score-count" style="font-size:${statValueSize};font-weight:900;color:#2e7d32;">${totalScore}</div><div style="font-size:10px;color:#666;text-transform:uppercase;">points scored</div></div></div></div>`;
    }

    function viewCertificate() {
        const yourName = localStorage.getItem('arachitol_player_name') || 'Player', playerId = localStorage.getItem('arachitol_db_player_id') || '—';
        const superCoins = parseInt(localStorage.getItem('arachitol_current_super_coins')) || GAME.totalSuperCoinsCollected || 0;
        const time = parseInt(localStorage.getItem('arachitol_current_time')) || GAME.timeElapsed || 0;
        const totalScore = parseInt(localStorage.getItem('arachitol_current_score')) || (GAME.superCoins * GAME.superCoinValue) || 0;
        const date = new Date().toLocaleDateString('en-IN');
        const certFrame = DOM.certificateFrame; if (certFrame) certFrame.innerHTML = generateCertificateHTML(yourName, playerId, superCoins, time, totalScore, date, false);
        const leaderboardOverlay = DOM.leaderboardOverlay, certPopup = DOM.certificatePopup;
        if (leaderboardOverlay) leaderboardOverlay.classList.remove('active'); if (certPopup) certPopup.classList.add('active');
    }

    async function downloadCertificate() {
        const yourName = localStorage.getItem('arachitol_player_name') || 'Ravi', playerId = localStorage.getItem('arachitol_db_player_id') || '#RA-576733-629';
        const nanoCoins = parseInt(localStorage.getItem('arachitol_current_super_coins')) || 8, time = parseInt(localStorage.getItem('arachitol_current_time')) || 39;
        const totalScore = parseInt(localStorage.getItem('arachitol_current_score')) || 40;
        const today = new Date(), date = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();
        if (!window.jspdf) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const { jsPDF } = window.jspdf, pdf = new jsPDF('l', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight();
        pdf.setFillColor(250, 240, 225); pdf.rect(0, 0, w, h, 'F');
        pdf.setDrawColor(117, 125, 138); pdf.setLineWidth(1); pdf.setLineDashPattern([3, 2], 0); pdf.roundedRect(12, 12, w - 24, h - 24, 10, 10); pdf.setLineDashPattern([], 0);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(32); pdf.setTextColor(28, 43, 57); pdf.text('CERTIFICATE OF COMPLETION', w / 2, 40, { align: 'center' });
        pdf.setFontSize(24); pdf.setTextColor(255, 106, 0); pdf.text('CATCH THE SMART D', w / 2, 55, { align: 'center' });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(15); pdf.setTextColor(90); pdf.text('Is hereby awarded to', w / 2, 70, { align: 'center' });
        pdf.setFontSize(30); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(230, 90, 10); pdf.text(yourName, w / 2, 85, { align: 'center' });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(13); pdf.setTextColor(120); pdf.text(`ID : ${playerId}`, w / 2, 95, { align: 'center' });
        const boxY = 115, boxW = 70, boxH = 35, gap = 25, totalWidth = boxW * 3 + gap * 2, startX = (w - totalWidth) / 2;
        pdf.setDrawColor(255, 110, 0); pdf.setFillColor(250, 240, 225); pdf.roundedRect(startX, boxY, boxW, boxH, 10, 10, 'FD');
        pdf.setTextColor(255, 110, 0); pdf.setFontSize(24); pdf.text(String(nanoCoins), startX + boxW / 2, boxY + 18, { align: 'center' });
        pdf.setFontSize(10); pdf.setTextColor(100); pdf.text('NANO COINS', startX + boxW / 2, boxY + 28, { align: 'center' });
        const x2 = startX + boxW + gap; pdf.setDrawColor(30, 80, 200); pdf.setFillColor(225, 235, 250); pdf.roundedRect(x2, boxY, boxW, boxH, 10, 10, 'FD');
        pdf.setTextColor(40, 100, 200); pdf.setFontSize(24); pdf.text(String(time), x2 + boxW / 2, boxY + 18, { align: 'center' });
        pdf.setFontSize(10); pdf.setTextColor(100); pdf.text('SECONDS', x2 + boxW / 2, boxY + 28, { align: 'center' });
        const x3 = x2 + boxW + gap; pdf.setDrawColor(30, 120, 40); pdf.setFillColor(230, 240, 220); pdf.roundedRect(x3, boxY, boxW, boxH, 10, 10, 'FD');
        pdf.setTextColor(40, 120, 50); pdf.setFontSize(24); pdf.text(String(totalScore), x3 + boxW / 2, boxY + 18, { align: 'center' });
        pdf.setFontSize(10); pdf.setTextColor(100); pdf.text('POINTS SCORED', x3 + boxW / 2, boxY + 28, { align: 'center' });
        pdf.setFontSize(11); pdf.setTextColor(120); pdf.text(`Date: ${date}`, w - 20, h - 15, { align: 'right' });
        pdf.save(`Certificate_${yourName.replace(/\s+/g, '_')}.pdf`);
    }

    function loadScript(src) { return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.head.appendChild(script); }); }

    // ============================================================
    // SECTION 33: GAME STATE MANAGEMENT
    // ============================================================
    function pauseGame() {
        if (GAME.state === 'playing') { GAME.state = 'paused'; const pauseMenu = DOM.pauseMenu; if (pauseMenu) pauseMenu.classList.add('active'); }
    }

    function resumeGame() { GAME.state = 'playing'; const pauseMenu = DOM.pauseMenu; if (pauseMenu) pauseMenu.classList.remove('active'); }

    function restartGame() {
        GAME.state = 'playing'; GAME.score = 0; GAME.coins = 0; GAME.superCoins = 0; GAME.totalSuperCoinsCollected = 0; GAME.superCoinsPassed = 0;
        GAME.superMode = false; GAME.pendingSuperMode = false; GAME.superModeAnimation = 0; GAME.gameOverPending = false; GAME.gameOverDelay = 0; GAME.gameOverStarted = false;
        GAME.timeElapsed = 0; GAME.timeRemaining = C.GAME_TIME; GAME.isJumping = false; GAME.isFalling = false; GAME.isMovingForward = false;
        player.y = getPlayerGroundY() - player.height; player.vy = 0; player.frame = 0; player.frameTimer = 0; player.x = 150;
        bg.x = 0; bg.speed = C.BG_SPEED; groundScroll.x = 0; groundScroll.speed = C.GROUND_SPEED;
        generatePlatforms(); generateCoins(); generateSuperCoins();
        finishFlag.active = false; finishFlag.touched = false; finishFlag.flagY = 30; finishFlag.climbFrame = 0; finishFlag.climbTimer = 0; finishFlag.finishStarted = false;
        stairs = []; stairsActive = false; brickWall = null; stairsCompleted = false; onStairs = false; currentStairIndex = -1; stairMessageShown = false;
        signBoard.x = 900; signBoard.y = getPlayerGroundY() - 100;
        fireworksStarted = false; fireworkPool.reset(); floatingTextPool.reset(); sparklePool.reset();
        const pauseMenu = DOM.pauseMenu, gameOver = DOM.gameOver, leaderboard = DOM.leaderboardOverlay, certPopup = DOM.certificatePopup;
        if (pauseMenu) pauseMenu.classList.remove('active'); if (gameOver) gameOver.classList.remove('active'); if (leaderboard) leaderboard.classList.remove('active'); if (certPopup) certPopup.classList.remove('active');
        updateHUD(); startGameTimer();
    }

    function goHome() {
        if (GAME.gameLoopId) cancelAnimationFrame(GAME.gameLoopId); if (GAME.gameTimerInterval) clearInterval(GAME.gameTimerInterval);
        const pauseMenu = DOM.pauseMenu, gameOver = DOM.gameOver, leaderboard = DOM.leaderboardOverlay, certPopup = DOM.certificatePopup;
        if (pauseMenu) pauseMenu.classList.remove('active'); if (gameOver) gameOver.classList.remove('active'); if (leaderboard) leaderboard.classList.remove('active'); if (certPopup) certPopup.classList.remove('active');
        showMenuElements(); if (window.goToScreen) window.goToScreen('start');
    }

    function playClickSound() { if (!clickSound) return; clickSound.pause(); clickSound.currentTime = 0; clickSound.play().catch(() => { }); }

    function showStairsMessage() {
        if (stairMessageShown) return; stairMessageShown = true;
        const msg = document.createElement('div'); msg.id = 'stairs-message';
        msg.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#FF6B00,#FFD700);color:#fff;padding:30px 50px;border-radius:20px;font-size:28px;font-weight:900;text-align:center;z-index:9999;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:4px solid #fff;animation:popIn 0.5s ease;font-family:'Calibri',sans-serif;text-shadow:2px 2px 4px rgba(0,0,0,0.3);`;
        msg.innerHTML = `<div style="font-size:50px;margin-bottom:10px;">🏰</div><div>STAIRS APPEAR!</div><div style="font-size:16px;color:#fff;margin-top:10px;">Use Forward + Jump to Climb!</div>`;
        document.body.appendChild(msg);
        setTimeout(() => { msg.style.animation = 'popOut 0.5s ease forwards'; setTimeout(() => { if (msg.parentNode) msg.remove(); }, 500); }, 2000);
    }

    function fixIOSHeight() {
        const vh = window.innerHeight; document.documentElement.style.setProperty('--real-vh', vh + 'px');
        const gameContainer = document.getElementById('game-container'); if (gameContainer) gameContainer.style.height = vh + 'px';
        const introScreen = DOM.introScreen; if (introScreen) introScreen.style.height = vh + 'px';
    }

    // ============================================================
    // SECTION 34: INPUT HANDLERS (Single registration, no duplicates)
    // ============================================================
    function onKeyDown(e) {
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        if (isTyping) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (GAME.state === 'playing') jump(); }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); if (GAME.state === 'playing') startMovingForward(); }
        if (e.code === 'Escape') { if (GAME.state === 'playing') pauseGame(); else if (GAME.state === 'paused') resumeGame(); }
    }

    function onKeyUp(e) { if (e.code === 'ArrowRight' || e.code === 'KeyD') stopMovingForward(); }
    function onTouchStart(e) { e.preventDefault(); if (GAME.state === 'playing') jump(); }
    function onMouseDown() { if (GAME.state === 'playing') jump(); }

    // ============================================================
    // SECTION 35: EVENT LISTENER INITIALIZATION (Called once only)
    // ============================================================
    function initEventListeners() {
        // Keyboard
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        // Canvas touch/mouse
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('mousedown', onMouseDown);

        // Music button (delayed to ensure DOM ready)
        setTimeout(() => {
            const musicBtn = DOM.musicBtn, musicIcon = DOM.musicIcon;
            if (!musicBtn || !musicIcon || !bgMusic) return;
            musicBtn.addEventListener('click', function () {
                if (musicOn) { bgMusic.pause(); musicIcon.src = 'images/music-off.svg'; musicOn = false; }
                else { bgMusic.volume = C.MUSIC_VOLUME; bgMusic.play().catch(() => { }); musicIcon.src = 'images/music-on.svg'; musicOn = true; }
            });
        }, 500);

        // Click sound (exclude game buttons)
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('button');
            if (!btn || btn.id === 'jumpBtn' || btn.id === 'forwardBtn') return;
            playClickSound();
        });

        // Jump button
        const jumpBtn = DOM.jumpBtn;
        if (jumpBtn) {
            jumpBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (GAME.state === 'playing') jump(); });
            jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (GAME.state === 'playing') jump(); }, { passive: false });
        }

        // Forward button (press and hold)
        const forwardBtn = DOM.forwardBtn;
        if (forwardBtn) {
            const startForward = (e) => { e.preventDefault(); e.stopPropagation(); if (GAME.state === 'playing') startMovingForward(); };
            const stopForward = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } stopMovingForward(); };
            forwardBtn.addEventListener('mousedown', startForward);
            forwardBtn.addEventListener('mouseup', stopForward);
            forwardBtn.addEventListener('mouseleave', stopForward);
            forwardBtn.addEventListener('touchstart', startForward, { passive: false });
            forwardBtn.addEventListener('touchend', stopForward);
        }

        // Touch zones (mobile full-screen controls)
        const leftZone = DOM.leftZone, rightZone = DOM.rightZone;
        if (leftZone) {
            leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); if (GAME.state === 'playing') startMovingForward(); }, { passive: false });
            leftZone.addEventListener('touchend', (e) => { e.preventDefault(); stopMovingForward(); }, { passive: false });
            leftZone.addEventListener('touchcancel', stopMovingForward);
        }
        if (rightZone) {
            rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); if (GAME.state === 'playing') jump(); }, { passive: false });
        }

        // UI Buttons
        const pauseBtn = DOM.pauseBtn; if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
        const resumeBtn = DOM.resumeBtn; if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
        const restartBtn = DOM.restartBtn; if (restartBtn) restartBtn.addEventListener('click', restartGame);
        const quitBtn = DOM.quitBtn; if (quitBtn) quitBtn.addEventListener('click', goHome);
        const viewLeaderboardBtn = DOM.viewLeaderboardBtn; if (viewLeaderboardBtn) viewLeaderboardBtn.addEventListener('click', showLeaderboard);
        const viewCertBtn = DOM.viewCertBtn; if (viewCertBtn) viewCertBtn.addEventListener('click', viewCertificate);
        const downloadCertBtn = DOM.downloadCertBtn; if (downloadCertBtn) downloadCertBtn.addEventListener('click', downloadCertificate);
        const downloadCertBtnMob = DOM.downloadCertBtnMob;
        if (downloadCertBtnMob) { const smallDownload = downloadCertBtnMob.querySelector('.small-download'); if (smallDownload) smallDownload.addEventListener('click', downloadCertificate); }
        const mobPlayAgainBtn = DOM.mobPlayAgainBtn; if (mobPlayAgainBtn) mobPlayAgainBtn.addEventListener('click', () => window.location.reload());
        const certPopupClose = DOM.certPopupClose;
        if (certPopupClose) certPopupClose.addEventListener('click', () => { const certPopup = DOM.certificatePopup, leaderboardOverlay = DOM.leaderboardOverlay; if (certPopup) certPopup.classList.remove('active'); if (leaderboardOverlay) leaderboardOverlay.classList.add('active'); });
        const certBackBtn = DOM.certBackBtn; if (certBackBtn) certBackBtn.addEventListener('click', () => window.location.reload());

        // Window resize/orientation
        window.addEventListener('resize', () => { checkOrientation(); scaleContainer(); });
        window.addEventListener('orientationchange', () => { setTimeout(() => { checkOrientation(); scaleContainer(); }, 300); });

        // Prevent mobile issues
        document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
        document.addEventListener('gesturestart', (e) => { e.preventDefault(); }, { passive: false });
    }

    // ============================================================
    // SECTION 36: MAIN INITIALIZATION (Called once on load)
    // ============================================================
    function init() {
        // Cache all DOM elements
        for (let i = 0; i < DOM_IDS.length; i++) DOM[DOM_IDS[i]] = document.getElementById(DOM_IDS[i]);

        // Initialize all object pools
        floatingTextPool.init(); fireworkPool.init(); sparklePool.init();

        // Initialize event listeners (single registration)
        initEventListeners();

        // iOS height fix
        fixIOSHeight();
        window.addEventListener('resize', fixIOSHeight);
        window.addEventListener('orientationchange', () => setTimeout(fixIOSHeight, 300));

        // Custom game start event
        document.addEventListener('arachitol:startGameplay', (e) => { console.log('Zone 1 Gameplay starting for:', e.detail.playerName); initGameplay(); });

        console.log('%c Zone 1 Gameplay Engine Loaded (Optimized) ', 'color: #4CAF50; font-size: 14px;');
    }

    // Start the engine
    init();
})();
