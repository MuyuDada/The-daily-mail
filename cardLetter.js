/**
 * 信笺版：把同样的内容排成一封手写信的样子。
 * 纸张纹理、邮戳、火漆印都是纯 CSS，不依赖图片，仍交给 Chrome 截图。
 *
 * 与 cardHtml.js 的区别只在「长相」：那块是彩色圆角卡片，这块是米色信纸 +
 * 墨色文字 + 手写落款。数据来源、字段完全一致，所以两者可以随时切换。
 */

/** 转义：内容里可能有 & < > 等字符（比如天气描述或情话） */
const esc = (v) => {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * 黄历：做成一张「贴在信纸上的黄历页」。
 * 外面一圈双线框，里面照旧是宜忌 + 左边三格 + 右边九宫格，
 * 只是把卡片的粉紫配色换成墨色，免得和信纸打架。
 */
function almanacInsert(h) {
  if (!h) return '';

  const chips = (list, cls) =>
    (list || []).map((x) => `<span class="ins-chip ${cls}">${esc(x)}</span>`).join('');

  const chong = (h.chongsha || '').match(/冲(\S+)/);
  const sha = (h.chongsha || '').match(/煞(\S+)/);
  const chongshaValue =
    chong && sha ? `冲${esc(chong[1])} 煞${esc(sha[1])}` : esc(h.chongsha || '');

  const factRow = (label, value) =>
    value
      ? `<div class="ins-fact">
           <span class="ins-fact-k">${esc(label)}</span>
           <span class="ins-fact-v">${value}</span>
         </div>`
      : '';

  const facts = [
    factRow('冲煞', chongshaValue),
    factRow('五行', esc(h.wuxing)),
    factRow('建除', esc(h.jianchu)),
  ]
    .filter(Boolean)
    .join('');

  // 九宫格：上方固定正北，和卡片版一致
  const fw = h.fangwei || {};
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

  const byDir = {};
  for (const k of FW_KEYS) {
    const d = norm(fw[k]);
    if (!d) continue;
    (byDir[d] = byDir[d] || []).push(k);
  }

  const grid = FW_ORDER.map((dir) => {
    if (dir === '中') return '<div class="ins-cell center"></div>';
    const gods = byDir[dir] || [];
    const tags = gods
      .map((g) => `<span class="ins-tag">${esc(g)}</span>`)
      .join('');
    return `<div class="ins-cell${gods.length ? ' has' : ''}">
        ${tags ? `<span class="ins-tags">${tags}</span>` : ''}
        <span class="ins-dir">${esc(dir.replace(/^正/, ''))}</span>
      </div>`;
  }).join('');

  const hasFw = Object.keys(byDir).length > 0;

  return `
    <div class="ins">
      <div class="ins-head">
        <span class="ins-lunar">农历 ${esc(h.lunarMonthDay)}</span>
        <span class="ins-gz">${esc(h.ganzhi)} · ${esc(h.zodiac)}年${h.jieqi ? ` · ${esc(h.jieqi)}` : ''}</span>
      </div>

      <div class="ins-yiji">
        <div class="ins-yiji-row">
          <span class="ins-badge yi">宜</span>
          <span class="ins-chips">${chips(h.yi, 'yi')}</span>
        </div>
        <div class="ins-yiji-row">
          <span class="ins-badge ji">忌</span>
          <span class="ins-chips">${chips(h.ji, 'ji')}</span>
        </div>
      </div>

      ${facts || hasFw
      ? `<div class="ins-cols">
             ${facts ? `<div class="ins-col-left">${facts}</div>` : ''}
             ${hasFw ? `<div class="ins-col-right"><div class="ins-grid">${grid}</div></div>` : ''}
           </div>`
      : ''
    }
    </div>`;
}

/** 一格天气，纯文字排版，两条竖线分开，不用色块 */
function weatherCol({ head, icon, tempMin, tempMax, desc, wind, mine }) {
  return `
    <div class="wx-col${mine ? ' mine' : ''}">
      <div class="wx-city">${esc(head)}</div>
      <div class="wx-line">${esc(icon ? icon + ' ' : '')}${esc(desc)}</div>
      <div class="wx-temp">${esc(tempMin)}℃ / ${esc(tempMax)}℃</div>
      ${wind ? `<div class="wx-wind">${esc(wind)}</div>` : ''}
    </div>`;
}

function letterHtml(c) {
  const mine = weatherCol({
    head: `📍 ${c.city}`,
    icon: c.icon,
    tempMin: c.tempMin,
    tempMax: c.tempMax,
    desc: c.weatherDesc,
    wind: c.wind,
    mine: true,
  });
  const ta = c.ta
    ? weatherCol({
      head: `🏙️ TA · ${c.ta.city}`,
      icon: c.ta.icon,
      tempMin: c.ta.tempMin,
      tempMax: c.ta.tempMax,
      desc: c.ta.desc,
      wind: c.ta.wind,
    })
    : '';

  const life = (c.lifeItems || [])
    .map(
      (it) => `
     <p class="para">
       <span class="idx">${esc(it.emoji ? it.emoji + ' ' : '')}${esc(it.label)}</span>
       ${esc(it.text)}
     </p>`
    )
    .join('');

  // 邮戳上的日期：从 dateText 里抠出年月日（形如「2026年10月20日 08:02 星期二」）
  const m = String(c.dateText || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  const stampDate = m ? `${m[1]}.${m[2]}.${m[3]}` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.6.0/style.css" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* 纸张偏黄的暖色，外面加一层深一点的桌面色做衬底 */
  body {
    width: 720px;
    background: #e9dcc8;
    background-image:
      radial-gradient(circle at 18% 12%, rgba(255,255,255,0.40), transparent 55%),
      radial-gradient(circle at 82% 88%, rgba(190,160,120,0.22), transparent 60%);
    padding: 34px 30px 40px;
    font-family: 'LXGW WenKai', 'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif CJK SC',
                 'Source Han Serif SC', 'SimSun', 'Noto Sans CJK SC', serif;
  }

  /* ---- 信纸本身 ---- */
  .sheet {
    position: relative;
    background-color: #fdf8ef;
    /* 横向格线，很淡，只当纸的纹理 */
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 43px,
      rgba(176,146,106,0.10) 43px 44px
    );
    border: 1px solid #eaddc7;
    border-radius: 3px;
    box-shadow: 0 14px 34px rgba(116,92,58,0.16), 0 2px 4px rgba(116,92,58,0.08);
    padding: 46px 46px 34px 74px;
    overflow: hidden;
  }
  /* 左侧两道红色页边线，像真的信笺 */
  .sheet::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 56px;
    width: 1px;
    background: rgba(178,92,82,0.34);
  }
  .sheet::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 60px;
    width: 1px;
    background: rgba(178,92,82,0.16);
  }

  /* ---- 右上角邮票 + 邮戳 ---- */
  .stamp {
    position: absolute;
    top: 34px;
    right: 38px;
    width: 92px;
    transform: rotate(3.5deg);
    background: #fffdf7;
    padding: 6px;
    box-shadow: 0 2px 7px rgba(116,92,58,0.20);
    z-index: 3;
  }
  .stamp-in {
    border: 1px dashed rgba(150,112,70,0.55);
    padding: 7px 2px 5px;
    text-align: center;
  }
  .stamp-crown { font-size: 30px; line-height: 1.1; }
  .stamp-val {
    margin-top: 3px;
    font-size: 11px;
    letter-spacing: 1px;
    color: #8a6b45;
  }
  .stamp-day {
    font-size: 15px;
    font-weight: 700;
    color: #6d4f2e;
    letter-spacing: 0.5px;
  }
  /* 邮戳：空心圆 + 两行小字，压在邮票左下角 */
  .postmark {
    position: absolute;
    top: 92px;
    right: 104px;
    width: 74px;
    height: 74px;
    border: 1.6px solid rgba(84,108,142,0.42);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    transform: rotate(-11deg);
    color: rgba(84,108,142,0.60);
    z-index: 4;
  }
  .postmark-city { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
  .postmark-date { font-size: 8px; letter-spacing: 0.5px; }

  /* ---- 抬头 ---- */
  .to { font-size: 21px; color: #6b5a48; letter-spacing: 2px; }
  .hello {
    margin-top: 10px;
    font-size: 33px;
    font-weight: 700;
    color: #33291f;
    letter-spacing: 3px;
    line-height: 1.5;
  }
  .dayline {
    margin-top: 6px;
    font-size: 24px;
    color: #8a4b3c;
    letter-spacing: 1px;
  }
  .dayline .num {
    font-size: 34px;
    font-weight: 700;
    margin: 0 3px;
    color: #a5453c;
  }

  /* ---- 正文段落 ---- */
  .sec {
    margin-top: 26px;
    font-size: 17px;
    color: #7a6a58;
    letter-spacing: 3px;
  }
  .sec::after {
    content: '';
    display: block;
    margin-top: 6px;
    height: 1px;
    background: linear-gradient(90deg, rgba(150,120,84,0.42), transparent);
  }
  .para {
    margin-top: 12px;
    font-size: 19px;
    color: #3b3128;
    line-height: 1.95;
    text-align: justify;
    text-indent: 2em;
  }
  .idx {
    font-weight: 700;
    color: #8a4b3c;
    text-indent: 0;
  }

  /* ---- 天气双栏 ---- */
  .wx {
    display: flex;
    gap: 0;
    margin-top: 14px;
    align-items: flex-start;
  }
  .wx-col {
    flex: 1;
    min-width: 0;
    padding: 2px 16px;
  }
  .wx-col.mine { padding-left: 0; }
  .wx-col + .wx-col { border-left: 1px dashed rgba(150,120,84,0.34); }
  .wx-city { font-size: 18px; color: #6b5a48; letter-spacing: 1px; }
  .wx-line { margin-top: 6px; font-size: 19px; color: #3b3128; }
  .wx-temp {
    margin-top: 4px;
    font-size: 22px;
    font-weight: 700;
    color: #8a4b3c;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .wx-wind { margin-top: 3px; font-size: 16px; color: #7a6a58; }

  /* ---- 黄历插页 ---- */
  .ins {
    margin-top: 16px;
    background: rgba(255,252,244,0.86);
    border: 1px solid rgba(150,120,84,0.34);
    border-radius: 2px;
    padding: 16px 16px 15px;
    /* 双线内框 */
    box-shadow: inset 0 0 0 3px rgba(255,252,244,0.9),
                inset 0 0 0 4px rgba(150,120,84,0.22);
  }
  .ins-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .ins-lunar { font-size: 22px; font-weight: 700; color: #33291f; letter-spacing: 1px; }
  .ins-gz { font-size: 15px; color: #7a6a58; }

  .ins-yiji { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
  .ins-yiji-row { display: flex; align-items: flex-start; gap: 8px; }
  .ins-badge {
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #fffdf7;
    border-radius: 3px;
  }
  .ins-badge.yi { background: #4f7a5c; }
  .ins-badge.ji { background: #a04a44; }
  .ins-chips { display: flex; flex-wrap: wrap; gap: 5px 12px; padding-top: 3px; }
  .ins-chip { font-size: 16px; line-height: 1.5; }
  .ins-chip.yi { color: #3d6449; }
  .ins-chip.ji { color: #8c3f3a; }

  .ins-cols {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed rgba(150,120,84,0.30);
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .ins-col-left { flex: 0 0 50%; width: 50%; min-width: 0; }
  .ins-col-right { flex: 0 0 50%; width: 50%; min-width: 0; }
  .ins-fact {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 16px;
    line-height: 2.05;
  }
  .ins-fact-k { color: #7a6a58; flex: 0 0 auto; }
  .ins-fact-v { color: #3b3128; font-weight: 600; white-space: nowrap; }

  /* minmax(0,1fr)：不写 0 下限的话，格里的「财神福神」会把这一列撑宽，三格就不等宽了 */
  .ins-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 42px;
    gap: 5px;
  }
  .ins-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    height: 42px;
    border-radius: 2px;
    padding: 2px;
    min-width: 0;
    overflow: hidden;
  }
  .ins-cell.center { background: transparent; }
  .ins-cell.has { background: rgba(214,196,166,0.28); }
  .ins-dir { font-size: 13px; color: #8a7a66; line-height: 1.15; white-space: nowrap; }
  .ins-cell.has .ins-dir { color: #5d4c39; font-weight: 700; }
  .ins-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; }
  .ins-tag {
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    color: #fffdf7;
    background: #8a6b45;
    border-radius: 2px;
    padding: 2px 4px;
    white-space: nowrap;
  }

  /* ---- 情话 ---- */
  .quote {
    margin-top: 22px;
    padding: 16px 18px;
    background: rgba(255,252,244,0.72);
    border-left: 3px solid rgba(165,69,60,0.55);
    border-radius: 2px;
  }
  .quote-mark { font-size: 15px; color: #a5453c; letter-spacing: 3px; }
  .quote-text {
    margin-top: 8px;
    font-size: 21px;
    color: #3b3128;
    line-height: 1.9;
    letter-spacing: 0.5px;
  }

  /* ---- 落款 + 火漆印 ---- */
  .sign-wrap {
    position: relative;
    margin-top: 30px;
    padding-right: 6px;
    text-align: right;
  }
  .sign {
    font-size: 25px;
    color: #33291f;
    letter-spacing: 2px;
    transform: rotate(-1.5deg);
    display: inline-block;
  }
  .date-end {
    margin-top: 16px;
    text-align: right;
    font-size: 15px;
    color: #8a7a66;
    letter-spacing: 1px;
  }
  /* 火漆印：两层圆 + 内圈细线，压在落款左边 */
  .seal {
    position: absolute;
    right: 148px;
    top: -12px;
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: radial-gradient(circle at 34% 28%, #c05a4e, #9c3f37 58%, #813029);
    box-shadow: 0 2px 6px rgba(120,50,44,0.34), inset 0 1px 3px rgba(255,255,255,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-9deg);
    color: #fdeee9;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0;
  }
  .seal::after {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1.5px solid rgba(253,238,233,0.52);
    border-radius: 50%;
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="stamp">
      <div class="stamp-in">
        <div class="stamp-crown">👑</div>
        <div class="stamp-day">${esc(c.days)}</div>
        <div class="stamp-val">DAYS</div>
      </div>
    </div>
    <div class="postmark">
      <div class="postmark-city">${esc(c.city)}</div>
      <div class="postmark-date">${esc(stampDate)}</div>
    </div>

    <div class="hello">皇后娘娘万福金安👑</div>
    <div class="dayline">今天是我们认识的第<span class="num">${esc(c.days)}</span>天💞</div>

    <div class="sec">今日天气</div>
    <div class="wx">
      ${mine}
      ${ta}
    </div>

    ${life ? `<div class="sec">生活指数</div>${life}` : ''}
    ${c.huangli ? `<div class="sec">今日黄历</div>${almanacInsert(c.huangli)}` : ''}

    ${c.loveWord
      ? `<div class="quote">
           <div class="quote-mark">情话</div>
           <div class="quote-text">${esc(c.loveWord)}</div>
         </div>`
      : ''
    }

    <div class="sign-wrap">
      <div class="seal">囍</div>
      <div class="sign">——${esc(c.signature)}</div>
    </div>
    <div class="date-end">${esc(c.dateText)}</div>
  </div>
</body>
</html>`;
}

module.exports = { letterHtml };
