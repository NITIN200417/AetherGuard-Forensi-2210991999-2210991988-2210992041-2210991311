import torch
from models.model import load_hf_model
from utils.inference import InferenceEngine
from PIL import Image
import os
import sys

def debug_inference():
    print("--- STEP 1: Device Check ---")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    print("\n--- STEP 2: Model Loading ---")
    try:
        model, processor = load_hf_model(device=device)
        print("Model and processor loaded successfully.")
    except Exception as e:
        print(f"FAILED to load model: {str(e)}")
        return

    print("\n--- STEP 3: Inference Engine Init ---")
    try:
        engine = InferenceEngine(model=model, processor=processor, device=device)
        print("Inference engine initialized.")
    except Exception as e:
        print(f"FAILED to init engine: {str(e)}")
        return

    print("\n--- STEP 4: Test Image Prediction ---")
    test_img_path = "test_fake.jpg"
    if not os.path.exists(test_img_path):
        print(f"No {test_img_path} found, creating a dummy one...")
        import numpy as np
        dummy = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        Image.fromarray(dummy).save(test_img_path)
    
    try:
        results = engine.predict_image(test_img_path)
        print("Prediction Result:", results)
    except Exception as e:
        print(f"FAILED prediction: {str(e)}")

    print("\n--- STEP 5: Backend Proxy Test ---")
    import requests
    try:
        url = "https://www.w3schools.com/html/mov_bbb.mp4"
        r = requests.get(url, timeout=5)
        print(f"Can reach external URLs: {r.status_code}")
    except Exception as e:
        print(f"FAILED to reach external URLs: {str(e)}")

if __name__ == "__main__":
    debug_inference()
