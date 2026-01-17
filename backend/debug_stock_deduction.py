
import os
import django
import uuid
from decimal import Decimal
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import PharmacyStock, Supplier
from pharmacy.serializers import PharmacySaleSerializer

def test_stock_deduction():
    # 1. Setup Data
    supplier, _ = Supplier.objects.get_or_create(supplier_name="Test Supplier")
    stock = PharmacyStock.objects.create(
        name="Test Med",
        batch_no=str(uuid.uuid4())[:8],
        expiry_date="2027-01-01",
        mrp=Decimal("100.00"),
        selling_price=Decimal("90.00"),
        qty_available=100,
        supplier=supplier
    )
    print(f"Created Stock: {stock.name}, Batch: {stock.batch_no}, Qty: {stock.qty_available}")

    # 2. Prepare Payload (simulating request data)
    payload = {
        'items': [
            {
                'med_stock': str(stock.id), # Serializer expects UUID for FK if not read_only
                'qty': 10,
                'unit_price': 90.00
            }
        ],
        'payment_status': 'PAID'
    }

    # 3. Serialize & Save
    serializer = PharmacySaleSerializer(data=payload)
    if serializer.is_valid():
        print("Serializer Valid.")
        sale = serializer.save()
        print(f"Sale Created: {sale.id}, Amount: {sale.total_amount}")
        
        # 4. Verify Stock
        stock.refresh_from_db()
        print(f"Post-Sale Stock Qty: {stock.qty_available}")
        
        if stock.qty_available == 90:
            print("SUCCESS: Stock deduction working.")
        else:
            print("FAILURE: Stock NOT deducted.")
    else:
        print("Serializer Errors:", serializer.errors)

if __name__ == '__main__':
    test_stock_deduction()
