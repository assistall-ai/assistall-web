"""Run a clean snapshot of the Assistall app on a throwaway data folder for website captures."""
import os
import subprocess
import sys
from pathlib import Path

APP = Path(os.environ["TEMP"]) / "assistall-showcase-app"
DATA = Path(os.environ["TEMP"]) / "assistall-capture-showcase"
DATA.mkdir(parents=True, exist_ok=True)
(DATA / "attachments").mkdir(exist_ok=True)

env = dict(os.environ)
env.update({
    "PYTHONDONTWRITEBYTECODE": "1",
    "PYTHONIOENCODING": "utf-8",
    "DESK_PORT": os.environ.get("DESK_PORT", "8791"),
    "DESK_APP_DIR": str(APP),
    "WADIH_AI_DATA_DIR": str(DATA),
    "WADIH_AI_LICENSE_MODE": "internal",
    "WADIH_AI_LICENSE_FILE": str(DATA / "license.dat"),
    "WADIH_AI_SHOW_DEMO_OPERATIONS": "0",
    "SENTINEL_LLM": "off",
    "SENTINEL_DB": str(DATA / "inbox_sentinel.db"),
    "DESK_CONFIG": str(DATA / "desk_config.enc"),
    "DESK_LOG": str(DATA / "desk.log"),
    "SENTINEL_ATTACH_DIR": str(DATA / "attachments"),
    "WA_THUMB_DIR": str(DATA / "attachments" / "wa_thumbs"),
    "WA_MEDIA_DIR": str(DATA / "attachments" / "wa_incoming"),
    "ERP_CONNECTOR_DB": str(DATA / "erp_connectors.db"),
    "ODOO_KB_DB": str(DATA / "odoo_knowledge.db"),
    "ERP_WRITES_DB": str(DATA / "erp_writes.db"),
    "ERP_HELP_DB": str(DATA / "erp_help.db"),
    "ERP_CAPABILITIES_DB": str(DATA / "erp_capabilities.db"),
    "AUTOMATIONS_DB": str(DATA / "automations.db"),
    "COMPANY_KB_DB": str(DATA / "company_knowledge.db"),
    "ZOHO_KB_DB": str(DATA / "zoho_knowledge.db"),
    "WORKFLOWS_DB": str(DATA / "workflows.db"),
})
args = sys.argv[1:] or ["serve"]
sys.exit(subprocess.call([sys.executable, str(APP / "approval_desk.py"), *args], cwd=str(DATA), env=env))
