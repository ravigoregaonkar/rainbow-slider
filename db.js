document.addEventListener("DOMContentLoaded", function () {

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fsIconEnter = document.getElementById('fsIconEnter');
    const fsIconExit = document.getElementById('fsIconExit');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    function updateFsIcons() {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsIconEnter.style.display = isFS ? 'none' : 'block';
        fsIconExit.style.display = isFS ? 'block' : 'none';

        // ✅ Prevent scroll when exiting fullscreen
        if (!isFS) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden'; // restore scrolling if needed
        }
    }

    document.addEventListener('fullscreenchange', updateFsIcons);
    document.addEventListener('webkitfullscreenchange', updateFsIcons);

    fullscreenBtn.addEventListener('click', function () {
        if (isIOS) {
            // window.scrollTo(0, 1);
            document.documentElement.style.height = '100vh';
            document.body.style.height = '100vh';
            document.body.style.overflow = 'hidden';
            gameContainer.style.height = (window.innerHeight) + 'px';

            setTimeout(function () {
                gameContainer.style.height = (window.innerHeight) + 'px';
                scaleContainer();
            }, 300);
            return;
        }

        const el = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch(() => {});
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document).catch(() => {});
        }
    });

    // ✅ CALL on load
    updateFsIcons();

});
