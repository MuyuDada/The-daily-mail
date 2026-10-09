/**
 * 把接口原始数据整理成「邮件」和「卡片图」共用的结构化内容。
 * 这样文字邮件和图片卡片永远一致，不会两处各改一套。
 */

/**
 * 生活指数的亲昵语气前缀（异地恋版）。
 *
 * 刻意避开「一起做」「陪着你」这类需要见面的说法，
 * 改成隔着距离也在惦记你的语气。按和风指数 type 匹配，没有对应项就不加。
 * type 对照：1运动 2防晒 3穿衣 5洗车 6旅游 7过敏 8舒适度 9感冒
 *          10空气 11空调 12太阳镜 13化妆 14晾晒 15交通
 */
const SWEET_PREFIX = {
  1: '动一动吧，我在远方给你数着步数，',
  2: '记得防晒，晒黑了我会心疼的，',
  3: '多穿一点，你的冷暖我最放在心上，',
  5: '洗车这种累活儿，留着等我回去干，',
  6: '这里先记下来，等我们见面一起去，',
  7: '别过敏呀，隔着屏幕我照顾不到你，',
  8: '这么好的天，真想和你一起晒晒太阳，',
  9: '千万别感冒，你难受我却抱不到你，',
  10: '多吸两口好空气，就当替我陪着你，',
  11: '空调别开太凉，我不在没人给你盖被子，',
  12: '太阳镜记得戴，你笑起来我还要看很久，',
  13: '今天也要美美的，等我见面好好看看你，',
  14: '记得晒晒被子，夜里睡得暖和一点，',
  15: '路上慢一点，我还在等你回来，',
};

function buildContent({
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

  const lifeItems = daily.map((item) => ({
    label: `${item.name || ''}${item.category ? `(${item.category})` : ''}`,
    text: (SWEET_PREFIX[String(item.type)] || '') + (item.text || ''),
  }));

  return {
    dateText: dateText || '',
    days: Number.isFinite(Number(lovingDays)) ? lovingDays : 0,
    city: city || '',
    tempMin,
    tempMax,
    weatherDesc,
    wind,
    lifeItems,
    loveWord: loveWord || '',
    signature: signature || '',
  };
}

module.exports = { buildContent, SWEET_PREFIX };
