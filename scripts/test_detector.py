import torch
import requests
from PIL import Image
import io
from transformers import AutoImageProcessor, AutoModelForImageClassification
import numpy as np

def run_test():
    print("Downloading image from thispersondoesnotexist.com...")
    # NOTE: thispersondoesnotexist.com returns a new image on every request.
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get("https://thispersondoesnotexist.com/", headers=headers)
    img = Image.open(io.BytesIO(response.content)).convert("RGB")
    img.save("test_fake.jpg")
    print("Image saved as test_fake.jpg")

    model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
    cache_dir = "./models/cache"
    print(f"Loading model {model_name}...")
    processor = AutoImageProcessor.from_pretrained(model_name, cache_dir=cache_dir)
    model = AutoModelForImageClassification.from_pretrained(model_name, cache_dir=cache_dir)
    model.eval()

    print("\n--- Testing Full Image ---")
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        
    print(f"id2label: {model.config.id2label}")
    print(f"Logits: {logits.tolist()}")
    print(f"Probs: {probs.tolist()}")

    print("\n--- Testing MTCNN Cropped Face ---")
    from facenet_pytorch import MTCNN
    mtcnn = MTCNN(image_size=224, margin=20, keep_all=True, post_process=False, device='cpu')
    faces_coords, _ = mtcnn.detect(img)
    if faces_coords is not None:
        for i, box in enumerate(faces_coords):
            x1, y1, x2, y2 = [int(b) for b in box]
            face = np.array(img)[max(0, y1):y2, max(0, x1):x2]
            if face.size > 0:
                face_img = Image.fromarray(face)
                face_img.save(f"test_fake_crop_{i}.jpg")
                inputs_face = processor(images=face_img, return_tensors="pt")
                with torch.no_grad():
                    outputs_face = model(**inputs_face)
                    logits_face = outputs_face.logits
                    probs_face = torch.nn.functional.softmax(logits_face, dim=-1)
                
                print(f"Crop {i}:")
                print(f"Logits: {logits_face.tolist()}")
                print(f"Probs: {probs_face.tolist()}")
    else:
        print("No faces detected.")

if __name__ == "__main__":
    run_test()
