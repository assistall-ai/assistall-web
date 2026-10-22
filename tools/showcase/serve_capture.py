"""Serve the showcase app snapshot for website captures.

Turns on the app's own sample modes (company board relay and the sign-in-free ERP
provider), and gives the sample company board Cedarvale's PCs and approvals instead of
the generic ones. Nothing here changes the app source or real data.
"""
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent
exec(compile((HERE / "run_showcase_app.py").read_text().split("args = sys.argv")[0], "env", "exec"))
env.update({"WADIH_WORKFLOWS_FAKE": "1", "WADIH_ERP_FAKE_PROVIDER": "1"})
os.environ.update(env)
os.chdir(DATA)
sys.path.insert(0, str(APP))
sys.argv = [str(APP / "approval_desk.py"), "serve"]

import workflow_sync  # noqa: E402


def _iso(seconds=0):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + seconds))


def _cedarvale_seed(self):
    self.scenario = ""  # nobody answers on their own while we record
    now = _iso()
    status = lambda wf, name, runs, waiting: {  # noqa: E731
        "workflow_id": wf, "name": name, "version": "1.0.0", "enabled": True, "last_change_at": now,
        "state_summary": {"open_runs": runs, "waiting_checkpoints": waiting, "failed_24h": 0, "last_run_at": now}}
    self.statuses = {
        "Warehouse PC": [status("wf_cv_customs_hold_v1", "Customs hold reply", 2, 1)],
        "Sales PC": [status("wf_cv_large_order_v1", "Large order sign-off", 1, 1)],
        "Accounts PC": [status("wf_cv_contract_renewal_v1", "Contract renewal reminder", 1, 0)],
    }
    checkpoint = lambda cid, wf, name, step, rule, pc, summary, raised: {  # noqa: E731
        "checkpoint_id": cid, "run_id": "run_" + cid, "workflow_id": wf, "workflow_name": name, "step_label": step,
        "raised_at": _iso(-raised), "expires_at": _iso(48 * 3600), "approver_rule": {"kind": rule}, "approved_by": [],
        "summary": summary, "origin_pc": pc, "status": "pending"}
    self.checkpoints = {
        "cp_cv_warehouse": checkpoint("cp_cv_warehouse", "wf_cv_customs_hold_v1", "Customs hold reply",
                                      "A manager approves the reply", "any_manager", "Warehouse PC",
                                      [{"label": "Broker", "value": "Falconline Customs Brokers"},
                                       {"label": "Shipment", "value": "CVT-5107"},
                                       {"label": "Reason", "value": "Customs hold"}], 1500),
        "cp_cv_sales": checkpoint("cp_cv_sales", "wf_cv_large_order_v1", "Large order sign-off",
                                  "Two people approve the order", "two_people", "Sales PC",
                                  [{"label": "Customer", "value": "Palm Crescent Hotels"},
                                   {"label": "Amount", "value": "AED 64,800"},
                                   {"label": "Reason", "value": "Above order limit"}], 3600),
    }


workflow_sync.FakeRelay._seed = _cedarvale_seed
import approval_desk  # noqa: E402

approval_desk.run_server()
