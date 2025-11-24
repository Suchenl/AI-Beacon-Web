
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, '.', '');

    return {
        plugins: [
            react(),
            // Plugin to serve assets folder as static files
            {
                name: 'serve-assets',
                configureServer(server) {
                    server.middlewares.use('/assets', (req, res, next) => {
                        const filePath = join(process.cwd(), 'assets', req.url || '');
                        if (existsSync(filePath)) {
                            const ext = filePath.split('.').pop()?.toLowerCase();
                            const contentType = ext === 'ico' ? 'image/x-icon' :
                                ext === 'png' ? 'image/png' :
                                    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                                        ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
                            res.setHeader('Content-Type', contentType);
                            const fileContent = readFileSync(filePath);
                            res.end(fileContent);
                        } else {
                            next();
                        }
                    });
                },
            },
        ],
        define: {
            // Polyfill API keys for all supported models
            'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.VITE_OPENAI_API_KEY || env.VITE_ANTHROPIC_API_KEY || env.VITE_QWEN_API_KEY || env.DASHSCOPE_API_KEY || env.VITE_GROK_API_KEY),
            'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
            'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
            'process.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY),
            'process.env.VITE_QWEN_API_KEY': JSON.stringify(env.VITE_QWEN_API_KEY),
            'process.env.DASHSCOPE_API_KEY': JSON.stringify(env.DASHSCOPE_API_KEY),
            'process.env.VITE_GROK_API_KEY': JSON.stringify(env.VITE_GROK_API_KEY),
        },
    };
});
