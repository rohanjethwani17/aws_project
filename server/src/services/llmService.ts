import fetch from "node-fetch";

// LLM Provider Interface
export interface LLMProvider {
  generateContent(prompt: string, options?: any): Promise<string>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): { requests: number; period: string };
  getName(): string;
}

// Google Gemini Provider
export class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getRateLimit() {
    return { requests: 60, period: "minute" };
  }

  getName() {
    return "gemini";
  }
}

// Hugging Face Provider
export class HuggingFaceProvider implements LLMProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || "";
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Hugging Face API key not configured");
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 2000 } }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data?.[0]?.generated_text || "";
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getRateLimit() {
    return { requests: 30000, period: "month" };
  }

  getName() {
    return "huggingface";
  }
}

// Ollama Provider (Local)
export class OllamaProvider implements LLMProvider {
  async generateContent(prompt: string): Promise<string> {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.response || "";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:11434/api/tags", {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getRateLimit() {
    return { requests: Infinity, period: "unlimited" };
  }

  getName() {
    return "ollama";
  }
}

// LLM Service with automatic fallback
export class LLMService {
  private providers: LLMProvider[];

  constructor() {
    this.providers = [
      new GeminiProvider(),
      new HuggingFaceProvider(),
      new OllamaProvider(),
    ];
  }

  async generateContent(prompt: string): Promise<{ content: string; provider: string }> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          console.log(`Attempting content generation with ${provider.getName()}...`);
          const content = await provider.generateContent(prompt);
          console.log(`Successfully generated content with ${provider.getName()}`);
          return { content, provider: provider.getName() };
        } else {
          console.log(`${provider.getName()} not available, trying next provider...`);
        }
      } catch (error) {
        console.error(`${provider.getName()} failed:`, error);
        continue;
      }
    }
    throw new Error("All LLM providers failed. Please check your API keys or Ollama installation.");
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        available.push(provider.getName());
      }
    }
    return available;
  }
}
