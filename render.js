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
    ws = new WebSocket(wsUrl);
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
      clip: { x: 0, y: 0, width, height: fullHeight, scale },
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
