#!/usr/bin/env python3
"""Render the shared standings SQL test; execute the output only on a test DB."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
cases = json.loads((root / "src/lib/league/standings-parity-cases.json").read_text())
template = (root / "supabase/tests/standings_parity.sql").read_text()
encoded = json.dumps(cases, ensure_ascii=False, separators=(",", ":")).replace("'", "''")
print(template.replace("'__CASES_JSON__'", "'" + encoded + "'"))
