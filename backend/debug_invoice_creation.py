import os
import django
import json
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from billing.serializers import InvoiceSerializer
from patients.models import Visit

# Get a valid visit
visit = Visit.objects.filter(patient__full_name="Kundan").first()
if not visit:
    print("No visit found for Kundan")
    exit(1)

print(f"Testing with Visit: {visit.id}")

# Mock data payload strictly matching Frontend
payload = {
    "patient_name": "Kundan",
    "payment_status": "PENDING",
    "total_amount": 2114.35,  # Example amount
    "visit": str(visit.id),
    "items": [
        {
            "dept": "CONSULTATION",
            "description": "General Consultation Fee",
            "qty": 1,
            "unit_price": 250,
            "amount": 250,
            "hsn": "",
            "batch": "",
            "gst_percent": 0,
            "expiry": "",
            "dosage": "1-0-1",
            "duration": "5 Days",
            # "stock_deducted": False # Commented out to test if this is the issue when present
        },
        {
            "dept": "PHARMACY",
            "description": "COOLNAC-SP",
            "qty": 1,
            "unit_price": 1242.9,
            "amount": 1242.9,
            "hsn": "3004",
            "batch": "B123",
            "gst_percent": 0,
            "expiry": "2026-12-31",
            "dosage": "1-0-1",
            "duration": "5 Days",
            "stock_deducted": True # This is the extra field
        }
    ]
}

print("\n--- Testing Serializer Validation ---")
serializer = InvoiceSerializer(data=payload)
if serializer.is_valid():
    print("Serializer is VALID")
    print("Validated Data Items:", serializer.validated_data.get('items'))
    
    try:
        print("\n--- Attempting Save ---")
        invoice = serializer.save()
        print(f"SUCCESS: Invoice created {invoice.id}")
    except Exception as e:
        print(f"\nFATAL ERROR during save: {e}")
        import traceback
        traceback.print_exc()
else:
    print("Serializer INVALID")
    print(serializer.errors)
