import os
import sys
import time
import socket
import json

UDP_IP = "127.0.0.1"
UDP_PORT = 8002

# GPIO Pin Mapping — Arduino Ventuno Q (40-pin header, BOARD numbering)
#   Pin 15 → START
#   Pin 29 → PAUSE
#   Pin 31 → RAISE_HAND / capacitive hand-raise
# Desktop: HARDWARE_TARGET=simulation (keyboard s/p/h).
GPIO_PINS = {
    's': {"pin": 15, "action": "START"},
    'p': {"pin": 29, "action": "PAUSE"},
    'h': {"pin": 31, "action": "RAISE_HAND"}
}


def get_key_nonblocking():
    if os.name == 'nt':
        import msvcrt
        if msvcrt.kbhit():
            try:
                return msvcrt.getch().decode('utf-8', errors='ignore').lower()
            except Exception:
                return None
        return None
    import select
    import termios
    import tty
    fd = sys.stdin.fileno()
    try:
        old_settings = termios.tcgetattr(fd)
    except Exception:
        return None
    try:
        tty.setraw(fd)
        rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
        if rlist:
            return sys.stdin.read(1).lower()
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
    """Ventuno Q GPIO. Chip-line mapping lands when the board schematic is wired."""
    try:
        import gpiod  # noqa: F401
        print("[GPIO] libgpiod is present; Ventuno Q line mapping is not wired yet.")
    except ImportError:
        print("[GPIO] No libgpiod on this host.")
    print("[GPIO] Falling back to keyboard simulation.")
    return False


def run_simulation_loop():
    print("======================================================================")
    print("   ARDUINO VENTUNO Q — HARDWARE INTERRUPT BRIDGE (SIMULATION)         ")
    print("======================================================================")
    print("Active GPIO Pin Mapping (40-pin header, BOARD numbering):")
    print("  - BOARD Pin 15: START button      (Shortcut: 's')")
    print("  - BOARD Pin 29: PAUSE button      (Shortcut: 'p')")
    print("  - BOARD Pin 31: RAISE_HAND button (Shortcut: 'h')")
    print("  - Exit Simulation                 (Shortcut: 'q')")
    print("======================================================================")

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
                if action == "RAISE_HAND":
                    print("Enter Voice / Text question: ", end="", flush=True)
                    try:
                        user_query = sys.stdin.readline().strip()
                        if user_query:
                            send_gpio_event(action, pin, user_query)
                    except KeyboardInterrupt:
                        print("\n[SYSTEM] Audio query cancelled.")
                else:
                    send_gpio_event(action, pin)
        time.sleep(0.05)


def main():
    target = os.environ.get("HARDWARE_TARGET", "simulation").lower()
    if target in ("ventuno", "jetson"):
        if run_physical_gpio():
            return
    run_simulation_loop()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting hardware bridge.")
