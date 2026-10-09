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
  to,
  weatherKey,
  location,
  type,
  tianXingKey,
  startDay,
  city,
  signature,
  taLocation,
  taCity,
  loveName,
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

async function init() {
  try {
    // 获取天气信息
    const weatherData = await fetchJson(
      `https://devapi.qweather.com/v7/weather/3d?key=${weatherKey}&location=${location}`,
      '和风天气-天气预报'
    );

    // 获取天气生活指数
    const lifeData = await fetchJson(
      `https://devapi.qweather.com/v7/indices/1d?key=${weatherKey}&location=${location}&type=${type}`,
      '和风天气-生活指数'
    );

    // 城市名：配置里没写就查一次（失败不影响主流程）
    let cityName = city;
    if (!cityName) {
      try {
        const geoData = await fetchJson(
          `https://geoapi.qweather.com/v2/city/lookup?key=${weatherKey}&location=${location}`,
          '和风天气-城市查询'
        );
        const first = (geoData.location || [])[0] || {};
        cityName = first.name || '';
      } catch (e) {
        console.error('[每日提醒] 城市名获取失败，已忽略：', e.message);
      }
    }

    // TA 那边的天气：只要天气情况，不带生活指数（失败就不显示这一块）
    let taWeatherData = null;
    if (taLocation) {
      try {
        taWeatherData = await fetchJson(
          `https://devapi.qweather.com/v7/weather/3d?key=${weatherKey}&location=${taLocation}`,
          '和风天气-TA城市天气'
        );
      } catch (e) {
        console.error('[每日提醒] TA城市天气获取失败，已忽略：', e.message);
      }
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

    // 用邮件模版生成字符串
    const content = buildContent({
      weatherData,
      lifeData,
      taWeatherData,
      taCity,
      lovingDays,
      city: cityName,
      loveWord,
      signature,
      dateText,
    });

    // 生成卡片图；失败就退回纯文字邮件，保证每天都有邮件
    let htmlStr;
    let attachments;
    let cidImage = '';
    try {
      const png = await renderHtmlToPng(cardHtml(content), {
        width: 720,
        scale: 2,
        format: 'jpeg',
        quality: 85,
      });
      cidImage = 'daily-card';
      attachments = [
        {
          filename: `每日提醒-${now.format('YYYY-MM-DD')}.jpg`,
          content: png,
          cid: cidImage,
        },
      ];
      // 正文只放这张图，点开就是完整内容
      htmlStr = `<div><img src="cid:${cidImage}" alt="每日提醒" style="width:100%;max-width:720px" /></div>`;
    } catch (e) {
      console.error('[每日提醒] 卡片图生成失败，改为发送文字邮件：', e.message);
      htmlStr = emailHtml(content);
    }

    // 发送邮件
    await sendEmail({
      from: fromDisplayText,
      to,
      subject: fromDisplaySubText,
      html: htmlStr,
      attachments,
    });

    console.log(
      `[每日提醒] 已发送至 ${to}，今天是在一起的第 ${lovingDays} 天`
    );
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
