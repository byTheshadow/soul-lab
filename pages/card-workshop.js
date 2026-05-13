/* ═══════════════════════════════════════════
   Soul Lab — Card Workshop (Placeholder)
   ═══════════════════════════════════════════ */

Router.register('/card', () => {
  return `
    <div class="placeholder-page">
      <i class="ti ti-message-chatbot placeholder-icon" style="color: var(--c-card)"></i>
      <h2 class="placeholder-title">角色卡工坊</h2>
      <p class="placeholder-desc">
        专业级SillyTavern 角色卡编辑器。<br>
        支持 XML / JSON / Markdown / Plain四种输出格式，<br>
        字段级中英混排微调。
      </p>
      <div style="display:flex; gap:var(--sp-sm); flex-wrap:wrap; justify-content:center">
        <span class="tag"><i class="ti ti-code" style="font-size:12px"></i> XML</span>
        <span class="tag"><i class="ti ti-braces" style="font-size:12px"></i> JSON</span>
        <span class="tag"><i class="ti ti-markdown" style="font-size:12px"></i> Markdown</span>
        <span class="tag"><i class="ti ti-txt" style="font-size:12px"></i> Plain</span></div>
      <p style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--c-text-3); margin-top:var(--sp-xl); letter-spacing:0.08em">
        COMING IN STEP 3 →
      </p>
    </div>
  `;
});
