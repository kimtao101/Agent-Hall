"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = exports.API_KEY = exports.AI_TYPE = void 0;
// 环境变量加载模块
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
const AI_TYPE = process.env.AI_TYPE || "";
exports.AI_TYPE = AI_TYPE;
let API_KEY = "";
exports.API_KEY = API_KEY;
let BASE_URL = "";
exports.BASE_URL = BASE_URL;
// 设置环境变量
if (AI_TYPE === "DEEPSEEK") {
    exports.API_KEY = API_KEY = process.env.DEEPSEEK_API_KEY || "";
    exports.BASE_URL = BASE_URL = 'https://api.deepseek.com';
    console.log('Environment variables configured successfully for DeepSeek API');
}
else if (AI_TYPE === "ANTHROPIC") {
    exports.API_KEY = API_KEY = process.env.ANTHROPIC_API_KEY || "";
    exports.BASE_URL = BASE_URL = 'https://api.anthropic.com/v1';
    console.log('Environment variables configured successfully for Anthropic API');
}
else {
    console.error('AI_TYPE environment variable is not set. Please set it to "DEEPSEEK" or "ANTHROPIC".');
    throw new Error('AI_TYPE environment variable is required. Please set it to "DEEPSEEK" or "ANTHROPIC".');
}
// 验证API密钥
if (!API_KEY) {
    console.error(`${AI_TYPE} API key is not set`);
    throw new Error(`${AI_TYPE} API key is required`);
}
