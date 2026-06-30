"""
Master seed script — generates all synthetic data.
Run: python -m data.seeds.seed_all
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from data.seeds.seed_transcripts import seed_transcripts
from data.seeds.seed_graph import seed_graph_data
from data.seeds.seed_geo import seed_geo_data


def main():
    print("=== PRAHARI Synthetic Data Seeder ===")
    print("All data is synthetic - for evaluation only.\n")
    seed_transcripts()
    seed_graph_data()
    seed_geo_data()
    print("\nAll seed data generated successfully.")


if __name__ == "__main__":
    main()
