import OpenAI from "openai";
import logger from '../logger';
import { AI_TYPE, DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL } from '../env';
import { DEEPSEEK_MODEl } from '../const';

// 仅在 AI_TYPE=DEEPSEEK 时初始化，避免导入时崩溃
let openaiInstance: OpenAI | null = null;

if (AI_TYPE === "DEEPSEEK") {
  logger.info('Using DeepSeek API');
  openaiInstance = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });
}

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
   */
  public async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    if (!openaiInstance) {
      throw new Error('OpenAI/DeepSeek service is not initialized. Set AI_TYPE=DEEPSEEK.');
    }
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
        model: request.model || DEEPSEEK_MODEl,
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
              content: choice.message.content?.substring(0, 100) + '...'
            },
            finish_reason: choice.finish_reason
          })),
          usage: completion.usage
        },
        duration: endTime - startTime
      });
      console.log("openai.chat.completions", completion);
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
   */
  public async createChatCompletionStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!openaiInstance) {
      throw new Error('OpenAI/DeepSeek service is not initialized. Set AI_TYPE=DEEPSEEK.');
    }
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
        model: request.model || DEEPSEEK_MODEl,
        temperature: request.temperature || 0.7,
        stream: true
      });

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
        response: { content: fullResponse.substring(0, 100) + '...' },
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
