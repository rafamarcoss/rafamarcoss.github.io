import { animate, inView } from 'https://cdn.jsdelivr.net/npm/motion@12/+esm';

const state = {
  motion: true,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const enabled = () => state.motion && !state.reduced;

const springCard = document.querySelector('.exp-spring');
const pointerCard = document.querySelector('.exp-pointer');
const labBtn = document.querySelector('.lab-btn');

// C — spring card
function bindSpringCard() {
  if (!springCard) return;
  springCard.addEventListener('pointerenter', () => {
    if (!enabled()) return;
    animate(springCard, { y: -4, scale: 1.015 }, { type: 'spring', stiffness: 320, damping: 20, mass: 0.8 });
  });
  springCard.addEventListener('pointerleave', () => {
    if (!enabled()) return;
    animate(springCard, { y: 0, scale: 1 }, { type: 'spring', stiffness: 320, damping: 22, mass: 0.8 });
  });
}

// D — pointer response
function bindPointer() {
  if (!pointerCard) return;
  pointerCard.addEventListener('pointermove', (event) => {
    if (!enabled()) return;
    const rect = pointerCard.getBoundingClientRect();
    pointerCard.style.setProperty('--px', ((event.clientX - rect.left) / rect.width) * 100 + '%');
    pointerCard.style.setProperty('--py', ((event.clientY - rect.top) / rect.height) * 100 + '%');
  });
}

// E — scroll reveal
let revealUnsub = null;
function setupReveal() {
  const items = document.querySelectorAll('.reveal-item');
  items.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
  });
  revealUnsub = inView('.reveal-item', (el) => {
    animate(el, { opacity: 1, y: 0 }, { duration: 0.7, easing: [0.22, 1, 0.36, 1] });
  }, { once: true });
}
function teardownReveal() {
  if (revealUnsub) { revealUnsub(); revealUnsub = null; }
  document.querySelectorAll('.reveal-item').forEach((el) => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

// F — button microinteraction
function bindButton() {
  if (!labBtn) return;
  labBtn.addEventListener('pointerenter', () => {
    if (enabled()) animate(labBtn, { y: -2 }, { type: 'spring', stiffness: 380, damping: 18 });
  });
  labBtn.addEventListener('pointerleave', () => {
    if (enabled()) animate(labBtn, { y: 0 }, { type: 'spring', stiffness: 300, damping: 20 });
  });
  labBtn.addEventListener('pointerdown', () => {
    if (enabled()) animate(labBtn, { scale: 0.97 }, { duration: 0.12 });
  });
  labBtn.addEventListener('pointerup', () => {
    if (enabled()) animate(labBtn, { scale: 1 }, { type: 'spring', stiffness: 400, damping: 16 });
  });
}

// controls
const motionToggle = document.getElementById('toggle-motion');
const reducedToggle = document.getElementById('toggle-reduced');

function apply() {
  const off = !state.motion || state.reduced;
  document.body.classList.toggle('lab-motion-off', off);
  if (off) {
    [springCard, labBtn].forEach((el) => { if (el) el.style.transform = ''; });
    teardownReveal();
  } else {
    setupReveal();
  }
}

motionToggle.addEventListener('change', () => { state.motion = motionToggle.checked; apply(); });
reducedToggle.addEventListener('change', () => { state.reduced = reducedToggle.checked; apply(); });

motionToggle.checked = state.motion;
reducedToggle.checked = state.reduced;

bindSpringCard();
bindPointer();
bindButton();
apply();