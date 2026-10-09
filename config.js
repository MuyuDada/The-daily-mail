// 配置信息
//
// 密钥不写在本文件里。优先从环境变量读取（GitHub Actions 用 Secrets 注入），
// 本地开发时放在同目录的 .env 文件里（.env 已被 .gitignore 忽略，不会入库）。
//
// 本地 .env 示例（把值换成你自己的）：
//   MAIL_USER=muyu_dada@qq.com
//   MAIL_PASS=你的SMTP授权码
//   WEATHER_KEY=你的和风天气key
//   WEATHER_LOCATION=101090209      # 默认「我」的城市 LocationID（涞源）
//   MAIL_CITY=涞源                   # 可选：默认「我」的城市名，留空自动反查
//   TIANXING_KEY=你的天行数据key
//   START_DAY=2026-10-01
//   WEATHER_LOCATION_TA=101190701   # 默认「TA」城市 LocationID（盐城），填 off 就整块不显示
//   MAIL_CITY_TA=盐城                # 可选：默认「TA」城市名
//   MAIL_LOVE_NAME=宝贝              # 可选：土味情话里 XXX 占位符的替换词
//   MAIL_THEME=                     # 可选：固定卡片配色（12 套，见 themes.js）；留空则每天轮换
//
// 收件人（MAIL_TO）：可以写多个，用逗号或分号隔开，就会分别单独发送（互相看不到对方地址）。
// 每人一条，格式是 邮箱|我的城市名|我的LocationID|TA的城市名|TA的LocationID，后面的段都可以省略：
//   MAIL_TO=2756390658@qq.com|涞源|101090209;2036781684@qq.com|盐城|101190701
//       → 只有两个人时会自动配对：第一个人左边是自己的涞源、右边是对方的盐城，第二个人反过来
//   MAIL_TO=a@qq.com|涞源|101090209|北京|101010100   # 显式指定 TA 是谁
//   MAIL_TO=a@qq.com,b@qq.com                        # 只写邮箱，都用上面的默认城市
//   MAIL_TO=a@qq.com|101010100                       # 只给 ID，城市名自动反查

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

// 默认的「我」和「TA」城市（收件人没写自己那份时才用）
const taOff = env.WEATHER_LOCATION_TA === 'off';
const defaultMyLocation = env.WEATHER_LOCATION || '101090209';
const defaultTaLoction = taOff ? '' : env.WEATHER_LOCATION_TA || '101190701';
const defaultTaCity = env.MAIL_CITY_TA || '盐城';

/**
 * 解析收件人列表。
 * MAIL_TO 支持多个收件人（逗号或分号分隔），每人一条：
 *   邮箱|我的城市名|我的LocationID|TA的城市名|TA的LocationID
 *
 * 后面的段都可以省略：
 *   a@qq.com|涞源|101090209;b@qq.com|盐城|101190701
 *       → 只有两个人时会自动配对：a 看到自己(涞源) + 对方(盐城)，b 反过来
 *   a@qq.com|涞源|101090209|北京|101010100
 *       → 显式指定 TA 是谁
 *   a@qq.com|101010100
 *       → 只给 ID，城市名自动反查
 */
function parseRecipients(raw) {
  const people = String(raw)
    .split(/[,;，；]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [mail, p2, p3, p4, p5] = chunk.split('|').map((s) => (s || '').trim());

      // 自己的城市：第二段是纯数字就当成 LocationID，否则当成城市名
      let myCity = '';
      let myLocation = '';
      if (p2) {
        if (/^\d+$/.test(p2)) myLocation = p2;
        else myCity = p2;
      }
      if (p3) myLocation = p3;

      // TA 的城市
      let taCity = p4 || '';
      let taLocation = '';
      if (p5) taLocation = p5;

      return {
        to: mail,
        myCity,
        myLocation,
        taCity,
        taLocation,
        hasTa: Boolean(p4 || p5),
      };
    })
    .filter((r) => r.to);

  // 只有两个人、又都没显式写 TA 的时候，自动把对方当成 TA
  if (people.length === 2 && !taOff) {
    for (const p of people) {
      if (p.hasTa) continue;
      const other = people.find((q) => q !== p);
      p.taLocation = other.myLocation || defaultTaLoction;
      p.taCity = other.myCity || '';
    }
  }

  return people.map((p) => ({
    to: p.to,
    myLocation: p.myLocation || defaultMyLocation,
    myCity: p.myCity,
    taLocation: p.taLocation || defaultTaLoction,
    taCity: p.taCity || (p.taLocation ? '' : defaultTaCity),
  }));
}

const recipients = parseRecipients(env.MAIL_TO);

module.exports = {
  fromDisplayText: env.MAIL_FROM_NAME || '小宝', // 收件箱展示的来件人名字
  fromDisplaySubText: env.MAIL_SUBJECT || '每日提醒', // 收件箱展示的次级标题
  user: env.MAIL_USER, // 发送者邮箱
  pass: env.MAIL_PASS, // 发送者邮箱SMTP协议密码（授权码）
  to: recipients[0].to, // 兼容旧用法：第一个收件人
  recipients, // 全部收件人，每项 { to, myLocation, myCity, taLocation, taCity }
  weatherKey: env.WEATHER_KEY, // 和风天气key
  location: defaultMyLocation, // 默认的「我」LocationID（涞源）；注意只认 ID，不能填中文城市名
  type: env.WEATHER_INDICES_TYPE || '1,3,9', // 和风天气-生活指数type
  tianXingKey: env.TIANXING_KEY, // 天行数据的key
  startDay: env.START_DAY || '2026-10-01', // 在一起的日期
  city: env.MAIL_CITY || '', // 默认的「我」城市名；留空则自动按 LocationID 反查
  signature: env.MAIL_SIGNATURE || '爱你的小宝', // 邮件结尾落款（不含「——」）
  taLocation: defaultTaLoction, // 默认的「TA」LocationID（盐城）
  taCity: defaultTaCity, // 默认的「TA」城市名
  loveName: env.MAIL_LOVE_NAME || '宝贝', // 土味情话里 XXX 占位符的替换词
  // 卡片配色：留空则按天数每天轮换一种马卡龙色；填主题名可固定（如 薄荷绿）
  themeName: env.MAIL_THEME || '',
};
