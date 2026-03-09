"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const agent_1 = require("./agent");
const xiaohongshuService_1 = require("./factory/xiaohongshuService");
const logger_1 = __importDefault(require("./logger"));
const app = (0, express_1.default)();
const PORT = 8015;
// 确保logs目录存在
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logsDir = path_1.default.join(__dirname, '..', 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// 配置请求限流
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP限制100个请求
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // 跳过健康检查等特定路径
        return req.path === '/health';
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(limiter);
// Create agent instance
const agent = new agent_1.Agent();
// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API endpoints
/**
 * @swagger
 * /chat:
 *   post:
 *     summary: 发送聊天消息
 *     description: 发送消息给AI助手并获取响应
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户消息
 *     responses:
 *       200:
 *         description: 成功获取AI响应
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            logger_1.default.warn('Invalid message parameter', { body: req.body });
            res.status(400).json({ error: 'Invalid message' });
            return;
        }
        logger_1.default.info('Received chat request', { message: message.substring(0, 100) + '...' });
        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');
        // Generate response with streaming
        await agent.generateResponse(message, (chunk) => {
            res.write(chunk);
        });
        logger_1.default.info('Chat response completed');
        res.end();
    }
    catch (error) {
        logger_1.default.error('Error in /chat endpoint:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * @swagger
 * /xiaohongshu/copy:
 *   post:
 *     summary: 生成小红书文案
 *     description: 根据场景和配置生成小红书风格的文案
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scene:
 *                 type: string
 *                 description: 文案场景
 *               config:
 *                 type: object
 *                 description: 场景配置参数
 *     responses:
 *       200:
 *         description: 成功生成文案
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
app.post('/xiaohongshu/copy', async (req, res) => {
    try {
        const { scene, config } = req.body;
        if (!scene || typeof scene !== 'string') {
            logger_1.default.warn('Invalid scene parameter', { body: req.body });
            res.status(400).json({ error: 'Invalid scene' });
            return;
        }
        if (!config || typeof config !== 'object') {
            logger_1.default.warn('Invalid config parameter', { body: req.body });
            res.status(400).json({ error: 'Invalid config' });
            return;
        }
        logger_1.default.info('Received Xiaohongshu copy request', { scene });
        const result = await xiaohongshuService_1.xiaohongshuService.generateCopy({ scene, config });
        logger_1.default.info('Generated Xiaohongshu copy successfully');
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error in /xiaohongshu/copy endpoint:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * @swagger
 * /history:
 *   get:
 *     summary: 获取聊天历史
 *     description: 获取当前对话的历史记录
 *     responses:
 *       200:
 *         description: 成功获取聊天历史
 *       500:
 *         description: 服务器内部错误
 */
app.get('/history', (req, res) => {
    try {
        const history = agent.getHistory();
        logger_1.default.info('Retrieved chat history', { length: history.length });
        res.json(history);
    }
    catch (error) {
        logger_1.default.error('Error in /history endpoint:', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * @swagger
 * /clear:
 *   post:
 *     summary: 清除聊天历史
 *     description: 清除当前对话的历史记录
 *     responses:
 *       200:
 *         description: 成功清除聊天历史
 *       500:
 *         description: 服务器内部错误
 */
app.post('/clear', (req, res) => {
    try {
        agent.clearHistory();
        logger_1.default.info('Cleared chat history');
        res.json({ success: true });
    }
    catch (error) {
        logger_1.default.error('Error in /clear endpoint:', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 错误处理中间件
app.use((err, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path
    });
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
// Start server
app.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
});
