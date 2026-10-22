"""Record the website's product videos from the local showcase app (fictional Cedarvale data).

python capture_videos.py OUT_DIR build|library|approve|board|contract ...
Each clip is recorded at a calm pace and sped up 1.4x when encoded.
"""
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

from playwright.sync_api import sync_playwright

from screencast import Screencast
from showcase_browser import BASE, login, new_context, open_route

OUT = Path(sys.argv[1])
CLIPS = sys.argv[2:]
WORK = Path(os.environ["TEMP"]) / "assistall-showcase-frames"
CAST = {}


def mark(label):
    CAST["now"].mark(label)


def into_view(page, locator, settle=650):
    locator.evaluate("e => e.scrollIntoView({behavior: 'smooth', block: 'center'})")
    page.wait_for_timeout(settle)


def glide(page, locator, *, steps=26):
    box = locator.bounding_box()
    if box is None or box["y"] < 70 or box["y"] + box["height"] > page.viewport_size["height"] - 20:
        into_view(page, locator)
        box = locator.bounding_box()
    x, y = box["x"] + min(box["width"] / 2, 120), box["y"] + box["height"] / 2
    page.mouse.move(x, y, steps=steps)
    return x, y


def click(page, locator, *, before=380, after=900):
    glide(page, locator)
    page.wait_for_timeout(before)
    page.mouse.down()
    page.wait_for_timeout(90)
    page.mouse.up()
    page.wait_for_timeout(after)


def type_in(page, locator, text, *, delay=22, after=500):
    click(page, locator, after=200)
    page.keyboard.type(text, delay=delay)
    page.wait_for_timeout(after)


def choose(page, select_selector, value, add_button, *, after=900):
    select = page.locator(select_selector)
    glide(page, select)
    page.wait_for_timeout(350)
    select.select_option(value)
    page.wait_for_timeout(650)
    click(page, page.locator(add_button), after=after)


# ── clips ──────────────────────────────────────────────────────────────────────────
def clip_build(page):
    """Build an overdue-invoice reminder from scratch, try it, turn it on."""
    open_route(page, "automations", 1500)
    yield
    mark("Start a new workflow")
    click(page, page.get_by_role("button", name="New workflow"), after=1100)
    mark("Pick what starts it: an invoice goes overdue")
    click(page, page.locator('label:has(input[name="wfb-trigger"][value="invoice_due"])'), after=1300)
    mark("Choose the details it collects")
    click(page, page.get_by_role("button", name="Next: Collect"), after=1000)
    mark("Write the reminder it will draft")
    click(page, page.get_by_role("button", name="Next: Prepare"), after=800)
    choose(page, "select#wfb-add-prepare", "reply_draft", '[data-action="wfb-add"][data-kind="prepare"]', after=700)
    type_in(page, page.locator("#wfb-prepares-0-subject"), "Payment reminder: {number}", delay=16, after=300)
    type_in(page, page.locator("#wfb-prepares-0-body"),
            "Dear {partner}, invoice {number} for {currency} {amount} was due on {due_on}. "
            "When can we expect payment?", delay=9, after=700)
    mark("Choose who approves")
    click(page, page.get_by_role("button", name="Next: Approve"), after=1100)
    mark("Choose what happens after approval")
    click(page, page.get_by_role("button", name="Next: Do"), after=800)
    choose(page, "select#wfb-add-act", "draft", '[data-action="wfb-add"][data-kind="act"]', after=700)
    choose(page, "select#wfb-add-act", "reminder", '[data-action="wfb-add"][data-kind="act"]', after=700)
    mark("Name it and try it on a real example")
    click(page, page.locator('[data-action="wfb-stage"][data-stage="5"]').first, after=900)
    type_in(page, page.locator("#wfb-name"), "Overdue invoice reminder", delay=20, after=300)
    click(page, page.locator("#wft-reference"), before=200, after=150)
    for field, value in (("reference", "CV-AR-318"), ("number", "INV-2026-318"), ("amount", "61,400.00"),
                         ("currency", "AED"), ("due_on", (date.today() - timedelta(days=64)).isoformat()),
                         ("status", "overdue"), ("partner", "Sandstone Retail")):
        page.locator(f"#wft-{field}").focus()
        page.keyboard.press("Control+A")
        page.keyboard.type(value, delay=10)
        page.wait_for_timeout(120)
    click(page, page.locator('[data-action="wfb-try"]'), after=900)
    trial = page.locator(".wfb-trial")
    if trial.count():
        into_view(page, trial.first, settle=2300)
    mark("Turn it on")
    click(page, page.locator('[data-action="wfb-save"][data-enable="1"]'), after=2200)


