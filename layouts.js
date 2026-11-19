/**
 * 版式库：同一个 content，排成完全不同的几张「纸」。
 *
 * 每种版式只负责长相（HTML + CSS），数据整理交给 layoutData.js，
 * 所以想加一种新样式，只要在这里加一个函数、往 LAYOUTS 里塞进去即可。
 *
 * 已有的两种从各自文件进来：
 *   card   —— 彩色圆角马卡龙卡片（cardHtml.js）
 *   letter —— 米色信笺 / 情书（cardLetter.js）
 * 本文件新增五种：
 *   poster   海报：大字天数、两城天气并排大卡
 *   ticket   票根：左存根 + 齿孔撕线 + 条形码
 *   diary    日记本：横格纸、装订孔、手写体
 *   minimal  极简：全白、细线、大字距，克制
 *   magazine 杂志：刊头 + 期号 + 双栏正文
 */

const { prepare, esc } = require('./layoutData');
const { DEFAULT_THEME } = require('./themes');
const { cardHtml } = require('./cardHtml');
const { letterHtml } = require('./cardLetter');

/* ---------------------------------------------------------------- 公共小件 */

/**
 * 霞鹜文楷（LXGW WenKai）网页字体。
 * 这个包按 unicode-range 切成上百个子集，浏览器只下载真正用到的那些，
 * 所以很适合「一张图里几百个汉字」这种场景（整包字体要好几 MB）。
 * CI 里没装这个字体，靠它才能真正吃到「楷体」的样式；
 * 万一 CDN 挂了，字体栈后面还有系统楷体兜底。
 */
const WENKAI_CSS = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.6.0/style.css" />';
const WENKAI = "'LXGW WenKai'";

/** 把页面套进统一的 doc 骨架 */
const page = (css, body, extraClass) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
${WENKAI_CSS}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 720px;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #fff;
  }
${css}
</style>
</head>
<body${extraClass ? ` class="${extraClass}"` : ''}>
${body}
</body>
</html>`;

/** 一行生活指数：图标 + 标签 + 正文 */
const lifeRow = (it, cls) => `<div class="${cls}">
  <span class="${cls}-e">${esc(it.emoji)}</span>
  <span class="${cls}-l">${esc(it.label)}</span>
  <span class="${cls}-t">${esc(it.text)}</span>
