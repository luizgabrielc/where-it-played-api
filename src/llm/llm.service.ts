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
    const prompt = `
    ATENÇÃO: Você é um especialista em trilhas sonoras de filmes e séries. Siga estas regras À RISCA:
    
    1. IDIOMA:
       - Toda resposta DEVE SER EM PORTUGUÊS BRASILEIRO
       - Títulos DEVE usar a versão brasileira oficial (ex: "O Guarda-Costas", não "The Bodyguard")
    
    2. FORMATO EXATO:
       - Filmes: "Filme: [TÍTULO BRASILEIRO] ([ANO])" 
       - Séries: "Série: [TÍTULO BRASILEIRO] (Temporada [NÚMERO], Episódio [NÚMERO])"
       - Novelas: "Novela: [TÍTULO BRASILEIRO] ([ANO])"
    
    3. REGRAS DE CONTEÚDO:
       - Incluir APENAS quando a música foi EFETIVAMENTE TOCADA na obra
       - EXCLUIR programas de auditório, reality shows e menções indiretas
       - EXCLUIR versões cover não-oficiais
       - EXCLUIR videoclipes e concertos ao vivo
    
    4. VALIDAÇÃO:
       - Priorize fontes confiáveis: IMDb, TMDb, créditos oficiais
       - Se não encontrar informações confirmadas, retorne array vazio
    
    EXEMPLO PARA "I Will Always Love You":
    {
      "locations": [
        "Filme: O Guarda-Costas (1992)",
        "Série: Glee (Temporada 5, Episódio 3)"
      ]
    }
    
    SUA TAREFA PARA '${musicQuery}':
    Retorne APENAS JSON válido SEM comentários no formato:
    { "locations": ["Filme: ...", "Série: ..."] }
    Se não encontrar resultados: { "locations": [] }
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
      max_tokens: 1000,
    });
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
