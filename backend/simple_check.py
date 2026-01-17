
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()
from pharmacy.models import PharmacyStock
def check():
    for s in PharmacyStock.objects.filter(name__icontains='ESOTA'):
        print(f"Name: {s.name} | Qty: {s.qty_available} | Deleted: {s.is_deleted} | Created: {s.created_at}")
check()
