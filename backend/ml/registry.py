"""Registry for ML node types with auto-discovery."""
from typing import Type
from .base import MLNode

_REGISTRY: dict[str, Type[MLNode]] = {}


def register(cls: Type[MLNode]) -> Type[MLNode]:
    """Decorator to register an MLNode subclass."""
    instance = cls()
    _REGISTRY[instance.node_type] = cls
    return cls


def get_node_class(node_type: str) -> Type[MLNode]:
    if node_type not in _REGISTRY:
        raise ValueError(f"Unknown node type: {node_type}")
    return _REGISTRY[node_type]


def get_all_metadata() -> list[dict]:
    return [cls().metadata() for cls in _REGISTRY.values()]


def discover_nodes():
    """Import all node modules to trigger @register decorators."""
    from .nodes import data_source, preprocess, autoencoder, xgboost_node  # noqa: F401
