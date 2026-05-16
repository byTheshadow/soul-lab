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

  // ─── 划词工具条 ───
  _selectionToolbar: null,
  _selectionToolbarHandler: null,
  _selectionTouchTimer: null,

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
      // 进入对话状态时挂载划词工具条
      this._mountSelectionToolbar();
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
          <button class="btn" onclick="CardWorkshop.backToModeSelect()">
            <i class="ti ti-arrow-left"></i>
            返回
          </button>
          <button
            class="btn btn-primary ${!selectedId ? 'disabled' : ''}"
            id="startChatBtn"
            onclick="CardWorkshop.startChat()"
            ${!selectedId ? 'disabled' : ''}
          >
            <i class="ti ti-sparkles"></i>
            开始创作
          </button>
        </div>
      </div>
    `;
  },

  renderChat() {
    const draft = this.currentDraft;
    const directionName = this.DIRECTIONS.find(d => d.id === draft.direction)?.name || '';
    const isOpen = draft._systemPromptOpen || false;

    return `
      <div class="card-chat">
        <!-- System Prompt 折叠面板 -->
        <div class="card-system-prompt">
          <button class="card-system-prompt-header" data-action="toggle-system-prompt">
            <div class="card-system-prompt-label">
              <i class="ti ti-settings"></i>
              <span>系统提示词</span>
              ${directionName ? `<span class="card-direction-badge">${directionName}</span>` : ''}
            </div>
            <i class="ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} card-system-prompt-chevron"></i>
          </button>
          ${isOpen ? `
            <div class="card-system-prompt-body">
              <textarea
                class="card-system-prompt-textarea"
                id="systemPromptTextarea"
                rows="8"
              >${this._escapeHtml(draft.systemPrompt || '')}</textarea>
              <div class="card-system-prompt-actions">
                <button class="btn btn-sm" onclick="CardWorkshop.resetSystemPrompt()">
                  <i class="ti ti-refresh"></i>
                  重置
                </button>
                <button class="btn btn-sm btn-primary" onclick="CardWorkshop.saveSystemPrompt()">
                  <i class="ti ti-check"></i>
                  保存
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 消息列表 -->
        <div class="card-chat-messages" id="messageList">
          ${draft.messages.length === 0 ? `
            <div class="card-chat-empty">
              <i class="ti ti-message-circle"></i>
              <p>开始你的创作对话</p>
            </div>
          ` : draft.messages.map(msg => this._renderMessageHtml(msg)).join('')}
        </div>

        <!-- 输入区 -->
        <div class="card-chat-input">
          <textarea
            class="card-input-textarea"
            id="chatInput"
            placeholder="输入消息，Shift+Enter 换行，Enter 发送"
            rows="3"
            ${this._isStreaming ? 'disabled' : ''}
          ></textarea>
          ${this._isStreaming ? `
            <button class="btn btn-stop" onclick="CardWorkshop.stopStreaming()">
              <i class="ti ti-player-stop"></i>
              停止
            </button>
          ` : `
            <button class="btn btn-primary" id="sendBtn">
              <i class="ti ti-send"></i>
              发送
            </button>
          `}
        </div>
      </div>
    `;
  },

  // ══════════════════════════════════════════
  // 事件绑定
  // ══════════════════════════════════════════

  attachEventListeners() {
    const app = document.getElementById('app');
    if (!app) return;

    // 事件委托：顶部栏 + 侧边栏
    app.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const draftId = e.target.closest('[data-draft-id]')?.dataset.draftId;
      const mode = e.target.closest('[data-mode]')?.dataset.mode;
      const direction = e.target.closest('[data-direction]')?.dataset.direction;

      // 草稿标签切换
      if (draftId && !action) {
        this.switchDraft(draftId);
        return;
      }

      switch (action) {
        case 'close-tab': {
          const tabEl = e.target.closest('[data-draft-id]');
          if (tabEl) this.closeDraft(tabEl.dataset.draftId);
          break;
        }
        case 'new-draft':
          this.createNewDraft();
          break;
        case 'toggle-shortcuts':
          document.getElementById('shortcutPanel')?.classList.toggle('collapsed');
          break;
        case 'toggle-worldbook':
          document.getElementById('worldbookPanel')?.classList.toggle('collapsed');
          break;
        case 'toggle-system-prompt':
          this._toggleSystemPrompt();
          break;
      }

      // 模式选择
      if (mode) {
        this.selectMode(mode);
        return;
      }

      // 方向选择
      if (direction) {
        this.selectDirection(direction);
        return;
      }
    });

    // 世界书暂存：删除条目
    app.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.worldbook-stash-remove');
      if (removeBtn) {
        const idx = parseInt(removeBtn.dataset.index, 10);
        this.removeWorldbookItem(idx);
      }
    });

    // max_tokens 滑块
    app.addEventListener('input', (e) => {
      if (e.target.id === 'tokenSlider') {
        const idx = parseInt(e.target.value, 10);
        const val = this.TOKEN_PRESETS[idx];
        const display = document.getElementById('tokenDisplay');
        if (display) display.textContent = val.toLocaleString();
        if (this.currentDraft) {
          DraftStorage.update(this.currentDraft.id, { maxTokens: val });
          this.currentDraft.maxTokens = val;
        }
      }
    });
  },

  attachChatListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    if (!sendBtn || !chatInput) return;

    sendBtn.addEventListener('click', () => this.sendMessage());

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 自动撑高输入框
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
    });
  },

  // ══════════════════════════════════════════
  // 划词工具条
  // ══════════════════════════════════════════

  _mountSelectionToolbar() {
    // 避免重复挂载
    this._unmountSelectionToolbar();

    // 创建工具条 DOM（挂在 body 上，避免被 overflow:hidden 裁剪）
    const toolbar = document.createElement('div');
    toolbar.className = 'selection-toolbar';
    toolbar.id = 'selectionToolbar';
    toolbar.innerHTML = `
      <button class="selection-toolbar-btn" id="stashBtn">
        <i class="ti ti-bookmark-plus"></i>
        <span>标记到世界书</span>
      </button>
      <div class="selection-toolbar-divider"></div>
      <button class="selection-toolbar-btn" id="askBtn">
        <i class="ti ti-message-forward"></i>
        <span>追问</span>
      </button>
    `;
    document.body.appendChild(toolbar);
    this._selectionToolbar = toolbar;

    // 绑定工具条按钮
    toolbar.querySelector('#stashBtn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._handleStashSelection();
    });
    toolbar.querySelector('#askBtn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._handleAskSelection();
    });

    // 阻止工具条自身的 mousedown 清除选区
    toolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // PC 端：监听 mouseup
    this._selectionToolbarHandler = (e) => {
      // 如果点击的是工具条本身，不处理
      if (toolbar.contains(e.target)) return;
      this._onSelectionChange(e);
    };
    document.addEventListener('mouseup', this._selectionToolbarHandler);

    // 移动端：监听 selectionchange（touchend 后触发）
    this._selectionChangeHandler = () => {
      // 用 setTimeout 等选区稳定
      clearTimeout(this._selectionTouchTimer);
      this._selectionTouchTimer = setTimeout(() => {
        this._onSelectionChange(null);
      }, 200);
    };
    document.addEventListener('selectionchange', this._selectionChangeHandler);

    // 点击空白处隐藏工具条
    this._hideToolbarHandler = (e) => {
      if (!toolbar.contains(e.target)) {
        this._hideSelectionToolbar();
      }
    };
    document.addEventListener('mousedown', this._hideToolbarHandler);
    document.addEventListener('touchstart', this._hideToolbarHandler, { passive: true });
  },

  _unmountSelectionToolbar() {
    if (this._selectionToolbar) {
      this._selectionToolbar.remove();
      this._selectionToolbar = null;
    }
    if (this._selectionToolbarHandler) {
      document.removeEventListener('mouseup', this._selectionToolbarHandler);
      this._selectionToolbarHandler = null;
    }
    if (this._selectionChangeHandler) {
      document.removeEventListener('selectionchange', this._selectionChangeHandler);
      this._selectionChangeHandler = null;
    }
    if (this._hideToolbarHandler) {
      document.removeEventListener('mousedown', this._hideToolbarHandler);
      document.removeEventListener('touchstart', this._hideToolbarHandler);
      this._hideToolbarHandler = null;
    }
    clearTimeout(this._selectionTouchTimer);
  },

  _onSelectionChange(e) {
    // 流式输出中禁用
    if (this._isStreaming) {
      this._hideSelectionToolbar();
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    // 没有选中文字，隐藏
    if (!selectedText) {
      this._hideSelectionToolbar();
      return;
    }

    // 检查选区是否在 .card-chat-messages 内
    const messageList = document.getElementById('messageList');
    if (!messageList) {
      this._hideSelectionToolbar();
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!messageList.contains(anchorNode)) {
      this._hideSelectionToolbar();
      return;
    }

    // 计算工具条位置
    this._positionAndShowToolbar(selection);
  },

  _positionAndShowToolbar(selection) {
    const toolbar = this._selectionToolbar;
    if (!toolbar) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 工具条尺寸（先显示再测量，或用估算值）
    const toolbarHeight = 44;
    const toolbarWidth = 240; // 估算值，实际会自适应
    const gap = 8;
    const arrowSize = 5;

    let top, left;
    let below = false;

    // 默认出现在选区上方
    top = rect.top - toolbarHeight - arrowSize - gap;

    // 如果上方空间不足，改为出现在选区下方
    if (top < 8) {
      top = rect.bottom + arrowSize + gap;
      below = true;
    }

    // 水平居中对齐选区
    left = rect.left + rect.width / 2 - toolbarWidth / 2;

    // 边界检测：不超出屏幕左右
    const viewportWidth = window.innerWidth;
    if (left < 8) left = 8;
    if (left + toolbarWidth > viewportWidth - 8) {
      left = viewportWidth - toolbarWidth - 8;
    }

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
    toolbar.classList.toggle('toolbar-below', below);
    toolbar.classList.add('visible');
  },

  _hideSelectionToolbar() {
    this._selectionToolbar?.classList.remove('visible');
  },

  // 标记到世界书
  _handleStashSelection() {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText || !this.currentDraft) return;

    const stash = this.currentDraft.worldbookStash || [];
    stash.push({ text: selectedText });
    DraftStorage.update(this.currentDraft.id, { worldbookStash: stash });
    this.currentDraft.worldbookStash = stash;

    // 更新右侧面板
    this._refreshWorldbookPanel();

    // 更新顶部计数
    const stashCountEl = document.getElementById('stashCount');
    if (stashCountEl) stashCountEl.textContent = `世界书暂存 (${stash.length})`;

    // 清除选区并隐藏工具条
    window.getSelection()?.removeAllRanges();
    this._hideSelectionToolbar();

    this._showToast('已标记到世界书暂存');
  },

  // 追问选中内容
  _handleAskSelection() {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) return;

    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const prompt = `关于"${selectedText}"，请进一步说明：`;
    chatInput.value = prompt;
    chatInput.focus();

    // 光标定位到末尾
    chatInput.setSelectionRange(prompt.length, prompt.length);

    // 触发 input 事件以自动撑高
    chatInput.dispatchEvent(new Event('input'));

    // 清除选区并隐藏工具条
    window.getSelection()?.removeAllRanges();
    this._hideSelectionToolbar();
  },

  // 刷新世界书暂存面板
  _refreshWorldbookPanel() {
    const content = document.getElementById('worldbookContent');
    if (content) {
      content.innerHTML = this.renderWorldbookStash();
    }
  },

  // 删除世界书条目
  removeWorldbookItem(idx) {
    if (!this.currentDraft) return;
    const stash = [...(this.currentDraft.worldbookStash || [])];
    stash.splice(idx, 1);
    DraftStorage.update(this.currentDraft.id, { worldbookStash: stash });
    this.currentDraft.worldbookStash = stash;

    this._refreshWorldbookPanel();

    const stashCountEl = document.getElementById('stashCount');
    if (stashCountEl) stashCountEl.textContent = `世界书暂存 (${stash.length})`;
  },

  // ══════════════════════════════════════════
  // 状态机操作
  // ══════════════════════════════════════════

  createNewDraft() {
    if (this.drafts.length >= 3) {
      this._showToast('最多同时创建 3 个草稿');
      return;
    }
    const draft = DraftStorage.create('inspiration');
    this.drafts = DraftStorage.getAll();
    this.currentDraft = draft;
    this.currentState = this.STATE_SELECT_MODE;
    this.render();
  },

  switchDraft(id) {
    const draft = this.drafts.find(d => d.id === id);
    if (!draft || draft.id === this.currentDraft?.id) return;
    this.currentDraft = draft;
    this.currentState = draft.messages?.length > 0 ? this.STATE_CHAT : this.STATE_SELECT_MODE;
    this.render();
  },

  closeDraft(id) {
    DraftStorage.delete(id);
    this.drafts = DraftStorage.getAll();
    if (this.drafts.length === 0) {
      this.currentDraft = null;
      this.currentState = this.STATE_EMPTY;
      this._unmountSelectionToolbar();
      this.render();
    } else {
      if (this.currentDraft?.id === id) {
        this.currentDraft = this.drafts[0];
        this.currentState = this.currentDraft.messages?.length > 0
          ? this.STATE_CHAT
          : this.STATE_SELECT_MODE;
      }
      this.render();
    }
  },

  selectMode(mode) {
    if (!this.currentDraft) return;
    DraftStorage.update(this.currentDraft.id, { mode });
    this.currentDraft.mode = mode;
    if (mode === 'existing') {
      this.currentState = this.STATE_IMPORT;
    } else {
      this.currentState = this.STATE_SELECT_DIRECTION;
    }
    this.renderCurrentView();
  },

  cancelImport() {
    // 删除当前空草稿，返回空状态或上一个草稿
    const id = this.currentDraft?.id;
    if (id) DraftStorage.delete(id);
    this.drafts = DraftStorage.getAll();
    if (this.drafts.length === 0) {
      this.currentDraft = null;
      this.currentState = this.STATE_EMPTY;
      this._unmountSelectionToolbar();
      this.render();
    } else {
      this.currentDraft = this.drafts[0];
      this.currentState = this.STATE_CHAT;
      this.render();
    }
  },

  confirmImport() {
    const textarea = document.getElementById('importTextarea');
    const text = textarea?.value.trim();
    if (!text) {
      this._showToast('请先粘贴角色设定文本');
      return;
    }
    DraftStorage.update(this.currentDraft.id, { sourceText: text });
    this.currentDraft.sourceText = text;
    this.currentState = this.STATE_SELECT_DIRECTION;
    this.renderCurrentView();
  },

  backToModeSelect() {
    this.currentState = this.STATE_SELECT_MODE;
    this.renderCurrentView();
  },

  selectDirection(directionId) {
    if (!this.currentDraft) return;
    const prompt = this.DIRECTION_PROMPTS[directionId] || '';
    DraftStorage.update(this.currentDraft.id, {
      direction: directionId,
      systemPrompt: prompt,
    });
    this.currentDraft.direction = directionId;
    this.currentDraft.systemPrompt = prompt;

    // 更新方向卡片选中状态（不重渲染整个视图）
    document.querySelectorAll('.card-direction-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.direction === directionId);
    });

    // 启用开始按钮
    const startBtn = document.getElementById('startChatBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove('disabled');
    }
  },

  startChat() {
    if (!this.currentDraft?.direction) return;
    this.currentState = this.STATE_CHAT;
    this.renderCurrentView();

    // 已有人设模式：自动发送分析请求
    if (this.currentDraft.mode === 'existing' && this.currentDraft.sourceText) {
      const prefix = this.DIRECTION_ANALYSIS_PREFIX[this.currentDraft.direction] || '';
      const analysisMsg = `${prefix}\n\n以下是我的角色人设：\n\n${this.currentDraft.sourceText}`;
      setTimeout(() => this._sendAiMessage(analysisMsg), 300);
    }
  },

  // ══════════════════════════════════════════
  // System Prompt 操作
  // ══════════════════════════════════════════

  _toggleSystemPrompt() {
    if (!this.currentDraft) return;
    const isOpen = !this.currentDraft._systemPromptOpen;
    this.currentDraft._systemPromptOpen = isOpen;
    this.renderCurrentView();
  },

  saveSystemPrompt() {
    const textarea = document.getElementById('systemPromptTextarea');
    if (!textarea || !this.currentDraft) return;
    DraftStorage.update(this.currentDraft.id, { systemPrompt: textarea.value });
    this.currentDraft.systemPrompt = textarea.value;
    this._showToast('系统提示词已保存');
  },

  resetSystemPrompt() {
    if (!this.currentDraft) return;
    const defaultPrompt = this.DIRECTION_PROMPTS[this.currentDraft.direction] || '';
    DraftStorage.update(this.currentDraft.id, { systemPrompt: defaultPrompt });
    this.currentDraft.systemPrompt = defaultPrompt;
    const textarea = document.getElementById('systemPromptTextarea');
    if (textarea) textarea.value = defaultPrompt;
    this._showToast('已重置为默认提示词');
  },

  // ══════════════════════════════════════════
  // 对话逻辑
  // ══════════════════════════════════════════

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || this._isStreaming) return;

    input.value = '';
    input.style.height = 'auto';

    // 追加用户消息
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    this.currentDraft.messages.push(userMsg);
    DraftStorage.update(this.currentDraft.id, { messages: this.currentDraft.messages });
    this._appendMessage(userMsg);
    this.scrollToBottom();

    await this._sendAiMessage(text);
  },

  async _sendAiMessage(userContent) {
    const draft = this.currentDraft;
    if (!draft) return;

    this._isStreaming = true;
    this._updateSendButton(true);

    // 构建发给 AI 的消息列表
    const messages = [
      { role: 'system', content: draft.systemPrompt || '' },
      ...draft.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content })),
    ];

    // 如果 userContent 不在 messages 末尾（自动分析场景），手动追加
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userContent) {
      messages.push({ role: 'user', content: userContent });
    }

    // 创建流式消息占位
    const streamEl = this._createStreamingMessageEl();
    const messageList = document.getElementById('messageList');
    const emptyEl = messageList?.querySelector('.card-chat-empty');
    if (emptyEl) emptyEl.remove();
    messageList?.appendChild(streamEl);
    this.scrollToBottom();

    let finalText = '';

    try {
      await AIClient.stream(
        messages,
        { max_tokens: draft.maxTokens || 4096 },
        (delta, accumulated) => {
          finalText = accumulated;
          const contentEl = streamEl.querySelector('.stream-content');
          if (contentEl) {
            contentEl.innerHTML = this._renderMarkdownLite(accumulated) +
              '<span class="streaming-cursor">▋</span>';
            this._renderMermaidInElement(contentEl);
          }
          this.scrollToBottom();
        },
        (text) => {
          finalText = text;
        }
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errMsg = {
          id: `msg_${Date.now()}`,
          role: 'error',
          content: `请求失败：${err.message}`,
          timestamp: Date.now(),
        };
        draft.messages.push(errMsg);
        DraftStorage.update(draft.id, { messages: draft.messages });
        streamEl.remove();
        this._appendMessage(errMsg);
        this.scrollToBottom();
        this._isStreaming = false;
        this._updateSendButton(false);
        return;
      }
    }

    // 流式完成：替换占位元素为正式消息
    const aiMsg = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: finalText,
      timestamp: Date.now(),
    };

    if (finalText) {
      draft.messages.push(aiMsg);
      DraftStorage.update(draft.id, { messages: draft.messages });
    }

    streamEl.remove();
    if (finalText) {
      this._appendMessage(aiMsg);
      this._renderMermaidInElement(
        messageList?.lastElementChild
      );
    }

    this.scrollToBottom();
    this._isStreaming = false;
    this._updateSendButton(false);
  },

  stopStreaming() {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._isStreaming = false;
    this._updateSendButton(false);

    // 在流式消息末尾追加停止标记
    const streamEl = document.querySelector('.card-message-ai.streaming');
    if (streamEl) {
      streamEl.classList.remove('streaming');
      const contentEl = streamEl.querySelector('.stream-content');
      if (contentEl) {
        const cursor = contentEl.querySelector('.streaming-cursor');
        if (cursor) cursor.remove();
        contentEl.insertAdjacentHTML('beforeend',
          '<span class="streaming-stopped"> [已停止]</span>');
      }
    }
  },

  _updateSendButton(isStreaming) {
    const inputArea = document.querySelector('.card-chat-input');
    if (!inputArea) return;

    const existingBtn = inputArea.querySelector('.btn-stop, #sendBtn');
    if (existingBtn) existingBtn.remove();

    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.disabled = isStreaming;

    const btn = document.createElement('button');
    if (isStreaming) {
      btn.className = 'btn btn-stop';
      btn.innerHTML = '<i class="ti ti-player-stop"></i> 停止';
      btn.onclick = () => this.stopStreaming();
    } else {
      btn.className = 'btn btn-primary';
      btn.id = 'sendBtn';
      btn.innerHTML = '<i class="ti ti-send"></i> 发送';
      btn.onclick = () => this.sendMessage();
    }
    inputArea.appendChild(btn);
  },

  // ══════════════════════════════════════════
  // DOM 操作辅助
  // ══════════════════════════════════════════

  _appendMessage(msg) {
    const messageList = document.getElementById('messageList');
    if (!messageList) return;
    const emptyEl = messageList.querySelector('.card-chat-empty');
    if (emptyEl) emptyEl.remove();
    messageList.insertAdjacentHTML('beforeend', this._renderMessageHtml(msg));
  },

  _renderMessageHtml(msg) {
    if (msg.role === 'user') {
      return `
        <div class="card-message card-message-user" data-msg-id="${msg.id}">
          ${this._escapeHtml(msg.content)}
        </div>
      `;
    }
    if (msg.role === 'assistant') {
      return `
        <div class="card-message card-message-ai" data-msg-id="${msg.id}">
          ${this._renderMarkdownLite(msg.content)}
        </div>
      `;
    }
    if (msg.role === 'error') {
      return `
        <div class="card-message card-message-error" data-msg-id="${msg.id}">
          <i class="ti ti-alert-circle"></i>
          ${this._escapeHtml(msg.content)}
        </div>
      `;
    }
    return '';
  },

  _createStreamingMessageEl() {
    const div = document.createElement('div');
    div.className = 'card-message card-message-ai streaming';
    div.innerHTML = `<div class="stream-content"><span class="streaming-cursor">▋</span></div>`;
    return div;
  },

  scrollToBottom() {
    const messageList = document.getElementById('messageList');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  },

  // ══════════════════════════════════════════
  // Markdown 渲染
  // ══════════════════════════════════════════

  _renderMarkdownLite(text) {
    if (!text) return '';

    // 1. 提取代码块，替换为占位符
    const codeBlocks = [];
    let processed = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang || '', code });
      return `%%CODEBLOCK_${idx}%%`;
    });

    // 2. 转义 HTML（非代码块部分）
    processed = processed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

        // 3. 行内规则
    processed = processed
      // 行内代码
      .replace(/`([^`]+)`/g, '<code class="msg-code-inline">$1</code>')
      // 加粗
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // 4. 标题
    processed = processed
      .replace(/^### (.+)$/gm, '<h4 class="msg-heading">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="msg-heading">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="msg-heading">$1</h2>');

    // 5. 无序列表
    processed = processed.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
    processed = processed.replace(
      /(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g,
      match => `<ul class="msg-list">${match}</ul>`
    );

    // 6. 换行
    processed = processed.replace(/\n/g, '<br>');

    // 7. 还原代码块
    processed = processed.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => {
      const { lang, code } = codeBlocks[parseInt(idx)];
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="msg-code-block" data-lang="${lang}"><code>${escapedCode}</code></pre>`;
    });

    return processed;
  },

  // ══════════════════════════════════════════
  // Mermaid 动态渲染
  // ══════════════════════════════════════════

  async _renderMermaidInElement(el) {
    if (!el) return;
    const mermaidBlocks = el.querySelectorAll('pre.msg-code-block[data-lang="mermaid"]');
    if (mermaidBlocks.length === 0) return;

    await this._loadMermaid();

    mermaidBlocks.forEach(async (pre) => {
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

      




