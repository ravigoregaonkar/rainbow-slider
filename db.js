    // ===== FULLSCREEN BUTTON =====
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fsIconEnter = document.getElementById('fsIconEnter');
    const fsIconExit = document.getElementById('fsIconExit');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let iosFullscreen = false;

    function updateFsIcons() {
        const isFS = isIOS ? iosFullscreen : !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsIconEnter.style.display = isFS ? 'none' : 'block';
        fsIconExit.style.display = isFS ? 'block' : 'none';
    }

    document.addEventListener('fullscreenchange', updateFsIcons);
    document.addEventListener('webkitfullscreenchange', updateFsIcons);

    function applyIOSFullscreen() {
        window.scrollTo(0, 1);
        document.documentElement.style.height = '100%';
        document.body.style.height = window.innerHeight + 'px';
        document.body.style.overflow = 'hidden';
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.width = '100vw';
        gameContainer.style.height = window.innerHeight + 'px';
        setTimeout(function() {
            gameContainer.style.height = window.innerHeight + 'px';
            scaleContainer();
        }, 300);
    }

    function exitIOSFullscreen() {
        document.documentElement.style.height = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        gameContainer.style.position = '';
        gameContainer.style.top = '';
        gameContainer.style.left = '';
        gameContainer.style.width = '';
        gameContainer.style.height = '';
        scaleContainer();
    }

    if (isIOS) {
        window.addEventListener('resize', function() {
            if (iosFullscreen) {
                gameContainer.style.height = window.innerHeight + 'px';
                scaleContainer();
            }
        });
    }

    fullscreenBtn.addEventListener('click', function() {
        if (isIOS) {
            iosFullscreen = !iosFullscreen;
            iosFullscreen ? applyIOSFullscreen() : exitIOSFullscreen();
            updateFsIcons();
            return;
        }

        const el = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch(() => {});
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document).catch(() => {});
        }
    });