def clip_library(page):
    """Pick a ready-made trading workflow from the library, answer its questions, turn it on."""
    open_route(page, "automations", 1500)
    yield
    mark("Open the library")
    click(page, page.locator('#main-content button[data-route="/automations/library"]').first, after=1200)
    mark("Choose your industry")
    select = page.locator("#main-content select").first
    glide(page, select)
    page.wait_for_timeout(350)
    select.select_option(label="Trading")
    page.wait_for_timeout(1300)
    card = page.locator("#main-content article").filter(has_text="Act on a delayed shipment").first
    mark("Pick a ready-made workflow")
    into_view(page, card, settle=1100)
    click(page, card.get_by_role("button", name="Set up"), after=1500)
    mark("Answer a few questions")
    radios = page.locator('label:has(input[data-bind="wfs:rule.kind"][value="any_manager"])')
    if radios.count():
        click(page, radios.first, after=700)
    mark("Check it and turn it on")
    click(page, page.get_by_role("button", name="Next: check it"), after=1800)
    turn_on = page.get_by_role("button", name=re.compile("turn (it )?on", re.I)).first
    into_view(page, turn_on, settle=1200)
    click(page, turn_on, after=2200)


def clip_approve(page):
    """From Home, open a workflow waiting for a decision, read it, approve it."""
    open_route(page, "overview", 1800)
    yield
    mark("Home shows what is waiting for you")
    click(page, page.locator("#main-content").get_by_text("Workflow approvals", exact=True).first, after=1500)
    mark("Open the workflow")
    click(page, page.locator("#main-content").get_by_text("Customs hold reply").first, after=1700)
    row = page.locator("#main-content tr").filter(has_text="Waiting for approval").first
    run = row.locator("a, button").filter(has_text="CVT-5102").first
    mark("See exactly what will happen")
    click(page, run, after=1800)
    approve = page.locator('[data-action="wf-decide"]').filter(has_text="Approve").first
    glide(page, approve)
    page.wait_for_timeout(1200)
    mark("Approve, and Assistall does the rest")
    click(page, approve, after=2600)


def clip_board(page):
    """The company board: approvals waiting on every PC, approved from this one."""
    open_route(page, "automations", 1500)
    yield
    mark("Open the company board")
    click(page, page.locator('#main-content button[data-route="/automations/company"]').first, after=1800)
    mark("See what waits on every PC")
    first = page.locator('[data-action="wf-board-decide"]').filter(has_text="Approve").first
    for text in ("Warehouse PC", "Sales PC"):
        glide(page, page.locator("#main-content").get_by_text(text).first)
        page.wait_for_timeout(1100)
    glide(page, first)
    page.wait_for_timeout(1000)
    mark("Approve it from this PC")
    click(page, first, after=2600)


def clip_reply(page):
    """An email arrives, the reply is already drafted; check it and approve it."""
    open_route(page, "workflows", 1600)
    yield
    mark("A customer's order comes in")
    card = page.locator("#main-content article").filter(has_text="Order for December banquets").first
    click(page, card.get_by_role("button", name="Check reply"), after=1800)
    mark("The email and the prepared reply, side by side")
    click(page, page.get_by_role("button", name="Preview").first, after=2600)
    mark("Approve: the reply goes to Drafts")
    click(page, page.get_by_role("button", name="Approve reply").first, after=1000)
    dialog = page.locator("dialog[open], [role=dialog], [role=alertdialog]").last
    click(page, dialog.locator('input[type="checkbox"]').first, after=700)
    click(page, dialog.get_by_role("button", name="Approve reply"), after=2600)


CLIP_FUNCS = {"build": clip_build, "library": clip_library, "approve": clip_approve, "board": clip_board, "reply": clip_reply}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        token = login(p)
        browser = p.chromium.launch(headless=True)
        for name in CLIPS:
            context = new_context(browser, token, cursor=True)
            page = context.new_page()
            steps = CLIP_FUNCS[name](page)
            next(steps)  # opens the first screen before recording starts
            page.mouse.move(1180, 520)
            cast = Screencast(page, WORK / name)
            CAST["now"] = cast
            cast.start()
            for _ in steps:
                pass
            results.append({"clip": name, **cast.stop(OUT / f"{name}.mp4")})
            page.screenshot(path=str(OUT / f"{name}-end.png"))
            context.close()
        browser.close()
    (OUT / "clips.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
    print(json.dumps(results, indent=1))


if __name__ == "__main__":
    main()
