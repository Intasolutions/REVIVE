
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit
from patients.serializers import VisitSerializer
from pharmacy.models import PharmacySale

def check():
    print("Finding visit...")
    v = Visit.objects.last()
    if not v:
        print("No visit found")
        return
    
    print(f"Testing serializer on Visit {v.id}")
    try:
        data = VisitSerializer(v).data
        print("Serializer Success!")
        if 'pharmacy_items' in data:
            print(f"Pharmacy Items: {len(data['pharmacy_items'])}")
            print(data['pharmacy_items'])
        else:
            print("No pharmacy_items field found")
    except Exception as e:
        print(f"Serializer Failed: {e}")
        import traceback
        traceback.print_exc()

check()
