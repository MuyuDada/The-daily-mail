/** HTML 转义，避免第三方文案里的 & < > " 破坏邮件结构 */
function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 纯文字邮件模板（卡片图生成失败时的兜底）。
 * 入参是 content.js 里 buildContent() 整理好的结构。
 */
function fn(c) {
  const content = c || {};

  const lifeLines = (content.lifeItems || [])
    .map(
      (it) =>
        `<p>${esc(it.emoji ? it.emoji + ' ' : '')}${esc(it.label)}: ${esc(
          it.text
        )}</p>`
    )
    .join('\n        ');

  const loveBlock = content.loveWord
    ? `<p>💌 每日土味情话：<br />${esc(content.loveWord)}</p>`
    : '';

  const taBlock = content.ta
    ? `<p>🏙️ TA那边 · ${esc(content.ta.city)}<br />
          ${esc(content.ta.icon)} ${esc(content.ta.tempMin)}℃/${esc(
        content.ta.tempMax
      )}℃ ${esc(content.ta.desc)}${
        content.ta.wind ? ` · ${esc(content.ta.wind)}` : ''
      }</p>`
    : '';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
      <div>
        <p>宝贝你好呀🥰</p>
        <p>我们在一起的第${esc(content.days)}天💞</p>
        <p>
          ${esc(content.icon)} 今日${esc(content.city)}天气:<br />
          温度:${esc(content.tempMin)}℃/${esc(content.tempMax)}℃<br />
          ${esc(content.weatherDesc)}${
    content.wind ? ` · ${esc(content.wind)}` : ''
  }
        </p>
        ${lifeLines}
        ${taBlock}
        ${loveBlock}
        <p>——${esc(content.signature)}</p>
        <p>${esc(content.dateText)}</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = fn;
