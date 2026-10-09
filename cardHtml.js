/**
 * 温柔粉调卡片：把整理好的内容渲染成一张长图。
 * 纯 HTML，交给 Chrome 截图，所以字体/emoji/圆角都能正常渲染。
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

/** 一格天气（自己的或 TA 的），两格并排 */
function wxCol({ head, icon, tempMin, tempMax, desc, wind, mine }) {
  return `
    <div class="wx-col${mine ? ' mine' : ''}">
      <div class="wx-city">${esc(head)}</div>
      <div class="wx-temp">${esc(icon)} ${esc(tempMin)}℃ / ${esc(tempMax)}℃</div>
      ${desc ? `<div class="wx-desc">${esc(desc)}</div>` : ''}
      ${wind ? `<div class="wx-wind">${esc(wind)}</div>` : ''}
    </div>`;
}

function cardHtml(c) {
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
    background: linear-gradient(160deg, #ffe3ee 0%, #ffd6e7 45%, #ffe9f2 100%);
    padding: 44px 40px 52px;
  }
  .card {
    background: rgba(255,255,255,0.82);
    border-radius: 28px;
    padding: 40px 34px 34px;
    box-shadow: 0 10px 34px rgba(219,112,147,0.16);
  }
  .hi { font-size: 34px; color: #b3456e; font-weight: 700; letter-spacing: 1px; }
  .days {
    margin-top: 16px;
    font-size: 26px;
    color: #c94f7c;
    font-weight: 700;
  }
  .days .num { font-size: 46px; margin: 0 4px; }
  .divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(219,112,147,0), rgba(219,112,147,0.45), rgba(219,112,147,0));
    margin: 28px 0;
  }
  .sec-head { font-size: 22px; color: #b3456e; font-weight: 700; }
  .wx-row {
    display: flex;
    gap: 14px;
    margin-top: 16px;
    align-items: stretch;
  }
  .wx-col {
    flex: 1;
    min-width: 0;
    background: rgba(255,214,231,0.78);
    border-radius: 20px;
    padding: 20px 14px;
    text-align: center;
  }
  .wx-col.mine { background: rgba(255,203,224,0.92); }
  .wx-city { font-size: 18px; color: #b3456e; font-weight: 700; }
  .wx-temp {
    margin-top: 10px;
    font-size: 28px;
    color: #c94f7c;
    font-weight: 700;
    white-space: nowrap;
  }
  .wx-desc { margin-top: 10px; font-size: 18px; color: #7d5b68; line-height: 1.5; }
  .wx-wind { margin-top: 4px; font-size: 16px; color: #9c7b88; line-height: 1.5; }
  .life-head { margin-top: 30px; font-size: 20px; color: #b3456e; font-weight: 700; }
  .life { margin-top: 16px; }
  .life-name {
    display: inline-block;
    font-size: 17px;
    color: #c94f7c;
    background: rgba(255,192,214,0.42);
    border-radius: 999px;
    padding: 4px 14px;
    margin-bottom: 8px;
  }
  .life-text { font-size: 19px; color: #7d5b68; line-height: 1.75; }
  .love {
    margin-top: 28px;
    background: linear-gradient(135deg, #fff0f5, #ffe0ec);
    border-radius: 20px;
    padding: 24px 26px;
  }
  .love-title { font-size: 19px; color: #c94f7c; font-weight: 700; }
  .love-text { font-size: 21px; color: #8a5c6d; line-height: 1.8; margin-top: 12px; }
  .sign {
    margin-top: 28px;
    text-align: right;
    font-size: 21px;
    color: #b3456e;
  }
  .date-end {
    margin-top: 14px;
    text-align: center;
    font-size: 17px;
    color: #b79aa6;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="hi">宝贝你好呀🥰</div>
    <div class="days">我们在一起的第<span class="num">${esc(c.days)}</span>天💞</div>

    <div class="divider"></div>

    <div class="sec-head">🌤️ 今日天气</div>
    <div class="wx-row">
      ${mineCol}
      ${taCol}
    </div>

    ${life ? `<div class="life-head">🍀 生活指数</div>${life}` : ''}
    ${loveBlock}

    <div class="sign">——${esc(c.signature)}</div>
    <div class="date-end">${esc(c.dateText)}</div>
  </div>
</body>
</html>`;
}

module.exports = { cardHtml };
