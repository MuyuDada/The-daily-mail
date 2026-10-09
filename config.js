// 配置信息
//
// 密钥不写在本文件里。优先从环境变量读取（GitHub Actions 用 Secrets 注入），
// 本地开发时放在同目录的 .env 文件里（.env 已被 .gitignore 忽略，不会入库）。
//
// 本地 .env 示例（把值换成你自己的）：
//   MAIL_USER=muyu_dada@qq.com
//   MAIL_PASS=你的SMTP授权码
//   WEATHER_KEY=你的和风天气key
//   WEATHER_LOCATION=101190701      # 「我」的城市 LocationID（盐城）
//   TIANXING_KEY=你的天行数据key
//   START_DAY=2026-10-01
//   WEATHER_LOCATION_TA=101090209   # 可选：「TA」默认城市的 LocationID（涞源），填 off 就整块不显示
//   MAIL_CITY_TA=涞源                # 可选：「TA」默认城市名
//   MAIL_LOVE_NAME=宝贝              # 可选：土味情话里 XXX 占位符的替换词
//   MAIL_THEME=                     # 可选：固定卡片配色（12 套，见 themes.js）；留空则每天轮换
//
// 收件人（MAIL_TO）：可以写多个，用逗号或分号隔开，就会分别单独发送（互相看不到对方地址）。
// 每个收件人可以带自己的「TA 城市」，格式是 邮箱|城市名|LocationID，城市名和 ID 都可省略：
//   MAIL_TO=2756390658@qq.com|涞源|101090209;other@qq.com|北京|101010100
//   MAIL_TO=2756390658@qq.com,other@qq.com          # 只写邮箱，就用上面的默认 TA 城市
//   MAIL_TO=2756390658@qq.com|101010100             # 只给 ID，城市名自动反查

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

// 「TA」默认城市（收件人没写自己那份时用这个）
const defaultTaLoction =
  env.WEATHER_LOCATION_TA === 'off' ? '' : env.WEATHER_LOCATION_TA || '101090209';
const defaultTaCity = env.MAIL_CITY_TA || '涞源';

/**
 * 解析收件人列表。
 * MAIL_TO 支持多个收件人（逗号或分号分隔），每人一条 邮箱|城市名|LocationID：
 *   a@qq.com|涞源|101090209;b@qq.com|北京|101010100
 *   a@qq.com,b@qq.com            → 都用默认 TA 城市
 *   a@qq.com|101010100           → 只给 ID，城市名留空由程序反查
 */
function parseRecipients(raw) {
  return String(raw)
    .split(/[,;，；]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [mail, second, third] = chunk.split('|').map((s) => (s || '').trim());
      // 第二段是纯数字（或 9 位以上数字）就当成 LocationID，否则当成城市名
      let taCity = '';
      let taLocation = '';
      if (second) {
        if (/^\d+$/.test(second)) taLocation = second;
        else taCity = second;
      }
      if (third) taLocation = third;

      return {
        to: mail,
        taLocation: taLocation || defaultTaLoction,
        taCity: taCity || (taLocation ? '' : defaultTaCity),
      };
    })
    .filter((r) => r.to);
}

const recipients = parseRecipients(env.MAIL_TO);

module.exports = {
  fromDisplayText: env.MAIL_FROM_NAME || '小宝', // 收件箱展示的来件人名字
  fromDisplaySubText: env.MAIL_SUBJECT || '每日提醒', // 收件箱展示的次级标题
  user: env.MAIL_USER, // 发送者邮箱
  pass: env.MAIL_PASS, // 发送者邮箱SMTP协议密码（授权码）
  to: recipients[0].to, // 兼容旧用法：第一个收件人
  recipients, // 全部收件人，每项 { to, taLocation, taCity }
  weatherKey: env.WEATHER_KEY, // 和风天气key
  location: env.WEATHER_LOCATION || '101190701', // 「我」的和风 LocationID（盐城）；注意只认 ID，不能填中文城市名
  type: env.WEATHER_INDICES_TYPE || '1,3,9', // 和风天气-生活指数type
  tianXingKey: env.TIANXING_KEY, // 天行数据的key
  startDay: env.START_DAY || '2026-10-01', // 在一起的日期
  city: env.MAIL_CITY || '', // 邮件里显示的「今日X天气」；留空则自动按 LocationID 反查城市名
  signature: env.MAIL_SIGNATURE || '爱你的小宝', // 邮件结尾落款（不含「——」）
  // 「TA」那边的天气（只要天气情况，不带生活指数）；填 off 就整块不显示
  taLocation: defaultTaLoction, // 「TA」默认城市的和风 LocationID（涞源）
  taCity: defaultTaCity, // 「TA」默认城市名
  loveName: env.MAIL_LOVE_NAME || '宝贝', // 土味情话里 XXX 占位符的替换词
  // 卡片配色：留空则按天数每天轮换一种马卡龙色；填主题名可固定（如 薄荷绿）
  themeName: env.MAIL_THEME || '',
};
