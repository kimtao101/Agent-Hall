"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const openaiService_1 = require("./AIService/openaiService");
const env_1 = require("./env");
const const_1 = require("./const");
class Agent {
    constructor() {
        this.messages = [];
        this.initializeSystemPrompt();
    }
    initializeSystemPrompt() {
        this.messages.push({
            role: 'system',
            content: 'You are a helpful research assistant. Provide detailed and accurate responses to user queries.'
        });
    }
    addMessage(role, content) {
        this.messages.push({ role, content });
        this.trimHistory();
    }
    trimHistory() {
        if (this.messages.length > 20) {
            this.messages = [this.messages[0], ...this.messages.slice(-19)];
        }
    }
    async generateResponse(userInput, onChunk) {
        this.addMessage('user', userInput);
        try {
            const fullResponse = await openaiService_1.openaiService.createChatCompletionStream({
                messages: this.messages,
                model: env_1.AI_TYPE === "DEEPSEEK" ? const_1.DEEPSEEK_MODEl : const_1.CLAUDE_MODEL_4_6,
                temperature: 0.7,
                stream: true
            }, onChunk);
            this.addMessage('assistant', fullResponse);
        }
        catch (error) {
            console.error('Error generating response:', error);
            const errorMessage = 'I apologize, but I encountered an error while processing your request. Please try again later.';
            onChunk(errorMessage);
            this.addMessage('assistant', errorMessage);
        }
    }
    getHistory() {
        return [...this.messages];
    }
    clearHistory() {
        this.messages = [];
        this.initializeSystemPrompt();
    }
}
exports.Agent = Agent;
