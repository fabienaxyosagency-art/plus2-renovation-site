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
        '.services-marquee-track',                  // marquee texte corps d'état
        '.services-cards-marquee .services-grid',   // marquee cartes services
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

    // Hero cinéma : scroll-driven crossfade entre 6 photos chantier
    // (init3DOrbit ancien hero retiré — remplacé par hero-cinema)
    (function initHeroCinema() {
        const section = document.getElementById('heroCinema');
        if (!section) return;
        const photos = Array.from(section.querySelectorAll('.hero-cinema-photo'));
        const titleTop = section.querySelector('.hero-cinema-title-top');
        const titleBot = section.querySelector('.hero-cinema-title-bottom');
        const center = section.querySelector('.hero-cinema-center');
        const ticks = Array.from(section.querySelectorAll('.hero-cinema-tick'));
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!photos.length || reduceMotion) return;

        const N = photos.length;
        let lastActive = 0;

        const onHeroScroll = () => {
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight;
            // Bail si la section est complètement hors champ
            if (rect.top > vh || rect.bottom < 0) return;

            // Progress 0→1 sur toute la durée du scroll dans la section
            const total = section.offsetHeight - vh;
            const scrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, scrolled / total));

            // Mapping : photos changent entre 5% et 90% de la progression
            const photoProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.85));
            const activeIndex = Math.min(N - 1, Math.floor(photoProgress * N));

            if (activeIndex !== lastActive) {
                photos.forEach((p, i) => {
                    p.style.opacity = i === activeIndex ? '1' : '0';
                    // Reset scale des photos non-actives → évite "flash de zoom" au scroll up
                    if (i !== activeIndex) {
                        const img = p.querySelector('img');
                        if (img) img.style.transform = 'scale(1.04)';
                    }
                });
                ticks.forEach((t, i) => {
                    t.classList.toggle('is-active', i === activeIndex);
                    t.classList.toggle('is-passed', i < activeIndex);
                });
                lastActive = activeIndex;
            }

            // Ken Burns : zoom progressif de la photo active (1.04 → 1.18)
            const localProgress = (photoProgress * N) - activeIndex;
            const scale = 1.04 + localProgress * 0.14;
            const activePhoto = photos[activeIndex]?.querySelector('img');
            if (activePhoto) activePhoto.style.transform = `scale(${scale.toFixed(3)})`;

            // Split titles : écartement progressif (réduit sur mobile pour éviter overflow)
            const splitProgress = Math.max(0, Math.min(1, (progress - 0.10) / 0.50));
            const splitDistance = splitProgress * (window.innerWidth < 768 ? 18 : 28);
            if (titleTop) titleTop.style.transform = `translate3d(-${splitDistance}vw, 0, 0)`;
            if (titleBot) titleBot.style.transform = `translate3d(${splitDistance}vw, 0, 0)`;

            // Center : fade-out progressif vers la fin (le loft prend toute la place)
            const fadeProgress = Math.max(0, Math.min(1, (progress - 0.55) / 0.30));
            if (center) center.style.opacity = String(1 - fadeProgress);
        };

        registerScrollHandler(onHeroScroll);
        onHeroScroll();
    })();

    // Carousel certifications (7 cartes — un peu plus lent + orbite plus aplatie)
    init3DOrbit(document.getElementById('certCarousel'), {
        cardSelector: '.cert-card',
        speed: 0.12,
        flatness: 0.42,
        radiusFactor: 0.32,
        minRadius: 130,
        maxRadius: 320,
    });

    /* ===== Services Cards Marquee — duplication des 9 cartes pour boucle parfaite =====
       L'animation CSS translate(-50% → 0%) attend un track contenant 2 fois les cartes.
       On clone les originaux côté JS pour ne pas alourdir le HTML source. */
    (function initServicesCardsMarquee() {
        const wrapper = document.getElementById('servicesCardsMarquee');
        if (!wrapper) return;
        const track = wrapper.querySelector('.services-grid');
        if (!track) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;     // Pas de clone si reduce-motion (grille statique)
        const originals = Array.from(track.children);
        if (!originals.length) return;
        // CRUCIAL : forcer .visible sur les originaux AVANT clone — sinon flash
        // car l'animation CSS commence à -50% et la moitié gauche serait vide.
        originals.forEach((card) => {
            card.classList.add('visible');
            card.style.removeProperty('--delay');
        });
        // Clone chaque carte et marque le clone comme aria-hidden (info dupliquée)
        originals.forEach((card) => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
        // Marque le wrapper comme prêt pour ne pas démarrer l'animation avant
        wrapper.classList.add('is-ready');
    })();

    // === Body lock cleanup : si on resize de mobile vers desktop avec nav ouvert ===
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && document.body.classList.contains('nav-open')) {
            document.body.classList.remove('nav-open');
            const burgerBtn = document.getElementById('burger');
            if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
        }
    }, { passive: true });

    /* ===== Frame Grid 1×3 expanding (réalisations / chantiers réels) ===== */
    const frameGrid = document.getElementById('frameGrid');
    if (frameGrid) {
        const cells = Array.from(frameGrid.querySelectorAll('.frame-cell'));
        const COL_COUNT = cells.length || 3;
        const HOVER_SIZE = parseFloat(frameGrid.dataset.hoverSize) || 6;
        const TOTAL = parseFloat(frameGrid.dataset.gridTotal) || (HOVER_SIZE + (COL_COUNT - 1) * 1.5);
        const NON_HOVERED = (TOTAL - HOVER_SIZE) / Math.max(COL_COUNT - 1, 1);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isCompact = () => window.innerWidth <= 900;

        const setSizes = (col) => {
            if (isCompact() || reduceMotion) return;
            if (col === null) {
                frameGrid.style.removeProperty('--col-sizes');
                return;
            }
            const cols = Array.from({ length: COL_COUNT }, (_, c) => c === col ? `${HOVER_SIZE}fr` : `${NON_HOVERED}fr`).join(' ');
            frameGrid.style.setProperty('--col-sizes', cols);
        };

        cells.forEach((cell) => {
            const col = parseInt(cell.dataset.col, 10);
            cell.addEventListener('mouseenter', () => setSizes(col));
            cell.addEventListener('focus', () => setSizes(col));
        });

        frameGrid.addEventListener('mouseleave', () => setSizes(null));
        frameGrid.addEventListener('blur', () => setSizes(null), true);

        window.addEventListener('resize', () => {
            if (isCompact()) setSizes(null);
        }, { passive: true });
    }

    // ========== ZONE MAP — preview cliquable → iframe interactif ==========
    (function initZoneMapActivation() {
        const zone = document.getElementById('zoneMap');
        const frame = document.getElementById('mapFrame');
        const previewBtn = document.getElementById('mapPreviewBtn');
        const ctaBtn = document.getElementById('mapCtaBtn');
        const iframe = document.getElementById('mapIframe');
        if (!zone || !frame || !previewBtn || !iframe) return;

        const activate = () => {
            if (frame.classList.contains('is-active')) return;
            // Lazy-load de l'iframe seulement à la demande
            if (iframe.dataset.src && !iframe.src) {
                iframe.src = iframe.dataset.src;
            }
            frame.classList.add('is-active');
            zone.classList.add('is-active');
            // Focus sur l'iframe pour l'interaction clavier
            setTimeout(() => iframe.focus(), 600);
        };

        previewBtn.addEventListener('click', activate);
        previewBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
            }
        });
        if (ctaBtn) ctaBtn.addEventListener('click', activate);
    })();

    // ========== RÉALISATIONS — slider COMPARE (avant/après) ==========
    (function initCompareSliders() {
        const cells = document.querySelectorAll('.frame-cell--compare');
        if (!cells.length) return;

        cells.forEach((cell) => {
            const compare = cell.querySelector('.frame-compare');
            if (!compare) return;

            const setSplit = (clientX) => {
                const rect = compare.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                compare.style.setProperty('--split', `${(pct * 100).toFixed(2)}%`);
                compare.style.setProperty('--split-pct', pct.toFixed(3));
            };

            cell.addEventListener('mousemove', (e) => {
                if (!cell.matches(':hover')) return;
                setSplit(e.clientX);
            }, { passive: true });

            cell.addEventListener('mouseenter', (e) => {
                setSplit(e.clientX);
            });

            // Touch — un tap toggle entre avant et après
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                cell.classList.add('is-touched');
                if (e.touches[0]) setSplit(e.touches[0].clientX);
            }, { passive: false });
            cell.addEventListener('touchmove', (e) => {
                if (e.touches[0]) setSplit(e.touches[0].clientX);
            }, { passive: true });
            cell.addEventListener('touchend', () => {
                setTimeout(() => cell.classList.remove('is-touched'), 2500);
            });

            // Clavier — flèches gauche/droite pour ajuster
            cell.addEventListener('keydown', (e) => {
                const compareEl = cell.querySelector('.frame-compare');
                if (!compareEl) return;
                const current = parseFloat(getComputedStyle(compareEl).getPropertyValue('--split-pct')) || 0.5;
                let next = current;
                if (e.key === 'ArrowLeft') next = Math.max(0, current - 0.1);
                else if (e.key === 'ArrowRight') next = Math.min(1, current + 0.1);
                else return;
                e.preventDefault();
                cell.classList.add('is-touched');
                compareEl.style.setProperty('--split', `${(next * 100).toFixed(2)}%`);
                compareEl.style.setProperty('--split-pct', next.toFixed(3));
            });

            // Position initiale au repos = 50% (utilisée quand on hover sans bouger)
            compare.style.setProperty('--split', '50%');
            compare.style.setProperty('--split-pct', '0.5');
        });
    })();

    // ========== RÉALISATIONS — CAROUSEL (3 photos qui tournent au survol) ==========
    (function initCarousels() {
        const cells = document.querySelectorAll('.frame-cell--carousel');
        if (!cells.length) return;

        cells.forEach((cell) => {
            const slides = cell.querySelectorAll('.frame-carousel-img');
            const dots = cell.querySelectorAll('.frame-carousel-dot');
            if (slides.length < 2) return;

            let idx = 0;
            let interval = null;

            const goTo = (i) => {
                idx = (i + slides.length) % slides.length;
                slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
                dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
            };

            const start = () => {
                stop();
                interval = setInterval(() => goTo(idx + 1), 2200);
            };
            const stop = () => {
                if (interval) { clearInterval(interval); interval = null; }
            };

            cell.addEventListener('mouseenter', start);
            cell.addEventListener('focus', start);
            cell.addEventListener('mouseleave', () => { stop(); goTo(0); });
            cell.addEventListener('blur', () => { stop(); goTo(0); });

            // Mobile : auto-play permanent en boucle plus lente
            if (window.matchMedia('(max-width: 700px)').matches) {
                interval = setInterval(() => goTo(idx + 1), 3500);
            }

            // Tap pour avancer manuellement sur mobile
            cell.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    goTo(idx + 1);
                }
            }, { passive: true });
        });
    })();

})();
