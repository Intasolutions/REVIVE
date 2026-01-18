
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from users.models import User
from patients.models import Patient, Visit
from pharmacy.models import Supplier, PurchaseInvoice, PharmacyStock, PurchaseItem, PharmacySale, PharmacySaleItem
from lab.models import LabInventory, LabInventoryLog, LabCharge, LabTest
from billing.models import Invoice, InvoiceItem

def clear_data():
    print("Clearing REVIVE data...")

    # Billing
    # InvoiceItem -> Invoice (Cascade usually, but explicit is safer or just Invoice)
    print("Deleting Invoices...")
    Invoice.objects.all().delete() # Items cascade

    # Lab
    print("Deleting Lab Data...")
    LabCharge.objects.all().delete()
    LabInventoryLog.objects.all().delete()
    LabInventory.objects.all().delete()
    LabTest.objects.all().delete()

    # Pharmacy
    # Order matters due to PROTECT
    print("Deleting Pharmacy Sales...")
    PharmacySaleItem.objects.all().delete() # FK to Stock (PROTECT)
    PharmacySale.objects.all().delete() # Items cascade if not deleted above

    print("Deleting Pharmacy Stock...")
    # Stock has no inbound PROTECT from things we haven't deleted (SaleItems gone)
    PharmacyStock.objects.all().delete()

    print("Deleting Purchase Invoices...")
    # PurchaseInvoice -> Supplier (PROTECT)
    PurchaseItem.objects.all().delete() # just in case
    PurchaseInvoice.objects.all().delete()

    print("Deleting Suppliers...")
    Supplier.objects.all().delete()

    # Patients & Visits
    print("Deleting Visits & Patients...")
    Visit.objects.all().delete()
    Patient.objects.all().delete()

    # Users
    print("Deleting Users (keeping superusers)...")
    # Keep superusers to allow login
    User.objects.filter(is_superuser=False).delete()

    print("REVIVE Database cleared.")

if __name__ == "__main__":
    clear_data()
