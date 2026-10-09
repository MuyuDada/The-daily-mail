const fetch = require('node-fetch');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const sendEmail = require('./sendEmail');
const emailHtml = require('./emailHtml');

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
} = require('./config');

const TZ = 'Asia/Shanghai';

/**
 * 请求 JSON 接口，并校验业务状态码。
 * 和风天气成功时返回 { code: '200' }，失败时可能返回非 200 的 code 或 HTTP 400。
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

    // 获取one一个文案及图片
    const oneData = await fetchJson(
      `http://api.tianapi.com/txapi/one/index?key=${tianXingKey}`,
      '天行数据-每日一句'
    );
    const one = (oneData.newslist || [])[0] || {};
    const word = one.word || '';
    const imgurl = one.imgurl || '';

    // 计算日期：两端都按北京时间「当天 00:00」对齐，避免运行机器时区不同导致差一天
    const lovingDays = dayjs()
      .tz(TZ)
      .startOf('day')
      .diff(dayjs.tz(startDay, TZ).startOf('day'), 'days');

    // 用邮件模版生成字符串
    const htmlStr = emailHtml(weatherData, lifeData, word, imgurl, lovingDays);

    // 发送邮件
    await sendEmail({
      from: fromDisplayText,
      to,
      subject: fromDisplaySubText,
      html: htmlStr,
    });

    console.log(`[每日提醒] 已发送至 ${to}，今天是在一起的第 ${lovingDays} 天`);
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
