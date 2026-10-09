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

  // 两个城市并排（邮件里用表格，兼容性最好）；自己那栏不加背景框
  const wxCell = (head, icon, min, max, desc, wind, boxed) =>
    `<td width="50%" valign="top" style="padding:8px 10px;${
      boxed ? 'background:#ffe4f0;border-radius:14px;' : ''
    }">
          <div style="font-size:15px;color:#b3456e;font-weight:bold;">${esc(head)}</div>
          <div style="font-size:17px;color:#7d5b68;margin-top:6px;">${esc(
            icon ? icon + ' ' : ''
          )}${esc(desc)}</div>
          <div style="font-size:19px;color:#c94f7c;font-weight:bold;margin-top:6px;">${esc(
            min
          )}℃ / ${esc(max)}℃</div>
          ${wind ? `<div style="font-size:14px;color:#9c7b88;margin-top:2px;">${esc(wind)}</div>` : ''}
        </td>`;

  const wxRow = content.ta
    ? `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${wxCell(
            `📍 ${content.city}`,
            content.icon,
            content.tempMin,
            content.tempMax,
            content.weatherDesc,
            content.wind,
            false
          )}
          <td width="14"></td>
          ${wxCell(
            `🏙️ TA · ${content.ta.city}`,
            content.ta.icon,
            content.ta.tempMin,
            content.ta.tempMax,
            content.ta.desc,
            content.ta.wind,
            true
          )}
        </tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${wxCell(
            `📍 ${content.city}`,
            content.icon,
            content.tempMin,
            content.tempMax,
            content.weatherDesc,
            content.wind,
            false
          )}
        </tr></table>`;

  const lifeBlock = lifeLines
    ? `<p style="margin-top:18px;color:#b3456e;font-weight:bold;">🍀 生活指数</p>${lifeLines}`
    : '';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="font-family:'Microsoft YaHei','PingFang SC',sans-serif;">
      <div>
        <p>宝贝你好呀🥰</p>
        <p>我们在一起的第${esc(content.days)}天💞</p>
        <p style="margin-top:18px;color:#b3456e;font-weight:bold;">🌤️ 今日天气</p>
        ${wxRow}
        ${lifeBlock}
        ${loveBlock}
        <p>——${esc(content.signature)}</p>
        <p style="color:#b79aa6;font-size:13px;">${esc(content.dateText)}</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = fn;
