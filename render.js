/**
 * 把 HTML 渲染成一张整页长图（PNG Buffer）。
 *
 * 原理：用本机 Chrome 的无头模式打开 HTML，通过 DevTools 协议先量出
 * 内容真实高度，再按这个高度整页截图（captureBeyondViewport）。
 * 纯 Node，不引入 puppeteer，避免多装几百 MB 依赖。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findBrowser() {
  for (const p of CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      /* 忽略 */
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`, { timeout: 1500 });
      const list = await r.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      /* 还没起来，继续等 */
    }
    await sleep(200);
  }
  throw new Error('Chrome 调试端口未就绪');
}

/**
 * 极简 WebSocket 客户端（RFC 6455 子集）。
 *
 * 为什么需要它：Node 20（GitHub Actions 用的版本）没有全局 WebSocket，
 * 直接 new WebSocket(...) 会抛 "WebSocket is not defined"，卡片图就生成不了。
 * 这里用 net + 手写帧协议实现，保持零依赖。
 */
class MiniWebSocket {
  constructor(url) {
    const u = new URL(url);
    this._listeners = { open: [], message: [], error: [], close: [] };
    this._buf = Buffer.alloc(0);
    this._frags = [];
    this._handshook = false;

    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.connect(Number(u.port || 80), u.hostname, () => {
      socket.write(
        `GET ${u.pathname}${u.search} HTTP/1.1\r\n` +
          `Host: ${u.host}\r\n` +
          `Upgrade: websocket\r\n` +
          `Connection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${key}\r\n` +
          `Sec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    this._socket = socket;
    this._key = key;
    socket.on('error', (e) => this._emit('error', e));
    socket.on('close', () => this._emit('close', {}));
    socket.on('data', (chunk) => this._onData(chunk));
  }

  addEventListener(type, fn, opts) {
    const list = this._listeners[type];
    if (!list) return;
    if (opts && opts.once) {
      const once = (ev) => {
        this.removeEventListener(type, once);
        fn(ev);
      };
      once._orig = fn;
      list.push(once);
    } else {
      list.push(fn);
    }
  }

  removeEventListener(type, fn) {
    const list = this._listeners[type];
    if (!list) return;
    const i = list.findIndex((f) => f === fn || f._orig === fn);
    if (i >= 0) list.splice(i, 1);
  }

  _emit(type, ev) {
    const list = (this._listeners[type] || []).slice();
    for (const fn of list) {
      try {
        fn(ev);
      } catch (e) {
        /* 忽略回调异常 */
      }
    }
  }

  send(str) {
    this._frame(0x1, Buffer.from(str, 'utf8'));
  }

  close() {
    try {
      this._socket.end();
    } catch (e) {
      /* 忽略 */
    }
  }

  _frame(opcode, payload) {
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.allocUnsafe(6);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.allocUnsafe(8);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.allocUnsafe(14);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeUInt32BE(Math.floor(len / 4294967296), 2);
      header.writeUInt32BE(len >>> 0, 6);
    }
    const mask = crypto.randomBytes(4);
    mask.copy(header, header.length - 4);
    const masked = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
    this._socket.write(Buffer.concat([header, masked]));
  }

  _onData(chunk) {
    this._buf = Buffer.concat([this._buf, chunk]);

    if (!this._handshook) {
      const idx = this._buf.indexOf('\r\n\r\n');
      if (idx < 0) return;
      const head = this._buf.slice(0, idx).toString('latin1');
      this._buf = this._buf.slice(idx + 4);
      const expect = crypto
        .createHash('sha1')
        .update(this._key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');
      const m = /sec-websocket-accept:\s*(\S+)/i.exec(head);
      if (!m || m[1].trim() !== expect) {
        this._emit('error', new Error('WebSocket 握手失败'));
        return;
      }
      this._handshook = true;
      this._emit('open', {});
    }

    for (;;) {
      if (this._buf.length < 2) return;
      const b0 = this._buf[0];
      const b1 = this._buf[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) {
        if (this._buf.length < 4) return;
        len = this._buf.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (this._buf.length < 10) return;
        len = this._buf.readUInt32BE(2) * 4294967296 + this._buf.readUInt32BE(6);
        off = 10;
      }
      let mask;
      if (masked) {
        if (this._buf.length < off + 4) return;
        mask = this._buf.slice(off, off + 4);
        off += 4;
      }
      if (this._buf.length < off + len) return;

      let payload = this._buf.slice(off, off + len);
      this._buf = this._buf.slice(off + len);
      if (masked) {
        const p = Buffer.allocUnsafe(len);
        for (let i = 0; i < len; i++) p[i] = payload[i] ^ mask[i & 3];
        payload = p;
      }

      if (opcode === 0x9) {
        this._frame(0xa, payload); // ping -> pong
        continue;
      }
      if (opcode === 0xa) continue; // pong
      if (opcode === 0x8) {
        this._emit('close', {});
        try {
          this._socket.end();
        } catch (e) {
          /* 忽略 */
        }
        return;
      }
      if (opcode === 0x1 || opcode === 0x2 || opcode === 0x0) {
        this._frags.push(payload);
        if (fin) {
          const data = Buffer.concat(this._frags);
          this._frags = [];
          this._emit('message', { data: data.toString('utf8') });
        }
      }
    }
  }
}

