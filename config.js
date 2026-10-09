// 配置信息
//
// 密钥不写在本文件里。优先从环境变量读取（GitHub Actions 用 Secrets 注入），
// 本地开发时放在同目录的 .env 文件里（.env 已被 .gitignore 忽略，不会入库）。
//
// 本地 .env 示例（把值换成你自己的；下面是占位值，不是真实配置）：
//   MAIL_USER=you@example.com
//   MAIL_PASS=你的SMTP授权码
//   WEATHER_KEY=你的和风天气key
//   WEATHER_LOCATION=101010100      # 默认「我」的城市 LocationID（示例：北京）
//   MAIL_CITY=北京                   # 可选：默认「我」的城市名，留空自动反查
//   TIANXING_KEY=你的天行数据key
//   START_DAY=2020-01-01
//   WEATHER_LOCATION_TA=101020100   # 默认「TA」城市 LocationID，填 off 就整块不显示
//   MAIL_CITY_TA=上海                # 可选：默认「TA」城市名
//   MAIL_LOVE_NAME=宝贝              # 可选：土味情话里 XXX 占位符的替换词
//   MAIL_THEME=                     # 可选：固定卡片配色（12 套，见 themes.js）；留空则每天轮换
//
// 收件人（MAIL_TO）：可以写多个，用逗号或分号隔开，就会分别单独发送（互相看不到对方地址）。
// 每人一条，格式是 邮箱|我的城市名|我的LocationID|TA的城市名|TA的LocationID，后面的段都可以省略：
//   MAIL_TO=you@example.com|北京|101010100;ta@example.com|上海|101020100
//       → 只有两个人时会自动配对：第一个人左边是自己的北京、右边是对方的上海，第二个人反过来
//   MAIL_TO=a@example.com|北京|101010100|广州|101280101   # 显式指定 TA 是谁
//   MAIL_TO=a@example.com,b@example.com                   # 只写邮箱，都用上面的默认城市
//   MAIL_TO=a@example.com|101010100                       # 只给 ID，城市名自动反查

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
// 注意：这里的默认值只是通用示例，真实城市请在 .env 或 GitHub Secrets 里配置。
const taOff = env.WEATHER_LOCATION_TA === 'off';
const defaultMyLocation = env.WEATHER_LOCATION || '101010100';
const defaultTaLoction = taOff ? '' : env.WEATHER_LOCATION_TA || '101020100';
const defaultTaCity = env.MAIL_CITY_TA || '上海';

/**
 * 解析收件人列表。
 * MAIL_TO 支持多个收件人（逗号/分号/换行分隔），每人一条：
 *   邮箱|我的城市名|我的LocationID|TA的城市名|TA的LocationID
 *
 * 后面的段都可以省略：
 *   a@example.com|北京|101010100;b@example.com|上海|101020100
 *       → 只有两个人时会自动配对：a 看到自己(北京) + 对方(上海)，b 反过来
 *   a@example.com|北京|101010100|广州|101280101
 *       → 显式指定 TA 是谁
 *   a@example.com|101010100
 *       → 只给 ID，城市名自动反查
 *
 * 容错：很多人会连变量名一起复制（MAIL_TO=a@example.com），这里会剥掉开头的
 * 「变量名=」，也会把换行当分隔符，省得因为多粘了几个字就发错地址。
 */
function parseRecipients(raw) {
  const people = String(raw)
    // 换行也当分隔符：整段 .env 粘进来时不会连成一条
    .split(/[,;，；\r\n]+/)
    .map((chunk) => chunk.trim())
    // 剥掉可能被一起粘进来的「MAIL_TO=」「邮箱=」这类前缀
    .map((chunk) => chunk.replace(/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*/, '').trim())
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

  // 地址不像邮箱就直接报错，免得跑到 SMTP 那一步才看到 550
  const bad = people.filter((p) => !/^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/.test(p.to));
  if (bad.length) {
    throw new Error(
      `MAIL_TO 里的收件人地址不合法：${bad.map((b) => `「${b.to}」`).join('、')}。` +
        `正确写法示例：you@example.com|北京|101010100;ta@example.com|上海|101020100 ` +
        `（只填地址和城市，不要把「MAIL_TO=」也写进去）`
    );
  }

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
  location: defaultMyLocation, // 默认的「我」LocationID；注意只认 ID，不能填中文城市名
  type: env.WEATHER_INDICES_TYPE || '1,3,9', // 和风天气-生活指数type
  tianXingKey: env.TIANXING_KEY, // 天行数据的key
  startDay: env.START_DAY || '2020-01-01', // 在一起的日期（真实日期请在 .env / Secrets 里配置）
  city: env.MAIL_CITY || '', // 默认的「我」城市名；留空则自动按 LocationID 反查
  signature: env.MAIL_SIGNATURE || '爱你的小宝', // 邮件结尾落款（不含「——」）
  taLocation: defaultTaLoction, // 默认的「TA」LocationID
  taCity: defaultTaCity, // 默认的「TA」城市名
  loveName: env.MAIL_LOVE_NAME || '宝贝', // 土味情话里 XXX 占位符的替换词
  // 卡片配色：留空则按天数每天轮换一种马卡龙色；填主题名可固定（如 薄荷绿）
  themeName: env.MAIL_THEME || '',
};
