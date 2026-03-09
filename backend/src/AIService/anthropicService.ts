import Anthropic from '@anthropic-ai/sdk';
import logger from '../logger';
import { AI_TYPE, ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL } from '../env';
import { CLAUDE_MODEL_4_6 } from '../const';

// 仅在 AI_TYPE=ANTHROPIC 时初始化，避免导入时崩溃
let anthropicAiInstance: Anthropic | null = null;

if (AI_TYPE === "ANTHROPIC") {
  logger.info('Using Anthropic API (mirror: aicodemirror)');
  anthropicAiInstance = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    baseURL: ANTHROPIC_BASE_URL,
  });
}

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;     // Anthropic 的 system 作为顶层参数传递
  model?: string;
  max_tokens: number;
  stream?: boolean;
}

export class AnthropicService {
  /**
   * 非流式聊天请求
   */
  async createChatCompletion(request: ChatRequest): Promise<any> {
    if (!anthropicAiInstance) {
      throw new Error('Anthropic service is not initialized. Set AI_TYPE=ANTHROPIC.');
    }
    try {
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

      const params: any = {
        messages: request.messages,
        model: request.model || CLAUDE_MODEL_4_6,
        max_tokens: request.max_tokens,
      };
      if (request.system) {
        params.system = request.system;
      }

      const completion = await anthropicAiInstance.messages.create(params);

      const endTime = Date.now();
      logger.info('Anthropic completion created', {
        response: completion,
        duration: endTime - startTime
      });
      console.log("Anthropic.messages.create", completion);
      return completion;
    } catch (error) {
      logger.error('Error creating Anthropic completion', { error });
      throw error;
    }
  }

  /**
   * 流式聊天请求
   */
  public async createChatCompletionStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!anthropicAiInstance) {
      throw new Error('Anthropic service is not initialized. Set AI_TYPE=ANTHROPIC.');
    }
    try {
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

      const params: any = {
        messages: request.messages,
        model: request.model || CLAUDE_MODEL_4_6,
        max_tokens: request.max_tokens,
        stream: true,
      };
      if (request.system) {
        params.system = request.system;
      }

      const stream = await anthropicAiInstance.messages.create(params);
      let fullResponse = '';

      for await (const chunk of stream as any) {
        // content_block_delta 事件携带 delta.text
        const delta = chunk.delta?.text || '';
        if (delta) {
          fullResponse += delta;
          onChunk(delta);
        }
      }

      const endTime = Date.now();
      logger.info('Anthropic completion stream finished', {
        response: fullResponse.substring(0, 100) + '...',
        duration: endTime - startTime
      });
      console.log("Anthropic.messages.create (stream)", fullResponse.substring(0, 200));
      return fullResponse;
    } catch (error) {
      logger.error('Error creating Anthropic completion stream', { error });
      throw error;
    }
  }
}

// 导出单例实例
export const anthropicService = new AnthropicService();
export { anthropicAiInstance };
