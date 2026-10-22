"""Shared set-up for website captures of the local showcase app (fictional Cedarvale Trading data).

The mailbox is shown as connected (the throwaway copy has no real mailbox) and the
first-run helpers (setup checklist, guide pop-up) are dismissed, as they would be for a
team that has used Assistall for a while.
"""
import json
from urllib.parse import quote

BASE = "http://127.0.0.1:8791"
USER = {"name": "Layla Haddad", "pin": "2468"}
MAILBOX = "layla@cedarvale.example"


def login(playwright):
    api = playwright.request.new_context(base_url=BASE)
    response = api.post("/api/login", data=USER)
    if not response.ok:
        raise RuntimeError(f"capture login failed: {response.text()}")
    token = response.json()["token"]
    headers = {"X-Desk-Token": token}
    guide = api.get("/api/guide", headers=headers).json()
    api.post("/api/preferences", data={"guided_tour_completed": True, "guide_seen_version": guide.get("version") or ""},
             headers=headers)
    return token


def _connected_mailbox(route):
    response = route.fetch()
    body = response.json()
    if route.request.url.endswith("/api/mailbox/status"):
        body.update({"connection_state": "connected", "mode": "personal_microsoft_365", "account": MAILBOX})
    elif route.request.url.endswith("/api/polling/status"):
        body.update({"active": True, "configured": True, "healthy": True, "last_result": "ok", "last_error": None,
                     "account": MAILBOX, "host": "outlook.office365.com", "auth_method": "microsoft",
                     "last_check_ago_seconds": 42, "readable_error": ""})
    elif isinstance(body, dict):
        body["mailbox_configured"] = True
        body["imap_host"] = "outlook.office365.com"
        body["microsoft_mailbox"] = {"connected": True, "account": MAILBOX}
        body["shipment_watch_dirs"] = "Cedarvale shipment library"
        body["integrations"] = {**(body.get("integrations") or {}), "shipments_ready": True}
    route.fulfill(response=response, body=json.dumps(body), headers={**response.headers, "content-type": "application/json"})


def new_context(browser, token, *, width=1440, height=900, record_dir=None, language="en", cursor=False):
    options = {"viewport": {"width": width, "height": height}, "device_scale_factor": 1}
    if record_dir:
        options.update(record_video_dir=str(record_dir), record_video_size={"width": width, "height": height})
    context = browser.new_context(**options)
    actor = USER["name"]
    context.add_init_script(
        "sessionStorage.setItem('assistall-session', %s);"
        "sessionStorage.setItem(%s, '1');"
        "localStorage.setItem(%s, '1');"
        "localStorage.setItem('assistall-language', %s);"
        % (json.dumps(token), json.dumps("assistall-guide-shown:" + quote(actor)),
           json.dumps("assistall-home-setup-hidden:" + actor), json.dumps(language)))
    context.route("**/api/polling/status", _connected_mailbox)
    context.route("**/api/mailbox/status", _connected_mailbox)
    context.route("**/api/settings", lambda route: _connected_mailbox(route) if route.request.method == "GET" else route.continue_())
    add_capture_extras(context, cursor=cursor)
    return context


def open_route(page, route, settle_ms=1500):
    page.goto(f"{BASE}/ui/#/{route.lstrip('/')}", wait_until="load")
    page.locator("#main-content h1").first.wait_for(state="visible", timeout=90000)
    page.wait_for_timeout(settle_ms)


def _company_name(route):
    response = route.fetch()
    text = response.text().replace("Fake Trading LLC", "Cedarvale Trading LLC")
    route.fulfill(response=response, body=text)


CURSOR_SCRIPT = """
(() => {
  const install = () => {
    if (document.getElementById('capture-cursor')) return;
    const style = document.createElement('style');
    style.textContent = `#capture-cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
      background:rgba(20,59,61,.28);border:2px solid rgba(255,255,255,.95);box-shadow:0 1px 6px rgba(0,0,0,.35);
      pointer-events:none;z-index:2147483647;transition:transform .12s ease-out;}
      #capture-cursor.is-down{transform:scale(.72);background:rgba(196,154,82,.55);}`;
    document.documentElement.appendChild(style);
    const dot = document.createElement('div');
    dot.id = 'capture-cursor';
    const saved = JSON.parse(sessionStorage.getItem('capture-cursor') || '[720,450]');
    dot.style.translate = saved[0] + 'px ' + saved[1] + 'px';
    document.documentElement.appendChild(dot);
    addEventListener('mousemove', (e) => { dot.style.translate = e.clientX + 'px ' + e.clientY + 'px';
      sessionStorage.setItem('capture-cursor', JSON.stringify([e.clientX, e.clientY])); }, true);
    addEventListener('mousedown', () => dot.classList.add('is-down'), true);
    addEventListener('mouseup', () => dot.classList.remove('is-down'), true);
  };
  if (document.documentElement) install(); else addEventListener('DOMContentLoaded', install);
})();
"""


def add_capture_extras(context, *, cursor=False):
    context.route("**/api/erp/**", _company_name)
    if cursor:
        context.add_init_script(CURSOR_SCRIPT)


def glide_click(page, locator, *, pause_before=450, pause_after=900, steps=28):
    """Move the visible pointer smoothly to the element, then click it."""
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y, steps=steps)
    page.wait_for_timeout(pause_before)
    page.mouse.down()
    page.wait_for_timeout(90)
    page.mouse.up()
    page.wait_for_timeout(pause_after)
