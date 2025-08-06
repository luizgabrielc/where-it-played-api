import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { LlmService, LlmRequest, LlmResponse } from './llm.service';

export class AskLlmDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  musicQuery: string;
}

export class AskLlmResponseDto {
  success: boolean;
  data: LlmResponse;
}

@Controller('api')
@UsePipes(new ValidationPipe({ transform: true }))
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('ask-llm')
  @HttpCode(HttpStatus.OK)
  async askLlm(@Body() body: AskLlmDto): Promise<AskLlmResponseDto> {
    const result = await this.llmService.askLlm(body.musicQuery);
    
    return {
      success: true,
      data: result,
    };
  }
} 