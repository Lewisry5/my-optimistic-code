# Midea dehumidifier — local network control

A small CLI to discover and control a Midea Wi-Fi dehumidifier (also sold as
Comfee, Inventor, Pro Breeze and other brands) from your own computer, over
your own network. After a one-time setup, control is fully local — no cloud
round-trip.

> Note: this has to run on a machine on your home network (laptop, Raspberry
> Pi, home server). Discovery uses UDP broadcast on the LAN, so a cloud
> session can't reach the appliance.

## 1. One-time: get the dehumidifier onto your Wi-Fi

A brand-new unit "trying to join the network" is in pairing mode: it
broadcasts its own temporary hotspot (an SSID like `net_ad_XXXX`). The Wi-Fi
credentials are sent to it with the vendor app:

1. Install **NetHome Plus** (iOS/Android) — Midea Air or MSmartHome also work —
   and create a free account. Remember the email/password; the CLI needs them
   once, in step 3.
2. In the app: add appliance → dehumidifier → follow the prompts (usually hold
   the unit's Wi-Fi/pair button until the indicator blinks).
3. When asked for your network, pick your **2.4 GHz** Wi-Fi. The modules in
   these units don't do 5 GHz — if your router merges both bands under one
   name and pairing keeps failing, temporarily enable a 2.4 GHz-only SSID.
4. Keep the phone near the unit until the app shows it online. The
   dehumidifier is now a normal client on your LAN.

## 2. Install this tool

```bash
cd midea-dehumidifier
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Discover it and grab the local credentials

```bash
export MIDEA_ACCOUNT=you@example.com    # app login from step 1
python dehumidifier.py discover --show-credentials   # prompts for the password
```

This scans the LAN, finds the unit, and prints its IP plus the local
`token`/`key`. Export them as shown in the output:

```bash
export MIDEA_IP=192.168.1.53 MIDEA_TOKEN=... MIDEA_KEY=...
```

That's the last time the cloud account is involved. The token/key are
secrets for your device — keep them out of git.

## 4. Control it

```bash
python dehumidifier.py status
python dehumidifier.py set --on --humidity 45 --fan medium
python dehumidifier.py set --mode smart
python dehumidifier.py set --pump on          # models with a drain pump
python dehumidifier.py set --off
```

Modes: `target-humidity` (1), `continuous` (2), `smart` (3), `clothes-dry` (4).
Fan: `silent` (40), `medium` (60), `turbo` (80) or any number 0–127. Exact
supported modes/speeds vary a little by model; unsupported values are ignored
by the unit.

## Troubleshooting

- **Nothing found:** run from the same subnet/VLAN as the appliance
  (broadcast doesn't cross VLANs), or point at it directly:
  `python dehumidifier.py discover --ip <appliance-ip> --show-credentials`.
  Your router's client list shows the IP; giving the unit a DHCP reservation
  keeps it stable.
- **Won't run / no water collected:** check the tank — `status` shows
  `tank full: YES` and the unit refuses to run until it's emptied.
- **Home Assistant:** the "Midea Air Appliance (LAN)" custom integration is
  built on the same library (`midea-beautiful-air`) and will pick the unit up
  with the same app account, if you'd rather have it in HA than a CLI.
