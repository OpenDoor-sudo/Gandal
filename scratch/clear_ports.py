import subprocess
import os
import signal
import sys

def get_pids_on_ports(ports):
    pids = set()
    try:
        # Run netstat -ano and search for ports
        output = subprocess.check_output("netstat -ano", shell=True).decode('utf-8', errors='ignore')
        for line in output.splitlines():
            # Match listener on specified ports
            for port in ports:
                # Check for TCP/UDP local address containing :port
                # E.g. TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       7432
                parts = line.strip().split()
                if len(parts) >= 5 and (f":{port}" in parts[1]):
                    try:
                        pid = int(parts[-1])
                        if pid > 0:
                            pids.add(pid)
                    except ValueError:
                        pass
    except Exception as e:
        print(f"Error checking netstat: {e}")
    return pids

def main():
    ports = [8000, 8001]
    pids = get_pids_on_ports(ports)
    if not pids:
        print("Ports 8000 and 8001 are clear and open.")
        return

    print(f"Found active processes on ports {ports}: {pids}")
    for pid in pids:
        try:
            print(f"Terminating process {pid}...")
            # Attempt taskkill on Windows
            subprocess.call(f"taskkill /F /PID {pid}", shell=True)
        except Exception as e:
            print(f"Failed to terminate process {pid}: {e}")

    # Verify again
    pids = get_pids_on_ports(ports)
    if not pids:
        print("Verified: Ports 8000 and 8001 are now clear and open.")
    else:
        print(f"Warning: Ports still occupied by PIDs: {pids}")

if __name__ == '__main__':
    main()
