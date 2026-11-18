(function () {
    'use strict';
    var hero = document.querySelector('.hero[data-enter]');
    var gsap = window.gsap;
    if (!hero || !gsap || location.hash || window.scrollY > 40) return;

    var media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', function () {
        // The headline and photograph are already visible if the script arrives late.
        var paint = performance.getEntriesByName('first-contentful-paint')[0];
        if (paint && performance.now() - paint.startTime > 120) return;
        var title = hero.querySelector('.hero-title-text');
        var details = [hero.querySelector('.hero-subtitle')].concat(Array.from(hero.querySelectorAll('.hero-actions a')));
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .from(title, { yPercent: 88, opacity: .2, duration: .62, clearProps: 'transform,opacity' }, 0)
            .from(details, { y: 10, opacity: .2, duration: .46, stagger: .045, clearProps: 'transform,opacity' }, .14)
            .from(hero.querySelector('[data-enter-media]'), { scale: 1.045, duration: .85, clearProps: 'transform' }, 0);
    });
})();
