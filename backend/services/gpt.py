# services/gpt.py

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")



async def run_gpt_node(prompt: str, model: str = "meta-llama/llama-3-8b-instruct"):
    try:
        # Validate API key
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        if not openrouter_key:
            return "Error: OPENROUTER_API_KEY not found in environment variables"
        
        if not openrouter_key.startswith('sk-or-v1-'):
            return "Error: Invalid OpenRouter API key format"

        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AutoFlow Studio"
        }

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
        }

        print("📤 Payload to OpenRouter:", payload)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 401:
                return "Error: Invalid OpenRouter API key. Please check your OPENROUTER_API_KEY."
            
            response.raise_for_status()

        data = response.json()
        print("✅ Response:", data)

        return data["choices"][0]["message"]["content"]

    except httpx.HTTPStatusError as e:
        print("🔥 Exception in OpenRouter call:", e)
        print("📜 Response content:", e.response.text)
        
        if e.response.status_code == 401:
            return "Error: Authentication failed - Invalid API key"
        elif e.response.status_code == 429:
            return "Error: Rate limit exceeded"
        else:
            return f"Error: HTTP {e.response.status_code}"
            
    except Exception as e:
        return f"GPT request failed: {str(e)}"
