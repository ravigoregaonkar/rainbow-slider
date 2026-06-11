// ===== ARAKITOL POWER QUEST - ZONE 1 GAMEPLAY =====
(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('game-container');

    // ===== GAME STATE =====
    const GAME = {
        state: 'menu',
        score: 0,
        coins: 0,
        superCoins: 0,
        totalSuperCoinsCollected: 0,
        superCoinsPassed: 0,
        totalSuperCoins: 8,

        superMode: false,
        pendingSuperMode: false,
        superModeAnimation: 0,

        gameOverDelay: 0,
        gameOverPending: false,
        gameOverStarted: false,

        timeElapsed: 0,
        isJumping: false,
        isFalling: false,
        groundY: 720,
        worldUp: 130,
        gravity: 0.7,
        jumpPower: -21,
        runSpeed: 6,
        coinValue: 10,
        superCoinValue: 20,
        lastTime: 0,
        frameCount: 0,
        gameLoopId: null,
        wasPausedByOrientation: false,
        isMovingForward: false,
        scaleX: 1,
        scaleY: 1,
        scale: 1,
        gameTimerInterval: null
    };

    const isMobileOrTablet = () => window.innerWidth <= 1024;
    const isPortrait = () => window.innerHeight > window.innerWidth;
    const isLandscape = () => window.innerWidth > window.innerHeight;

    function getPlayerGroundY() {
        return GAME.groundY - GAME.worldUp;
    }

    // ===== PLAYER =====
    const player = {
        x: 150,
        y: 0,
        width: 100,
        height: 120,
        vy: 0,
        frame: 0,
        frameTimer: 0,
        frameInterval: 6
    };

    // ===== BACKGROUND =====
    const bg = { x: 0, speed: 2, image: null, width: 6144 };

    // ===== PLATFORMS =====
    let platforms = [];
    const platformTypes = ['small', 'medium', 'large'];
    const platformWidths = { small: 150, medium: 250, large: 400 };
    const platformHeight = 45;

    // ===== COINS =====
    let coins = [];
    const coinSize = 60;
    const coinFloatSpeed = 0.01;
    const coinFloatRange = 10;

    // ===== SUPER COINS =====
    let superCoins = [];
    const superCoinSize = 70;
    const superCoinFloatSpeed = 0.015;
    const superCoinFloatRange = 15;

    // ===== FLOATING TEXTS =====
    let floatingTexts = [];

    // ===== SIGN BOARD =====
    const signBoard = { x: 900, y: 0, width: 160, height: 130, image: null };

    // ===== IMAGES =====
    const images = {};
    const imageSources = {
        bg: 'images/gameplay-bg.png',

        boyRun1: 'images/boy-run-1.png',
        boyRun2: 'images/boy-run-2.png',
        boyRun3: 'images/boy-run-3.png',
        boyRun4: 'images/boy-run-4.png',
        boyRun5: 'images/boy-run-5.png',
        boyRun6: 'images/boy-run-6.png',
        boyRun7: 'images/boy-run-7.png',
        boyRun8: 'images/boy-run-8.png',

        boyJump: 'images/boy-jump.png',
        boyFall: 'images/boy-fall.png',

        coin: 'images/D-coin.png',
        superCoin: 'images/super-coin.png',

        platformSmall: 'images/platform-small.png',
        platformMedium: 'images/platform-medium.png',
        platformLarge: 'images/platform-large.png',

        flagPole: 'images/flag-pole.png',
        finishFlag: 'images/finish-flag.png',

        climb1: 'images/boy-climb-1.png',
        climb2: 'images/boy-climb-2.png',
        climb3: 'images/boy-climb-3.png',
        climb4: 'images/boy-climb-4.png',
        climb5: 'images/boy-climb-5.png',
        climb6: 'images/boy-climb-6.png',
        climb7: 'images/boy-climb-7.png',
        climb8: 'images/boy-climb-8.png'
    };

    const runFrames = [
        'boyRun1',
        'boyRun2',
        'boyRun3',
        'boyRun4',
        'boyRun5',
        'boyRun6',
        'boyRun7',
        'boyRun8'
    ];

    const climbFrames = [
        'climb1',
        'climb2',
        'climb3',
        'climb4',
        'climb5',
        'climb6',
        'climb7',
        'climb8'
    ];

    // ===== FINISH FLAG =====
    const finishFlag = {
        x: 0,
        y: 0,
        width: 58,
        height: 504,
        flagY: 10,
        active: false,
        touched: false,
        climbFrame: 0,
        climbTimer: 0,
        finishStarted: false
    };

    // ===== SOUND =====
    const coinSound = document.getElementById('coinSound');
    const jumpSound = document.getElementById('jumpSound');
    const clickSound = document.getElementById('clickSound');
    const superCoinSound = document.getElementById('superCoinSound');
    const bgMusic = document.getElementById('bgMusic');

    // ===== MUSIC ON-OFF =====
    let musicOn = true;

    setTimeout(function () {
        const musicBtn = document.getElementById('musicBtn');
        const musicIcon = document.getElementById('musicIcon');

        if (!musicBtn || !musicIcon || !bgMusic) return;

        musicBtn.addEventListener('click', function () {
            if (musicOn) {
                bgMusic.pause();
                musicIcon.src = 'images/music-off.svg';
                musicOn = false;
            } else {
                bgMusic.volume = 0.15;
                bgMusic.play().catch(() => { });
                musicIcon.src = 'images/music-on.svg';
                musicOn = true;
            }
        });
    }, 500);

    function playClickSound() {
        if (!clickSound) return;

        clickSound.pause();
        clickSound.currentTime = 0;
        clickSound.play().catch(() => { });
    }

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('button');

        if (!btn || btn.id === 'jumpBtn' || btn.id === 'forwardBtn') return;

        playClickSound();
    });

    // ===== RESPONSIVE =====
    function scaleContainer() {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const baseW = 1024;
        const baseH = 768;

        if (ww <= 1024 && isLandscape()) {
            container.style.width = ww + 'px';
            container.style.height = wh + 'px';
            container.style.transform = 'none';

            canvas.width = ww;
            canvas.height = wh;

            GAME.scaleX = ww / baseW;
            GAME.scaleY = wh / baseH;
            GAME.scale = Math.min(GAME.scaleX, GAME.scaleY);
        } else {
            const scale = Math.min(ww / baseW, wh / baseH);

            container.style.width = baseW + 'px';
            container.style.height = baseH + 'px';
            container.style.setProperty('--scale', scale);
            container.style.transform = 'scale(' + scale + ')';

            canvas.width = baseW;
            canvas.height = baseH;

            GAME.scaleX = 1;
            GAME.scaleY = 1;
            GAME.scale = 1;
        }
    }

    function checkOrientation() {
        if (isPortrait() && isMobileOrTablet()) {
            if (GAME.state === 'playing') {
                GAME.wasPausedByOrientation = true;
                GAME.state = 'paused';
            }
        } else {
            if (GAME.wasPausedByOrientation && GAME.state === 'paused') {
                GAME.wasPausedByOrientation = false;
                GAME.state = 'playing';
            }
        }

        scaleContainer();
    }

    window.addEventListener('resize', function () {
        checkOrientation();
        scaleContainer();
    });

    window.addEventListener('orientationchange', function () {
        setTimeout(function () {
            checkOrientation();
            scaleContainer();
        }, 300);
    });

    // ===== LOAD IMAGES =====
    function loadImages() {
        const promises = [];

        for (const [key, src] of Object.entries(imageSources)) {
            const img = new Image();

            img.src = src;
            images[key] = img;

            promises.push(
                new Promise((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn('Failed to load image:', src);
                        resolve();
                    };
                })
            );
        }

        return Promise.all(promises);
    }

    // ===== MENU ELEMENTS =====
    const menuElements = [
        'menu-bg',
        'menu-logo',
        'menu-boy',
        'menu-d1',
        'menu-d2',
        'menu-d3',
        'menu-sun',
        'menu-benefits'
    ];

    function hideMenuElements() {
        menuElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    function showMenuElements() {
        menuElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
    }

    // ===== INIT =====
    function initGameplay() {
        checkOrientation();
        scaleContainer();
        hideMenuElements();

        loadImages()
            .then(() => {
                bg.image = images.bg;

                if (bg.image && bg.image.complete && bg.image.naturalWidth > 0) {
                    bg.width = bg.image.naturalWidth;
                }

                resetGame();
            })
            .catch(err => {
                console.error('Image load error:', err);
                resetGame();
            });
    }

    // ===== RESET =====
    function resetGame() {
        GAME.state = 'playing';
        GAME.score = 0;
        GAME.coins = 0;
        GAME.superCoins = 0;
        GAME.timeRemaining = 60;
        GAME.totalSuperCoinsCollected = 0;
        GAME.superCoinsPassed = 0;

        GAME.superMode = false;
        GAME.pendingSuperMode = false;
        GAME.superModeAnimation = 0;

        GAME.gameOverPending = false;
        GAME.gameOverDelay = 0;
        GAME.gameOverStarted = false;

        GAME.timeElapsed = 0;
        GAME.isJumping = false;
        GAME.isFalling = false;
        GAME.isMovingForward = false;
        GAME.frameCount = 0;

        player.y = getPlayerGroundY() - player.height;
        player.vy = 0;
        player.frame = 0;
        player.frameTimer = 0;
        player.x = 150;

        bg.x = 0;

        signBoard.x = 900;
        signBoard.y = getPlayerGroundY() - 100;

        generatePlatforms();
        generateCoins();
        generateSuperCoins();
        // setupFinishFlag();
        finishFlag.active = false;
        finishFlag.touched = false;
        finishFlag.flagY = 30;
        finishFlag.climbFrame = 0;
        finishFlag.climbTimer = 0;
        finishFlag.finishStarted = false;

        updateHUD();
        startGameTimer();

        if (GAME.gameLoopId) {
            cancelAnimationFrame(GAME.gameLoopId);
        }

        requestAnimationFrame(gameLoop);
    }

    function generatePlatforms() {
        platforms = [];
        let x = 500;

        for (let i = 0; i < 6; i++) {
            const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
            const width = platformWidths[type];
            const y = getPlayerGroundY() - 160 - Math.random() * 130;

            platforms.push({
                x,
                y,
                width,
                height: platformHeight,
                type
            });

            x += width + 200 + Math.random() * 250;
        }
    }

    function generateCoins() {
        coins = [];

        for (let i = 0; i < 12; i++) {
            const yOffset = Math.sin(i * 0.8) * 5;

            coins.push({
                x: 350 + i * 220 + Math.random() * 80,
                y: getPlayerGroundY() - 70 + yOffset,
                baseY: getPlayerGroundY() - 70 + yOffset,
                collected: false,
                floatOffset: Math.random() * Math.PI * 2
            });
        }

        platforms.forEach((p) => {
            if (Math.random() > 0.4) {
                coins.push({
                    x: p.x + p.width / 2 - coinSize / 2,
                    y: p.y - 70,
                    baseY: p.y - 70,
                    collected: false,
                    floatOffset: Math.random() * Math.PI * 2
                });
            }
        });
    }

    function generateSuperCoins() {
        superCoins = [];
        const playerGroundY = getPlayerGroundY();

        for (let i = 0; i < 8; i++) {
            const x = 800 + i * 500 + Math.random() * 200;
            let y;
            const placementType = Math.random();

            if (placementType < 0.4) {
                y = playerGroundY - 80 - Math.random() * 30;
            } else if (placementType < 0.7) {
                y = playerGroundY - 200 - Math.random() * 150;
            } else {
                y = playerGroundY - 350 - Math.random() * 100;
            }

            superCoins.push({
                x,
                y,
                baseY: y,
                collected: false,
                missed: false,
                floatOffset: Math.random() * Math.PI * 2,
                sparkleTimer: 0
            });
        }
    }

    function setupFinishFlag() {
        const lastSuperCoin = superCoins[superCoins.length - 1];

        finishFlag.x = lastSuperCoin.x + 600;
        finishFlag.y = getPlayerGroundY() - finishFlag.height;
        finishFlag.flagY = 30;
        finishFlag.active = true;
        finishFlag.touched = false;
        finishFlag.climbFrame = 0;
        finishFlag.climbTimer = 0;
        finishFlag.finishStarted = false;
    }

    function startGameTimer() {

        if (GAME.gameTimerInterval) {
            clearInterval(GAME.gameTimerInterval);
        }

        GAME.timeRemaining = 60;

        GAME.gameTimerInterval = setInterval(() => {

            if (GAME.state !== 'playing') return;

            GAME.timeRemaining--;

            updateHUD();

            if (GAME.timeRemaining <= 0) {

                clearInterval(GAME.gameTimerInterval);

                // Time over
                GAME.superMode = false;
                gameOver();
            }

        }, 1000);
    }

    function updateHUD() {
        const currentScore = (GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue);

        const coinEl = document.getElementById('coinCount');
        const superEl = document.getElementById('superCoinCount');
        const timeEl = document.getElementById('timeCount');
        const scoreEl = document.getElementById('scoreCount');

        if (coinEl) coinEl.textContent = String(GAME.coins).padStart(2, '0');
        if (superEl) superEl.textContent = GAME.superCoins + '/' + GAME.totalSuperCoins;
        if (timeEl) timeEl.textContent = String(GAME.timeRemaining).padStart(2, '0');
        if (scoreEl) scoreEl.textContent = String(currentScore).padStart(3, '0');
    }

    function jump() {
        if (!GAME.isJumping && !GAME.isFalling && GAME.state === 'playing') {
            if (jumpSound) {
                jumpSound.currentTime = 0;
                jumpSound.play().catch(() => { });
            }

            GAME.isJumping = true;
            GAME.isFalling = false;
            player.vy = GAME.jumpPower;
        }
    }

    function startMovingForward() {
        if (GAME.state === 'playing') {
            GAME.isMovingForward = true;
        }
    }

    function stopMovingForward() {
        GAME.isMovingForward = false;
    }

    function startFlagSlide() {
        finishFlag.touched = true;

        GAME.state = 'flagSlide';
        GAME.isMovingForward = false;
        GAME.isJumping = false;
        GAME.isFalling = false;

        player.vy = 0;
        player.x = finishFlag.x - 35;

        if (GAME.gameTimerInterval) {
            clearInterval(GAME.gameTimerInterval);
        }
    }

    function updateFlagSlide() {
        GAME.frameCount++;

        finishFlag.climbTimer++;

        if (finishFlag.climbTimer > 6) {
            finishFlag.climbTimer = 0;
            finishFlag.climbFrame = (finishFlag.climbFrame + 1) % climbFrames.length;
        }

        if (finishFlag.flagY < finishFlag.height - 100) {
            finishFlag.flagY += 3;
        }

        player.y += 3;

        if (player.y >= getPlayerGroundY() - player.height) {
            player.y = getPlayerGroundY() - player.height;

            GAME.state = 'finishWait';

            if (GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins) {
                GAME.superMode = true;
                GAME.superModeAnimation = 0;
            }

            setTimeout(() => {
                gameOver();
            }, 5000);
        }
    }

    function updateFinishWait() {
        GAME.frameCount++;

        if (GAME.superMode && GAME.superModeAnimation < 1) {
            GAME.superModeAnimation += 0.015;

            if (GAME.superModeAnimation > 1) {
                GAME.superModeAnimation = 1;
            }
        }
    }

    function update() {
        if (GAME.state === 'flagSlide') {
            updateFlagSlide();
            return;
        }

        if (GAME.state === 'finishWait') {
            updateFinishWait();
            return;
        }

        if (GAME.state !== 'playing') return;

        GAME.frameCount++;

        const playerGroundY = getPlayerGroundY();
        const moveSpeed = GAME.isMovingForward ? GAME.runSpeed : 0;

        // Background scrolls only when moving forward
        if (GAME.isMovingForward) {
            bg.x -= bg.speed;

            if (bg.x <= -bg.width) {
                bg.x = 0;
            }
        }

        // Player running animation only when moving
        if (GAME.isMovingForward) {
            player.frameTimer++;

            if (player.frameTimer >= player.frameInterval) {
                player.frameTimer = 0;
                player.frame = (player.frame + 1) % runFrames.length;
            }
        }

        // Jump/Fall physics
        if (GAME.isJumping || GAME.isFalling) {
            player.vy += GAME.gravity;
            player.y += player.vy;

            let onPlatform = false;

            platforms.forEach((p) => {
                const playerLeft = player.x + player.width * 0.25;
                const playerRight = player.x + player.width * 0.75;
                const playerTop = player.y;
                const playerFoot = player.y + player.height;

                const prevTop = player.y - player.vy;
                const prevFoot = player.y + player.height - player.vy;

                const overlapsX =
                    playerRight > p.x &&
                    playerLeft < p.x + p.width;

                if (!overlapsX) return;

                // Head hit from below - Mario style
                // Head hit from below - automatic Mario style
                if (player.vy < 0 && overlapsX) {

                    const platformBottom = p.y + p.height;
                    const nextTop = player.y + player.vy;

                    if (player.y >= platformBottom && nextTop <= platformBottom) {
                        player.y = platformBottom + 1;
                        player.vy = 6;
                        GAME.isJumping = false;
                        GAME.isFalling = true;
                        return;
                    }
                }

                // Land only from above
                if (
                    player.vy > 0 &&
                    prevFoot <= p.y &&
                    playerFoot >= p.y &&
                    playerFoot <= p.y + 25
                ) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    GAME.isJumping = false;
                    GAME.isFalling = false;
                    onPlatform = true;
                }
            });

            if (!onPlatform && player.y + player.height >= playerGroundY) {
                player.y = playerGroundY - player.height;
                player.vy = 0;
                GAME.isJumping = false;
                GAME.isFalling = false;
            }

            if (player.vy > 0) {
                GAME.isFalling = true;
            }
        }

        // Check if falling off platform
        if (!GAME.isJumping && !GAME.isFalling) {
            const playerFoot = player.y + player.height;
            let standingOnPlatform = false;

            platforms.forEach((p) => {
                if (
                    player.x + player.width * 0.3 > p.x &&
                    player.x + player.width * 0.7 < p.x + p.width &&
                    Math.abs(playerFoot - p.y) < 3
                ) {
                    standingOnPlatform = true;
                }
            });

            const onGround = Math.abs(playerFoot - playerGroundY) < 3;

            if (!standingOnPlatform && !onGround && playerFoot < playerGroundY - 5) {
                GAME.isFalling = true;
                GAME.isJumping = false;
                player.vy = 0;
            }
        }

        // Move world only when forward button pressed
        if (GAME.isMovingForward) {
            platforms.forEach((p) => { p.x -= moveSpeed; });
            coins.forEach((c) => { c.x -= moveSpeed; });
            superCoins.forEach((sc) => { sc.x -= moveSpeed; });
            signBoard.x -= moveSpeed;

            if (finishFlag.active) {
                finishFlag.x -= moveSpeed;
            }
        }

        // Coin floating animation
        coins.forEach((c) => {
            c.y = c.baseY + Math.sin(GAME.frameCount * coinFloatSpeed + c.floatOffset) * coinFloatRange;
        });

        superCoins.forEach((sc) => {
            sc.y = sc.baseY + Math.sin(GAME.frameCount * superCoinFloatSpeed + sc.floatOffset) * superCoinFloatRange;
            sc.sparkleTimer++;
        });

        // Track missed super coins
        superCoins.forEach((sc) => {
            if (!sc.collected && !sc.missed && sc.x <= -100) {
                sc.missed = true;
                GAME.superCoinsPassed++;
            }
        });

        // Remove off-screen items
        platforms = platforms.filter((p) => p.x + p.width > -100);
        coins = coins.filter((c) => c.x > -100);
        superCoins = superCoins.filter((sc) => !sc.missed);
        // If all 8 super coins are passed but not all collected
        if (
            GAME.superCoinsPassed + GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins &&
            GAME.totalSuperCoinsCollected < GAME.totalSuperCoins &&
            !GAME.gameOverStarted
        ) {
            GAME.superMode = false;
            GAME.isMovingForward = false;
            gameOver();
            return;
        }

        // Flag touch detection
        if (
            finishFlag.active &&
            !finishFlag.touched &&
            player.x + player.width > finishFlag.x + 25 &&
            player.x < finishFlag.x + finishFlag.width
        ) {
            startFlagSlide();
            return;
        }

        // Generate new platforms
        const lastP = platforms[platforms.length - 1];

        if (!lastP || lastP.x < 900) {
            const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
            const width = platformWidths[type];
            const y = playerGroundY - 140 - Math.random() * 120;
            const newX = lastP ? lastP.x + lastP.width + 200 + Math.random() * 250 : 1100;

            platforms.push({
                x: newX,
                y,
                width,
                height: platformHeight,
                type
            });

            if (Math.random() > 0.4) {
                coins.push({
                    x: newX + width / 2 - coinSize / 2,
                    y: y - 70,
                    baseY: y - 70,
                    collected: false,
                    floatOffset: Math.random() * Math.PI * 2
                });
            }
        }

        // Generate new ground coins
        const groundCoins = coins.filter((c) => !c.collected && c.baseY > playerGroundY - 100);
        const lastCoin = groundCoins[groundCoins.length - 1];

        if (!lastCoin || lastCoin.x < 900) {
            coins.push({
                x: 1100 + Math.random() * 200,
                y: playerGroundY - 70,
                baseY: playerGroundY - 70,
                collected: false,
                floatOffset: Math.random() * Math.PI * 2
            });
        }

        if (signBoard.x < -200) {
            signBoard.x = 1200 + Math.random() * 600;
        }

        // Check D coin collection
        coins.forEach((coin) => {
            if (!coin.collected) {
                const cx = coin.x + coinSize / 2;
                const cy = coin.y + coinSize / 2;
                const px = player.x + player.width / 2;
                const py = player.y + player.height / 2;
                const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);

                const boyIsBelowCoin = py > cy + 20;
                if (
                    dist < (player.width + coinSize) / 2.5 &&
                    !boyIsBelowCoin
                ) {
                    coin.collected = true;

                    if (coinSound) {
                        coinSound.currentTime = 0;
                        coinSound.play().catch(() => { });
                    }

                    GAME.coins++;
                    GAME.score = (GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue);
                    updateHUD();

                    floatingTexts.push({
                        x: coin.x + coinSize / 2,
                        y: coin.y,
                        text: '+10',
                        color: '#FFD700',
                        strokeColor: '#000000',
                        life: 1.0,
                        maxLife: 1.0,
                        vy: -2.5,
                        scale: 0.5,
                        targetScale: 1.2
                    });
                }
            }
        });

        // Check Super Coin collection
        superCoins.forEach((sc) => {
            if (!sc.collected && !sc.missed) {
                const scx = sc.x + superCoinSize / 2;
                const scy = sc.y + superCoinSize / 2;
                const px = player.x + player.width / 2;
                const py = player.y + player.height / 2;
                const dist = Math.sqrt((px - scx) ** 2 + (py - scy) ** 2);

                const boyIsBelowCoin = py > scy + 20;
                if (
                    dist < (player.width + superCoinSize) / 2.5 &&
                    !boyIsBelowCoin
                ) {
                    sc.collected = true;

                    if (superCoinSound) {
                        superCoinSound.currentTime = 0;
                        superCoinSound.play().catch(() => { });
                    }

                    GAME.superCoins++;
                    GAME.totalSuperCoinsCollected++;

                    GAME.score = (GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue);
                    updateHUD();

                    if (GAME.totalSuperCoinsCollected >= GAME.totalSuperCoins && !finishFlag.active) {
                        setupFinishFlag();
                    }

                    floatingTexts.push({
                        x: sc.x + superCoinSize / 2,
                        y: sc.y,
                        text: '+20',
                        color: '#FF6B00',
                        strokeColor: '#FFFFFF',
                        life: 1.0,
                        maxLife: 1.0,
                        vy: -3,
                        scale: 0.5,
                        targetScale: 1.5
                    });
                }
            }
        });
    }

    function drawFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];

            ft.y += ft.vy;
            ft.life -= 0.025;

            if (ft.scale < ft.targetScale) {
                ft.scale += 0.08;
                if (ft.scale > ft.targetScale) ft.scale = ft.targetScale;
            }

            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = ft.life;
            ctx.translate(ft.x, ft.y);
            ctx.scale(ft.scale, ft.scale);
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 15;
            ctx.font = "bold 26px 'Arial', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = ft.strokeColor;
            ctx.lineWidth = 4;
            ctx.strokeText(ft.text, 0, 0);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);
            ctx.restore();
        }
    }

    function draw() {
        const canvasW = canvas.width || 1024;
        const canvasH = canvas.height || 768;

        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.save();

        if (window.innerWidth <= 1024 && isLandscape()) {
            ctx.scale(GAME.scaleX, GAME.scaleY);
        }

        // Draw background
        if (bg.image && bg.image.complete && bg.image.naturalWidth > 0) {
            const drawX = bg.x % bg.width;

            ctx.drawImage(bg.image, drawX, 0, bg.width, 768);
            ctx.drawImage(bg.image, drawX + bg.width, 0, bg.width, 768);

            if (drawX + bg.width < 1024) {
                ctx.drawImage(bg.image, drawX + bg.width * 2, 0, bg.width, 768);
            }
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, 768);

            grad.addColorStop(0, '#1a5fb4');
            grad.addColorStop(0.3, '#4a90d9');
            grad.addColorStop(0.6, '#87ceeb');
            grad.addColorStop(1, '#90EE90');

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1024, 768);
        }

        // Draw platforms
        platforms.forEach((p) => {
            const key = 'platform' + p.type.charAt(0).toUpperCase() + p.type.slice(1);
            const img = images[key];

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, p.x, p.y, p.width, p.height);
            } else {
                ctx.fillStyle = '#5d3a1a';
                ctx.fillRect(p.x, p.y + 10, p.width, p.height - 10);

                ctx.fillStyle = '#4a9b4a';
                ctx.fillRect(p.x, p.y, p.width, 14);

                ctx.fillStyle = '#7cb342';
                ctx.fillRect(p.x, p.y + 14, p.width, 6);
            }
        });

        // Draw ground
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(0, GAME.groundY, 1024, 68);

        ctx.fillStyle = '#7cb342';
        ctx.fillRect(0, GAME.groundY, 1024, 18);

        ctx.fillStyle = '#4a9b4a';
        ctx.fillRect(0, GAME.groundY, 1024, 6);

        // Draw sign board
        if (signBoard.image && signBoard.image.complete && signBoard.image.naturalWidth > 0) {
            ctx.drawImage(signBoard.image, signBoard.x, signBoard.y, signBoard.width, signBoard.height);
        }

        // Draw D Coins
        coins.forEach((coin) => {
            if (!coin.collected) {
                ctx.save();
                ctx.translate(coin.x + coinSize / 2, coin.y + coinSize / 2);

                const scaleX = Math.abs(Math.sin(GAME.frameCount * 0.06 + coin.floatOffset));
                ctx.scale(scaleX, 1);

                if (images.coin && images.coin.complete && images.coin.naturalWidth > 0) {
                    ctx.drawImage(images.coin, -coinSize / 2, -coinSize / 2, coinSize, coinSize);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, coinSize / 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700';
                    ctx.fill();
                    ctx.strokeStyle = '#FFA500';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.fillStyle = '#B8860B';
                    ctx.font = 'bold 28px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('D', 0, 0);
                }

                ctx.restore();
            }
        });

        // Draw Super Coins
        superCoins.forEach((sc) => {
            if (!sc.collected && !sc.missed) {
                ctx.save();
                ctx.translate(sc.x + superCoinSize / 2, sc.y + superCoinSize / 2);

                const glowSize = 15 + Math.sin(GAME.frameCount * 0.08 + sc.floatOffset) * 8;
                ctx.shadowColor = '#FF6B00';
                ctx.shadowBlur = glowSize;

                const scaleX = Math.abs(Math.sin(GAME.frameCount * 0.04 + sc.floatOffset));
                ctx.scale(scaleX, 1);

                if (images.superCoin && images.superCoin.complete && images.superCoin.naturalWidth > 0) {
                    ctx.drawImage(images.superCoin, -superCoinSize / 2, -superCoinSize / 2, superCoinSize, superCoinSize);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, superCoinSize / 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#FF6B00';
                    ctx.fill();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 5;
                    ctx.stroke();
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 32px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', 0, 0);
                }

                ctx.restore();

                if (sc.sparkleTimer % 20 === 0) {
                    ctx.save();

                    ctx.globalAlpha = 0.6 + Math.sin(GAME.frameCount * 0.1) * 0.4;
                    ctx.fillStyle = '#FFD700';

                    const sparkleX = sc.x + superCoinSize / 2 + (Math.random() - 0.5) * 60;
                    const sparkleY = sc.y + superCoinSize / 2 + (Math.random() - 0.5) * 60;

                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                }
            }
        });

        // Draw Finish Flag
        if (finishFlag.active) {
            if (images.flagPole && images.flagPole.complete && images.flagPole.naturalWidth > 0) {
                ctx.drawImage(
                    images.flagPole,
                    finishFlag.x,
                    finishFlag.y,
                    80,
                    finishFlag.height
                );
            } else {
                ctx.fillStyle = '#777';
                ctx.fillRect(finishFlag.x + 35, finishFlag.y, 10, finishFlag.height);
            }

            if (images.finishFlag && images.finishFlag.complete && images.finishFlag.naturalWidth > 0) {
                ctx.drawImage(
                    images.finishFlag,
                    finishFlag.x + 45,
                    finishFlag.y + finishFlag.flagY + 20, //niche//upar
                    90,
                    70
                );
            } else {
                ctx.fillStyle = '#ff9800';
                ctx.fillRect(finishFlag.x + 45, finishFlag.y + finishFlag.flagY, 90, 55);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 22px Arial';
                ctx.fillText('D', finishFlag.x + 85, finishFlag.y + finishFlag.flagY + 35);
            }
        }

        // Draw Player
        let playerImg;

        if (GAME.state === 'flagSlide') {
            playerImg = images[climbFrames[finishFlag.climbFrame]];
        } else if (GAME.isJumping) {
            playerImg = images.boyJump;
        } else if (GAME.isFalling) {
            playerImg = images.boyFall;
        } else if (GAME.isMovingForward) {
            playerImg = images[runFrames[player.frame]];
        } else {
            playerImg = images.boyRun1;
        }

        const superScale = 1 + (GAME.superModeAnimation * 0.25);

        if (GAME.superMode) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = (20 + Math.sin(GAME.frameCount * 0.1) * 10) * Math.max(GAME.superModeAnimation, 0.2);
        }

        if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            const footVisualFix = 18;

            if (GAME.superMode) {
                const newWidth = player.width * superScale;
                const newHeight = player.height * superScale;
                const newX = player.x - (newWidth - player.width) / 2;
                const newY = player.y - (newHeight - player.height);

                ctx.drawImage(playerImg, newX, newY + footVisualFix, newWidth, newHeight);
            } else {

                let drawW = player.width;
                let drawH = player.height;
                let drawX = player.x;
                let drawY = player.y + footVisualFix;

                if (GAME.isJumping) {
                    drawW = 120;
                    drawH = 124;
                    drawX = player.x - 7;
                    drawY = player.y + footVisualFix - 15;
                }

                else if (GAME.isFalling) {
                    drawW = 100;   // fall image width
                    drawH = 121;   // fall image height
                    drawX = player.x - 5;
                    drawY = player.y + footVisualFix - 10;
                }

                ctx.drawImage(
                    playerImg,
                    drawX,
                    drawY,
                    drawW,
                    drawH
                );
            }

        } else {
            ctx.fillStyle = '#fdbcb4';

            if (GAME.superMode) {
                const newWidth = player.width * superScale;
                const newHeight = player.height * superScale;
                const newX = player.x - (newWidth - player.width) / 2;
                const newY = player.y - (newHeight - player.height);

                ctx.fillRect(newX, newY, newWidth, newHeight);
            } else {
                ctx.fillRect(player.x, player.y, player.width, player.height);
            }
        }

        if (GAME.superMode) {
            ctx.restore();
        }

        drawFloatingTexts();
        ctx.restore();
    }

    function gameLoop(timestamp) {
        GAME.lastTime = timestamp;

        update();
        draw();

        GAME.gameLoopId = requestAnimationFrame(gameLoop);
    }

    function showPowerMessage() {
        const messageOverlay = document.createElement('div');
        messageOverlay.id = 'power-message-overlay';

        messageOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease;
        `;

        const isSuperMode = GAME.superMode;
        const messageText = isSuperMode ? 'YOU GOT VITAMIN D POWER!' : 'YOU MISS VITAMIN D POWER!';
        const messageColor = isSuperMode ? '#FFD700' : '#ff4444';
        const iconText = isSuperMode ? '&#11088;' : '&#10060;';

        messageOverlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a3a6b 0%, #0d1f3c 100%);
                border: 4px solid ${messageColor};
                border-radius: 25px;
                padding: 40px 60px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                animation: scaleIn 0.5s ease;
            ">
                <div style="font-size: 60px; margin-bottom: 15px;">${iconText}</div>
                <div style="
                    font-size: 32px;
                    font-weight: 900;
                    color: ${messageColor};
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    letter-spacing: 2px;
                ">
                    ${messageText}
                </div>
                <div style="font-size: 18px; color: #a0c4e8; margin-top: 15px;">
                    ${isSuperMode ? 'All 8 Super Coins Collected!' : 'Mission Completed!'}
                </div>
            </div>
        `;

        document.body.appendChild(messageOverlay);

        const animStyle = document.createElement('style');

        animStyle.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        `;

        document.head.appendChild(animStyle);

        setTimeout(() => {
            messageOverlay.style.animation = 'fadeOut 0.5s ease forwards';

            setTimeout(() => {
                if (messageOverlay.parentNode) messageOverlay.remove();
                if (animStyle.parentNode) animStyle.remove();

                showScoreScreen();
            }, 500);
        }, 3000);
    }

    function showScoreScreen() {
        const yourName = localStorage.getItem('arakitol_player_name') || 'Player';
        const participantId = localStorage.getItem('arakitol_participant_id') || 'VD0000';
        const totalScore = (GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue);

        let leaderboard = JSON.parse(localStorage.getItem('arakitol_leaderboard') || '[]');
        const existingEntry = leaderboard.find(e => e.participantId === participantId);

        let attempts = 1;
        let bestScore = totalScore;
        let bestCoins = GAME.coins;
        let bestSuperCoins = GAME.totalSuperCoinsCollected;
        let bestTime = GAME.timeElapsed;

        if (existingEntry) {
            attempts = existingEntry.attempts + 1;
            bestScore = Math.max(existingEntry.bestScore || existingEntry.totalScore || 0, totalScore);
            bestCoins = Math.max(existingEntry.bestCoins || existingEntry.coins || 0, GAME.coins);
            bestSuperCoins = Math.max(existingEntry.bestSuperCoins || existingEntry.superCoins || 0, GAME.superCoins);
            bestTime = existingEntry.bestTime || GAME.timeElapsed;

            if (
                GAME.superCoins >= GAME.totalSuperCoins &&
                (existingEntry.bestTime === undefined || GAME.timeElapsed < existingEntry.bestTime)
            ) {
                bestTime = GAME.timeElapsed;
            }

            leaderboard = leaderboard.filter(e => e.participantId !== participantId);
        }

        const gameResult = {
            name: yourName,
            participantId,
            coins: bestCoins,
            superCoins: bestSuperCoins,
            totalSuperCoinsCollected: GAME.totalSuperCoinsCollected,
            score: totalScore,
            totalScore: bestScore,
            time: bestTime,
            attempts,
            bestScore,
            bestCoins,
            bestSuperCoins,
            bestTime,
            date: new Date().toISOString(),
            completed: true
        };

        leaderboard.push(gameResult);
        leaderboard.sort((a, b) => b.bestScore - a.bestScore);
        leaderboard = leaderboard.slice(0, 50);

        localStorage.setItem('arakitol_leaderboard', JSON.stringify(leaderboard));
        localStorage.setItem('arakitol_current_coins', GAME.coins);
        localStorage.setItem('arakitol_current_super_coins', GAME.totalSuperCoinsCollected);
        localStorage.setItem('arakitol_current_time', GAME.timeElapsed);
        localStorage.setItem('arakitol_current_score', totalScore);

        const finalCoinsEl = document.getElementById('finalCoins');
        const finalSuperEl = document.getElementById('finalSuperCoins');
        const finalTimeEl = document.getElementById('finalTime');
        const finalScoreEl = document.getElementById('finalScore');
        const gameOverEl = document.getElementById('game-over');

        if (finalCoinsEl) finalCoinsEl.textContent = GAME.coins;
        if (finalSuperEl) finalSuperEl.textContent = GAME.totalSuperCoinsCollected;
        if (finalTimeEl) finalTimeEl.textContent = GAME.timeElapsed;
        if (finalScoreEl) finalScoreEl.textContent = totalScore;
        if (gameOverEl) gameOverEl.classList.add('active');
    }

    function gameOver() {
        if (GAME.gameOverStarted) return;

        GAME.gameOverStarted = true;
        GAME.state = 'gameover';
        GAME.isMovingForward = false;

        if (GAME.gameTimerInterval) clearInterval(GAME.gameTimerInterval);

        showPowerMessage();
    }

    function showLeaderboard() {
        const leaderboardOverlay = document.getElementById('leaderboard-overlay');
        const tbody = document.getElementById('leaderboardBody');

        let leaderboard = JSON.parse(localStorage.getItem('arakitol_leaderboard') || '[]');
        leaderboard = leaderboard.filter(e => e.completed === true);

        if (tbody) tbody.innerHTML = '';

        if (leaderboard.length === 0) {
            if (tbody) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" style="padding: 30px; color: #a0c4e8; font-size: 16px;">No completed games yet. Be the first!</td>';
                tbody.appendChild(row);
            }
        } else {
            leaderboard.forEach((entry, index) => {
                const rank = index + 1;
                const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                const rankIcon = rank === 1 ? '&#129351;' : rank === 2 ? '&#129352;' : rank === 3 ? '&#129353;' : rank;

                const row = document.createElement('tr');

                row.innerHTML =
                    '<td class="' + rankClass + '">' + rankIcon + '</td>' +
                    '<td><strong>' + entry.name + '</strong></td>' +
                    '<td>' + (entry.attempts || 1) + '</td>' +
                    '<td class="coins-cell">' + (entry.bestCoins || entry.coins) + '</td>' +
                    '<td class="super-coins-cell">' + (entry.bestSuperCoins || entry.totalSuperCoinsCollected || entry.superCoins) + '</td>' +
                    '<td>' + (entry.bestTime || entry.time || 0) + 's</td>' +
                    '<td class="score-cell">' + (entry.bestScore || entry.totalScore) + '</td>';

                if (tbody) tbody.appendChild(row);
            });
        }

        const gameOverEl = document.getElementById('game-over');

        if (gameOverEl) gameOverEl.classList.remove('active');
        if (leaderboardOverlay) leaderboardOverlay.classList.add('active');
    }

    function generateCertificateHTML(yourName, coins, superCoins, time, totalScore, date, forDownload) {
        const containerStyle = forDownload ? 'width: 900px; height: 650px;' : 'width: 100%; max-width: 800px;';
        const padding = forDownload ? '40px 50px' : '30px 40px';
        const borderWidth = forDownload ? '12px' : '8px';
        const titleSize = forDownload ? '48px' : '36px';
        const nameSize = forDownload ? '42px' : '32px';
        const statValueSize = forDownload ? '32px' : '28px';
        const headerSize = forDownload ? '14px' : '12px';
        const subtitleSize = forDownload ? '16px' : '14px';

        return `<div style="${containerStyle} background: linear-gradient(135deg, #fff9f0 0%, #fff 50%, #f0f8ff 100%); border: ${borderWidth} solid #1a5fb4; border-radius: 25px; padding: ${padding}; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative; overflow: hidden; font-family: calibri; box-sizing: border-box; margin: 0 auto;">
            <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 3px dashed #FFD700; border-radius: 18px; pointer-events: none;"></div>
            <div style="font-size: ${headerSize}; color: #1a5fb4; letter-spacing: 5px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">ARAKITOL POWER QUEST</div>
            <div style="font-size: ${titleSize}; color: #1a237e; font-weight: 900; margin: 5px 0; letter-spacing: 2px;">CERTIFICATE</div>
            <div style="font-size: ${subtitleSize}; color: #666; letter-spacing: 8px; margin-bottom: 15px; text-transform: uppercase;">OF ACHIEVEMENT</div>
            <div style="font-size: 16px; color: #555; margin: 15px 0 5px;">This is to certify that</div>
            <div style="font-size: ${nameSize}; color: #e65100; font-weight: bold; margin: 10px 0;">${yourName}</div>
            <div style="font-size: 16px; color: #555; margin: 15px 0 5px;">has successfully completed the</div>
            <div style="font-size: 20px; color: #1a237e; font-weight: 800; margin: 15px 0;">Vitamin D Challenge</div>
            <div style="display: flex; justify-content: center; gap: 25px; margin: 25px 0;">
                <div style="width: 160px; background: #fcf0cd; border: 2px solid #ff9400; border-radius: 15px; padding: 15px 10px;">
                    <div style="font-size: ${statValueSize}; font-weight: 900; color: #e65100;">${coins}</div>
                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">D Coins</div>
                </div>
                <div style="width: 160px; background: #fff3e0; border: 2px solid #FF6B00; border-radius: 15px; padding: 15px 10px;">
                    <div style="font-size: ${statValueSize}; font-weight: 900; color: #FF6B00;">${superCoins}</div>
                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">Super Coins</div>
                </div>
                <div style="width: 160px; background: #e0ebf1; border: 2px solid #0539d2; border-radius: 15px; padding: 15px 10px;">
                    <div style="font-size: ${statValueSize}; font-weight: 900; color: #1565c0;">${time}s</div>
                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">Time</div>
                </div>
                <div style="width: 160px; background: #e8efcf; border: 2px solid #1b7801; border-radius: 15px; padding: 15px 10px;">
                    <div style="font-size: ${statValueSize}; font-weight: 900; color: #2e7d32;">${totalScore}</div>
                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">Final Score</div>
                </div>
            </div>
        </div>`;
    }

    function viewCertificate() {
        const yourName = localStorage.getItem('arakitol_player_name') || 'Player';
        const coins = parseInt(localStorage.getItem('arakitol_current_coins')) || GAME.coins || 0;
        const superCoins = parseInt(localStorage.getItem('arakitol_current_super_coins')) || GAME.totalSuperCoinsCollected || 0;
        const time = parseInt(localStorage.getItem('arakitol_current_time')) || GAME.timeElapsed || 0;
        const totalScore = parseInt(localStorage.getItem('arakitol_current_score')) || ((GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue)) || 0;
        const date = new Date().toLocaleDateString('en-IN');

        const certFrame = document.getElementById('certificateFrame');

        if (certFrame) {
            certFrame.innerHTML = generateCertificateHTML(yourName, coins, superCoins, time, totalScore, date, false);
        }

        const leaderboardOverlay = document.getElementById('leaderboard-overlay');
        const certPopup = document.getElementById('certificate-popup');

        if (leaderboardOverlay) leaderboardOverlay.classList.remove('active');
        if (certPopup) certPopup.classList.add('active');
    }

    async function downloadCertificate() {
        const yourName = localStorage.getItem('arakitol_player_name') || 'Player';
        const coins = parseInt(localStorage.getItem('arakitol_current_coins')) || GAME.coins || 0;
        const superCoins = parseInt(localStorage.getItem('arakitol_current_super_coins')) || GAME.totalSuperCoinsCollected || 0;
        const time = parseInt(localStorage.getItem('arakitol_current_time')) || GAME.timeElapsed || 0;
        const totalScore = parseInt(localStorage.getItem('arakitol_current_score')) || ((GAME.coins * GAME.coinValue) + (GAME.superCoins * GAME.superCoinValue)) || 0;
        const date = new Date().toLocaleDateString('en-IN');

        const certContainer = document.createElement('div');
        certContainer.style.cssText = 'position: fixed; top: -9999px; left: -9999px; z-index: -1; overflow: hidden;';
        certContainer.innerHTML = generateCertificateHTML(yourName, coins, superCoins, time, totalScore, date, true);
        document.body.appendChild(certContainer);

        try {
            if (typeof html2canvas === 'undefined') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }

            if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            const canvas = await html2canvas(certContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fff'
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = (pdfHeight - imgHeight * ratio) / 2;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('Arakitol_Certificate_' + yourName.replace(/\s+/g, '_') + '.pdf');
        } catch (err) {
            console.error('PDF download failed:', err);
            alert('Certificate download failed. Please try again.');
        } finally {
            document.body.removeChild(certContainer);
        }
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');

            script.src = src;
            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);
        });
    }

    function pauseGame() {
        if (GAME.state === 'playing') {
            GAME.state = 'paused';

            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) pauseMenu.classList.add('active');
        }
    }

    function resumeGame() {
        GAME.state = 'playing';

        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.remove('active');
    }

    function restartGame() {
        GAME.state = 'playing';
        GAME.score = 0;
        GAME.coins = 0;
        GAME.superCoins = 0;
        GAME.totalSuperCoinsCollected = 0;
        GAME.superCoinsPassed = 0;

        GAME.superMode = false;
        GAME.pendingSuperMode = false;
        GAME.superModeAnimation = 0;

        GAME.gameOverPending = false;
        GAME.gameOverDelay = 0;
        GAME.gameOverStarted = false;

        GAME.timeElapsed = 0;
        GAME.isJumping = false;
        GAME.isFalling = false;
        GAME.isMovingForward = false;

        player.y = getPlayerGroundY() - player.height;
        player.vy = 0;
        player.frame = 0;
        player.frameTimer = 0;
        player.x = 150;

        bg.x = 0;

        generatePlatforms();
        generateCoins();
        generateSuperCoins();
        // setupFinishFlag();
        finishFlag.active = false;
        finishFlag.touched = false;
        finishFlag.flagY = 30;
        finishFlag.climbFrame = 0;
        finishFlag.climbTimer = 0;
        finishFlag.finishStarted = false;

        signBoard.x = 900;
        signBoard.y = getPlayerGroundY() - 100;

        const pauseMenu = document.getElementById('pause-menu');
        const gameOver = document.getElementById('game-over');
        const leaderboard = document.getElementById('leaderboard-overlay');
        const certPopup = document.getElementById('certificate-popup');

        if (pauseMenu) pauseMenu.classList.remove('active');
        if (gameOver) gameOver.classList.remove('active');
        if (leaderboard) leaderboard.classList.remove('active');
        if (certPopup) certPopup.classList.remove('active');

        updateHUD();
        startGameTimer();
    }

    function goHome() {
        if (GAME.gameLoopId) cancelAnimationFrame(GAME.gameLoopId);
        if (GAME.gameTimerInterval) clearInterval(GAME.gameTimerInterval);

        const pauseMenu = document.getElementById('pause-menu');
        const gameOver = document.getElementById('game-over');
        const leaderboard = document.getElementById('leaderboard-overlay');
        const certPopup = document.getElementById('certificate-popup');

        if (pauseMenu) pauseMenu.classList.remove('active');
        if (gameOver) gameOver.classList.remove('active');
        if (leaderboard) leaderboard.classList.remove('active');
        if (certPopup) certPopup.classList.remove('active');

        showMenuElements();

        if (window.goToScreen) {
            window.goToScreen('start');
        }
    }

    // ===== INPUT =====
    document.addEventListener('keydown', function (e) {
        const isTyping =
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.isContentEditable;

        if (isTyping) return;

        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();

            if (GAME.state === 'playing') {
                jump();
            }
        }

        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();

            if (GAME.state === 'playing') {
                startMovingForward();
            }
        }

        if (e.code === 'Escape') {
            if (GAME.state === 'playing') {
                pauseGame();
            } else if (GAME.state === 'paused') {
                resumeGame();
            }
        }
    });

    document.addEventListener('keyup', function (e) {
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            stopMovingForward();
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();

        if (GAME.state === 'playing') {
            jump();
        }
    }, { passive: false });

    canvas.addEventListener('mousedown', () => {
        if (GAME.state === 'playing') {
            jump();
        }
    });

    // Jump button
    const jumpBtn = document.getElementById('jumpBtn');

    if (jumpBtn) {
        jumpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (GAME.state === 'playing') {
                jump();
            }
        });

        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (GAME.state === 'playing') {
                jump();
            }
        }, { passive: false });
    }

    // Forward button - press and hold
    const forwardBtn = document.getElementById('forwardBtn');

    if (forwardBtn) {
        forwardBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (GAME.state === 'playing') {
                startMovingForward();
            }
        });

        forwardBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            e.stopPropagation();
            stopMovingForward();
        });

        forwardBtn.addEventListener('mouseleave', () => {
            stopMovingForward();
        });

        forwardBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (GAME.state === 'playing') {
                startMovingForward();
            }
        }, { passive: false });

        forwardBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            stopMovingForward();
        });
    }

    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartGame);

    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) quitBtn.addEventListener('click', goHome);

    const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
    if (viewLeaderboardBtn) viewLeaderboardBtn.addEventListener('click', showLeaderboard);

    const viewCertBtn = document.getElementById('viewCertBtn');
    if (viewCertBtn) viewCertBtn.addEventListener('click', viewCertificate);

    const downloadCertBtn = document.getElementById('downloadCertBtn');
    if (downloadCertBtn) downloadCertBtn.addEventListener('click', downloadCertificate);

    const certPopupClose = document.getElementById('certPopupClose');

    if (certPopupClose) {
        certPopupClose.addEventListener('click', () => {
            const certPopup = document.getElementById('certificate-popup');
            const leaderboardOverlay = document.getElementById('leaderboard-overlay');

            if (certPopup) certPopup.classList.remove('active');
            if (leaderboardOverlay) leaderboardOverlay.classList.add('active');
        });
    }

    const certBackBtn = document.getElementById('certBackBtn');

    if (certBackBtn) {
        certBackBtn.addEventListener('click', () => {
            const certPopup = document.getElementById('certificate-popup');
            const leaderboardOverlay = document.getElementById('leaderboard-overlay');

            if (certPopup) certPopup.classList.remove('active');
            if (leaderboardOverlay) leaderboardOverlay.classList.add('active');
        });
    }

    document.addEventListener('arakitol:startGameplay', (e) => {
        console.log('Zone 1 Gameplay starting for:', e.detail.playerName);
        initGameplay();
    });

    console.log('%c Zone 1 Gameplay Engine Loaded ', 'color: #4CAF50; font-size: 14px;');
})();
