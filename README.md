# The-daily-mail

每天早上自动发一封邮件，内容包含：在一起的第几天、每日一句配图、当天天气和生活指数。

数据来源：[和风天气](https://dev.qweather.com/) + [天行数据「每日一句」](https://www.tianapi.com/)。

## 配置

所有密钥都通过**环境变量**读取，不写进代码。本地开发时在项目根目录创建 `.env` 文件（已被 `.gitignore` 忽略）：

```ini
MAIL_USER=muyu_dada@qq.com          # 发送者邮箱
MAIL_PASS=你的SMTP授权码             # QQ邮箱 → 设置 → 账户 → 开启SMTP后生成的授权码
MAIL_TO=2756390658@qq.com           # 收件人
WEATHER_KEY=你的和风天气key
WEATHER_LOCATION=101090209          # 和风天气 LocationID，只能填数字ID，不能填中文城市名
TIANXING_KEY=你的天行数据key
START_DAY=2026-10-01                # 在一起的日期
```

可选项（有默认值）：`MAIL_FROM_NAME`（默认 `小宝`）、`MAIL_SUBJECT`（默认 `每日提醒`）、`WEATHER_INDICES_TYPE`（默认 `1,3,9`）。

> **怎么查 LocationID**：访问
> `https://geoapi.qweather.com/v2/city/lookup?key=你的key&location=城市名`
> 返回里的 `id` 字段就是。填中文城市名会直接报 HTTP 400。

## 本地运行

```bash
npm install
npm run server
```

## 部署到 GitHub Actions

1. 把代码推送到仓库。
2. 打开仓库 **Settings → Secrets and variables → Actions**，逐个添加：
   `MAIL_USER`、`MAIL_PASS`、`MAIL_TO`、`WEATHER_KEY`、`TIANXING_KEY`，
   可选再加 `WEATHER_LOCATION`、`START_DAY`、`MAIL_FROM_NAME`、`MAIL_SUBJECT`。
3. 到 **Actions** 页面选 `ccy-helper` → **Run workflow** 手动跑一次验证。
4. 之后每天北京时间 08:02 自动执行（cron 用的是 UTC，`02 00 * * *` = 北京 08:02）。

## 出错时

发送失败会打印完整错误栈，并尝试给自己发一封「定时邮件-报错提醒」，同时以非 0 退出码结束——**Actions 会显示红色失败**，不会再静默假绿。
