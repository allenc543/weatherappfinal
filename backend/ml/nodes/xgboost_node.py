"""XGBoost regression node for temperature prediction."""
import numpy as np
from typing import Any
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from ..base import MLNode
from ..registry import register


@register
class XGBoostNode(MLNode):
    node_type = "xgboost"
    display_name = "XGBoost"
    category = "model"

    @property
    def input_ports(self):
        return [{"name": "input", "datatype": "features"}]

    @property
    def output_ports(self):
        return [{"name": "output", "datatype": "predictions"}]

    @property
    def parameter_schema(self):
        return [
            {
                "name": "n_estimators",
                "type": "slider",
                "default": 100,
                "min": 10,
                "max": 500,
                "step": 10,
            },
            {
                "name": "max_depth",
                "type": "slider",
                "default": 6,
                "min": 2,
                "max": 15,
                "step": 1,
            },
            {
                "name": "learning_rate",
                "type": "slider",
                "default": 0.1,
                "min": 0.01,
                "max": 0.3,
                "step": 0.01,
            },
            {
                "name": "subsample",
                "type": "slider",
                "default": 0.8,
                "min": 0.5,
                "max": 1.0,
                "step": 0.05,
            },
        ]

    def execute(self, inputs: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
        data = inputs.get("input", {})
        train_X = data["train_X"]
        test_X = data["test_X"]
        train_y = data["train_y"]
        test_y = data["test_y"]

        model = XGBRegressor(
            n_estimators=int(params.get("n_estimators", 100)),
            max_depth=int(params.get("max_depth", 6)),
            learning_rate=float(params.get("learning_rate", 0.1)),
            subsample=float(params.get("subsample", 0.8)),
            random_state=42,
            verbosity=0,
        )
        model.fit(train_X, train_y)

        train_pred = model.predict(train_X)
        test_pred = model.predict(test_X)

        # Build prediction vs actual chart data
        test_dates = data.get("test_dates")
        chart_data = []
        step = max(1, len(test_y) // 100)  # Limit to ~100 points for chart
        for i in range(0, len(test_y), step):
            entry = {
                "actual": round(float(test_y[i]), 2),
                "predicted": round(float(test_pred[i]), 2),
            }
            if test_dates is not None:
                entry["date"] = str(test_dates[i])[:10]
            else:
                entry["index"] = i
            chart_data.append(entry)

        return {
            "output": {
                "train_pred": train_pred,
                "test_pred": test_pred,
                "test_actual": test_y,
            },
            "metrics": {
                "train_rmse": round(float(np.sqrt(mean_squared_error(train_y, train_pred))), 4),
                "test_rmse": round(float(np.sqrt(mean_squared_error(test_y, test_pred))), 4),
                "test_mae": round(float(mean_absolute_error(test_y, test_pred)), 4),
                "test_r2": round(float(r2_score(test_y, test_pred)), 4),
                "chart_data": chart_data,
            },
        }
