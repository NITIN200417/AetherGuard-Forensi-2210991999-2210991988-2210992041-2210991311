import torch
import cv2
import PIL.Image as Image
from facenet_pytorch import MTCNN
import numpy as np
import os
import traceback

class InferenceEngine:
    def __init__(self, model, processor, device='cpu'):
        print(f"Building InferenceEngine on {device}...")
        self.model = model
        self.processor = processor
        self.device = device
        try:
            # Initialize MTCNN for face detection
            self.mtcnn = MTCNN(
                image_size=224, margin=20, keep_all=True, post_process=False, device=device
            )
            print("MTCNN face detector initialized.")
        except Exception as e:
            print(f"MTCNN warning: {e}")
            self.mtcnn = None

    def detect_faces(self, image):
        if self.mtcnn is None:
            return None
        try:
            # MTCNN expects a PIL image
            faces_coords, _ = self.mtcnn.detect(image)
            if faces_coords is None:
                return None
            
            extracted_faces = []
            for box in faces_coords:
                x1, y1, x2, y2 = [int(b) for b in box]
                # Crop face with bounds checking
                face = np.array(image)[max(0, y1):y2, max(0, x1):x2]
                if face.size > 0:
                    extracted_faces.append(face)
            return extracted_faces
        except Exception as e:
            print(f"Face detection failed: {e}")
            return None

    def get_fake_label_idx(self):
        try:
            id2label = getattr(self.model.config, 'id2label', None)
            if not id2label:
                return 1 # Fallback to secondary class
                
            for i, label in id2label.items():
                l_low = str(label).lower()
                if any(key in l_low for key in ['fake', 'manipulated', 'deepfake', 'synthetic']):
                    return int(i)
            return 1 
        except:
            return 1

    def predict_image(self, image_input, threshold=0.5, allow_fallback=True):
        """
        Processes an image and returns deepfake prediction.
        Scales confidence to 0.0 - 1.0 range as per requirements.
        """
        try:
            if image_input is None:
                return {"error": "Invalid image input (None)"}

            # 1. Load/Validate Image
            if isinstance(image_input, str):
                if not os.path.exists(image_input):
                    return {"error": f"Path not found: {image_input}"}
                img = Image.open(image_input).convert('RGB')
            elif isinstance(image_input, Image.Image):
                img = image_input.convert('RGB')
            else:
                img = Image.fromarray(image_input).convert('RGB')
            
            if img is None:
                return {"error": "Invalid image format"}

            # 2. Face Detection
            faces = self.detect_faces(img)
            
            # 3. Handle No Face case
            if not faces:
                if not allow_fallback:
                    return {
                        "label": "No Face Detected",
                        "confidence": 0.0,
                        "faces_detected": 0
                    }
                # Fallback to full image for general purpose uploads
                faces_to_evaluate = [np.array(img)]
            else:
                faces_to_evaluate = faces

            # 4. Model Inference
            fake_idx = self.get_fake_label_idx()
            predictions = []
            
            self.model.eval() # Ensure eval mode
            for face in faces_to_evaluate:
                try:
                    face_pil = Image.fromarray(face) if isinstance(face, np.ndarray) else face
                    # Automatic resizing to 224x224 (or model default) happens here
                    inputs = self.processor(images=face_pil, return_tensors="pt").to(self.device)
                    
                    with torch.no_grad():
                        outputs = self.model(**inputs)
                        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                        fake_prob = probs[0][fake_idx].item()
                        predictions.append(fake_prob)
                except Exception as eval_e:
                    print(f"Inference step failed: {eval_e}")
                    continue
            
            if not predictions:
                return {"error": "Model failed to generate predictions"}

            # 5. Result Aggregation
            max_fake_prob = np.max(predictions)
            label = "FAKE" if max_fake_prob > threshold else "REAL"
            confidence = max_fake_prob if max_fake_prob > threshold else (1.0 - max_fake_prob)
            
            return {
                "label": label,
                "confidence": round(float(confidence), 4), # 0.0 - 1.0 range
                "fake_probability": round(float(max_fake_prob), 4),
                "faces_detected": len(faces) if faces else 0
            }
        except Exception as e:
            traceback.print_exc()
            return {"error": f"Inference engine system error: {str(e)}"}

    def predict_video(self, video_path, sample_rate=15, threshold=0.5):
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {"error": "Could not open video file"}
                
            all_preds = []
            frame_results = []
            fake_idx = self.get_fake_label_idx()
            
            self.model.eval()
            frame_count = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                
                if frame_count % sample_rate == 0:
                    try:
                        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        img_pil = Image.fromarray(img_rgb)
                        faces = self.detect_faces(img_pil)
                        
                        items_to_eval = faces if faces else [img_rgb]
                        item_preds = []
                        
                        for item in items_to_eval:
                            item_pil = Image.fromarray(item) if isinstance(item, np.ndarray) else item
                            inputs = self.processor(images=item_pil, return_tensors="pt").to(self.device)
                            with torch.no_grad():
                                outputs = self.model(**inputs)
                                probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
                                fake_prob = probs[0][fake_idx].item()
                                item_preds.append(fake_prob)
                        
                        max_frame_fake = np.max(item_preds)
                        all_preds.append(max_frame_fake)
                        frame_results.append({
                            "frame": frame_count,
                            "prob": float(max_frame_fake),
                            "label": "FAKE" if max_frame_fake > threshold else "REAL"
                        })
                    except Exception as frame_e:
                        print(f"Frame {frame_count} failed: {frame_e}")
                    
                frame_count += 1
            cap.release()
            
            if not all_preds:
                return {"error": "Video processing failed: No valid frames analyzed"}
            
            avg_fake_prob = np.mean(all_preds)
            label = "FAKE" if avg_fake_prob > threshold else "REAL"
            confidence = avg_fake_prob if avg_fake_prob > threshold else (1.0 - avg_fake_prob)
            
            return {
                "label": label,
                "confidence": round(float(confidence), 4),
                "fake_probability": round(float(avg_fake_prob), 4),
                "frame_wise": frame_results,
                "total_frames_processed": len(frame_results)
            }
        except Exception as e:
            traceback.print_exc()
            return {"error": f"Video analysis system error: {str(e)}"}
