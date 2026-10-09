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

/**
 * 生活指数的「暧昧语气助词」。
 * 按和风指数 type 给一句亲昵的前缀，没有对应项就不加。
 * type 对照：1运动 2防晒 3穿衣 5洗车 6旅游 7过敏 8舒适度 9感冒
 *          10空气 11空调 12太阳镜 13化妆 14晾晒 15交通
 */
const SWEET_PREFIX = {
  1: '陪我一起动一动嘛，',
  2: '出门记得防晒呀，',
  3: '要穿得暖暖的哦，',
  5: '洗车这种活儿交给我啦，',
  6: '想和你一起去呢，',
  7: '可别过敏呀，',
  8: '这么舒服的天，最适合见你啦，',
  9: '不许感冒呀，',
  10: '空气不错，多吸两口嘛，',
  11: '空调别开太凉哦，',
  12: '太阳镜戴上，也挡不住你好看，',
  13: '今天也要美美的呀，',
  14: '晒晒被子嘛，',
  15: '路上小心哦，',
};

function fn({
  weatherData,
  lifeData,
  lovingDays,
  city,
  loveWord,
  signature,
  dateText,
}) {
  const weatherDataDaily = (weatherData && weatherData.daily) || [];
  const daily = (lifeData && lifeData.daily) || [];

  const today = weatherDataDaily[0] || {};

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

  // 生活指数：每条加上亲昵的语气助词，并标出指数名与等级
  const lifeLines = daily
    .map((item) => {
      const prefix = SWEET_PREFIX[String(item.type)] || '';
      const label = `${item.name || ''}${
        item.category ? `(${item.category})` : ''
      }`;
      return `<p>${esc(label)}: ${esc(prefix + (item.text || ''))}</p>`;
    })
    .join('\n        ');

  // 土味情话拿不到时整块省略，不留空标题
  const loveBlock = loveWord
    ? `<p>每日土味情话：<br />${esc(loveWord)}</p>`
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
        <p>今天是${esc(dateText)}</p>
        <p>我们在一起的第${esc(safeDays)}天💞</p>
        <p>
          今日${esc(city)}天气:<br />
          温度:${esc(tempMin)}℃/${esc(tempMax)}℃<br />
          ${esc(weatherDesc)}<br />
          ${esc(wind)}
        </p>
        ${lifeLines}
        ${loveBlock}
        <p>——${esc(signature)}</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = fn;
