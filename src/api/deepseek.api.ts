import { ConfigManager } from "@src/utils/config/config-manager.ts";
import axios from "npm:axios";
interface BalanceInfo {
  currency: string;
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}

interface DeepseekBalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepseekAPI {
  private baseURL = "https://api.deepseek.com";
  private token!: string;
  private defaultModel = "deepseek-chat";

  constructor() {
    this.refresh();
  }

  async refresh() {
    this.token = await ConfigManager.getInstance().get("DEEPSEEK_API_KEY");
    if (!this.token) {
      throw new Error("DeepSeek API key is not set");
    }
  }

  /**
   * Create a chat completion using Deepseek's chat API
   * @param messages Array of messages in the conversation
   * @param options Optional parameters for the chat completion
   * @returns Promise<ChatCompletionResponse> The chat completion response
   * @throws Error if the API request fails
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: Partial<Omit<ChatCompletionRequest, "messages" | "model">> = {}
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 1,
          max_tokens: options.max_tokens ?? 2000,
          stream: options.stream ?? false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to create chat completion: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Simple method to get a response for a single message
   * @param content The message content
   * @param systemPrompt Optional system prompt to set context
   * @returns Promise<string> The assistant's response text
   */
  async sendMessage(content: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content,
    });

    const response = await this.createChatCompletion(messages);
    return response.choices[0].message.content;
  }

  /**
   * Get the current balance information from Deepseek account
   * @returns Promise<DeepseekBalanceResponse> The balance information including availability and balance details
   * @throws Error if the API request fails
   */
  async getBalance(): Promise<DeepseekBalanceResponse> {
    try {
      const response = await axios.get<DeepseekBalanceResponse>(
        `${this.baseURL}/user/balance`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get Deepseek balance: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Get the total balance in CNY (convenience method)
   * @returns Promise<number> The total balance in CNY
   * @throws Error if the API request fails or CNY balance is not found
   */
  async getCNYBalance(): Promise<number> {
    const response = await this.getBalance();
    const cnyBalance = response.balance_infos.find(
      (info) => info.currency === "CNY"
    );
    if (!cnyBalance) {
      throw new Error("CNY balance not found in response");
    }
    return parseFloat(cnyBalance.total_balance);
  }
}