</div>`;

/* ------------------------------------------------------------- 1. 海报 */

function poster(p) {
  const t = p.theme || DEFAULT_THEME;
  const w = p.weather;
  const a = p.almanac;

  const cityCard = (x, mine) => (x ? `<div class="pc-city${mine ? ' mine' : ''}">
    <div class="pc-head">${esc(x.head)}</div>
    <div class="pc-icon">${esc(x.icon)}</div>
    <div class="pc-temp">${esc(x.min)}°<span class="pc-sep">/</span>${esc(x.max)}°</div>
    <div class="pc-desc">${esc(x.desc)}</div>
    <div class="pc-wind">${esc(x.wind)}</div>
  </div>` : '');

  const facts = a && a.facts.length
    ? `<div class="pf-facts">${a.facts
      .map((f) => `<div class="pf-fact"><span class="pf-k">${esc(f.k)}</span><span class="pf-v">${esc(f.v)}</span></div>`)
      .join('')}</div>`
    : '';

  const grid = a && a.hasGrid
    ? `<div class="pf-grid">${a.grid
      .map((c) => (c.center
        ? '<div class="pf-cell center"></div>'
        : `<div class="pf-cell${c.gods.length ? ' has' : ''}">
             ${c.gods.length ? `<span class="pf-gods">${c.gods.map((g) => `<i>${esc(g)}</i>`).join('')}</span>` : ''}
             <span class="pf-dir">${esc(c.short)}</span>
           </div>`))
      .join('')}</div>`
    : '';

  const yi = a && a.yi.length
    ? `<div class="pf-yiji"><span class="pf-badge yi">宜</span>${a.yi.map((x) => `<i>${esc(x)}</i>`).join('')}</div>`
    : '';
  const ji = a && a.ji.length
    ? `<div class="pf-yiji"><span class="pf-badge ji">忌</span>${a.ji.map((x) => `<i>${esc(x)}</i>`).join('')}</div>`
    : '';

  return page(
    `
  .page {
    background: ${t.pageBg};
    padding: 54px 46px 44px;
    color: ${t.body};
  }
  .pf-top { text-align: center; color: ${t.accentDark}; }
  .pf-hello { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
  .pf-lead { margin-top: 30px; font-size: 19px; letter-spacing: 6px; color: ${t.muted}; }
  .pf-days {
    margin-top: 6px;
    font-size: 108px;
    font-weight: 900;
    line-height: 1;
    color: ${t.accent};
    letter-spacing: -2px;
  }
  .pf-days .u { font-size: 34px; margin-left: 6px; letter-spacing: 0; }
  .pf-date {
    margin-top: 16px;
    display: inline-block;
    padding: 7px 20px;
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    font-size: 16px;
    color: ${t.accentDark};
    letter-spacing: 1px;
  }
  .pf-wx { display: flex; gap: 16px; margin-top: 34px; }
  .pc-city {
    flex: 1;
    background: rgba(255,255,255,0.7);
    border-radius: 26px;
    padding: 22px 16px 20px;
    text-align: center;
    box-shadow: 0 8px 22px ${t.shadow};
  }
  .pc-city.mine { background: rgba(255,255,255,0.9); }
  .pc-head { font-size: 17px; font-weight: 700; color: ${t.accentDark}; }
  .pc-icon { font-size: 40px; line-height: 1.2; margin: 8px 0 2px; }
  .pc-temp { font-size: 40px; font-weight: 800; color: ${t.accent}; letter-spacing: -1px; }
  .pc-sep { margin: 0 4px; opacity: 0.45; font-weight: 400; }
  .pc-desc { margin-top: 6px; font-size: 17px; }
  .pc-wind { margin-top: 4px; font-size: 15px; color: ${t.muted}; }
  .pf-sec { margin-top: 38px; }
  .pf-title {
    display: inline-block;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3px;
    color: ${t.accentDark};
    border-bottom: 2px solid ${t.accent};
    padding-bottom: 5px;
  }
  .pf-life { margin-top: 16px; }
  .pf-life-row {
    display: flex;
    gap: 12px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    font-size: 16px;
    line-height: 1.75;
  }
  .pf-life-row:last-child { border-bottom: 0; }
  .pf-life-e { flex: 0 0 26px; font-size: 20px; }
  .pf-life-l { flex: 0 0 132px; font-weight: 700; color: ${t.accentDark}; }
  .pf-life-t { flex: 1; }
  .pf-hl {
    margin-top: 18px;
    background: rgba(255,255,255,0.66);
    border-radius: 22px;
    padding: 22px;
  }
  .pf-yiji { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; font-size: 15px; }
  .pf-badge {
    font-size: 13px; font-weight: 800; color: #fff;
    padding: 3px 9px; border-radius: 7px;
  }
  .pf-badge.yi { background: #5aa87c; }
  .pf-badge.ji { background: #c56a63; }
  .pf-yiji i { font-style: normal; background: rgba(255,255,255,0.85); padding: 3px 10px; border-radius: 8px; }
  .pf-facts { display: flex; gap: 10px; margin: 16px 0 18px; }
  .pf-fact {
    flex: 1; text-align: center; padding: 10px 6px;
    background: rgba(255,255,255,0.8); border-radius: 13px;
  }
  .pf-k { display: block; font-size: 12px; color: ${t.muted}; letter-spacing: 1px; }
  .pf-v { display: block; margin-top: 4px; font-size: 16px; font-weight: 700; color: ${t.accentDark}; }
  .pf-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 50px;
    gap: 6px;
  }
  .pf-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: rgba(255,255,255,0.72);
  }
  .pf-cell.center { background: transparent; }
  .pf-cell.has { background: ${t.colBg}; }
  .pf-dir { font-size: 15px; color: ${t.muted}; }
  .pf-gods {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 3px;
  }
  .pf-gods i {
    font-style: normal;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: ${t.accent};
    padding: 2px 5px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .pf-quote {
    margin-top: 36px;
    padding: 26px 28px;
    border-radius: 22px;
    background: ${t.loveBg};
    font-size: 20px;
    line-height: 1.9;
    color: ${t.loveText};
    text-align: justify;
  }
  .pf-quote::before { content: '\\201C'; font-size: 40px; color: ${t.accent}; line-height: 0; vertical-align: -14px; margin-right: 6px; }
  .pf-sign { margin-top: 26px; text-align: right; font-size: 19px; color: ${t.accentDark}; }
  .pf-foot { margin-top: 10px; text-align: center; font-size: 14px; color: ${t.dateMuted}; }`,
    `<div class="page">
  <div class="pf-top">
    <div class="pf-hello">皇后娘娘万福金安👑</div>
    <div class="pf-lead">我们在一起的第</div>
    <div class="pf-days">${esc(p.days)}<span class="u">天</span></div>
    <div class="pf-date">${esc(p.dateText)}</div>
  </div>

  <div class="pf-wx">
    ${cityCard(w.mine, true)}
    ${cityCard(w.ta, false)}
  </div>

  ${p.life.length ? `<div class="pf-sec">
    <span class="pf-title">生活指数</span>
    <div class="pf-life">${p.life
      .map((it) => `<div class="pf-life-row">
        <span class="pf-life-e">${esc(it.emoji)}</span>
        <span class="pf-life-l">${esc(it.label)}</span>
        <span class="pf-life-t">${esc(it.text)}</span>
      </div>`)
      .join('')}</div>
  </div>` : ''}

  ${a ? `<div class="pf-sec">
    <span class="pf-title">今日黄历</span>
    <div class="pf-hl">
      <div class="pf-yiji" style="margin-bottom:6px">
        <span style="font-weight:700;color:${t.accentDark}">${esc(a.lunar)}</span>
        <span style="color:${t.muted}">${esc(a.ganzhi)} · ${esc(a.zodiac)}</span>
      </div>
      ${yi}${ji}${facts}${grid}
    </div>
  </div>` : ''}

  ${p.loveWord ? `<div class="pf-quote">${esc(p.loveWord)}</div>` : ''}
  <div class="pf-sign">——${esc(p.signature)}</div>
  <div class="pf-foot">${esc(p.dateText)}</div>
</div>`
  );
}

/* ------------------------------------------------------------- 2. 票根 */

function ticket(p) {
  const w = p.weather;
  const a = p.almanac;
  const t = p.theme || DEFAULT_THEME;

  const row = (k, v) => (v ? `<div class="tk-row"><span class="tk-k">${esc(k)}</span><span class="tk-v">${esc(v)}</span></div>` : '');

  const wx = (x, mine) => (x ? `<div class="tk-wx${mine ? ' mine' : ''}">
    <div class="tk-city">${mine ? '出发地天气' : '到达地天气'}</div>
    <div class="tk-temp">${esc(x.min)}<i>°</i> / ${esc(x.max)}<i>°</i></div>
    <div class="tk-desc">${esc(x.icon)} ${esc(x.desc)}</div>
    <div class="tk-wind">${esc(x.wind)}</div>
  </div>` : '');

  const grid = a && a.hasGrid
    ? `<div class="tk-grid">${a.grid
      .map((c) => (c.center
        ? '<div class="tk-cell center"></div>'
        : `<div class="tk-cell${c.gods.length ? ' has' : ''}">
             <span class="tk-dir">${esc(c.short)}</span>
             ${c.gods.length ? `<span class="tk-gods">${c.gods.map((g) => `<i>${esc(g)}</i>`).join('')}</span>` : ''}
           </div>`))
      .join('')}</div>`
    : '';

  return page(
    `
  .page {
    display: flex;
    min-height: 900px;
    background: #fbf8f3;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
    color: #4a4238;
  }
  /* 左存根 */
  .tk-stub {
    flex: 0 0 132px;
    background: linear-gradient(180deg, #3f4b63, #2f3949);
    color: #f4efe6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 40px 0;
    position: relative;
  }
  .tk-stub-num {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .tk-stub-num small { display: block; font-size: 12px; letter-spacing: 4px; opacity: 0.66; font-weight: 400; margin-top: 4px; }
  .tk-stub-text {
    writing-mode: vertical-rl;
    font-size: 16px;
    letter-spacing: 8px;
    opacity: 0.86;
  }
  .tk-stub-mark {
    font-size: 12px;
    letter-spacing: 2px;
    opacity: 0.5;
    font-family: 'SF Mono', Consolas, monospace;
  }
  /* 齿孔撕线 */
  .tk-perf {
    flex: 0 0 2px;
    position: relative;
    background-image: linear-gradient(180deg, #d8cfc0 55%, transparent 55%);
    background-size: 2px 14px;
  }
  .tk-perf::before, .tk-perf::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fbf8f3;
  }
  .tk-perf::before { top: -11px; }
  .tk-perf::after { bottom: -11px; }
  /* 右正文 */
  .tk-main { flex: 1; padding: 38px 34px 30px; min-width: 0; }
  .tk-brand {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 14px;
    border-bottom: 3px double #c9bfae;
  }
  .tk-brand-name { font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #3f4b63; }
  .tk-brand-no {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 12px;
    letter-spacing: 1px;
    color: #8a8172;
  }
  .tk-route {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 24px;
  }
  .tk-from, .tk-to { flex: 1; }
  .tk-to { text-align: right; }
  .tk-route-city { font-size: 26px; font-weight: 800; color: #3f4b63; letter-spacing: 1px; }
  .tk-route-sub { font-size: 12px; letter-spacing: 2px; color: #9a9182; margin-top: 3px; }
  .tk-plane {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #b08d57;
    font-size: 18px;
  }
  .tk-plane::before, .tk-plane::after {
    content: '';
    width: 26px;
    border-top: 1px dashed currentColor;
  }
  .tk-sep { border: 0; border-top: 1px dashed #cfc6b5; margin: 22px 0; }
  .tk-wxs { display: flex; gap: 14px; }
  .tk-wx {
    flex: 1;
    background: #fff;
    border: 1px solid #e6dfd2;
    border-radius: 12px;
    padding: 16px 14px;
  }
  .tk-wx.mine { background: #fffdf9; box-shadow: 0 2px 0 #e6dfd2; }
  .tk-city { font-size: 14px; letter-spacing: 2px; color: #9a9182; }
  .tk-temp {
    margin-top: 6px;
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 30px;
    font-weight: 700;
    color: #3f4b63;
    letter-spacing: -1px;
  }
  .tk-temp i { font-style: normal; font-size: 17px; vertical-align: 6px; color: #a89f90; }
  .tk-desc { margin-top: 8px; font-size: 16px; }
  .tk-wind { margin-top: 4px; font-size: 13px; color: #9a9182; }
  .tk-sec-title {
    margin: 24px 0 12px;
    font-size: 13px;
    letter-spacing: 4px;
    color: #b08d57;
    font-weight: 700;
  }
  .tk-life { font-size: 15px; line-height: 1.85; }
  .tk-life-row { display: flex; gap: 10px; padding: 7px 0; border-bottom: 1px dotted #ddd5c6; }
  .tk-life-row:last-child { border-bottom: 0; }
  .tk-e { flex: 0 0 24px; }
  .tk-l { flex: 0 0 126px; font-weight: 700; color: #3f4b63; }
  .tk-tt { flex: 1; }
  .tk-almanac {
    background: #fff;
    border: 1px solid #e6dfd2;
    border-radius: 12px;
    padding: 16px;
  }
  .tk-yiji { display: flex; gap: 6px; flex-wrap: wrap; align-items: baseline; font-size: 14px; margin-bottom: 8px; }
  .tk-yi-tag {
    font-size: 12px; font-weight: 800; color: #fff; padding: 2px 7px; border-radius: 4px;
  }
  .tk-yi-tag.yi { background: #5aa87c; }
  .tk-yi-tag.ji { background: #c56a63; }
  .tk-yiji i { font-style: normal; border: 1px solid #e6dfd2; padding: 2px 7px; border-radius: 4px; }
  .tk-row { display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; }
  .tk-k { color: #9a9182; }
  .tk-v { font-weight: 700; color: #3f4b63; }
  .tk-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 44px;
    gap: 5px;
    margin-top: 12px;
  }
  .tk-cell {
    position: relative;
    border: 1px solid #e6dfd2;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #8a8172;
  }
  .tk-cell.center { border: 0; }
  .tk-cell.has { border-color: #cbb98f; background: #fdfaf3; }
  .tk-gods {
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
  }
  .tk-gods i {
    font-style: normal;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    background: #b08d57;
    padding: 1px 4px;
    border-radius: 3px;
    white-space: nowrap;
  }
  .tk-quote {
    margin-top: 22px;
    padding: 16px 18px;
    border-left: 3px solid #b08d57;
    background: #fdfaf3;
    font-size: 16px;
    line-height: 1.9;
    color: #5d5344;
    text-align: justify;
  }
  .tk-sign {
    margin-top: 18px;
    text-align: right;
    font-size: 17px;
    color: #3f4b63;
  }
  .tk-foot {
    margin-top: 20px;
    padding-top: 14px;
    border-top: 3px double #c9bfae;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .tk-date { font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #9a9182; }
  .tk-barcode {
    width: 168px;
    height: 40px;
    background-image: repeating-linear-gradient(
      90deg,
      #3f4b63 0 2px, transparent 2px 4px,
      #3f4b63 4px 5px, transparent 5px 9px,
      #3f4b63 9px 12px, transparent 12px 14px
    );
    opacity: 0.85;
  }`,
    `<div class="page">
  <div class="tk-stub">
    <div class="tk-stub-num">${esc(p.days)}<small>DAYS</small></div>
    <div class="tk-stub-text">请 安 券</div>
    <div class="tk-stub-mark">NO.${esc(p.date ? p.date.text.replace(/\./g, '') : '')}</div>
  </div>
  <div class="tk-perf"></div>
  <div class="tk-main">
    <div class="tk-brand">
      <span class="tk-brand-name">每日请安</span>
      <span class="tk-brand-no">ISSUE ${esc(p.days)} · ONE WAY</span>
    </div>

    <div class="tk-route">
      <div class="tk-from">
        <div class="tk-route-city">${esc(w.mine.head)}</div>
        <div class="tk-route-sub">FROM</div>
      </div>
      <div class="tk-plane">✈</div>      <div class="tk-to">
        <div class="tk-route-city">${esc(w.ta ? w.ta.head : '你心里')}</div>
        <div class="tk-route-sub">TO</div>
      </div>
    </div>

    <hr class="tk-sep" />

    <div class="tk-wxs">
      ${wx(w.mine, true)}
      ${wx(w.ta, false)}
    </div>

    ${p.life.length ? `<div class="tk-sec-title">生 活 指 数</div>
    <div class="tk-life">${p.life
      .map((it) => `<div class="tk-life-row">
        <span class="tk-e">${esc(it.emoji)}</span>
        <span class="tk-l">${esc(it.label)}</span>
        <span class="tk-tt">${esc(it.text)}</span>
      </div>`)
      .join('')}</div>` : ''}

    ${a ? `<div class="tk-sec-title">今 日 黄 历</div>
    <div class="tk-almanac">
      <div class="tk-yiji">
        <span class="tk-yi-tag yi">宜</span>${a.yi.map((x) => `<i>${esc(x)}</i>`).join('')}
      </div>
      <div class="tk-yiji">
        <span class="tk-yi-tag ji">忌</span>${a.ji.map((x) => `<i>${esc(x)}</i>`).join('')}
      </div>
      ${a.facts.map((f) => row(f.k, f.v)).join('')}
      ${grid}
    </div>` : ''}

    ${p.loveWord ? `<div class="tk-quote">${esc(p.loveWord)}</div>` : ''}
    <div class="tk-sign">——${esc(p.signature)}</div>

    <div class="tk-foot">
      <span class="tk-date">${esc(p.dateText)}</span>
      <div class="tk-barcode"></div>
    </div>
  </div>
</div>`
  );
}

/* --------------------------------------------------------- 3. 日记本 */

function diary(p) {
  const w = p.weather;
  const a = p.almanac;
  const LINE = 40;

  const holes = Array.from({ length: 9 })
    .map(() => '<span class="dy-hole"></span>')
    .join('');

  const wx = (x, mine) => (x ? `<div class="dy-city${mine ? ' mine' : ''}">
    <div class="dy-city-head">${esc(x.head)}</div>
    <div class="dy-city-main">
      <span class="dy-city-icon">${esc(x.icon)}</span>
      <span class="dy-city-temp">${esc(x.min)}～${esc(x.max)}℃</span>
    </div>
    <div class="dy-city-desc">${esc(x.desc)} ${esc(x.wind)}</div>
  </div>` : '');

  const grid = a && a.hasGrid
    ? `<table class="dy-grid">${[0, 1, 2]
      .map((r) => `<tr>${a.grid
        .slice(r * 3, r * 3 + 3)
        .map((c) => (c.center
          ? '<td class="center"></td>'
          : `<td class="${c.gods.length ? 'has' : ''}">${c.gods.map((g) => `<b>${esc(g)}</b>`).join('')}<span>${esc(c.short)}</span></td>`))
        .join('')}</tr>`)
      .join('')}</table>`
    : '';

  return page(
    `
  .page {
    position: relative;
    background-color: #fdfbf5;
    background-image:
      repeating-linear-gradient(180deg, transparent 0 ${LINE - 1}px, rgba(150,175,205,0.34) ${LINE - 1}px ${LINE}px);
    background-position: 0 128px;
    padding: 56px 52px 60px 96px;
    font-family: ${WENKAI}, 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif CJK SC', serif;
    color: #3e4a5c;
    font-size: 17px;
    line-height: ${LINE}px;
  }
  /* 左侧装订孔 + 红色页边线 */
  .dy-holes {
    position: absolute;
    left: 30px;
    top: 70px;
    bottom: 70px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .dy-hole {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #efeade;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.18);
  }
  .page::before {
    content: '';
    position: absolute;
    left: 74px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(198,90,90,0.5);
  }
  .dy-date {
    float: right;
    font-size: 15px;
    color: #8b97a8;
    letter-spacing: 1px;
    line-height: ${LINE}px;
  }
  .dy-head {
    font-size: 27px;
    font-weight: 700;
    color: #2f3a4a;
    line-height: ${LINE}px;
    letter-spacing: 1px;
  }
  .dy-day {
    font-size: 15px;
    color: #8b97a8;
    line-height: ${LINE}px;
    letter-spacing: 2px;
  }
  .dy-p {
    text-indent: 2em;
    text-align: justify;
    line-height: ${LINE}px;
    margin: 0;
  }
  .dy-wxs { display: flex; gap: 26px; margin: ${LINE / 2}px 0 ${LINE}px; text-indent: 0; }
  .dy-city { flex: 1; }
  .dy-city.mine { border-right: 1px dashed rgba(150,175,205,0.7); padding-right: 22px; }
  .dy-city-head { font-size: 15px; color: #8b97a8; letter-spacing: 2px; }
  .dy-city-main { display: flex; align-items: center; gap: 8px; }
  .dy-city-icon { font-size: 26px; line-height: 1; }
  .dy-city-temp { font-size: 26px; font-weight: 700; color: #33445c; }
  .dy-city-desc { font-size: 15px; color: #6b7a8f; line-height: ${LINE - 8}px; }
  .dy-pol {
    display: inline-block;
    padding: 0 10px;
    border: 1px solid rgba(150,175,205,0.9);
    border-radius: 3px;
    font-size: 14px;
    line-height: 26px;
    color: #4a5a70;
    margin-right: 8px;
  }
  .dy-hl {
    margin-top: ${LINE / 2}px;
    padding: ${LINE / 3}px 0 ${LINE / 3}px 20px;
    border-left: 3px double rgba(150,175,205,0.9);
    line-height: ${LINE - 6}px;
    font-size: 15.5px;
  }
  .dy-hl b { color: #2f3a4a; }
  .dy-grid {
    width: 260px;
    border-collapse: collapse;
    margin-top: 8px;
    line-height: 1.4;
  }
  .dy-grid td {
    border: 1px solid rgba(150,175,205,0.55);
    width: 33.33%;
    height: 38px;
    text-align: center;
    vertical-align: middle;
    font-size: 13px;
    color: #7b8a9e;
  }
  .dy-grid td.center { border: 0; }
  .dy-grid td.has { background: rgba(210,224,240,0.42); }
  .dy-grid td b { display: block; font-size: 10px; color: #3a4a60; font-weight: 700; }
  .dy-q {
    margin-top: ${LINE / 2}px;
    text-indent: 0;
    font-size: 18px;
    color: #46536a;
    line-height: ${LINE}px;
  }
  .dy-sign {
    text-align: right;
    margin-top: ${LINE / 4}px;
    font-size: 18px;
    color: #33445c;
  }`,
    `<div class="page">
  <div class="dy-holes">${holes}</div>
  <div class="dy-date">${esc(p.dateText)}</div>
  <div class="dy-head">皇后娘娘万福金安👑</div>
  <div class="dy-day">我们在一起的第 ${esc(p.days)} 天</div>

  <p class="dy-p">今天也照旧向你问安。天凉了记得添衣，我在这边替你看着天气。</p>

  <div class="dy-wxs">
    ${wx(w.mine, true)}
    ${wx(w.ta, false)}
  </div>

  ${p.life.length ? `<div class="dy-p">今日诸事，都替你看过了：</div>
  ${p.life
    .map((it) => `<p class="dy-p"><span class="dy-pol">${esc(it.emoji)} ${esc(it.label)}</span>${esc(it.text)}</p>`)
    .join('')}` : ''}

  ${a ? `<div class="dy-hl">
    <b>${esc(a.lunar)}</b> · ${esc(a.ganzhi)} · 属${esc(a.zodiac)}${a.jieqi ? ` · ${esc(a.jieqi)}` : ''}<br />
    宜：${a.yi.map((x) => esc(x)).join('、')}<br />
    忌：${a.ji.map((x) => esc(x)).join('、')}<br />
    ${a.facts.map((f) => `${esc(f.k)} ${esc(f.v)}`).join(' · ')}
    ${grid}
  </div>` : ''}

  ${p.loveWord ? `<p class="dy-q">「${esc(p.loveWord)}」</p>` : ''}
  <div class="dy-sign">——${esc(p.signature)}</div>
</div>`
  );
}

/* ----------------------------------------------------------- 4. 极简 */

function minimal(p) {
  const w = p.weather;
  const a = p.almanac;

  const wx = (x, mine) => (x ? `<div class="mn-city${mine ? ' mine' : ''}">
    <div class="mn-city-name">${esc(x.head)}</div>
    <div class="mn-city-temp">${esc(x.min)} / ${esc(x.max)}<i>°C</i></div>
    <div class="mn-city-desc">${esc(x.icon)} ${esc(x.desc)}</div>
    <div class="mn-city-wind">${esc(x.wind)}</div>
  </div>` : '');

  return page(
    `
  .page {
    background: #ffffff;
    padding: 78px 76px 66px;
    color: #2b2b2b;
    font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
    letter-spacing: 0.4px;
  }
  .mn-rule { height: 1px; background: #1a1a1a; }
  .mn-rule.thin { background: #d8d8d8; }
  .mn-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; letter-spacing: 3px; color: #8a8a8a; padding-bottom: 14px; }
  .mn-kicker { margin-top: 44px; font-size: 12px; letter-spacing: 6px; color: #9a9a9a; }
  .mn-days {
    margin-top: 8px;
    font-size: 92px;
    font-weight: 200;
    line-height: 1;
    letter-spacing: -3px;
    color: #111;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .mn-days span { font-size: 26px; letter-spacing: 2px; font-weight: 300; margin-left: 10px; color: #555; }
  .mn-hello { margin-top: 22px; font-size: 18px; letter-spacing: 4px; color: #333; }
  .mn-block { margin-top: 46px; }
  .mn-label { font-size: 11px; letter-spacing: 5px; color: #a0a0a0; padding-bottom: 10px; }
  .mn-wx { display: flex; gap: 0; }
  .mn-city { flex: 1; padding: 18px 0; }
  .mn-city.mine { padding-right: 26px; border-right: 1px solid #e4e4e4; }
  .mn-city:not(.mine) { padding-left: 26px; }
  .mn-city-name { font-size: 15px; letter-spacing: 2px; color: #555; }
  .mn-city-temp { margin-top: 6px; font-size: 34px; font-weight: 300; letter-spacing: -1px; color: #111; }
  .mn-city-temp i { font-style: normal; font-size: 15px; letter-spacing: 0; color: #777; margin-left: 2px; }
  .mn-city-desc { margin-top: 6px; font-size: 15px; color: #333; }
  .mn-city-wind { margin-top: 2px; font-size: 13px; color: #8f8f8f; }
  .mn-life-row { display: flex; gap: 18px; padding: 15px 0; border-bottom: 1px solid #eee; font-size: 15px; line-height: 1.85; }
  .mn-life-row:last-child { border-bottom: 0; }
  .mn-life-l { flex: 0 0 140px; letter-spacing: 1px; color: #111; }
  .mn-life-t { flex: 1; color: #4a4a4a; text-align: justify; }
  .mn-hl { display: flex; gap: 34px; font-size: 14px; line-height: 2; color: #444; }
  .mn-hl-col { flex: 1; }
  .mn-hl-k { font-size: 11px; letter-spacing: 4px; color: #a0a0a0; }
  .mn-yiji { margin-bottom: 10px; }
  .mn-yiji span.k { display: inline-block; width: 22px; color: #111; font-weight: 600; }
  .mn-fact { display: flex; justify-content: space-between; border-bottom: 1px dotted #ddd; padding: 2px 0; }
  .mn-fact span:first-child { color: #8f8f8f; }
  .mn-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 40px; gap: 3px; margin-top: 6px; }
  .mn-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #eee; font-size: 12px; color: #777; }
  .mn-cell.center { border: 0; }
  .mn-cell.has { border-color: #cfcfcf; }
  .mn-cell b { font-size: 9px; color: #333; font-weight: 600; letter-spacing: 0; }
  .mn-quote {
    margin-top: 48px;
    font-size: 21px;
    line-height: 2;
    letter-spacing: 0.6px;
    color: #1a1a1a;
    text-align: justify;
    padding-left: 22px;
    border-left: 2px solid #111;
  }
  .mn-sign { margin-top: 30px; text-align: right; font-size: 16px; letter-spacing: 3px; color: #333; }
  .mn-foot { margin-top: 36px; padding-top: 14px; font-size: 12px; letter-spacing: 2px; color: #9a9a9a; text-align: center; }`,
    `<div class="page">
  <div class="mn-top">
    <span>DAILY LETTER</span>
    <span>${esc(p.date ? p.date.text : '')}</span>
  </div>
  <div class="mn-rule"></div>

  <div class="mn-kicker">TOGETHER</div>
  <div class="mn-days">${esc(p.days)}<span>天</span></div>
  <div class="mn-hello">皇后娘娘万福金安👑</div>

  <div class="mn-block">
    <div class="mn-label">WEATHER</div>
    <div class="mn-rule thin"></div>
    <div class="mn-wx">
      ${wx(w.mine, true)}
      ${wx(w.ta, false)}
    </div>
  </div>

  ${p.life.length ? `<div class="mn-block">
    <div class="mn-label">LIFE</div>
    <div class="mn-rule thin"></div>
    ${p.life
      .map((it) => `<div class="mn-life-row">
        <span class="mn-life-l">${esc(it.emoji)} ${esc(it.label)}</span>
        <span class="mn-life-t">${esc(it.text)}</span>
      </div>`)
      .join('')}
  </div>` : ''}

  ${a ? `<div class="mn-block">
    <div class="mn-label">ALMANAC</div>
    <div class="mn-rule thin"></div>
    <div class="mn-hl">
      <div class="mn-hl-col">
        <div class="mn-yiji"><span class="k">宜</span>${a.yi.map((x) => esc(x)).join('、')}</div>
        <div class="mn-yiji"><span class="k">忌</span>${a.ji.map((x) => esc(x)).join('、')}</div>
        ${a.facts.map((f) => `<div class="mn-fact"><span>${esc(f.k)}</span><span>${esc(f.v)}</span></div>`).join('')}
      </div>
      <div class="mn-hl-col">
        <div class="mn-hl-k">${esc(a.lunar)} · ${esc(a.ganzhi)}</div>
        <div class="mn-grid">${a.grid
          .map((c) => (c.center
            ? '<div class="mn-cell center"></div>'
            : `<div class="mn-cell${c.gods.length ? ' has' : ''}">${c.gods.map((g) => `<b>${esc(g)}</b>`).join('')}<span>${esc(c.short)}</span></div>`))
          .join('')}</div>
      </div>
    </div>
  </div>` : ''}

  ${p.loveWord ? `<div class="mn-quote">${esc(p.loveWord)}</div>` : ''}
  <div class="mn-sign">——${esc(p.signature)}</div>
  <div class="mn-foot">${esc(p.dateText)}</div>
</div>`
  );
}

/* ----------------------------------------------------------- 5. 杂志 */

function magazine(p) {
  const w = p.weather;
  const a = p.almanac;

  const wx = (x, mine) => (x ? `<div class="mg-city${mine ? ' mine' : ''}">
    <div class="mg-city-name">${esc(x.head)}<i>${esc(x.icon)}</i></div>
    <div class="mg-city-temp">${esc(x.min)}<em>°</em> — ${esc(x.max)}<em>°</em></div>
    <div class="mg-city-desc">${esc(x.desc)}</div>
    <div class="mg-city-wind">${esc(x.wind)}</div>
  </div>` : '');

  const grid = a && a.hasGrid
    ? `<div class="mg-grid">${a.grid
      .map((c) => (c.center
        ? '<div class="mg-cell center"></div>'
        : `<div class="mg-cell${c.gods.length ? ' has' : ''}">
             <span class="mg-dir">${esc(c.short)}</span>
             ${c.gods.length ? `<span class="mg-gods">${c.gods.map((g) => `<i>${esc(g)}</i>`).join('')}</span>` : ''}
           </div>`))
      .join('')}</div>`
    : '';

  return page(
    `
  .page {
    background: #f7f4ee;
    padding: 46px 52px 52px;
    color: #22201d;
    font-family: 'Georgia', 'Songti SC', 'SimSun', 'Noto Serif CJK SC', serif;
  }
  .mg-mast {
    border-top: 6px solid #1f1d1a;
    border-bottom: 2px solid #1f1d1a;
    padding: 14px 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .mg-name {
    font-size: 40px;
    font-weight: 900;
    letter-spacing: 6px;
    line-height: 1;
    font-family: 'Georgia', 'Songti SC', serif;
  }
  .mg-name em { font-style: normal; color: #9c2b2b; }
  .mg-issue {
    font-size: 11px;
    letter-spacing: 3px;
    text-align: right;
    line-height: 1.7;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #6a655c;
  }
  .mg-hero { margin-top: 30px; }
  .mg-kicker {
    font-size: 11px;
    letter-spacing: 5px;
    color: #9c2b2b;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .mg-headline {
    margin-top: 10px;
    font-size: 46px;
    font-weight: 900;
    line-height: 1.25;
    letter-spacing: 1px;
  }
  .mg-headline b { color: #9c2b2b; font-size: 62px; }
  .mg-dek {
    margin-top: 12px;
    font-size: 16px;
    line-height: 1.85;
    color: #55504a;
    text-align: justify;
    column-rule: 1px solid #d6cfc2;
  }
  .mg-thin { height: 1px; background: #cfc7b8; margin: 26px 0 0; }
  .mg-cols { display: flex; gap: 30px; margin-top: 22px; }
  .mg-col { flex: 1; min-width: 0; }
  .mg-col.left { border-right: 1px solid #d6cfc2; padding-right: 30px; }
  .mg-sect {
    font-size: 11px;
    letter-spacing: 4px;
    color: #9c2b2b;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    padding-bottom: 8px;
    border-bottom: 2px solid #1f1d1a;
  }
  .mg-city { padding: 14px 0; border-bottom: 1px dotted #c6bfb1; }
  .mg-city:last-of-type { border-bottom: 0; }
  .mg-city-name { font-size: 15px; letter-spacing: 2px; color: #3a3630; }
  .mg-city-name i { font-style: normal; margin-left: 6px; }
  .mg-city-temp {
    margin-top: 2px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -1px;
    font-family: 'Georgia', serif;
  }
  .mg-city-temp em { font-style: normal; font-size: 16px; font-weight: 400; color: #8a8378; }
  .mg-city-desc { font-size: 15px; color: #4a453e; }
  .mg-city-wind { font-size: 13px; color: #8a8378; margin-top: 2px; }
  .mg-life-row { padding: 12px 0; border-bottom: 1px dotted #c6bfb1; font-size: 14.5px; line-height: 1.8; }
  .mg-life-row:last-child { border-bottom: 0; }
  .mg-life-l { font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 3px; color: #2b2823; }
  .mg-life-t { color: #4f4a43; text-align: justify; }
  .mg-yiji { font-size: 14.5px; line-height: 2; }
  .mg-yiji b {
    display: inline-block;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    background: #1f1d1a;
    color: #f7f4ee;
    font-size: 12px;
    border-radius: 2px;
    margin-right: 6px;
  }
  .mg-yiji b.ji { background: #9c2b2b; }
  .mg-facts { margin-top: 14px; font-size: 13.5px; line-height: 2; color: #4f4a43; }
  .mg-facts span { display: inline-block; margin-right: 12px; }
  .mg-facts span i { font-style: normal; color: #8a8378; margin-right: 4px; }
  .mg-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 42px;
    gap: 4px;
    margin-top: 12px;
  }
  .mg-cell {
    position: relative;
    border: 1px solid #cfc7b8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #7a7368;
  }
  .mg-cell.center { border: 0; }
  .mg-cell.has { background: #efe9dd; border-color: #b8ad99; }
  .mg-gods {
    position: absolute;
    top: -7px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
  }
  .mg-gods i {
    font-style: normal;
    font-size: 9px;
    font-weight: 700;
    color: #f7f4ee;
    background: #9c2b2b;
    padding: 1px 4px;
    letter-spacing: 0;
    white-space: nowrap;
  }
  .mg-pull {
    margin-top: 30px;
    padding: 24px 26px;
    background: #1f1d1a;
    color: #f3efe6;
    font-size: 21px;
    line-height: 1.9;
    text-align: justify;
    letter-spacing: 0.5px;
  }
  .mg-pull::before { content: '\\201C'; font-size: 44px; color: #9c2b2b; line-height: 0; vertical-align: -16px; margin-right: 8px; }
  .mg-sign { margin-top: 22px; text-align: right; font-size: 18px; letter-spacing: 2px; }
  .mg-foot {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 2px solid #1f1d1a;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    letter-spacing: 3px;
    color: #6a655c;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }`,
    `<div class="page">
  <div class="mg-mast">
    <div class="mg-name">每<em>日</em>请安</div>
    <div class="mg-issue">
      NO.${esc(p.days)}<br />
      ${esc(p.date ? p.date.text : '')}
    </div>
  </div>

  <div class="mg-hero">
    <div class="mg-kicker">TOGETHER · DAY ${esc(p.days)}</div>
    <div class="mg-headline">第 <b>${esc(p.days)}</b> 天，<br />皇后娘娘万福金安👑</div>
    <div class="mg-dek">今天也替你把两边的天气看了一遍，添衣、带伞、按时吃饭，这些琐事我都记着。</div>
  </div>

  <div class="mg-thin"></div>

  <div class="mg-cols">
    <div class="mg-col left">
      <div class="mg-sect">WEATHER</div>
      ${wx(w.mine, true)}
      ${wx(w.ta, false)}
      ${p.life.length ? `<div class="mg-sect" style="margin-top:22px">LIFE</div>
      ${p.life
        .map((it) => `<div class="mg-life-row">
          <span class="mg-life-l">${esc(it.emoji)} ${esc(it.label)}</span>
          <span class="mg-life-t">${esc(it.text)}</span>
        </div>`)
        .join('')}` : ''}
    </div>

    <div class="mg-col">
      ${a ? `<div class="mg-sect">ALMANAC</div>
      <div class="mg-yiji" style="margin-top:12px">
        <b>宜</b>${a.yi.map((x) => esc(x)).join('、')}<br />
        <b class="ji">忌</b>${a.ji.map((x) => esc(x)).join('、')}
      </div>
      <div class="mg-facts">
        ${a.facts.map((f) => `<span><i>${esc(f.k)}</i>${esc(f.v)}</span>`).join('')}
        <span><i>农历</i>${esc(a.lunar)}</span>
        <span><i>干支</i>${esc(a.ganzhi)}</span>
      </div>
      ${grid}` : ''}
    </div>
  </div>

  ${p.loveWord ? `<div class="mg-pull">${esc(p.loveWord)}</div>` : ''}
  <div class="mg-sign">——${esc(p.signature)}</div>

  <div class="mg-foot">
    <span>${esc(p.dateText)}</span>
    <span>DAILY LETTER · ${esc(p.days)}</span>
  </div>
</div>`
  );
}

/* ------------------------------------------------------- 6. 圣旨（卷轴） */

function edict(p) {
  const w = p.weather;
  const a = p.almanac;

  const wxCell = (x, mine) => (x ? `<div class="ed-wx-cell${mine ? ' mine' : ''}">
    <div class="ed-wx-city">${esc(x.head)}</div>
    <div class="ed-wx-desc">${esc(x.icon)} ${esc(x.desc)}</div>
    <div class="ed-wx-temp">${esc(x.min)}<i>℃</i> / ${esc(x.max)}<i>℃</i></div>
    <div class="ed-wx-wind">${esc(x.wind)}</div>
  </div>` : '');

  const grid =
    a && a.hasGrid
      ? `<div class="ed-grid">${a.grid
        .map((c) => (c.center
          ? '<div class="ed-cell center"></div>'
          : `<div class="ed-cell${c.gods.length ? ' has' : ''}">
                 ${c.gods.length ? `<span class="ed-gods">${c.gods.map((g) => `<b>${esc(g)}</b>`).join('')}</span>` : ''}
                 <span class="ed-dir">${esc(c.short)}</span>
               </div>`))
        .join('')}</div>`
      : '';

  const chips = (list, cls) =>
    (list || []).map((x) => `<span class="ed-chip ${cls}">${esc(x)}</span>`).join('');

  return page(
    `
  .page {
    background: #6b1a15;
    padding: 30px 22px 36px;
    font-family: ${WENKAI}, 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif CJK SC', serif;
    color: #5a2a10;
  }
  /* 上下卷轴轴心 */
  .ed-rod {
    height: 20px;
    border-radius: 10px;
    background: linear-gradient(180deg, #7a4620, #4b2611 58%, #341a09);
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    position: relative;
    margin: 0 2px;
  }
  .ed-rod::before, .ed-rod::after {
    content: '';
    position: absolute;
    top: -6px;
    width: 15px;
    height: 32px;
    border-radius: 4px;
    background: linear-gradient(180deg, #f0d27c, #b98f2e 55%, #8a681c);
    box-shadow: 0 2px 5px rgba(0,0,0,0.35);
  }
  .ed-rod::before { left: -8px; }
  .ed-rod::after { right: -8px; }
  /* 绫锦本体 */
  .ed-silk {
    margin: 0 10px;
    background:
      repeating-linear-gradient(45deg, rgba(184,134,47,0.07) 0 8px, transparent 8px 16px),
      linear-gradient(180deg, #fdf3cd 0%, #f8e4ab 42%, #f2d894 100%);
    border-left: 2px solid #c9a34a;
    border-right: 2px solid #c9a34a;
    padding: 34px 30px 40px;
    position: relative;
  }
  .ed-frame {
    border: 3px double #b8862f;
    padding: 26px 22px 30px;
    position: relative;
  }
  .ed-corner {
    position: absolute;
    font-size: 15px;
    opacity: 0.5;
  }
  .ed-corner.tl { top: 4px; left: 6px; }
  .ed-corner.tr { top: 4px; right: 6px; }
  .ed-corner.bl { bottom: 4px; left: 6px; }
  .ed-corner.br { bottom: 4px; right: 6px; }
  /* 诏曰抬头 */
  .ed-open { text-align: center; padding: 4px 0 2px; }
  .ed-open .l {
    display: block;
    font-size: 29px;
    letter-spacing: 13px;
    text-indent: 13px;
    color: #8a1f18;
    line-height: 1.5;
    font-weight: 700;
  }
  .ed-open .l2 { font-size: 25px; letter-spacing: 10px; text-indent: 10px; margin-top: 2px; }
  .ed-dragon {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 14px 0 4px;
    color: #b8862f;
  }
  .ed-dragon::before, .ed-dragon::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a34a, transparent);
  }
  .ed-dragon span { font-size: 17px; }
  /* 各段 */
  .ed-sec { margin-top: 22px; }
  .ed-label {
    display: inline-block;
    font-size: 14px;
    letter-spacing: 4px;
    color: #8a1f18;
    background: rgba(184,134,47,0.16);
    border: 1px solid rgba(184,134,47,0.5);
    border-radius: 3px;
    padding: 3px 10px;
    margin-bottom: 12px;
  }
  .ed-hint { font-size: 13px; color: #9a6b3a; margin-left: 6px; letter-spacing: 1px; }
  .ed-wx { display: flex; gap: 14px; }
  .ed-wx-cell {
    flex: 1;
    background: rgba(255,251,235,0.72);
    border: 1px solid rgba(184,134,47,0.45);
    border-radius: 5px;
    padding: 14px 12px;
    text-align: center;
  }
  .ed-wx-cell.mine { background: rgba(255,253,244,0.92); }
  .ed-wx-city { font-size: 17px; font-weight: 700; color: #6b3a12; letter-spacing: 2px; }
  .ed-wx-desc { margin-top: 6px; font-size: 16px; color: #8a5a24; }
  .ed-wx-temp { margin-top: 4px; font-size: 26px; font-weight: 700; color: #a8371d; letter-spacing: -1px; }
  .ed-wx-temp i { font-style: normal; font-size: 14px; vertical-align: 4px; color: #9a6b3a; }
  .ed-wx-wind { margin-top: 3px; font-size: 14px; color: #9a7346; }
  /* 起居注样式条目 */
  .ed-life { }
  .ed-life-row {
    display: flex;
    gap: 10px;
    padding: 11px 0;
    border-bottom: 1px dotted rgba(184,134,47,0.55);
    font-size: 15.5px;
    line-height: 1.85;
  }
  .ed-life-row:last-child { border-bottom: 0; }
  .ed-life-e { flex: 0 0 24px; }
  .ed-life-l { flex: 0 0 150px; color: #8a1f18; font-weight: 700; letter-spacing: 0.5px; }
  .ed-life-t { flex: 1; color: #5a2a10; text-align: justify; }
  /* 黄历 */
  .ed-yiji { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; margin-bottom: 9px; font-size: 15px; }
  .ed-badge {
    font-size: 13px;
    font-weight: 700;
    color: #fdf3cd;
    padding: 2px 8px;
    border-radius: 3px;
    letter-spacing: 1px;
  }
  .ed-badge.yi { background: #7a6a2a; }
  .ed-badge.ji { background: #a8371d; }
  .ed-chip {
    border: 1px solid rgba(184,134,47,0.6);
    background: rgba(255,251,235,0.8);
    border-radius: 3px;
    padding: 2px 8px;
    font-size: 14.5px;
  }
  .ed-facts { display: flex; gap: 8px; margin: 12px 0; }
  .ed-fact {
    flex: 1;
    text-align: center;
    background: rgba(255,251,235,0.8);
    border: 1px solid rgba(184,134,47,0.4);
    border-radius: 4px;
    padding: 8px 4px;
  }
  .ed-fact b { display: block; font-size: 12px; color: #9a6b3a; font-weight: 400; letter-spacing: 2px; }
  .ed-fact span { display: block; margin-top: 3px; font-size: 16px; font-weight: 700; color: #6b3a12; }
  .ed-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 49px;
    gap: 5px;
    margin-top: 6px;
  }
  .ed-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(184,134,47,0.42);
    border-radius: 3px;
    background: rgba(255,251,235,0.6);
    font-size: 15px;
    color: #8a6b3a;
  }
  .ed-cell.center { border: 0; background: transparent; }
  .ed-cell.has { background: rgba(240,216,148,0.62); border-color: #b8862f; }
  .ed-gods {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
  }
  .ed-gods b {
    font-size: 10px;
    font-weight: 700;
    color: #fdf3cd;
    background: #a8371d;
    padding: 2px 5px;
    border-radius: 2px;
    white-space: nowrap;
    letter-spacing: 0;
  }
  /* 御笔情话 */
  .ed-quote {
    margin-top: 20px;
    padding: 20px 22px;
    background: rgba(255,251,235,0.86);
    border: 1px solid rgba(184,134,47,0.55);
    border-left: 4px solid #a8371d;
    font-size: 19px;
    line-height: 2;
    color: #6b3a12;
    text-align: justify;
  }
  .ed-quote-label {
    font-size: 13px;
    letter-spacing: 3px;
    color: #8a1f18;
    display: block;
    margin-bottom: 6px;
  }
  /* 收尾：钦此 + 宝玺 */
  .ed-end {
    margin-top: 26px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
  }
  .ed-qinci {
    font-size: 27px;
    letter-spacing: 12px;
    text-indent: 12px;
    color: #8a1f18;
    font-weight: 700;
  }
  .ed-sign { font-size: 18px; color: #6b3a12; text-align: right; flex: 1; }
  .ed-seal {
    flex: 0 0 auto;
    width: 88px;
    height: 88px;
    background: #a8371d;
    color: #fdf3cd;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    font-size: 19px;
    line-height: 1.25;
    letter-spacing: 2px;
    transform: rotate(-5deg);
    box-shadow: inset 0 0 0 2px rgba(253,243,205,0.8), 0 3px 8px rgba(107,26,21,0.28);
    opacity: 0.94;
  }
  .ed-seal span { display: block; white-space: nowrap; }
  .ed-foot {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(184,134,47,0.5);
    text-align: center;
    font-size: 14px;
    color: #9a7346;
    letter-spacing: 1px;
  }`,
    `<div class="page">
  <div class="ed-rod"></div>

  <div class="ed-silk">
    <div class="ed-frame">
      <span class="ed-corner tl">🐉</span>
      <span class="ed-corner tr">🐉</span>
      <span class="ed-corner bl">🐉</span>
      <span class="ed-corner br">🐉</span>

      <div class="ed-open">
        <span class="l">奉天承运</span>
        <span class="l l2">皇帝诏曰</span>
      </div>

      <div class="ed-dragon"><span>❖</span></div>

      <div class="ed-sec" style="margin-top:16px">
        <div class="ed-label">钦天监奏<span class="ed-hint">两地天时</span></div>
        <div class="ed-wx">
          ${wxCell(w.mine, true)}
          ${wxCell(w.ta, false)}
        </div>
      </div>

      ${p.life.length
        ? `<div class="ed-sec">
        <div class="ed-label">内务府奏<span class="ed-hint">今日起居</span></div>
        <div class="ed-life">${p.life
          .map((it) => `<div class="ed-life-row">
                 <span class="ed-life-e">${esc(it.emoji)}</span>
                 <span class="ed-life-l">${esc(it.label)}</span>
                 <span class="ed-life-t">${esc(it.text)}</span>
               </div>`)
          .join('')}</div>
      </div>`
        : ''}

      ${a
        ? `<div class="ed-sec">
        <div class="ed-label">司天监择吉<span class="ed-hint">${esc(a.lunar)} · ${esc(a.ganzhi)}</span></div>
        <div class="ed-yiji">
          <span class="ed-badge yi">宜</span>${chips(a.yi, 'yi')}
        </div>
        <div class="ed-yiji">
          <span class="ed-badge ji">忌</span>${chips(a.ji, 'ji')}
        </div>
        <div class="ed-facts">
          ${a.facts.map((f) => `<div class="ed-fact"><b>${esc(f.k)}</b><span>${esc(f.v)}</span></div>`).join('')}
        </div>
        ${grid}
      </div>`
        : ''}

      ${p.loveWord
        ? `<div class="ed-quote">
        <span class="ed-quote-label">御 笔</span>
        ${esc(p.loveWord)}
      </div>`
        : ''}

      <div class="ed-end">
        <div class="ed-qinci">钦此</div>
        <div class="ed-sign">——${esc(p.signature)}</div>
        <div class="ed-seal"><span>皇帝</span><span>之宝</span></div>
      </div>

      <div class="ed-foot">${esc(p.dateText)} · 第 ${esc(p.days)} 道</div>
    </div>
  </div>

  <div class="ed-rod"></div>
</div>`
  );
}

/* --------------------------------------------------------- 7. 奏章（折子） */

function memorial(p) {
  const w = p.weather;
  const a = p.almanac;

  const wxCell = (x, mine) => (x ? `<div class="mm-wx-cell${mine ? ' mine' : ''}">
    <div class="mm-wx-city">${esc(x.head)}</div>
    <div class="mm-wx-desc">${esc(x.icon)} ${esc(x.desc)}</div>
    <div class="mm-wx-temp">${esc(x.min)}℃ ～ ${esc(x.max)}℃</div>
    <div class="mm-wx-wind">${esc(x.wind)}</div>
  </div>` : '');

  const grid =
    a && a.hasGrid
      ? `<div class="mm-grid">${a.grid
        .map((c) => (c.center
          ? '<div class="mm-cell center"></div>'
          : `<div class="mm-cell${c.gods.length ? ' has' : ''}">
                 <span class="mm-dir">${esc(c.short)}</span>
                 ${c.gods.length ? `<span class="mm-gods">${c.gods.map((g) => `<b>${esc(g)}</b>`).join('')}</span>` : ''}
               </div>`))
        .join('')}</div>`
      : '';

  const sec = (no, title, inner) => `<div class="mm-sec">
    <div class="mm-sec-head"><b>${no}</b><span>${title}</span></div>
    ${inner}
  </div>`;

  return page(
    `
  .page {
    background: #d9cfb8;
    padding: 26px 24px 30px;
    font-family: ${WENKAI}, 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif CJK SC', serif;
    color: #2f2a24;
  }
  .mm-fold {
    background:
      repeating-linear-gradient(90deg, transparent 0 47px, rgba(168,32,26,0.11) 47px 48px),
      linear-gradient(180deg, #f7f2e4 0%, #f2ebd8 55%, #ece4cf 100%);
    border: 1px solid #c6b995;
    box-shadow: 0 6px 18px rgba(90,72,40,0.18);
    padding: 34px 30px 28px 40px;
    position: relative;
  }
  /* 左侧骑缝印章（半枚，压着装订边） */
  .mm-bianfeng {
    position: absolute;
    left: -15px;
    top: 120px;
    width: 30px;
    height: 96px;
    background: #a8371d;
    opacity: 0.72;
    border-radius: 3px;
    writing-mode: vertical-rl;
    color: #f7f2e4;
    font-size: 13px;
    letter-spacing: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 2px rgba(247,242,228,0.55);
  }
  .mm-addr {
    text-align: right;
    font-size: 20px;
    letter-spacing: 3px;
    color: #6b2418;
  }
  .mm-title {
    margin-top: 6px;
    padding-bottom: 12px;
    border-bottom: 2px solid #a8371d;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .mm-title-main { font-size: 27px; font-weight: 700; letter-spacing: 5px; color: #2f2a24; }
  .mm-title-no { font-size: 13px; letter-spacing: 2px; color: #8a7a5e; }
  .mm-open {
    margin-top: 18px;
    font-size: 18px;
    letter-spacing: 1px;
    text-indent: 2em;
    line-height: 1.95;
    text-align: justify;
  }
  .mm-sec { margin-top: 20px; }
  .mm-sec-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .mm-sec-head b {
    font-size: 14px;
    color: #a8371d;
    border: 1px solid #a8371d;
    border-radius: 2px;
    padding: 1px 6px;
    font-weight: 700;
  }
  .mm-sec-head span {
    font-size: 17px;
    letter-spacing: 3px;
    color: #6b2418;
    border-bottom: 1px solid rgba(168,32,26,0.4);
    padding-bottom: 2px;
    flex: 1;
  }
  .mm-wx { display: flex; gap: 12px; }
  .mm-wx-cell {
    flex: 1;
    border: 1px solid #cbbd99;
    background: rgba(255,253,246,0.7);
    padding: 12px 12px;
  }
  .mm-wx-cell.mine { background: rgba(255,253,246,0.92); }
  .mm-wx-city { font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #2f2a24; }
  .mm-wx-desc { margin-top: 5px; font-size: 15px; color: #5c5344; }
  .mm-wx-temp { margin-top: 3px; font-size: 22px; font-weight: 700; color: #a8371d; }
  .mm-wx-wind { margin-top: 3px; font-size: 13.5px; color: #857a66; }
  .mm-life-row {
    display: flex;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px dotted #cbbd99;
    font-size: 15.5px;
    line-height: 1.85;
  }
  .mm-life-row:last-child { border-bottom: 0; }
  .mm-life-e { flex: 0 0 22px; }
  .mm-life-l { flex: 0 0 126px; font-weight: 700; color: #6b2418; }
  .mm-life-t { flex: 1; text-align: justify; }
  .mm-yiji { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; font-size: 15px; }
  .mm-yiji i { font-style: normal; color: #a8371d; font-weight: 700; }
  .mm-yiji span {
    border: 1px solid #cbbd99;
    background: rgba(255,253,246,0.8);
    padding: 1px 7px;
    font-size: 14.5px;
  }
  .mm-facts { display: flex; gap: 8px; margin: 10px 0; font-size: 14.5px; }
  .mm-fact {
    flex: 1;
    text-align: center;
    border: 1px solid #cbbd99;
    background: rgba(255,253,246,0.7);
    padding: 7px 3px;
  }
  .mm-fact b { display: block; font-size: 11.5px; color: #8a7a5e; font-weight: 400; letter-spacing: 2px; }
  .mm-fact span { display: block; margin-top: 2px; font-weight: 700; color: #2f2a24; }
  .mm-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 46px;
    gap: 4px;
  }
  .mm-cell {
    position: relative;
    border: 1px solid #cbbd99;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14.5px;
    color: #7d6f58;
    background: rgba(255,253,246,0.6);
  }
  .mm-cell.center { border: 0; background: transparent; }
  .mm-cell.has { background: rgba(232,220,196,0.75); border-color: #a8956c; }
  .mm-gods {
    position: absolute;
    top: -7px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
  }
  .mm-gods b {
    font-size: 9.5px;
    font-weight: 700;
    color: #f7f2e4;
    background: #6b2418;
    padding: 1px 4px;
    white-space: nowrap;
    letter-spacing: 0;
  }
  .mm-quote {
    margin-top: 18px;
    padding: 16px 18px;
    border-left: 3px solid #a8371d;
    background: rgba(255,253,246,0.72);
    font-size: 18px;
    line-height: 1.95;
    text-align: justify;
    color: #3a332a;
  }
  .mm-close {
    margin-top: 22px;
    font-size: 17px;
    line-height: 2;
    letter-spacing: 1px;
    color: #3a332a;
  }
  .mm-end {
    margin-top: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(168,32,26,0.35);
  }
  .mm-sign { font-size: 18px; color: #2f2a24; letter-spacing: 1px; }
  .mm-seal {
    flex: 0 0 auto;
    width: 74px;
    height: 74px;
    background: #a8371d;
    color: #f7f2e4;
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    font-size: 16px;
    line-height: 1.25;
    letter-spacing: 1px;
    transform: rotate(-7deg);
    box-shadow: inset 0 0 0 2px rgba(247,242,228,0.7);
    opacity: 0.9;
  }
  .mm-seal span { display: block; white-space: nowrap; }
  .mm-foot {
    margin-top: 12px;
    font-size: 13px;
    color: #8a7a5e;
    letter-spacing: 1px;
    text-align: center;
  }`,
    `<div class="page">
  <div class="mm-fold">
    <div class="mm-bianfeng">奏</div>

    <div class="mm-addr">皇后娘娘圣鉴</div>

    <div class="mm-title">
      <span class="mm-title-main">请安折</span>
      <span class="mm-title-no">第 ${esc(p.days)} 折</span>
    </div>

    <p class="mm-open">臣谨奏：今日天时、起居、吉凶并心迹四事，条陈于下，伏乞圣览。</p>

    ${sec(
      '一',
      '天时',
      `<div class="mm-wx">${wxCell(w.mine, true)}${wxCell(w.ta, false)}</div>`
    )}

    ${p.life.length
      ? sec(
        '二',
        '起居',
        `${p.life
          .map((it) => `<div class="mm-life-row">
                 <span class="mm-life-e">${esc(it.emoji)}</span>
                 <span class="mm-life-l">${esc(it.label)}</span>
                 <span class="mm-life-t">${esc(it.text)}</span>
               </div>`)
          .join('')}`
      )
      : ''}

    ${a
      ? sec(
        '三',
        '吉凶',
        `<div class="mm-yiji"><i>宜</i>${a.yi.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
         <div class="mm-yiji"><i>忌</i>${a.ji.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
         <div class="mm-facts">
           ${a.facts.map((f) => `<div class="mm-fact"><b>${esc(f.k)}</b><span>${esc(f.v)}</span></div>`).join('')}
         </div>
         ${grid}
         <div class="mm-yiji" style="margin-top:9px;color:#8a7a5e;font-size:13.5px">
           <span style="border:0;background:transparent;padding:0">${esc(a.lunar)} · ${esc(a.ganzhi)} · 属${esc(a.zodiac)}${a.jieqi ? ' · ' + esc(a.jieqi) : ''}</span>
         </div>`
      )
      : ''}

    ${p.loveWord
      ? sec('四', '心迹', `<div class="mm-quote">${esc(p.loveWord)}</div>`)
      : ''}

    <div class="mm-close">伏惟圣鉴。臣不胜惶恐之至。</div>

    <div class="mm-end">
      <div class="mm-sign">——${esc(p.signature)}</div>
      <div class="mm-seal"><span>臣</span><span>谨奏</span></div>
    </div>

    <div class="mm-foot">${esc(p.dateText)}</div>
  </div>
</div>`
  );
}

/* -------------------------------------------------------------- 注册表 */

/** 每个版式：name 名字、build 渲染函数 */
const LAYOUTS = [
  { name: 'card', build: (c) => cardHtml(c) },
  { name: 'letter', build: (c) => letterHtml(c) },
  { name: 'poster', build: (c) => poster(prepare(c)) },
  { name: 'ticket', build: (c) => ticket(prepare(c)) },
  { name: 'diary', build: (c) => diary(prepare(c)) },
  { name: 'minimal', build: (c) => minimal(prepare(c)) },
  { name: 'magazine', build: (c) => magazine(prepare(c)) },
  { name: 'edict', build: (c) => edict(prepare(c)) },
  { name: 'memorial', build: (c) => memorial(prepare(c)) },
];

const NAMES = LAYOUTS.map((l) => l.name);

/** 允许用中文/别名指定版式，方便在 MAIL_LAYOUT 里直接写「圣旨」 */
const ALIASES = {
  卡片: 'card',
  信笺: 'letter',
  情书: 'letter',
  书信: 'letter',
  海报: 'poster',
  票根: 'ticket',
  车票: 'ticket',
  日记: 'diary',
  日记本: 'diary',
  极简: 'minimal',
  简洁: 'minimal',
  杂志: 'magazine',
  圣旨: 'edict',
  诏书: 'edict',
  奏章: 'memorial',
  折子: 'memorial',
  请安折: 'memorial',
  轮换: 'rotate',
  随机: 'rotate',
};

/**
 * 每天轮换版式：确定性地按天数挑一个，
 * 且相邻两天一定换一种（否则「每天都不一样」会偶尔失效）。
 */
const MAX_DAY = 4000;
const SEQ = (() => {
  const n = LAYOUTS.length;
  const hash = (v) => {
    let x = Math.imul(v ^ 0x27d4eb2f, 0x9e3779b1);
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

function pickLayout(seed) {
  const d = Number.isFinite(seed) ? Math.max(0, Math.floor(seed)) : 0;
  return LAYOUTS[SEQ[d <= MAX_DAY ? d : d % MAX_DAY]].name;
}

/** 按名字找版式（支持中文别名），找不到返回 null */
function layoutByName(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  const hit = LAYOUTS.find((l) => l.name === key);
  if (hit) return hit.name;
  const alias = ALIASES[key];
  return alias && LAYOUTS.some((l) => l.name === alias) ? alias : null;
}

/**
 * 渲染入口：layout 可以是具体名字，也可以是 'rotate'/'auto'（按天数轮换）。
 * 任何不认识的值都回落成按天数轮换，保证永远能画出东西。
 */
function renderLayout(layout, content) {
  const fixed = layoutByName(layout);
  const name = fixed || pickLayout(content && content.days);
  const hit = LAYOUTS.find((l) => l.name === name) || LAYOUTS[0];
  return { name: hit.name, html: hit.build(content) };
}

module.exports = {
  LAYOUTS,
  NAMES,
  ALIASES,
  pickLayout,
  layoutByName,
  renderLayout,
};
