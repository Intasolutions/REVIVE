import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import PharmacyStock, Supplier
from decimal import Decimal
from datetime import date

# Get or create a default supplier
supplier, _ = Supplier.objects.get_or_create(
    supplier_name="Default Supplier",
    defaults={'phone': '0000000000'}
)

# Add stock for COOLNAC-SP
stock, created = PharmacyStock.objects.update_or_create(
    name="COOLNAC-SP",
    batch_no="BD2615760",
    expiry_date=date(2026, 12, 31),
    supplier=supplier,
    defaults={
        'qty_available': 100,  # Add 100 units
        'selling_price': Decimal('41.43'),  # ₹1242.90 / 30 tablets
        'mrp': Decimal('1242.90'),
        'hsn': '30049099',
        'gst_percent': Decimal('12.00'),
        'manufacturer': 'Generic Pharma',
        'reorder_level': 20
    }
)

if created:
    print(f"✅ Created new stock for COOLNAC-SP")
else:
    print(f"✅ Updated existing stock for COOLNAC-SP")

print(f"Available quantity: {stock.qty_available}")
print(f"Batch: {stock.batch_no}")
