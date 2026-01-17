import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit

# Correct Visit ID from previous log
visit_id = 'f3ffafec-afc4-43de-9805-a7f34f8d7ef9'

try:
    v = Visit.objects.get(id=visit_id)
    print(f"Current Status: {v.status}")
    v.status = 'OPEN'
    v.save()
    print(f"New Status: {v.status}")
    print("Successfully reopened Myran's visit.")
except Visit.DoesNotExist:
    print("Visit not found!")
except Exception as e:
    print(f"Error: {e}")
