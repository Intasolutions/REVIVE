import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Visit
from medical.models import DoctorNote

# Get the most recent CLOSED visit (the one that should appear in Billing)
visit = Visit.objects.filter(status='CLOSED').order_by('-updated_at').first()

if visit:
    print(f"\n=== VISIT DATA ===")
    print(f"Visit ID: {visit.id}")
    print(f"Patient: {visit.patient.full_name if visit.patient else 'None'}")
    print(f"Status: {visit.status}")
    print(f"visit.doctor (FK): {visit.doctor}")
    print(f"visit.doctor.username: {visit.doctor.username if visit.doctor else 'NULL'}")
    print(f"Assigned Role: {visit.assigned_role}")
    
    # Check for doctor notes
    print(f"\n=== DOCTOR NOTE DATA ===")
    try:
        doctor_note = visit.doctor_note
        print(f"DoctorNote exists: Yes")
        print(f"doctor_note.doctor: {doctor_note.doctor}")
        print(f"doctor_note.doctor.username: {doctor_note.doctor.username if doctor_note.doctor else 'NULL'}")
        if hasattr(doctor_note.doctor, 'first_name'):
            print(f"doctor_note.doctor.first_name: {doctor_note.doctor.first_name}")
            print(f"doctor_note.doctor.last_name: {doctor_note.doctor.last_name}")
        print(f"Prescription: {doctor_note.prescription}")
    except DoctorNote.DoesNotExist:
        print("DoctorNote does NOT exist")
    except AttributeError as e:
        print(f"AttributeError: {e}")
    
    # Check pharmacy sales
    print(f"\n=== PHARMACY SALES DATA ===")
    sales = visit.pharmacy_sales.filter(payment_status='PENDING')
    print(f"PENDING pharmacy sales: {sales.count()}")
    for sale in sales:
        print(f"  Sale ID: {sale.id}, Items: {sale.items.count()}")
        for item in sale.items.all():
            print(f"    - {item.med_stock.name} (Qty: {item.qty})")
else:
    print("No CLOSED visits found!")
