/* ═══════════════════════════════════════════
   Card Workshop Page
   ═══════════════════════════════════════════ */

const CardWorkshop = {
  // 状态机
  STATE_EMPTY: 'empty',           // 无草稿，显示引导
  STATE_SELECT_MODE: 'select_mode', // 选择模式
  STATE_IMPORT: 'import',         // 导入已有人设
  STATE_CHAT: 'chat',             // 对话中

  currentState: 'empty',
  currentDraft: null,
  drafts: [],

  init() {
    this.loadDrafts();
    this.render();
  },

  loadDrafts() {
    this.drafts = DraftStorage.getAll();
    if (this.drafts.length > 0) {
      this.currentDraft = this.drafts[0];
      this.currentState = this.STATE_CHAT;
    } else {
      this.currentState = this.STATE_EMPTY;
    }
  },

  render() {
    const container = document.getElementById('app');
    
    if (this.currentState === this.STATE_EMPTY) {
      container.innerHTML = this.renderEmpty();
    } else {
      container.innerHTML = this.renderWorkspace();
      this.attachEventListeners();
      this.renderCurrentView();
    }
  },

  // ─── 空状态：引导创建草稿 ───
  renderEmpty() {
    return `
      <div class="card-workshop">
        <div class="card-empty-state">
          <div class="empty-icon">
            <i class="ti ti-file-plus"></i>
          </div>
          <h2 class="empty-title">开始创作角色卡</h2>
          <p class="empty-desc">创建第一个草稿，开始与 AI 协作</p>
          <button class="btn btn-primary" onclick="CardWorkshop.createNewDraft()">
            <i class="ti ti-plus"></i>
            新建草稿
          </button>
        </div>
      </div>
    `;
  },

  // ─── 工作区：三栏布局 ───
  renderWorkspace() {
    const stashCount = this.currentDraft?.worldbookStash?.length || 0;
    const canCreateNew = this.drafts.length < 3;

    return `
      <div class="card-workshop">
        <!-- 顶部栏：草稿 Tabs -->
        <div class="card-topbar">
          <div class="card-tabs">
            ${this.drafts.map(draft => `
              <div class="card-tab ${draft.id === this.currentDraft?.id ? 'active' : ''}" 
                   data-draft-id="${draft.id}">
                <span class="card-tab-title">${draft.title}</span>
                <button class="card-tab-close" data-action="close-tab">
                  <i class="ti ti-x"></i>
                </button>
              </div>
            `).join('')}
            ${canCreateNew ? `
              <button class="card-tab-new" data-action="new-draft">
                <i class="ti ti-plus"></i>
              </button>
            ` : ''}
          </div>
          <div class="card-stash-indicator">
            <i class="ti ti-book"></i>
            <span>世界书暂存 (${stashCount})</span>
          </div>
        </div>

        <!-- 主体：三栏布局 -->
        <div class="card-main">
          <!-- 左侧：快捷指令面板 -->
          <aside class="card-sidebar card-sidebar-left" id="shortcutPanel">
            <div class="card-sidebar-header">
              <h3 class="card-sidebar-title">快捷指令</h3>
              <button class="card-sidebar-toggle" data-action="toggle-shortcuts">
                <i class="ti ti-chevron-left"></i>
              </button>
            </div>
            <div class="card-sidebar-content">
              <p class="card-sidebar-placeholder">快捷指令面板（待实现）</p>
            </div>
          </aside>

          <!-- 中间：对话区 -->
          <div class="card-center" id="chatArea">
            <!-- 动态渲染：选择模式 / 导入 / 对话 -->
          </div>

          <!-- 右侧：世界书暂存 -->
          <aside class="card-sidebar card-sidebar-right" id="worldbookPanel">
            <div class="card-sidebar-header">
              <h3 class="card-sidebar-title">世界书暂存</h3>
              <button class="card-sidebar-toggle" data-action="toggle-worldbook">
                <i class="ti ti-chevron-right"></i>
              </button>
            </div>
            <div class="card-sidebar-content">
              ${stashCount === 0 ? `
                <p class="card-sidebar-placeholder">暂无标记内容</p>
              ` : `
                <div class="worldbook-stash-list">
                  ${this.currentDraft.worldbookStash.map((item, idx) => `
                    <div class="worldbook-stash-item">
                      <div class="worldbook-stash-text">${item.text}</div>
                      <button class="worldbook-stash-remove" data-index="${idx}">
                        <i class="ti ti-x"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </aside>
        </div>
      </div>
    `;
  },

  // ─── 中间区域动态渲染 ───
  renderCurrentView() {
    const chatArea = document.getElementById('chatArea');
    
    if (this.currentState === this.STATE_SELECT_MODE) {
      chatArea.innerHTML = this.renderSelectMode();
    } else if (this.currentState === this.STATE_IMPORT) {
      chatArea.innerHTML = this.renderImport();
    } else if (this.currentState === this.STATE_CHAT) {
      chatArea.innerHTML = this.renderChat();
    }
  },

  // ─── 选择模式 ───
  renderSelectMode() {
    return `
      <div class="card-mode-select">
        <h2 class="card-mode-title">选择创作模式</h2>
        <div class="card-mode-options">
          <button class="card-mode-card" data-mode="inspiration">
            <i class="ti ti-bulb"></i>
            <h3>灵感创作</h3>
            <p>从零开始，与 AI 共同构建角色</p>
          </button>
          <button class="card-mode-card" data-mode="existing">
            <i class="ti ti-file-import"></i>
            <h3>已有人设</h3>
            <p>导入现有人设，让 AI 帮你优化</p>
          </button>
        </div>
      </div>
    `;
  },

  // ─── 导入已有人设 ───
  renderImport() {
    return `
      <div class="card-import">
        <h2 class="card-import-title">导入已有人设</h2>
        <p class="card-import-desc">粘贴你的角色设定文本，AI 会帮你分析和优化</p>
        <textarea 
          class="card-import-textarea" 
          id="importTextarea"
          placeholder="粘贴角色设定文本..."
          rows="12"
        ></textarea>
        <div class="card-import-actions">
          <button class="btn" onclick="CardWorkshop.cancelImport()">
            <i class="ti ti-arrow-left"></i>
            返回
          </button>
          <button class="btn btn-primary" onclick="CardWorkshop.confirmImport()">
            <i class="ti ti-check"></i>
            开始创作
          </button>
        </div>
      </div>
    `;
  },

  // ─── 对话界面 ───
  renderChat() {
    const messages = this.currentDraft?.messages || [];
    
    return `
      <div class="card-chat">
        <div class="card-chat-messages" id="chatMessages">
          ${messages.length === 0 ? `
            <div class="card-chat-empty">
              <i class="ti ti-message-circle"></i>
              <p>开始与 AI 对话，创作你的角色卡</p>
            </div>
          ` : messages.map(msg => this.renderMessage(msg)).join('')}
        </div>
        <div class="card-chat-input">
          <textarea 
            class="card-input-textarea" 
            id="chatInput"
            placeholder="输入消息..."
            rows="3"
          ></textarea>
          <button class="btn btn-primary" id="sendBtn">
            <i class="ti ti-send"></i>
            发送
          </button>
        </div>
      </div>
    `;
  },

  renderMessage(msg) {
    const isUser = msg.role === 'user';
    return `
      <div class="card-message ${isUser ? 'card-message-user' : 'card-message-ai'}" 
           data-message-id="${msg.id}">
        <div class="card-message-content">
          ${msg.content}
        </div>
      </div>
    `;
  },

  // ─── 事件处理 ───
  attachEventListeners() {
    const container = document.getElementById('app');

    // Tab 切换
    container.querySelectorAll('.card-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="close-tab"]')) {
          this.closeDraft(tab.dataset.draftId);
        } else {
          this.switchDraft(tab.dataset.draftId);
        }
      });
    });

    // 新建草稿
    const newBtn = container.querySelector('[data-action="new-draft"]');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.createNewDraft());
    }

    // 侧边栏折叠
    container.querySelectorAll('.card-sidebar-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sidebar = e.target.closest('.card-sidebar');
        sidebar.classList.toggle('collapsed');
      });
    });

    // 模式选择
    container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectMode(e.target.closest('[data-mode]').dataset.mode);
      });
    });

    // 发送消息
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
  },

  // ─── 业务逻辑 ───
  createNewDraft() {
    if (this.drafts.length >= 3) {
      alert('最多只能创建 3 个草稿');
      return;
    }
    this.currentState = this.STATE_SELECT_MODE;
    this.render();
  },

  selectMode(mode) {
    const draft = DraftStorage.create(mode);
    if (!draft) {
      alert('创建草稿失败');
      return;
    }

    this.drafts.push(draft);
    this.currentDraft = draft;

    if (mode === 'existing') {
      this.currentState = this.STATE_IMPORT;
    } else {
      this.currentState = this.STATE_CHAT;
    }

    this.render();
  },

  cancelImport() {
    this.currentState = this.STATE_SELECT_MODE;
    this.renderCurrentView();
  },

  confirmImport() {
    const textarea = document.getElementById('importTextarea');
    const text = textarea.value.trim();
    
    if (!text) {
      alert('请输入人设内容');
      return;
    }

    DraftStorage.update(this.currentDraft.id, { sourceText: text });
    this.currentDraft.sourceText = text;
    this.currentState = this.STATE_CHAT;
    this.renderCurrentView();
  },

  switchDraft(draftId) {
    const draft = this.drafts.find(d => d.id === draftId);
    if (draft) {
      this.currentDraft = draft;
      this.render();
    }
  },

  closeDraft(draftId) {
    if (!confirm('确定关闭此草稿？未保存的内容将丢失。')) {
      return;
    }

    DraftStorage.delete(draftId);
    this.drafts = this.drafts.filter(d => d.id !== draftId);

    if (this.drafts.length === 0) {
      this.currentState = this.STATE_EMPTY;
      this.currentDraft = null;
    } else {
      this.currentDraft = this.drafts[0];
      this.currentState = this.STATE_CHAT;
    }

    this.render();
  },

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    this.currentDraft.messages.push(userMsg);
    DraftStorage.update(this.currentDraft.id, { 
      messages: this.currentDraft.messages 
    });

    input.value = '';
    this.renderCurrentView();

    // TODO: 调用 AI
    this.callAI(text);
  },

  async callAI(userInput) {
    // 占位，下一步实现
    console.log('TODO: Call AI with', userInput);
  }
};

// 注册路由（在文件末尾）
if (typeof Router !== 'undefined') {
  Router.register('/card', () => {
    // 延迟执行，等路由动画完成
    setTimeout(() => {
      CardWorkshop.init();
    }, 0);
    return ''; // 返回空字符串
  });
}


