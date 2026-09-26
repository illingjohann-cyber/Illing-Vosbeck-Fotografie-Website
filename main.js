// Header bekommt beim Scrollen eine feine Linie
const header = document.querySelector('.site-header');

function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Elemente mit .reveal sanft einblenden, sobald sie sichtbar werden
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealItems.forEach((item, i) => {
        item.style.transitionDelay = `${i * 0.15}s`;
        observer.observe(item);
    });
} else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
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
