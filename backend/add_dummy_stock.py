
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import PharmacyStock, Supplier

def add_stock():
    supplier, _ = Supplier.objects.get_or_create(supplier_name="Test Supplier", defaults={"phone": "1234567890"})
    
    stock, created = PharmacyStock.objects.get_or_create(
        name="Paracetamol 500mg",
        batch_no="BATCH001",
        defaults={
            "supplier": supplier,
            "expiry_date": "2025-12-31",
            "qty_available": 100,
            "reorder_level": 10,
            "mrp": 10.0,
            "selling_price": 10.0,
            "hsn": "3004",
            "gst_percent": 12.0
        }
    )
    if created:
        print(f"Created stock: {stock.name}")
    else:
        print(f"Stock already exists: {stock.name}")
        stock.qty_available = 100
        stock.save()

add_stock()
