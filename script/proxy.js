import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express();

// /fetch/* -> backend :8080
app.use(
    '/fetch',
    createProxyMiddleware({
        target: 'http://192.168.0.200:8080',
        changeOrigin: true,
        pathRewrite: {
            '^/fetch': '',
        },
    })
);

// Everything else -> existing web server :3000
app.use(
    '/',
    createProxyMiddleware({
        target: 'http://192.168.0.200:3000',
        changeOrigin: true,
    })
);

app.listen(8181, '0.0.0.0', () => {
    console.log('Proxy running at http://192.168.0.200:8181');
});