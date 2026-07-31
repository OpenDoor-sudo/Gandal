import os
import sys
import time
import socket
import json

UDP_IP = "127.0.0.1"
UDP_PORT = 8002

# ============================================================
# GPIO Pin Mapping — NVIDIA Jetson Orin Nano Super Dev Kit
# Carrier Board 40-pin header: Board-mode numbering (BOARD).
# Physical header pins used (board pin numbers):
#   Pin 15 → START button
#   Pin 29 → PAUSE button
#   Pin 31 → RAISE_HAND button
# These are safe user-space GPIO pins on the Orin Nano carrier.
# ============================================================
GPIO_PINS = {
    's': {"pin": 15, "action": "START"},
    'p': {"pin": 29, "action": "PAUSE"},
    'h': {"pin": 31, "action": "RAISE_HAND"}
}

# Cross-platform non-blocking key reader
def get_key_nonblocking():
    if os.name == 'nt':
        import msvcrt
        if msvcrt.kbhit():
            try:
                return msvcrt.getch().decode('utf-8', errors='ignore').lower()
            except Exception:
                return None
        return None
    else:
        import select
        import termios
        import tty
        fd = sys.stdin.fileno()
        try:
            old_settings = termios.tcgetattr(fd)
        except Exception:
            # Fallback if stdin is not a tty (e.g. background pipeline)
            return None
        try:
            tty.setraw(fd)
            rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
            if rlist:
                key = sys.stdin.read(1)
                return key.lower()
            return None
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

def send_gpio_event(action, pin, query=None):
    payload = {
        "event": "GPIO_INTERRUPT",
        "pin": pin,
        "action": action,
        "query": query,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.sendto(json.dumps(payload).encode('utf-8'), (UDP_IP, UDP_PORT))
        print(f"  [IPC] Transmitted event to orchestrator socket: {action} (Pin {pin})")
    except Exception as e:
        print(f"  [IPC] Error transmitting to socket: {e}")
    finally:
        sock.close()

def run_physical_gpio():
    """
    Binds to the Jetson Orin Nano Super 40-pin header using Jetson.GPIO.
    Uses BOARD numbering (physical pin numbers on the 40-pin header).
    All inputs are configured with pull-up resistors (active-low buttons).
    """
    try:
        import Jetson.GPIO as GPIO
    except ImportError:
        print("[GPIO ERROR] Jetson.GPIO library is not installed.")
        print("[GPIO INFO] Install with: pip install Jetson.GPIO")
        print("[GPIO INFO] Physical GPIO features are unavailable on non-Jetson systems.")
        print("[GPIO] Falling back to keyboard simulation.")
        return False

    # Use BOARD numbering — physical header pin positions on Orin Nano carrier
    GPIO.setmode(GPIO.BOARD)

    # Configure input pins with pull-up resistors (active-low: button press = LOW)
    for key, info in GPIO_PINS.items():
        pin = info["pin"]
        action = info["action"]
        print(f"[GPIO CONFIG] Configuring BOARD Pin {pin} as INPUT (PULL_UP) for action: {action}")
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    print("======================================================================")
    print("   NVIDIA JETSON ORIN NANO SUPER — PHYSICAL GPIO LISTENER ACTIVE      ")
    print("======================================================================")
    print("Listening for physical button interrupts on 40-pin carrier header:")
    print("  - BOARD Pin 15: START button")
    print("  - BOARD Pin 29: PAUSE button")
    print("  - BOARD Pin 31: RAISE_HAND button")
    print("======================================================================")

    # Read initial states
    last_states = {info["pin"]: GPIO.input(info["pin"]) for info in GPIO_PINS.values()}

    try:
        while True:
            for key, info in GPIO_PINS.items():
                pin = info["pin"]
                action = info["action"]
                current_state = GPIO.input(pin)

                # Detect falling edge (HIGH → LOW: button pressed / grounded)
                if last_states[pin] == GPIO.HIGH and current_state == GPIO.LOW:
                    print(f"\n[GPIO INTERRUPT] Physical BOARD Pin {pin} → LOW (Button: {action})")

                    if action == "RAISE_HAND":
                        print("="*60)
                        print("!!! [RAISE HAND ACTIVE] Enter Voice / Text query in console: !!!")
                        print("="*60)
                        print("Enter question: ", end="", flush=True)
                        try:
                            user_query = sys.stdin.readline().strip()
                            if user_query:
                                print(f"[SYSTEM] Transcribing voice text: \"{user_query}\"")
                                send_gpio_event(action, pin, user_query)
                            else:
                                print("[SYSTEM] Empty query. Interrupt cancelled.")
                        except KeyboardInterrupt:
                            print("\n[SYSTEM] Query cancelled.")
                    else:
                        send_gpio_event(action, pin)

                last_states[pin] = current_state

            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\nStopping physical GPIO monitor...")
    finally:
        GPIO.cleanup()
    return True

def main():
    target = os.environ.get("HARDWARE_TARGET", "simulation").lower()

    if target == "jetson":
        success = run_physical_gpio()
        if success:
            return

    print("======================================================================")
    print("   NVIDIA JETSON ORIN NANO SUPER — HARDWARE INTERRUPT BRIDGE (SIM)    ")
    print("======================================================================")
    print("Active GPIO Pin Mapping (40-pin carrier header, BOARD numbering):")
    print("  - BOARD Pin 15: START button      (Shortcut: 's')")
    print("  - BOARD Pin 29: PAUSE button      (Shortcut: 'p')")
    print("  - BOARD Pin 31: RAISE_HAND button (Shortcut: 'h')")
    print("  - Exit Simulation                 (Shortcut: 'q')")
    print("======================================================================")
    print("[SYSTEM] Reading physical input registers... listening for shortcuts.")

    while True:
        key = get_key_nonblocking()
        if key:
            if key == 'q':
                print("\n[SYSTEM] Shutting down Hardware Bridge. Exiting...")
                break

            if key in GPIO_PINS:
                mapping = GPIO_PINS[key]
                action = mapping["action"]
                pin = mapping["pin"]

                print(f"\n[GPIO INTERRUPT] Physical BOARD Pin {pin} → LOW (Button: {action})")

                # Special workflow for Raise Hand (needs text query input)
                if action == "RAISE_HAND":
                    # Temporarily restore normal blocking line reading for prompt
                    print("="*60)
                    print("!!! [RAISE HAND ACTIVE] listening on device interface... !!!")
                    print("="*60)
                    print("Enter Voice / Text question: ", end="", flush=True)

                    try:
                        # Direct readline input
                        user_query = sys.stdin.readline().strip()
                        if user_query:
                            print(f"[SYSTEM] Transcribing voice text: \"{user_query}\"")
                            send_gpio_event(action, pin, user_query)
                        else:
                            print("[SYSTEM] Empty query. Interrupt cancelled.")
                    except KeyboardInterrupt:
                        print("\n[SYSTEM] Audio query cancelled.")
                else:
                    # Send event immediately for START / PAUSE
                    send_gpio_event(action, pin)

        time.sleep(0.05)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting hardware bridge.")
