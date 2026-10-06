import './touch-optimizer.css';

const isTouch = matchMedia('(pointer: coarse)').matches;

if (isTouch) {
  const action = document.getElementById('touch-interact');
  const hint = document.getElementById('hint');
  const buttons = document.querySelectorAll('.touch-action');

  // Keep touch feedback immediate and consistent across iOS/Android.
  for (const button of buttons) {
    button.addEventListener('pointerdown', () => {
      button.classList.add('is-active');
      if (navigator.vibrate) navigator.vibrate(8);
    }, { passive: true });
    button.addEventListener('pointerup', () => button.classList.remove('is-active'), { passive: true });
    button.addEventListener('pointercancel', () => button.classList.remove('is-active'), { passive: true });
  }

  // The single A/USE button becomes contextual without adding another tiny control.
  const setContextAction = (text = '') => {
    if (!action) return;
    const value = text.toUpperCase();
    let label = 'A';
    let aria = 'USE';
    if (/STORE|STORAGE/.test(value)) { label = 'S'; aria = 'STORE'; }
    else if (/OPEN|DOOR/.test(value)) { label = 'O'; aria = 'OPEN'; }
    else if (/SEARCH|LOOT|CACHE|CRATE/.test(value)) { label = 'S'; aria = 'SEARCH'; }
    else if (/REST|SLEEP|BED/.test(value)) { label = 'R'; aria = 'REST'; }
    else if (/DRINK|WATER/.test(value)) { label = 'D'; aria = 'DRINK'; }
    action.textContent = label;
    action.setAttribute('aria-label', aria);
  };

  setContextAction(hint?.textContent || '');
  if (hint) {
    new MutationObserver(() => setContextAction(hint.textContent || '')).observe(hint, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  // Avoid accidental browser gestures while the game is active.
  document.addEventListener('touchmove', (event) => {
    if (event.cancelable) event.preventDefault();
  }, { passive: false });
}
