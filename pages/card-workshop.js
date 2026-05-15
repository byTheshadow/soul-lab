/* ═══════════════════════════════════════════
   Card Workshop Page
   Soul Lab by Shadow
   ═══════════════════════════════════════════ */

const CardWorkshop = {
  // ─── 状态机 ───
  STATE_EMPTY: 'empty',
  STATE_SELECT_MODE: 'select_mode',
  STATE_IMPORT: 'import',
  STATE_CHAT: 'chat',

  currentState: 'empty',
  currentDraft: null,
  drafts: [],

  // ─── AI 流式控制 ───
  _abortController: null,
  _isStreaming: false,

  // ─── max_tokens 档位 ───
  TOKEN_PRESETS: [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 128000],

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
      this.renderCurrentView();
      this.attachEventListeners();
    }
  },

  // ══════════════════════════════════════════
  // 渲染层
  // ══════════════════════════════════════════

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

  renderWorkspace() {
    const stashCount = this.currentDraft?.worldbookStash?.length || 0;
    const canCreateNew = this.drafts.length < 3;
    const maxTokens = this.currentDraft?.maxTokens || 4096;
    const tokenIndex = this.TOKEN_PRESETS.indexOf(maxTokens);
    const sliderIndex = tokenIndex >= 0 ? tokenIndex : 4; // 默认 4096

    return `
      <div class="card-workshop">
        <!-- 顶部栏 -->
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

          <!-- 右侧控制区 -->
          <div class="card-topbar-controls">
            <!-- max_tokens 滑块 -->
            <div class="token-control">
              <span class="token-label">
                <i class="ti ti-adjustments-horizontal"></i>
                <span id="tokenDisplay">${maxTokens.toLocaleString()}</span>
              </span>
              <input
                type="range"
                class="token-slider"
                id="tokenSlider"
                min="0"
                max="${this.TOKEN_PRESETS.length - 1}"
                value="${sliderIndex}"
                step="1"
              />
            </div>

            <!-- 世界书暂存指示器 -->
            <div class="card-stash-indicator">
              <i class="ti ti-book"></i>
              <span id="stashCount">世界书暂存 (${stashCount})</span>
            </div>
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
          <div class="card-center" id="chatArea"></div>

          <!-- 右侧：世界书暂存 -->
          <aside class="card-sidebar card-sidebar-right" id="worldbookPanel">
            <div class="card-sidebar-header">
              <h3 class="card-sidebar-title">世界书暂存</h3>
              <button class="card-sidebar-toggle" data-action="toggle-worldbook">
                <i class="ti ti-chevron-right"></i>
              </button>
            </div>
            <div class="card-sidebar-content" id="worldbookContent">
              ${this.renderWorldbookStash()}
            </div>
          </aside>
        </div>
      </div>
    `;
  },

  renderWorldbookStash() {
    const stash = this.currentDraft?.worldbookStash || [];
    if (stash.length === 0) {
      return `<p class="card-sidebar-placeholder">暂无标记内容</p>`;
    }
    return `
      <div class="worldbook-stash-list">
        ${stash.map((item, idx) => `
          <div class="worldbook-stash-item">
            <div class="worldbook-stash-text">${this._escapeHtml(item.text)}</div>
            <button class="worldbook-stash-remove" data-index="${idx}">
              <i class="ti ti-x"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderCurrentView() {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;

    if (this.currentState === this.STATE_SELECT_MODE) {
      chatArea.innerHTML = this.renderSelectMode();
    } else if (this.currentState === this.STATE_IMPORT) {
      chatArea.innerHTML = this.renderImport();
    } else if (this.currentState === this.STATE_CHAT) {
      chatArea.innerHTML = this.renderChat();
      this.attachChatListeners();
      this.scrollToBottom();
    }
  },

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

  renderImport() {
    return `
      <div class="card-import">
        <h2 class="card-import-title">导入已有人设</h2>
        <p class="card-import-desc">粘贴你的角色设定文本，AI 会从文学大师的视角帮你分析和优化</p>
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

  renderChat() {
    const messages = this.currentDraft?.messages || [];
    const systemPrompt = this.currentDraft?.systemPrompt || this._buildDefaultSystemPrompt();

    return `
      <div class="card-chat">

        <!-- System Prompt 折叠面板 -->
        <div class="card-system-prompt" id="systemPromptPanel">
          <button class="card-system-prompt-header" data-action="toggle-system-prompt">
            <span class="card-system-prompt-label">
              <i class="ti ti-terminal-2"></i>
              系统提示词
            </span>
            <i class="ti ti-chevron-down card-system-prompt-chevron"></i>
          </button>
          <div class="card-system-prompt-body" id="systemPromptBody" style="display:none">
            <textarea
              class="card-system-prompt-textarea"
              id="systemPromptTextarea"
              rows="6"
              placeholder="输入系统提示词..."
            >${this._escapeHtml(systemPrompt)}</textarea>
            <div class="card-system-prompt-actions">
              <button class="btn btn-sm" data-action="reset-system-prompt">
                <i class="ti ti-refresh"></i>
                重置默认
              </button>
              <button class="btn btn-sm btn-primary" data-action="save-system-prompt">
                <i class="ti ti-check"></i>
                保存
              </button>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="card-chat-messages" id="chatMessages">
          ${messages.length === 0 ? `
            <div class="card-chat-empty">
              <i class="ti ti-message-circle"></i>
              <p>开始与 AI 对话，创作你的角色卡</p>
            </div>
          ` : messages.map(msg => this.renderMessage(msg)).join('')}
        </div>

        <!-- 输入区 -->
        <div class="card-chat-input">
          <textarea
            class="card-input-textarea"
            id="chatInput"
            placeholder="输入消息… (Ctrl+Enter 发送)"
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
    const isError = msg.role === 'error';

    let cls = 'card-message-ai';
    if (isUser) cls = 'card-message-user';
    if (isError) cls = 'card-message-error';

    // AI 消息支持简单的换行渲染
    const content = isUser || isError
      ? this._escapeHtml(msg.content)
      : this._renderMarkdownLite(msg.content);

    return `
      <div class="card-message ${cls}" data-message-id="${msg.id}">
        <div class="card-message-content">${content}</div>
      </div>
    `;
  },

  // ══════════════════════════════════════════
  // 事件绑定
  // ══════════════════════════════════════════

  attachEventListeners() {
    const container = document.getElementById('app');

    // 移除旧监听器
    const oldHandler = container._workshopHandler;
    if (oldHandler) container.removeEventListener('click', oldHandler);

    const handler = (e) => {
      // Tab 关闭
      if (e.target.closest('[data-action="close-tab"]')) {
        const tab = e.target.closest('.card-tab');
        if (tab) this.closeDraft(tab.dataset.draftId);
        return;
      }
      // Tab 切换
      const tab = e.target.closest('.card-tab');
      if (tab && !e.target.closest('[data-action="close-tab"]')) {
        this.switchDraft(tab.dataset.draftId);
        return;
      }
      // 新建草稿
      if (e.target.closest('[data-action="new-draft"]')) {
        this.createNewDraft();
        return;
      }
      // 侧边栏折叠
      if (e.target.closest('[data-action="toggle-shortcuts"]') ||
          e.target.closest('[data-action="toggle-worldbook"]')) {
        const sidebar = e.target.closest('.card-sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
        return;
      }
      // 模式选择
      const modeCard = e.target.closest('[data-mode]');
      if (modeCard) {
        this.selectMode(modeCard.dataset.mode);
        return;
      }
      // 世界书移除
      const removeBtn = e.target.closest('.worldbook-stash-remove');
      if (removeBtn) {
        this.removeWorldbookItem(parseInt(removeBtn.dataset.index));
        return;
      }
      // System Prompt 折叠
      if (e.target.closest('[data-action="toggle-system-prompt"]')) {
        this.toggleSystemPrompt();
        return;
      }
      // System Prompt 保存
      if (e.target.closest('[data-action="save-system-prompt"]')) {
        this.saveSystemPrompt();
        return;
      }
      // System Prompt 重置
      if (e.target.closest('[data-action="reset-system-prompt"]')) {
        this.resetSystemPrompt();
        return;
      }
    };

    container._workshopHandler = handler;
    container.addEventListener('click', handler);

    // token 滑块
    const tokenSlider = document.getElementById('tokenSlider');
    if (tokenSlider) {
      tokenSlider.addEventListener('input', (e) => {
        const idx = parseInt(e.target.value);
        const val = this.TOKEN_PRESETS[idx];
        const display = document.getElementById('tokenDisplay');
        if (display) display.textContent = val.toLocaleString();
        if (this.currentDraft) {
          this.currentDraft.maxTokens = val;
          DraftStorage.update(this.currentDraft.id, { maxTokens: val });
        }
      });
    }
  },

  attachChatListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (this._isStreaming) {
          this.stopStreaming();
        } else {
          this.sendMessage();
        }
      });
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!this._isStreaming) this.sendMessage();
        }
      });
    }
  },

  // ══════════════════════════════════════════
  // System Prompt
  // ══════════════════════════════════════════

  toggleSystemPrompt() {
    const body = document.getElementById('systemPromptBody');
    const chevron = document.querySelector('.card-system-prompt-chevron');
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  },

  saveSystemPrompt() {
    const textarea = document.getElementById('systemPromptTextarea');
    if (!textarea || !this.currentDraft) return;
    const val = textarea.value.trim();
    this.currentDraft.systemPrompt = val;
    DraftStorage.update(this.currentDraft.id, { systemPrompt: val });
    this._showToast('系统提示词已保存');
  },

  resetSystemPrompt() {
    const textarea = document.getElementById('systemPromptTextarea');
    if (!textarea) return;
    const defaultPrompt = this._buildDefaultSystemPrompt();
    textarea.value = defaultPrompt;
    if (this.currentDraft) {
      this.currentDraft.systemPrompt = defaultPrompt;
      DraftStorage.update(this.currentDraft.id, { systemPrompt: defaultPrompt });
    }
    this._showToast('已重置为默认提示词');
  },

  _buildDefaultSystemPrompt() {
    const mode = this.currentDraft?.mode || 'inspiration';
    if (mode === 'existing') {
      return `你是一位经验丰富的文学大师和角色设计专家，擅长分析和优化 AI 角色扮演用的角色卡（Character Card）。

你的工作方式：
1. 仔细阅读用户提供的人设文本，感受角色的气质和核心魅力
2. 以文学大师的视角，先肯定人设中的亮点和独特之处
3. 对逻辑不合理、前后矛盾或可以深化的地方，以提问的方式引导用户思考
4. 从以下维度帮助用户完善角色：剧情合理性、角色一致性、给读者/玩家的体验感、世界观深度
5. 始终保持建设性和启发性，而非直接给出答案

请用中文回复，语气专业但不失温度。`;
    }
    return `你是一位经验丰富的角色卡创作助手，擅长帮助用户从零开始设计 AI 角色扮演用的角色卡（Character Card）。

你的工作方式：
1. 通过有针对性的提问，逐步引导用户构建角色的各个维度
2. 每次聚焦 1-2 个问题，不要一次性抛出太多问题
3. 根据用户的回答，适时给出具体的建议和示例
4. 帮助用户思考：角色的核心性格、背景故事、说话风格、行为模式、与其他角色的关系
5. 在适当时机，建议用户考虑世界观设定和特殊词条

请用中文回复，语气亲切自然。`;
  },

  // ══════════════════════════════════════════
  // 业务逻辑
  // ══════════════════════════════════════════

  createNewDraft() {
    if (this.drafts.length >= 3) {
      this._showToast('最多只能创建 3 个草稿');
      return;
    }
    this.currentState = this.STATE_SELECT_MODE;
    this.render();
  },

  selectMode(mode) {
    const draft = DraftStorage.create(mode);
    if (!draft) {
      this._showToast('创建草稿失败');
      return;
    }
    // 初始化草稿的扩展字段
    draft.systemPrompt = this._buildDefaultSystemPromptForMode(mode);
    draft.maxTokens = 4096;
    draft.worldbookStash = draft.worldbookStash || [];
    DraftStorage.update(draft.id, {
      systemPrompt: draft.systemPrompt,
      maxTokens: draft.maxTokens,
      worldbookStash: draft.worldbookStash,
    });

    this.drafts.push(draft);
    this.currentDraft = draft;

    if (mode === 'existing') {
      this.currentState = this.STATE_IMPORT;
    } else {
      this.currentState = this.STATE_CHAT;
    }
    this.render();
  },

  _buildDefaultSystemPromptForMode(mode) {
    // 临时设置 mode 以复用 _buildDefaultSystemPrompt
    const prev = this.currentDraft;
    this.currentDraft = { mode };
    const prompt = this._buildDefaultSystemPrompt();
    this.currentDraft = prev;
    return prompt;
  },

  cancelImport() {
    // 删除刚创建的草稿（用户取消了）
    if (this.currentDraft) {
      DraftStorage.delete(this.currentDraft.id);
      this.drafts = this.drafts.filter(d => d.id !== this.currentDraft.id);
      this.currentDraft = this.drafts[0] || null;
    }
    this.currentState = this.drafts.length > 0 ? this.STATE_CHAT : this.STATE_SELECT_MODE;
    this.render();
  },

  confirmImport() {
    const textarea = document.getElementById('importTextarea');
    const text = textarea?.value.trim();
    if (!text) {
      this._showToast('请输入人设内容');
      return;
    }
    DraftStorage.update(this.currentDraft.id, { sourceText: text });
    this.currentDraft.sourceText = text;
    this.currentState = this.STATE_CHAT;
    this.renderCurrentView();
    this.attachChatListeners();
    // 触发 AI 自动分析
    this._triggerImportAnalysis(text);
  },

  switchDraft(draftId) {
    const draft = this.drafts.find(d => d.id === draftId);
    if (draft) {
      this.currentDraft = draft;
      this.currentState = this.STATE_CHAT;
      this.render();
    }
  },

  closeDraft(draftId) {
    if (!confirm('确定关闭此草稿？')) return;
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

  removeWorldbookItem(index) {
    if (!this.currentDraft?.worldbookStash) return;
    this.currentDraft.worldbookStash.splice(index, 1);
    DraftStorage.update(this.currentDraft.id, {
      worldbookStash: this.currentDraft.worldbookStash
    });
    // 只更新世界书区域，不重渲染整页
    const content = document.getElementById('worldbookContent');
    if (content) content.innerHTML = this.renderWorldbookStash();
    const indicator = document.getElementById('stashCount');
    if (indicator) indicator.textContent = `世界书暂存 (${this.currentDraft.worldbookStash.length})`;
  },

  // ══════════════════════════════════════════
  // AI 对话核心
  // ══════════════════════════════════════════

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || this._isStreaming) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    this.currentDraft.messages.push(userMsg);
    DraftStorage.update(this.currentDraft.id, { messages: this.currentDraft.messages });
    input.value = '';

    // 追加用户消息到 DOM（不重渲染整个对话区）
    this._appendMessage(userMsg);
    this.scrollToBottom();

    // 调用 AI
    this.callAI();
  },

  async _triggerImportAnalysis(sourceText) {
    // 已有人设模式：AI 自动发第一条分析消息
    // 把原文作为第一条 user 消息注入，但不显示在界面上
    const hiddenMsg = {
      role: 'user',
      content: `以下是我的角色人设，请你以文学大师的视角进行分析：\n\n${sourceText}`,
    };
    await this.callAI([hiddenMsg]);
  },

  async callAI(extraMessages = []) {
    // 检查 API 配置
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      this._appendErrorMessage('未设置 API Key，请前往设置页面配置。');
      return;
    }
    const config = Storage.getApiConfig();
    if (!config.model) {
      this._appendErrorMessage('未选择模型，请前往设置页面选择模型。');
      return;
    }

    // 构建消息列表
    const systemPrompt = this.currentDraft.systemPrompt || this._buildDefaultSystemPrompt();
    const historyMessages = this.currentDraft.messages.map(m => ({
      role: m.role === 'error' ? 'assistant' : m.role,
      content: m.content,
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...extraMessages,
      ...historyMessages,
    ];

    const maxTokens = this.currentDraft.maxTokens || 4096;

    // 创建 AI 消息占位
    const aiMsgId = `msg_${Date.now()}`;
    const aiMsgEl = this._createStreamingMessageEl(aiMsgId);
    const messagesContainer = document.getElementById('chatMessages');

    // 移除空状态提示
    const emptyEl = messagesContainer?.querySelector('.card-chat-empty');
    if (emptyEl) emptyEl.remove();

    if (messagesContainer) messagesContainer.appendChild(aiMsgEl);
    this.scrollToBottom();

    // 切换发送按钮为停止
    this._setStreamingState(true);

    // 创建 AbortController
    this._abortController = new AbortController();
    let fullText = '';

    try {
      await AIClient.stream(
        messages,
        { max_tokens: maxTokens },
        // onChunk
        (delta, accumulated) => {
          fullText = accumulated;
          const contentEl = aiMsgEl.querySelector('.card-message-content');
          if (contentEl) {
            contentEl.innerHTML = this._renderMarkdownLite(accumulated) + '<span class="streaming-cursor">▋</span>';
          }
          this.scrollToBottom();
        },
        // onDone
        (finalText) => {
          fullText = finalText;
          const contentEl = aiMsgEl.querySelector('.card-message-content');
          if (contentEl) {
            contentEl.innerHTML = this._renderMarkdownLite(finalText);
          }
          // 保存到草稿
          const aiMsg = {
            id: aiMsgId,
            role: 'assistant',
            content: finalText,
            timestamp: Date.now(),
          };
          this.currentDraft.messages.push(aiMsg);
          DraftStorage.update(this.currentDraft.id, { messages: this.currentDraft.messages });
          this._setStreamingState(false);
        }
      );
    } catch (err) {
      // 用户主动停止不算错误
      if (err.name === 'AbortError') {
        const contentEl = aiMsgEl.querySelector('.card-message-content');
        if (contentEl) {
          // 保留已生成的内容，移除光标
          contentEl.innerHTML = this._renderMarkdownLite(fullText) +
            '<span class="streaming-stopped"> [已停止]</span>';
        }
        if (fullText) {
          const aiMsg = {
            id: aiMsgId,
            role: 'assistant',
            content: fullText + ' [已停止]',
            timestamp: Date.now(),
          };
          this.currentDraft.messages.push(aiMsg);
          DraftStorage.update(this.currentDraft.id, { messages: this.currentDraft.messages });
        } else {
          aiMsgEl.remove();
        }
      } else {
        aiMsgEl.remove();
        this._appendErrorMessage(`AI 调用失败：${err.message}`);
      }
      this._setStreamingState(false);
    }
  },

  stopStreaming() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  },

  // ══════════════════════════════════════════
  // DOM 操作辅助
  // ══════════════════════════════════════════

  _appendMessage(msg) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const emptyEl = container.querySelector('.card-chat-empty');
    if (emptyEl) emptyEl.remove();
    container.insertAdjacentHTML('beforeend', this.renderMessage(msg));
  },

    _appendErrorMessage(text) {
    const errMsg = {
      id: `err_${Date.now()}`,
      role: 'error',
      content: text,
      timestamp: Date.now(),
    };
    this._appendMessage(errMsg);
    this.scrollToBottom();
  },

  _createStreamingMessageEl(id) {
    const div = document.createElement('div');
    div.className = 'card-message card-message-ai';
    div.dataset.messageId = id;
    div.innerHTML = `<div class="card-message-content"><span class="streaming-cursor">▋</span></div>`;
    return div;
  },

  _setStreamingState(isStreaming) {
    this._isStreaming = isStreaming;
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    if (!sendBtn) return;

    if (isStreaming) {
      sendBtn.innerHTML = `<i class="ti ti-player-stop"></i> 停止`;
      sendBtn.classList.add('btn-stop');
      sendBtn.classList.remove('btn-primary');
      if (chatInput) chatInput.disabled = true;
    } else {
      sendBtn.innerHTML = `<i class="ti ti-send"></i> 发送`;
      sendBtn.classList.remove('btn-stop');
      sendBtn.classList.add('btn-primary');
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.focus();
      }
    }
  },

  scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  // ══════════════════════════════════════════
  // 工具函数
  // ══════════════════════════════════════════

  _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // 轻量 Markdown 渲染（支持加粗、斜体、代码块、换行）
  _renderMarkdownLite(text) {
    if (!text) return '';
    let html = this._escapeHtml(text);

    // 代码块 ```...```
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      return `<pre class="msg-code-block"><code>${code.trim()}</code></pre>`;
    });

    // 行内代码 `...`
    html = html.replace(/`([^`]+)`/g, '<code class="msg-code-inline">$1</code>');

    // 加粗 **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 斜体 *...*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 标题 ### / ## / #
    html = html.replace(/^### (.+)$/gm, '<h4 class="msg-heading">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="msg-heading">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="msg-heading">$1</h2>');

    // 无序列表 - item
    html = html.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul class="msg-list">$1</ul>');

    // 换行
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  _showToast(message, duration = 2500) {
    // 移除已有 toast
    const existing = document.getElementById('workshopToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'workshopToast';
    toast.className = 'workshop-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ─── 注册路由 ───
if (typeof Router !== 'undefined') {
  Router.register('/card', () => {
    setTimeout(() => CardWorkshop.init(), 0);
    return '';
  });
}
/* ═══ END: CardWorkshop ═══ */
