# 🎵 WhereItPlayed API

A RESTful API that identifies **movies, TV shows, or telenovelas** where a specific song was featured. Users submit a song title (or lyrics snippet), and the API returns a clean list of matching media.

## 🚀 Features

- **LLM Integration**: Uses DeepSeek Chat API via official OpenAI SDK
- **Structured Output**: Returns clean JSON responses with media locations
- **Input Validation**: Validates song queries with proper error handling
- **Future Ready**: Prepared for user authentication and database integration

## 🛠️ Tech Stack

- **Backend**: Node.js + NestJS
- **LLM APIs**: DeepSeek Chat API via OpenAI SDK
- **Validation**: class-validator + class-transformer
- **HTTP Client**: OpenAI SDK (official)

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- DeepSeek API key and base URL

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Server Configuration
PORT=3000
```

### 3. Run the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

### POST `/api/ask-llm`

Find media where a specific song was featured.

**Request:**
```json
{
  "musicQuery": "Talking to the Moon"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locations": [
      "Movie: The Lost City (2022)",
      "TV Show: Glee"
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid or empty music query
- `401 Unauthorized`: Invalid DeepSeek API key
- `402 Payment Required`: Insufficient balance in DeepSeek account
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: LLM API failure or configuration issues

## 🔧 Development

```bash
# Run in development mode with hot reload
pnpm run start:dev

# Run tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Build for production
pnpm run build
```

## 🚨 Troubleshooting

### Common DeepSeek API Errors

#### 402 Insufficient Balance
**Error**: `DeepSeek API: Insufficient balance. Please add credits to your account.`

**Solution**: 
1. Visit [DeepSeek Console](https://console.deepseek.com/)
2. Add credits to your account
3. Verify your API key is active

#### 401 Unauthorized
**Error**: `DeepSeek API: Invalid API key. Please check your credentials.`

**Solution**:
1. Check your `DEEPSEEK_API_KEY` in the `.env` file
2. Verify the API key is correct and active
3. Ensure there are no extra spaces or characters

#### 429 Rate Limit Exceeded
**Error**: `DeepSeek API: Rate limit exceeded. Please try again later.`

**Solution**:
1. Wait a few minutes before making new requests
2. Consider upgrading your DeepSeek plan for higher limits

### Getting DeepSeek API Key

1. Visit [DeepSeek Console](https://console.deepseek.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add credits to your account
6. Copy the API key to your `.env` file

## 🏗️ Project Structure

```
src/
├── llm/                    # LLM integration module
│   ├── llm.controller.ts   # API endpoints
│   ├── llm.service.ts      # LLM API logic (using OpenAI SDK)
│   ├── llm.module.ts       # Module configuration
│   └── llm.service.spec.ts # Unit tests
├── app.module.ts           # Main application module
├── main.ts                 # Application bootstrap
└── ...
```

## 🔮 Future Enhancements

- **User Authentication**: JWT + bcrypt implementation
- **Database Integration**: PostgreSQL with Neon serverless
- **Search History**: Save user queries and results
- **Rate Limiting**: Protect against API abuse
- **Caching**: Improve response times for repeated queries

## 📝 License

This project is licensed under the MIT License.
