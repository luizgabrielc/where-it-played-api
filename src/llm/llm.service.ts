import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LlmResponse {
  locations: Array<{
    type: string;
    title: string;
    year: number;
    season?: string;
    episode?: string;
    rating?: string;
    image_url?: string;
    singer?: string;
  }>;
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
      const response = await this.callDeepseekApi(prompt);
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
    console.log('musicQuery', musicQuery);
    const prompt = `
    ATENÇÃO: Especialista em trilhas sonoras! Siga À RISCA regras abaixo:
    
    1. IDIOMA: Português Brasileiro (títulos BR).
    
    2. FORMATO JSON RÁPIDO:
    {
      "locations": [
        {
          "type": "Filme" ou "Série" ou "Novela",
          "title": "Título BR",
          "year": 1994,
          "season": "",       // APENAS séries
          "episode": "",      // APENAS séries
          "rating": "",       // Formato "X.Y/Z" (ex: "8.5/10")
          "singer": ""        // Artista da versão USADA
        }
      ]
    }
    
    3. REGRAS DE CONTEÚDO:
       - Priorize velocidade sobre completude
       - Preencha APENAS campos que você sabe de MEMÓRIA
       - Para rating: Apenas se lembrar imediatamente
       - Para singer: Apenas se for diferente do artista original
       - NUNCA pesquise durante a resposta
    
    4. FONTES:
       - Use apenas seu conhecimento pré-treinado
       - Ignore validação em APIs externas
    
    5. EXEMPLO RÁPIDO:
    {
      "locations": [
        {
          "type": "Filme",
          "title": "O Guarda-Costas",
          "year": 1992,
          "singer": "Whitney Houston"
        }
      ]
    }
    
    SUA TAREFA PARA '${musicQuery}':
    - Máximo 3 resultados
    - Campos vazios ("") são aceitáveis
    - Resposta em MENOS DE 5 SEGUNDOS
    - JSON VÁLIDO SEM comentários
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
      temperature: 0,
      max_tokens: 2000,
    });
    console.log('content', response.choices[0]?.message?.content);
    
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
            location && 
            typeof location === 'object' && 
            location.type && 
            location.title && 
            location.year
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
