import requests
import os
import sys

def test_health():
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Backend Health Check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_inference(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return

    is_video = file_path.lower().endswith(('.mp4', '.avi', '.mov'))
    endpoint = "/predict/video" if is_video else "/predict/image"
    
    with open(file_path, "rb") as f:
        files = {"file": f}
        try:
            response = requests.post(f"http://localhost:8000{endpoint}", files=files)
            print(f"Prediction Result for {os.path.basename(file_path)}:")
            print(response.json())
        except Exception as e:
            print(f"Inference Testing Failed: {e}")

if __name__ == "__main__":
    test_health()
    if len(sys.argv) > 1:
        test_inference(sys.argv[1])
    else:
        print("\nTo test inference, run: python scripts/test_script.py path/to/media.jpg")
