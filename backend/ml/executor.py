"""Pipeline executor: topological sort and run."""
from collections import defaultdict, deque
from typing import Any
from .registry import get_node_class


def topological_sort(nodes: list[dict], edges: list[dict]) -> list[str]:
    """Return node IDs in execution order."""
    graph: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {n["id"]: 0 for n in nodes}

    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        graph[src].append(tgt)
        in_degree[tgt] = in_degree.get(tgt, 0) + 1

    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    order = []
    while queue:
        nid = queue.popleft()
        order.append(nid)
        for neighbor in graph[nid]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(nodes):
        raise ValueError("Pipeline contains a cycle")
    return order


def run_pipeline(pipeline: dict) -> dict[str, Any]:
    """Execute a pipeline graph and return results per node.

    pipeline = {
        "nodes": [{"id": "n1", "type": "data_source", "params": {...}}, ...],
        "edges": [{"source": "n1", "sourceHandle": "output", "target": "n2", "targetHandle": "input"}, ...]
    }
    """
    nodes = pipeline["nodes"]
    edges = pipeline["edges"]
    order = topological_sort(nodes, edges)

    node_map = {n["id"]: n for n in nodes}
    outputs: dict[str, dict[str, Any]] = {}
    results: dict[str, Any] = {}

    for nid in order:
        node_def = node_map[nid]
        node_cls = get_node_class(node_def["type"])
        node_instance = node_cls()

        # Gather inputs from upstream edges
        inputs: dict[str, Any] = {}
        for edge in edges:
            if edge["target"] == nid:
                src_id = edge["source"]
                src_handle = edge.get("sourceHandle", "output")
                tgt_handle = edge.get("targetHandle", "input")
                if src_id in outputs and src_handle in outputs[src_id]:
                    inputs[tgt_handle] = outputs[src_id][src_handle]

        params = node_def.get("params", {})
        node_outputs = node_instance.execute(inputs, params)
        outputs[nid] = node_outputs

        # Collect user-facing results (metrics, previews, etc.)
        if "metrics" in node_outputs:
            results[nid] = {
                "node_type": node_def["type"],
                "metrics": node_outputs["metrics"],
            }
        if "preview" in node_outputs:
            results.setdefault(nid, {})["preview"] = node_outputs["preview"]
            results[nid]["node_type"] = node_def["type"]

    return results
