#!/usr/bin/env python3
"""Watch Apple Store pickup availability for iPhone Duo and alert the moment it's in stock nearby.

  python3 duo_watch.py --find-parts   look up part numbers for the configs listed under "want"
  python3 duo_watch.py --once         one check; print every nearby store's status and exit
  python3 duo_watch.py --test-alert   fire a fake alert to test sound, notification and phone push
  python3 duo_watch.py                watch continuously (run under `caffeinate -is` so the Mac stays awake)

Only reads Apple's public pickup-availability endpoint, the same one apple.com calls when you
check a store. It never touches your Apple account or bag.
"""
import argparse
import gzip
import http.cookiejar
import json
import os
import random
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "config.json")
COOKIE_PATH = os.path.join(HERE, ".cookies.txt")

FULFILLMENT_URL = "https://www.apple.com/shop/fulfillment-messages"
USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
              "(KHTML, like Gecko) Version/26.0 Safari/605.1.15")
JSON_ACCEPT = "application/json, text/plain, */*"
HTML_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

DEFAULTS = {
    "zip": "",
    "max_miles": 25,
    "want": {},
    "parts": {},
    "buy_url": "https://www.apple.com/shop/buy-iphone/iphone-duo",
    "interval_seconds": 12,
    "jitter_seconds": 3,
    "max_backoff_seconds": 300,
    "realert_minutes": 3,
    "ntfy_topic": "",
    "ntfy_server": "https://ntfy.sh",
    "open_browser": True,
    "sound": True,
    "speak": True,
    "heartbeat_hours": 4,
    "http_client": "auto",
}


class CheckFailed(Exception):
    pass


def log(msg):
    # \r\033[K clears the in-place status line before printing a real log line.
    print("\r\033[K[%s] %s" % (datetime.now().strftime("%H:%M:%S"), msg), flush=True)


def status_line(msg):
    print("\r\033[K[%s] %s" % (datetime.now().strftime("%H:%M:%S"), msg), end="", flush=True)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(s))).strip()


# ---------------------------------------------------------------- config

def load_config():
    if not os.path.exists(CONFIG_PATH):
        sys.exit("No config.json next to duo_watch.py. Copy config.example.json to config.json and edit it.")
    with open(CONFIG_PATH) as f:
        cfg = dict(DEFAULTS, **json.load(f))
    cfg["zip"] = str(cfg["zip"]).strip()
    if not re.fullmatch(r"\d{5}", cfg["zip"]):
        sys.exit('Set "zip" in config.json to your 5-digit ZIP code.')
    return cfg


def save_parts(parts):
    with open(CONFIG_PATH) as f:
        raw = json.load(f)
    raw["parts"] = parts
    with open(CONFIG_PATH, "w") as f:
        json.dump(raw, f, indent=2)
        f.write("\n")


# ---------------------------------------------------------------- HTTP

class Fetcher:
    """GETs with a persistent cookie jar. In "auto" mode it starts with Python's HTTP client and
    switches to the system curl if Apple keeps answering 403, since the two look different to
    bot protection."""

    def __init__(self, mode="auto"):
        self.auto = mode == "auto"
        self.mode = "urllib" if self.auto else mode
        self.forbidden_streak = 0
        self.jar = http.cookiejar.MozillaCookieJar(COOKIE_PATH)
        try:
            self.jar.load(ignore_discard=True, ignore_expires=True)
        except (OSError, http.cookiejar.LoadError):
            pass
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def get(self, url, accept=JSON_ACCEPT, referer=None):
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": accept,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip",
        }
        if referer:
            headers["Referer"] = referer
        if self.mode == "curl":
            status, body = self._curl(url, headers)
        else:
            status, body = self._urllib(url, headers)
        if self.auto and self.mode == "urllib":
            self.forbidden_streak = self.forbidden_streak + 1 if status == 403 else 0
            if self.forbidden_streak >= 2 and shutil.which("curl"):
                log("Apple rejected Python's HTTP client twice in a row; switching to curl.")
                self.mode = "curl"
        return status, body

    def _urllib(self, url, headers):
        req = urllib.request.Request(url, headers=headers)
        try:
            with self.opener.open(req, timeout=20) as r:
                status, raw, enc = r.status, r.read(), r.headers.get("Content-Encoding", "")
        except urllib.error.HTTPError as e:
            status, raw, enc = e.code, e.read(), e.headers.get("Content-Encoding", "")
        if "gzip" in enc:
            raw = gzip.decompress(raw)
        try:
            self.jar.save(ignore_discard=True, ignore_expires=True)
        except OSError:
            pass
        return status, raw.decode("utf-8", "replace")

    def _curl(self, url, headers):
        cmd = ["curl", "-sS", "--compressed", "-m", "20",
               "-b", COOKIE_PATH, "-c", COOKIE_PATH, "-w", "\n%{http_code}"]
        for k, v in headers.items():
            if k != "Accept-Encoding":  # --compressed handles it
                cmd += ["-H", "%s: %s" % (k, v)]
        cmd.append(url)
        p = subprocess.run(cmd, capture_output=True, timeout=30)
        if p.returncode != 0:
            raise OSError("curl: " + p.stderr.decode("utf-8", "replace").strip())
        body, _, code = p.stdout.decode("utf-8", "replace").rpartition("\n")
        return int(code), body