/** 极简 CDP 调用封装 */
function makeCdp(ws) {
  let seq = 0;
  return (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      const onMsg = (ev) => {
        let m;
        try {
          m = JSON.parse(ev.data);
        } catch (e) {
          return;
        }
        if (m.id !== id) return;
        ws.removeEventListener('message', onMsg);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
}

/**
 * @param {string} html 完整 HTML 文档
 * @param {object} [opts]
 * @param {number} [opts.width] 视口宽度（默认 720）
 * @param {number} [opts.scale] 像素密度（默认 2，即 2 倍图）
 * @param {string} [opts.format] 'jpeg'（默认，体积小）或 'png'
 * @param {number} [opts.quality] jpeg 质量，默认 92
 * @returns {Promise<Buffer>}
 */
async function renderHtmlToPng(html, opts = {}) {
  const width = Number(opts.width || 720);
  const scale = Number(opts.scale || 2);
  const format = opts.format === 'png' ? 'png' : 'jpeg';
  const quality = Number(opts.quality || 92);

  const browser = findBrowser();
  if (!browser) {
    throw new Error(
      '没有找到 Chrome/Edge，无法生成图片。请安装 Chrome，或用 CHROME_PATH 环境变量指定浏览器路径。'
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-card-'));
  const htmlFile = path.join(tmpDir, 'card.html');
  fs.writeFileSync(htmlFile, html, 'utf8');

  const port = 9200 + Math.floor(Math.random() * 400);
  const userDataDir = path.join(tmpDir, 'profile');

  const child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      // CI（容器/root 用户）下必须关掉沙箱，否则 Chrome 起不来
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // 容器里 /dev/shm 很小，不加这个容易崩
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true }
  );

  let ws;
  try {
    const wsUrl = await waitForCdp(port, 20000);
    ws = new MiniWebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('CDP 连接失败')), {
        once: true,
      });
    });

    const cdp = makeCdp(ws);
    await cdp('Page.enable');
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: 600,
      deviceScaleFactor: scale,
      mobile: false,
    });

    await cdp('Page.navigate', {
      url: 'file:///' + htmlFile.replace(/\\/g, '/'),
    });
    await sleep(900); // 等字体与布局稳定

    const { result } = await cdp('Runtime.evaluate', {
      expression:
        'Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight))',
      returnByValue: true,
    });
    const fullHeight = Math.max(1, Number(result.value) || 600);

    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: fullHeight,
      deviceScaleFactor: scale,
      mobile: false,
    });

    const shot = await cdp('Page.captureScreenshot', {
      format,
      quality: format === 'jpeg' ? quality : undefined,
      captureBeyondViewport: true,
      // clip.scale 固定为 1：清晰度已经由 deviceScaleFactor 控制，
      // 两者相乘会变成 4 倍图（体积翻好几倍），没必要。
      clip: { x: 0, y: 0, width, height: fullHeight, scale: 1 },
    });

    return Buffer.from(shot.data, 'base64');
  } finally {
    try {
      if (ws) ws.close();
    } catch (e) {
      /* 忽略 */
    }
    try {
      child.kill();
    } catch (e) {
      /* 忽略 */
    }
    // 清理临时目录（Chrome 可能还占着文件，失败就算了）
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      /* 忽略 */
    }
  }
}

module.exports = { renderHtmlToPng, findBrowser };
