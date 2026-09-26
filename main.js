// Beim Neuladen immer oben starten, damit der Name aus der Start-Animation an die richtige Stelle fliegt
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Header bekommt beim Scrollen eine feine Linie
const header = document.querySelector('.site-header');

function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Elemente mit .reveal sanft einblenden, sobald sie sichtbar werden
function startReveals() {
    const revealItems = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealItems.forEach((item, i) => {
        // nur die ersten Elemente oben leicht zeitversetzt, weiter unten ohne Verzögerung
        if (i < 3) item.style.transitionDelay = `${i * 0.15}s`;
        observer.observe(item);
    });
}

// Rezensions-Laufband: Einträge verdoppeln, damit die Schleife nahtlos läuft
const reviewTrack = document.querySelector('.reviews__track');

if (reviewTrack) {
    Array.from(reviewTrack.children).forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        reviewTrack.appendChild(clone);
    });
}

// Vorhang beim Laden: Logo baut sich Buchstabe für Buchstabe auf,
// wird von schwarz zu gold und der Vorhang gleitet nach oben weg
const preloader = document.querySelector('.preloader');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// jeden Buchstaben in ein eigenes <span class="char"> packen
function splitLogoIntoChars() {
    let index = 0;

    preloader.querySelectorAll('.preloader__line').forEach((line, lineIndex) => {
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach((node) => {
            const fragment = document.createDocumentFragment();
            [...node.textContent].forEach((letter) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = letter === ' ' ? ' ' : letter;   // Leerzeichen bleibt sichtbar
                span.style.setProperty('--delay', `${index * 0.03 + lineIndex * 0.08}s`);
                fragment.appendChild(span);
                index++;
            });
            node.replaceWith(fragment);
        });
    });

    return index * 0.03 + 0.16;          // Verzögerung des letzten Buchstabens
}

// "ANKE ILLING" aus dem Vorhang fliegt an die Stelle des Namens in Text 1
function flyNameToHero() {
    const source = preloader.querySelector('.preloader__logo--name .preloader__line');
    const target = document.querySelector('.hero__name');
    if (!source || !target || reducedMotion) return;

    // Zielposition im fertig eingeblendeten Zustand messen (ohne den Einblend-Versatz)
    const intro = target.closest('.reveal');
    if (intro) {
        intro.style.transition = 'none';
        intro.classList.add('is-visible');
    }
    const to = target.getBoundingClientRect();
    if (intro) {
        intro.classList.remove('is-visible');
        void intro.offsetHeight;
        intro.style.transition = '';
    }

    // Ziel nicht im sichtbaren Bereich (z. B. Handy) → kein Flug
    if (to.top > window.innerHeight) return;

    const from = source.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'name-fly';
    fly.setAttribute('aria-hidden', 'true');
    fly.textContent = source.textContent.replace(/ /g, ' ');
    fly.style.fontSize = getComputedStyle(source).fontSize;
    fly.style.left = `${from.left}px`;
    fly.style.top = `${from.top}px`;
    document.body.appendChild(fly);

    source.style.visibility = 'hidden';
    target.style.visibility = 'hidden';

    const scale = to.width / from.width;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fly.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`;
        });
    });

    fly.addEventListener('transitionend', () => {
        target.style.visibility = '';
        fly.remove();
    }, { once: true });
}

// "PORTRÄTFOTOGRAFIE" so sperren, dass es genau so breit ist wie "ANKE ILLING" und die Linie
function fitSubline() {
    const logo = preloader.querySelector('.preloader__logo--name');
    if (!logo) return;

    const line = logo.querySelector('.preloader__line');
    const sub = logo.querySelector('.preloader__sub');

    // Breite der Unterzeile ohne Sperrung messen
    sub.style.transition = 'none';
    sub.style.letterSpacing = '0px';
    sub.style.marginRight = '0px';

    // sichtbare Namensbreite (ohne den Buchstabenabstand nach dem letzten Buchstaben)
    const nameWidth = line.getBoundingClientRect().width - parseFloat(getComputedStyle(line).letterSpacing || 0);
    const subWidth = sub.getBoundingClientRect().width;
    const gaps = [...sub.textContent.trim()].length - 1;

    logo.querySelector('.preloader__rule').style.width = `${nameWidth}px`;   // Linie = Namensbreite
    logo.style.setProperty('--sub-spacing', `${(nameWidth - subWidth) / gaps}px`);

    sub.style.letterSpacing = '';
    sub.style.marginRight = '';
    void sub.offsetWidth;
    sub.style.transition = '';
}

async function runPreloader() {
    if (!preloader) {
        startReveals();
        return;
    }

    document.documentElement.classList.add('is-loading');
    const pageLoaded = new Promise((resolve) => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
    });

    if (reducedMotion) {
        await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(800)]);
        fitSubline();
        preloader.classList.add('is-gold');
        await wait(400);
    } else {
        const lastDelay = splitLogoIntoChars();

        // warten, bis die Logo-Schrift geladen ist (höchstens 800 ms)
        await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(800)]);
        fitSubline();
        requestAnimationFrame(() => preloader.classList.add('is-building'));

        // bei der Namens-Variante auf Linie und Unterzeile warten
        const buildTime = preloader.querySelector('.preloader__sub') ? Math.max(lastDelay + 0.9, 1.6) : lastDelay + 0.9;
        await wait(buildTime * 1000);
        preloader.classList.add('is-gold');
        await wait(450);
    }

    // Bilder sollen möglichst geladen sein, aber nicht ewig warten
    await Promise.race([pageLoaded, wait(1000)]);

    // Scrollen erst freigeben, dann messen (Scrollbalken verändert die Breite)
    document.documentElement.classList.remove('is-loading');
    window.scrollTo(0, 0);
    flyNameToHero();
    preloader.classList.add('is-done');
    startReveals();

    preloader.addEventListener('transitionend', (e) => {
        if (e.target === preloader) preloader.remove();   // nur das Hochgleiten des Vorhangs, nicht die Buchstaben
    });
    if (reducedMotion) preloader.remove();
}

runPreloader();
