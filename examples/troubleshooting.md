# 🚨 Troubleshooting Guide - WhereItPlayed API

## 🔴 Error: 402 Insufficient Balance

### Problem
```
LLM API error: APIError: 402 Insufficient Balance
```

### Solution

1. **Visit DeepSeek Console**
   - Go to [https://console.deepseek.com/](https://console.deepseek.com/)
   - Sign in to your account

2. **Add Credits**
   - Navigate to the billing/credits section
   - Add credits to your account
   - DeepSeek uses a pay-per-use model

3. **Verify API Key**
   - Check that your API key is active
   - Ensure the key has sufficient permissions

4. **Check Usage**
   - Monitor your API usage in the console
   - Set up usage alerts if available

### Alternative Solutions

#### Option 1: Use Free Credits
- DeepSeek often provides free credits for new users
- Check if you have any free credits available

#### Option 2: Switch to Different Model
- Some models may be cheaper than others
- Check pricing in the DeepSeek console

#### Option 3: Implement Caching
- Cache responses to reduce API calls
- Store common song queries locally

## 🔴 Other Common Errors

### 401 Unauthorized
```
DeepSeek API: Invalid API key. Please check your credentials.
```

**Solution:**
1. Verify your `DEEPSEEK_API_KEY` in `.env` file
2. Check for extra spaces or characters
3. Generate a new API key if needed

### 429 Rate Limit Exceeded
```
DeepSeek API: Rate limit exceeded. Please try again later.
```

**Solution:**
1. Wait a few minutes before making new requests
2. Implement exponential backoff in your code
3. Consider upgrading your plan for higher limits

### 500 Internal Server Error
```
Failed to get response from LLM
```

**Solution:**
1. Check your internet connection
2. Verify the `DEEPSEEK_BASE_URL` is correct
3. Check if DeepSeek services are operational

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in your project root:

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_actual_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Server Configuration
PORT=3000
```

### Getting DeepSeek API Key

1. **Create Account**
   - Visit [https://console.deepseek.com/](https://console.deepseek.com/)
   - Sign up for a new account

2. **Generate API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the key to your `.env` file

3. **Add Credits**
   - Navigate to billing section
   - Add credits to your account
   - Start with a small amount to test

## 🧪 Testing Without Credits

If you want to test the API without using credits:

### Option 1: Mock Service
Create a mock service that returns predefined responses:

```typescript
// In llm.service.ts, add a mock mode
if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK === 'true') {
  return this.getMockResponse(musicQuery);
}
```

### Option 2: Use Test Environment
Set up a separate test environment with limited API calls.

## 📊 Monitoring Usage

### Track API Calls
Add logging to monitor your API usage:

```typescript
console.log(`API call made for query: ${musicQuery}`);
console.log(`Credits used: ${estimatedCredits}`);
```

### Set Up Alerts
- Monitor your DeepSeek account balance
- Set up low balance alerts
- Track usage patterns

## 💡 Best Practices

1. **Implement Caching**
   - Cache responses for common queries
   - Reduce API calls and costs

2. **Use Efficient Prompts**
   - Keep prompts concise
   - Use lower temperature for consistent results

3. **Handle Errors Gracefully**
   - Implement retry logic
   - Provide user-friendly error messages

4. **Monitor Costs**
   - Track API usage regularly
   - Set budget limits

## 🔗 Useful Links

- [DeepSeek Console](https://console.deepseek.com/)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [DeepSeek Pricing](https://platform.deepseek.com/pricing)
- [OpenAI SDK Documentation](https://github.com/openai/openai-node) 