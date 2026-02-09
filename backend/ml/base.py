"""Abstract base class for ML pipeline nodes."""
from abc import ABC, abstractmethod
from typing import Any


class MLNode(ABC):
    """Base class for all ML pipeline nodes."""

    @property
    @abstractmethod
    def node_type(self) -> str:
        """Unique identifier for this node type."""

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable name."""

    @property
    @abstractmethod
    def category(self) -> str:
        """Category: 'data', 'preprocess', 'model', etc."""

    @property
    def input_ports(self) -> list[dict]:
        """List of input port definitions: [{name, datatype}]."""
        return []

    @property
    def output_ports(self) -> list[dict]:
        """List of output port definitions: [{name, datatype}]."""
        return []

    @property
    def parameter_schema(self) -> list[dict]:
        """Parameter definitions for the frontend UI.
        Each entry: {name, type, default, min?, max?, step?, options?}
        """
        return []

    @abstractmethod
    def execute(self, inputs: dict[str, Any], params: dict[str, Any]) -> dict[str, Any]:
        """Run this node. Returns dict keyed by output port names."""

    def metadata(self) -> dict:
        """Return JSON-serializable metadata for the frontend."""
        return {
            "node_type": self.node_type,
            "display_name": self.display_name,
            "category": self.category,
            "input_ports": self.input_ports,
            "output_ports": self.output_ports,
            "parameter_schema": self.parameter_schema,
        }
