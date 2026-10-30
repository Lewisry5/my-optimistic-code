# iPhone Duo pickup watcher

Checks Apple's in-store pickup availability every ~12 seconds for the iPhone Duo configs you want, at Apple Stores within 25 miles of your ZIP. When one shows up it:

- pushes an urgent alert to your iPhone (via the free **ntfy** app), with a tap-to-open link to the iPhone Duo page,
- plays a sound, speaks the store name, and shows a Mac notification,
- opens the iPhone Duo buy page in your Mac's browser.

It only reads public availability. It never signs in, touches your bag, or buys anything. That's on purpose: a phone in your Apple bag isn't held for you. Only a finished checkout with a pickup slot secures it, so your speed from alert to **Place Order** is what counts.

## One-time setup (about 10 minutes)

**1. Phone alerts.** On your iPhone, install **ntfy** from the App Store. Tap **+** and subscribe to a topic name nobody would guess, e.g. `duo-` followed by 10 random letters/numbers. Allow notifications. In the topic's settings you can turn on "instant delivery" if offered.

**2. Get this folder onto your Mac** and open Terminal in it:

```sh
cd ~/Downloads/iphone-duo-watch     # wherever you put it
cp config.example.json config.json
open -e config.json                 # opens it in TextEdit
```

In `config.json`, set `"ntfy_topic"` to the topic from step 1. Your ZIP (01778), the 25-mile radius, and your configs (256GB/512GB, both colors, Verizon) are already filled in.

**3. Check Python.** Run `python3 --version`. If macOS offers to install the "command line developer tools", accept and wait for it to finish.

**4. Look up the part numbers.** Apple tracks stock per part number, and each storage/color/carrier combination has its own.

```sh
python3 duo_watch.py --find-parts
```

This reads the iPhone Duo page and saves the part numbers that match your settings into `config.json`. If it can't (Apple changes its pages), it prints a 2-minute manual method using Chrome's developer tools.

**5. Test a real check:**

```sh
python3 duo_watch.py --once
```

You should see one line per nearby store and config, with its current status. If you get an error instead, send it to Claude so it can be fixed.

**6. Test the alerts:**

```sh
python3 duo_watch.py --test-alert
```

Your phone should buzz, and your Mac should beep, speak, and open the buy page.

## Running it

```sh
caffeinate -is python3 duo_watch.py
```

`caffeinate` keeps the Mac awake while the watcher runs. Keep it **plugged in with the lid open**, since closing the lid sleeps it anyway. Leave the Terminal window open; `Ctrl+C` stops it.

While it's running you'll also get:

- a repeat urgent alert every 3 minutes for as long as a phone stays in stock,
- a warning push if it can't reach Apple for 5+ minutes, so you know it's blind,
- a low-priority "still running" push every 4 hours.

## When the alert fires: be fast

Set these up **now**, before an alert:

- **Apple Store app** on your iPhone, signed in, with **Apple Pay** set up and your billing address current.
- **Verizon details ready.** Carrier-version checkout asks you to verify your Verizon account (have your account login/PIN handy). That step can cost you the phone if you're digging for a password.
- **Do a dry run.** Go through the pickup checkout for any iPhone Duo config at a nearby store, right up to the final button, so the screens are familiar.
- **Consider adding unlocked models.** If Apple offers a "connect to any carrier later" version of the Duo, it's a separate stock pool that still works on Verizon and may skip carrier verification. Add `"Unlocked"` to `"carriers"` in `config.json` and run `--find-parts` again.

When it fires: tap the push, choose the config and store it named, check out with Apple Pay.

## Settings (`config.json`)

| Setting | Default | What it does |
|---|---|---|
| `zip` | `01778` | Where to search from |
| `max_miles` | `25` | Ignore stores farther than this |
| `want` | 256/512GB, both colors, Verizon | What `--find-parts` looks for. List them in order of preference; alerts list your top preference first |
| `parts` | filled by `--find-parts` | The part numbers actually checked (one request covers all of them) |
| `interval_seconds` / `jitter_seconds` | `12` / `3` | Check every 9–15 seconds. The minimum is 3 seconds |
| `max_backoff_seconds` | `300` | On errors it waits longer (doubling) up to this, then recovers by itself |
| `realert_minutes` | `3` | How often to re-alert while something stays in stock |
| `ntfy_topic` | empty | Your ntfy topic; empty = no phone pushes |
| `open_browser` / `sound` / `speak` | `true` | Mac-side alerts |
| `heartbeat_hours` | `4` | "Still running" push interval; `0` turns it off |
| `http_client` | `auto` | `auto` starts with Python and switches to curl if Apple blocks it; you can force `urllib` or `curl` |

## Troubleshooting

- **Lots of `HTTP 403` / `backing off`:** Apple's bot protection is throttling you. The watcher slows down automatically. If it keeps happening, raise `interval_seconds` to 20–30. A slower checker that keeps running beats a fast one that's blocked.
- **`CERTIFICATE_VERIFY_FAILED`:** you're using Python from python.org. Run "Install Certificates.command" from its folder in Applications, or set `"http_client": "curl"`.
- **`--once` says no stores listed your part numbers:** a part number is probably wrong. Re-run `--find-parts` or use the manual method it prints.
- **`response wasn't JSON`:** Apple served a bot-check page. Same fix as 403s.

A note on Apple's rules: Apple doesn't sanction automated access to its site. This tool keeps the risk low by only reading availability, at roughly the rate of someone refreshing a page, and never logging in or buying. The realistic worst case is a temporary block of your home IP from apple.com.
