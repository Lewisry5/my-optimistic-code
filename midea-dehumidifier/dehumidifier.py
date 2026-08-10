#!/usr/bin/env python3
"""Discover and control a Midea Wi-Fi dehumidifier on your local network.

Works with dehumidifiers that pair through the NetHome Plus / Midea Air /
MSmartHome apps (Midea, Comfee, Inventor, Pro Breeze and other rebrands).

The appliance must already be joined to your Wi-Fi (see README.md for the
one-time pairing steps). After that, control is fully local — the cloud
account is only needed once, during `discover`, to fetch the token/key
that unlock the local protocol.

Usage:
  python dehumidifier.py discover --show-credentials
  python dehumidifier.py status
  python dehumidifier.py set --on --humidity 45 --fan medium
"""

import argparse
import getpass
import os
import sys

from midea_beautiful import appliance_state, find_appliances
from midea_beautiful.exceptions import MideaError

MODE_NAMES = {1: "target-humidity", 2: "continuous", 3: "smart", 4: "clothes-dry"}
FAN_PRESETS = {"silent": 40, "medium": 60, "turbo": 80}


def cloud_credentials(args):
    account = args.account or os.environ.get("MIDEA_ACCOUNT")
    if not account:
        account = input("App account email (NetHome Plus / Midea Air): ").strip()
    password = args.password or os.environ.get("MIDEA_PASSWORD")
    if not password:
        password = getpass.getpass(f"App password for {account}: ")
    return account, password


def local_credentials(args):
    ip = args.ip or os.environ.get("MIDEA_IP")
    token = args.token or os.environ.get("MIDEA_TOKEN")
    key = args.key or os.environ.get("MIDEA_KEY")
    missing = [n for n, v in (("--ip/MIDEA_IP", ip), ("--token/MIDEA_TOKEN", token), ("--key/MIDEA_KEY", key)) if not v]
    if missing:
        sys.exit(f"Missing {', '.join(missing)}. Run `discover --show-credentials` first, "
                 "then pass the values as flags or export them as environment variables.")
    return ip, token, key


def print_status(device):
    s = device.state
    running = "ON" if s.running else "OFF"
    mode = MODE_NAMES.get(s.mode, f"mode {s.mode}")
    print(f"{s.name or device.serial_number} @ {device.address}")
    print(f"  power:            {running} ({mode})")
    print(f"  humidity:         {s.current_humidity}% now -> {s.target_humidity}% target")
    print(f"  fan speed:        {s.fan_speed}")
    if s.current_temperature is not None:
        print(f"  temperature:      {s.current_temperature} C")
    print(f"  tank full:        {'YES - empty it, unit will not run' if s.tank_full else 'no'}")
    print(f"  filter reminder:  {'yes' if s.filter_indicator else 'no'}")
    print(f"  ion mode:         {'on' if s.ion_mode else 'off'}   pump: {'on' if s.pump else 'off'}")
    if s.error_code:
        print(f"  error code:       {s.error_code}")


def cmd_discover(args):
    account, password = cloud_credentials(args)
    addresses = [args.ip] if args.ip else None
    print("Scanning the local network (UDP broadcast, a few seconds)...")
    appliances = find_appliances(account=account, password=password, addresses=addresses)
    if not appliances:
        print("No Midea appliances found. Make sure the dehumidifier is paired to Wi-Fi,")
        print("you are on the same network/VLAN, or retry with --ip <appliance address>.")
        return
    for a in appliances:
        print(f"\nFound: {a.state.name or a.model} (type {a.type})")
        print(f"  ip:      {a.address}")
        print(f"  id:      {a.appliance_id}")
        print(f"  serial:  {a.serial_number}")
        if args.show_credentials:
            print(f"  token:   {a.token}")
            print(f"  key:     {a.key}")
            print(f"  export MIDEA_IP={a.address} MIDEA_TOKEN={a.token} MIDEA_KEY={a.key}")
        else:
            print("  (re-run with --show-credentials to print the local token/key)")


def cmd_status(args):
    ip, token, key = local_credentials(args)
    device = appliance_state(address=ip, token=token, key=key)
    print_status(device)


def cmd_set(args):
    ip, token, key = local_credentials(args)
    changes = {}
    if args.on:
        changes["running"] = True
    if args.off:
        changes["running"] = False
    if args.humidity is not None:
        if not 35 <= args.humidity <= 85:
            sys.exit("--humidity must be between 35 and 85")
        changes["target_humidity"] = args.humidity
    if args.fan is not None:
        fan = FAN_PRESETS.get(args.fan.lower(), args.fan)
        try:
            fan = int(fan)
        except ValueError:
            sys.exit(f"--fan must be one of {', '.join(FAN_PRESETS)} or a number 0-127")
        changes["fan_speed"] = fan
    if args.mode is not None:
        names = {v: k for k, v in MODE_NAMES.items()}
        mode = names.get(args.mode.lower(), args.mode)
        try:
            mode = int(mode)
        except ValueError:
            sys.exit(f"--mode must be one of {', '.join(names)} or a number 1-4")
        changes["mode"] = mode
    if args.ion is not None:
        changes["ion_mode"] = args.ion == "on"
    if args.pump is not None:
        changes["pump"] = args.pump == "on"
    if not changes:
        sys.exit("Nothing to change. Try --on, --off, --humidity, --fan, --mode, --ion or --pump.")

    device = appliance_state(address=ip, token=token, key=key)
    device.set_state(**changes)
    device.refresh()
    print("Applied. Current state:\n")
    print_status(device)


def add_local_args(p):
    p.add_argument("--ip", help="appliance IP address (or set MIDEA_IP)")
    p.add_argument("--token", help="local token from discover (or set MIDEA_TOKEN)")
    p.add_argument("--key", help="local key from discover (or set MIDEA_KEY)")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    d = sub.add_parser("discover", help="find the dehumidifier on your LAN and fetch its local token/key")
    d.add_argument("--account", help="app account email (or set MIDEA_ACCOUNT)")
    d.add_argument("--password", help="app password (or set MIDEA_PASSWORD; prompted if omitted)")
    d.add_argument("--ip", help="scan one address instead of broadcasting (for other VLANs/subnets)")
    d.add_argument("--show-credentials", action="store_true", help="print token/key for local control")
    d.set_defaults(func=cmd_discover)

    s = sub.add_parser("status", help="read the current state over the local network")
    add_local_args(s)
    s.set_defaults(func=cmd_status)

    c = sub.add_parser("set", help="change settings over the local network")
    add_local_args(c)
    onoff = c.add_mutually_exclusive_group()
    onoff.add_argument("--on", action="store_true", help="turn the dehumidifier on")
    onoff.add_argument("--off", action="store_true", help="turn the dehumidifier off")
    c.add_argument("--humidity", type=int, help="target relative humidity, 35-85 percent")
    c.add_argument("--fan", help="fan speed: silent, medium, turbo or 0-127")
    c.add_argument("--mode", help="mode: target-humidity, continuous, smart, clothes-dry or 1-4")
    c.add_argument("--ion", choices=["on", "off"], help="ionizer / anion mode")
    c.add_argument("--pump", choices=["on", "off"], help="drain pump (models with a pump)")
    c.set_defaults(func=cmd_set)

    args = parser.parse_args()
    try:
        args.func(args)
    except MideaError as err:
        sys.exit(f"Midea error: {err}")
    except KeyboardInterrupt:
        sys.exit("\nCancelled.")


if __name__ == "__main__":
    main()
