/**
 * 马卡龙配色主题：卡片每天换一种，都是低饱和的温柔色调。
 * 每个主题只定义颜色，卡片结构由 cardHtml.js 负责。
 */
const THEMES = [
  {
    name: '蜜桃粉',
    pageBg: 'linear-gradient(160deg, #ffe3ee 0%, #ffd6e7 45%, #ffe9f2 100%)',
    shadow: 'rgba(219,112,147,0.16)',
    accentDark: '#b3456e',
    accent: '#c94f7c',
    colBg: 'rgba(255,214,231,0.78)',
    chipBg: 'rgba(255,192,214,0.42)',
    body: '#7d5b68',
    muted: '#9c7b88',
    dateMuted: '#b79aa6',
    divider: 'rgba(219,112,147,0.45)',
    dividerEdge: 'rgba(219,112,147,0)',
    loveBg: 'linear-gradient(135deg, #fff0f5, #ffe0ec)',
    loveText: '#8a5c6d',
  },
  {
    name: '薄荷绿',
    pageBg: 'linear-gradient(160deg, #e2f7ef 0%, #d2f0e6 45%, #eafaf4 100%)',
    shadow: 'rgba(88,169,142,0.16)',
    accentDark: '#2f7d66',
    accent: '#3f9b7f',
    colBg: 'rgba(206,240,229,0.78)',
    chipBg: 'rgba(178,229,212,0.48)',
    body: '#4f6f66',
    muted: '#7b9a90',
    dateMuted: '#96b0a7',
    divider: 'rgba(88,169,142,0.42)',
    dividerEdge: 'rgba(88,169,142,0)',
    loveBg: 'linear-gradient(135deg, #eefaf5, #dcf4ea)',
    loveText: '#5b7d72',
  },
  {
    name: '薰衣草紫',
    pageBg: 'linear-gradient(160deg, #eee6fb 0%, #e3d8f8 45%, #f4edfd 100%)',
    shadow: 'rgba(146,114,201,0.16)',
    accentDark: '#6b4b9e',
    accent: '#8264b8',
    colBg: 'rgba(228,217,248,0.78)',
    chipBg: 'rgba(210,193,242,0.48)',
    body: '#6a5c80',
    muted: '#9187a8',
    dateMuted: '#a89fbb',
    divider: 'rgba(146,114,201,0.42)',
    dividerEdge: 'rgba(146,114,201,0)',
    loveBg: 'linear-gradient(135deg, #f5f0fd, #ebe1fa)',
    loveText: '#6f5f88',
  },
  {
    name: '奶油黄',
    pageBg: 'linear-gradient(160deg, #fff4d9 0%, #ffeac2 45%, #fff8e6 100%)',
    shadow: 'rgba(206,163,74,0.18)',
    accentDark: '#9a7124',
    accent: '#bd8f31',
    colBg: 'rgba(255,236,197,0.78)',
    chipBg: 'rgba(255,222,163,0.52)',
    body: '#7d6a48',
    muted: '#a3946f',
    dateMuted: '#b8ab8b',
    divider: 'rgba(206,163,74,0.42)',
    dividerEdge: 'rgba(206,163,74,0)',
    loveBg: 'linear-gradient(135deg, #fff9e8, #fff1d3)',
    loveText: '#87744f',
  },
  {
    name: '天空蓝',
    pageBg: 'linear-gradient(160deg, #e2f0fc 0%, #d3e7fa 45%, #edf6fe 100%)',
    shadow: 'rgba(88,141,196,0.16)',
    accentDark: '#2f6396',
    accent: '#4280bb',
    colBg: 'rgba(210,231,250,0.78)',
    chipBg: 'rgba(184,215,244,0.48)',
    body: '#4d6479',
    muted: '#7c93a9',
    dateMuted: '#9aafc1',
    divider: 'rgba(88,141,196,0.42)',
    dividerEdge: 'rgba(88,141,196,0)',
    loveBg: 'linear-gradient(135deg, #eff7fe, #ddedfb)',
    loveText: '#587089',
  },
  {
    name: '蜜桃橘',
    pageBg: 'linear-gradient(160deg, #ffe9dd 0%, #ffdcc8 45%, #fff2e9 100%)',
    shadow: 'rgba(214,133,94,0.16)',
    accentDark: '#a45a35',
    accent: '#c57448',
    colBg: 'rgba(255,224,205,0.78)',
    chipBg: 'rgba(255,205,176,0.5)',
    body: '#7d6353',
    muted: '#a1897a',
    dateMuted: '#b8a196',
    divider: 'rgba(214,133,94,0.42)',
    dividerEdge: 'rgba(214,133,94,0)',
    loveBg: 'linear-gradient(135deg, #fff4ec, #ffe6d6)',
    loveText: '#87695a',
  },
  {
    name: '雾霾蓝',
    pageBg: 'linear-gradient(160deg, #e8eef4 0%, #dde6ef 45%, #f1f5f9 100%)',
    shadow: 'rgba(108,134,160,0.16)',
    accentDark: '#4a6480',
    accent: '#5c7d9c',
    colBg: 'rgba(219,229,239,0.80)',
    chipBg: 'rgba(198,213,228,0.50)',
    body: '#5c6b7a',
    muted: '#8695a4',
    dateMuted: '#a3afbb',
    divider: 'rgba(108,134,160,0.40)',
    dividerEdge: 'rgba(108,134,160,0)',
    loveBg: 'linear-gradient(135deg, #f2f6fa, #e3ebf3)',
    loveText: '#647585',
  },
  {
    name: '奶茶色',
    pageBg: 'linear-gradient(160deg, #f6ece0 0%, #efe2d2 45%, #faf3ea 100%)',
    shadow: 'rgba(178,142,105,0.16)',
    accentDark: '#8a6540',
    accent: '#a67c52',
    colBg: 'rgba(240,229,214,0.80)',
    chipBg: 'rgba(228,211,190,0.50)',
    body: '#6f6152',
    muted: '#9a8b79',
    dateMuted: '#b3a694',
    divider: 'rgba(178,142,105,0.40)',
    dividerEdge: 'rgba(178,142,105,0)',
    loveBg: 'linear-gradient(135deg, #fbf5ee, #f3e8db)',
    loveText: '#7a6a58',
  },
  {
    name: '抹茶绿',
    pageBg: 'linear-gradient(160deg, #eaf1de 0%, #dfe9cf 45%, #f2f7e9 100%)',
    shadow: 'rgba(126,152,94,0.16)',
    accentDark: '#5f7539',
    accent: '#758c4c',
    colBg: 'rgba(228,237,213,0.80)',
    chipBg: 'rgba(211,225,189,0.50)',
    body: '#66705a',
    muted: '#8e9a7f',
    dateMuted: '#a8b29a',
    divider: 'rgba(126,152,94,0.40)',
    dividerEdge: 'rgba(126,152,94,0)',
    loveBg: 'linear-gradient(135deg, #f4f8ec, #e8f0da)',
    loveText: '#6b7660',
  },
  {
    name: '莓果粉',
    pageBg: 'linear-gradient(160deg, #fbe4ee 0%, #f7d5e4 45%, #fdf0f6 100%)',
    shadow: 'rgba(198,84,131,0.18)',
    accentDark: '#a03a63',
    accent: '#c04b78',
    colBg: 'rgba(250,215,231,0.80)',
    chipBg: 'rgba(245,190,215,0.50)',
    body: '#7a5464',
    muted: '#a17e8d',
    dateMuted: '#b99aa7',
    divider: 'rgba(198,84,131,0.40)',
    dividerEdge: 'rgba(198,84,131,0)',
    loveBg: 'linear-gradient(135deg, #fdeff5, #f8dcea)',
    loveText: '#87586b',
  },
  {
    name: '海洋青',
    pageBg: 'linear-gradient(160deg, #dff2f3 0%, #d0eaec 45%, #ecf8f9 100%)',
    shadow: 'rgba(72,146,152,0.16)',
    accentDark: '#2c6b71',
    accent: '#3d848b',
    colBg: 'rgba(213,237,239,0.80)',
    chipBg: 'rgba(190,224,227,0.50)',
    body: '#4f6a6c',
    muted: '#7d979a',
    dateMuted: '#9bb2b4',
    divider: 'rgba(72,146,152,0.40)',
    dividerEdge: 'rgba(72,146,152,0)',
    loveBg: 'linear-gradient(135deg, #eff9fa, #dceff1)',
    loveText: '#587173',
  },
  {
    name: '丁香紫',
    pageBg: 'linear-gradient(160deg, #f0eaf3 0%, #e6dcea 45%, #f6f1f8 100%)',
    shadow: 'rgba(150,118,166,0.16)',
    accentDark: '#6e4f7d',
    accent: '#866294',
    colBg: 'rgba(233,222,238,0.80)',
    chipBg: 'rgba(219,203,227,0.50)',
    body: '#6c5c72',
    muted: '#93849a',
    dateMuted: '#aca0b2',
    divider: 'rgba(150,118,166,0.40)',
    dividerEdge: 'rgba(150,118,166,0)',
    loveBg: 'linear-gradient(135deg, #f7f2f9, #ece2f0)',
    loveText: '#71617a',
  },
];

