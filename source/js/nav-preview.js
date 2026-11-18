(function () {
    'use strict';
    var header = document.getElementById('menu');
    var nav = document.getElementById('desktop-menu');
    var viewport = document.getElementById('nav-preview');
    if (!header || !nav || !viewport) return;

    var frame = viewport.querySelector('.nav-preview-frame');
    var gsap = window.gsap;
    var desktop = window.matchMedia('(min-width: 900px)');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var triggers = Array.from(nav.querySelectorAll('[data-nav-preview]'));
    var navLinks = Array.from(nav.querySelectorAll('a'));
    var panels = Array.from(frame.querySelectorAll('[data-nav-panel]'));
    var active = null;
    var current = null;
    var timeline;
    var closeTimer;
    var restoringFocus = false;

    panels.forEach(function (panel) { panel.style.setProperty('--panel-width', panel.dataset.width + 'px'); });

    function cancelClose() { clearTimeout(closeTimer); }
    function stopMotion() {
        if (timeline) timeline.kill();
        timeline = null;
    }
    function canAnimate() { return gsap && !reduced.matches; }
    function clearMotion(element) {
        if (gsap && (element.style.transform || element.style.opacity)) {
            gsap.set(element, { clearProps: 'transform,opacity' });
        }
    }
    function hide(panel) { panel.hidden = true; clearMotion(panel); }
    function resetFrame() {
        viewport.hidden = true;
        clearMotion(frame);
        panels.forEach(hide);
    }
    function measure(trigger, panel) {
        var rect = trigger.getBoundingClientRect();
        var top = Math.ceil(header.getBoundingClientRect().bottom + 8);
        var room = Math.max(1, window.innerHeight - top - 12);
        var width = Number(panel.dataset.width);
        viewport.style.top = top + 'px';
        viewport.style.height = room + 'px';
        viewport.hidden = false;
        var height = Math.min(room, panel.offsetHeight + 2);
        return {
            x: Math.max(16, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 16)),
            right: (viewport.offsetWidth - width) + 'px',
            bottom: (room - height) + 'px'
        };
    }
    function settle(geometry) {
        if (gsap) gsap.set(viewport, { x: geometry.x });
        else viewport.style.transform = 'translateX(' + geometry.x + 'px)';
        frame.style.setProperty('--preview-right', geometry.right);
        frame.style.setProperty('--preview-bottom', geometry.bottom);
        clearMotion(frame);
        clearMotion(current);
        panels.filter(function (panel) { return panel !== current; }).forEach(hide);
    }
    function refresh() {
        stopMotion();
        if (current) settle(measure(active, current));
        else resetFrame();
    }
    function close(restore, immediate) {
        cancelClose();
        if (!active) {
            if (immediate) refresh();
            return;
        }
        var previous = active;
        stopMotion();
        active = current = null;
        previous.setAttribute('aria-expanded', 'false');
        viewport.classList.remove('is-open');
        viewport.inert = true;
        panels.forEach(function (panel) { panel.inert = true; });
        if (restore) {
            restoringFocus = true;
            previous.focus();
            restoringFocus = false;
        }
        if (canAnimate() && !immediate) {
            timeline = gsap.timeline({ onComplete: resetFrame });
            timeline.to(frame, { y: -4, opacity: 0, duration: .12, ease: 'power1.in' });
        } else resetFrame();
    }
    function scheduleClose() {
        cancelClose();
        closeTimer = setTimeout(function () {
            if (!viewport.contains(document.activeElement)) close(false);
        }, 160);
    }

    function open(trigger) {
        if (!desktop.matches) return;
        cancelClose();
        if (active === trigger) return;
        var next = panels.find(function (panel) { return panel.dataset.navPanel === trigger.dataset.navPreview; });
        if (!next) return;
        var outgoing = current;
        var returning = !!outgoing && !next.hidden;
        var direction = triggers.indexOf(trigger) > triggers.indexOf(active) ? 1 : -1;
        if (active) active.setAttribute('aria-expanded', 'false');
        stopMotion();

        active = trigger;
        current = next;
        panels.forEach(function (panel) {
            panel.classList.toggle('is-current', panel === next);
            panel.inert = panel !== next;
            if (panel !== next && panel !== outgoing) hide(panel);
        });
        next.hidden = false;
        var geometry = measure(trigger, next);
        trigger.setAttribute('aria-expanded', 'true');
        viewport.inert = false;
        viewport.classList.add('is-open');

        if (!canAnimate()) {
            settle(geometry);
            return;
        }
        timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
        if (!outgoing) {
            settle(geometry);
            timeline.fromTo(frame, { y: -6, opacity: .45 }, { y: 0, opacity: 1, duration: .20, clearProps: 'transform,opacity' });
            return;
        }

        // Keep the stage size fixed. Only its visible silhouette and position move.
        timeline.to(viewport, { x: geometry.x, duration: .24 }, 0)
            .to(frame, { '--preview-right': geometry.right, '--preview-bottom': geometry.bottom, duration: .24 }, 0)
            .to(outgoing, { x: -direction * 12, opacity: 0, duration: .12, ease: 'power1.out', onComplete: function () { hide(outgoing); } }, 0);
        // A switch can interrupt the shared frame's first entrance.
        if (frame.style.opacity || frame.style.transform) {
            timeline.to(frame, { y: 0, opacity: 1, duration: .16, clearProps: 'transform,opacity' }, 0);
        }
        var end = { x: 0, opacity: 1, duration: .20, clearProps: 'transform,opacity' };
        if (returning) timeline.to(next, end, 0);
        else timeline.fromTo(next, { x: direction * 14, opacity: .25 }, end, 0);
    }

    triggers.forEach(function (trigger) {
        var panel = panels.find(function (item) { return item.dataset.navPanel === trigger.dataset.navPreview; });
        if (!panel) return;
        trigger.setAttribute('aria-controls', panel.id);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.addEventListener('pointerenter', function (event) {
            if (event.pointerType !== 'touch' && !viewport.contains(document.activeElement)) open(trigger);
        });
        trigger.addEventListener('focus', function () { if (!restoringFocus) open(trigger); });
        trigger.addEventListener('keydown', function (event) {
            if (!desktop.matches) return;
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey && active === trigger)) {
                open(trigger);
                var link = current && current.querySelector('a');
                if (link) { event.preventDefault(); link.focus(); }
            }
        });
    });
    navLinks.forEach(function (link, index) {
        link.addEventListener('keydown', function (event) {
            if (!desktop.matches || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
            event.preventDefault();
            var delta = event.key === 'ArrowRight' ? 1 : -1;
            navLinks[(index + delta + navLinks.length) % navLinks.length].focus();
        });
    });

    nav.addEventListener('pointerenter', cancelClose);
    nav.addEventListener('pointerleave', scheduleClose);
    viewport.addEventListener('pointerenter', cancelClose);
    viewport.addEventListener('pointerleave', scheduleClose);
    nav.querySelectorAll('a:not([data-nav-preview])').forEach(function (item) {
        item.addEventListener('pointerenter', function () { if (!viewport.contains(document.activeElement)) close(false); });
        item.addEventListener('focus', function () { close(false); });
    });
    viewport.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab' || !current) return;
        var links = Array.from(current.querySelectorAll('a'));
        if (event.shiftKey && event.target === links[0]) {
            event.preventDefault();
            active.focus();
        } else if (!event.shiftKey && event.target === links[links.length - 1]) {
            event.preventDefault();
            var next = active.nextElementSibling || document.querySelector('.archive-shortcut');
            if (next) next.focus();
        }
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && active) { event.preventDefault(); close(true); }
    });
    document.addEventListener('focusin', function (event) {
        if (!nav.contains(event.target) && !viewport.contains(event.target)) close(false);
    });
    document.addEventListener('pointerdown', function (event) {
        if (!nav.contains(event.target) && !viewport.contains(event.target)) close(false);
    });
    viewport.addEventListener('click', function (event) { if (event.target.closest('a')) close(false); });
    window.addEventListener('resize', function () { if (desktop.matches) refresh(); else close(false, true); });
    window.addEventListener('blur', function () { close(false); });
    reduced.addEventListener('change', refresh);
})();
