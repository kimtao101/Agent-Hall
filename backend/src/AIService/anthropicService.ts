import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages';
import logger from '../logger';
import { AI_TYPE, API_KEY,BASE_URL } from '../env';
import { CLAUDE_MODEL_4_6 } from '../const';

// 创建OpenAI实例
if (!API_KEY) {
  console.error(`AI_TYPE为${AI_TYPE}时，API_KEY environment variable is not set`);
  throw new Error(`AI_TYPE为${AI_TYPE}时，API_KEY environment variable is required`);
}
if(AI_TYPE === "ANTHROPIC"){
  logger.info('Using Anthropic API');
} else {
  logger.error(`Invalid ${AI_TYPE} environment variable. Please set it to "DEEPSEEK" or "ANTHROPIC".`);
  throw new Error(`Invalid ${AI_TYPE} environment variable. Please set it to "DEEPSEEK" or "ANTHROPIC".`);
}
// 初始化客户端
const anthropicAiInstance = new Anthropic({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  max_tokens: number;
  stream?: boolean;
}
interface ContentItem {
  type?: string;
  text?: any;
}
interface Usage {
  input_tokens: number;
  output_tokens: number;
}
interface ChatResponse {
  id: string;
  type: string;
  role: string;
  content: Array<ContentItem>;
  model: string;
  stop_reason: string;
  usage: Usage;
}

export class AnthropicService {
  /**
   * 建立聊天请求
   * @param request 聊天请求参数
   * @returns 聊天响应
   */
  async createChatCompletion(request: ChatRequest): Promise<any> {
    try{
      const startTime = Date.now();
      logger.info('Creating Anthropic completion', {
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
        model: request.model || CLAUDE_MODEL_4_6,
        max_tokens: request.max_tokens,
      } as MessageCreateParams);
      const endTime = Date.now();
      logger.info('Anthropic completion created', {
        response: completion,
        duration: endTime - startTime
      });
      console.log("Anthropic.messages.completions",completion)
      return completion;

    } catch (error) {
      logger.error('Error creating Anthropic completion', { error });
      throw error;
    }
  }
   /**
   * 流式发送聊天请求
   * @param request 聊天请求参数
   * @param onChunk  chunks回调函数
   * @returns 完整响应
   */

   public async createChatCompletionStream(request: ChatRequest,onChunk: (chunk: string) => void): Promise<string> {
    try{
      const startTime = Date.now();
      logger.info('Creating Anthropic completion stream', {
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
        model: request.model || CLAUDE_MODEL_4_6,
        max_tokens: request.max_tokens,
        stream: true,
      } as any);
      let fullResponse = '';
      for await (const chunk of stream as any) {
        const delta = chunk.delta?.text || '';
        fullResponse += delta;
        onChunk(delta);
      }
      const endTime = Date.now();
      logger.info('Anthropic completion stream created', {
        response: fullResponse,
        duration: endTime - startTime
      });
      console.log("Anthropic.messages.completions.stream",fullResponse)
      return fullResponse;
    }catch (error) {
      logger.error('Error creating Anthropic completion stream', { error });
      throw error;
    }
  }
}
// 导出单例实例
export const anthropicService = new AnthropicService();
export { anthropicAiInstance };
