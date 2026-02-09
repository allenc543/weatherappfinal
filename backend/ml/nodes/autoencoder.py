"""Autoencoder node: PyTorch-based dimensionality reduction."""
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Any
from ..base import MLNode
from ..registry import register


class Autoencoder(nn.Module):
    def __init__(self, input_dim: int, latent_dim: int):
        super().__init__()
        mid = max(latent_dim + 2, (input_dim + latent_dim) // 2)
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, mid),
            nn.ReLU(),
            nn.Linear(mid, latent_dim),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, mid),
            nn.ReLU(),
            nn.Linear(mid, input_dim),
        )

    def forward(self, x):
        z = self.encoder(x)
        reconstructed = self.decoder(z)
        return reconstructed, z


@register
class AutoencoderNode(MLNode):
    node_type = "autoencoder"
    display_name = "Autoencoder"
    category = "model"

    @property
    def input_ports(self):
        return [{"name": "input", "datatype": "processed"}]

    @property
    def output_ports(self):
        return [{"name": "output", "datatype": "encoded"}]

    @property
    def parameter_schema(self):
        return [
            {
                "name": "latent_dim",
                "type": "slider",
                "default": 5,
                "min": 2,
                "max": 15,
                "step": 1,
            },
            {
                "name": "epochs",
                "type": "slider",
                "default": 50,
                "min": 10,
                "max": 200,
                "step": 10,
            },
            {
                "name": "learning_rate",
                "type": "slider",
                "default": 0.001,
                "min": 0.0001,
                "max": 0.01,
                "step": 0.0001,
            },
            {
                "name": "batch_size",
                "type": "slider",
                "default": 32,
                "min": 8,
                "max": 128,
                "step": 8,
            },
        ]

    def execute(self, inputs: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
        data = inputs.get("input", {})
        train_features = data["train_X"]
        test_features = data["test_X"]

        latent_dim = int(params.get("latent_dim", 5))
        epochs = int(params.get("epochs", 50))
        lr = float(params.get("learning_rate", 0.001))
        batch_size = int(params.get("batch_size", 32))
        input_dim = train_features.shape[1]

        device = torch.device("cpu")
        model = Autoencoder(input_dim, latent_dim).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr)
        criterion = nn.MSELoss()

        train_tensor = torch.tensor(train_features, dtype=torch.float32)
        dataset = TensorDataset(train_tensor)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        losses = []
        for epoch in range(epochs):
            epoch_loss = 0.0
            for (batch,) in loader:
                batch = batch.to(device)
                reconstructed, _ = model(batch)
                loss = criterion(reconstructed, batch)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item() * batch.size(0)
            avg_loss = epoch_loss / len(train_tensor)
            losses.append(avg_loss)

        # Encode both train and test
        model.eval()
        with torch.no_grad():
            _, train_encoded = model(train_tensor.to(device))
            test_tensor = torch.tensor(test_features, dtype=torch.float32).to(device)
            test_recon, test_encoded = model(test_tensor)
            test_loss = criterion(test_recon, test_tensor).item()

        return {
            "output": {
                "train_X": train_encoded.cpu().numpy(),
                "test_X": test_encoded.cpu().numpy(),
                "train_y": data["train_y"],
                "test_y": data["test_y"],
                "train_dates": data.get("train_dates"),
                "test_dates": data.get("test_dates"),
            },
            "metrics": {
                "final_train_loss": round(losses[-1], 6),
                "test_reconstruction_loss": round(test_loss, 6),
                "latent_dim": latent_dim,
                "epochs_trained": epochs,
                "loss_curve": [round(l, 6) for l in losses[::max(1, len(losses) // 20)]],
            },
        }
