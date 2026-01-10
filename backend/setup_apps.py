
import os
import subprocess
import sys

# Add the current directory to sys.path to ensure we use the venv's python if needed, 
# but usually managing via subprocess with sys.executable is safer.

apps = ['core', 'users', 'patients', 'medical', 'lab', 'pharmacy', 'billing']

def create_apps():
    for app in apps:
        if not os.path.exists(app):
            print(f"Creating app: {app}")
            try:
                subprocess.run([sys.executable, 'manage.py', 'startapp', app], check=True)
            except subprocess.CalledProcessError as e:
                print(f"Failed to create app {app}: {e}")
        else:
            print(f"App {app} already exists")

if __name__ == "__main__":
    create_apps()
