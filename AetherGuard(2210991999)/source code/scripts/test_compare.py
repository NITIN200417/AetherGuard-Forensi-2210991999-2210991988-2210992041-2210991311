import torch
import requests
from PIL import Image
import io
from transformers import AutoImageProcessor, AutoModelForImageClassification

def run():
    print("Downloading REAL image (lena)...")
    url_real = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
    response_real = requests.get(url_real)
    img_real = Image.open(io.BytesIO(response_real.content)).convert("RGB")

    print("Downloading FAKE image (thispersondoesnotexist)...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response_fake = requests.get("https://thispersondoesnotexist.com/", headers=headers)
    img_fake = Image.open(io.BytesIO(response_fake.content)).convert("RGB")
    
    models_to_test = [
        "umm-maybe/AI-image-detector",
        "dima806/deepfake_vs_real_image_detection",
        "prithivMLmods/Deep-Fake-Detector-v2-Model"
    ]

    for model_name in models_to_test:
        print(f"\n==============================")
        print(f"Testing Model: {model_name}")
        try:
            processor = AutoImageProcessor.from_pretrained(model_name)
            model = AutoModelForImageClassification.from_pretrained(model_name)
            model.eval()
            id2label = model.config.id2label
            print(f"Labels: {id2label}")
            
            fake_idx = -1
            for i, label in id2label.items():
                l = label.lower()
                if 'fake' in l or 'ai' in l or 'artificial' in l or 'deepfake' in l:
                    fake_idx = i
                    break
            if fake_idx == -1:
                print("Could not find fake index, skipping.")
                num_classes = len(id2label)
                if num_classes == 2:
                    fake_idx = 0 if 'real' not in id2label[0].lower() else 1
            
            for name, img in [("REAL (Lena)", img_real), ("FAKE (TPDNE)", img_fake)]:
                inputs = processor(images=img, return_tensors="pt")
                with torch.no_grad():
                    outputs = model(**inputs)
                    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                print(f"  {name} -> Fake Prob: {probs[0][fake_idx].item() * 100:.2f}% (Logits: {outputs.logits.tolist()})")
        except Exception as e:
            print(f"Failed to test {model_name}: {e}")

if __name__ == "__main__":
    run()
