// 环境变量加载模块
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const AI_TYPE = (process.env.AI_TYPE || "").trim();

if (!AI_TYPE || (AI_TYPE !== "DEEPSEEK" && AI_TYPE !== "ANTHROPIC")) {
  console.error('AI_TYPE environment variable is not set correctly.');
  throw new Error('AI_TYPE environment variable is required. Please set it to "DEEPSEEK" or "ANTHROPIC".');
}

// 各服务独立的密钥和地址，避免混用
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || "").trim();
const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const ANTHROPIC_BASE_URL = 'https://api.aicodemirror.com/api/claudecode';

// 当前激活服务的密钥（向后兼容）
let API_KEY: string;
let BASE_URL: string;

if (AI_TYPE === "DEEPSEEK") {
  API_KEY = DEEPSEEK_API_KEY;
  BASE_URL = DEEPSEEK_BASE_URL;
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required when AI_TYPE=DEEPSEEK');
  }
  console.log('Environment variables configured successfully for DeepSeek API');
} else {
  API_KEY = ANTHROPIC_API_KEY;
  BASE_URL = ANTHROPIC_BASE_URL;
  if (!API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_TYPE=ANTHROPIC');
  }
  console.log('Environment variables configured successfully for Anthropic API (mirror)');
}

export {
  AI_TYPE,
  API_KEY,
  BASE_URL,
  DEEPSEEK_API_KEY,
  ANTHROPIC_API_KEY,
  DEEPSEEK_BASE_URL,
  ANTHROPIC_BASE_URL,
};
