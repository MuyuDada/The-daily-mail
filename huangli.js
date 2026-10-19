/**
 * 黄历：从微鲤万年历前端算法本地推算（vendor/zhwnl-almanac.js，纯查表 + 干支推算，
 * 不请求任何接口）。这里只取「当天」需要、且适合放进卡片的那部分内容。
 *
 * 取舍原则：卡片篇幅有限，只留看得懂、有意义的——
 * 宜、忌、农历、干支、冲煞、五行、值神、建除、宿星、方位。
 * 彭祖百忌/胎神/吉神凶神/时辰吉凶这些过于细碎或需要专业知识才能读懂的，不放进卡片。
 */
const { almanac, lunar } = require('./vendor/zhwnl-almanac');

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function pad(n) {
  return String(n).padStart(2, '0');
}

/** 第 i 个时辰的时段（i=0 为子时，起于 23:00） */
function shichenRange(i) {
  const start = (23 + i * 2) % 24;
  const end = (start + 1) % 24;
  return `${pad(start)}:00-${pad(end)}:59`;
}

function findDay({ year, month, date }) {
  const list = lunar.getOneMonthShowData(year, month);
  const d = list.find((x) => x.year === year && x.month === month && x.date === date);
  if (!d) throw new Error(`黄历查不到 ${year}-${month}-${date}`);
  return d;
}

/**
 * 取某一天的黄历。
 * @param {{year:number, month:number, date:number}} target
 */
function getHuangli(target) {
  const d = findDay(target);

  const yiji = almanac.getAlmanacYiJi(d.nmonthcyl_int, d.ndatecyl_int);
  const fangWei = almanac.getAlmanacZhuShenFangWei(d.ndatecyl_int);

  // 时辰吉凶只保留吉/凶，卡片上画成一行小格子
  const shichen = almanac.getAlmanacShiChen(d.ndatecyl_int).map((s, i) => ({
    zhi: s.slice(1, 2) || SHICHEN[i],
    luck: s.slice(-1) === '吉' ? '吉' : '凶',
    range: shichenRange(i),
  }));

  return {
    // 公历/农历
    solarText: `${target.year}年${target.month}月${target.date}日`,
    week: WEEK[d.week],
    lunarMonthDay: (d.isleapMonth ? '闰' : '') + d.nmonthstr + d.ndatestr,
    ganzhi: `${d.nyearcyl}年${d.nmonthcyl}月${d.ndatecyl}日`,
    zodiac: lunar.AnimalsYear(d.nyear),
    jieqi: d.jieqi || '',
    festival: d.festival || '',

    // 宜忌（核心）
    yi: (yiji.y || '').split(/\s+/).filter(Boolean),
    ji: (yiji.j || '').split(/\s+/).filter(Boolean),

    // 杂项
    wuxing: almanac.getAlmanacWuXing(d.ndatecyl_int),
    chongsha: almanac.getAlmanacChongSha(d.ndatecyl_int),
    zhishen: almanac.getAlmanacShiErZhiShen(d.nmonthcyl_int, d.ndatecyl_int),
    jianchu: almanac.getAlmanacJianChuShiErShen(d.nmonthcyl_int, d.ndatecyl_int),
    xingxiu: almanac.getAlmanacXingXiu(d.ndatecyl_int),

    // 吉神方位
    fangwei: {
      财神: fangWei.substr(3, 2),
      喜神: fangWei.substr(9, 2),
      福神: fangWei.substr(15, 2),
      阳贵: fangWei.substr(21, 2),
    },

    shichen,
  };
}

module.exports = { getHuangli, shichenRange };
