"""Fill a throwaway Assistall data folder with one fictional company for website captures.

Cedarvale Trading LLC is made up: a Dubai trading and logistics business with clients,
suppliers, emails waiting for replies, contracts, shipments, reports, requests, bookings,
records and workflows. Run it with the app source on sys.path and the same environment the
capture server uses (DATA folder, database paths). It refuses any folder that is not a
system-temporary assistall-capture-* folder, so it can never touch real data.
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import sys
import tempfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

DATA = Path(os.environ["WADIH_AI_DATA_DIR"]).resolve()
if DATA.parent != Path(tempfile.gettempdir()).resolve() or not DATA.name.startswith("assistall-capture-"):
    raise SystemExit("seed_showcase_company: the data folder must be a temporary assistall-capture-* folder")

from fpdf import FPDF  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

import booking_scheduling  # noqa: E402
import contracts_renewals  # noqa: E402
import report_reader  # noqa: E402
import service_desk  # noqa: E402
import shipment_tracker  # noqa: E402
import workflows  # noqa: E402
from abilities import expiry  # noqa: E402

TODAY = date.today()
ME = "Layla Haddad"
COMPANY = "Cedarvale Trading LLC"
TEAM = (("Omar Saleh", "MANAGER"), ("Daniel Brooks", "MANAGER"), ("Priya Nair", "STAFF"), ("Mariam Khoury", "STAFF"))
SOURCES = DATA / "source-documents"


def day(offset: int) -> str:
    return (TODAY + timedelta(days=offset)).isoformat()


def stamp(days: int = 0, hours: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days, hours=hours)).isoformat()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(os.environ["SENTINEL_DB"])
    conn.row_factory = sqlite3.Row
    return conn


# ── source documents (PDF and image previews the viewers open) ───────────────────────
def write_pdf(path: Path, title: str, subtitle: str, sections: list[tuple[str, str]]) -> Path:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.set_fill_color(13, 61, 63)
    pdf.rect(0, 0, 210, 33, style="F")
    pdf.set_text_color(247, 242, 233)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_xy(18, 11)
    pdf.cell(0, 5, COMPANY.upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 19)
    pdf.set_x(18)
    pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(19, 58, 60)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(18, 41)
    pdf.multi_cell(174, 6, subtitle)
    for heading, body in sections:
        pdf.ln(4)
        pdf.set_fill_color(239, 232, 217)
        pdf.set_text_color(19, 58, 60)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(174, 8, heading.upper(), fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(38, 48, 49)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(174, 6, body)
    pdf.set_y(-16)
    pdf.set_text_color(92, 102, 102)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 5, "Fictional record made for product demonstration.", align="C")
    pdf.output(str(path))
    return path


def write_card(path: Path, title: str, subtitle: str, rows: list[tuple[str, str]]) -> Path:
    image = Image.new("RGB", (1500, 900), (247, 242, 233))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1500, 180), fill=(14, 58, 61))
    draw.text((92, 54), title.upper(), fill=(247, 242, 233), font_size=42)
    draw.text((92, 212), subtitle, fill=(37, 79, 80), font_size=28)
    for index, (label, value) in enumerate(rows):
        y = 302 + index * 142
        draw.rounded_rectangle((92, y, 1408, y + 108), radius=14, fill=(239, 232, 217))
        draw.text((124, y + 18), label.upper(), fill=(14, 58, 61), font_size=24)
        draw.text((124, y + 55), value, fill=(38, 48, 49), font_size=28)
    draw.text((92, 824), "Fictional record made for product demonstration", fill=(92, 102, 102), font_size=20)
    image.save(path)
    return path


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ── people ──────────────────────────────────────────────────────────────────────────
def seed_people(conn: sqlite3.Connection) -> None:
    import approval_desk
    for name, role in TEAM:
        conn.execute("INSERT OR REPLACE INTO pins (person,pin_hash,updated_at) VALUES (?,?,?)",
                     (name, approval_desk._hash_pin("1357"), stamp()))
        conn.execute("INSERT INTO consent (mailbox,granted_by,role,scopes,granted_at,revoked_at) VALUES (?,?,?,?,?,NULL)",
                     ("pilot@local", name, role, json.dumps(["read", "classify", "draft"]), stamp(-30)))


# ── clients and suppliers ───────────────────────────────────────────────────────────
CUSTOMERS = (
    ("Orchid Hospitality Group", "Hana Rahimi", "purchasing@orchid-hospitality.example", "+971 4 555 0142"),
    ("Brightwater Foods", "Tom Ellison", "tom.ellison@brightwaterfoods.example", "+971 4 555 0188"),
    ("Palm Crescent Hotels", "Sara Qureshi", "s.qureshi@palmcrescent.example", "+971 4 555 0117"),
    ("Sandstone Retail", "Yusuf Amari", "accounts@sandstoneretail.example", "+971 6 555 0163"),
    ("Gulfway Catering", "Lina Haddad", "orders@gulfwaycatering.example", "+971 2 555 0129"),
)
SUPPLIERS = (
    ("Kestrel Packaging FZE", "Ravi Menon", "ravi.menon@kestrelpack.example", "+971 4 555 0231"),
    ("Azure Bay Ceramics", "Elena Petrova", "sales@azurebayceramics.example", "+90 212 555 0174"),
    ("Northwind Glassworks", "Chen Wei", "export@northwindglass.example", "+86 21 5550 1190"),
    ("Bluewater Freight", "Ahmed Fares", "ops@bluewaterfreight.example", "+971 4 555 0255"),
    ("Falconline Customs Brokers", "Noor Al Zaabi", "clearance@falconline.example", "+971 4 555 0277"),
)


def seed_contacts(conn: sqlite3.Connection) -> dict[str, int]:
    ids: dict[str, int] = {}
    for kind, rows in (("CUSTOMER", CUSTOMERS), ("VENDOR", SUPPLIERS)):
        for company, person, email, phone in rows:
            cur = conn.execute(
                "INSERT INTO business_contacts (kind,name,company,email,phone,status,notes,source,external_id,updated_at,updated_by)"
                " VALUES (?,?,?,?,?,'ACTIVE',?,'LOCAL',?,?,?)",
                (kind, person, company, email, phone, "", f"cv-{len(ids) + 1}", stamp(-20), ME))
            ids[company] = int(cur.lastrowid)
    return ids


# ── emails with prepared replies ────────────────────────────────────────────────────
EMAILS = (
    ("ORDER", "Hana Rahimi", "purchasing@orchid-hospitality.example",
     "Order for December banquets: 1,200 dinner plates",
     "Hi Layla,\n\nPlease confirm 1,200 Aria dinner plates and 1,200 side plates for delivery by 4 December to our Business Bay kitchen. PO OHG-7781 is attached.\n\nThanks,\nHana",
     "Orchid Hospitality orders 1,200 dinner plates and 1,200 side plates for 4 December delivery (PO OHG-7781).",
     "Dear Hana,\n\nThank you for PO OHG-7781. We confirm 1,200 Aria dinner plates and 1,200 side plates. Stock is reserved and delivery to your Business Bay kitchen is booked for 3 December, a day ahead of your banquets.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", -1),
    ("QUOTATION", "Tom Ellison", "tom.ellison@brightwaterfoods.example",
     "Quote request: 40,000 recyclable food containers",
     "Hello,\n\nCould you quote 40,000 recyclable 750 ml food containers with lids, delivered monthly from January? We need prices by Friday.\n\nTom",
     "Brightwater Foods asks for a quote on 40,000 recyclable 750 ml containers a month from January, by Friday.",
     "Dear Tom,\n\nThank you for your request. Our quote for 40,000 recyclable 750 ml containers with lids, delivered monthly from January, is attached: AED 0.62 per unit, with lead time of 10 working days.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", -2),
    ("COMPLAINT", "Sara Qureshi", "s.qureshi@palmcrescent.example",
     "Damaged glassware in delivery DN-5521",
     "Dear Cedarvale team,\n\nTwo cartons of highball glasses in DN-5521 arrived broken. Photos attached. Please advise on replacements.\n\nSara",
     "Palm Crescent Hotels reports two broken cartons of highball glasses in delivery DN-5521.",
     "Dear Sara,\n\nWe are sorry the highball glasses arrived damaged. We will send two replacement cartons on our next run on Thursday at no charge, and our driver will collect the broken stock.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", -1),
    ("PAYMENT", "Ravi Menon", "ravi.menon@kestrelpack.example",
     "Updated bank details for invoice KP-2291",
     "Dear Accounts,\n\nPlease note our new bank details for invoice KP-2291 (AED 64,250).\n\nRegards,\nRavi",
     "Kestrel Packaging says its bank details changed for invoice KP-2291 (AED 64,250). Check by phone before paying.",
     "Dear Ravi,\n\nThank you for letting us know. Before we change any payment details we will call you on the number we hold on file to confirm them. Invoice KP-2291 stays on hold until then.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", 0),
    ("INVOICE", "Yusuf Amari", "accounts@sandstoneretail.example",
     "Query on invoice INV-2026-342",
     "Hi,\n\nInvoice INV-2026-342 shows 260 units of serving trays but we received 240. Can you check?\n\nYusuf",
     "Sandstone Retail says invoice INV-2026-342 bills 260 serving trays but 240 arrived.",
     "Dear Yusuf,\n\nThank you for checking. Our delivery note confirms 240 trays, so we will send a corrected invoice for 240 units today and cancel INV-2026-342.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", 0),
    ("ORDER", "Lina Haddad", "orders@gulfwaycatering.example",
     "Weekly order: takeaway boxes and cutlery",
     "Hi team,\n\nOur weekly order: 6,000 kraft takeaway boxes and 4,000 cutlery packs, delivered Sunday.\n\nLina",
     "Gulfway Catering places its weekly order: 6,000 kraft boxes and 4,000 cutlery packs for Sunday.",
     "Dear Lina,\n\nThank you for your weekly order of 6,000 kraft takeaway boxes and 4,000 cutlery packs. Everything is in stock and booked for Sunday morning delivery.\n\nKind regards,\nLayla Haddad\nCedarvale Trading LLC", 0),
)


def seed_emails(conn: sqlite3.Connection) -> None:
    for index, (intent, name, addr, subject, body, summary, draft, days) in enumerate(EMAILS):
        msg_hash = hashlib.sha256(f"cedarvale-mail-{index}".encode()).hexdigest()
        received = stamp(days, hours=-(index * 2 + 1))
        conn.execute(
            "INSERT INTO messages (msg_hash,uid,from_addr,subject,received_at,language,verdict,threat_notes,intent,summary,"
            "body,from_name,saved_attachments,processed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (msg_hash, str(1000 + index), addr, subject, received, "en", "PASS", "[]", intent, summary, body, name, "[]", received))
        conn.execute("INSERT OR IGNORE INTO senders (address,domain,status,first_seen) VALUES (?,?,?,?)",
                     (addr, addr.split("@")[1], "TRUSTED", stamp(-60)))
        role = "SUPER_APPROVER" if intent in {"PAYMENT", "CONTRACT"} else "MANAGER"
        conn.execute("INSERT INTO drafts (msg_hash,to_addr,subject,body,required_role,created_at,mailbox) VALUES (?,?,?,?,?,?,?)",
                     (msg_hash, addr, "Re: " + subject, draft, role, received, "layla@cedarvale.example"))


# ── contracts ───────────────────────────────────────────────────────────────────────
def seed_contracts(conn: sqlite3.Connection) -> None:
    contracts_renewals.ensure_schema(conn)
    rows = (
        ("Kestrel Packaging Supply Agreement", "CV-SUP-2025-014", "SUPPLY", "Kestrel Packaging FZE", "Omar Saleh", "REVIEW_DUE",
         day(-330), day(38), day(8), "MANUAL", "30", "412000",
         "Proposed renewal moves payment from Net 30 to Net 45 and adds a 3% price rise. Review before the supplier call."),
        ("Orchid Hospitality Framework Agreement", "CV-CUS-2026-002", "CUSTOMER", "Orchid Hospitality Group", ME, "ACTIVE",
         day(-215), day(150), day(90), "AUTO", "60", "865000", "Annual tableware and glassware supply for 14 hotel kitchens."),
        ("Al Quoz Warehouse Lease", "CV-LSE-2024-003", "LEASE", "Sandhills Property Management", ME, "ACTIVE",
         day(-660), day(70), day(10), "MANUAL", "60", "296000", "Unit 7, 2,400 m2. Notice must be given in writing."),
        ("Bluewater Freight Service Agreement", "CV-SVC-2025-021", "SERVICE", "Bluewater Freight", "Omar Saleh", "REVIEW_DUE",
         day(-340), day(25), day(-5), "MANUAL", "30", "184500", "Sea freight Jebel Ali to Riyadh, Dammam and Muscat."),
        ("Office Cleaning Services", "CV-SVC-2026-007", "SERVICE", "Sparkle Facility Services", "Priya Nair", "ACTIVE",
         day(-120), day(245), day(215), "AUTO", "30", "38400", "Daily office cleaning, Business Bay office."),
    )
    original = write_pdf(SOURCES / "Kestrel Supply Agreement - signed 2025.pdf", "Supply Agreement",
                         "Kestrel Packaging FZE and Cedarvale Trading LLC | Signed 2025",
                         [("Commercial terms", "Annual value AED 412,000. Payment terms: Net 30 days from invoice date."),
                          ("Pricing", "Prices fixed for 12 months from the start date."),
                          ("Renewal", "Either party gives 30 days' written notice before the renewal date.")])
    revised = write_pdf(SOURCES / "Kestrel Supply Agreement - proposed renewal.pdf", "Supply Agreement",
                        "Kestrel Packaging FZE and Cedarvale Trading LLC | Proposed renewal terms",
                        [("Commercial terms", "Annual value AED 424,360. Payment terms: Net 45 days from invoice date."),
                         ("Pricing", "Prices rise 3% from the renewal date, then fixed for 12 months."),
                         ("Renewal", "Either party gives 30 days' written notice before the renewal date.")])
    for title, number, kind, party, owner, status, start, end, notice, renewal, days, value, notes in rows:
        contract = contracts_renewals.create_contract(conn, {
            "title": title, "contract_number": number, "contract_type": kind, "counterparty": party, "owner": owner,
            "status": status, "effective_date": start, "expiry_date": end, "notice_date": notice,
            "renewal_type": renewal, "notice_days": days, "value_amount": value, "currency": "AED", "notes": notes}, ME)
        if number == "CV-SUP-2025-014":
            cid = int(contract["id"])
            contracts_renewals.add_version(conn, cid, str(original), "Signed agreement (2025)", ME)
            contracts_renewals.add_version(conn, cid, str(revised), "Proposed renewal terms", ME)
            versions = [r[0] for r in conn.execute("SELECT id FROM contract_versions WHERE contract_id=? ORDER BY id", (cid,))]
            contracts_renewals.compare_versions(conn, cid, versions[0], versions[1], ME)


# ── shipments ───────────────────────────────────────────────────────────────────────
def seed_shipments(conn: sqlite3.Connection) -> None:
    conn.executescript(shipment_tracker.SCHEMA)
    now = shipment_tracker._now()
    rows = (
        ("CVT-5102", ["MSKU 4471902"], "BL-BW-5102", "Bluewater Freight", "Jebel Ali", "Riyadh", day(-9), day(-1), "CUSTOMS",
         "Customs asked for the certificate of origin", "Orchid Hospitality Group", "Azure Bay Ceramics", "PO-8812", "INV-2026-377", "16.2 tonnes", 1),
        ("CVT-5107", ["TGHU 8820417"], "BL-BW-5107", "Bluewater Freight", "Shanghai", "Jebel Ali", day(-18), day(4), "DELAYED",
         "ETA moved from " + day(1) + " to " + day(4), "Palm Crescent Hotels", "Northwind Glassworks", "PO-8820", "", "11.8 tonnes", 1),
        ("CVT-5098", ["CMAU 2290318"], "BL-SL-5098", "Sealine Shipping", "Izmir", "Jebel Ali", day(-14), day(3), "IN TRANSIT",
         "Passed Suez Canal", "Sandstone Retail", "Azure Bay Ceramics", "PO-8797", "", "14.4 tonnes", 0),
        ("CVT-5104", ["MSKU 5530126"], "BL-BW-5104", "Bluewater Freight", "Jebel Ali", "Dammam", day(-3), day(2), "AT PORT",
         "Waiting for berth", "Brightwater Foods", "Kestrel Packaging FZE", "PO-8805", "INV-2026-381", "9.6 tonnes", 0),
        ("CVT-5111", ["To be assigned"], "", "Sealine Shipping", "Jebel Ali", "Muscat", day(5), day(9), "BOOKED",
         "Booking confirmed", "Gulfway Catering", "Kestrel Packaging FZE", "PO-8831", "", "7.1 tonnes", 0),
        ("CVT-5089", ["TGHU 6612044"], "BL-SL-5089", "Sealine Shipping", "Jebel Ali", "Riyadh", day(-20), day(-11), "DELIVERED",
         "Delivered and signed for", "Orchid Hospitality Group", "Azure Bay Ceramics", "PO-8769", "INV-2026-351", "15.0 tonnes", 0),
    )
    for ref, boxes, bl, carrier, origin, dest, etd, eta, status, milestone, customer, vendor, po, inv, weight, attention in rows:
        conn.execute(
            "INSERT INTO shipments (reference, container_numbers, bl_number, booking_number, vessel, voyage, carrier, origin,"
            " destination, etd, eta, status, milestone, customer, vendor, po_number, invoice_number, weight, attention,"
            " first_seen_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (ref, json.dumps(boxes), bl, "BK-" + ref, "MV Coral Meridian", "CM-" + ref[-3:], carrier, origin, dest, etd, eta,
             status, milestone, customer, vendor, po, inv, weight, attention, now, now))
    bill = write_pdf(SOURCES / "Bill of Lading CVT-5102.pdf", "Bill of Lading",
                     "Reference BL-BW-5102 | Bluewater Freight | MV Coral Meridian",
                     [("Route", "Jebel Ali, United Arab Emirates to Riyadh, Saudi Arabia."),
                      ("Cargo", "16.2 tonnes of ceramic tableware in container MSKU 4471902."),
                      ("Customs", "Saudi customs asked for the certificate of origin before release.")])
    packing = write_pdf(SOURCES / "Packing List CVT-5102.pdf", "Packing List",
                        "PO-8812 | Invoice INV-2026-377 | Azure Bay Ceramics",
                        [("Contents", "380 cartons: dinner plates, side plates and bowls."),
                         ("Handling", "Fragile. Keep upright. Check the seal before unloading.")])
    customs = write_card(SOURCES / "Customs Notice CVT-5102.png", "Customs notice",
                         "Container MSKU 4471902 | Held at Riyadh dry port",
                         [("What is missing", "Certificate of origin for invoice INV-2026-377."),
                          ("Deadline", "Send within 2 working days to avoid storage charges."),
                          ("Who to send it to", "Falconline Customs Brokers, clearance team.")])
    for path in (bill, packing, customs):
        stat = path.stat()
        conn.execute(
            "INSERT INTO shipment_sources (path, file_name, extension, size_bytes, mtime_ns, sha256, parse_status, parse_error,"
            " parsed_at, parser_version, missing) VALUES (?,?,?,?,?,?,'parsed','',?,?,0)",
            (str(path), path.name, path.suffix.lower(), stat.st_size, stat.st_mtime_ns, sha(path), now, shipment_tracker.PARSER_VERSION))
        conn.execute("INSERT INTO shipment_source_links(path, shipment_ref) VALUES (?, ?)", (str(path), "CVT-5102"))
    conn.execute("INSERT INTO shipment_events (shipment_ref, event_type, field_name, old_value, new_value, source_path, created_at)"
                 " VALUES (?,?,?,?,?,?,?)", ("CVT-5102", "STATUS_CHANGED", "status", "IN TRANSIT", "CUSTOMS", str(customs), now))
    conn.execute("INSERT INTO shipment_events (shipment_ref, event_type, field_name, old_value, new_value, source_path, created_at)"
                 " VALUES (?,?,?,?,?,?,?)", ("CVT-5107", "ETA_CHANGED", "eta", day(1), day(4), "", now))


# ── reports ─────────────────────────────────────────────────────────────────────────
def seed_reports(conn: sqlite3.Connection) -> None:
    report_reader.ensure_schema(conn)
    now = shipment_tracker._now()
    rows = (
        ("Daily Sales Report.png", 142380.0, [("Tableware", 58200), ("Food packaging", 47650), ("Glassware", 36530)], ["TOTAL_UP_9%"],
         "Sales today are AED 142,380, 9% above the 7-day average. Food packaging is growing fastest. Reorder kraft boxes before Sunday.",
         [("Total sales", "AED 142,380, 9% above the 7-day average."),
          ("Top categories", "Tableware AED 58,200; food packaging AED 47,650; glassware AED 36,530."),
          ("To check", "Kraft takeaway boxes fall below reorder level on Sunday.")]),
        ("Aged Receivables.png", 386200.0, [("Sandstone Retail", 61400), ("Palm Crescent Hotels", 44800), ("Gulfway Catering", 18900)],
         ["OVERDUE_61400"],
         "AED 386,200 is owed to us. AED 61,400 from Sandstone Retail is more than 60 days overdue. Send a reminder this week.",
         [("Owed to us", "AED 386,200 across 23 open invoices."),
          ("Overdue", "Sandstone Retail AED 61,400 (over 60 days); Palm Crescent Hotels AED 44,800 (over 30 days)."),
          ("To do", "Send payment reminders this week.")]),
        ("Weekly Stock Report.png", 1284000.0, [("Ceramic tableware", 512000), ("Glassware", 398000), ("Packaging", 374000)],
         ["LOW_STOCK_3"],
         "Stock is valued at AED 1.28 million. Three lines are below reorder level: kraft boxes, 750 ml containers and highball glasses.",
         [("Stock value", "AED 1,284,000 across 412 product lines."),
          ("Below reorder level", "Kraft takeaway boxes, 750 ml containers, highball glasses."),
          ("Suggested", "Raise purchase orders with Kestrel Packaging and Northwind Glassworks.")]),
    )
    for index, (name, total, items, flags, summary, card_rows) in enumerate(rows):
        path = write_card(SOURCES / name, name.rsplit(".", 1)[0], f"{COMPANY} | {TODAY:%d %B %Y}", card_rows)
        conn.execute(
            "INSERT INTO reports (msg_hash, from_addr, filename, kind, row_count, total_value, currency, top_items, flags,"
            " summary_en, summary_ar, source_path, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (f"cedarvale-report-{index}", "finance@cedarvale.example", name, "image", 12 + index * 9, total, "AED",
             json.dumps([{"item": i, "value": v} for i, v in items]), json.dumps(flags), summary, "", str(path), now))


# ── service requests ────────────────────────────────────────────────────────────────
def seed_requests(conn: sqlite3.Connection, contacts: dict[str, int]) -> None:
    rows = (
        ("Replace two cartons of broken highball glasses", "Delivery DN-5521 arrived with two broken cartons.", "COMPLAINT", "HIGH",
         "IN_PROGRESS", "Mariam Khoury", "Palm Crescent Hotels", "EMAIL", 1),
        ("Corrected invoice for 240 serving trays", "INV-2026-342 billed 260 trays; 240 delivered.", "BILLING", "NORMAL",
         "NEW", "Priya Nair", "Sandstone Retail", "EMAIL", 0),
        ("Samples of the new Aria plate range", "Hana asks for 6 samples before the spring menu tasting.", "SALES", "NORMAL",
         "WAITING_INTERNAL", "Daniel Brooks", "Orchid Hospitality Group", "WHATSAPP", 3),
        ("Change delivery day to Saturday", "Gulfway Catering wants Saturday deliveries from next month.", "DELIVERY", "LOW",
         "NEW", "Omar Saleh", "Gulfway Catering", "EMAIL", 6),
        ("Certificate of origin for CVT-5102", "Customs in Riyadh needs it within 2 working days.", "LOGISTICS", "URGENT",
         "IN_PROGRESS", "Omar Saleh", "Orchid Hospitality Group", "EMAIL", 1),
        ("Monthly container quote for 2027", "Brightwater Foods wants a 12-month price.", "SALES", "HIGH",
         "WAITING_CUSTOMER", "Daniel Brooks", "Brightwater Foods", "EMAIL", 2),
    )
    for title, description, category, priority, status, owner, company, source, due in rows:
        service_desk.create_request(conn, {
            "title": title, "description": description, "category": category, "priority": priority, "status": status,
            "owner": owner, "contact_id": contacts.get(company), "source_type": source, "due_date": day(due)}, ME)


# ── booking ─────────────────────────────────────────────────────────────────────────
def seed_booking(conn: sqlite3.Connection, contacts: dict[str, int]) -> None:
    services = {}
    for name, minutes, mode, place in (("Showroom visit", 45, "IN_PERSON", "Cedarvale showroom, Al Quoz"),
                                       ("Supplier call", 30, "VIDEO", "Video call"),
                                       ("Delivery planning", 60, "IN_PERSON", "Warehouse office")):
        services[name] = booking_scheduling.create_service(conn, {"name": name, "duration_minutes": minutes,
                                                                  "default_mode": mode, "default_location": place}, ME)["id"]
    for person in (ME, "Daniel Brooks", "Omar Saleh"):
        for weekday in range(0, 5):
            booking_scheduling.create_availability(conn, {"owner": person, "weekday": weekday, "start_time": "08:30",
                                                          "end_time": "17:30"}, ME)
    rows = (
        (0, "09:30", "Showroom visit", "Aria range walk-through", "Orchid Hospitality Group", ME, "CONFIRMED"),
        (0, "14:00", "Supplier call", "Renewal terms call", "Kestrel Packaging FZE", "Omar Saleh", "CONFIRMED"),
        (1, "10:00", "Delivery planning", "December banquet deliveries", "Orchid Hospitality Group", "Omar Saleh", "CONFIRMED"),
        (1, "15:30", "Showroom visit", "Glassware samples", "Palm Crescent Hotels", "Daniel Brooks", "CONFIRMED"),
        (4, "11:00", "Supplier call", "2027 container pricing", "Brightwater Foods", "Daniel Brooks", "CONFIRMED"),
        (5, "09:00", "Delivery planning", "Weekly route plan", "Gulfway Catering", "Omar Saleh", "CONFIRMED"),
        (5, "13:30", "Showroom visit", "New store fit-out", "Sandstone Retail", ME, "REQUESTED"),
        (6, "10:30", "Supplier call", "Q1 production slots", "Azure Bay Ceramics", ME, "CONFIRMED"),
        (7, "09:30", "Showroom visit", "Spring menu tasting set", "Orchid Hospitality Group", "Daniel Brooks", "REQUESTED"),
        (8, "14:00", "Supplier call", "Glass breakage follow-up", "Northwind Glassworks", "Omar Saleh", "CONFIRMED"),
    )
    for offset, start, service, title, company, owner, status in rows:
        when = datetime.combine(TODAY + timedelta(days=offset), datetime.strptime(start, "%H:%M").time())
        booking_scheduling.create_appointment(conn, {"service_id": services[service], "title": f"{title} - {company}",
                                                     "contact_id": contacts.get(company), "owner": owner, "status": status,
                                                     "start_at": when.strftime("%Y-%m-%dT%H:%M")}, ME)


# ── records: expiry register ────────────────────────────────────────────────────────
def seed_records(conn: sqlite3.Connection) -> None:
    for item_type, holder, expires, reference, notes in (
        ("trade_licence", COMPANY, day(41), "DED-884215", "Renew with the Department of Economy and Tourism."),
        ("permit", "Warehouse fire safety, Al Quoz Unit 7", day(19), "CD-55210", "Book the inspection 2 weeks ahead."),
        ("permit", "Vehicle registration, truck D 48213", day(12), "RTA-48213", "Insurance renewal needed first."),
        ("insurance", "Goods-in-transit cover", day(66), "POL-GIT-2291", "Ask for 3 quotes."),
        ("visa", "Omar Saleh", day(54), "RES-2291-OS", "Start renewal 30 days before."),
        ("professional_certificate", "ISO 9001, Cedarvale Trading", day(180), "ISO-9001-7731", "Surveillance audit due in spring."),
    ):
        expiry.add(conn, {"item_type": item_type, "holder": holder, "expires_on": expires, "reference": reference,
                          "owner": ME, "notes": notes}, actor=ME)


# ── workflows ───────────────────────────────────────────────────────────────────────
WORKFLOWS = (
    {
        "id": "wf_cv_customs_hold_v1", "name": "Customs hold reply", "origin": "standard", "version": "1.0.0",
        "purpose": "When customs holds a shipment, gather the details, draft a reply to the broker and ask a manager to approve it.",
        "trigger": {"kind": "new_email", "conditions": [{"field": "subject", "op": "contains", "setting": "keyword"}]},
        "steps": [
            {"id": "gather", "kind": "gather", "label": "Gather the shipment details",
             "params": {"fields": ["subject", "from_addr", "from_name", "reference"]}},
            {"id": "draft", "kind": "prepare", "handler": "reply_draft", "label": "Draft a reply to the broker",
             "params": {"subject": "Re: {subject}",
                        "body": "Dear {from_name},\n\nThank you. We are sending the certificate of origin for {reference} and will confirm within {setting.reply_days} working days.\n\nKind regards,\nCedarvale Trading LLC"}},
            {"id": "approve", "kind": "checkpoint", "label": "A manager approves the reply"},
            {"id": "place", "kind": "act", "action": "draft", "label": "Put the reply in Drafts"},
            {"id": "remind", "kind": "act", "action": "reminder", "label": "Remind us to check for an answer",
             "params": {"recipient": "{from_addr}", "subject": "{subject}", "days": "{setting.reply_days}"}},
        ],
        "settings_schema": {"keyword": {"type": "text", "label": "Subject contains", "max_length": 40},
                            "reply_days": {"type": "integer", "label": "Promise a reply within", "min": 1, "max": 10, "unit": "days"}},
        "settings": {"keyword": "customs", "reply_days": 2},
        "approver_rule": {"kind": "any_manager"}, "remote_approval": True,
        "summary_fields": [{"key": "counterparty", "label": "Broker", "value": "{from_name}"},
                           {"key": "reference", "label": "Shipment", "value": "{reference}"},
                           {"key": "reason", "label": "Reason", "value": "Customs hold"}],
    },
    {
        "id": "wf_cv_large_order_v1", "name": "Large order sign-off", "origin": "standard", "version": "1.0.0",
        "purpose": "When an order is above the limit, two people approve it before stock is reserved and accounts are told.",
        "trigger": {"kind": "manual", "conditions": []},
        "steps": [
            {"id": "gather", "kind": "gather", "label": "Gather the order",
             "params": {"fields": ["customer", "amount", "currency", "reference"], "required": ["amount"]}},
            {"id": "approve", "kind": "checkpoint", "label": "Two people approve the order"},
            {"id": "flag", "kind": "act", "action": "flag", "label": "Flag it for the accounts team",
             "params": {"assignee": "{setting.accounts_person}", "text": "Order approved: {customer} {currency} {amount}"}},
            {"id": "tell", "kind": "notify", "label": "Tell the sales team", "params": {"to": "approvers", "text": "Order for {customer} approved"}},
        ],
        "settings_schema": {"limit": {"type": "number", "label": "Orders above", "min": 1000, "max": 1000000, "unit": "AED"},
                            "accounts_person": {"type": "person", "label": "Accounts contact"}},
        "settings": {"limit": 50000, "accounts_person": "Priya Nair"},
        "approver_rule": {"kind": "two_people"}, "remote_approval": True,
        "summary_fields": [{"key": "counterparty", "label": "Customer", "value": "{customer}"},
                           {"key": "amount", "label": "Amount", "value": "{currency} {amount}"},
                           {"key": "reason", "label": "Reason", "value": "Above order limit"}],
    },
    {
        "id": "wf_cv_contract_renewal_v1", "name": "Contract renewal reminder", "origin": "standard", "version": "1.0.0",
        "purpose": "When a contract is close to renewal, ask the owner to confirm a reminder for the renewal call.",
        "trigger": {"kind": "deadline_approaching", "conditions": [{"field": "kind", "op": "eq", "value": "Contract"}]},
        "steps": [
            {"id": "gather", "kind": "gather", "label": "Gather the contract dates", "params": {"fields": ["reference", "due_on", "detail"]}},
            {"id": "approve", "kind": "checkpoint", "label": "The contract owner confirms"},
            {"id": "remind", "kind": "act", "action": "reminder", "label": "Set a reminder for the renewal call",
             "params": {"recipient": "{reference}", "subject": "Renewal: {reference}", "days": "{setting.days_before}"}},
        ],
        "settings_schema": {"days_before": {"type": "integer", "label": "Remind me", "min": 1, "max": 60, "unit": "days"}},
        "settings": {"days_before": 14},
        "approver_rule": {"kind": "staff"}, "remote_approval": False,
        "summary_fields": [{"key": "reference", "label": "Contract", "value": "{reference}"},
                           {"key": "due", "label": "Renews", "value": "{due_on}"}],
    },
)


def seed_workflows() -> None:
    for definition in WORKFLOWS:
        workflows.install(workflows.validate_definition(definition), actor=ME)
        workflows.update_workflow(definition["id"], {"enabled": True}, actor=ME)
    workflows.start_run("wf_cv_customs_hold_v1", {"type": "new_email", "event_key": "cv:email:5102",
                                               "subject": "Customs hold on CVT-5102: certificate of origin needed",
                                               "from_addr": "clearance@falconline.example",
                                               "from_name": "Noor Al Zaabi", "reference": "CVT-5102"})
    workflows.start_manual("wf_cv_large_order_v1", {"customer": "Orchid Hospitality Group", "amount": "86,400", "currency": "AED",
                                                 "reference": "PO OHG-7781"}, actor="Daniel Brooks")
    workflows.start_manual("wf_cv_large_order_v1", {"customer": "Brightwater Foods", "amount": "297,600", "currency": "AED",
                                                 "reference": "Q-2027-014"}, actor="Daniel Brooks")
    workflows.start_run("wf_cv_contract_renewal_v1", {"type": "deadline_approaching", "event_key": "cv:deadline:kestrel",
                                                   "kind": "Contract", "reference": "Kestrel Packaging Supply Agreement",
                                                   "due_on": day(38), "detail": "Payment terms change from Net 30 to Net 45"})


def main() -> None:
    if sys.argv[1:] == ["workflows"]:
        seed_workflows()
        return
    if sys.argv[1:] == ["fresh-run"]:
        import time
        workflows.start_run("wf_cv_customs_hold_v1", {"type": "new_email", "event_key": f"cv:email:5102:{time.time()}",
                                                      "subject": "Customs hold on CVT-5102: certificate of origin needed",
                                                      "from_addr": "clearance@falconline.example",
                                                      "from_name": "Noor Al Zaabi", "reference": "CVT-5102"})
        return
    if sys.argv[1:] == ["rebook"]:
        conn = db()
        conn.execute("DELETE FROM booking_appointments")
        conn.execute("DELETE FROM booking_availability")
        conn.execute("DELETE FROM booking_services")
        seed_booking(conn, {r["company"]: r["id"] for r in conn.execute("SELECT id, company FROM business_contacts")})
        conn.commit()
        conn.close()
        return
    SOURCES.mkdir(parents=True, exist_ok=True)
    conn = db()
    try:
        seed_people(conn)
        contacts = seed_contacts(conn)
        seed_emails(conn)
        seed_contracts(conn)
        seed_shipments(conn)
        seed_reports(conn)
        seed_requests(conn, contacts)
        seed_booking(conn, contacts)
        seed_records(conn)
        conn.commit()
    finally:
        conn.close()
    seed_workflows()
    print(json.dumps({"company": COMPANY, "data": str(DATA)}))


if __name__ == "__main__":
    main()
