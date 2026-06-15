// ===== ARAKITOL POWER QUEST - LOGIN & MENU LOGIC =====
// Fields: Your Name (text only)
// Certificate uses Your Name, Leaderboard uses Name

(function() {
    'use strict';

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
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Always full screen
        gameContainer.style.width = windowWidth + 'px';
        gameContainer.style.height = windowHeight + 'px';
        gameContainer.style.transform = 'none';
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
    }

    window.addEventListener('resize', scaleContainer);
    window.addEventListener('orientationchange', function() {
        setTimeout(scaleContainer, 300);
    });
    scaleContainer();

    // ===== LOADING SCREEN =====
    function hideLoadingScreen() {
        setTimeout(function() {
            document.body.classList.add('loaded');
            setTimeout(function() {
                loadingScreen.style.display = 'none';
            }, 600);
        }, 2200);
    }

    if (document.readyState === 'complete') {
        hideLoadingScreen();
    } else {
        window.addEventListener('load', hideLoadingScreen);
    }

    // ===== SCREEN TRANSITION =====
    function goToScreen(screenName) {
        loginScreen.classList.remove('active');
        startScreen.classList.remove('active');
        gameplayScreen.classList.remove('active');

        if (screenName === 'start') {
            setTimeout(function() {
                startScreen.classList.add('active');
            }, 300);
        } else if (screenName === 'login') {
            setTimeout(function() {
                loginScreen.classList.add('active');
            }, 300);
        } else if (screenName === 'gameplay') {
            setTimeout(function() {
                gameplayScreen.classList.add('active');
                const playerName = localStorage.getItem('arakitol_player_name') || 'Champion';
                const event = new CustomEvent('arakitol:startGameplay', {
                    detail: {
                        playerName: playerName,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            }, 300);
        }
    }

    window.goToScreen = goToScreen;

    // ===== LOGIN FORM SUBMISSION =====
    continueBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const yourName = yourNameInput.value.trim();

        if (!yourName) {
            shakeInput(yourNameInput);
            yourNameInput.focus();
            return;
        }

        // Generate unique participant ID (only if not already exists for this session)
        let participantId = localStorage.getItem('arakitol_participant_id');
        if (!participantId) {
            participantId = generateParticipantId();
            localStorage.setItem('arakitol_participant_id', participantId);
        }

        // Save player data
        localStorage.setItem('arakitol_player_name', yourName);
        localStorage.setItem('arakitol_login_time', new Date().toISOString());

        // Reset attempts for new login (fresh session)
        localStorage.removeItem('arakitol_attempts');
        localStorage.removeItem('arakitol_best_score');
        localStorage.removeItem('arakitol_best_coins');
        localStorage.removeItem('arakitol_best_super_coins');
        localStorage.removeItem('arakitol_best_time');

        continueBtn.style.transform = 'scale(0.95)';
        setTimeout(function() {
            continueBtn.style.transform = '';
            goToScreen('start');
            console.log('Login successful!');
            console.log('Name:', yourName);
            console.log('Participant ID:', participantId);
        }, 150);
    });

    // ===== VALIDATION HELPERS =====
    function shakeInput(input) {
        input.style.animation = 'none';
        input.offsetHeight;
        input.style.animation = 'shake 0.5s ease';
        input.style.borderColor = '#ff4444';

        setTimeout(function() {
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

        inputs.forEach(function(input) {
            input.addEventListener('focus', function() {
                if (window.innerWidth <= 1024) {
                    gameContainer.classList.add('keyboard-open');
                    // Scroll to input on mobile
                    setTimeout(function() {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 350);
                }
            });

            input.addEventListener('blur', function() {
                gameContainer.classList.remove('keyboard-open');
            });
        });

        // Handle virtual keyboard on mobile/tablet
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', function() {
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
                }
            });
        }
    }

    handleKeyboard();

    // ===== START GAME BUTTON =====
    startGameBtn.addEventListener('click', function(e) {
        e.preventDefault();

        // START BACKGROUND MUSIC
        if (bgMusic) {
            bgMusic.volume = 0.15;
            bgMusic.play().catch(() => {});
        }

        startGameBtn.style.transform = 'scale(0.95)';

        setTimeout(function() {
            startGameBtn.style.transform = '';

            const playerName = localStorage.getItem('arakitol_player_name') || 'Champion';
            showStartMessage(playerName);

            setTimeout(function() {
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

        setTimeout(function() {
            msg.style.animation = 'popOut 0.3s ease forwards';
            setTimeout(function() {
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
    howToPlayBtn.addEventListener('click', function(e) {
        e.preventDefault();

        howToPlayBtn.style.transform = 'scale(0.95)';
        setTimeout(function() {
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

    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    document.addEventListener('keydown', function(e) {
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
        setTimeout(function() {
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

        images.forEach(function(src) {
            const img = new Image();
            img.src = src;
        });
    }

    preloadImages();



    // ===== CONSOLE WELCOME =====
    console.log('%c Arakitol Power Quest ', 'background: linear-gradient(90deg, #1a5fb4, #FFD700); color: #fff; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 10px;');
    console.log('%c Menu System Loaded ', 'color: #FFD700; font-size: 14px;');

})();