def warm_up(cfg, fetcher):
    """Load the product page once so the session has the cookies a real browser would."""
    try:
        status, _ = fetcher.get(cfg["buy_url"], accept=HTML_ACCEPT)
        if status != 200:
            log("Product page returned HTTP %s (fine if pickup checks still work)." % status)
    except (OSError, ValueError) as e:
        log("Couldn't load product page: %s" % e)


# ---------------------------------------------------------------- availability

def fulfillment_url(cfg):
    params = [("fae", "true"), ("pl", "true"), ("mts.0", "regular"), ("mts.1", "compact"),
              ("searchNearby", "true"), ("location", cfg["zip"])]
    params += [("parts.%d" % i, part) for i, part in enumerate(cfg["parts"])]
    return FULFILLMENT_URL + "?" + urllib.parse.urlencode(params)


def store_miles(store):
    m = re.match(r"\s*([\d.,]+)\s*(mi|km)", str(store.get("storeDistanceWithUnit") or ""))
    if m:
        v = float(m.group(1).replace(",", ""))
        return v * 0.621371 if m.group(2) == "km" else v
    try:
        return float(store.get("storedistance"))  # US responses are already in miles
    except (TypeError, ValueError):
        return None


def parse_availability(payload, cfg):
    """Return one row per (store within range, watched part)."""
    try:
        pickup = payload["body"]["content"]["pickupMessage"]
    except (KeyError, TypeError):
        raise CheckFailed("unexpected response shape (no body.content.pickupMessage)")
    stores = pickup.get("stores")
    if stores is None:
        raise CheckFailed("no stores in response: %s" % strip_tags(pickup.get("errorMessage") or pickup)[:200])

    rows = []
    for s in stores:
        miles = store_miles(s)
        if miles is not None and miles > cfg["max_miles"]:
            continue
        name = s.get("storeName") or s.get("storeNumber") or "Unknown store"
        for part, label in cfg["parts"].items():
            pa = (s.get("partsAvailability") or {}).get(part)
            if pa is None:
                continue
            display = str(pa.get("pickupDisplay") or "").lower()
            quote = (pa.get("pickupSearchQuote")
                     or ((pa.get("messageTypes") or {}).get("regular") or {}).get("storePickupQuote")
                     or display)
            rows.append({
                "store_id": s.get("storeNumber") or name,
                "store": name,
                "city": s.get("city") or "",
                "miles": miles,
                "part": part,
                "label": label,
                "available": display == "available",
                "display": display,
                "quote": strip_tags(quote),
            })
    return rows


def check(cfg, fetcher):
    status, body = fetcher.get(fulfillment_url(cfg), referer=cfg["buy_url"])
    if status != 200:
        raise CheckFailed("HTTP %s" % status)
    try:
        payload = json.loads(body)
    except ValueError:
        raise CheckFailed("response wasn't JSON (likely a bot-check page)")
    return parse_availability(payload, cfg)


# ---------------------------------------------------------------- alerts

