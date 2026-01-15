import os
import django
import sys
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from medical.models import DoctorNote

def run():
    note = DoctorNote.objects.order_by('-created_at').first()
    if note:
        print(f"PRESCRIPTION_START")
        print(json.dumps(note.prescription))
        print(f"PRESCRIPTION_END")
    else:
        print("NO_NOTE")

if __name__ == "__main__":
    run()
