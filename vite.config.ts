import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ai-proxy-middleware',
      configureServer(server) {
        // 提供一个通用的后端代理中间件，彻底避免前端直连任何 AI Provider (DeepSeek/OpenAI/Ollama) 的 CORS 跨域问题
        server.middlewares.use('/api/ai-proxy', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const { url, headers, payload } = JSON.parse(body);
              if (!url) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing target url' }));
                return;
              }

              // 使用 Node 原生 fetch 请求目标大模型 API
              const upstreamRes = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...headers,
                },
                body: JSON.stringify(payload),
              });

              res.statusCode = upstreamRes.status;
              for (const [key, val] of upstreamRes.headers.entries()) {
                // 转发必要的 SSE 流式头与内容头
                if (key.toLowerCase() === 'content-type' || key.toLowerCase().startsWith('x-')) {
                  res.setHeader(key, val);
                }
              }
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              if (!upstreamRes.body) {
                res.end();
                return;
              }

              // 管道回传流式响应
              const reader = upstreamRes.body.getReader();
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
            } catch (err: any) {
              console.error('[AI Proxy Error]:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'AI Proxy failed' }));
            }
          });
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/weread-proxy': {
        target: 'https://weread.qq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weread-proxy/, ''),
        headers: {
          Referer: 'https://weread.qq.com/',
          Origin: 'https://weread.qq.com',
        },
        cookieDomainRewrite: 'localhost',
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // 剥除可能存在的阻断 iframe 嵌入的安全头
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['content-security-policy-report-only'];
          });
        },
      },
    },
  },
});
