
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import PharmacyStock, PharmacySaleItem

def check_stock():
    print("--- Stock Check ---")
    stocks = PharmacyStock.objects.filter(name__icontains='ESOTA')
    for s in stocks:
        print(f"ID: {s.id} | Name: {s.name} | Batch: {s.batch_no} | Qty: {s.qty_available}")

    print("\n--- Recent Sales Items ---")
    sales = PharmacySaleItem.objects.filter(med_stock__name__icontains='ESOTA').order_by('-created_at')[:5]
    for si in sales:
        print(f"Sale: {si.sale.id} | Med: {si.med_stock.name} | Qty Sold: {si.qty} | Date: {si.created_at}")

if __name__ == '__main__':
    check_stock()
