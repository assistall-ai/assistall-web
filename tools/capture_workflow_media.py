"""Record one local, synthetic Assistall workflow with Playwright."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROUTES = {
    "contract-review": ("contracts", "Contracts"),
    "shipment-review": ("shipments", "Shipments"),
    "report-preparation": ("reports", "Reports"),
}

WORKFLOW_ACTIONS = {
    "contract-review": "Open contract",
    "shipment-review": "Open shipment",
    "report-preparation": "Open report",
}


def record_workflow(base_url: str, workflow: str, video_dir: Path) -> Path:
    """Create a short silent browser recording from the disposable local app."""
    route, heading = ROUTES[workflow]
    action_label = WORKFLOW_ACTIONS[workflow]
    video_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        api = playwright.request.new_context(base_url=base_url)
        payload = {"name": "Capture Operator", "pin": "2468"}
        response = api.post("/api/setup/first-user", data=payload)
        if not response.ok:
            response = api.post("/api/login", data=payload)
        if not response.ok:
            raise RuntimeError(f"Temporary capture login failed: {response.text()}")
        session = response.json()
        preferences = api.post(
            "/api/preferences",
            data={"guided_tour_completed": True},
            headers={"X-Desk-Token": session["token"]},
        )
        if not preferences.ok:
            raise RuntimeError(f"Temporary capture preferences failed: {preferences.text()}")
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=str(video_dir),
            record_video_size={"width": 1440, "height": 900},
        )
        context.add_init_script(
            f"sessionStorage.setItem('assistall-session', {json.dumps(session['token'])});"
        )
        page = context.new_page()
        page.goto(f"{base_url}/ui/#/{route}", wait_until="networkidle")
        page.locator("#main-content h1", has_text=heading).wait_for(state="visible")
        page.locator("#guided-tour").wait_for(state="hidden")
        page.wait_for_timeout(700)
        page.get_by_role("button", name=action_label).click()
        page.locator("#main-content h1").wait_for(state="visible")
        page.wait_for_timeout(1000)
        page.mouse.wheel(0, 180)
        page.wait_for_timeout(1900)
        context.close()
        browser.close()
    videos = sorted(video_dir.glob("*.webm"), key=lambda item: item.stat().st_mtime)
    if not videos:
        raise RuntimeError("Playwright did not produce a workflow recording")
    return videos[-1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--workflow", choices=sorted(ROUTES), required=True)
    parser.add_argument("--video-dir", required=True)
    args = parser.parse_args()
    video = record_workflow(args.base_url.rstrip("/"), args.workflow, Path(args.video_dir))
    print(json.dumps({"workflow": args.workflow, "video_path": str(video)}))


if __name__ == "__main__":
    main()
