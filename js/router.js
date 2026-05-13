/* ═══════════════════════════════════════════
   Soul Lab — Simple Hash Router
   ═══════════════════════════════════════════ */

const Router = (() => {
  const routes = {};
  let appContainer = null;

  // ─── Register a route ───
  function register(path, renderFn) {
    routes[path] = renderFn;
  }

  // ─── Navigate to a route ───
  function navigate(path) {
    location.hash = '#' + path;
  }

  // ─── Handle route change ───
  function _handleRoute() {
    const hash = location.hash.slice(1) || '/';
    const renderFn = routes[hash];

    if (!appContainer) {
      appContainer = document.getElementById('app');
    }

    // Page transition: fade out → swap → fade in
    appContainer.style.opacity = '0';
    appContainer.style.transform = 'translateY(6px)';

    setTimeout(() => {
      if (renderFn) {
        appContainer.innerHTML = renderFn();
      } else {
        appContainer.innerHTML = _notFound();
      }

      // Update active nav pill
      _updateNav(hash);

      // Fade in
      requestAnimationFrame(() => {
        appContainer.style.opacity = '1';
        appContainer.style.transform = 'translateY(0)';
      });

      // Run any post-render hooks
      const event = new CustomEvent('routeChanged', { detail: { path: hash } });
      document.dispatchEvent(event);
    }, 200);
  }

  // ─── Update active nav state ───
  function _updateNav(hash) {
    document.querySelectorAll('.nav-pill').forEach(pill => {
      const route = pill.getAttribute('data-route');
      pill.classList.toggle('active', route === hash);
    });
  }

  // ─── 404 Page ───
  function _notFound() {
    return `
      <div class="placeholder-page">
        <i class="ti ti-compass-off placeholder-icon"></i>
        <h2 class="placeholder-title">404</h2>
        <p class="placeholder-desc">这个页面还不存在。也许它正在某个平行世界里等你创造。</p>
        <a href="#/" class="btn">RETURN HOME</a>
      </div>
    `;
  }

  // ─── Initialize ───
  function init() {
    appContainer = document.getElementById('app');

    // Add transition styles to app container
    appContainer.style.transition = `opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out)`;

    window.addEventListener('hashchange', _handleRoute);
    _handleRoute(); // Handle initial route
  }

  return { register, navigate, init };
})();
