from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
import os

def load_hf_model(model_name="dima806/deepfake_vs_real_image_detection", device='cpu'):
    # Define local cache directory
    cache_dir = os.path.abspath("./models/cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    # Fast-load from local cache to avoid network hangs
    kwargs = {"cache_dir": cache_dir}
    try:
        print("Initial attempt: Loading from local cache...")
        processor = AutoImageProcessor.from_pretrained(model_name, local_files_only=True, **kwargs)
        model = AutoModelForImageClassification.from_pretrained(model_name, local_files_only=True, low_cpu_mem_usage=True, **kwargs)
        print("Success: Model loaded instantly from cache.")
    except Exception as e:
        print(f"Cache miss or network check required: {str(e)}")
        print("Final attempt: Fetching from Hugging Face Hub (this may take time)...")
        processor = AutoImageProcessor.from_pretrained(model_name, **kwargs)
        model = AutoModelForImageClassification.from_pretrained(model_name, low_cpu_mem_usage=True, **kwargs)
    
    model.to(device)
    model.eval()
    return model, processor

# Compatibility function
def load_model(weights_path=None, device='cpu'):
    return load_hf_model(device=device)
