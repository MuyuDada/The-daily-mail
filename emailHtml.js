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

function fn({
  weatherData,
  lifeData,
  word,
  imgurl,
  lovingDays,
  city,
  loveWord,
  signature,
  dateText,
}) {
  const weatherDataDaily = (weatherData && weatherData.daily) || [];
  const daily = (lifeData && lifeData.daily) || [];

  const today = weatherDataDaily[0] || {};

  // 穿衣指数（type=3）；取不到就退化成第一条，再取不到就留空
  const dress = daily.find((item) => item.type === '3') || daily[0] || {};

  const tempMin = today.tempMin === undefined ? '--' : today.tempMin;
  const tempMax = today.tempMax === undefined ? '--' : today.tempMax;

  // 「今天X转Y」；白天夜间天气相同就只写一个
  const dayText = today.textDay || '';
  const nightText = today.textNight || '';
  let weatherDesc = '';
  if (dayText && nightText && dayText !== nightText) {
    weatherDesc = `今天${dayText}转${nightText}`;
  } else if (dayText || nightText) {
    weatherDesc = `今天${dayText || nightText}`;
  }

  const wind = [
    today.windDirDay,
    today.windScaleDay ? `${today.windScaleDay}级` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const safeDays = Number.isFinite(Number(lovingDays)) ? lovingDays : 0;

  const imageBlock = imgurl
    ? `<p><img style="width: 100%; max-width: 768px" src="${esc(
        imgurl
      )}" alt="图片" /></p>`
    : '';

  // 土味情话拿不到时整块省略，不留空标题
  const loveBlock = loveWord
    ? `<p>每日土味情话：<br />${esc(loveWord)}</p>`
    : '';

  // 每日一句同理
  const wordBlock = word ? `<p>每日一句:<br />${esc(word)}</p>` : '';

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
        <p>今天是${esc(dateText)}</p>
        <p>我们在一起的第${esc(safeDays)}天💞</p>
        <p>
          今日${esc(city)}天气:<br />
          ${esc(dress.text)}<br />
          ${esc(weatherDesc)}<br />
          温度:${esc(tempMin)}℃/${esc(tempMax)}℃<br />
          ${esc(wind)}
        </p>
        ${wordBlock}
        ${imageBlock}
        ${loveBlock}
        <p>——${esc(signature)}</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = fn;
