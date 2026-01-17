
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit
from patients.serializers import VisitSerializer

def test_null_doctor():
    # Find a visit with a doctor
    v = Visit.objects.filter(doctor__isnull=False).first()
    if not v:
        print("No visit with doctor found to test.")
        return

    print(f"Testing Visit {v.id}, Doctor: {v.doctor}")
    
    # Try updating doctor to None using Serializer
    data = {'doctor': None, 'assigned_role': 'PHARMACY'}
    serializer = VisitSerializer(instance=v, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        v.refresh_from_db()
        print(f"Update Success. New Doctor: {v.doctor}, Role: {v.assigned_role}")
    else:
        print("Serializer Errors:", serializer.errors)

if __name__ == '__main__':
    test_null_doctor()
