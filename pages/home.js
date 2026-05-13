/* ═══════════════════════════════════════════
   Soul Lab — Home Page
   ═══════════════════════════════════════════ */

Router.register('/', () => {
  return `
    <section class="hero-section">

      <!-- Top Meta -->
      <div class="hero-meta-bar">
        <div class="hero-meta">
          [01] AI-POWERED CREATION<br>
          ESTABLISHED MMXXV
        </div>
        <div class="hero-meta" style="text-align:right">
          VOL. 1 — BUILD0.1<br>
          OPEN SOURCE / FREE
        </div>
      </div>

      <!-- Giant Title + Floating Cards -->
      <div class="hero-title-wrap">

        <!-- Background Title Text -->
        <div class="hero-title">
          <span class="hero-title-outline">SOUL</span><br>
          <span class="hero-title-outline">LAB</span>
        </div>

        <!-- Floating Cards -->
        <div class="hero-cards">
          <div class="hero-float-card">
            <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=540&fit=crop&crop=face"
                 alt="Atmospheric portrait"
                 loading="lazy">
          </div>
          <div class="hero-float-card">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=540&fit=crop&crop=face"
                 alt="Character inspiration"
                 loading="lazy">
          </div>
          <div class="hero-float-card">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=540&fit=crop&crop=face"
                 alt="Creative portrait"
                 loading="lazy"><!-- CTA Circle -->
            <div class="hero-cta-circle" onclick="location.hash='#/oc'">
              EXPLORE<br>INDEX
            </div>
          </div>
        </div>

        <!-- Geometric Decorations -->
        <div class="hero-geo hero-geo-rect hero-geo-1"></div>
        <div class="hero-geo hero-geo-rect hero-geo-2"></div>
        <div class="hero-geo hero-geo-oval hero-geo-3"></div>
        <div class="hero-geo hero-geo-rect hero-geo-4"></div>

      </div>

      <!-- Dual Portal Entries -->
      <div class="hero-portals">
        <div class="portal-entry oc" onclick="location.hash='#/oc'">
          <div class="portal-icon"><i class="ti ti-sparkles"></i></div>
          <div class="portal-name">OC Studio</div>
          <p class="portal-desc">
            从灵感出发，AI对话式引导<br>
            构建完整的原创角色人物志
          </p>
          <div class="portal-arrow"><i class="ti ti-arrow-right"></i></div>
        </div>
        <div class="portal-entry card-ws" onclick="location.hash='#/card'">
          <div class="portal-icon"><i class="ti ti-message-chatbot"></i></div>
          <div class="portal-name">Card Workshop</div>
          <p class="portal-desc">
            专业角色卡编辑器<br>
            ST 格式原生对齐，多语言输出
          </p>
          <div class="portal-arrow"><i class="ti ti-arrow-right"></i></div>
        </div>
      </div>

      <!-- Bottom Lines -->
      <div class="hero-bottom-line">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>

    </section>
  `;
});
