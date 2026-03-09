import OpenAI from "openai";
import logger from '../logger';
import { AI_TYPE, API_KEY,BASE_URL } from '../env';
import { DEEPSEEK_MODEl, CLAUDE_MODEL_4_6 } from '../const';

// 创建OpenAI实例
if (!API_KEY) {
  console.error(`AI_TYPE为${AI_TYPE}时，API_KEY environment variable is not set`);
  throw new Error(`AI_TYPE为${AI_TYPE}时，API_KEY environment variable is required`);
}
if(AI_TYPE === "DEEPSEEK"){
  logger.info('Using DeepSeek API');
} else {
  logger.error(`Invalid ${AI_TYPE} environment variable. Please set it to "DEEPSEEK" `);
  throw new Error(`Invalid ${AI_TYPE} environment variable. Please set it to "DEEPSEEK" `);
}

// 直接创建OpenAI实例，确保在模块顶层正确初始化
const openaiInstance = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  /**
   * 发送聊天请求
   * @param request 聊天请求参数
   * @returns 聊天响应
   */
  public async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    try {
      const startTime = Date.now();
      logger.info('Creating chat completion', {
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
        model: request.model ||  DEEPSEEK_MODEl,
        temperature: request.temperature || 0.7,
        stream: false
      }) as OpenAI.ChatCompletion;

      const endTime = Date.now();
      logger.info('Chat DEEPSEEK completion created successfully', {
        response: {
          id: completion.id,
          model: completion.model,
          choices: completion.choices.map((choice: any) => ({
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
      console.log(" openai.chat.completions",completion)
      return completion;
    } catch (error) {
      logger.error('Error creating chat completion', {
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
  public async createChatCompletionStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const startTime = Date.now();
      logger.info('Creating streaming chat completion', {
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
        model: request.model ||  DEEPSEEK_MODEl,
        temperature: request.temperature || 0.7,
        stream: true
      });
      console.log("ai--response--stream",stream)

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      const endTime = Date.now();
      logger.info('Streaming chat completion finished', {
        response: {
          content: fullResponse.substring(0, 100) + '...'
        },
        duration: endTime - startTime
      });

      return fullResponse;
    } catch (error) {
      logger.error('Error creating streaming chat completion', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// 导出单例实例
export const openaiService = new OpenAIService();
export { openaiInstance };