def ntfy(cfg, title, message, priority="default", tags="", click=None):
    if not cfg.get("ntfy_topic"):
        return
    url = "%s/%s" % (cfg["ntfy_server"].rstrip("/"), cfg["ntfy_topic"])
    headers = {"Title": title, "Priority": priority}
    if tags:
        headers["Tags"] = tags
    if click:
        headers["Click"] = click
    try:
        req = urllib.request.Request(url, data=message.encode("utf-8"), headers=headers, method="POST")
        urllib.request.urlopen(req, timeout=10).close()
    except (OSError, ValueError) as e:
        log("Phone push (ntfy) failed: %s" % e)


def mac_notify(title, message):
    esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
    script = 'display notification "%s" with title "%s" sound name "Glass"' % (esc(message), esc(title))
    subprocess.Popen(["osascript", "-e", script])


def describe_hit(h):
    where = "%s (%s)" % (h["store"], h["city"]) if h["city"] else h["store"]
    dist = " %.1f mi" % h["miles"] if h["miles"] is not None else ""
    return "%s @ %s%s: %s" % (h["label"], where, dist, h["quote"])


def alert(cfg, hits, first_time):
    title = "iPhone Duo in stock for pickup!"
    message = "\n".join(describe_hit(h) for h in hits)
    log("*** %s\n%s\n    -> %s" % (title, message, cfg["buy_url"]))
    sys.stdout.write("\a")
    sys.stdout.flush()
    if sys.platform == "darwin":
        mac_notify(title, message.splitlines()[0])
        if cfg["sound"]:
            subprocess.Popen(["sh", "-c", "for i in 1 2 3 4; do afplay /System/Library/Sounds/Glass.aiff; done"])
        if cfg["speak"]:
            subprocess.Popen(["say", "iPhone Duo in stock at " + hits[0]["store"]])
        if first_time and cfg["open_browser"]:
            subprocess.Popen(["open", cfg["buy_url"]])
    ntfy(cfg, title, message, priority="urgent", tags="rotating_light,iphone", click=cfg["buy_url"])


# ---------------------------------------------------------------- modes

def watch(cfg, fetcher):
    order = {p: i for i, p in enumerate(cfg["parts"])}
    alerted = {}  # (store_id, part) -> (time of last alert, store name) while continuously available
    fails, checks, blocked = 0, 0, 0
    last_ok = last_heartbeat = time.time()
    trouble_alerted = False

    log("Watching %d config(s) within %s mi of %s, every ~%ss. Ctrl+C to stop."
        % (len(cfg["parts"]), cfg["max_miles"], cfg["zip"], cfg["interval_seconds"]))
    warm_up(cfg, fetcher)

    while True:
        now = time.time()
        client = fetcher.mode
        try:
            rows = check(cfg, fetcher)
        except (CheckFailed, OSError, ValueError, subprocess.TimeoutExpired) as e:
            fails += 1
            blocked += 1
            delay = min(cfg["max_backoff_seconds"], cfg["interval_seconds"] * 2 ** fails)
            log("Check failed (%s); backing off %ds." % (e, delay))
            if fails % 3 == 0 or fetcher.mode != client:  # fresh cookies after repeated failures or a client switch
                warm_up(cfg, fetcher)
            if not trouble_alerted and now - last_ok > 300:
                ntfy(cfg, "iPhone Duo watcher can't reach Apple",
                     "No successful check for 5+ minutes (last error: %s). It keeps retrying." % e,
                     priority="high", tags="warning")
                trouble_alerted = True
            time.sleep(delay)
            continue

        if trouble_alerted:
            ntfy(cfg, "iPhone Duo watcher back online", "Checks are succeeding again.", tags="white_check_mark")
            trouble_alerted = False
        fails = 0
        checks += 1
        last_ok = now

        in_stock = {(r["store_id"], r["part"]): r for r in rows if r["available"]}
        due = [r for k, r in in_stock.items()
               if k not in alerted or now - alerted[k][0] >= cfg["realert_minutes"] * 60]
        if due:
            due.sort(key=lambda r: (order.get(r["part"], 99), r["miles"] if r["miles"] is not None else 999))
            alert(cfg, due, first_time=any((r["store_id"], r["part"]) not in alerted for r in due))
            for r in due:
                alerted[(r["store_id"], r["part"])] = (now, r["store"])
        for k in list(alerted):
            if k not in in_stock:
                log("Gone: %s at %s" % (cfg["parts"].get(k[1], k[1]), alerted[k][1]))
                del alerted[k]

        stores = len({r["store_id"] for r in rows})
        status_line("check #%d ok: %d store(s) in range, %d in stock, %d failed so far"
                    % (checks, stores, len(in_stock), blocked))

        if cfg["heartbeat_hours"] and now - last_heartbeat >= cfg["heartbeat_hours"] * 3600:
            ntfy(cfg, "iPhone Duo watcher still running",
                 "%d checks done, %d failed. Nothing in stock right now." % (checks, blocked), priority="low")
            last_heartbeat = now

        jitter = cfg["jitter_seconds"]
        time.sleep(max(3, cfg["interval_seconds"] + random.uniform(-jitter, jitter)))


