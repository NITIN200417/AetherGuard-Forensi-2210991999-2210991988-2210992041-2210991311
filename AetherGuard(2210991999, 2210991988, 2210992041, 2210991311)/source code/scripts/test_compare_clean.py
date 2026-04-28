import torch
import requests
from PIL import Image
import io
import warnings
warnings.filterwarnings('ignore')
from transformers import AutoImageProcessor, AutoModelForImageClassification

def run():
    url_real = "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg"
    response_real = requests.get(url_real)
    img_real = Image.open(io.BytesIO(response_real.content)).convert("RGB")

    headers = {'User-Agent': 'Mozilla/5.0'}
    response_fake = requests.get("https://thispersondoesnotexist.com/", headers=headers)
    img_fake = Image.open(io.BytesIO(response_fake.content)).convert("RGB")
    
    models_to_test = [
        "umm-maybe/AI-image-detector",
        "dima806/deepfake_vs_real_image_detection",
        "prithivMLmods/Deep-Fake-Detector-v2-Model"
    ]

    results = []

    for model_name in models_to_test:
        try:
            processor = AutoImageProcessor.from_pretrained(model_name)
            model = AutoModelForImageClassification.from_pretrained(model_name)
            model.eval()
            id2label = model.config.id2label
            
            fake_idx = -1
            for i, label in id2label.items():
                l = label.lower()
                if 'fake' in l or 'ai' in l or 'artificial' in l or 'deepfake' in l:
                    fake_idx = i
                    break
            if fake_idx == -1:
                num_classes = len(id2label)
                if num_classes == 2:
                    fake_idx = 0 if 'real' not in id2label[0].lower() else 1
            
            res_str = f"Model: {model_name} (Fake ID: {fake_idx})\n"
            for name, img in [("REAL", img_real), ("FAKE", img_fake)]:
                inputs = processor(images=img, return_tensors="pt")
                with torch.no_grad():
                    outputs = model(**inputs)
                    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                res_str += f"  {name} -> Fake Prob: {probs[0][fake_idx].item() * 100:.2f}%\n"
            results.append(res_str)
        except Exception as e:
            results.append(f"Model: {model_name}\n  Error: {e}\n")

    with open("model_comparison_results.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    run()
