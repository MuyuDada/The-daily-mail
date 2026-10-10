/**
 * 把接口原始数据整理成「邮件」和「卡片图」共用的结构化内容。
 * 这样文字邮件和图片卡片永远一致，不会两处各改一套。
 */
const { pickTheme, THEMES, DEFAULT_THEME } = require('./themes');

/** 按名字挑主题（配置里写死某个颜色时用），找不到就返回 null */
function themeByName(name) {
  const key = String(name || '').trim();
  if (!key) return null;
  return THEMES.find((t) => t.name === key || t.name.includes(key)) || null;
}

/**
 * 生活指数的亲昵语气前缀（异地恋版）。
 *
 * 刻意避开「一起做」「陪着你」这类需要见面的说法，
 * 改成隔着距离也在惦记你的语气。按和风指数 type 匹配，没有对应项就不加。
 * type 对照：1运动 2洗车 3穿衣 5紫外线 6旅游 7过敏 8舒适度 9感冒
 *          10空气 11空调 12太阳镜 13化妆 14晾晒 15交通
 */
const SWEET_PREFIX = {
  1: '动一动吧，我在远方给你数着步数，',
  2: '洗车这种累活儿，留着等我回去干，',
  3: '多穿一点，你的冷暖我最放在心上，',
  5: '记得防晒，晒黑了我会心疼的，',
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

/**
 * 有些指数本身带方向性（热/冷、适宜/不宜），
 * 前缀必须跟着等级走，否则会出现「天热还劝人多穿」「不宜运动还喊人出门」这种反话。
 * 按 type 分组，组内从上往下第一个命中的 category 生效，都不命中就用上面的默认前缀。
 */
const SWEET_PREFIX_BY_CATEGORY = {
  // 运动指数：不宜出门的时候不能喊人动起来
  1: [
    { match: /不宜|不适宜/, text: '外面不太适合运动，在家歇着也好，' },
    { match: /适宜/, text: '动一动吧，我在远方给你数着步数，' },
  ],
  // 穿衣指数：热的时候不能劝人多穿
  3: [
    { match: /炎热|热/, text: '天热，穿得清凉透气一点，' },
    { match: /寒冷|冷/, text: '多穿一点，你的冷暖我最放在心上，' },
    { match: /舒适/, text: '穿得舒服最重要，' },
  ],
  // 舒适度指数：不舒适的时候不能说「这么好的天」
  8: [
    { match: /不舒适/, text: '天气不太舒服，照顾好自己，' },
  ],
  // 空气污染扩散条件：扩散差的时候不能说「多吸两口好空气」
  10: [
    { match: /较差|差|中/, text: '空气一般，出门记得戴口罩，' },
  ],
  // 太阳镜指数：不需要戴的时候不能劝人戴
  12: [
    { match: /不需要|不必/, text: '今天太阳不刺眼，不戴也没关系，' },
  ],
  // 晾晒指数：不宜晾晒的时候不能劝人晒被子
  14: [
    { match: /不宜|不太适宜/, text: '今天不太适合晒被子，改天再晒，' },
  ],
};

/** 按 type + category 挑前缀；category 有方向性就跟着走，否则用默认 */
function sweetPrefix(type, category) {
  const rules = SWEET_PREFIX_BY_CATEGORY[String(type)];
  if (rules) {
    const hit = rules.find((r) => r.match.test(String(category || '')));
    if (hit) return hit.text;
  }
  return SWEET_PREFIX[String(type)] || '';
}

/** 生活指数的小图标，同样按和风 type 匹配 */
const LIFE_EMOJI = {
  1: '🏃',
  2: '🚗',
  3: '👕',
  5: '🧴',
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
  themeName,
}) {
  const weatherDataDaily = (weatherData && weatherData.daily) || [];
  const daily = (lifeData && lifeData.daily) || [];
  const today = weatherDataDaily[0] || {};
  const days = Number.isFinite(Number(lovingDays)) ? Number(lovingDays) : 0;

  // 每天换一种马卡龙配色；配置里指定了名字就用指定的那个
  const theme = themeByName(themeName) || pickTheme(days);

  const lifeItems = daily.map((item) => ({
    emoji: LIFE_EMOJI[String(item.type)] || '',
    label: `${item.name || ''}${item.category ? `(${item.category})` : ''}`,
    text: sweetPrefix(item.type, item.category) + (item.text || ''),
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
    days,
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
    theme,
  };
}

module.exports = {
  buildContent,
  SWEET_PREFIX,
  SWEET_PREFIX_BY_CATEGORY,
  sweetPrefix,
  LIFE_EMOJI,
  weatherEmoji,
  themeByName,
  THEMES,
  DEFAULT_THEME,
};
