// 环境变量加载模块
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const AI_TYPE = process.env.AI_TYPE || "";
let API_KEY: string = "";
let BASE_URL: string = "";

// 设置环境变量
if (AI_TYPE === "DEEPSEEK") {
  API_KEY = process.env.DEEPSEEK_API_KEY || "";
  BASE_URL = 'https://api.deepseek.com';
  console.log('Environment variables configured successfully for DeepSeek API');
} else if (AI_TYPE === "ANTHROPIC") {
  API_KEY = process.env.ANTHROPIC_API_KEY || "";
  BASE_URL = 'https://api.aicodemirror.com/api/claudecode';
  console.log('Environment variables configured successfully for Anthropic API');
} else {
  console.error('AI_TYPE environment variable is not set. Please set it to "DEEPSEEK" or "ANTHROPIC".');
  throw new Error('AI_TYPE environment variable is required. Please set it to "DEEPSEEK" or "ANTHROPIC".');
}

// 验证API密钥
if (!API_KEY) {
  console.error(`${AI_TYPE} API key is not set`);
  throw new Error(`${AI_TYPE} API key is required`);
}

export { AI_TYPE, API_KEY, BASE_URL };
