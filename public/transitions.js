/* ===== VIConnect Page Transition Engine ===== */
(function () {
    'use strict';

    // Create overlay DOM on load
    function createOverlay() {
        if (document.querySelector('.page-transition-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            overlay.appendChild(bar);
        }
        const loader = document.createElement('div');
        loader.className = 'transition-loader';
        overlay.appendChild(loader);
        document.body.appendChild(overlay);
    }

    // Play exit animation, then navigate
    function navigateWithTransition(url) {
        if (!url || url === '#' || url.startsWith('javascript:')) return false;

        const overlay = document.querySelector('.page-transition-overlay');
        if (!overlay) { window.location.href = url; return true; }

        // Trigger exit
        document.documentElement.classList.add('page-exit');
        overlay.classList.add('active');

        // Navigate after animation completes
        setTimeout(function () {
            window.location.href = url;
        }, 450);

        return true;
    }

    // Intercept all internal link clicks
    function interceptLinks() {
        document.addEventListener('click', function (e) {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');

            // Skip external links, anchors, javascript:, and # links
            if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('http') || href.startsWith('mailto:')) return;

            // Skip if link has explicit onclick that returns false
            // (but still apply transition for navigation onclicks like goBack)
            
            e.preventDefault();
            e.stopPropagation();
            navigateWithTransition(href);
        }, true); // capture phase
    }

    // Override window.location.href assignments from JS navigation functions
    // by exposing a global transition helper
    window.vitNavigate = function (url) {
        navigateWithTransition(url);
    };

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            createOverlay();
            interceptLinks();
        });
    } else {
        createOverlay();
        interceptLinks();
    }
})();
