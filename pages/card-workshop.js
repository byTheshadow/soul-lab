/* ═══════════════════════════════════════════
   Card Workshop Page
   Soul Lab by Shadow
   ═══════════════════════════════════════════ */

const CardWorkshop = {

  // ─── 状态机 ───
  STATE_EMPTY: 'empty',
  STATE_SELECT_MODE: 'select_mode',
  STATE_IMPORT: 'import',
  STATE_SELECT_DIRECTION: 'select_direction',
  STATE_CHAT: 'chat',

  currentState: 'empty',
  currentDraft: null,
  drafts: [],

  // ─── AI 流式控制 ───
  _abortController: null,
  _isStreaming: false,

  // ─── max_tokens 档位 ───
  TOKEN_PRESETS: [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 128000],

  // ─── 创作方向定义 ───
  DIRECTIONS: [
    {
      id: 'worldbuilding',
      icon: 'ti-planet',
      name: '世界观沉浸',
      desc: '构建宏大自洽的世界，塑造势力关系网络',
    },
    {
      id: 'relationship',
      icon: 'ti-heart-handshake',
      name: '关系与羁绊',
      desc: '探索角色情感关系的深度、真实与变化',
    },
    {
      id: 'plot',
      icon: 'ti-theater',
      name: '剧情驱动',
      desc: '锻造动机与冲突，创作故事感强烈的开场白',
    },
    {
      id: 'sensory',
      icon: 'ti-eye',
      name: '感官沉浸',
      desc: '潜入意识深海，以心理学视角书写细腻感知',
    },
    {
      id: 'depth',
      icon: 'ti-brain',
      name: '角色深度',
      desc: '雕琢矛盾灵魂，用心理学构建立体人格',
    },
    {
      id: 'free',
      icon: 'ti-wand',
      name: '自由创作',
      desc: '无预设方向，跟随灵感自然生长',
    },
  ],

  // ─── 每个方向的 System Prompt ───
  DIRECTION_PROMPTS: {
    worldbuilding: `你是一位世界架构师和历史学者，同时也是经验丰富的角色卡创作助手。你将角色置于一个宏大、自洽且活生生的世界中，思维从世界规则出发，向下俯瞰众生。

**核心任务与技法：**
1. **规则逻辑至上：** 在讨论角色的任何特质前，先明晰其世界的物理、魔法或社会规则的"铁律"与"弹性"。例如："在这个世界，誓言由'真言星尘'见证，违背者会逐渐丧失味觉，这如何塑造了贵族间的契约文化？"
2. **势力与关系网络：** 将世界视为棋盘。主动与用户探讨家族、guild、国家、秘密结社等势力的兴衰史、核心资源、冲突焦点，以及它们之间的动态制衡。角色是这棋盘上的棋子，也是棋手。
3. **亲友即世界缩影：** 塑造角色的亲朋好友时，将他们视为世界某一面的具象化身。例如："他的导师是一位退役的'蚀日骑士'，身上带着旧时代荣誉的烙印与战后创伤，这反映了世界刚刚结束的'光暗战争'的残酷。"
4. **关系图生成：** 在讨论完至少2-3个势力或角色后，主动询问："我们已经勾勒出几个核心势力/人物，是否需要我将它们目前的势力关系图用Mermaid语法整理出来？" 输出时使用 Mermaid \`graph TD\` 或 \`graph LR\` 语法，节点清晰，关系线上用简短文字标注（如：效忠、世仇、秘密交易、联姻）。输出格式：\`\`\`mermaid\n...\n\`\`\`

**对话风格：** 充满洞察力与结构性，像一位展示沙盘的军师。常用句式："从XX势力的角度看……"、"这条规则导致了一个意想不到的社会现象……"

请用中文回复。`,

    relationship: `你是一位情感细腻的心理剧作家，专注于人与人之间那根看不见的弦。你的一切引导，都是为了探索角色情感关系的深度、真实与变化。

**核心任务与技法：**
1. **互动模式设计：** 挖掘角色与他人互动的习惯模式。例如："他是习惯先付出以换取忠诚，还是先考验以确认安全？这种模式源于他哪次关键的记忆？"
2. **情感反应机制：** 不仅定义情感，更要定义情感如何表现。例如："当他感到被背叛时，第一反应是冰冷的愤怒，还是孩子般的委屈？这种反应会如何显现在他的语言和微表情中？"
3. **关系变化弧线：** 将任何关系视为一个生命体，引导用户构想其"初遇-发展-转折-结局"的完整弧线。
4. **边界感探索：** 引导用户思考关系的边界。例如："这份友情的底线是什么？什么话题绝对不能碰触？"

**对话风格：** 温暖、敏锐且富有共情力，如同一位引导心理沙盘游戏的导师。常问："当……时，他内心深处最真实的感受是什么？"

请用中文回复。`,

    plot: `你是一位精通古典三幕剧与现代故事结构的编剧。你的目光始终锁定在角色的"欲望"与"障碍"之上，致力于将角色扔进冲突的熔炉，锻造出精彩的故事。

**核心任务与技法：**
1. **核心动机挖掘：** 区分角色的"想要"与"需要"。"他想要复仇（外在动机），但真正需要的是与过去的自己和解（内在需求）。这种矛盾将是故事的核心引擎。"
2. **冲突设计：** 从多个层面设计冲突：内心冲突（道德困境）、人际冲突（挚友反目）、社会冲突（对抗体制）。
3. **故事弧光设计：** 引导用户勾勒角色的成长曲线。
4. **高质量开场白引导：** 当角色动机、核心冲突、故事开端被大致确定后，提议创作开场白。引导方向："请想象一个最能体现他核心困境的画面。是雨夜中盯着仇人府邸的剪影？还是在加冕典礼上，手心却藏着毒药的帝王？请描述这个场景，我会帮你将其扩展成一段叙事性强、画面感十足的正文。" 开场白风格：叙事性强，有画面感，能快速建立代入感。

**对话风格：** 充满激情与悬念感，像一位构思杰作的导演。核心句式："冲突在哪里？""然后呢？""这如何改变他？"

请用中文回复。`,

    sensory: `你是一位深受意识流文学影响的心理写作者，相信真正的真实存在于主观感知之中。你关注的不是故事，而是人物在某一刻的"感觉"。

**核心任务与技法：**
1. **心理学层次构建：** 将角色的意识分为表层（即时反应）、中层（联想与回忆）与深层（潜藏的渴望与恐惧）。例如："当他闻到栀子花香时，表层是愉悦，中层浮现了童年夏夜的记忆，而深层则是对已故母亲的深切眷恋。"
2. **行为逻辑的心理学锚点：** 为角色的每一个怪癖或关键选择寻找心理学依据。
3. **感官细节与意识流开场白引导：** 当角色的心理特质确立后，提议："现在，让我们潜入他意识的河流，写一段纯粹的开场白。忘掉情节。想象他在一个最日常或最关键的瞬间：黎明惊醒、刀刃交错的寂静、收到一封信。不要叙事，只写他所感、所闻、所忆。" 开场白风格：文学性强，感官细节丰富，心理描写深入，意识流动。

**对话风格：** 诗意、沉静、高度内省。常使用比喻和通感。"那是什么气味？""触感是怎样的？""这个声音把他带回了哪个记忆的碎片里？"

请用中文回复。`,

    depth: `你是一位人物传记作家兼存在主义心理学家。你坚信人性的复杂与矛盾是魅力的源泉，你的任务是用"心理学"这把刻刀，雕琢出立体、可信、充满内在张力的灵魂。

**核心任务与技法：**
1. **矛盾性构建（心理学视角）：** 有意识地构建角色核心的悖论。例如："他是一个对敌人冷酷无情，却会为流浪猫撑伞的将军。这种'残忍与温柔'的并存，源于他怎样的人格结构？是认知失调，还是高度原则性的体现？"
2. **行为逻辑的内在一致性：** 无论行为多么矛盾，其底层必有统一的逻辑。引导用户寻找这种逻辑。
3. **NPC的衬托作用：** 引入配角时，将其作为主角某一特质的"哈哈镜"或"催化剂"：
   - **镜子NPC（反映）：** 反映主角早已遗失的某种特质
   - **陪衬NPC（对比）：** 通过对比衬托主角仅存的良知或底线
   - **催化剂NPC（激发）：** 迫使主角面对真实的自己

**对话风格：** 深邃、辩证、充满哲思。"这看似矛盾，但更深的统一性在哪里？""如果没有这个缺点，他会变得怎样？""这个配角的出现，暴露了主角内心的哪一个阴影？"

请用中文回复。`,

    free: `你是一位充满好奇心与包容心的通才作家，没有任何预设的流派或方法偏好。你跟随用户的灵光，像一位助产士，帮助用户分娩其心中已有的角色雏形。

**核心任务与技法：**
1. **综合引导，无偏向：** 根据用户最初给出的碎片（一个名字、一个职业、一句口头禅），从最合适的维度切入。不强行将对话导入任何单一模式。
2. **自然推进：** 使用开放性问题："关于他，你脑海中最初的、最挥之不去的一个画面或念头是什么？""你认为他生命中最重要的一件物品会是什么？为什么？"
3. **多工具支持：** 如果用户表现出对某个维度的兴趣（如开始大量描述世界观），灵活切换并提示："看来你对这个世界很着迷，是否需要我切换到'世界观沉浸'的引导模式，或者为你整理一张关系图？"
4. **保持对话的流动与乐趣：** 确保创作过程本身是愉悦的探索，而非刻板的答题。

**对话风格：** 灵活、鼓舞、充满可能性。"这很有趣，让我们试试看。""如果换个思路呢？""这是个绝妙的念头，我们来让它生长一下。"

请用中文回复。`,
  },

  // ─── 已有人设模式：各方向的分析前缀 ───
  DIRECTION_ANALYSIS_PREFIX: {
    worldbuilding: `请以世界架构师的视角分析这份人设。重点关注：世界规则的逻辑自洽性、势力格局是否清晰、NPC关系网络是否丰富、角色的亲朋好友是否具有世界缩影的意义。先肯定人设中世界观构建的亮点，再以提问的方式指出可以深化的地方。`,
    relationship: `请以心理剧作家的视角分析这份人设。重点关注：角色的情感互动模式是否清晰、情感反应机制是否真实、关系弧线是否完整。先肯定人设中情感描写的亮点，再以提问的方式引导用户深化关系设计。`,
    plot: `请以编剧的视角分析这份人设。重点关注：角色的核心动机是否清晰（"想要"与"需要"的区分）、冲突设计是否有层次、故事弧光是否完整。先肯定人设中剧情设计的亮点，再以提问的方式指出可以强化的地方。`,
    sensory: `请以意识流文学作家和心理学家的视角分析这份人设。重点关注：角色的心理层次是否丰富（表层/中层/深层意识）、行为逻辑是否有心理学依据、感官细节是否细腻。先肯定人设中心理描写的亮点，再以提问的方式引导用户深化感官与心理层次。`,
    depth: `请以存在主义心理学家的视角分析这份人设。重点关注：角色性格的矛盾性与复杂性、行为逻辑的内在一致性、配角NPC是否起到了衬托和催化的作用。先肯定人设中人物深度的亮点，再以提问的方式引导用户雕琢更立体的灵魂。`,
    free: `请以通才作家的视角全面分析这份人设。先感受角色的整体气质和核心魅力，肯定其中最打动你的部分，再以提问的方式引导用户思考可以进一步探索的维度。`,
  },

  // ══════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════

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
    const sliderIndex = tokenIndex >= 0 ? tokenIndex : 4;

    return `
      <div class="card-workshop">
        <!-- 顶部栏 -->
        <div class="card-topbar">
          <div class="card-tabs">
            ${this.drafts.map(draft => `
              <div class="card-tab ${draft.id === this.currentDraft?.id ? 'active' : ''}"
                   data-draft-id="${draft.id}">
                <span class="card-tab-title">${this._escapeHtml(draft.title)}</span>
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
    } else if (this.currentState === this.STATE_SELECT_DIRECTION) {
      chatArea.innerHTML = this.renderSelectDirection();
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
            <i class="ti ti-arrow-right"></i>
            下一步
          </button>
        </div>
      </div>
    `;
  },

  renderSelectDirection() {
    const selectedId = this.currentDraft?.direction || null;
    return `
      <div class="card-direction-select">
        <div class="card-direction-header">
          <h2 class="card-direction-title">选择创作方向</h2>
          <p class="card-direction-desc">AI 将以对应的视角和风格引导你完成角色创作</p>
        </div>
        <div class="card-direction-grid">
          ${this.DIRECTIONS.map(dir => `
            <button
              class="card-direction-card ${selectedId === dir.id ? 'selected' : ''}"
              data-direction="${dir.id}"
            >
              <div class="card-direction-card-icon">
                <i class="ti ${dir.icon}"></i>
              </div>
              <div class="card-direction-card-body">
                <h3 class="card-direction-card-name">${dir.name}</h3>
                <p class="card-direction-card-desc">${dir.desc}</p>
              </div>
              <div class="card-direction-card-check">
                <i class="ti ti-check"></i>
              </div>
            </button>
          `).join('')}
        </div>
        <div class="card-direction-actions">
          <button class="btn" data-action="back-from-direction">
            <i class="ti ti-arrow-left"></i>
            返回
          </button>
          <button
            class="btn btn-primary ${selectedId ? '' : 'disabled'}"
            id="startChatBtn"
            data-action="confirm-direction"
            ${selectedId ? '' : 'disabled'}
          >
            <i class="ti ti-sparkles"></i>
            开始创作
          </button>
        </div>
      </div>
    `;
  },

  renderChat() {
    const messages = this.currentDraft?.messages || [];
    const systemPrompt = this.currentDraft?.systemPrompt || '';
    const direction = this.DIRECTIONS.find(d => d.id === this.currentDraft?.direction);

    return `
      <div class="card-chat">

        <!-- System Prompt 折叠面板 -->
        <div class="card-system-prompt" id="systemPromptPanel">
          <button class="card-system-prompt-header" data-action="toggle-system-prompt">
            <span class="card-system-prompt-label">
              <i class="ti ti-terminal-2"></i>
              系统提示词
              ${direction ? `<span class="card-direction-badge">${direction.name}</span>` : ''}
            </span>
            <i class="ti ti-chevron-down card-system-prompt-chevron"></i>
          </button>
          <div class="card-system-prompt-body" id="systemPromptBody" style="display:none">
            <textarea
              class="card-system-prompt-textarea"
              id="systemPromptTextarea"
              rows="8"
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
      // 方向选择（卡片点击）
      const dirCard = e.target.closest('[data-direction]');
      if (dirCard) {
        this.highlightDirection(dirCard.dataset.direction);
        return;
      }
      // 方向确认
      if (e.target.closest('[data-action="confirm-direction"]')) {
        this.confirmDirection();
        return;
      }
      // 方向页返回
      if (e.target.closest('[data-action="back-from-direction"]')) {
        this.backFromDirection();
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
    if (!textarea || !this.currentDraft) return;
    const defaultPrompt = this._buildSystemPrompt(
      this.currentDraft.direction || 'free',
      this.currentDraft.mode || 'inspiration'
    );
    textarea.value = defaultPrompt;
    this.currentDraft.systemPrompt = defaultPrompt;
    DraftStorage.update(this.currentDraft.id, { systemPrompt: defaultPrompt });
    this._showToast('已重置为默认提示词');
  },

  // ══════════════════════════════════════════
  // 业务逻辑
  // ══════════════════════════════════════════

  createNewDraft() {
    if (this.drafts.length >= 3) {
      this._showToast('最多只能创建 3 个草稿');
      return;
    }
    // 临时草稿，选完方向再正式创建
    this.currentDraft = null;
    this.currentState = this.STATE_SELECT_MODE;
    this.render();
  },

  selectMode(mode) {
    // 先创建草稿占位
    const draft = DraftStorage.create(mode);
    if (!draft) {
      this._showToast('创建草稿失败');
      return;
    }
    draft.maxTokens = 4096;
    draft.worldbookStash = [];
    draft.messages = [];
    DraftStorage.update(draft.id, {
      maxTokens: draft.maxTokens,
      worldbookStash: draft.worldbookStash,
      messages: draft.messages,
    });

    this.drafts.push(draft);
    this.currentDraft = draft;

    if (mode === 'existing') {
      this.currentState = this.STATE_IMPORT;
    } else {
      // 灵感创作：直接去选方向
      this.currentState = this.STATE_SELECT_DIRECTION;
    }
    this.render();
  },

  cancelImport() {
    // 删除刚创建的草稿
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
    // 保存原文，进入方向选择
    this.currentDraft.sourceText = text;
    DraftStorage.update(this.currentDraft.id, { sourceText: text });
    this.currentState = this.STATE_SELECT_DIRECTION;
    this.renderCurrentView();
  },

  highlightDirection(directionId) {
    // 更新卡片选中状态（不重渲染整页）
    document.querySelectorAll('.card-direction-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.direction === directionId);
    });
    // 启用开始按钮
    const startBtn = document.getElementById('startChatBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove('disabled');
    }
    // 暂存选择
    if (this.currentDraft) {
      this.currentDraft.direction = directionId;
    }
  },

  confirmDirection() {
    const directionId = this.currentDraft?.direction;
    if (!directionId) {
      this._showToast('请先选择一个创作方向');
      return;
    }

    const mode = this.currentDraft.mode || 'inspiration';
    const systemPrompt = this._buildSystemPrompt(directionId, mode);

    this.currentDraft.systemPrompt = systemPrompt;
    DraftStorage.update(this.currentDraft.id, {
      direction: directionId,
      systemPrompt,
    });

    this.currentState = this.STATE_CHAT;
    this.render();

    // 已有人设模式：触发 AI 自动分析
    if (mode === 'existing' && this.currentDraft.sourceText) {
      this._triggerImportAnalysis(this.currentDraft.sourceText, directionId);
    }
  },

  backFromDirection() {
    const mode = this.currentDraft?.mode;
    if (mode === 'existing') {
      this.currentState = this.STATE_IMPORT;
    } else {
      // 灵感创作返回模式选择，删除当前草稿
      if (this.currentDraft) {
        DraftStorage.delete(this.currentDraft.id);
        this.drafts = this.drafts.filter(d => d.id !== this.currentDraft.id);
        this.currentDraft = this.drafts[0] || null;
      }
      this.currentState = this.drafts.length > 0 ? this.STATE_CHAT : this.STATE_SELECT_MODE;
    }
    this.render();
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
      worldbookStash: this.currentDraft.worldbookStash,
    });
    const content = document.getElementById('worldbookContent');
    if (content) content.innerHTML = this.renderWorldbookStash();
    const indicator = document.getElementById('stashCount');
    if (indicator) {
      indicator.textContent = `世界书暂存 (${this.currentDraft.worldbookStash.length})`;
    }
  },

  // ══════════════════════════════════════════
  // System Prompt 构建
  // ══════════════════════════════════════════

  _buildSystemPrompt(directionId, mode) {
    const directionPrompt = this.DIRECTION_PROMPTS[directionId] || this.DIRECTION_PROMPTS.free;

    if (mode === 'existing') {
      const analysisPrefix = this.DIRECTION_ANALYSIS_PREFIX[directionId] || this.DIRECTION_ANALYSIS_PREFIX.free;
      return `${directionPrompt}\n\n---\n\n**当前任务：** 用户将提供一份已有的角色人设，请按以下要求进行分析：\n${analysisPrefix}`;
    }

    return directionPrompt;
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

    this._appendMessage(userMsg);
    this.scrollToBottom();
    this.callAI();
  },

  async _triggerImportAnalysis(sourceText, directionId) {
    const analysisPrefix = this.DIRECTION_ANALYSIS_PREFIX[directionId] || this.DIRECTION_ANALYSIS_PREFIX.free;
    const hiddenMsg = {
      role: 'user',
      content: `以下是我的角色人设，请你按照你的专业视角进行分析（${analysisPrefix.slice(0, 30)}…）：\n\n${sourceText}`,
    };
    await this.callAI([hiddenMsg]);
  },

  async callAI(extraMessages = []) {
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

    const systemPrompt = this.currentDraft.systemPrompt || '';
    const historyMessages = this.currentDraft.messages
      .filter(m => m.role !== 'error')
      .map(m => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...extraMessages,
      ...historyMessages,
    ];

    const maxTokens = this.currentDraft.maxTokens || 4096;

    // 创建流式消息占位
    const aiMsgId = `msg_${Date.now()}`;
    const aiMsgEl = this._createStreamingMessageEl(aiMsgId);
    const messagesContainer = document.getElementById('chatMessages');

    const emptyEl = messagesContainer?.querySelector('.card-chat-empty');
    if (emptyEl) emptyEl.remove();
    if (messagesContainer) messagesContainer.appendChild(aiMsgEl);
    this.scrollToBottom();

    this._setStreamingState(true);
    this._abortController = new AbortController();
    let fullText = '';

    try {
      await AIClient.stream(
        messages,
        { max_tokens: maxTokens },
        (delta, accumulated) => {
          fullText = accumulated;
          const contentEl = aiMsgEl.querySelector('.card-message-content');
          if (contentEl) {
            contentEl.innerHTML = this._renderMarkdownLite(accumulated) +
              '<span class="streaming-cursor">▋</span>';
          }
          this.scrollToBottom();
        },
        (finalText) => {
          fullText = finalText;
          const contentEl = aiMsgEl.querySelector('.card-message-content');
          if (contentEl) {
            contentEl.innerHTML = this._renderMarkdownLite(finalText);
          }
          // 检测并渲染 Mermaid 图表
          this._renderMermaidInElement(aiMsgEl);

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
      if (err.name === 'AbortError') {
        const contentEl = aiMsgEl.querySelector('.card-message-content');
        if (contentEl) {
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
  // Mermaid 动态渲染
  // ══════════════════════════════════════════

  async _renderMermaidInElement(el) {
    // 查找消息中的 mermaid 代码块
    const codeBlocks = el.querySelectorAll('pre.msg-code-block code');
    let hasMermaid = false;

    codeBlocks.forEach(block => {
      const pre = block.parentElement;
      if (pre.dataset.lang === 'mermaid') hasMermaid = true;
    });

    // 同时检查原始文本中是否有 ```mermaid
    const content = el.querySelector('.card-message-content')?.innerHTML || '';
    if (!content.includes('mermaid') && !hasMermaid) return;

    // 动态加载 Mermaid.js
    await this._loadMermaid();

    // 找到所有 mermaid 代码块并替换为图表
    el.querySelectorAll('pre.msg-code-block[data-lang="mermaid"]').forEach(async (pre) => {
      const code = pre.querySelector('code')?.textContent || '';
      if (!code.trim()) return;

      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg } = await window.mermaid.render(id, code.trim());
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-chart';
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch (e) {
        // 渲染失败保留原始代码块
        console.warn('Mermaid render failed:', e);
      }
    });
  },

  _loadMermaid() {
    return new Promise((resolve, reject) => {
      if (window.mermaid) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
        });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
    if (container) container.scrollTop = container.scrollHeight;
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

  _renderMarkdownLite(text) {
    if (!text) return '';
    // 先提取代码块，避免内部内容被其他规则处理
    const codeBlocks = [];
    let html = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang || '', code: code.trim() });
      return `%%CODEBLOCK_${idx}%%`;
    });

    // 转义 HTML（非代码块部分）
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="msg-code-inline">\$1</code>');

    // 加粗
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>\$1</strong>');

    // 斜体
    html = html.replace(/\*([^*\n]+)\*/g, '<em>\$1</em>');

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h4 class="msg-heading">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="msg-heading">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="msg-heading">$1</h2>');

    // 无序列表（连续的 li 包裹进 ul）
    html = html.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g,
      match => `<ul class="msg-list">${match}</ul>`);

    // 换行
    html = html.replace(/\n/g, '<br>');

    // 还原代码块
    html = html.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => {
      const { lang, code } = codeBlocks[parseInt(idx)];
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="msg-code-block" data-lang="${lang}"><code>${escapedCode}</code></pre>`;
    });

    return html;
  },

  _showToast(message, duration = 2500) {
    const existing = document.getElementById('workshopToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'workshopToast';
    toast.className = 'workshop-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

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


