from django.db.models.signals import post_save
from django.dispatch import receiver
from patients.models import Visit
from .models import Invoice, InvoiceItem

@receiver(post_save, sender=Visit)
def create_consultation_invoice(sender, instance, created, **kwargs):
    if created:
        # Automatically create a consultation invoice when a visit is registered
        invoice = Invoice.objects.create(
            visit=instance,
            patient_name=instance.patient.full_name,
            total_amount=500.00,  # Default consultation fee
            payment_status='PENDING'
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            dept='CONSULTATION',
            description='General Consultation Fee',
            amount=500.00
        )
