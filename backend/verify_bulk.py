import os
import django
import csv
import io
from datetime import datetime

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from pharmacy.models import Supplier, PharmacyStock, PurchaseInvoice, PurchaseItem
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first() # Get any user for testing

csv_content = """H,MediWMS,1.0,TEST-INV-001,02/01/2026,,,Credit,30,DIRECT,00942,DAYA PHARMACY**,1
TH,Product Code,Product Name,Batch,Expiry,EntryType,Packing,ItemPerPack,Qty,Free,Rate,PTR,MRP,TaxPerc,IsTaxable,TaxCalcType,TaxAmount,DiscountPerc,Discount,TotalAmount,ManufacturerCode,Manufacturer.Name,HSN
T,001,PARACETAMOL 500,BAT001,05/2027,SAL,10's,10.00,10.00,2.00,12.000,15.000,20.000,5.000,True,Rate,6.000,0.0000,0.000,120.000,M01,CIPLA,3004
"""

def test_bulk_upload():
    supplier_name = "RESORT MEDICALS WAYANAD"
    
    # Mock the logic
    supplier, _ = Supplier.objects.get_or_create(supplier_name=supplier_name)
    
    reader = csv.reader(io.StringIO(csv_content))
    invoice = None
    headers = []
    items_created = 0

    for row in reader:
        if not row: continue
        line_type = row[0].strip().upper()
        if line_type == 'H':
            inv_no = row[3]
            inv_date_str = row[4]
            inv_date = datetime.strptime(inv_date_str, '%d/%m/%Y').date()
            invoice = PurchaseInvoice.objects.create(
                supplier=supplier,
                supplier_invoice_no=inv_no,
                invoice_date=inv_date,
                purchase_type='CREDIT',
                total_amount=0,
                created_by=user
            )
        elif line_type == 'TH':
            headers = [h.strip() for h in row]
        elif line_type == 'T':
            data = dict(zip(headers, row))
            p_name = data.get('Product Name')
            batch = data.get('Batch')
            exp_str = data.get('Expiry')
            qty = float(data.get('Qty', 0))
            free = float(data.get('Free', 0))
            rate = float(data.get('Rate', 0))
            ptr = float(data.get('PTR', 0))
            mrp = float(data.get('MRP', 0))
            
            exp_date = datetime.strptime(exp_str, '%m/%Y').date()
            
            PurchaseItem.objects.create(
                purchase=invoice, product_name=p_name, batch_no=batch, 
                expiry_date=exp_date, qty=qty, free_qty=free, 
                purchase_rate=rate, mrp=mrp, ptr=ptr
            )
            
            stock, created = PharmacyStock.objects.get_or_create(
                name=p_name, batch_no=batch, expiry_date=exp_date, supplier=supplier,
                defaults={'qty_available': qty + free, 'mrp': mrp, 'selling_price': ptr}
            )
            if not created:
                stock.qty_available += (qty + free)
                stock.save()
            items_created += 1

    print(f"Success: {items_created} items created.")
    print(f"Stock for Paracetamol: {PharmacyStock.objects.filter(name='PARACETAMOL 500').first().qty_available}")

if __name__ == "__main__":
    test_bulk_upload()
