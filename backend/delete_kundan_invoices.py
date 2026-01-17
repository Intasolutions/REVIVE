import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from billing.models import Invoice

# Delete all invoices for Kundan's visits
deleted_count = Invoice.objects.filter(patient_name__icontains='Kundan').delete()
print(f"Deleted {deleted_count[0]} invoices for Kundan")
