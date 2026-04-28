import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from models.model import DeepfakeDetector
from datasets.dataloader import get_dataloader, get_transforms
import time
import os

def train_model(train_root, val_root=None, epochs=20, batch_size=32, lr=0.001, device='cpu'):
    # Model and loss
    model = DeepfakeDetector(model_name='efficientnet_b0', pretrained=True)
    model.to(device)
    
    # EfficientNet classifier has sigmoid in forward, but BCEWithLogitsLoss is better
    # Wait, in models/model.py I have a sigmoid in forward.
    # Let's use BCE Loss if we have sigmoid.
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # Data loaders
    train_loader = get_dataloader(train_root, batch_size=batch_size, is_train=True)
    val_loader = None
    if val_root:
        val_loader = get_dataloader(val_root, batch_size=batch_size, is_train=False)

    print(f"Starting training for {epochs} epochs on {device}...")
    
    best_loss = float('inf')
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        start = time.time()
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device).unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
        
        avg_train_loss = running_loss / len(train_loader)
        
        # Validation
        val_loss = 0.0
        val_acc = 0.0
        if val_loader:
            model.eval()
            with torch.no_grad():
                correct = 0
                total = 0
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device).unsqueeze(1)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    val_loss += loss.item()
                    
                    preds = (outputs > 0.5).float()
                    correct += (preds == labels).sum().item()
                    total += labels.size(0)
                
                val_acc = (correct / total) * 100
                avg_val_loss = val_loss / len(val_loader)
                
                print(f"Epoch {epoch+1}/{epochs} - Train Loss: {avg_train_loss:.4f} - Val Loss: {avg_val_loss:.4f} - Val Acc: {val_acc:.2f}% - Time: {time.time()-start:.2f}s")
                
                # Save best model
                if avg_val_loss < best_loss:
                    best_loss = avg_val_loss
                    torch.save(model.state_dict(), "models/deepfake_model_best.pth")
            
        else:
            print(f"Epoch {epoch+1}/{epochs} - Train Loss: {avg_train_loss:.4f} - Time: {time.time()-start:.2f}s")
            torch.save(model.state_dict(), f"models/deepfake_model_epoch_{epoch+1}.pth")

    print("Training finished.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--train_path", type=str, required=True)
    parser.add_argument("--val_path", type=str, default=None)
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.0001)
    args = parser.parse_args()
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    train_model(args.train_path, args.val_path, args.epochs, args.batch_size, args.lr, device)
