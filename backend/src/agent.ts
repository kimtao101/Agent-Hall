
import { openaiService } from './AIService/openaiService';
import { anthropicService } from './AIService/anthropicService';
import { AI_TYPE } from './env';
import { DEEPSEEK_MODEl, CLAUDE_MODEL_4_6 } from './const';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class Agent {
  private messages: Message[];

  constructor() {
    this.messages = [];
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    this.messages.push({
      role: 'system',
      content: 'You are a helpful research assistant. Provide detailed and accurate responses to user queries.'
    });
  }

  public addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({ role, content });
    this.trimHistory();
  }

  private trimHistory(): void {
    if (this.messages.length > 20) {
      this.messages = [this.messages[0], ...this.messages.slice(-19)];
    }
  }

  public async generateResponse(
    userInput: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    this.addMessage('user', userInput);

    try {
      let fullResponse: string;

      if (AI_TYPE === "DEEPSEEK") {
        fullResponse = await openaiService.createChatCompletionStream(
          {
            messages: this.messages,
            model: DEEPSEEK_MODEl,
            temperature: 0.7,
            stream: true
          },
          onChunk
        );
      } else {
        // Anthropic: system 作为顶层参数，messages 只含 user/assistant
        const systemMessage = this.messages.find(m => m.role === 'system');
        const chatMessages = this.messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        fullResponse = await anthropicService.createChatCompletionStream(
          {
            messages: chatMessages,
            system: systemMessage?.content,
            model: CLAUDE_MODEL_4_6,
            max_tokens: 2048,
          },
          onChunk
        );
      }

      this.addMessage('assistant', fullResponse);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = 'I apologize, but I encountered an error while processing your request. Please try again later.';
      onChunk(errorMessage);
      this.addMessage('assistant', errorMessage);
    }
  }

  public getHistory(): Message[] {
    return [...this.messages];
  }

  public clearHistory(): void {
    this.messages = [];
    this.initializeSystemPrompt();
  }
}
