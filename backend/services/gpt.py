# services/gpt.py

from dotenv import load_dotenv
import os
import httpx
import asyncio

load_dotenv()

# Groq model mapping: maps node/model names to Groq model IDs
GROQ_MODEL_MAP = {
    # GPT node → best available on Groq
    "gpt": "llama-3.3-70b-versatile",
    "gpt-4": "llama-3.3-70b-versatile",
    "gpt-4o": "llama-3.3-70b-versatile",
    "gpt-3.5": "llama3-8b-8192",
    # Llama node
    "llama": "llama-3.3-70b-versatile",
    # Gemini node → Google Gemma available on Groq
    "gemini": "gemma2-9b-it",
    # Claude node → use best Groq model
    "claude": "llama-3.3-70b-versatile",
    # Mistral node
    "mistral": "mixtral-8x7b-32768",
}

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _resolve_groq_model(model: str) -> str:
    """Resolve a node model name to a Groq model ID."""
    model_lower = model.lower()

    # Already a valid Groq model ID (contains no "/" prefix issues)
    if model in GROQ_MODEL_MAP.values():
        return model

    # Strip provider prefixes like "openai/", "meta-llama/", etc.
    base = model_lower.split("/")[-1]

    # Check keyword matches
    for keyword, groq_model in GROQ_MODEL_MAP.items():
        if keyword in base or keyword in model_lower:
            return groq_model

    # Default fallback
    return "llama-3.3-70b-versatile"


async def run_gpt_node(prompt: str, model: str = "llama-3.3-70b-versatile") -> str:
    """Run AI node using Groq API"""
    try:
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            return "Error: Groq API key not configured"

        actual_model = _resolve_groq_model(model)

        print(f"🤖 Running {actual_model} via Groq with prompt: {prompt[:100]}...")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
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
                GROQ_API_URL,
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
                print(f"❌ Groq API Error ({response.status_code}): {error_text}")
                return f"Error: API request failed ({response.status_code}): {error_text}"

    except asyncio.TimeoutError:
        return f"Error: Request timeout for {model}"
    except Exception as e:
        error_msg = f"Error running {model}: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
