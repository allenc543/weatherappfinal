"""Data source node: loads city weather CSV data."""
import pandas as pd
from pathlib import Path
from typing import Any
from ..base import MLNode
from ..registry import register

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@register
class DataSourceNode(MLNode):
    node_type = "data_source"
    display_name = "Data Source"
    category = "data"

    @property
    def output_ports(self):
        return [{"name": "output", "datatype": "dataframe"}]

    @property
    def parameter_schema(self):
        cities = [f.stem for f in sorted(DATA_DIR.glob("*.csv"))]
        return [
            {
                "name": "city",
                "type": "select",
                "default": cities[0] if cities else "houston",
                "options": cities,
            },
            {
                "name": "train_ratio",
                "type": "slider",
                "default": 0.8,
                "min": 0.5,
                "max": 0.95,
                "step": 0.05,
            },
        ]

    def execute(self, inputs: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
        city = params.get("city", "houston")
        train_ratio = params.get("train_ratio", 0.8)
        csv_path = DATA_DIR / f"{city}.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"No data for city: {city}")

        df = pd.read_csv(csv_path)
        df["date"] = pd.to_datetime(df["date"])

        split_idx = int(len(df) * train_ratio)
        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

        preview_rows = df.tail(10).to_dict(orient="records")
        for row in preview_rows:
            row["date"] = str(row["date"])

        return {
            "output": {"train": train_df, "test": test_df, "full": df},
            "preview": {
                "rows": len(df),
                "columns": list(df.columns),
                "train_rows": len(train_df),
                "test_rows": len(test_df),
                "sample": preview_rows,
            },
        }
