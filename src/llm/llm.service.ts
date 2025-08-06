import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LlmResponse {
  locations: string[];
}

export interface LlmRequest {
  musicQuery: string;
}

@Injectable()
export class LlmService {
  private readonly openai: OpenAI | null;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    this.baseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL');

    if (!this.apiKey) {
      console.warn('DEEPSEEK_API_KEY not found in environment variables');
      this.openai = null;
    } else if (!this.baseUrl) {
      console.warn('DEEPSEEK_BASE_URL not found in environment variables');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey,
      });
    }
  }

  async askLlm(musicQuery: string): Promise<LlmResponse> {
    if (!musicQuery || musicQuery.trim().length === 0) {
      throw new HttpException(
        'Music query is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.apiKey || !this.baseUrl || !this.openai) {
      throw new HttpException(
        'LLM API key or base URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const prompt = this.buildPrompt(musicQuery);
      console.log('prompt', prompt);
      const response = await this.callDeepseekApi(prompt);
      console.log('response from llm', response);
      return this.parseLlmResponse(response);
    } catch (error) {
      console.error('LLM API error:', error);

      // Handle specific DeepSeek API errors
      if (error?.status === 402) {
        throw new HttpException(
          'DeepSeek API: Insufficient balance. Please add credits to your account.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (error?.status === 401) {
        throw new HttpException(
          'DeepSeek API: Invalid API key. Please check your credentials.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error?.status === 429) {
        throw new HttpException(
          'DeepSeek API: Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Failed to get response from LLM',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildPrompt(musicQuery: string): string {
    const prompt = `
    List ONLY the names of movies, TV series, or telenovelas where the song '${musicQuery}' was used.
    1. Language: All responses must be in PORTUGUÊS (Brazil).
    2. Format:
       - Movies: "Filme: [Portuguese title] ([Year])" (e.g. "Filme: O Guarda-Costas (1992)"). 
       - TV Series: "Série: [Portuguese title] (Temporada [X], Episódio [Y])" (e.g. "Série: Game of Thrones (Temporada 1, Episódio 1)").
       - Telenovelas: "Novela: [Portuguese title] ([Year])" (e.g. "Novela: O Guarda-Costas (1992)").
    3. Confirm that the song was actually used in the media.
    Return ONLY a JSON in the format: { "locations": ["Media 1", "Media 2"] }.
    IMPORTANT: Don't consider TV shows, only movies and TV series.
    `;

    return prompt;
  }

  private async callDeepseekApi(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that finds the locations where a song was used in movies, TV series, or telenovelas. Always respond with a valid JSON, no additional text before or after.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    console.log('response', response.choices[0]?.message);

    return response.choices[0]?.message?.content || '';
  }

  private parseLlmResponse(response: string): LlmResponse {
    try {
      // Clean the response - remove any leading/trailing whitespace and newlines
      const cleanedResponse = response.trim();

      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response. Raw response:', response);
        throw new Error('No JSON found in response');
      }

      let jsonString = jsonMatch[0];

      // Try to fix common JSON issues
      // Remove any trailing commas before closing brackets/braces
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

      // If the JSON is incomplete (missing closing brace), try to complete it
      if (!jsonString.endsWith('}')) {
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        const closeBrackets = (jsonString.match(/\]/g) || []).length;

        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          jsonString += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonString += '}';
        }
      }

      const parsed = JSON.parse(jsonString);

      if (!parsed.locations || !Array.isArray(parsed.locations)) {
        console.error('Invalid response format. Parsed:', parsed);
        throw new Error('Invalid response format');
      }

      return {
        locations: parsed.locations.filter(
          (location: any) =>
            typeof location === 'string' && location.trim().length > 0,
        ),
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', response);

      // Return empty response if parsing fails
      return { locations: [] };
    }
  }
}
