import torch
import requests
from PIL import Image
import io
from transformers import AutoImageProcessor, AutoModelForImageClassification

def run():
    print("Downloading real image (lena)...")
    url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
    response = requests.get(url)
    img = Image.open(io.BytesIO(response.content)).convert("RGB")
    
    print("Loading model...")
    model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
    cache_dir = "./models/cache"
    processor = AutoImageProcessor.from_pretrained(model_name, cache_dir=cache_dir)
    model = AutoModelForImageClassification.from_pretrained(model_name, cache_dir=cache_dir)
    model.eval()

    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)

    print("--- REAL Image (Lena) Test ---")
    print(f"id2label: {model.config.id2label}")
    print(f"Logits: {outputs.logits.tolist()}")
    print(f"Probs: {probs.tolist()}")

if __name__ == "__main__":
    run()
