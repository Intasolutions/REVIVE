
import os
import django
import random
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from users.models import User
from patients.models import Patient, Visit
from pharmacy.models import Supplier, PharmacyStock, PharmacySale, PharmacySaleItem
from lab.models import LabTest, LabCharge
from billing.models import Invoice

def seed_data():
    print("Seeding REVIVE data with realistic entries...")

    # 1. Users
    roles = ['DOCTOR', 'RECEPTION', 'PHARMACY', 'LAB', 'ADMIN']
    users = {}
    for role in roles:
        username = f"{role.lower()}_user"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f"{username}@test.com",
                'role': role,
                'is_staff': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created User: {username}")
        users[role] = user

    # 2. Lab Tests
    lab_data = [
        ("CBC", "HAEMATOLOGY", 350),
        ("Lipid Profile", "BIOCHEMISTRY", 800),
        ("Thyroid Profile (T3, T4, TSH)", "BIOCHEMISTRY", 1200),
        ("Blood Urea", "BIOCHEMISTRY", 150),
        ("Creatinine", "BIOCHEMISTRY", 200),
        ("Urine Routine", "CLINICAL_PATHOLOGY", 100),
        ("HBA1c", "BIOCHEMISTRY", 400),
    ]
    for name, cat, price in lab_data:
        LabTest.objects.get_or_create(
            name=name,
            defaults={
                'category': cat,
                'price': Decimal(price),
                'normal_range': 'See Report'
            }
        )
    print(f"Seeded {len(lab_data)} Lab Tests.")

    # 3. Pharmacy Suppliers
    suppliers = []
    supplier_names = ["Apollo Pharma", "MedPlus Distributors", "Sun Pharma Agencies"]
    for name in supplier_names:
        s, _ = Supplier.objects.get_or_create(supplier_name=name, defaults={'is_active': True})
        suppliers.append(s)

    # 4. Pharmacy Inventory (Stocks)
    medicine_data = [
        ("Paracetamol 500mg", "BATCH001", 200, 2.00, 1.50, "GSK"),
        ("Amoxicillin 500mg", "BATCH002", 500, 10.00, 8.00, "Sun Pharma"),
        ("Cetirizine 10mg", "BATCH003", 300, 5.00, 3.50, "Dr. Reddy"),
        ("Metformin 500mg", "BATCH004", 400, 4.00, 2.50, "USV"),
        ("Pantoprazole 40mg", "BATCH005", 250, 8.00, 5.00, "Torrent"),
        ("Vitamin C Chewable", "BATCH006", 1000, 3.00, 1.50, "Abbott"),
    ]
    
    for name, batch, qty, mrp, ptr, mfr in medicine_data:
        PharmacyStock.objects.get_or_create(
            name=name,
            batch_no=batch,
            defaults={
                'expiry_date': timezone.now().date() + timedelta(days=random.randint(200, 700)),
                'supplier': random.choice(suppliers),
                'mrp': Decimal(mrp),
                'selling_price': Decimal(mrp), # Selling at MRP usually
                'qty_available': qty,
                'hsn': '3004',
                'manufacturer': mfr,
                'gst_percent': 12.0
            }
        )
    print(f"Seeded {len(medicine_data)} Medicines in Stock.")

    # 5. Patients & Visits (To test flow)
    # Create 3 patients
    patients = []
    for i in range(1, 4):
        p, _ = Patient.objects.get_or_create(
            phone=f"900000000{i}",
            defaults={
                'full_name': f"Test Patient {i}",
                'age': 25 + i * 5,
                'gender': 'M' if i % 2 else 'F'
            }
        )
        patients.append(p)
    
    # Create 1 Open Visit
    Visit.objects.get_or_create(
        patient=patients[0],
        status='OPEN',
        defaults={'doctor': users['DOCTOR'], 'assigned_role': 'DOCTOR'}
    )
    print("Created 1 Open Visit for Test Patient 1")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
