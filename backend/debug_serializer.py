
import os
import django
import sys
import json
from decimal import Decimal

# Setup Django environment
sys.path.append(r'e:\Inta Workspace\REVIVE\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit
from patients.serializers import VisitSerializer

def debug_serializer():
    print("--- Debugging Visit Serializer ---")
    # Find a visit with pharmacy sales
    visit = Visit.objects.filter(pharmacy_sales__isnull=False).last()
    
    if not visit:
        print("No visits with pharmacy sales found.")
        return

    print(f"Testing Visit ID: {visit.id}, Patient: {visit.patient.full_name if visit.patient else 'None'}")
    print(f"Status: {visit.status}")
    print(f"Pharmacy Sales Count: {visit.pharmacy_sales.count()}")
    
    # Check manual relation access
    sales = visit.pharmacy_sales.all()
    for s in sales:
        print(f"  Sale {s.id}: Status={s.payment_status}, Amount={s.total_amount}")
        for i in s.items.all():
             print(f"    Item: {i.med_stock.name}, Amt: {i.amount}")

    # Run Serializer
    serializer = VisitSerializer(visit)
    data = serializer.data
    
    print("\n--- Serialized Data ---")
    pharmacy_items = data.get('pharmacy_items', [])
    print(f"Pharmacy Items Count: {len(pharmacy_items)}")
    print(json.dumps(pharmacy_items, indent=2, default=str))

if __name__ == '__main__':
    debug_serializer()
