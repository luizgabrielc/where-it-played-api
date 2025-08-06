# 🔧 Guia de Implementação - WhereItPlayed API Melhorada

## 🎯 **Passo a Passo para Implementar as Melhorias**

### **1. Atualizar o Método buildPrompt**

Substitua o método atual em `src/llm/llm.service.ts`:

```typescript
// ANTES (linha 87-91)
private buildPrompt(musicQuery: string): string {
  return `List ONLY the names of movies, TV shows, or telenovelas where the song '${musicQuery}' was featured. 
Return a JSON with NO explanations, like: { "locations": ["Media 1", "Media 2"] }.
If you don't know where the song was featured, return an empty array: { "locations": [] }.
Only include actual media where the song was featured, not just similar titles.`;
}

// DEPOIS - Substitua por:
private buildPrompt(musicQuery: string): string {
  return `Find ALL movies, TV shows, telenovelas, and other media where the song '${musicQuery}' was featured.

Return a detailed JSON with specific information about where the song appears:

**For Movies:**
- "Movie: Title (Year) - [Scene description if known]"

**For TV Shows/Series:**
- "TV Show: Title - Episode: Episode Name (Season X, Episode Y)"
- "TV Show: Title - Episode: Episode Name (Year)"

**For Telenovelas:**
- "Telenovela: Title - Episode: Episode Name (Year)"
- "Telenovela: Title - Chapter: Chapter Number (Year)"

**For Other Media:**
- "Commercial: Brand Name (Year)"
- "Video Game: Game Title (Year)"
- "Documentary: Title (Year)"

**Rules:**
- Include ALL known appearances (no limit)
- Be as specific as possible about episodes/chapters
- Include scene descriptions when relevant
- Use exact episode names when available
- If no specific episode info, just use show/movie name
- Return format: {"locations": ["detailed entry 1", "detailed entry 2"]}
- If no results found, return: {"locations": []}

**Examples:**
- "TV Show: Glee - Episode: Journey to Regionals (Season 1, Episode 22)"
- "Movie: The Lost City (2022) - Opening credits scene"
- "Telenovela: Avenida Brasil - Chapter 15 (2012) - Wedding scene"`;
}
```

### **2. Atualizar o Método callDeepseekApi**

Substitua o método atual (linha 93-110):

```typescript
// ANTES
private async callDeepseekApi(prompt: string): Promise<string> {
  if (!this.openai) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await this.openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  console.log('response', response.choices[0]?.message);

  return response.choices[0]?.message?.content || '';
}

// DEPOIS - Substitua por:
private async callDeepseekApi(prompt: string): Promise<string> {
  if (!this.openai) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await this.openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 800, // Aumentado para respostas mais detalhadas
  });

  console.log('response', response.choices[0]?.message);

  return response.choices[0]?.message?.content || '';
}
```

### **3. Atualizar o Método parseLlmResponse**

Substitua o método atual (linha 112-144):

```typescript
// ANTES
private parseLlmResponse(response: string): LlmResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.locations || !Array.isArray(parsed.locations)) {
      throw new Error('Invalid response format');
    }

    return {
      locations: parsed.locations.filter((location: any) => 
        typeof location === 'string' && location.trim().length > 0
      ),
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    console.error('Raw response:', response);
    
    // Return empty response if parsing fails
    return { locations: [] };
  }
}

// DEPOIS - Substitua por:
private parseLlmResponse(response: string): LlmResponse {
  try {
    // Clean the response - remove markdown formatting
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
    }
    
    // Try to extract JSON from the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.locations || !Array.isArray(parsed.locations)) {
      throw new Error('Invalid response format');
    }

    // Filter out empty strings but keep all valid results (no limit)
    const filteredLocations = parsed.locations.filter((location: any) => 
      typeof location === 'string' && location.trim().length > 0
    );

    return {
      locations: filteredLocations,
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    console.error('Raw response:', response);
    
    // Return empty response if parsing fails
    return { locations: [] };
  }
}
```

## 🧪 **Testando as Melhorias**

### **1. Teste com Música Popular**
```bash
curl -X POST http://localhost:3000/api/ask-llm \
  -H "Content-Type: application/json" \
  -d '{"musicQuery": "Bohemian Rhapsody"}'
```

### **2. Teste com Música Brasileira**
```bash
curl -X POST http://localhost:3000/api/ask-llm \
  -H "Content-Type: application/json" \
  -d '{"musicQuery": "Garota de Ipanema"}'
```

### **3. Teste com Música de Filme**
```bash
curl -X POST http://localhost:3000/api/ask-llm \
  -H "Content-Type: application/json" \
  -d '{"musicQuery": "My Heart Will Go On"}'
```

## 📊 **Resultados Esperados**

### **Exemplo de Resposta Melhorada**
```json
{
  "success": true,
  "data": {
    "locations": [
      "Movie: Titanic (1997) - Main theme song throughout the film",
      "TV Show: Glee - Episode: Journey to Regionals (Season 1, Episode 22) - Performance scene",
      "Movie: The Lost City (2022) - Wedding reception scene",
      "Commercial: Coca-Cola - Super Bowl 2020 - Opening sequence",
      "TV Show: The Simpsons - Episode: Marge vs. the Monorail (Season 4, Episode 12) - Background music",
      "Telenovela: Avenida Brasil - Chapter 15 (2012) - Wedding ceremony scene"
    ]
  }
}
```

## 🔍 **Verificações Importantes**

### **1. Teste o Build**
```bash
pnpm run build
```

### **2. Execute os Testes**
```bash
pnpm run test
```

### **3. Teste a API**
```bash
pnpm run start:dev
```

### **4. Verifique os Logs**
- Observe os logs do console para ver o prompt e resposta
- Verifique se a formatação markdown está sendo removida
- Confirme se não há limite de 10 itens

## 🎯 **Benefícios Implementados**

1. ✅ **Sem Limite**: Todas as aparições conhecidas são retornadas
2. ✅ **Especificidade**: Informações detalhadas sobre episódios/cenas
3. ✅ **Formato Consistente**: Padrão organizado para cada tipo de mídia
4. ✅ **Parser Robusto**: Remove formatação markdown automaticamente
5. ✅ **Tokens Aumentados**: Suporte para respostas mais detalhadas

## 🚀 **Próximos Passos**

1. **Implemente as mudanças** seguindo o guia acima
2. **Teste com diferentes músicas** para verificar os resultados
3. **Monitore o uso de tokens** para otimizar custos se necessário
4. **Colete feedback** dos usuários sobre a qualidade das respostas

Agora sua API vai fornecer informações muito mais detalhadas e úteis! 🎵 