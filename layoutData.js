/**
 * 版式共用的数据整理。
 *
 * 每种版式长得完全不一样，但「要显示什么」是同一份 content。
 * 所以这里先把原始数据拆成排版用的中间结构（纯数据、不含 HTML），
 * 各个版式模块再各自决定怎么画 —— 免得每个版式都重写一遍黄历解析。
 */

const esc = (v) => {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/** 从「2026年10月20日 08:02 星期二」里抠出日期，给邮戳/票根用 */
function stampDate(dateText) {
  const m = String(dateText || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return m ? { y: m[1], m: m[2], d: m[3], text: `${m[1]}.${m[2]}.${m[3]}` } : null;
}

/** 两个城市的天气，已经拆成左右两格 */
function weather(c) {
  const mine = {
    head: c.city || '',
    icon: c.icon || '',
    min: c.tempMin,
    max: c.tempMax,
    desc: c.weatherDesc || '',
    wind: c.wind || '',
  };
  const ta = c.ta
    ? {
      head: c.ta.city || '',
      icon: c.ta.icon || '',
      min: c.ta.tempMin,
      max: c.ta.tempMax,
      desc: c.ta.desc || '',
      wind: c.ta.wind || '',
    }
    : null;
  return { mine, ta };
}

/** 生活指数列表 */
function life(c) {
  return (c.lifeItems || []).map((it) => ({
    emoji: it.emoji || '',
    label: it.label || '',
    text: it.text || '',
  }));
}

/**
 * 黄历拆成排版用的几块：
 * lunar 农历、gz 干支、yi 宜、ji 忌、facts 左栏三格、grid 九宫格。
 */
function almanac(h) {
  if (!h) return null;

  const chong = (h.chongsha || '').match(/冲(\S+)/);
  const sha = (h.chongsha || '').match(/煞(\S+)/);
  const chongsha =
    chong && sha ? `冲${chong[1]} 煞${sha[1]}` : String(h.chongsha || '');

  const facts = [
    { k: '冲煞', v: chongsha },
    { k: '五行', v: h.wuxing || '' },
    { k: '建除', v: h.jianchu || '' },
  ].filter((f) => f.v);

  // 九宫格：上方固定正北，简写「北」补成「正北」
  const FW_ORDER = ['西北', '正北', '东北', '正西', '中', '正东', '西南', '正南', '东南'];
  const FW_ALIAS = {
    北: '正北', 南: '正南', 东: '正东', 西: '正西',
    东北: '东北', 西北: '西北', 东南: '东南', 西南: '西南',
  };
  const norm = (v) => {
    const s = String(v || '').trim();
    return FW_ALIAS[s] || s;
  };
  const FW_KEYS = ['财神', '喜神', '福神', '阳贵'];

  const fw = h.fangwei || {};
  const byDir = {};
  for (const k of FW_KEYS) {
    const d = norm(fw[k]);
    if (!d) continue;
    (byDir[d] = byDir[d] || []).push(k);
  }

  const grid = FW_ORDER.map((dir) => ({
    dir,
    short: dir.replace(/^正/, ''),
    center: dir === '中',
    gods: byDir[dir] || [],
  }));

  return {
    lunar: h.lunarMonthDay || '',
    ganzhi: h.ganzhi || '',
    zodiac: h.zodiac || '',
    jieqi: h.jieqi || '',
    yi: h.yi || [],
    ji: h.ji || [],
    facts,
    grid,
    hasGrid: Object.keys(byDir).length > 0,
  };
}

/** 版式通用：把 content 拆成排版数据，省得每个版式自己拆 */
function prepare(c) {
  return {
    days: c.days,
    dateText: c.dateText || '',
    date: stampDate(c.dateText),
    signature: c.signature || '',
    loveWord: c.loveWord || '',
    theme: c.theme,
    weather: weather(c),
    life: life(c),
    almanac: almanac(c.huangli),
  };
}

module.exports = { esc, prepare, stampDate, weather, life, almanac };
