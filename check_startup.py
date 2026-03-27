import sys
import os
import traceback

# Ensure current dir is in path
sys.path.append(os.getcwd())

try:
    print("Testing backend import...")
    from backend.main import app
    print("SUCCESS: Backend initialized and ready.")
except Exception as e:
    print("FAILED Startup:")
    traceback.print_exc()
