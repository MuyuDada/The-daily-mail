const fetch = require('node-fetch');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const sendEmail = require('./sendEmail');
const emailHtml = require('./emailHtml');
const { buildContent } = require('./content');
const { cardHtml } = require('./cardHtml');
const { renderHtmlToPng } = require('./render');

// 给dayjs添加时区选项
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  fromDisplayText,
  fromDisplaySubText,
  user,
  recipients,
  weatherKey,
  type,
  tianXingKey,
  startDay,
  city,
  signature,
  loveName,
  themeName,
} = require('./config');

const TZ = 'Asia/Shanghai';
const WEEKDAYS = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
];

/**
 * 请求 JSON 接口，并校验业务状态码。
 * 和风天气成功返回 { code: '200' }，天行数据成功返回 { code: 200 }。
 */
async function fetchJson(url, name) {
  const res = await fetch(url);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`${name} 返回的不是合法 JSON（HTTP ${res.status}）`);
  }

  if (!res.ok || String(data.code) !== '200') {
    throw new Error(
      `${name} 接口异常（HTTP ${res.status}）：${JSON.stringify(data)}`
    );
  }
  return data;
}

/** 按 LocationID 反查城市名（失败返回空字符串，不影响主流程） */
async function lookupCity(locationId) {
  try {
    const geoData = await fetchJson(
      `https://geoapi.qweather.com/v2/city/lookup?key=${weatherKey}&location=${locationId}`,
      '和风天气-城市查询'
    );
    const first = (geoData.location || [])[0] || {};
    return first.name || '';
  } catch (e) {
    console.error('[每日提醒] 城市名获取失败，已忽略：', e.message);
    return '';
  }
}

async function init() {
  try {
    // 天气、生活指数、城市名都按 LocationID 缓存，同城只请求一次
    const weatherCache = new Map();
    const lifeCache = new Map();
    const cityCache = new Map();

    /** 取某个 LocationID 的天气预报 */
    async function getWeather(id) {
      if (weatherCache.has(id)) return weatherCache.get(id);
      const data = await fetchJson(
        `https://devapi.qweather.com/v7/weather/3d?key=${weatherKey}&location=${id}`,
        '和风天气-天气预报'
      );
      weatherCache.set(id, data);
      return data;
    }

    /** 取某个 LocationID 的生活指数 */
    async function getLife(id) {
      if (lifeCache.has(id)) return lifeCache.get(id);
      const data = await fetchJson(
        `https://devapi.qweather.com/v7/indices/1d?key=${weatherKey}&location=${id}&type=${type}`,
        '和风天气-生活指数'
      );
      lifeCache.set(id, data);
      return data;
    }

    /** 按 LocationID 反查城市名（失败返回空串），同样按 ID 缓存 */
    async function getCityName(id) {
      if (!id) return '';
      if (cityCache.has(id)) return cityCache.get(id);
      const name = await lookupCity(id);
      cityCache.set(id, name);
      return name;
    }

    // 土味情话：拿不到就整块不显示（失败不影响主流程）
    let loveWord = '';
    try {
      const loveData = await fetchJson(
        `https://apis.tianapi.com/caihongpi/index?key=${tianXingKey}`,
        '天行数据-土味情话'
      );
      loveWord = (loveData.result && loveData.result.content) || '';
      // 天行有时返回带 XXX 占位符的模板句（XXX 本意是让对方填名字），
      // 直接显示出来会很出戏，这里统一替换掉。
      loveWord = loveWord.replace(/XXX|XX+|xx+|某某/g, loveName);
    } catch (e) {
      console.error('[每日提醒] 土味情话获取失败，已忽略：', e.message);
    }

    // 计算日期：两端都按北京时间「当天 00:00」对齐
    const now = dayjs().tz(TZ);
    const lovingDays = now
      .startOf('day')
      .diff(dayjs.tz(startDay, TZ).startOf('day'), 'days');
    const dateText = `${now.format('YYYY年M月D日 HH:mm')} ${WEEKDAYS[now.day()]}`;

    // TA 的天气拿不到不该影响整封邮件，所以单独包一层（失败记为 null）
    const taFailed = new Set();

    /** 取某个 LocationID 的 TA 天气（只要天气情况，不带生活指数） */
    async function getTaWeather(id) {
      if (!id || taFailed.has(id)) return null;
      try {
        return await getWeather(id);
      } catch (e) {
        console.error(`[每日提醒] TA城市(${id})天气获取失败，已忽略：`, e.message);
        taFailed.add(id);
        return null;
      }
    }

    let okCount = 0;
    const failed = [];

    for (const person of recipients) {
      try {
        // 「我」的天气和生活指数按收件人各自的城市取
        const weatherData = await getWeather(person.myLocation);
        const lifeData = await getLife(person.myLocation);
        // 自己那栏的城市名：配置里写了就用，否则按 LocationID 反查
        const myCity =
          person.myCity || (await getCityName(person.myLocation)) || city;

        // TA 的天气：失败只是不显示这一块
        const taWeatherData = await getTaWeather(person.taLocation);
        const personTaCity =
          person.taCity || (await getCityName(person.taLocation));

        const content = buildContent({
          weatherData,
          lifeData,
          taWeatherData,
          taCity: personTaCity,
          lovingDays,
          city: myCity,
          loveWord,
          signature,
          dateText,
          themeName,
        });

        // 生成卡片图；失败就退回纯文字邮件，保证每天都有邮件
        let htmlStr;
        let attachments;
        try {
          const png = await renderHtmlToPng(cardHtml(content), {
            width: 720,
            scale: 2,
            format: 'jpeg',
            quality: 85,
          });
          attachments = [
            {
              filename: `每日提醒-${now.format('YYYY-MM-DD')}.jpg`,
              content: png,
              cid: 'daily-card',
            },
          ];
          // 正文只放这张图，点开就是完整内容
          htmlStr =
            '<div><img src="cid:daily-card" alt="每日提醒" style="width:100%;max-width:720px" /></div>';
        } catch (e) {
          console.error('[每日提醒] 卡片图生成失败，改为发送文字邮件：', e.message);
          htmlStr = emailHtml(content);
        }

        // 分别单独发送：每个人只看到自己的地址，互相不可见
        await sendEmail({
          from: fromDisplayText,
          to: person.to,
          subject: fromDisplaySubText,
          html: htmlStr,
          attachments,
        });

        okCount += 1;
        console.log(
          `[每日提醒] 已发送至 ${person.to}，今天是在一起的第 ${lovingDays} 天`
        );
      } catch (e) {
        // 单个收件人失败不影响其他人
        console.error(`[每日提醒] 发送至 ${person.to} 失败：`, e.message);
        failed.push(`${person.to}（${e.message}）`);
      }
    }

    if (failed.length) {
      throw new Error(
        `${failed.length}/${recipients.length} 个收件人发送失败：${failed.join('；')}`
      );
    }
    if (!okCount) throw new Error('没有配置任何收件人（MAIL_TO 为空）');
  } catch (e) {
    // 先打印真实错误，保证 Actions 日志里能看到原因
    console.error('[每日提醒] 发送失败：', e);

    // 发送邮件给自己提示（这一步失败不能再把进程带崩）
    try {
      await sendEmail({
        from: '报错啦',
        to: user,
        subject: '定时邮件-报错提醒',
        html: `请查看 github actions<br><br><pre>${String(
          (e && e.stack) || e
        )}</pre>`,
      });
    } catch (inner) {
      console.error('[每日提醒] 报错提醒邮件也发送失败：', inner);
    }

    // 让 GitHub Actions 显示为失败，而不是绿色成功
    process.exitCode = 1;
  }
}

init();
