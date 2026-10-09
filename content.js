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

/** 生活指数的小图标，同样按和风 type 匹配 */
const LIFE_EMOJI = {
  1: '🏃',
  2: '🧴',
  3: '👕',
  5: '🚗',
  6: '🧳',
  7: '🤧',
  8: '🌈',
  9: '🤒',
  10: '🍃',
  11: '❄️',
  12: '🕶️',
  13: '💄',
  14: '🧺',
  15: '🚦',
};

/**
 * 天气图标：把和风返回的 iconDay/iconNight 数字码映射成 emoji。
 * 用 emoji 而不是外链图片，是因为它不依赖渲染时的网络，且 CI 已装彩色 emoji 字体。
 */
function weatherEmoji(code) {
  const c = Number(code);
  if (!Number.isFinite(c)) return '';
  if (c === 100) return '☀️';
  if (c === 150) return '🌙';
  if (c >= 101 && c <= 103) return '🌤️';
  if (c === 104 || (c >= 151 && c <= 154)) return '☁️';
  if (c >= 300 && c <= 304) return '⛈️';
  if (c >= 305 && c <= 399) return '🌧️';
  if (c >= 400 && c <= 499) return '❄️';
  if (c >= 500 && c <= 515) return '🌫️';
  if (c === 900) return '🔥';
  if (c === 901) return '🥶';
  return '';
}

/** 把一天的天气写成「晴转多云」这种短描述（不再带「今天」，避免和标题重复） */
function describeDay(day) {
  const d = day || {};
  const dayText = d.textDay || '';
  const nightText = d.textNight || '';
  if (dayText && nightText && dayText !== nightText) {
    return `${dayText}转${nightText}`;
  }
  return dayText || nightText || '';
}

/** 风向 + 风力，例如「南风 1-3级」 */
function describeWind(day) {
  const d = day || {};
  return [d.windDirDay, d.windScaleDay ? `${d.windScaleDay}级` : '']
    .filter(Boolean)
    .join(' ');
}

function buildContent({
  weatherData,
  lifeData,
  taWeatherData,
  taCity,
  lovingDays,
  city,
  loveWord,
  signature,
  dateText,
}) {
  const weatherDataDaily = (weatherData && weatherData.daily) || [];
  const daily = (lifeData && lifeData.daily) || [];
  const today = weatherDataDaily[0] || {};

  const lifeItems = daily.map((item) => ({
    emoji: LIFE_EMOJI[String(item.type)] || '',
    label: `${item.name || ''}${item.category ? `(${item.category})` : ''}`,
    text: (SWEET_PREFIX[String(item.type)] || '') + (item.text || ''),
  }));

  // TA 那边的天气：只要天气情况，不带生活指数
  let ta = null;
  const taDaily = (taWeatherData && taWeatherData.daily) || [];
  if (taDaily.length) {
    const t = taDaily[0];
    ta = {
      city: taCity || '',
      icon: weatherEmoji(t.iconDay),
      tempMin: t.tempMin === undefined ? '--' : t.tempMin,
      tempMax: t.tempMax === undefined ? '--' : t.tempMax,
      desc: describeDay(t),
      wind: describeWind(t),
    };
  }

  return {
    dateText: dateText || '',
    days: Number.isFinite(Number(lovingDays)) ? lovingDays : 0,
    city: city || '',
    tempMin: today.tempMin === undefined ? '--' : today.tempMin,
    tempMax: today.tempMax === undefined ? '--' : today.tempMax,
    weatherDesc: describeDay(today),
    wind: describeWind(today),
    icon: weatherEmoji(today.iconDay),
    ta,
    lifeItems,
    loveWord: loveWord || '',
    signature: signature || '',
  };
}

module.exports = { buildContent, SWEET_PREFIX, LIFE_EMOJI, weatherEmoji };
