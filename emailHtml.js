/** HTML 转义，避免第三方文案/图片地址里的 & < > " 破坏邮件结构 */
function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fn(weatherData, lifeData, word, imgurl, lovingDays) {
  const weatherDataDaily = (weatherData && weatherData.daily) || [];
  const daily = (lifeData && lifeData.daily) || [];

  const today = weatherDataDaily[0] || {};
  const tempMin = today.tempMin === undefined ? '--' : today.tempMin;
  const tempMax = today.tempMax === undefined ? '--' : today.tempMax;

  // 生活指数条数不固定，有几条渲染几条
  const lifeList = daily
    .map(
      (item) => `<li style="margin-bottom: 10px">
              ${esc(item.name)}(${esc(item.category)}):
              ${esc(item.text)}
            </li>`
    )
    .join('\n            ');

  const safeDays = Number.isFinite(Number(lovingDays)) ? lovingDays : 0;

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
      <div>
        <!-- 天数 -->
        <div>
          <p>今天是在一起的第${esc(safeDays)}天！</p>
        </div>
        <!-- 图片 -->
        <div>
          <img
            style="width: 100%; max-width: 768px"
            src="${esc(imgurl)}"
            alt="图片"
          />
        </div>
        <!-- 每日一句 -->
        <div>
          <p style="font-size: 14px; text-indent: 2em; font-style: italic;">
            ${esc(word)}
          </p>
        </div>
        <!-- 天气 -->
        <div>
          <p>
            <b>今日气温:</b>
            <span>${esc(tempMin)}°C - ${esc(tempMax)}°C</span>
          </p>
          <ul>
            ${lifeList}
          </ul>
        </div>
      </div>
    </body>
  </html>
  `;
}

module.exports = fn;
