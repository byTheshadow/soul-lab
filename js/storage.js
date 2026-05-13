/*═══════════════════════════════════════════════════════════Storage — localStorage 统一数据层
   Soul Lab by Shadow | Step 2
   ═══════════════════════════════════════════════════════════ */

const Storage = (() => {
  const PREFIX = 'soul-lab-';

  /* ─── 基础读写 ─── */

  const get = (key) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      // not JSON, return raw string
      return localStorage.getItem(PREFIX + key);
    }
  };

  const set = (key, value) => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(PREFIX + key, serialized);
      return true;
    } catch (e) {
      console.error(`[Storage] Failed to set "${key}":`, e);
      return false;
    }
  };

  const remove = (key) => {
    localStorage.removeItem(PREFIX + key);
  };

  const clear = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  };

  /* ─── 数据统计（给设置页数据概览用） ─── */

  const getDataStats = () => {
    const ocDrafts = get('oc-drafts');
    const cards = get('cards');
    const worlds = get('worlds');

    return {
      ocDrafts: Array.isArray(ocDrafts) ? ocDrafts.length : 0,
      cards: Array.isArray(cards) ? cards.length : 0,
      worlds: Array.isArray(worlds) ? worlds.length : 0,
    };
  };

  /* ─── 全量导出 / 导入 ─── */

  const exportAll = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const shortKey = k.slice(PREFIX.length);
        data[shortKey] = get(shortKey);
      }
    }
    return data;
  };

  const importAll = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('导入数据格式无效');
    }
    // validate: must be a plain object with string keys
    const keys = Object.keys(data);
    if (keys.length === 0) {
      throw new Error('导入数据为空');
    }
    // write all keys
    keys.forEach((key) => {
      set(key, data[key]);
    });
    return keys.length;
  };

  /* ─── 快捷方法：API 配置 ─── */

  const getApiConfig = () => {
    return get('api-config') || {
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: '',};
  };

  const setApiConfig = (config) => {
    return set('api-config', config);
  };

  const getApiKey = () => {
    return get('api-key') || '';
  };

  const setApiKey = (key) => {
    return set('api-key', key);
  };

  /* ─── Public API ─── */

  return {
    get,
    set,
    remove,
    clear,
    getDataStats,
    exportAll,
    importAll,
    getApiConfig,
    setApiConfig,
    getApiKey,
    setApiKey,
  };
})();
/* ═══ END: Storage ═══ */
