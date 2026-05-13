/* ═══════════════════════════════════════════════════════════
   AIClient — AI 调用统一模块（OpenAI 兼容接口）
   Soul Lab by Shadow | Step 2
   ═══════════════════════════════════════════════════════════ */

const AIClient = (() => {

  /* ─── 日志系统（内存存储，刷新清空） ─── */

  const _logs = [];
  const MAX_LOGS = 50;

  const _addLog = (status, message) => {
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
    _logs.unshift({ time, status, message });
    if (_logs.length > MAX_LOGS) _logs.pop();
  };

  const getLogs = () => [..._logs];
  const clearLogs = () => { _logs.length = 0; };

  /* ─── 内部工具 ─── */

  const _getHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  });

  const _buildUrl = (baseUrl, path) => {
    // remove trailing slash from baseUrl
    const base = baseUrl.replace(/\/+$/, '');
    // handle baseUrl that already includes /v1
    if (base.endsWith('/v1')) {
      return `${base}${path}`;
    }
    return `${base}/v1${path}`;
  };

  /* ─── 获取模型列表（零token） ─── */

  const getModels = async () => {
    const config = Storage.getApiConfig();
    const apiKey = Storage.getApiKey();

    if (!apiKey) {
      _addLog('error', '未设置 API Key');
      throw new Error('未设置 API Key');
    }

    const url = _buildUrl(config.baseUrl, '/models');
    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: _getHeaders(apiKey),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        const msg = `获取模型列表失败 — ${res.status} ${errText}`;
        _addLog('error', msg);
        throw new Error(msg);
      }

      const json = await res.json();
      const elapsed = Date.now() - startTime;

      // OpenAI format: { data: [{ id, object, ... }] }
      let models = [];
      if (json.data && Array.isArray(json.data)) {
        models = json.data;
      } else if (Array.isArray(json)) {
        models = json;
      }

      // filter: keep only chat-capable models, exclude embedding/tts/whisper/dall-e/moderation
      const excludePatterns = [
        /embed/i, /tts/i, /whisper/i, /dall-e/i, /davinci/i,
        /babbage/i, /moderation/i, /audio/i, /realtime/i,
      ];

      const chatModels = models
        .map((m) => (typeof m === 'string' ? m : m.id))
        .filter((id) => !excludePatterns.some((p) => p.test(id)))
        .sort();

      _addLog('success', `获取到 ${chatModels.length} 个可用模型 (${elapsed}ms)`);
      return chatModels;

    } catch (e) {
      if (!e.message.includes('获取模型列表失败')) {
        _addLog('error', `获取模型列表失败 — ${e.message}`);
      }
      throw e;
    }
  };

  /* ─── 连接测试（用/models 端点，零 token） ─── */

  const testConnection = async () => {
    const config = Storage.getApiConfig();
    const apiKey = Storage.getApiKey();

    if (!apiKey) {
      _addLog('error', '未设置 API Key');
      throw new Error('未设置 API Key');
    }

    const url = _buildUrl(config.baseUrl, '/models');
    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: _getHeaders(apiKey),
      });

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        const msg = `连接测试失败 — ${res.status} ${errText}`;
        _addLog('error', msg);
        throw new Error(msg);
      }

      _addLog('success', `连接成功 (${elapsed}ms)`);
      return { success: true, elapsed };

    } catch (e) {
      if (!e.message.includes('连接测试失败')) {
        _addLog('error', `连接测试失败 — ${e.message}`);
      }
      throw e;
    }
  };

  /* ─── 普通调用（返回完整文本） ─── */

  const send = async (messages, options = {}) => {
    const config = Storage.getApiConfig();
    const apiKey = Storage.getApiKey();

    if (!apiKey) throw new Error('未设置 API Key');
    if (!config.model) throw new Error('未选择模型');

    const url = _buildUrl(config.baseUrl, '/chat/completions');
    const body = {
      model: options.model || config.model,
      messages,
      temperature: options.temperature ??0.7,
      max_tokens: options.max_tokens ?? 2048,
      ...options.extra,
    };

    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: _getHeaders(apiKey),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        const msg = `AI 调用失败 — ${res.status} ${errText}`;
        _addLog('error', msg);
        throw new Error(msg);
      }

      const json = await res.json();
      const elapsed = Date.now() - startTime;
      const content = json.choices?.[0]?.message?.content || '';

      _addLog('success', `AI 响应完成 — ${config.model} (${elapsed}ms)`);
      return content;

    } catch (e) {
      if (!e.message.includes('AI 调用失败')) {
        _addLog('error', `AI 调用失败 — ${e.message}`);
      }
      throw e;
    }
  };

  /* ─── 流式调用（逐 token 回调） ─── */

  const stream = async (messages, options = {}, onChunk, onDone) => {
    const config = Storage.getApiConfig();
    const apiKey = Storage.getApiKey();

    if (!apiKey) throw new Error('未设置 API Key');
    if (!config.model) throw new Error('未选择模型');

    const url = _buildUrl(config.baseUrl, '/chat/completions');
    const body = {
      model: options.model || config.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: true,
      ...options.extra,
    };

    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: _getHeaders(apiKey),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        const msg = `AI 流式调用失败 — ${res.status} ${errText}`;
        _addLog('error', msg);
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              if (onChunk) onChunk(delta, fullText);
            }
          } catch {
            // skip malformed JSON chunks
          }
        }
      }

      const elapsed = Date.now() - startTime;
      _addLog('success', `AI 流式响应完成 — ${config.model} (${elapsed}ms)`);
      if (onDone) onDone(fullText);
      return fullText;

    } catch (e) {
      if (!e.message.includes('AI 流式调用失败')) {
        _addLog('error', `AI 流式调用失败 — ${e.message}`);
      }
      throw e;
    }
  };

  /* ─── Public API ─── */

  return {
    getModels,
    testConnection,
    send,
    stream,getLogs,
    clearLogs,
  };
})();
/* ═══ END: AIClient ═══ */
