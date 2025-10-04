import os
import uuid
import base64
import httpx
import asyncio
from typing import Dict, Any

# File directories - Use /tmp for cloud deployment compatibility
BASE_DIR = "/tmp"
IMAGES_DIR = os.path.join(BASE_DIR, "generated_images")

# Create directory if it doesn't exist
os.makedirs(IMAGES_DIR, exist_ok=True)

async def generate_openai_image(prompt: str, size: str = "1024x1024", quality: str = "standard") -> str:
    """Generate image using OpenAI DALL-E"""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: OpenAI API key not configured"
        
        print(f"🎨 Generating OpenAI image with prompt: {prompt[:100]}...")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": quality,
            "response_format": "url"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                if "data" in result and len(result["data"]) > 0:
                    image_url = result["data"][0]["url"]
                    
                    # Download and save the image
                    image_response = await client.get(image_url)
                    if image_response.status_code == 200:
                        filename = f"openai_{uuid.uuid4().hex[:8]}.png"
                        file_path = os.path.join(IMAGES_DIR, filename)
                        
                        with open(file_path, "wb") as f:
                            f.write(image_response.content)
                        
                        print(f"✅ OpenAI image saved: {file_path}")
                        return file_path
                    else:
                        return "Error: Failed to download generated image"
                else:
                    return "Error: No image data in OpenAI response"
            else:
                error_text = response.text
                print(f"❌ OpenAI API Error ({response.status_code}): {error_text}")
                return f"Error: OpenAI API request failed ({response.status_code})"
                
    except asyncio.TimeoutError:
        return "Error: OpenAI image generation timeout"
    except Exception as e:
        error_msg = f"Error generating OpenAI image: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

async def generate_stability_image(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """Generate image using Stability AI"""
    try:
        api_key = os.getenv("STABILITY_API_KEY")
        if not api_key:
            return "Error: Stability AI API key not configured"
        
        print(f"🎨 Generating Stability AI image with prompt: {prompt[:100]}...")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                }
            ],
            "cfg_scale": 7,
            "height": height,
            "width": width,
            "samples": 1,
            "steps": 30
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                if "artifacts" in result and len(result["artifacts"]) > 0:
                    # Get base64 image data
                    image_data = result["artifacts"][0]["base64"]
                    
                    # Decode and save the image
                    image_bytes = base64.b64decode(image_data)
                    filename = f"stability_{uuid.uuid4().hex[:8]}.png"
                    file_path = os.path.join(IMAGES_DIR, filename)
                    
                    with open(file_path, "wb") as f:
                        f.write(image_bytes)
                    
                    print(f"✅ Stability AI image saved: {file_path}")
                    return file_path
                else:
                    return "Error: No image data in Stability AI response"
            else:
                error_text = response.text
                print(f"❌ Stability AI API Error ({response.status_code}): {error_text}")
                return f"Error: Stability AI API request failed ({response.status_code})"
                
    except asyncio.TimeoutError:
        return "Error: Stability AI image generation timeout"
    except Exception as e:
        error_msg = f"Error generating Stability AI image: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

async def run_image_generation_node(node_data: Dict[str, Any]) -> str:
    """Main function for image generation node"""
    try:
        prompt = node_data.get("prompt", "")
        provider = node_data.get("provider", "openai")
        size = node_data.get("size", "1024x1024")
        quality = node_data.get("quality", "standard")
        
        if not prompt:
            return "Error: Image prompt is required"
        
        print(f"🎨 Image generation request:")
        print(f"   Provider: {provider}")
        print(f"   Prompt: {prompt[:100]}...")
        print(f"   Size: {size}")
        
        if provider == "openai":
            result = await generate_openai_image(prompt, size, quality)
        elif provider == "stability":
            # Parse size for Stability AI
            if "x" in size:
                width, height = map(int, size.split("x"))
            else:
                width = height = 1024
            result = await generate_stability_image(prompt, width, height)
        else:
            return f"Error: Unsupported image provider: {provider}"
        
        # Check if result is a file path (success) or error message
        if result.startswith("Error:"):
            return result
        else:
            # Return success message with file path
            file_size = os.path.getsize(result) / 1024  # Size in KB
            print(f"📁 Generated image: {os.path.basename(result)} ({file_size:.1f} KB)")
            return f"Image generated: {result}"
            
    except Exception as e:
        error_msg = f"Image generation failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
