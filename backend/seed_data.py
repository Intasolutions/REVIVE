import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from django.contrib.auth import get_user_model
from patients.models import Patient, Visit
from billing.models import Invoice
from pharmacy.models import PharmacyStock, PharmacySale, PharmacySaleItem, Supplier
from medical.models import DoctorNote
from lab.models import LabCharge

User = get_user_model()

def seed_data():
    print("Seeding database with dummy data...")
    
    # 1. Ensure we have users
    admin = User.objects.filter(username='inta').first()
    if not admin:
        admin = User.objects.create_superuser('inta', 'inta@example.com', 'inta123', role='ADMIN')
    
    doctor = User.objects.filter(username='doctor_vijay').first()
    if not doctor:
        doctor = User.objects.create_user('doctor_vijay', 'vijay@revive.com', 'pwd123', role='DOCTOR')

    # 2. Dummy Patients
    names = ["Rahul Sharma", "Anjali Gupta", "Amit Singh", "Suresh Kumar", "Priya Verma"]
    patients = []
    for name in names:
        p, created = Patient.objects.get_or_create(
            phone=f"98765{random.randint(10000, 99999)}",
            defaults={
                'full_name': name,
                'age': random.randint(20, 60),
                'gender': random.choice(['M', 'F']),
                'address': "Lucknow, India"
            }
        )
        patients.append(p)

    # 3. Dummy Visits & Invoices & Notes
    now = timezone.now()
    for i in range(15):
        days_ago = random.randint(0, 10)
        v_date = now - timedelta(days=days_ago)
        
        p = random.choice(patients)
        v = Visit.objects.create(
            patient=p,
            doctor=doctor,
            status='CLOSED', # Since they are completed
        )
        # Manually sets created_at since it's auto_now_add
        Visit.objects.filter(id=v.id).update(created_at=v_date)
        v.refresh_from_db()
        
        # Doctor Note
        DoctorNote.objects.create(
            visit=v,
            diagnosis="Seasonal Viral Fever" if i % 2 == 0 else "Routine Health Checkup",
            prescription={"tablets": "Paracetamol 500mg", "frequency": "1-0-1"},
        )
        DoctorNote.objects.filter(visit=v).update(created_at=v_date)

        # Invoice
        Invoice.objects.create(
            visit=v,
            total_amount=random.randint(500, 2500),
            payment_status='PAID',
        )
        Invoice.objects.filter(visit=v).update(created_at=v_date)

        # Lab Charges
        tests = ["Complete Blood Count", "Blood Glucose", "Lipid Profile", "Liver Function Test"]
        LabCharge.objects.create(
            visit=v,
            test_name=random.choice(tests),
            amount=random.randint(200, 1500)
        )
        LabCharge.objects.filter(visit=v).update(created_at=v_date)

    # 4. Pharmacy Data
    supplier, _ = Supplier.objects.get_or_create(supplier_name="MediWMS Central", defaults={'phone': '1234567890', 'address': 'Main St'})
    
    medicines = ["Paracetamol", "Amoxicillin", "Cough Syrup", "Vitamin C", "Aspirin"]
    for med in medicines:
        stock = PharmacyStock.objects.create(
            name=med,
            batch_no=f"BATCH-{random.randint(100,999)}",
            expiry_date=now.date() + timedelta(days=365),
            qty_available=random.randint(50, 200),
            mrp=random.randint(10, 500),
            selling_price=random.randint(8, 480),
            supplier=supplier
        )
        
        # Some sales
        sale = PharmacySale.objects.create(
            visit=None,
            total_amount=stock.selling_price * 2,
            payment_status='PAID'
        )
        PharmacySale.objects.filter(id=sale.id).update(created_at=now - timedelta(days=random.randint(0,5)))
        
        PharmacySaleItem.objects.create(
            sale=sale,
            med_stock=stock,
            qty=2,
            unit_price=stock.selling_price,
            amount=stock.selling_price * 2
        )

    print("Success: Database seeded with analytics-ready data!")

if __name__ == "__main__":
    seed_data()
