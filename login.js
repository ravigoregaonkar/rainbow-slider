// ===== arachitol POWER QUEST - LOGIN & MENU LOGIC =====
// Fields: Your Name (text only)
// Certificate uses Your Name, Leaderboard uses Name

(function () {
    'use strict';

    // ===== FULL SCREEN FUNCTION =====
    function goFullScreen() {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => handleIOSFallback());
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else {
            handleIOSFallback();
        }
    }

    function isIPhone() {
        return /iPhone/i.test(navigator.userAgent);
    }

    function isInStandaloneMode() {
        return window.navigator.standalone === true;
    }

    // yogesh code - iOS Safari full-screen trick
    // Safari blocks requestFullscreen entirely. The only in-browser approach:
    // 1. Use -webkit-fill-available so content fills behind the toolbar
    // 2. On first user tap, scroll to 1px then back — this collapses Safari's toolbar
    // 3. Lock html/body so the page can never be scrolled (toolbar stays hidden)
    function hideSafariUI() {
        if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

        // Lock scroll on html and body so toolbar can't reappear
        document.documentElement.style.cssText = 'height: -webkit-fill-available; overflow: hidden; position: fixed; width: 100%;';
        document.body.style.height = '-webkit-fill-available';

        // Scroll trick — collapses the Safari nav bar
        document.documentElement.style.height = (window.innerHeight + 60) + 'px';
        window.scrollTo(0, 60);
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.style.height = '-webkit-fill-available';
            // Resize game container to the now-collapsed viewport
            scaleContainer();
        }, 100);
    }
    // yogesh code end

    window.addEventListener("load", () => {
        // yogesh code - on iPhone show install popup; no auto-hide since scroll trick
        // needs a user gesture to work reliably (wired to first tap below)
        if (isIPhone() && !isInStandaloneMode()) {
            // yogesh code - removed Add to Home Screen popup since we now handle it in-browser
            // Just hide the popup element entirely
            const popup = document.getElementById("iosInstallPopup");
            if (popup) popup.style.display = "none";
            // yogesh code end
        }

        // yogesh code - first-touch handler: fires hideSafariUI on very first tap
        // Must be a real user gesture for Safari to collapse its toolbar
        document.addEventListener('touchstart', function firstTouch() {
            hideSafariUI();
            document.removeEventListener('touchstart', firstTouch);
        }, { once: true, passive: true });
        // yogesh code end

        document
            .getElementById("closeIosPopup")
            .addEventListener("click", () => {
                document.getElementById("iosInstallPopup").style.display = "none";
                hideSafariUI();
            });
    });


    // iOS Fallback
    function handleIOSFallback() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) hideSafariUI();
    }

    // ===== INTRO SCREEN LOGIC =====
    const introScreen = document.getElementById('intro-screen');
    const tapToPlayBtn = document.getElementById('tap-to-play');
    let introAutoTimer = null;

    // Go to Login from Intro - FIXED
    function goToLoginFromIntro() {
        // goFullScreen();

        if (introAutoTimer) {
            clearTimeout(introAutoTimer);
            introAutoTimer = null;
        }

        if (introScreen) {
            introScreen.classList.remove('active');

            setTimeout(() => {

                // Pehle login ready karo
                document.body.classList.add('show-game');

                if (loginScreen) {
                    loginScreen.style.display = 'flex';
                    loginScreen.classList.add('active');
                }

                // Fir intro hatao
                introScreen.style.display = 'none';

            }, 300);
        }
    }

    // Tap to play button click
    if (tapToPlayBtn) {
        tapToPlayBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // yogesh code - user gesture here, best moment to collapse Safari toolbar
            hideSafariUI();
            // yogesh code end
            goToLoginFromIntro();
        });
    }

    // ===== AUDIO ELEMENTS =====
    const bgMusic = document.getElementById('bgMusic');

    // ===== DOM ELEMENTS =====
    const gameContainer = document.getElementById('game-container');
    const loadingScreen = document.getElementById('loading-screen');
    const loginScreen = document.getElementById('login-screen');
    const startScreen = document.getElementById('start-screen');
    const gameplayScreen = document.getElementById('gameplay-screen');
    const yourNameInput = document.getElementById('yourName');
    const continueBtn = document.getElementById('continueBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const howToPlayBtn = document.getElementById('howToPlayBtn');
    const popupOverlay = document.getElementById('how-to-play-popup');
    const popupClose = document.getElementById('popupClose');

    // ===== GENERATE UNIQUE PARTICIPANT ID =====
    function generateParticipantId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = 'VD';
        for (let i = 0; i < 4; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    // ===== SCALE CONTAINER =====
    function scaleContainer() {
        // yogesh code - use visualViewport height on iOS to avoid nav bar overlap
        const windowWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const windowHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        // yogesh code end

        gameContainer.style.width = windowWidth + 'px';
        gameContainer.style.height = windowHeight + 'px';
        gameContainer.style.transform = 'none';
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
    }

    window.addEventListener('resize', function () {
        setTimeout(() => {
            scaleContainer();
        }, 150);
    });
    window.addEventListener('orientationchange', function () {
        setTimeout(scaleContainer, 300);
    });
    scaleContainer();

    // ===== LOADING SCREEN =====
    function hideLoadingScreen() {
        setTimeout(() => {
            loadingScreen.classList.add('hide');
            setTimeout(() => {
                // PEHLE INTRO SHOW KARO
                if (introScreen) {
                    introScreen.style.display = 'flex';
                    void introScreen.offsetWidth;
                    introScreen.classList.add('active');
                }
                // FIR LOADING HATAO
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 50);

            }, 600);

        }, 5000);
    }

    if (document.readyState === 'complete') {
        hideLoadingScreen();
    } else {
        window.addEventListener('load', hideLoadingScreen);
    }

    // ===== SCREEN TRANSITION =====
    function goToScreen(screenName) {
        // Pehle sab ko hide karo with display none
        loginScreen.classList.remove('active');
        startScreen.classList.remove('active');
        gameplayScreen.classList.remove('active');

        // Small delay for transition
        setTimeout(function () {
            if (screenName !== 'login') loginScreen.style.display = 'none';
            if (screenName !== 'start') startScreen.style.display = 'none';
            if (screenName !== 'gameplay') gameplayScreen.style.display = 'none';
        }, 300);

        if (screenName === 'start') {
            setTimeout(function () {
                startScreen.style.display = 'flex';
                void startScreen.offsetWidth;
                startScreen.classList.add('active');
            }, 350);
        } else if (screenName === 'gameplay') {
            setTimeout(function () {
                gameplayScreen.style.display = 'flex';
                void gameplayScreen.offsetWidth;
                gameplayScreen.classList.add('active');
                const playerName = localStorage.getItem('arachitol_player_name') || 'Champion';
                const event = new CustomEvent('arachitol:startGameplay', {
                    detail: {
                        playerName: playerName,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            }, 350);
        }
    }

    window.goToScreen = goToScreen;

    // ===== LOGIN FORM SUBMISSION =====
    continueBtn.addEventListener('click', function (e) {
        e.preventDefault();

        const yourName = yourNameInput.value.trim();

        if (!yourName) {
            shakeInput(yourNameInput);
            yourNameInput.focus();
            return;
        }

        // Full screen on login (agar abhi tak nahi hua)
        goFullScreen();

        // Generate unique participant ID (only if not already exists for this session)
        let participantId = localStorage.getItem('arachitol_participant_id');
        if (!participantId) {
            participantId = generateParticipantId();
            localStorage.setItem('arachitol_participant_id', participantId);
        }

        // Save player data
        localStorage.setItem('arachitol_player_name', yourName);
        localStorage.setItem('arachitol_login_time', new Date().toISOString());

        // Reset attempts for new login (fresh session)
        localStorage.removeItem('arachitol_attempts');
        localStorage.removeItem('arachitol_best_score');
        localStorage.removeItem('arachitol_best_coins');
        localStorage.removeItem('arachitol_best_super_coins');
        localStorage.removeItem('arachitol_best_time');

        continueBtn.style.transform = 'scale(0.95)';
        setTimeout(function () {
            continueBtn.style.transform = '';
            // yogesh code - unique player ID
            // format: XX-567891-472 
            const nameParts = yourName.trim().split(' ');
            const initials = nameParts.length >= 2
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : nameParts[0].substring(0, 2).toUpperCase();
            const timePart = String(Date.now()).slice(-6);
            const randomPart = Math.floor(100 + Math.random() * 900);
            const uniqueId = initials + '-' + timePart + '-' + randomPart;
            localStorage.setItem('arachitol_db_player_id', uniqueId);
            // yogesh code end
            goToScreen('start');
            console.log('Login successful!');
            console.log('Name:', yourName);
            console.log('Unique ID:', uniqueId);
        }, 150);
    });

    // ===== VALIDATION HELPERS =====
    function shakeInput(input) {
        input.style.animation = 'none';
        input.offsetHeight;
        input.style.animation = 'shake 0.5s ease';
        input.style.borderColor = '#ff4444';

        setTimeout(function () {
            input.style.borderColor = '';
            input.style.animation = '';
        }, 500);
    }

    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ===== KEYBOARD OVERLAP FIX =====
    function handleKeyboard() {
        const inputs = [yourNameInput];

        inputs.forEach(function (input) {
            input.addEventListener('focus', function () {
                if (window.innerWidth <= 1024) {
                    gameContainer.classList.add('keyboard-open');
                    // Scroll to input on mobile
                    setTimeout(function () {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 350);
                }
            });

            input.addEventListener('blur', function () {
                gameContainer.classList.remove('keyboard-open');
            });
        });

        // Handle virtual keyboard on mobile/tablet
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', function () {
                const heightDiff = window.innerHeight - window.visualViewport.height;
                if (heightDiff > 150) {
                    gameContainer.classList.add('keyboard-open');
                    // Scroll login box up when keyboard opens
                    const loginBox = document.querySelector('.login-box');
                    if (loginBox) {
                        loginBox.style.transform = 'translate(-50%, -70%)';
                    }
                } else {
                    gameContainer.classList.remove('keyboard-open');
                    const loginBox = document.querySelector('.login-box');
                    if (loginBox) {
                        loginBox.style.transform = 'translate(-50%, -45%)';
                    }

                    // ✅ CRITICAL FIX
                    setTimeout(() => {
                        window.scrollTo(0, 0);
                        scaleContainer();
                    }, 300);

                }
            });
        }
    }

    handleKeyboard();

    // ===== START GAME BUTTON =====
    startGameBtn.addEventListener('click', function (e) {
        e.preventDefault();

        // START BACKGROUND MUSIC
        if (bgMusic) {
            bgMusic.volume = 0.15;
            bgMusic.play().catch(() => { });
        }

        startGameBtn.style.transform = 'scale(0.95)';

        setTimeout(function () {
            startGameBtn.style.transform = '';

            const playerName = localStorage.getItem('arachitol_player_name') || 'Champion';
            showStartMessage(playerName);

            setTimeout(function () {
                goToScreen('gameplay');
            }, 2200);

        }, 150);
    });

    // ===== START GAME MESSAGE POPUP =====
    function showStartMessage(name) {
        const msg = document.createElement('div');
        msg.id = 'start-message-popup';
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a5fb4, #0d3a6b);
            color: #FFD700;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            border: 2px solid #FFD700;
            animation: popIn 0.4s ease;
            font-family: 'Calibri', sans-serif;
        `;
        msg.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">&#127918;</div>
            <div>Let's Go, ${name}!</div>
            <div style="font-size: 16px; color: #fff; margin-top: 10px;">Collect all 8 Super Coins!</div>
        `;
        document.body.appendChild(msg);

        setTimeout(function () {
            msg.style.animation = 'popOut 0.3s ease forwards';
            setTimeout(function () {
                if (msg.parentNode) msg.remove();
            }, 300);
        }, 1800);
    }

    // Add pop animations
    const popStyle = document.createElement('style');
    popStyle.textContent = `
        @keyframes popIn {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes popOut {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        }
    `;
    document.head.appendChild(popStyle);

    // ===== HOW TO PLAY BUTTON =====
    howToPlayBtn.addEventListener('click', function (e) {
        e.preventDefault();

        howToPlayBtn.style.transform = 'scale(0.95)';
        setTimeout(function () {
            howToPlayBtn.style.transform = '';
            openPopup();
        }, 150);
    });

    // ===== POPUP FUNCTIONS =====
    function openPopup() {
        popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePopup() {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    popupClose.addEventListener('click', closePopup);

    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closePopup();
        }
    });

    // ===== NO AUTO-SAVE: Clear fields on page load =====
    function clearFieldsOnLoad() {
        yourNameInput.value = '';
    }

    clearFieldsOnLoad();


    const sparkleStyle = document.createElement('style');
    sparkleStyle.textContent = `
        @keyframes sparkleFloat {
            0% { transform: translateY(0) scale(0); opacity: 0; }
            30% { transform: translateY(-20px) scale(1.5); opacity: 1; }
            100% { transform: translateY(-60px) scale(0); opacity: 0; }
        }
    `;
    document.head.appendChild(sparkleStyle);

    // ===== SPARKLE EFFECT =====
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animation = 'sparkleFloat ' + (1 + Math.random() * 2) + 's ease-out forwards';
        document.getElementById('game-container').appendChild(sparkle);
        setTimeout(function () {
            if (sparkle.parentNode) sparkle.remove();
        }, 3000);
    }

    setInterval(createSparkle, 1500);

    // ===== IMAGE PRELOADING =====
    function preloadImages() {
        const images = [
            'images/login-background.png',
            'images/logo.png',
            'images/boy.png',
            'images/D-icon.png',
            'images/sun.png',
            'images/start-game-button.png',
            'images/how-to-play-button.png',
            'images/how-to-play-popup.png',
            'images/icon1.png',
            'images/icon2.png',
            'images/icon3.png',
            'images/icon4.png'
        ];

        images.forEach(function (src) {
            const img = new Image();
            img.src = src;
        });
    }

    preloadImages();

    // ===== CONSOLE WELCOME =====
    console.log('%c arachitol Power Quest ', 'background: linear-gradient(90deg, #1a5fb4, #FFD700); color: #fff; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 10px;');
    console.log('%c Menu System Loaded ', 'color: #FFD700; font-size: 14px;');

})();
