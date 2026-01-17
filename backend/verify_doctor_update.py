
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit, Patient
from users.models import User
from patients.serializers import VisitSerializer

def verify_update():
    # 1. Create Data
    doc, _ = User.objects.get_or_create(username='testdoc', role='DOCTOR', defaults={'email': 'doc@test.com'})
    pat, _ = Patient.objects.get_or_create(phone='9998887776', defaults={'full_name': 'Test Pat', 'age': 30, 'gender': 'M'})
    
    visit = Visit.objects.create(patient=pat, doctor=doc, assigned_role='DOCTOR')
    print(f"Created Visit {visit.id} assigned to {visit.doctor}")

    # 2. Update via Serializer (simulate PATCH)
    data = {'doctor': None, 'assigned_role': 'PHARMACY'}
    serializer = VisitSerializer(instance=visit, data=data, partial=True)
    
    if serializer.is_valid():
        print("Serializer Valid.")
        serializer.save()
        visit.refresh_from_db()
        print(f"Post-Update: Doctor is {visit.doctor}, Role is {visit.assigned_role}") # Should be None and PHARMACY
    else:
        print("Serializer Errors:", serializer.errors)

if __name__ == '__main__':
    verify_update()
