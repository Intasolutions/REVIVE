
import os
import django
import sys

# Setup Django environment
sys.path.append(r'e:\Inta Workspace\REVIVE\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import PharmacySale
from patients.models import Visit
from billing.models import Invoice

def check_linkages():
    print("--- Recent Pharmacy Sales ---")
    sales = PharmacySale.objects.order_by('-created_at')[:5]
    if not sales:
        print("No pharmacy sales found.")
    for sale in sales:
        print(f"Sale ID: {sale.id}, Visit: {sale.visit}, Amount: {sale.total_amount}, Payment: {sale.payment_status}")
        for item in sale.items.all():
            print(f"  - Item: {item.med_stock.name}, Price: {item.unit_price}, Qty: {item.qty}")

    print("\n--- Recent Closed Visits ---")
    visits = Visit.objects.filter(status='CLOSED').order_by('-updated_at')[:5]
    if not visits:
        print("No closed visits found.")
    for visit in visits:
        related_sales = visit.pharmacy_sales.all()
        print(f"Visit ID: {visit.id}, Patient: {visit.patient.full_name}, Sales Count: {related_sales.count()}")
        for s in related_sales:
            print(f"  - Linked Sale ID: {s.id}, Amount: {s.total_amount}")

if __name__ == '__main__':
    check_linkages()
