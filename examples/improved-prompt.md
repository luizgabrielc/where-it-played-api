# 🎯 Melhorando o Prompt da API - WhereItPlayed

## 🎵 **Problema Atual**
- Limite de 10 itens pode fazer perder informações importantes
- Falta de especificidade sobre onde a música aparece
- Não menciona episódios específicos de séries/novelas

## 🚀 **Solução: Prompt Mais Detalhado**

### **Prompt Atual (Básico)**
```typescript
private buildPrompt(musicQuery: string): string {
  return `List ONLY the names of movies, TV shows, or telenovelas where the song '${musicQuery}' was featured. 
Return a JSON with NO explanations, like: { "locations": ["Media 1", "Media 2"] }.
If you don't know where the song was featured, return an empty array: { "locations": [] }.
Only include actual media where the song was featured, not just similar titles.`;
}
```

### **Prompt Melhorado (Detalhado)**
```typescript
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

## 📊 **Melhorias Implementadas**

### 1. **Sem Limite de Resultados**
- Remove a limitação de 10 itens
- Captura todas as aparições conhecidas
- Usuário tem acesso completo às informações

### 2. **Especificidade por Tipo de Mídia**
- **Filmes**: Inclui descrição da cena quando conhecida
- **Séries**: Nome do episódio, temporada e número
- **Telenovelas**: Nome do capítulo e número
- **Outros**: Comerciais, jogos, documentários

### 3. **Formato Estruturado**
- Padrão consistente para cada tipo
- Informações organizadas e fáceis de ler
- Dados específicos quando disponíveis

## 🎯 **Exemplos de Resposta Esperada**

### **Antes (Básico)**
```json
{
  "locations": [
    "The Simpsons",
    "Eternal Sunshine of the Spotless Mind",
    "Glee"
  ]
}
```

### **Depois (Detalhado)**
```json
{
  "locations": [
    "TV Show: The Simpsons - Episode: Marge vs. the Monorail (Season 4, Episode 12)",
    "Movie: Eternal Sunshine of the Spotless Mind (2004) - Opening credits scene",
    "TV Show: Glee - Episode: Journey to Regionals (Season 1, Episode 22) - Performance scene",
    "Movie: The Lost City (2022) - Wedding reception scene",
    "Telenovela: Avenida Brasil - Chapter 15 (2012) - Wedding ceremony",
    "Commercial: Coca-Cola - Super Bowl 2020 - Opening sequence"
  ]
}
```

## 🔧 **Implementação no Código**

### **Atualizar o Método buildPrompt**
```typescript
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

### **Aumentar max_tokens**
```typescript
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
```

### **Remover Limite no Parser**
```typescript
// Remover o .slice(0, 10) do parser
const filteredLocations = parsed.locations
  .filter((location: any) => 
    typeof location === 'string' && location.trim().length > 0
  );
// Sem limite de 10 itens
```

## 🎵 **Benefícios da Melhoria**

1. **Completude**: Usuário vê todas as aparições conhecidas
2. **Especificidade**: Informações detalhadas sobre episódios/cenas
3. **Organização**: Formato consistente e fácil de ler
4. **Flexibilidade**: Suporte para diferentes tipos de mídia
5. **Precisão**: Dados mais específicos e úteis

## 🚀 **Como Aplicar**

1. **Atualize o método `buildPrompt`** com o novo prompt
2. **Aumente `max_tokens`** para 800
3. **Remova o limite de 10 itens** no parser
4. **Teste com diferentes músicas** para verificar os resultados

Isso vai transformar sua API em uma ferramenta muito mais poderosa e útil! 🎵 