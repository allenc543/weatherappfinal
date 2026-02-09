"""Preprocessing node: handles missing values, scaling, feature engineering."""
import numpy as np
import pandas as pd
from typing import Any
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from ..base import MLNode
from ..registry import register

FEATURE_COLS = [
    "temp_max", "temp_min", "precipitation", "rain", "snowfall",
    "wind_speed", "wind_gusts", "radiation", "sunshine", "weather_code",
]


@register
class PreprocessNode(MLNode):
    node_type = "preprocess"
    display_name = "Preprocess"
    category = "preprocess"

    @property
    def input_ports(self):
        return [{"name": "input", "datatype": "dataframe"}]

    @property
    def output_ports(self):
        return [{"name": "output", "datatype": "processed"}]

    @property
    def parameter_schema(self):
        return [
            {
                "name": "scaler",
                "type": "select",
                "default": "standard",
                "options": ["standard", "minmax", "none"],
            },
            {
                "name": "fill_method",
                "type": "select",
                "default": "interpolate",
                "options": ["interpolate", "ffill", "mean", "zero"],
            },
            {
                "name": "add_lag_features",
                "type": "slider",
                "default": 3,
                "min": 0,
                "max": 7,
                "step": 1,
            },
        ]

    def execute(self, inputs: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
        data = inputs.get("input", {})
        train_df = data["train"].copy()
        test_df = data["test"].copy()

        scaler_type = params.get("scaler", "standard")
        fill_method = params.get("fill_method", "interpolate")
        lag_days = int(params.get("add_lag_features", 3))

        # Fill missing values
        for df in [train_df, test_df]:
            if fill_method == "interpolate":
                df[FEATURE_COLS] = df[FEATURE_COLS].interpolate(method="linear")
            elif fill_method == "ffill":
                df[FEATURE_COLS] = df[FEATURE_COLS].ffill()
            elif fill_method == "mean":
                df[FEATURE_COLS] = df[FEATURE_COLS].fillna(df[FEATURE_COLS].mean())
            else:
                df[FEATURE_COLS] = df[FEATURE_COLS].fillna(0)
            # Fill any remaining NaNs at edges
            df[FEATURE_COLS] = df[FEATURE_COLS].bfill().ffill().fillna(0)

        # Add lag features
        all_feature_cols = list(FEATURE_COLS)
        if lag_days > 0:
            for df in [train_df, test_df]:
                for lag in range(1, lag_days + 1):
                    for col in ["temp_max", "temp_min", "precipitation"]:
                        lag_col = f"{col}_lag{lag}"
                        df[lag_col] = df[col].shift(lag)
                        if lag_col not in all_feature_cols:
                            all_feature_cols.append(lag_col)
                df.dropna(inplace=True)

        # Scale features
        if scaler_type == "standard":
            scaler = StandardScaler()
        elif scaler_type == "minmax":
            scaler = MinMaxScaler()
        else:
            scaler = None

        train_features = train_df[all_feature_cols].values.astype(np.float32)
        test_features = test_df[all_feature_cols].values.astype(np.float32)

        if scaler:
            train_features = scaler.fit_transform(train_features).astype(np.float32)
            test_features = scaler.transform(test_features).astype(np.float32)

        return {
            "output": {
                "train_X": train_features,
                "test_X": test_features,
                "train_y": train_df["temp_max"].values.astype(np.float32),
                "test_y": test_df["temp_max"].values.astype(np.float32),
                "feature_names": all_feature_cols,
                "scaler": scaler,
                "train_dates": train_df["date"].values,
                "test_dates": test_df["date"].values,
            },
            "preview": {
                "train_samples": int(train_features.shape[0]),
                "test_samples": int(test_features.shape[0]),
                "n_features": int(train_features.shape[1]),
                "feature_names": all_feature_cols,
            },
        }