/** 默认主题（找不到时兜底） */
const DEFAULT_THEME = THEMES[0];

/** 预生成每个天数的主题下标：确定性、相邻两天不撞色 */
const MAX_DAY = 4000;
const SEQ = (() => {
  const n = THEMES.length;
  const hash = (v) => {
    let x = Math.imul(v ^ 0x5bf03635, 0x9e3779b1);
    x ^= x >>> 15;
    x = Math.imul(x, 0x85ebca6b);
    x ^= x >>> 13;
    return (x >>> 0) % n;
  };
  const out = new Array(MAX_DAY + 1);
  out[0] = hash(0);
  for (let day = 1; day <= MAX_DAY; day++) {
    let next = hash(day);
    if (next === out[day - 1]) next = (next + 1) % n;
    out[day] = next;
  }
  return out;
})();

/**
 * 按天数挑主题：顺序看起来是随机换色，但同一天结果恒定，
 * 且相邻两天一定不撞色。
 */
function themeIndex(seed) {
  const d = Number.isFinite(seed) ? Math.max(0, Math.floor(seed)) : 0;
  return SEQ[d <= MAX_DAY ? d : d % MAX_DAY];
}

function pickTheme(seed) {
  return THEMES[themeIndex(seed)];
}

module.exports = { THEMES, DEFAULT_THEME, pickTheme, themeIndex };
