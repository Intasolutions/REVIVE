
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from rest_framework.test import APIClient
from pharmacy.models import PharmacyStock
from patients.models import Visit

def test_checkout():
    client = APIClient()
    
    # 1. Find a visit
    visit = Visit.objects.filter(status='OPEN').last()
    if not visit:
        print("No open visit found to test.")
        return

    # 2. Find a stock item
    stock = PharmacyStock.objects.filter(qty_available__gt=0).first()
    if not stock:
        print("No stock found.")
        return

    print(f"Testing Checkout for Visit {visit.id} with Stock {stock.name} (Qty: {stock.qty_available})")

    # 3. Payload
    payload = {
        "visit": visit.id,
        "items": [
            {
                "med_stock": stock.id,
                "qty": 1,
                "unit_price": float(stock.mrp)
            }
        ],
        "payment_status": "PENDING"
    }

    # 4. POST
    try:
        response = client.post('/api/pharmacy/sales/', payload, format='json')
        print(f"Response Code: {response.status_code}")
        if response.status_code != 201:
            print(f"Error Status: {response.status_code}")
            print(f"Error Body: {response.content.decode()}")
        else:
            print("Checkout Successful!")
            print(f"Sale ID: {response.data.get('id')}")
            
            # Check if stock reduced
            stock.refresh_from_db()
            print(f"New Stock Qty: {stock.qty_available}")

    except Exception as e:
        print(f"Exception: {e}")

test_checkout()
