import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revive_cms.settings')
django.setup()

from patients.models import Patient, Visit

# Find patient VJ
patient = Patient.objects.filter(full_name__icontains='VJ').first()
if patient:
    print(f"=== PATIENT: {patient.full_name} (ID: {patient.id}) ===\n")
    
    # Get latest visit
    visit = Visit.objects.filter(patient=patient).order_by('-created_at').first()
    if visit:
        print(f"Visit ID: {visit.id}")
        print(f"Status: {visit.status}")
        print(f"Assigned Role: {visit.assigned_role}")
        print(f"visit.doctor: {visit.doctor}")
        print(f"visit.doctor ID: {visit.doctor.id if visit.doctor else 'NULL'}")
        print(f"visit.doctor username: {visit.doctor.username if visit.doctor else 'NULL'}")
        
        # Check pharmacy sales
        sales = visit.pharmacy_sales.all()
        print(f"\nPharmacy Sales: {sales.count()}")
        for sale in sales:
            print(f"  - Payment Status: {sale.payment_status}")
            print(f"  - Items: {sale.items.count()}")
    else:
        print("No visits found for this patient")
else:
    print("Patient 'VJ' not found")
