"""Capture candidate still screens of the showcase app for the website (1440x900)."""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

from showcase_browser import BASE, login, new_context, open_route

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)


def shot(page, name):
    page.mouse.move(1430, 890)
    page.wait_for_timeout(600)
    page.screenshot(path=str(OUT / f"{name}.png"))
    print("saved", name)


with sync_playwright() as p:
    token = login(p)
    api = p.request.new_context(base_url=BASE, extra_http_headers={"X-Desk-Token": token})
    runs = api.get("/api/workflows/wf_cv_large_order_v1/runs").json()["runs"]
    browser = p.chromium.launch(headless=True)
    page = new_context(browser, token).new_page()

    for route, name in (("integrations", "flow-connect"), ("overview", "flow-find"), ("workflows", "cap-inbox"),
                        ("reports", "cap-files"), ("requests", "cap-clients"), ("booking", "cap-booking"),
                        ("booking/calendar", "cap-booking-calendar"), ("automations", "cap-workflows"),
                        ("records", "cap-records"), ("contracts", "cap-contracts-list"), ("shipments", "cap-shipments-list")):
        open_route(page, route, 2200)
        shot(page, name)

    for run in runs:
        open_route(page, f"automations/run/{run['id']}", 2200)
        shot(page, f"flow-decide-{run['id'][-4:]}")

    open_route(page, "workflows", 1800)
    page.locator("#main-content article").filter(has_text="Order for December banquets").first.get_by_role("button", name="Check reply").click()
    page.wait_for_timeout(1800)
    page.get_by_role("button", name="Preview").first.click()
    page.wait_for_timeout(1500)
    shot(page, "flow-prepare")

    open_route(page, "contracts", 1800)
    page.get_by_role("button", name="Open contract").first.click()
    page.wait_for_timeout(2200)
    shot(page, "cap-contracts")

    open_route(page, "shipments", 1800)
    page.get_by_role("button", name="Open shipment").first.click()
    page.wait_for_timeout(2200)
    shot(page, "cap-shipments")

    open_route(page, "records", 1800)
    page.get_by_role("button", name="Open").first.click()
    page.wait_for_timeout(2200)
    shot(page, "cap-records-expiry")
    browser.close()
