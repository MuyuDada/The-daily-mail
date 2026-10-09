const nodemailer = require('nodemailer');
const { user, pass } = require('./config');

// 复用同一个连接池，避免每次发送都重新握手
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // 465 端口使用 SSL；secureConnection 是已废弃写法
  auth: {
    user,
    pass,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

const sendMail = async (data) => {
  await transporter.sendMail({
    ...data,
    from: `"${data.from}" ${user}`,
  });
};

module.exports = sendMail;
