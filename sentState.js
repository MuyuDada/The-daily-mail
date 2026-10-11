// 「今天是不是已经发过了」的标记文件。
//
// 为什么需要它：GitHub 的 schedule 触发在高负载时会被延迟，甚至整次被丢弃
// （官方文档原话：some queued jobs may be dropped）。所以工作流里连着配了好几个
// 时间点，前一档迟到或被丢掉时后一档能补上。但这样同一天就可能跑好几次，于是
// 需要一个标记：发过就跳过，保证一天只发一封。
//
// 标记就是一个存日期（北京时间 YYYY-MM-DD）的小文件，由工作流在发送成功后提交
// 回仓库，下一次运行 checkout 下来就能看到。顺带的好处：仓库每天都有一次提交，
// 不会因为「public 仓库 60 天无活动」被自动禁用定时任务。

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '.last-sent');

/** 读上次发送成功的日期（北京时间 YYYY-MM-DD）；文件不存在或读失败返回空串 */
function readLastSent() {
  try {
    return fs.readFileSync(STATE_FILE, 'utf8').trim();
  } catch (e) {
    return '';
  }
}

/** 记下今天已发送 */
function writeLastSent(dateKey) {
  fs.writeFileSync(STATE_FILE, `${dateKey}\n`, 'utf8');
}

module.exports = { readLastSent, writeLastSent, STATE_FILE };
