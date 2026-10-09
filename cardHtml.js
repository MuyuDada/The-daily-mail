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

function cardHtml(c) {
  const life = c.lifeItems
    .map(
      (it) => `
      <div class="life">
        <div class="life-name">${esc(it.label)}</div>
        <div class="life-text">${esc(it.text)}</div>
      </div>`
    )
    .join('');

  const loveBlock = c.loveWord
    ? `<div class="love">
         <div class="love-title">每日土味情话</div>
         <div class="love-text">${esc(c.loveWord)}</div>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 720px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
    background: linear-gradient(160deg, #ffe3ee 0%, #ffd6e7 45%, #ffe9f2 100%);
    padding: 44px 40px 52px;
  }
  .card {
    background: rgba(255,255,255,0.82);
    border-radius: 28px;
    padding: 40px 38px 34px;
    box-shadow: 0 10px 34px rgba(219,112,147,0.16);
  }
  .hi { font-size: 34px; color: #b3456e; font-weight: 700; letter-spacing: 1px; }
  .date { font-size: 20px; color: #a8798c; margin-top: 14px; }
  .days {
    margin-top: 20px;
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
  .weather-head { font-size: 22px; color: #b3456e; font-weight: 700; }
  .temp {
    margin-top: 16px;
    font-size: 21px;
    color: #7d5b68;
    line-height: 1.9;
  }
  .temp .big { font-size: 40px; color: #c94f7c; font-weight: 700; }
  .life { margin-top: 18px; }
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
    margin-top: 30px;
    background: linear-gradient(135deg, #fff0f5, #ffe0ec);
    border-radius: 20px;
    padding: 24px 26px;
  }
  .love-title { font-size: 19px; color: #c94f7c; font-weight: 700; }
  .love-text { font-size: 21px; color: #8a5c6d; line-height: 1.8; margin-top: 12px; }
  .sign {
    margin-top: 30px;
    text-align: right;
    font-size: 21px;
    color: #b3456e;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="hi">宝贝你好呀🥰</div>
    <div class="date">${esc(c.dateText)}</div>
    <div class="days">我们在一起的第<span class="num">${esc(c.days)}</span>天💞</div>

    <div class="divider"></div>

    <div class="weather-head">今日${esc(c.city)}天气</div>
    <div class="temp">
      <span class="big">${esc(c.tempMin)}℃ / ${esc(c.tempMax)}℃</span><br />
      ${esc(c.weatherDesc)}<br />
      ${esc(c.wind)}
    </div>

    ${life}
    ${loveBlock}

    <div class="sign">——${esc(c.signature)}</div>
  </div>
</body>
</html>`;
}

module.exports = { cardHtml };
