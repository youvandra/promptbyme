# promptby.me API Reference

## Introduction

This document provides information on how to use the promptby.me API to programmatically access and run prompts. The API allows developers to integrate AI prompt execution into their applications.

## Authentication

All API requests require authentication using a promptby.me API key in the `Authorization` header of your requests.

```
Authorization: Bearer YOUR_PROMPTBY_ME_API_KEY
```

You can generate a promptby.me API key in your account settings.

## API Endpoints

### Run Prompt

Execute a prompt with optional variable substitution.

**Endpoint:** `POST /functions/v1/run-prompt-api`

**Headers:**
- `Authorization: Bearer YOUR_PROMPTBY_ME_API_KEY`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "prompt_id": "uuid-of-your-prompt",
  "variables": {
    "variable_name_1": "value_1",
    "variable_name_2": "value_2"
  },
  "api_key": "your-ai-provider-api-key",
  "provider": "groq",
  "model": "llama3-8b-8192",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt_id` | string | Yes | The UUID of the prompt to run |
| `variables` | object | No | Key-value pairs for variable substitution in the prompt |
| `api_key` | string | Yes | Your API key for the AI provider |
| `provider` | string | No | AI provider to use (default: "groq"). Options: "openai", "anthropic", "google", "llama", "groq" |
| `model` | string | No | The model to use (default: "llama3-8b-8192") |
| `temperature` | number | No | Controls randomness (0-2, default: 0.7) |
| `max_tokens` | number | No | Maximum tokens in the response (default: 1000) |

**Response:**

Success (200 OK):
```json
{
  "success": true,
  "output": "The AI generated response.",
  "prompt": {
    "id": "uuid-of-your-prompt",
    "title": "Prompt Title",
    "processed_content": "The prompt content with variables filled in."
  }
}
```

Error (4xx/5xx):
```json
{
  "success": false,
  "error": "Error message details."
}
```

**Common Error Codes:**

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing required parameters or invalid input |
| 401 | Unauthorized - Invalid or missing authentication token |
| 403 | Forbidden - You don't have access to the requested prompt |
| 404 | Not Found - Prompt not found |
| 500 | Internal Server Error - Something went wrong on the server |

## Usage Examples

### JavaScript/TypeScript with API Key

```javascript
async function runPrompt() {
  const response = await fetch('https://your-project.supabase.co/functions/v1/run-prompt-api', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-promptby-me-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_id: 'your-prompt-uuid',
      variables: {
        name: 'John',
        company: 'Acme Inc.'
      },
      api_key: 'your-ai-provider-api-key',
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI Response:', data.output);
  } else {
    console.error('Error:', data.error);
  }
}
```

### Python

```python
import requests
import json

def run_prompt():
    url = 'https://your-project.supabase.co/functions/v1/run-prompt-api'
    
    headers = {
        'Authorization': 'Bearer your-promptby-me-api-key',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'prompt_id': 'your-prompt-uuid',
        'variables': {
            'name': 'John',
            'company': 'Acme Inc.'
        },
        'api_key': 'your-ai-provider-api-key',
        'provider': 'anthropic',
        'model': 'claude-3-opus-20240229',
        'temperature': 0.5
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get('success'):
        print('AI Response:', data['output'])
    else:
        print('Error:', data.get('error'))
```

## Security Considerations

1. **API Keys**: Never expose your AI provider API keys or promptby.me API keys in client-side code. Always use the API from a secure backend environment.

2. **Rate Limiting**: Be aware that this API may be subject to rate limiting both from promptby.me and from the underlying AI providers.

3. **Prompt Access**: Users can only access prompts they own or prompts that are marked as public.

## Support

If you encounter any issues or have questions about the API, please contact our support team at support@promptby.me.