def run_once(cfg, fetcher):
    warm_up(cfg, fetcher)
    url = fulfillment_url(cfg)
    try:
        rows = check(cfg, fetcher)
    except (CheckFailed, OSError, ValueError) as e:
        print("Check failed: %s\nURL: %s" % (e, url))
        return 1
    if not rows:
        print("Apple answered, but no stores within %s mi listed these part numbers.\n"
              "Double-check \"parts\" in config.json (run --find-parts).\nURL: %s" % (cfg["max_miles"], url))
        return 1
    for r in sorted(rows, key=lambda r: (r["miles"] or 0, r["store"])):
        mark = "IN STOCK" if r["available"] else "-"
        dist = "%5.1f mi" % r["miles"] if r["miles"] is not None else "   ? mi"
        print("%s  %-28s %-34s %-9s %s" % (dist, r["store"][:28], r["label"][:34], mark, r["quote"]))
    print("\nWorking. %d store(s) within %s mi checked." % (len({r["store_id"] for r in rows}), cfg["max_miles"]))
    return 0


def test_alert(cfg):
    fake = [{"store": "Test Store", "city": "Testville", "miles": 4.2,
             "label": "TEST - not real stock", "quote": "Available Today"}]
    alert(cfg, fake, first_time=True)
    if not cfg.get("ntfy_topic"):
        print('No "ntfy_topic" set, so nothing was pushed to your phone.')
    time.sleep(2)  # let sound/notification subprocesses start before exiting


# ---------------------------------------------------------------- part-number discovery

CARRIERS = [
    ("Verizon", r"verizon"),
    ("AT&T", r"at&t|at\\u0026t|(?<![a-z])att(?![a-z])"),
    ("T-Mobile", r"t-?mobile"),
    ("Boost Mobile", r"boost"),
    ("Unlocked", r"unlocked|sim-?free|connect.?(to.?any.?carrier.?)?later"),
]


def enclosing_object(text, idx, limit=6000):
    """The innermost {...} around text[idx], parsed as JSON when possible, else as raw text."""
    depth = 0
    start = None
    for j in range(idx, max(-1, idx - limit), -1):
        c = text[j]
        if c == "}":
            depth += 1
        elif c == "{":
            if depth == 0:
                start = j
                break
            depth -= 1
    if start is None:
        return text[max(0, idx - 400):idx + 400]
    depth = 0
    for k in range(start, min(len(text), start + limit)):
        if text[k] == "{":
            depth += 1
        elif text[k] == "}":
            depth -= 1
            if depth == 0:
                chunk = text[start:k + 1]
                try:
                    return json.loads(chunk)
                except ValueError:
                    return chunk
    return text[start:start + 800]


def extract_products(html):
    """Map part number -> lowercased text of the product data object it appears in."""
    text = html.replace('\\"', '"')  # product data is sometimes embedded as an escaped JS string
    products = {}
    for m in re.finditer(r'"partNumber"\s*:\s*"([A-Z0-9]{5,9}/[A-Z])"', text):
        if m.group(1) not in products:
            obj = enclosing_object(text, m.start())
            products[m.group(1)] = (json.dumps(obj) if not isinstance(obj, str) else obj).lower()
    return products


