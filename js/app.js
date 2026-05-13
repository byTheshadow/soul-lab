/* ═══════════════════════════════════════════
   Soul Lab — Application Entry Point
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize router (pages already registered via their own files)
  Router.init();

  console.log(
    '%c✦ Soul Lab by Shadow %cv0.1.0',
    'color: #C4A882; font-weight: bold; font-size: 14px;',
    'color: #666; font-size: 12px;'
  );
});
