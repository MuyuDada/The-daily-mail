# The-daily-mail

每天早上自动发一封邮件：一张卡片长图，内容包含「我们在一起的第几天」、今天的天气与生活指数、**TA 那边的天气**、**今日黄历**，以及一句土味情话。卡片配色每天自动换一种。

数据来源：[和风天气](https://dev.qweather.com/) + [天行数据](https://www.tianapi.com/)；黄历由本地算法推算，不联网。

## 配置

所有密钥都通过**环境变量**读取，不写进代码。本地开发时在项目根目录创建 `.env` 文件（已被 `.gitignore` 忽略）：

```ini
MAIL_USER=you@example.com            # 发送者邮箱
MAIL_PASS=你的SMTP授权码             # QQ邮箱 → 设置 → 账户 → 开启SMTP后生成的授权码
MAIL_TO=you@example.com|北京|101010100;ta@example.com|上海|101020100
WEATHER_KEY=你的和风天气key
WEATHER_LOCATION=101010100          # 默认「我」的城市 LocationID，只能填数字ID，不能填中文城市名
MAIL_CITY=北京                       # 可选：默认「我」的城市显示名，留空自动反查
TIANXING_KEY=你的天行数据key
START_DAY=2020-01-01                # 在一起的日期
WEATHER_LOCATION_TA=101020100       # 可选：默认「TA」城市 LocationID，填 off 整块不显示
MAIL_CITY_TA=上海                    # 可选：默认「TA」城市名
```

### 发给多个人

`MAIL_TO` 可以写多个收件人，用**逗号或分号**隔开。每个人会**分别单独收到一封**邮件（互相看不到对方的地址），某个人失败也不影响其他人。

每个人有**自己的城市**（左边那栏，带生活指数）和**对方城市**（右边「TA」那栏，只有天气）。格式是
`邮箱|我的城市名|我的LocationID|TA的城市名|TA的LocationID`，后面的段都可以省略：

```ini
MAIL_TO=you@example.com|北京|101010100;ta@example.com|上海|101020100
```

**只有两个人的时候会自动配对**：第一个人左边是自己的北京、右边是对方的上海，第二个人正好反过来。也就是说上面这种写法，两个人各自看到的卡片是**镜像的**——谁都不用额外写 TA 是谁。

| 写法 | 含义 |
| --- | --- |
| `a@example.com\|北京\|101010100;b@example.com\|上海\|101020100` | 两人自动互为 TA（推荐） |
| `a@example.com\|北京\|101010100\|广州\|101280101` | 显式指定这个人的 TA 是广州 |
| `a@example.com,b@example.com` | 只写邮箱，都用默认城市 |
| `a@example.com\|101010100` | 只给 ID，城市名自动反查 |

> 分隔符是逗号/分号，所以城市名里不要带逗号。

可选项（有默认值）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `MAIL_FROM_NAME` | `皇上` | 收件箱展示的来件人 |
| `MAIL_SUBJECT` | `每日请安😘❤❤❤` | 邮件标题 |
| `WEATHER_INDICES_TYPE` | `1,3,9` | 生活指数类型（1运动 3穿衣 9感冒） |
| `WEATHER_LOCATION` | `101010100` | 默认「我」城市的 LocationID（示例值，建议自己配） |
| `MAIL_CITY` | 自动反查 | 默认「我」城市显示名 |
| `WEATHER_LOCATION_TA` | `101020100` | 默认「TA」城市 LocationID（示例值）；**填 `off` 则不显示这一块** |
| `MAIL_CITY_TA` | `上海` | 默认「TA」城市名 |
| `MAIL_SIGNATURE` | `爱你的皇上` | 落款 |
| `MAIL_LOVE_NAME` | `爱妃` | 土味情话里 `XXX` 占位符的替换词 |
| `MAIL_THEME` | 每天轮换 | 固定卡片配色，可选下面 12 个主题名；留空则按天数每天换一种 |

> **怎么查 LocationID**：访问
> `https://geoapi.qweather.com/v2/city/lookup?key=你的key&location=城市名`
> 返回里的 `id` 字段就是。填中文城市名会直接报 HTTP 400。

## 卡片图是怎么生成的

用本机 Chrome 的**无头模式 + DevTools 协议**整页截图，纯 Node 实现，不依赖 puppeteer：

- `content.js` —— 把接口数据整理成结构化内容（邮件与图片共用，保证两边一致）
- `themes.js` —— 12 套马卡龙配色，按天数每天轮换一种（相邻两天不重样）
- `cardHtml.js` —— 卡片模板，颜色全部取自主题
- `huangli.js` —— 黄历适配层，把本地万年历数据整理成卡片需要的字段
- `render.js` —— 启动 Chrome、量高度、整页截图
- `emailHtml.js` —— 纯文字兜底模板

配色（`MAIL_THEME` 可固定一种，留空则每天换）：

| 主题名 | 感觉 |
| --- | --- |
| `蜜桃粉` | 原本的粉色，温柔甜 |
| `薄荷绿` | 清爽干净 |
| `薰衣草紫` | 安静柔和 |
| `奶油黄` | 温暖明亮 |
| `天空蓝` | 清新通透 |
| `蜜桃橘` | 暖调活泼 |
| `雾霾蓝` | 低饱和的灰蓝，沉静 |
| `奶茶色` | 奶咖色，柔和耐看 |
| `抹茶绿` | 偏黄的绿，清新自然 |
| `莓果粉` | 比蜜桃粉更深一点，浓郁 |
| `海洋青` | 青蓝调，清凉通透 |
| `丁香紫` | 灰调的紫，温柔雅致 |

**卡片图生成失败时会自动退回纯文字邮件**（比如没有 Chrome 的机器），保证每天都有邮件。原因会打印在日志里。

## 黄历

卡片下方会附上当天的黄历，数据来自本地万年历算法，**不联网、不依赖第三方接口**：

- `vendor/zhwnl-almanac.js` —— 万年历数据源（约 176 KB，纯查表，导出 `{ almanac, lunar }`）
- `huangli.js` —— 适配层，导出 `getHuangli({ year, month, date })` 和 `shichenRange()`

算法源自微鲤万年历（m.zhwnl.cn）的前端推算代码；开发时曾用香港天文台（HKO）的公开农历数据做过全量比对，两边一致。`vendor/zhwnl-almanac.js` 是纯查表数据，不含网络请求。

卡片上保留的字段：

| 区块 | 内容 |
| --- | --- |
| 顶部 | 农历月日、干支、生肖 |
| 宜 / 忌 | 各一行标签（核心信息） |
| 左下三格 | 冲煞、五行、建除 |
| 右下半区 | 吉神方位九宫格（财神 / 喜神 / 福神 / 阳贵），布局按「上为正北」 |

刻意省掉了这些字段，理由是重复或过于专业，放在卡片上只会变成噪音：公历日期与星期（卡片底部已有）、值神、二十八宿、彭祖百忌、胎神、时辰吉凶。

黄历推算失败时只跳过这一块并打印日志，不影响当天发信。

## 本地运行

```bash
npm install
npm run server
```

## 部署到 GitHub Actions

1. 把代码推送到仓库。
2. 打开仓库 **Settings → Secrets and variables → Actions**，逐个添加：
   `MAIL_USER`、`MAIL_PASS`、`MAIL_TO`、`WEATHER_KEY`、`TIANXING_KEY`，
   可选再加 `WEATHER_LOCATION`、`MAIL_CITY`、`START_DAY`、`WEATHER_LOCATION_TA`、`MAIL_CITY_TA`、`MAIL_THEME` 等。
   `MAIL_TO` 写多个人时，把上面那串 `邮箱|我的城市名|我的LocationID;邮箱|我的城市名|我的LocationID` 整段填进 Secret 的值里（两个人时会自动互为 TA）。
3. 到 **Actions** 页面选 `daily-mail` → **Run workflow** 手动跑一次验证。
4. 之后每天北京时间 08:02 自动执行（cron 用的是 UTC，`02 00 * * *` = 北京 08:02）。

> CI 上跑卡片图需要中文字体，workflow 里已经装了 `fonts-noto-cjk` 和 `fonts-noto-color-emoji`——不装的话中文会变方框、emoji 会变黑白。

### 定时任务为什么排了三档

GitHub 的 `schedule` 触发在负载高的时候**会被延迟，甚至整次被丢弃**（[官方文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)原话：*some queued jobs may be dropped*，高负载时段包括**每个整点**）。实测也确实发生过：有一次本该 00:02 UTC 触发的运行，实际迟到了 **4 小时 38 分**。

所以 workflow 里连着排了三档（北京 08:02 / 09:02 / 10:02）：

```yaml
- cron: "02 00 * * *"   # 北京 08:02
- cron: "02 01 * * *"   # 北京 09:02
- cron: "02 02 * * *"   # 北京 10:02
```

前一档迟到或被丢掉时，后一档会补上。**同一天不会重复发送**：`index.js` 发送成功后会写一个 `.last-sent` 文件（内容是北京时间日期），下一次运行读到是今天就跳过。工作流随后会把这个文件提交回仓库。

> 想强制重发一次：在 Actions 里手动 Run workflow 前，把仓库变量 `FORCE_SEND` 设为 `1`（或本地 `FORCE_SEND=1 node index.js`）。
>
> 顺带的好处：这个每日提交让仓库始终保持活动状态，避免 **public 仓库连续 60 天没有活动时定时任务被 GitHub 自动禁用**。如果哪天发现定时任务彻底不跑了，先去 Actions 页面看工作流是不是被 disable 了，点 **Enable workflow** 即可恢复。

## 出错时

发送失败会打印完整错误栈，并尝试给自己发一封「定时邮件-报错提醒」，同时以非 0 退出码结束——**Actions 会显示红色失败**，不会再静默假绿。

> 注意：job 显示绿色**不等于**功能正常。如果怀疑卡片图没生成，去那次运行的 `Run Project` 步骤里搜「卡片图生成失败」。