def describe_product(blob, colors):
    cap = re.search(r'capacity"\s*:\s*"(\d+)\s*(gb|tb)', blob) or re.search(r"\b(\d+)\s?(gb|tb)\b", blob)
    flat = norm(blob)
    return {
        "storage": (cap.group(1) + cap.group(2)) if cap else None,
        "color": next((c for c in colors if norm(c) in flat), None),
        "carrier": next((name for name, rx in CARRIERS if re.search(rx, blob)), None),
    }


def wanted(info, want):
    storages = [norm(s) for s in want.get("storage", [])]
    colors = [norm(c) for c in want.get("colors", [])]
    carriers = [norm(c) for c in want.get("carriers", [])]
    return ((not storages or (info["storage"] and norm(info["storage"]) in storages))
            and (not colors or (info["color"] and norm(info["color"]) in colors))
            and (not carriers or norm(info["carrier"] or "unlocked") in carriers))


MANUAL_HELP = """
Finding part numbers by hand (about 2 minutes per config):
  1. On your Mac, open {url} in Chrome and pick the storage, color and carrier.
  2. Open DevTools (Cmd+Option+I), go to the Network tab, and type "fulfillment" in the filter box.
  3. On the page, open the in-store pickup / check availability panel and enter your ZIP.
  4. Click the request that appears. Its URL contains parts.0=XXXXXLL%2FA, so the part number is XXXXXLL/A.
  5. Put it in "parts" in config.json, e.g.  "parts": {{"XXXXXLL/A": "256GB Night Sky Verizon"}}
"""


def find_parts(cfg, fetcher):
    url = cfg["buy_url"]
    status, html = fetcher.get(url, accept=HTML_ACCEPT)
    if status != 200:
        print("Couldn't load %s (HTTP %s). If Apple moved the page, update \"buy_url\" in config.json." % (url, status))
        print(MANUAL_HELP.format(url=url))
        return 1
    products = extract_products(html)
    if not products:
        print("Loaded the page but found no product data in it; Apple may have changed the page.")
        print(MANUAL_HELP.format(url=url))
        return 1

    want = cfg.get("want") or {}
    colors = want.get("colors", []) + ["Star White", "Night Sky"]
    rank = lambda v, key: next((i for i, w in enumerate(want.get(key, [])) if norm(w) == norm(v or "")), 99)
    found = []
    for part, blob in products.items():
        info = describe_product(blob, colors)
        if info["storage"]:  # skip accessories, which have part numbers but no storage size
            found.append((part, info, wanted(info, want)))
    found.sort(key=lambda f: (rank(f[1]["storage"], "storage"), rank(f[1]["color"], "colors"), f[0]))

    print("%-12s %-8s %-12s %-14s %s" % ("PART", "STORAGE", "COLOR", "CARRIER", "MATCHES 'want'"))
    for part, info, ok in found:
        print("%-12s %-8s %-12s %-14s %s" % (part, (info["storage"] or "?").upper(), info["color"] or "?",
                                             info["carrier"] or "(none listed)", "yes" if ok else ""))
    matches = [(p, i) for p, i, ok in found if ok]
    if not matches:
        print("\nNo part numbers matched your \"want\" settings.")
        if found and all(i["carrier"] is None for _, i, _ in found):
            print("The page lists no carrier info, so carrier versions probably load separately; use the manual steps.")
        print(MANUAL_HELP.format(url=url))
        return 1
    parts = {p: "%s %s %s" % (i["storage"].upper(), i["color"] or "", i["carrier"] or "Unlocked") for p, i in matches}
    save_parts(parts)
    print("\nSaved %d part number(s) to config.json. Sanity-check them against what you selected on apple.com,"
          "\nthen run:  python3 duo_watch.py --once" % len(parts))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--find-parts", action="store_true", help="look up part numbers for your 'want' configs")
    mode.add_argument("--once", action="store_true", help="check once, print results, exit")
    mode.add_argument("--test-alert", action="store_true", help="fire a fake alert")
    args = ap.parse_args()

    cfg = load_config()
    if args.test_alert:
        return test_alert(cfg)
    fetcher = Fetcher(cfg["http_client"])
    if args.find_parts:
        return find_parts(cfg, fetcher)
    if not cfg["parts"]:
        sys.exit('No part numbers in config.json yet. Run:  python3 duo_watch.py --find-parts')
    if args.once:
        return run_once(cfg, fetcher)
    try:
        watch(cfg, fetcher)
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
