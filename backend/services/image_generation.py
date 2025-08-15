import os
import httpx
import base64
import uuid
from dotenv import load_dotenv

load_dotenv()

# Create images directory if it doesn't exist
IMAGES_DIR = "generated_images"
os.makedirs(IMAGES_DIR, exist_ok=True)

async def generate_image_openai(prompt: str, size: str = "1024x1024", quality: str = "standard"):
    """Generate image using OpenAI DALL-E"""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            return {"error": "OpenAI API key not found"}

        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": quality
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()

        data = response.json()
        image_url = data["data"][0]["url"]
        
        # Download and save the image locally
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url)
            img_response.raise_for_status()
            
            # Generate unique filename
            filename = f"dalle_{uuid.uuid4().hex[:8]}.png"
            file_path = os.path.join(IMAGES_DIR, filename)
            
            with open(file_path, "wb") as f:
                f.write(img_response.content)
        
        return {
            "image_url": image_url,
            "local_path": file_path,
            "filename": filename,
            "prompt": prompt,
            "model": "dall-e-3"
        }

    except Exception as e:
        return {"error": f"OpenAI image generation failed: {str(e)}"}

async def generate_image_stability(prompt: str, width: int = 1024, height: int = 1024):
    """Generate image using Stability AI"""
    try:
        stability_key = os.getenv("STABILITY_API_KEY")
        if not stability_key:
            return {"error": "Stability API key not found"}

        headers = {
            "Authorization": f"Bearer {stability_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "width": width,
            "height": height,
            "steps": 20,
            "samples": 1
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()

        data = response.json()
        image_base64 = data["artifacts"][0]["base64"]
        
        # Save base64 image to file
        filename = f"stability_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(IMAGES_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(image_base64))
        
        return {
            "image_data": image_base64,
            "local_path": file_path,
            "filename": filename,
            "prompt": prompt,
            "model": "stable-diffusion-xl"
        }

    except Exception as e:
        return {"error": f"Stability AI image generation failed: {str(e)}"}

async def run_image_generation_node(node_data):
    """Main function for image generation node"""
    try:
        prompt = node_data.get("prompt", "")
        provider = node_data.get("provider", "openai")
        size = node_data.get("size", "1024x1024")
        quality = node_data.get("quality", "standard")

        if not prompt:
            return "Error: Image prompt is required"

        print(f"🎨 Generating image with prompt: {prompt}")
        print(f"📍 Provider: {provider}")

        if provider == "openai":
            result = await generate_image_openai(prompt, size, quality)
        elif provider == "stability":
            width, height = map(int, size.split('x'))
            result = await generate_image_stability(prompt, width, height)
        else:
            return f"Error: Unsupported provider {provider}"

        if "error" in result:
            return result["error"]

        # Return the local file path for chaining with other nodes
        if "local_path" in result:
            print(f"✅ Image saved to: {result['local_path']}")
            return f"Image generated: {result['local_path']}"
        else:
            return "Error: Failed to save generated image"

    except Exception as e:
        return f"Image generation failed: {str(e)}"
