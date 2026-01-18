
import os
import django
from django.conf import settings
from rest_framework.test import APIRequestFactory

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Patient
from pharmacy.models import PharmacySale, PharmacySaleItem, PharmacyStock
from pharmacy.views import PharmacySaleViewSet
from users.models import CustomUser

def test_endpoint():
    # 1. Setup Data
    user, _ = CustomUser.objects.get_or_create(username="test_admin", role="ADMIN")
    patient, _ = Patient.objects.get_or_create(full_name="Test Patient Endpoint", phone="9999999999")
    
    # Create Stock
    stock, _ = PharmacyStock.objects.get_or_create(
        name="Paracetamol", 
        batch_no="B123", 
        expiry_date="2030-01-01",
        defaults={'mrp': 10.0, 'selling_price': 10.0, 'qty_available': 100}
    )

    # Create Pending Sale
    sale = PharmacySale.objects.create(patient=patient, payment_status='PENDING', total_amount=20, visit=None)
    PharmacySaleItem.objects.create(sale=sale, med_stock=stock, qty=2, unit_price=10.0, amount=20.0)

    print(f"Created Sale ID: {sale.id} for Patient: {patient.id}")

    # 2. Test View
    factory = APIRequestFactory()
    view = PharmacySaleViewSet.as_view({'get': 'pending_by_patient'})
    
    request = factory.get(f'/api/pharmacy/sales/pending_by_patient/?patient_id={patient.id}')
    request.user = user
    
    response = view(request)
    
    print("Response Status:", response.status_code)
    print("Response Data:", response.data)

    if response.status_code == 200 and len(response.data) > 0:
        print("SUCCESS: Endpoint returned items.")
        print("Item Name:", response.data[0]['name'])
    else:
        print("FAILURE: Endpoint did not return expected data.")

if __name__ == "__main__":
    test_endpoint()
