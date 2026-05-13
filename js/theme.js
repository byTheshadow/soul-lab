/* ═══════════════════════════════════════════
   Soul Lab — Theme & Font Toggle
   ═══════════════════════════════════════════ */

const ThemeManager = (() => {
  const THEME_KEY = 'soul-lab-theme';
  const FONT_KEY  = 'soul-lab-font';
  const root = document.documentElement;

  // ─── Initialize from localStorage ───
  function init() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    const savedFont  = localStorage.getItem(FONT_KEY)  || 'sans';
    applyTheme(savedTheme);
    applyFont(savedFont);
    _bindButtons();
  }

  // ─── Apply Theme ───
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);_updateThemeIcon(theme);
  }

  // ─── Apply Font ───
  function applyFont(font) {
    root.setAttribute('data-font', font);
    localStorage.setItem(FONT_KEY, font);
    _updateFontIcon(font);
  }

  // ─── Toggle Theme ───
  function toggleTheme() {
    const current = root.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ─── Toggle Font ───
  function toggleFont() {
    const current = root.getAttribute('data-font');
    applyFont(current === 'sans' ? 'serif' : 'sans');
  }

  // ─── Update Theme Button Icon ───
  function _updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = theme === 'dark'
      ? 'ti ti-sun'
      : 'ti ti-moon-stars';
  }

  // ─── Update Font Button Icon ───
  function _updateFontIcon(font) {
    const btn = document.getElementById('fontToggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = font === 'sans'
      ? 'ti ti-letter-t'       // switch to serif
      : 'ti ti-typography';    // switch to sans
  }

  // ─── Bind Click Events ───
  function _bindButtons() {
    const themeBtn = document.getElementById('themeToggle');
    const fontBtn  = document.getElementById('fontToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (fontBtn)  fontBtn.addEventListener('click', toggleFont);
  }

  return { init, toggleTheme, toggleFont, applyTheme, applyFont };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
