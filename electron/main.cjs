const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const https = require('https');

let mainWindow = null;
let server = null;
let serverPort = 0;

// MIME 类型字典
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startLocalServer(distPath) {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${serverPort || 3000}`);
      const pathname = parsedUrl.pathname;

      // 1. 微信读书反向代理 (/weread-proxy/ -> https://weread.qq.com/)
      if (pathname.startsWith('/weread-proxy')) {
        const targetPath = req.url.replace(/^\/weread-proxy/, '') || '/';
        const proxyReq = https.request(
          `https://weread.qq.com${targetPath}`,
          {
            method: req.method,
            headers: {
              ...req.headers,
              host: 'weread.qq.com',
              referer: 'https://weread.qq.com/',
              origin: 'https://weread.qq.com',
            },
          },
          (proxyRes) => {
            const headers = { ...proxyRes.headers };
            // 剥除阻断安全头
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['content-security-policy-report-only'];

            res.writeHead(proxyRes.statusCode || 200, headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err) => {
          console.error('[Proxy Error]:', err);
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('WeRead Proxy Error');
        });

        req.pipe(proxyReq);
        return;
      }

      // 2. AI 大模型流式转发中间件 (/api/ai-proxy)
      if (pathname === '/api/ai-proxy' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => {
          body += c;
        });
        req.on('end', async () => {
          try {
            const { url, headers, payload } = JSON.parse(body);
            const upstream = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: JSON.stringify(payload),
            });

            res.writeHead(upstream.status, {
              'Content-Type': upstream.headers.get('content-type') || 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            if (!upstream.body) {
              res.end();
              return;
            }

            const reader = upstream.body.getReader();
            const pump = async () => {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                return;
              }
              res.write(value);
              await pump();
            };
            await pump();
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message || 'AI Proxy Error' }));
          }
        });
        return;
      }

      // 3. 静态前端资源托管 (dist/)
      let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      console.log('[weread-plus desktop server] listening on port', serverPort);
      resolve(serverPort);
    });
  });
}

async function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distDir = path.join(__dirname, '../dist');

  // 配置 webRequest 允许微信读书完全无阻碍内嵌
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['content-security-policy-report-only'];
    callback({ responseHeaders });
  });

  let loadUrl = '';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    loadUrl = process.env.VITE_DEV_SERVER_URL;
  } else {
    const port = await startLocalServer(distDir);
    loadUrl = `http://127.0.0.1:${port}`;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: 'weread-plus - 微信读书深度阅读工作台',
    icon: path.join(__dirname, '../src-tauri/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许自由访问 WeRead 内嵌资源
      webviewTag: true,
    },
    autoHideMenuBar: true,
  });

  // 打开外部链接默认调用系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadURL(loadUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
