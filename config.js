// 配置信息
//
// 密钥不写在本文件里。优先从环境变量读取（GitHub Actions 用 Secrets 注入），
// 本地开发时放在同目录的 .env 文件里（.env 已被 .gitignore 忽略，不会入库）。
//
// 本地 .env 示例（把值换成你自己的）：
//   MAIL_USER=muyu_dada@qq.com
//   MAIL_PASS=你的SMTP授权码
//   MAIL_TO=2756390658@qq.com
//   WEATHER_KEY=你的和风天气key
//   WEATHER_LOCATION=101090209
//   TIANXING_KEY=你的天行数据key
//   START_DAY=2026-10-01
//   WEATHER_LOCATION_TA=101190701   # 可选：TA 城市的 LocationID（盐城）
//   MAIL_CITY_TA=盐城                # 可选：TA 的城市名
//   MAIL_LOVE_NAME=宝贝              # 可选：土味情话里 XXX 占位符的替换词

const fs = require('fs');
const path = require('path');

// 轻量读取 .env（不依赖任何第三方库，Node 20 也能用）
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // 去掉可选的引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // 环境变量优先于 .env
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const env = process.env;

// 缺失的必填项，直接给出明确报错，而不是等接口返回 400
const missing = ['MAIL_USER', 'MAIL_PASS', 'MAIL_TO', 'WEATHER_KEY', 'TIANXING_KEY'].filter(
  (k) => !env[k]
);
if (missing.length) {
  throw new Error(
    `缺少必需的环境变量：${missing.join(', ')}。` +
      `请在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置，` +
      `或在本地创建 .env 文件（参考本文件顶部注释）。`
  );
}

module.exports = {
  fromDisplayText: env.MAIL_FROM_NAME || '小宝', // 收件箱展示的来件人名字
  fromDisplaySubText: env.MAIL_SUBJECT || '每日提醒', // 收件箱展示的次级标题
  user: env.MAIL_USER, // 发送者邮箱
  pass: env.MAIL_PASS, // 发送者邮箱SMTP协议密码（授权码）
  to: env.MAIL_TO, // 发送到谁
  weatherKey: env.WEATHER_KEY, // 和风天气key
  location: env.WEATHER_LOCATION || '101090209', // 和风天气 LocationID（涞源）；注意只认 ID，不能填中文城市名
  type: env.WEATHER_INDICES_TYPE || '1,3,9', // 和风天气-生活指数type
  tianXingKey: env.TIANXING_KEY, // 天行数据的key
  startDay: env.START_DAY || '2026-10-01', // 在一起的日期
  city: env.MAIL_CITY || '', // 邮件里显示的「今日X天气」；留空则自动按 LocationID 反查城市名
  signature: env.MAIL_SIGNATURE || '爱你的小宝', // 邮件结尾落款（不含「——」）
  // TA 那边的天气（只要天气情况，不带生活指数）；填 off 就整块不显示
  taLocation:
    env.WEATHER_LOCATION_TA === 'off'
      ? ''
      : env.WEATHER_LOCATION_TA || '101190701', // TA 城市的和风 LocationID（盐城）
  taCity: env.MAIL_CITY_TA || '盐城', // TA 的城市名
  loveName: env.MAIL_LOVE_NAME || '宝贝', // 土味情话里 XXX 占位符的替换词
};
