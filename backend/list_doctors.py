import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from users.models import User

# List all doctors
doctors = User.objects.filter(role='DOCTOR')
print(f"\n=== ALL DOCTORS ({doctors.count()}) ===")
for doc in doctors:
    print(f"ID: {doc.id}")
    print(f"UUID (u_id): {doc.u_id if hasattr(doc, 'u_id') else 'N/A'}")
    print(f"Username: {doc.username}")
    print(f"First Name: {doc.first_name}")
    print(f"Last Name: {doc.last_name}")
    print(f"Specialization: {doc.specialization if hasattr(doc, 'specialization') else 'N/A'}")
    print("-" * 40)
