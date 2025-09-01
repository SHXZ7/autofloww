# services/gpt.py

from dotenv import load_dotenv
import os
import httpx
import asyncio

load_dotenv()

async def run_gpt_node(prompt: str, model: str = "openai/gpt-4o") -> str:
    """Run GPT node using OpenRouter API"""
    try:
        # Get API key from environment
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        if not api_key:
            return "Error: OpenRouter API key not configured"
        
        # Determine the actual model to use
        if model.startswith("openai/"):
            actual_model = model
        elif model in ["gpt", "gpt-4", "gpt-4o"]:
            actual_model = "openai/gpt-4o"
        elif model == "gpt-3.5":
            actual_model = "openai/gpt-3.5-turbo"
        elif "llama" in model.lower():
            actual_model = "meta-llama/llama-3-8b-instruct"
        elif "claude" in model.lower():
            actual_model = "anthropic/claude-3-opus"
        elif "gemini" in model.lower():
            actual_model = "google/gemini-pro"
        elif "mistral" in model.lower():
            actual_model = "mistral/mistral-7b-instruct"
        else:
            actual_model = model
        
        print(f"🤖 Running {actual_model} with prompt: {prompt[:100]}...")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AutoFlow"
        }
        
        payload = {
            "model": actual_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    print(f"✅ {actual_model} response: {content[:100]}...")
                    return content
                else:
                    return f"Error: No response from {actual_model}"
            else:
                error_text = response.text
                print(f"❌ API Error ({response.status_code}): {error_text}")
                return f"Error: API request failed ({response.status_code}): {error_text}"
                
    except asyncio.TimeoutError:
        return f"Error: Request timeout for {model}"
    except Exception as e:
        error_msg = f"Error running {model}: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
