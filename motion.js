// The hero loop pauses outside the viewport; the project scene follows page scroll.
function initMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const video = document.getElementById('hero-video');
  const button = document.getElementById('hero-motion-toggle');
  let visible = false, playing = !reduced.matches && !navigator.connection?.saveData;
  function labels() {
    const de = document.documentElement.lang === 'de';
    button.textContent = de ? (playing ? 'Hintergrund pausieren' : 'Hintergrund abspielen') : (playing ? 'Pause background' : 'Play background');
    button.setAttribute('aria-pressed', String(playing));
  }
  function sync() {
    if (playing && visible && !document.hidden) video.play().catch(() => { playing = false; labels(); });
    else video.pause();
    labels();
  }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:.1}).observe(document.querySelector('.hero'));
  button.hidden = false;
  button.addEventListener('click', () => { playing = !playing; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { if (reduced.matches) playing = false; sync(); });
  new MutationObserver(labels).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  sync();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion);
  else initMotion();
}
