import subprocess
import sys
import time
import random
import requests
from pathlib import Path
from datetime import datetime

colors = {
    'purple': '\033[35m',
    'cyan': '\033[36m',
    'green': '\033[32m',
    'red': '\033[31m',
    'yellow': '\033[33m',
    'reset': '\033[0m',
}

def get_timestamp():
    now = datetime.now()
    h = str(now.hour).zfill(2)
    m = str(now.minute).zfill(2)
    s = str(now.second).zfill(2)
    return f"{h}:{m}:{s}"

def print_info(msg):
    print(f"{colors['purple']}[{get_timestamp()}]{colors['reset']} {colors['cyan']}[ * ]{colors['reset']} {msg}")
    sys.stdout.flush()

def print_success(msg):
    print(f"{colors['purple']}[{get_timestamp()}]{colors['reset']} {colors['green']}[ + ]{colors['reset']} {msg}")
    sys.stdout.flush()

def print_error(msg):
    print(f"{colors['purple']}[{get_timestamp()}]{colors['reset']} {colors['red']}[ - ]{colors['reset']} {msg}")
    sys.stdout.flush()

def print_other(msg):
    print(f"{colors['purple']}[{get_timestamp()}]{colors['reset']} {colors['yellow']}[ & ]{colors['reset']} {msg}")
    sys.stdout.flush()

NORDVPN_DIR = r"C:\Program Files\NordVPN"
COUNTRIES = {
    'United States': 'United States',
    'Canada': 'Canada',
    'India': 'India',
    'Australia': 'Australia',
    'New Zealand': 'New Zealand',
    'Japan': 'Japan',
    'Argentina': 'Argentina',
    'Brazil': 'Brazil',
    'Chile': 'Chile',
    'Mexico': 'Mexico',
    'Costa Rica': 'Costa Rica',
    'United Arab Emirates': 'United Arab Emirates',
    'Israel': 'Israel',
    'Egypt': 'Egypt',
    'South Africa': 'South Africa',
    'Singapore': 'Singapore',
    'Thailand': 'Thailand',
    'Indonesia': 'Indonesia',
    'Vietnam': 'Vietnam',
}

def get_ip():
    try:
        return requests.get("https://api.ipify.org", timeout=10).text.strip()
    except:
        try:
            return requests.get("https://ident.me", timeout=10).text.strip()
        except:
            return None

def rotate():
    print_info("Fetching current IP...")
    old_ip = get_ip()
    if not old_ip:
        print_error("Failed to get current IP")
        sys.exit(1)
    
    print_success(f"Current IP: {old_ip}")

    print_info("Disconnecting...")
    try:
        subprocess.run(
            [rf"{NORDVPN_DIR}\nordvpn.exe", "-d"],
            capture_output=True,
            timeout=15,
            cwd=NORDVPN_DIR
        )
        time.sleep(2)
    except:
        pass

    country = random.choice(list(COUNTRIES.values()))
    print_info(f"Connecting to {country}...")

    try:
        result = subprocess.run(
            [rf"{NORDVPN_DIR}\nordvpn.exe", "-c", "-g", country],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=NORDVPN_DIR
        )
        
        if result.returncode != 0:
            print_error(f"Connection failed: {result.stderr}")
            sys.exit(1)
    except Exception as e:
        print_error(f"Connection error: {str(e)}")
        sys.exit(1)
    
    time.sleep(6)

    new_ip = get_ip()
    if not new_ip:
        print_error("Failed to get new IP")
        sys.exit(1)
    
    print_success(f"Previous IP: {old_ip} -> New IP: {new_ip}")

    if new_ip != old_ip:
        print_success("IP switched successfully")
        sys.exit(0)
    else:
        print_error("IP did not change")
        sys.exit(1)

def check():
    print_success("Make sure vpn is connected.")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        check()
    else:
        rotate()
