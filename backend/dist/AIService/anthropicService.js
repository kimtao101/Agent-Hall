"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropicAiInstance = exports.anthropicService = exports.AnthropicService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = __importDefault(require("../logger"));
const env_1 = require("../env");
const const_1 = require("../const");
// 创建OpenAI实例
if (!env_1.API_KEY) {
    console.error(`AI_TYPE为${env_1.AI_TYPE}时，API_KEY environment variable is not set`);
    throw new Error(`AI_TYPE为${env_1.AI_TYPE}时，API_KEY environment variable is required`);
}
if (env_1.AI_TYPE === "ANTHROPIC") {
    logger_1.default.info('Using Anthropic API');
}
else {
    logger_1.default.error(`Invalid ${env_1.AI_TYPE} environment variable. Please set it to "DEEPSEEK" or "ANTHROPIC".`);
    throw new Error(`Invalid ${env_1.AI_TYPE} environment variable. Please set it to "DEEPSEEK" or "ANTHROPIC".`);
}
// 初始化客户端
const anthropicAiInstance = new sdk_1.default({
    apiKey: env_1.API_KEY,
    baseURL: env_1.BASE_URL,
});
exports.anthropicAiInstance = anthropicAiInstance;
class AnthropicService {
    /**
     * 建立聊天请求
     * @param request 聊天请求参数
     * @returns 聊天响应
     */
    async createChatCompletion(request) {
        try {
            const startTime = Date.now();
            logger_1.default.info('Creating Anthropic completion', {
                request: {
                    ...request,
                    messages: request.messages.map(msg => ({
                        role: msg.role,
                        content: msg.role === 'user' ? msg.content.substring(0, 100) + '...' : msg.content
                    }))
                }
            });
            //非流式请求
            const completion = await anthropicAiInstance.messages.create({
                messages: request.messages,
                model: request.model || const_1.CLAUDE_MODEL_4_6,
                max_tokens: request.max_tokens,
            });
            const endTime = Date.now();
            logger_1.default.info('Anthropic completion created', {
                response: completion,
                duration: endTime - startTime
            });
            console.log("Anthropic.messages.completions", completion);
            return completion;
        }
        catch (error) {
            logger_1.default.error('Error creating Anthropic completion', { error });
            throw error;
        }
    }
    /**
    * 流式发送聊天请求
    * @param request 聊天请求参数
    * @param onChunk  chunks回调函数
    * @returns 完整响应
    */
    async createChatCompletionStream(request, onChunk) {
        try {
            const startTime = Date.now();
            logger_1.default.info('Creating Anthropic completion stream', {
                request: {
                    ...request,
                    messages: request.messages.map(msg => ({
                        role: msg.role,
                        content: msg.role === 'user' ? msg.content.substring(0, 100) + '...' : msg.content
                    }))
                }
            });
            const stream = await anthropicAiInstance.messages.create({
                messages: request.messages,
                model: request.model || const_1.CLAUDE_MODEL_4_6,
                max_tokens: request.max_tokens,
                stream: true,
            });
            let fullResponse = '';
            for await (const chunk of stream) {
                const delta = chunk.delta?.text || '';
                fullResponse += delta;
                onChunk(delta);
            }
            const endTime = Date.now();
            logger_1.default.info('Anthropic completion stream created', {
                response: fullResponse,
                duration: endTime - startTime
            });
            console.log("Anthropic.messages.completions.stream", fullResponse);
            return fullResponse;
        }
        catch (error) {
            logger_1.default.error('Error creating Anthropic completion stream', { error });
            throw error;
        }
    }
}
exports.AnthropicService = AnthropicService;
// 导出单例实例
exports.anthropicService = new AnthropicService();
