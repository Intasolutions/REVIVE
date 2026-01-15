import json
from rest_framework.test import APIClient
from patients.models import Visit, Patient
from patients.serializers import VisitSerializer
from django.contrib.auth import get_user_model
from django.conf import settings

# FIX HOST ISSUE
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ['testserver']

# 2. Test View via Client with Exception Raising
print("\n--- Testing View ---")
User = get_user_model()
user, _ = User.objects.get_or_create(username='test_admin', role='ADMIN')
client = APIClient(enforce_csrf_checks=False) 
client.handler._force_user = user 
client.force_authenticate(user=user)

p, _ = Patient.objects.get_or_create(full_name='Test Valid 2', phone='2222222222', defaults={'age':20, 'gender':'F', 'address':'X'})
v, _ = Visit.objects.get_or_create(patient=p, status='OPEN')

payload = {
    "vitals": {"bp": "110/70", "temp": "99"},
    "assigned_role": "DOCTOR"
}

try:
    # Use correct URL prefix /api/
    response = client.patch(f'/api/reception/visits/{v.id}/', data=payload, format='json')
    print(f"Response Code: {response.status_code}")
    if response.status_code != 200:
        print("Error content first 2000 chars:")
        print(response.content.decode('utf-8')[:2000])
except Exception as e:
    print(f"EXCEPTION CAUGHT: {e}")
    import traceback
    traceback.print_exc()

v.refresh_from_db()
print(f"DB Vitals: {v.vitals}")
