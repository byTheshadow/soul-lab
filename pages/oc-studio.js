//* ═══════════════════════════════════════════Soul Lab — OC Studio (Placeholder)═══════════════════════════════════════════ *//

Router.register('/oc', () => {
  return `
    <div class="placeholder-page">
      <i class="ti ti-sparkles placeholder-icon" style="color: var(--c-oc)"></i>
      <h2 class="placeholder-title">OC 创作室</h2>
      <p class="placeholder-desc">
        从一种情绪、一个概念、一句话开始——<br>
        AI陪你一步步构建完整的原创角色。
      </p>
      <div style="display:flex; gap:var(--sp-sm); flex-wrap:wrap; justify-content:center">
        <span class="tag"><i class="ti ti-cloud" style="font-size:12px"></i> 情绪</span>
        <span class="tag"><i class="ti ti-universe" style="font-size:12px"></i> 世界观</span>
        <span class="tag"><i class="ti ti-quote" style="font-size:12px"></i> 哲理</span>
        <span class="tag"><i class="ti ti-users" style="font-size:12px"></i> 关系</span>
        <span class="tag"><i class="ti ti-heartbeat" style="font-size:12px"></i> 直觉</span>
        <span class="tag"><i class="ti ti-puzzle" style="font-size:12px"></i> 纯OC</span>
      </div>
      <p style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--c-text-3); margin-top:var(--sp-xl); letter-spacing:0.08em">
        COMING IN STEP4→
      </p>
    </div>
  `;
});
