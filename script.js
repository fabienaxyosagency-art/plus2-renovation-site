/* ==========================================================================
   +2 RÉNOVATION — Animations & interactions
   ========================================================================== */

(() => {
    'use strict';

    document.documentElement.classList.add('js');

    /* ===== Année footer ===== */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ===== Scroll controller unifié — un seul listener, un seul RAF =====
       Header sticky · scroll progress bar · FAB visibility · stack scale ·
       footer parallax. Évite multiple reflows + RAF concurrents. */
    const header = document.getElementById('header');
    const progress = document.querySelector('.scroll-progress span');
    const fab = document.querySelector('.fab');

    const scrollHandlers = [];
    const registerScrollHandler = (fn) => scrollHandlers.push(fn);

    let scrollTicking = false;
    const onScrollMaster = () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            // Handlers de base (header, fab, progress)
            if (header) header.classList.toggle('scrolled', y > 30);
            if (fab) fab.classList.toggle('visible', y > 600);
            if (progress) {
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                const ratio = docH > 0 ? Math.min(1, y / docH) : 0;
                progress.style.width = (ratio * 100).toFixed(2) + '%';
            }
            // Handlers additionnels (stack, footer parallax)
            for (let i = 0; i < scrollHandlers.length; i++) {
                scrollHandlers[i](y);
            }
            scrollTicking = false;
        });
    };
    window.addEventListener('scroll', onScrollMaster, { passive: true });
    onScrollMaster();

    /* ===== Mobile menu toggle ===== */
    const burger = document.getElementById('burger');
    if (burger) {
        burger.addEventListener('click', () => {
            const isOpen = document.body.classList.toggle('nav-open');
            burger.setAttribute('aria-expanded', String(isOpen));
        });
        document.querySelectorAll('.main-nav .nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                burger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ===== Smooth scroll vers les ancres ===== */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ===== Nav pill liquide qui suit le hover ===== */
    const nav = document.getElementById('mainNav');
    if (nav) {
        const pill = nav.querySelector('.nav-pill');
        const links = Array.from(nav.querySelectorAll('.nav-link'));

        const movePill = (el) => {
            if (!pill || !el) return;
            const navRect = nav.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            nav.style.setProperty('--nav-pill-x', `${elRect.left - navRect.left}px`);
            nav.style.setProperty('--nav-pill-width', `${elRect.width}px`);
            nav.style.setProperty('--nav-pill-opacity', '1');
        };
        const hidePill = () => {
            if (!pill) return;
            nav.style.setProperty('--nav-pill-opacity', '0');
        };

        links.forEach((link) => {
            link.addEventListener('mouseenter', () => movePill(link));
            link.addEventListener('focus', () => movePill(link));
        });
        nav.addEventListener('mouseleave', hidePill);
        nav.addEventListener('blur', hidePill, true);
    }

    /* ===== Pause animations infinies off-screen (économie GPU) ===== */
    const pauseSelectors = [
        '.hero-blob-1',
        '.hero-blob-2',
        '.scroll-line',
        '.map-pin-center',
        '.footer-aurora',
        '.footer-marquee-track',
        '.footer-heart',
        '.eyebrow-dot',
    ];
    if ('IntersectionObserver' in window) {
        const pauseIO = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
                });
            },
            { rootMargin: '50% 0px 50% 0px' }
        );
        pauseSelectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => pauseIO.observe(el));
        });
    }

    /* ===== Reveal animations (Intersection Observer + failsafe) ===== */
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            // Seuil tolérant : déclenche dès qu'un pixel rentre dans le viewport
            { rootMargin: '0px 0px 0px 0px', threshold: 0 }
        );
        reveals.forEach((el) => obs.observe(el));

        // Failsafe : tout révéler après 2.5s, même si l'IO n'a pas déclenché
        // (cas : ancre profonde au reload, sticky qui cache la section, etc.)
        setTimeout(() => {
            reveals.forEach((el) => el.classList.add('visible'));
        }, 2500);
    } else {
        reveals.forEach((el) => el.classList.add('visible'));
    }

    /* ===== FAQ — fermer les autres à l'ouverture ===== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach((other) => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

    /* ===== Form — handler basique mailto ===== */
    const form = document.getElementById('contactForm');
    if (form) {
        const sanitizeField = (v, max = 200) =>
            String(v || '').replace(/[\r\n\t]+/g, ' ').slice(0, max).trim();
        const sanitizeMessage = (v) =>
            String(v || '').replace(/\r\n?/g, '\n').slice(0, 4000);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const project = sanitizeField(fd.get('project')) || 'Rénovation';
            const subject = `Demande de devis — ${project}`;
            const body =
                `Bonjour,\n\n` +
                `Nom : ${sanitizeField(fd.get('name'))}\n` +
                `Téléphone : ${sanitizeField(fd.get('phone'))}\n` +
                `E-mail : ${sanitizeField(fd.get('email'))}\n` +
                `Code postal : ${sanitizeField(fd.get('zip'), 10)}\n` +
                `Type de projet : ${project}\n\n` +
                `Description :\n${sanitizeMessage(fd.get('message'))}\n\n` +
                `Cordialement.`;
            const mailto = `mailto:plus2renovation@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;

            // Petit feedback visuel
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = 'Ouverture de votre messagerie…';
                btn.disabled = true;
                setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3000);
            }
        });
    }

    /* ===== SECTION STACKING — Géré entièrement en CSS pur =====
       Le scale-down dynamique JS a été retiré : il causait du jank sur les
       sections lourdes (services 2412px, realisations 1238px) car chaque
       frame de scroll devait recalculer + repaint + composite layer.
       L'effet "tiroirs empilés" reste via border-radius + box-shadow + z-index
       sticky natif — 0 JS, 0 reflow. */

    /* ===== FOOTER CINEMATIC — Magnetic + parallax + back to top ===== */
    const footerWrapper = document.getElementById('cinematicFooterWrapper');
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (footerWrapper) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // -- Magnetic buttons (vanilla, sans GSAP) -- skip si pas de souris fine
        const initMagnetic = (el) => {
            if (reduceMotion || !hasHover) return;
            let frameId = null;
            let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
            let active = false;

            const animate = () => {
                currentX += (targetX - currentX) * 0.18;
                currentY += (targetY - currentY) * 0.18;
                if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1 && !active) {
                    el.style.transform = '';
                    frameId = null;
                    return;
                }
                el.style.transform = `translate(${currentX}px, ${currentY}px) scale(${active ? 1.04 : 1})`;
                frameId = requestAnimationFrame(animate);
            };

            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                targetX = (e.clientX - r.left - r.width / 2) * 0.35;
                targetY = (e.clientY - r.top - r.height / 2) * 0.35;
                active = true;
                if (!frameId) frameId = requestAnimationFrame(animate);
            });

            el.addEventListener('mouseleave', () => {
                targetX = 0;
                targetY = 0;
                active = false;
                if (!frameId) frameId = requestAnimationFrame(animate);
            });
        };
        document.querySelectorAll('.cinematic-footer .magnetic').forEach(initMagnetic);

        // -- Parallax sur le giant text + reveal headline (intégré au scroll master) --
        const giantText = document.getElementById('footerGiantText');
        const headline = document.getElementById('footerHeadline');
        let headlineRevealed = false;

        const onFooterScroll = () => {
            const r = footerWrapper.getBoundingClientRect();
            const vh = window.innerHeight;
            // Bail-out rapide si pas dans la zone visible
            if (r.top >= vh || r.bottom <= 0) return;

            const progress = Math.min(1, Math.max(0, 1 - r.top / vh));
            if (giantText && !reduceMotion) {
                const ty = (1 - progress) * 80;
                const scale = 0.85 + progress * 0.15;
                giantText.style.transform = `translateX(-50%) translateY(${ty}px) scale(${scale})`;
                giantText.style.opacity = String(progress * 0.95);
            }
            if (headline && progress > 0.25 && !headlineRevealed) {
                headline.classList.add('visible');
                headlineRevealed = true;
            }
        };

        registerScrollHandler(onFooterScroll);
        onFooterScroll();

        // -- Back to top --
        const toTop = document.getElementById('footerToTop');
        if (toTop) {
            toTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    /* ===== Carousel 3D générique — orbite continue + mouse perspective ===== */
    function init3DOrbit(carousel, options = {}) {
        if (!carousel) return;
        const cardSelector = options.cardSelector || '.hero-card';
        const cards = Array.from(carousel.querySelectorAll(cardSelector));
        if (!cards.length) return;

        const N = cards.length;
        const speed = parseFloat(carousel.dataset.orbitSpeed) || options.speed || 0.18;
        const flatness = parseFloat(carousel.dataset.orbitFlatness) || options.flatness || 0.55;
        const radiusFactor = options.radiusFactor || 0.30;
        const minRadius = options.minRadius || 110;
        const maxRadius = options.maxRadius || 280;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const computeRadius = () => {
            const w = carousel.clientWidth;
            return Math.min(Math.max(w * radiusFactor, minRadius), maxRadius);
        };
        let radius = computeRadius();
        let baseAngle = 0;
        let frameId = null;
        let isHovering = false;

        const placeCards = () => {
            cards.forEach((card, i) => {
                const a = (baseAngle + i * (360 / N)) * (Math.PI / 180);
                const x = Math.cos(a) * radius;
                const y = Math.sin(a) * radius * flatness;
                card.style.setProperty('--card-x', `${x}px`);
                card.style.setProperty('--card-y', `${y}px`);
                const depth = (Math.sin(a) + 1) / 2;
                card.style.zIndex = String(Math.round(depth * 10));
                card.style.opacity = String(0.55 + depth * 0.45);
                card.style.filter = `brightness(${0.7 + depth * 0.3})`;
            });
        };

        const syncPerspective = () => {
            const px = carousel.style.getPropertyValue('--perspective-x') || '0deg';
            const py = carousel.style.getPropertyValue('--perspective-y') || '0deg';
            cards.forEach((c) => {
                c.style.setProperty('--perspective-x', px);
                c.style.setProperty('--perspective-y', py);
            });
        };

        const tick = () => {
            baseAngle = (baseAngle + speed) % 360;
            placeCards();
            if (isHovering) syncPerspective();
            frameId = requestAnimationFrame(tick);
        };

        // Mouse perspective seulement si appareil avec souris fine
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            carousel.addEventListener('mousemove', (e) => {
                const r = carousel.getBoundingClientRect();
                const px = ((e.clientX - r.left) / r.width - 0.5) * 18;
                const py = ((e.clientY - r.top) / r.height - 0.5) * 18;
                carousel.style.setProperty('--perspective-x', `${px}deg`);
                carousel.style.setProperty('--perspective-y', `${py}deg`);
                isHovering = true;
            });
            carousel.addEventListener('mouseleave', () => {
                carousel.style.setProperty('--perspective-x', `0deg`);
                carousel.style.setProperty('--perspective-y', `0deg`);
                isHovering = false;
                syncPerspective();
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
            } else if (!document.hidden && !frameId && !reduceMotion) {
                frameId = requestAnimationFrame(tick);
            }
        });

        window.addEventListener('resize', () => {
            radius = computeRadius();
            placeCards();
        }, { passive: true });

        if (reduceMotion) {
            placeCards();
        } else {
            frameId = requestAnimationFrame(tick);
        }
    }

    // Carousel hero (8 photos chantiers)
    init3DOrbit(document.getElementById('heroCarousel'), {
        cardSelector: '.hero-card',
        speed: 0.18,
        flatness: 0.55,
        radiusFactor: 0.28,
        minRadius: 110,
        maxRadius: 240,
    });

    // Carousel certifications (7 cartes — un peu plus lent + orbite plus aplatie)
    init3DOrbit(document.getElementById('certCarousel'), {
        cardSelector: '.cert-card',
        speed: 0.12,
        flatness: 0.42,
        radiusFactor: 0.32,
        minRadius: 130,
        maxRadius: 320,
    });

    /* ===== Frame Grid 3×3 expanding (réalisations / chantiers) ===== */
    const frameGrid = document.getElementById('frameGrid');
    if (frameGrid) {
        const cells = Array.from(frameGrid.querySelectorAll('.frame-cell'));
        const HOVER_SIZE = parseFloat(frameGrid.dataset.hoverSize) || 6;
        const TOTAL = parseFloat(frameGrid.dataset.gridTotal) || 12;
        const NON_HOVERED = (TOTAL - HOVER_SIZE) / 2;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = () => window.innerWidth <= 700;

        const setSizes = (row, col) => {
            if (isMobile() || reduceMotion) return;
            if (row === null || col === null) {
                frameGrid.style.removeProperty('--row-sizes');
                frameGrid.style.removeProperty('--col-sizes');
                return;
            }
            const rows = [0, 1, 2].map((r) => r === row ? `${HOVER_SIZE}fr` : `${NON_HOVERED}fr`).join(' ');
            const cols = [0, 1, 2].map((c) => c === col ? `${HOVER_SIZE}fr` : `${NON_HOVERED}fr`).join(' ');
            frameGrid.style.setProperty('--row-sizes', rows);
            frameGrid.style.setProperty('--col-sizes', cols);
            // Origine de transform pour effet d'agrandissement vers le centre
            const origin = `${col === 0 ? 'left' : col === 2 ? 'right' : 'center'} ${row === 0 ? 'top' : row === 2 ? 'bottom' : 'center'}`;
            frameGrid.style.setProperty('transform-origin', origin);
        };

        cells.forEach((cell) => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);

            cell.addEventListener('mouseenter', () => setSizes(row, col));
            cell.addEventListener('focus', () => setSizes(row, col));
        });

        frameGrid.addEventListener('mouseleave', () => setSizes(null, null));
        frameGrid.addEventListener('blur', () => setSizes(null, null), true);

        // Reset sur resize si on bascule en mobile
        window.addEventListener('resize', () => {
            if (isMobile()) setSizes(null, null);
        }, { passive: true });
    }

})();
