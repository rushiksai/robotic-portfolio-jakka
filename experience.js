// The actual experience cards travel along an arc. No duplicate labels or spring.
function experienceCardPose(top, height, viewportHeight) {
  const center = top + height / 2;
  const focus = 90 + (viewportHeight - 90) / 2;
  const distance = (center - focus) / ((viewportHeight - 90 + height) / 2);
  const amount = Math.min(1, Math.max(0, (Math.abs(distance) - .24) / .76));
  const angle = Math.sign(distance) * amount * 55;
  const radians = angle * Math.PI / 180;
  return { angle, x: Math.sin(radians) * 230, z: (Math.cos(radians) - 1) * 420 };
}
function initExperience() {
  const section = document.querySelector('.experience-journey');
  if (!section) return;
  const entries = section.querySelector('.experience-entries');
  const cards = [...section.querySelectorAll('.experience-entry')];
  const hint = section.querySelector('.experience-hint');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 800px)');
  let frame = 0, enabled = false;
  function render() {
    frame = 0;
    if (!enabled) return;
    const top = entries.getBoundingClientRect().top;
    // Read untransformed layout positions to avoid a feedback loop while rotating.
    const poses = cards.map(card => experienceCardPose(top + card.offsetTop, card.offsetHeight, innerHeight));
    cards.forEach((card, index) => {
      const { angle, x, z } = poses[index];
      card.style.zIndex = String(Math.round(100 - Math.abs(angle)));
      card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function update() {
    enabled = document.body.dataset.design === 'orbit' && !reducedMotion.matches && !compact.matches;
    section.classList.toggle('has-orbit', enabled);
    hint.hidden = !enabled;
    if (!enabled) cards.forEach(card => card.style.removeProperty('transform'));
    hint.textContent = document.documentElement.lang === 'de' ? 'Durch meine Erfahrungen scrollen ↓' : 'Scroll through my experience ↓';
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', update);
  compact.addEventListener('change', update);
  const observer = new ResizeObserver(schedule);
  observer.observe(entries);
  cards.forEach(card => observer.observe(card));
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  update();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initExperience);
  else initExperience();
}
