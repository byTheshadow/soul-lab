/* ═══════════════════════════════════════════════════════════
   Settings Page — API配置 +连接测试 + 数据管理
   Soul Lab by Shadow | Step 2
   ═══════════════════════════════════════════════════════════ */

(() => {
  /* ─── Provider 预设 ─── */
  const PROVIDERS = {
    deepseek: {
      label: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com',
    },
    openai: {
      label: 'OpenAI兼容',
      baseUrl: 'https://api.openai.com',
    },};

  /* ─── 页面 HTML ─── */
  const render = () => {
    const config = Storage.getApiConfig();
    const apiKey = Storage.getApiKey();
    const stats = Storage.getDataStats();

    return `
    <div class="settings-page">

      <!--═══ 页面标题 ═══ -->
      <div class="settings-header">
        <span class="settings-meta">SETTINGS /系统设置</span>
        <h1 class="settings-title">配置中心</h1>
        <p class="settings-desc">管理你的 API 连接、模型选择和本地数据</p>
      </div>

      <!-- ═══ 区块 1: API 配置 ═══ -->
      <section class="settings-section">
        <div class="section-header">
          <span class="section-icon">🔑</span>
          <div>
            <h2 class="section-title">API 配置</h2>
            <p class="section-desc">设置你的 AI 服务提供商和密钥</p>
          </div>
        </div>

        <div class="settings-form">
          <!-- Provider -->
          <div class="form-group">
            <label class="form-label">服务提供商</label>
            <div class="form-select-wrap">
              <select id="settings-provider" class="form-select">
                <option value="deepseek" ${config.provider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
                <option value="openai" ${config.provider === 'openai' ? 'selected' : ''}>OpenAI 兼容</option>
              </select>
            </div>
          </div>

          <!-- Base URL -->
          <div class="form-group">
            <label class="form-label">API 地址</label>
            <input
              type="text"
              id="settings-base-url"
              class="form-input"
              placeholder="https://api.deepseek.com"
              value="${config.baseUrl || ''}"
            />
            <span class="form-hint">切换提供商会自动填入默认地址，也可手动修改</span>
          </div>

          <!-- API Key -->
          <div class="form-group">
            <label class="form-label">API Key</label>
            <div class="form-input-group">
              <input
                type="password"
                id="settings-api-key"
                class="form-input"
                placeholder="sk-..."
                value="${apiKey}"
              />
              <button type="button" id="settings-toggle-key" class="form-input-btn" title="显示/隐藏">👁
              </button>
            </div>
            <span class="form-hint form-hint--warn">⚠ 你的密钥只存在本地浏览器中，请勿截图或分享给他人</span>
          </div>

          <!-- Model -->
          <div class="form-group">
            <label class="form-label">模型选择</label>
            <div class="form-model-row">
              <div class="form-select-wrap form-select-wrap--model">
                <select id="settings-model" class="form-select" ${config.model ? '' : 'disabled'}>
                  ${config.model
                    ? `<option value="${config.model}" selected>${config.model}</option>`
                    : '<option value="">请先获取模型列表</option>'
                  }
                </select>
              </div>
              <button type="button" id="settings-fetch-models" class="btn-action">
                获取模型列表
              </button>
            </div><span class="form-hint">点击"获取模型列表"从 API 拉取可用模型（不消耗 token）</span>
          </div>

          <!-- Save -->
          <div class="form-actions">
            <button type="button" id="settings-save" class="btn-primary">保存配置</button>
            <span id="settings-save-status" class="form-status"></span>
          </div>
        </div>
      </section>

      <!-- ═══ 区块 2: 连接测试 ═══ -->
      <section class="settings-section">
        <div class="section-header">
          <span class="section-icon">📡</span>
          <div>
            <h2 class="section-title">连接测试</h2>
            <p class="section-desc">验证 API Key 和连接是否正常（不消耗 token）</p>
          </div>
        </div>

        <div class="test-area">
          <button type="button" id="settings-test" class="btn-action">测试连接</button>
          <span id="settings-test-status" class="form-status"></span>
        </div>

        <!-- 日志面板 -->
        <div class="log-panel">
          <button type="button" id="settings-log-toggle" class="log-toggle">
            <span class="log-toggle-icon">▶</span>
            <span>请求日志</span>
            <span id="settings-log-count" class="log-count">0</span>
          </button>
          <div id="settings-log-list" class="log-list" style="display:none;">
            <div class="log-empty">暂无日志记录</div>
          </div>
        </div>
      </section>

      <!-- ═══ 区块 3: 数据管理 ═══ -->
      <section class="settings-section">
        <div class="section-header">
          <span class="section-icon">📁</span>
          <div>
            <h2 class="section-title">数据管理</h2>
            <p class="section-desc">查看、导出或清除本地存储的数据</p>
          </div>
        </div>

        <!-- 数据概览 -->
        <div class="data-overview">
          <div class="data-stat">
            <span class="data-stat-value" id="stat-oc">${stats.ocDrafts}</span>
            <span class="data-stat-label">OC 草稿</span>
          </div>
          <div class="data-stat">
            <span class="data-stat-value" id="stat-cards">${stats.cards}</span>
            <span class="data-stat-label">角色卡草稿</span>
          </div>
          <div class="data-stat">
            <span class="data-stat-value" id="stat-worlds">${stats.worlds}</span>
            <span class="data-stat-label">世界观</span>
          </div></div>

        <!-- 操作按钮 -->
        <div class="data-actions">
          <button type="button" id="settings-export" class="btn-action">导出全部数据</button>
          <label class="btn-action btn-action--upload">
            导入数据
            <input type="file" id="settings-import" accept=".json" style="display:none;" />
          </label>
          <button type="button" id="settings-clear" class="btn-danger">清除所有数据 ⚠</button>
        </div>
      </section>

      <!-- ═══ 清除确认弹窗 ═══ -->
      <div id="settings-confirm-overlay" class="confirm-overlay" style="display:none;">
        <div class="confirm-dialog">
          <h3 class="confirm-title">⚠ 确认清除所有数据</h3>
          <p class="confirm-desc">此操作将删除所有本地数据，包括 API 配置、OC 草稿、角色卡和世界观。<br/>此操作不可撤销。</p>
          <div class="confirm-actions">
            <button type="button" id="settings-confirm-cancel" class="btn-action">取消</button>
            <button type="button" id="settings-confirm-yes" class="btn-danger">确认清除</button>
          </div>
        </div>
      </div></div>
    `;
  };

  /* ─── 事件绑定 ─── */
  const bindEvents = () => {

    /* --- Provider切换 → 自动填baseUrl --- */
    const providerEl = document.getElementById('settings-provider');
    const baseUrlEl = document.getElementById('settings-base-url');
    if (providerEl && baseUrlEl) {
      providerEl.addEventListener('change', () => {
        const p = PROVIDERS[providerEl.value];
        if (p) baseUrlEl.value = p.baseUrl;
      });
    }

    /* --- API Key 显示/隐藏 --- */
    const keyEl = document.getElementById('settings-api-key');
    const toggleKeyEl = document.getElementById('settings-toggle-key');
    if (keyEl && toggleKeyEl) {
      toggleKeyEl.addEventListener('click', () => {
        const isPassword = keyEl.type === 'password';
        keyEl.type = isPassword ? 'text' : 'password';
        toggleKeyEl.textContent = isPassword ? '🙈' : '👁';
      });
    }

    /* --- 获取模型列表 --- */
    const fetchModelsBtn = document.getElementById('settings-fetch-models');
    const modelSelect = document.getElementById('settings-model');
    if (fetchModelsBtn && modelSelect) {
      fetchModelsBtn.addEventListener('click', async () => {
        // save current config first
        _saveConfigSilent();

        fetchModelsBtn.disabled = true;
        fetchModelsBtn.textContent = '获取中...';

        try {
          const models = await AIClient.getModels();

          if (models.length === 0) {
            modelSelect.innerHTML = '<option value="">未找到可用模型</option>';
            modelSelect.disabled = true;
          } else {
            const currentModel = Storage.getApiConfig().model;
            modelSelect.innerHTML = models
              .map((m) => `<option value="${m}" ${m === currentModel ? 'selected' : ''}>${m}</option>`)
              .join('');
            modelSelect.disabled = false;
          }
        } catch (e) {
          modelSelect.innerHTML = `<option value="">获取失败</option>`;
          modelSelect.disabled = true;
        }

        fetchModelsBtn.disabled = false;
        fetchModelsBtn.textContent = '获取模型列表';
        _refreshLogs();
      });
    }

    /* --- 保存配置 --- */
    const saveBtn = document.getElementById('settings-save');
    const saveStatus = document.getElementById('settings-save-status');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        _saveConfigSilent();
        if (saveStatus) {
          saveStatus.textContent = '✓ 已保存';
          saveStatus.className = 'form-status form-status--ok';
          setTimeout(() => { saveStatus.textContent = ''; }, 2000);
        }
      });
    }

    /* --- 测试连接 --- */
    const testBtn = document.getElementById('settings-test');
    const testStatus = document.getElementById('settings-test-status');
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        _saveConfigSilent();
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';
        if (testStatus) {
          testStatus.textContent = '';
          testStatus.className = 'form-status';
        }

        try {
          const result = await AIClient.testConnection();
          if (testStatus) {
            testStatus.textContent = `✓ 连接成功 (${result.elapsed}ms)`;
            testStatus.className = 'form-status form-status--ok';
          }
        } catch (e) {
          if (testStatus) {
            testStatus.textContent = `✗ ${e.message}`;
            testStatus.className = 'form-status form-status--err';
          }
        }

        testBtn.disabled = false;
        testBtn.textContent = '测试连接';
        _refreshLogs();
      });
    }

    /* --- 日志面板 --- */
    const logToggle = document.getElementById('settings-log-toggle');
    const logList = document.getElementById('settings-log-list');
    if (logToggle && logList) {
      logToggle.addEventListener('click', () => {
        const isOpen = logList.style.display !== 'none';
        logList.style.display = isOpen ? 'none' : 'block';
        logToggle.querySelector('.log-toggle-icon').textContent = isOpen ? '▶' : '▼';
        if (!isOpen) _refreshLogs();
      });
    }

    /* --- 导出数据 --- */
    const exportBtn = document.getElementById('settings-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = Storage.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soul-lab-backup-${_dateStamp()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    /* --- 导入数据 --- */
    const importInput = document.getElementById('settings-import');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            const count = Storage.importAll(data);
            alert(`导入成功，共恢复 ${count} 项数据。页面将刷新。`);
            location.reload();
          } catch (err) {
            alert(`导入失败：${err.message}`);
          }
        };
        reader.readAsText(file);
        // reset input so same file can be selected again
        importInput.value = '';
      });
    }

    /* --- 清除数据 --- */
    const clearBtn = document.getElementById('settings-clear');
    const overlay = document.getElementById('settings-confirm-overlay');
    const confirmCancel = document.getElementById('settings-confirm-cancel');
    const confirmYes = document.getElementById('settings-confirm-yes');

    if (clearBtn && overlay) {
      clearBtn.addEventListener('click', () => {
        overlay.style.display = 'flex';
      });
    }
    if (confirmCancel && overlay) {
      confirmCancel.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }
    if (confirmYes && overlay) {
      confirmYes.addEventListener('click', () => {
        Storage.clear();
        overlay.style.display = 'none';alert('所有数据已清除。页面将刷新。');
        location.reload();
      });
    }
  };

  /* ─── 内部工具 ─── */

  const _saveConfigSilent = () => {
    const provider = document.getElementById('settings-provider')?.value || 'deepseek';
    const baseUrl = document.getElementById('settings-base-url')?.value || '';
    const model = document.getElementById('settings-model')?.value || '';
    const apiKey = document.getElementById('settings-api-key')?.value || '';

    Storage.setApiConfig({ provider, baseUrl, model });Storage.setApiKey(apiKey);
  };

  const _refreshLogs = () => {
    const logList = document.getElementById('settings-log-list');
    const logCount = document.getElementById('settings-log-count');
    if (!logList) return;

    const logs = AIClient.getLogs();
    if (logCount) logCount.textContent = logs.length;

    if (logs.length === 0) {
      logList.innerHTML = '<div class="log-empty">暂无日志记录</div>';
      return;
    }

    logList.innerHTML = logs
      .map((log) => {
        const icon = log.status === 'success' ? '✓' : '✗';
        const cls = log.status === 'success' ? 'log-ok' : 'log-err';
        return `<div class="log-item ${cls}"><span class="log-time">[${log.time}]</span> <span class="log-icon">${icon}</span> ${log.message}</div>`;
      })
      .join('');
  };

  const _dateStamp = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  /* ─── 注册路由 ─── */
  Router.register('/settings', () => {
    // use setTimeout to bind events after DOM is rendered
    setTimeout(bindEvents, 0);
    return render();
  });

})();
/* ═══ END: Settings Page ═══ */
