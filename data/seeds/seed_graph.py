"""
Generates synthetic fraud network graph data.
"""

import json
import uuid
import random
from datetime import datetime, timedelta
from pathlib import Path
import networkx as nx

OUT_DIR = Path(__file__).parent.parent / "synthetic" / "graph"

INDIAN_NAMES = ["Rajesh Sharma","Priya Patel","Amit Kumar","Sunita Singh","Vijay Gupta",
                "Anita Verma","Manoj Rao","Kavita Joshi","Suresh Nair","Deepa Menon",
                "Arjun Reddy","Lakshmi Iyer","Rakesh Tiwari","Shweta Agarwal","Mohan Das"]

CITIES = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad",
          "Jaipur","Lucknow","Surat","Nagpur","Indore","Bhopal","Patna"]

BANKS = ["SBI","HDFC","ICICI","Axis","Kotak","PNB","Canara","Union Bank","BOI","BOB"]


def _uid():
    return str(uuid.uuid4())[:8].upper()


def _dt(days_ago: int) -> str:
    return (datetime.utcnow() - timedelta(days=days_ago)).isoformat()


def generate_synthetic_graph() -> nx.DiGraph:
    G = nx.DiGraph()
    random.seed(42)
    n_rings = 6
    all_accounts = []
    all_victims = []
    all_phones = []
    all_transactions = []

    for ring_idx in range(n_rings):
        ring_size = random.randint(4, 10)
        ring_accounts = []
        for i in range(ring_size):
            acc_id = f"ACC-{_uid()}"
            acc = {
                "id": acc_id,
                "node_type": "account",
                "label": acc_id,
                "bank": random.choice(BANKS),
                "city": random.choice(CITIES),
                "balance": random.randint(0, 500000),
                "first_seen": _dt(random.randint(60, 180)),
                "ring_hint": ring_idx,
            }
            G.add_node(acc_id, **acc)
            all_accounts.append(acc)
            ring_accounts.append(acc_id)
            phone_id = f"PH-{_uid()}"
            ph = {"id": phone_id, "node_type": "phone", "number": f"+91{random.randint(7000000000, 9999999999)}", "label": phone_id}
            G.add_node(phone_id, **ph)
            all_phones.append(ph)
            G.add_edge(acc_id, phone_id, weight=0, txn_id=_uid(), ts=_dt(random.randint(1, 30)))

        for _ in range(ring_size * 2):
            src = random.choice(ring_accounts)
            dst = random.choice(ring_accounts)
            if src != dst:
                amount = random.randint(5000, 200000)
                txn = {"id": _uid(), "from": src, "to": dst, "amount": amount, "timestamp": _dt(random.randint(1, 60))}
                G.add_edge(src, dst, weight=amount, txn_id=txn["id"], ts=txn["timestamp"])
                all_transactions.append(txn)

        n_victims = random.randint(2, 8)
        for v in range(n_victims):
            v_id = f"VIC-{_uid()}"
            victim = {
                "id": v_id,
                "node_type": "victim",
                "name": random.choice(INDIAN_NAMES),
                "city": random.choice(CITIES),
                "amount_lost": random.randint(10000, 500000),
                "report_date": _dt(random.randint(0, 15)),
                "label": f"V-{v_id[:6]}",
            }
            G.add_node(v_id, **victim)
            all_victims.append(victim)
            mule = random.choice(ring_accounts)
            amount = victim["amount_lost"]
            txn = {"id": _uid(), "from": v_id, "to": mule, "amount": amount, "timestamp": _dt(random.randint(0, 30))}
            G.add_edge(v_id, mule, weight=amount, txn_id=txn["id"], ts=txn["timestamp"])
            all_transactions.append(txn)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUT_DIR / "accounts.json", "w") as f:
        json.dump(all_accounts, f, indent=2)
    with open(OUT_DIR / "transactions.json", "w") as f:
        json.dump(all_transactions, f, indent=2)
    with open(OUT_DIR / "victims.json", "w") as f:
        json.dump(all_victims, f, indent=2)
    with open(OUT_DIR / "phones.json", "w") as f:
        json.dump(all_phones, f, indent=2)

    return G


def seed_graph_data():
    G = generate_synthetic_graph()
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges -> {OUT_DIR}")


if __name__ == "__main__":
    seed_graph_data()
