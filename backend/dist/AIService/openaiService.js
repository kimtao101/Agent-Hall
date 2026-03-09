"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiInstance = exports.openaiService = exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = __importDefault(require("../logger"));
const env_1 = require("../env");
const const_1 = require("../const");
// 创建OpenAI实例
if (!env_1.API_KEY) {
    console.error(`AI_TYPE为${env_1.AI_TYPE}时，API_KEY environment variable is not set`);
    throw new Error(`AI_TYPE为${env_1.AI_TYPE}时，API_KEY environment variable is required`);
}
if (env_1.AI_TYPE === "DEEPSEEK") {
    logger_1.default.info('Using DeepSeek API');
}
else {
    logger_1.default.error(`Invalid ${env_1.AI_TYPE} environment variable. Please set it to "DEEPSEEK" `);
    throw new Error(`Invalid ${env_1.AI_TYPE} environment variable. Please set it to "DEEPSEEK" `);
}
// 直接创建OpenAI实例，确保在模块顶层正确初始化
const openaiInstance = new openai_1.default({
    apiKey: env_1.API_KEY,
    baseURL: env_1.BASE_URL,
});
exports.openaiInstance = openaiInstance;
class OpenAIService {
    /**
     * 发送聊天请求
     * @param request 聊天请求参数
     * @returns 聊天响应
     */
    async createChatCompletion(request) {
        try {
            const startTime = Date.now();
            logger_1.default.info('Creating chat completion', {
                request: {
                    ...request,
                    messages: request.messages.map(msg => ({
                        role: msg.role,
                        content: msg.role === 'user' ? msg.content.substring(0, 100) + '...' : msg.content
                    }))
                }
            });
            const completion = await openaiInstance.chat.completions.create({
                messages: request.messages,
                model: request.model || const_1.DEEPSEEK_MODEl,
                temperature: request.temperature || 0.7,
                stream: false
            });
            const endTime = Date.now();
            logger_1.default.info('Chat DEEPSEEK completion created successfully', {
                response: {
                    id: completion.id,
                    model: completion.model,
                    choices: completion.choices.map((choice) => ({
                        index: choice.index,
                        message: {
                            role: choice.message.role,
                            content: choice.message.content.substring(0, 100) + '...'
                        },
                        finish_reason: choice.finish_reason
                    })),
                    usage: completion.usage
                },
                duration: endTime - startTime
            });
            console.log(" openai.chat.completions", completion);
            return completion;
        }
        catch (error) {
            logger_1.default.error('Error creating chat completion', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
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
            logger_1.default.info('Creating streaming chat completion', {
                request: {
                    ...request,
                    messages: request.messages.map(msg => ({
                        role: msg.role,
                        content: msg.role === 'user' ? msg.content.substring(0, 100) + '...' : msg.content
                    }))
                }
            });
            const stream = await openaiInstance.chat.completions.create({
                messages: request.messages,
                model: request.model || const_1.DEEPSEEK_MODEl,
                temperature: request.temperature || 0.7,
                stream: true
            });
            console.log("ai--response--stream", stream);
            let fullResponse = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    onChunk(content);
                }
            }
            const endTime = Date.now();
            logger_1.default.info('Streaming chat completion finished', {
                response: {
                    content: fullResponse.substring(0, 100) + '...'
                },
                duration: endTime - startTime
            });
            return fullResponse;
        }
        catch (error) {
            logger_1.default.error('Error creating streaming chat completion', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}
exports.OpenAIService = OpenAIService;
// 导出单例实例
exports.openaiService = new OpenAIService();
