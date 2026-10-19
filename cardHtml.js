/**
 * 温柔马卡龙色卡片：把整理好的内容渲染成一张长图。
 * 纯 HTML，交给 Chrome 截图，所以字体/emoji/圆角都能正常渲染。
 * 配色由 themes.js 每天轮换，这里只负责套用颜色变量。
 */
const { DEFAULT_THEME } = require('./themes');

const esc = (v) => {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/** 一格天气（自己的或 TA 的），两格并排 */
function wxCol({ head, icon, tempMin, tempMax, desc, wind, mine }) {
  return `
    <div class="wx-col${mine ? ' mine' : ''}">
      <div class="wx-city">${esc(head)}</div>
      ${desc ? `<div class="wx-desc">${esc(icon ? icon + ' ' : '')}${esc(desc)}</div>` : ''}
      <div class="wx-temp">${esc(tempMin)}℃ / ${esc(tempMax)}℃</div>
      ${wind ? `<div class="wx-wind">${esc(wind)}</div>` : ''}
    </div>`;
}

/**
 * 黄历块。
 * 取舍：宜忌是核心，配农历 + 干支/生肖 + 冲煞五行建除 + 吉神方位。
 * 省掉了日期（卡片底部已有）、星期、值神、宿星、彭祖百忌、胎神、时辰吉凶
 * ——那些要么重复，要么太专业，放进卡片只是噪音。
 */
function huangliBlock(h, standalone) {
  if (!h) return '';

  const chips = (list, cls) =>
    list.map((x) => `<span class="hl-chip ${cls}">${esc(x)}</span>`).join('');

  // 冲煞单独处理：拆成「冲猴」「煞北」两块，比挤成一句更清楚
  const chong = (h.chongsha || '').match(/冲(\S+)/);
  const sha = (h.chongsha || '').match(/煞(\S+)/);

  /**
   * 一格小卡：上面是类别名，下面是值。
   * rawHtml 用于需要自行拆行的值（如冲煞），此时不再转义。
   */
  const factCell = (label, value, rawHtml) => {
    const inner = rawHtml !== undefined ? rawHtml : esc(value);
    if (!inner) return '';
    return `<div class="hl-cell">
           <span class="hl-cell-label">${esc(label)}</span>
           <span class="hl-cell-value">${inner}</span>
         </div>`;
  };

  // 冲煞拆成「冲猴」「煞北」两段，横排显示，比挤成一句清楚
  const chongshaValue =
    chong && sha
      ? `<i>冲${esc(chong[1])}</i><i>煞${esc(sha[1])}</i>`
      : esc(h.chongsha || '');

  const factCells = [
    factCell('冲煞', null, chongshaValue),
    factCell('五行', h.wuxing),
    factCell('建除', h.jianchu),
  ]
    .filter(Boolean)
    .join('');

  /**
   * 吉神方位：画成九宫格，上方固定是正北（传统罗盘方位）。
   * 四个吉神可能落在同一方位，所以一格内允许叠放。
   */
  const fw = h.fangwei || {};
  const FW_ORDER = [
    '西北', '正北', '东北',
    '正西', '中',   '正东',
    '西南', '正南', '东南',
  ];
  const FW_ALIAS = {
    北: '正北', 南: '正南', 东: '正东', 西: '正西',
    东北: '东北', 西北: '西北', 东南: '东南', 西南: '西南',
  };
  // 归一化：把「北」这类简写补成「正北」
  const norm = (v) => {
    const s = String(v || '').trim();
    return FW_ALIAS[s] || s;
  };
  const FW_KEYS = ['财神', '喜神', '福神', '阳贵'];

  // 每个方向挂了哪些神
  const byDir = {};
  for (const k of FW_KEYS) {
    const d = norm(fw[k]);
    if (!d) continue;
    (byDir[d] = byDir[d] || []).push(k);
  }

  const gridCells = FW_ORDER.map((dir) => {
    const gods = byDir[dir] || [];
    const isCenter = dir === '中';
    if (isCenter) return `<div class="hl-cell9 center"></div>`;

    // 神名用全称（财神/喜神/福神/阳贵），放在格内方位上方；
    // 一格内多个神时横向排开，实在挤就换行
    const tags = gods
      .map((g) => `<span class="hl-tag hl-tag-${g.charAt(0)}">${esc(g)}</span>`)
      .join('');

    return `<div class="hl-cell9${gods.length ? ' has' : ''}">
        ${tags ? `<span class="hl-tags">${tags}</span>` : ''}
        <span class="hl-dir">${esc(dir.replace(/^正/, ''))}</span>
      </div>`;
  }).join('');
  const hasFw = Object.keys(byDir).length > 0;

  return `
    <div class="hl${standalone ? ' standalone' : ''}">
      <div class="hl-top">
        <div class="hl-lunar">农历 ${esc(h.lunarMonthDay)}</div>
        <div class="hl-ganzhi">${esc(h.ganzhi)} · ${esc(h.zodiac)}年${
    h.jieqi ? ` · ${esc(h.jieqi)}` : ''
  }</div>
      </div>

      <div class="hl-yiji">
        <div class="hl-row">
          <span class="hl-label hl-yi-label">宜</span>
          <span class="hl-chips">${chips(h.yi, 'hl-yi')}</span>
        </div>
        <div class="hl-row">
          <span class="hl-label hl-ji-label">忌</span>
          <span class="hl-chips">${chips(h.ji, 'hl-ji')}</span>
        </div>
      </div>

      ${
        factCells.trim() || hasFw
          ? `<div class="hl-cols">
               ${
                 factCells.trim()
                   ? `<div class="hl-left">
                        <div class="hl-head"><span class="hl-col-title">冲煞五行</span></div>
                        <div class="hl-facts">${factCells}</div>
                      </div>`
                   : ''
               }
               ${
                 hasFw
                   ? `<div class="hl-right">
                        <div class="hl-head"><span class="hl-col-title">吉神方位</span></div>
                        <div class="hl-grid9">${gridCells}</div>
                      </div>`
                   : ''
               }
             </div>`
          : ''
      }
    </div>`;
}

function cardHtml(c) {
  const t = c.theme || DEFAULT_THEME;

  const life = (c.lifeItems || [])
    .map(
      (it) => `
      <div class="life">
        <div class="life-name">${esc(it.emoji ? it.emoji + ' ' : '')}${esc(it.label)}</div>
        <div class="life-text">${esc(it.text)}</div>
      </div>`
    )
    .join('');

  const loveBlock = c.loveWord
    ? `<div class="love">
         <div class="love-title">💌 每日土味情话</div>
         <div class="love-text">${esc(c.loveWord)}</div>
       </div>`
    : '';

  // 两个城市并排：左边是自己，右边是 TA（TA 只要天气情况，不带生活指数）
  const mineCol = wxCol({
    head: `📍 ${c.city}`,
    icon: c.icon,
    tempMin: c.tempMin,
    tempMax: c.tempMax,
    desc: c.weatherDesc,
    wind: c.wind,
    mine: true,
  });
  const taCol = c.ta
    ? wxCol({
        head: `🏙️ TA · ${c.ta.city}`,
        icon: c.ta.icon,
        tempMin: c.ta.tempMin,
        tempMax: c.ta.tempMax,
        desc: c.ta.desc,
        wind: c.ta.wind,
      })
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 720px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Noto Color Emoji', sans-serif;
    background: ${t.pageBg};
    padding: 44px 40px 52px;
  }
  .card {
    background: rgba(255,255,255,0.82);
    border-radius: 28px;
    padding: 40px 34px 34px;
    box-shadow: 0 10px 34px ${t.shadow};
  }
  .hi { font-size: 34px; color: ${t.accentDark}; font-weight: 700; letter-spacing: 1px; }
  .days {
    margin-top: 16px;
    font-size: 26px;
    color: ${t.accent};
    font-weight: 700;
  }
  .days .num { font-size: 46px; margin: 0 4px; }
  .divider {
    height: 1px;
    background: linear-gradient(90deg, ${t.dividerEdge}, ${t.divider}, ${t.dividerEdge});
    margin: 28px 0;
  }
  .sec-head { font-size: 22px; color: ${t.accentDark}; font-weight: 700; }
  .wx-row {
    display: flex;
    gap: 14px;
    margin-top: 16px;
    align-items: stretch;
  }
  .wx-col {
    flex: 1;
    min-width: 0;
    background: ${t.colBg};
    border-radius: 20px;
    padding: 20px 18px;
    text-align: left;
  }
  /* 自己那栏不加背景框，也不需要内边距，好和标题左对齐 */
  .wx-col.mine { background: transparent; padding-left: 0; padding-right: 0; }
  .wx-city { font-size: 17px; color: ${t.accentDark}; font-weight: 700; }
  .wx-temp {
    margin-top: 8px;
    font-size: 25px;
    color: ${t.accent};
    font-weight: 700;
    white-space: nowrap;
  }
  .wx-desc { margin-top: 8px; font-size: 21px; color: ${t.body}; line-height: 1.5; }
  .wx-wind { margin-top: 6px; font-size: 16px; color: ${t.muted}; line-height: 1.5; }
  .life-head { margin-top: 30px; font-size: 20px; color: ${t.accentDark}; font-weight: 700; }
  .life { margin-top: 16px; }
  .life-name {
    display: inline-block;
    font-size: 17px;
    color: ${t.accent};
    background: ${t.chipBg};
    border-radius: 999px;
    padding: 4px 14px;
    margin-bottom: 8px;
  }
  .life-text { font-size: 19px; color: ${t.body}; line-height: 1.75; }
  /* ---- 黄历 ---- */
  .hl {
    margin-top: 14px;
    background: ${t.loveBg};
    border-radius: 20px;
    padding: 22px 18px;
  }
  /* 前面没有生活指数时，自己补上标题那点距离 */
  .hl.standalone { margin-top: 22px; }
  .hl-top { margin-bottom: 16px; }
  .hl-lunar { font-size: 23px; color: ${t.accentDark}; font-weight: 700; }
  .hl-ganzhi { margin-top: 6px; font-size: 16px; color: ${t.muted}; }
  .hl-yiji { display: flex; flex-direction: column; gap: 10px; }
  .hl-row { display: flex; align-items: flex-start; gap: 10px; }
  .hl-label {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    border-radius: 9px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
  }
  .hl-yi-label { background: #5fa87c; }
  .hl-ji-label { background: #c96b6b; }
  .hl-chips { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 1px; }
  .hl-chip {
    font-size: 16px;
    padding: 3px 10px;
    border-radius: 999px;
    line-height: 1.5;
  }
  .hl-yi { background: rgba(95,168,124,0.16); color: #37714f; }
  .hl-ji { background: rgba(201,107,107,0.16); color: #8f4141; }

  /* 左右两栏各 50%：左边冲煞/五行/建除，右边吉神方位九宫格 */

  /* 统一行高：左 3 行 = 右 3 行，且行间距一致，横线才对得齐 */
  .hl-cols {
    --hl-row: 44px;      /* 单行高度 */
    --hl-gap: 6px;       /* 行间距 */
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px dashed ${t.divider};
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .hl-left,
  .hl-right {
    flex: 1 1 50%;
    width: 50%;
    min-width: 0;
  }
  /* 标题块只包住文字本身，不要拉满整栏 */
  .hl-head { margin-bottom: 8px; }
  .hl-col-title {
    display: inline-block;
    font-size: 13px;
    color: ${t.accent};
    background: ${t.chipBg};
    border-radius: 7px;
    padding: 1px 8px;
    line-height: 1.6;
    white-space: nowrap;
  }
  /* 左侧三项竖排，每项与右侧九宫格一行等高 */
  .hl-facts { display: flex; flex-direction: column; gap: var(--hl-gap); }
  .hl-cell {
    display: flex;
    align-items: center;
    gap: 7px;
    height: var(--hl-row);
    background: rgba(255,255,255,0.62);
    border-radius: 10px;
    padding: 0 9px;
    min-width: 0;
  }
  .hl-cell-label {
    flex: 0 0 auto;
    font-size: 12px;
    color: ${t.accent};
    background: ${t.chipBg};
    border-radius: 6px;
    padding: 1px 7px;
    line-height: 1.6;
    white-space: nowrap;
  }
  .hl-cell-value {
    font-size: 15px;
    color: ${t.body};
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* 冲煞的两个字分开显示，中间留一点空 */
  .hl-cell-value i { font-style: normal; }
  .hl-cell-value i + i { margin-left: 7px; }

  /* 吉神方位：九宫格，上方为正北；行高与左侧一致 */
  .hl-grid9 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: var(--hl-row);
    gap: var(--hl-gap);
  }
  .hl-cell9 {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: rgba(255,255,255,0.42);
    border-radius: 10px;
    padding: 3px 2px;
    min-width: 0;
  }
  .hl-cell9.has {
    background: ${t.colBg};
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6);
  }
  .hl-cell9.center { background: transparent; }
  .hl-dir {
    font-size: 13px;
    color: ${t.muted};
    line-height: 1.1;
    white-space: nowrap;
  }
  .hl-cell9.has .hl-dir { color: ${t.accentDark}; font-weight: 700; }

  /* 神名标签：放在格内方位上方，多个神横向排开，挤不下就换行 */
  .hl-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }
  .hl-tag {
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    border-radius: 999px;
    padding: 2px 5px;
    white-space: nowrap;
  }
  .hl-tag-财 { background: #b8860b; }
  .hl-tag-喜 { background: #c2547e; }
  .hl-tag-福 { background: #3f8f63; }
  .hl-tag-阳 { background: #4a6fa5; }
  .love {
    margin-top: 28px;
    background: ${t.loveBg};
    border-radius: 20px;
    padding: 24px 26px;
  }
  .love-title { font-size: 19px; color: ${t.accent}; font-weight: 700; }
  .love-text { font-size: 21px; color: ${t.loveText}; line-height: 1.8; margin-top: 12px; }
  .sign {
    margin-top: 28px;
    text-align: right;
    font-size: 21px;
    color: ${t.accentDark};
  }
  .date-end {
    margin-top: 14px;
    text-align: center;
    font-size: 17px;
    color: ${t.dateMuted};
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="hi">皇后娘娘万福金安👑</div>
    <div class="days">今天是我们认识的第<span class="num">${esc(c.days)}</span>天💞</div>

    <div class="divider"></div>

    <div class="sec-head">🌤️ 今日天气</div>
    <div class="wx-row">
      ${mineCol}
      ${taCol}
    </div>

    ${life ? `<div class="life-head">🍀 生活指数</div>${life}` : ''}
    ${c.huangli ? `<div class="life-head">📅 今日黄历</div>` : ''}
    ${huangliBlock(c.huangli, !life)}
    ${loveBlock}

    <div class="sign">——${esc(c.signature)}</div>
    <div class="date-end">${esc(c.dateText)}</div>
  </div>
</body>
</html>`;
}

module.exports = { cardHtml };
