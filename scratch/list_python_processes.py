import subprocess

def list_procs():
    try:
        out = subprocess.check_output('wmic process where "name like \'python%\'" get CommandLine, ProcessId', shell=True)
        print(out.decode('utf-8', errors='ignore'))
    except Exception as e:
        print("Failed to run wmic:", e)

if __name__ == '__main__':
    list_procs()
