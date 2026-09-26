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
        preloader.classList.add('is-gold');
        await wait(400);
    } else {
        const lastDelay = splitLogoIntoChars();

        // warten, bis die Logo-Schrift geladen ist (höchstens 800 ms)
        await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(800)]);
        requestAnimationFrame(() => preloader.classList.add('is-building'));

        // bei der Namens-Variante auf Linie und Unterzeile warten
        const buildTime = preloader.querySelector('.preloader__sub') ? Math.max(lastDelay + 0.9, 2.1) : lastDelay + 0.9;
        await wait(buildTime * 1000);
        preloader.classList.add('is-gold');
        await wait(1000);
    }

    // Bilder sollen möglichst geladen sein, aber nicht ewig warten
    await Promise.race([pageLoaded, wait(2000)]);

    preloader.classList.add('is-done');
    document.documentElement.classList.remove('is-loading');
    startReveals();

    preloader.addEventListener('transitionend', (e) => {
        if (e.target === preloader) preloader.remove();   // nur das Hochgleiten des Vorhangs, nicht die Buchstaben
    });
    if (reducedMotion) preloader.remove();
}

runPreloader();
