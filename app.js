(() => {
    const body = document.body;
    const header = document.querySelector('[data-header]');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    const setHeaderState = () => {
        header?.classList.toggle('is-scrolled', window.scrollY > 18);
    };

    setHeaderState();
    window.addEventListener('scroll', setHeaderState, { passive: true });

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const open = menuToggle.getAttribute('aria-expanded') === 'true';

            menuToggle.setAttribute('aria-expanded', String(!open));
            mainNav.classList.toggle('is-open', !open);
            body.classList.toggle('menu-open', !open);
        });

        mainNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                mainNav.classList.remove('is-open');
                body.classList.remove('menu-open');
            });
        });
    }

    const heroSlider = document.querySelector('[data-hero-slider]');

    if (heroSlider) {
        const slides = [...heroSlider.querySelectorAll('[data-hero-slide]')];
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const interval = Math.max(
            2500,
            Number.parseInt(heroSlider.dataset.interval || '4800', 10)
        );

        let activeIndex = Math.max(
            0,
            slides.findIndex((slide) => slide.classList.contains('is-active'))
        );
        let heroTimer = null;

        const showSlide = (nextIndex) => {
            if (slides.length < 2 || nextIndex === activeIndex) {
                return;
            }

            const current = slides[activeIndex];
            const next = slides[nextIndex];

            current.classList.remove('is-active');
            current.setAttribute('aria-hidden', 'true');

            /*
             * Force a reflow so the subtle zoom restarts each time
             * a slide becomes active again.
             */
            void next.offsetWidth;

            next.classList.add('is-active');
            next.setAttribute('aria-hidden', 'false');

            activeIndex = nextIndex;
        };

        const nextSlide = () => {
            showSlide((activeIndex + 1) % slides.length);
        };

        const startHeroSlider = () => {
            if (reducedMotion || slides.length < 2 || heroTimer !== null) {
                return;
            }

            heroTimer = window.setInterval(nextSlide, interval);
        };

        const stopHeroSlider = () => {
            if (heroTimer === null) {
                return;
            }

            window.clearInterval(heroTimer);
            heroTimer = null;
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopHeroSlider();
                return;
            }

            startHeroSlider();
        });

        startHeroSlider();
    }

    const revealItems = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -5% 0px',
        });

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const carousel = document.querySelector('[data-carousel]');
    const prev = document.querySelector('[data-prev]');
    const next = document.querySelector('[data-next]');

    if (carousel) {
        const track = carousel.querySelector('[data-track]');
        const duration = Math.max(150, Number.parseInt(carousel.dataset.duration || '700', 10));
        const autoplay = Math.max(0, Number.parseInt(carousel.dataset.autoplay || '0', 10));
        const easingName = carousel.dataset.easing || 'ease-in-out';

        const easings = {
            linear: (t) => t,
            ease: (t) => t * t * (3 - 2 * t),
            'ease-in': (t) => t * t,
            'ease-out': (t) => 1 - Math.pow(1 - t, 2),
            'ease-in-out': (t) => (
                t < 0.5
                    ? 2 * t * t
                    : 1 - Math.pow(-2 * t + 2, 2) / 2
            ),
        };

        const easing = easings[easingName] || easings['ease-in-out'];
        let timer = null;
        let animating = false;

        const getStep = () => {
            const card = track?.querySelector('.product-card');

            if (!card || !track) {
                return 0;
            }

            const styles = getComputedStyle(track);
            const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');

            return card.getBoundingClientRect().width + gap;
        };

        const animateScroll = (target) => {
            if (!track || animating) {
                return;
            }

            animating = true;
            const start = track.scrollLeft;
            const distance = target - start;
            const started = performance.now();

            const frame = (now) => {
                const progress = Math.min(1, (now - started) / duration);

                track.scrollLeft = start + (distance * easing(progress));

                if (progress < 1) {
                    requestAnimationFrame(frame);
                    return;
                }

                animating = false;
            };

            requestAnimationFrame(frame);
        };

        const move = (direction) => {
            if (!track) {
                return;
            }

            const step = getStep();
            const max = track.scrollWidth - track.clientWidth;
            let target = track.scrollLeft + (step * direction);

            if (target > max - 5) {
                target = 0;
            }

            if (target < 0) {
                target = max;
            }

            animateScroll(target);
        };

        prev?.addEventListener('click', () => move(-1));
        next?.addEventListener('click', () => move(1));

        const startAutoplay = () => {
            if (!autoplay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            window.clearInterval(timer);
            timer = window.setInterval(() => move(1), autoplay);
        };

        const stopAutoplay = () => {
            window.clearInterval(timer);
        };

        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        carousel.addEventListener('focusin', stopAutoplay);
        carousel.addEventListener('focusout', startAutoplay);

        startAutoplay();
    }
})();
