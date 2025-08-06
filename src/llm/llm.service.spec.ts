import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('askLlm', () => {
    it('should throw error for empty music query', async () => {
      await expect(service.askLlm('')).rejects.toThrow(
        new HttpException('Music query is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw error for whitespace-only music query', async () => {
      await expect(service.askLlm('   ')).rejects.toThrow(
        new HttpException('Music query is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw error when API key is not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      
      await expect(service.askLlm('test song')).rejects.toThrow(
        new HttpException('LLM API key or base URL not configured', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should throw error when base URL is not configured', async () => {
      jest.spyOn(configService, 'get')
        .mockReturnValueOnce('test-api-key') // DEEPSEEK_API_KEY
        .mockReturnValueOnce(undefined); // DEEPSEEK_BASE_URL
      
      await expect(service.askLlm('test song')).rejects.toThrow(
        new HttpException('LLM API key or base URL not configured', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('parseLlmResponse', () => {
    it('should parse valid JSON response', () => {
      const response = '{"locations": ["Movie: Test (2023)", "TV Show: Example"]}';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: ['Movie: Test (2023)', 'TV Show: Example']
      });
    });

    it('should handle empty locations array', () => {
      const response = '{"locations": []}';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: []
      });
    });

    it('should filter out empty strings', () => {
      const response = '{"locations": ["Movie: Test", "", "TV Show: Example", "   "]}';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: ['Movie: Test', 'TV Show: Example']
      });
    });

    it('should return empty array for invalid JSON', () => {
      const response = 'Invalid response';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: []
      });
    });

    it('should handle JSON with trailing commas', () => {
      const response = '{"locations": ["Movie: Test", "TV Show: Example",]}';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: ['Movie: Test', 'TV Show: Example']
      });
    });

    it('should handle incomplete JSON and complete it', () => {
      const response = '{"locations": ["Movie: Test", "TV Show: Example"';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: ['Movie: Test', 'TV Show: Example']
      });
    });

    it('should handle JSON with extra text before and after', () => {
      const response = 'Here is the response: {"locations": ["Movie: Test"]} Thank you!';
      const result = (service as any).parseLlmResponse(response);
      
      expect(result).toEqual({
        locations: ['Movie: Test']
      });
    });
  });
}); 