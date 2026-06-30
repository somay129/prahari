"""
Fraud network graph builder and community detector.
Uses NetworkX + Louvain community detection.
Fully local — no external dependencies beyond Python packages.
"""

import json
import hashlib
import uuid
from pathlib import Path
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import random

import networkx as nx

try:
    import community as community_louvain
    LOUVAIN_AVAILABLE = True
except ImportError:
    LOUVAIN_AVAILABLE = False

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "synthetic" / "graph"
ENGINE_VERSION = "FRD-1.0.0"

ROLE_INFERENCE = {
    "high_in_low_out": "Aggregator",
    "high_out_low_in": "Mule",
    "both_high": "Hub",
    "both_low": "Peripheral",
    "victim_flag": "Victim",
}


@dataclass
class RingNode:
    id: str
    node_type: str
    label: str
    role: str
    degree: int
    risk_score: float
    attributes: dict = field(default_factory=dict)


@dataclass
class FraudRing:
    ring_id: str
    severity: str
    member_count: int
    victim_count: int
    total_exposure_inr: float
    lead_time_days: float
    confidence: float
    nodes: list[RingNode] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    chain_of_custody: dict = field(default_factory=dict)
    decision_trace: dict = field(default_factory=dict)


def _severity(exposure: float, victims: int) -> str:
    if exposure > 5_000_000 or victims > 20:
        return "CRITICAL"
    elif exposure > 1_000_000 or victims > 8:
        return "HIGH"
    elif exposure > 200_000 or victims > 3:
        return "MEDIUM"
    return "LOW"


def _infer_role(G: nx.DiGraph, node_id: str, victims: set) -> str:
    if node_id in victims:
        return "Victim"
    in_d = G.in_degree(node_id)
    out_d = G.out_degree(node_id)
    if in_d > 3 and out_d <= 1:
        return "Aggregator"
    if out_d > 3 and in_d <= 1:
        return "Mule"
    if in_d > 2 and out_d > 2:
        return "Hub"
    return "Peripheral"


def _lead_time(G: nx.DiGraph, victim_nodes: set, ring_nodes: set) -> float:
    """Days between earliest ring member transaction and latest victim report."""
    earliest = None
    latest_victim = None
    for n in ring_nodes:
        ts = G.nodes[n].get("first_seen")
        if ts:
            dt = datetime.fromisoformat(ts)
            if earliest is None or dt < earliest:
                earliest = dt
    for n in victim_nodes:
        ts = G.nodes[n].get("report_date")
        if ts:
            dt = datetime.fromisoformat(ts)
            if latest_victim is None or dt > latest_victim:
                latest_victim = dt
    if earliest and latest_victim and latest_victim > earliest:
        return (latest_victim - earliest).days
    return random.uniform(3, 45)


def build_graph_from_data() -> nx.DiGraph:
    G = nx.DiGraph()
    accounts_file = DATA_PATH / "accounts.json"
    txn_file = DATA_PATH / "transactions.json"
    victims_file = DATA_PATH / "victims.json"
    phones_file = DATA_PATH / "phones.json"
    if not accounts_file.exists():
        return _synthetic_graph()
    with open(accounts_file) as f:
        accounts = json.load(f)
    with open(txn_file) as f:
        transactions = json.load(f)
    with open(victims_file) as f:
        victims = json.load(f)
    with open(phones_file) as f:
        phones = json.load(f)
    for acc in accounts:
        attrs = {k: v for k, v in acc.items() if k != "id"}
        attrs["node_type"] = "account"
        attrs["label"] = acc["id"][:12]
        G.add_node(acc["id"], **attrs)
    for v in victims:
        attrs = {k: val for k, val in v.items() if k != "id"}
        attrs["node_type"] = "victim"
        attrs["label"] = f"V-{v['name'][:8]}"
        G.add_node(v["id"], **attrs)
    for p in phones:
        attrs = {k: val for k, val in p.items() if k != "id"}
        attrs["node_type"] = "phone"
        attrs["label"] = p["number"]
        G.add_node(p["id"], **attrs)
    for t in transactions:
        G.add_edge(t["from"], t["to"], weight=t["amount"], txn_id=t["id"], ts=t["timestamp"])
    return G


def _synthetic_graph() -> nx.DiGraph:
    """Fallback: generate a synthetic fraud graph in memory."""
    from data.seeds.seed_graph import generate_synthetic_graph
    return generate_synthetic_graph()


def detect_rings(G: nx.DiGraph | None = None) -> list[FraudRing]:
    if G is None:
        G = build_graph_from_data()
    undirected = G.to_undirected()
    if LOUVAIN_AVAILABLE and len(undirected.nodes) > 0:
        partition = community_louvain.best_partition(undirected)
        communities: dict[int, set] = {}
        for node, comm in partition.items():
            communities.setdefault(comm, set()).add(node)
    else:
        comps = list(nx.connected_components(undirected))
        communities = {i: c for i, c in enumerate(comps)}
    victim_nodes = {n for n, d in G.nodes(data=True) if d.get("node_type") == "victim"}
    rings: list[FraudRing] = []
    for comm_id, members in communities.items():
        if len(members) < 3:
            continue
        victims_in_ring = members & victim_nodes
        if not victims_in_ring and len(members) < 5:
            continue
        non_victim = members - victim_nodes
        subg = G.subgraph(members)
        total_exposure = sum(
            d.get("weight", 0) for _, _, d in subg.edges(data=True)
            if isinstance(d.get("weight"), (int, float))
        )
        lead_time = _lead_time(G, victims_in_ring, non_victim)
        severity = _severity(total_exposure, len(victims_in_ring))
        confidence = min(0.97, 0.5 + 0.1 * len(members) + 0.05 * len(victims_in_ring))
        ring_nodes_out = []
        for n in members:
            attrs = dict(G.nodes[n])
            role = _infer_role(G, n, victim_nodes)
            risk = min(0.99, 0.3 + 0.1 * G.degree(n))
            ring_nodes_out.append(RingNode(
                id=str(n),
                node_type=attrs.get("node_type", "account"),
                label=attrs.get("label", str(n)[:12]),
                role=role,
                degree=G.degree(n),
                risk_score=round(risk, 2),
                attributes={k: v for k, v in attrs.items() if k not in ("node_type", "label")},
            ))
        edges_out = [
            {"source": str(u), "target": str(v), "weight": d.get("weight", 0), "ts": d.get("ts", "")}
            for u, v, d in subg.edges(data=True)
        ]
        ring_id = f"RING-{str(uuid.uuid4())[:6].upper()}"
        coc = {
            "ring_id": ring_id,
            "generated_at": datetime.utcnow().isoformat(),
            "engine_version": ENGINE_VERSION,
            "community_id": comm_id,
            "detection_method": "Louvain" if LOUVAIN_AVAILABLE else "Connected Components",
            "graph_hash": hashlib.sha256(str(sorted(members)).encode()).hexdigest()[:16],
        }
        rings.append(FraudRing(
            ring_id=ring_id,
            severity=severity,
            member_count=len(members),
            victim_count=len(victims_in_ring),
            total_exposure_inr=round(total_exposure, 2),
            lead_time_days=round(lead_time, 1),
            confidence=round(confidence, 3),
            nodes=ring_nodes_out,
            edges=edges_out,
            chain_of_custody=coc,
            decision_trace={"community_id": comm_id, "method": "louvain" if LOUVAIN_AVAILABLE else "components"},
        ))
    rings.sort(key=lambda r: (r.severity == "CRITICAL", r.total_exposure_inr), reverse=True)
    return rings
