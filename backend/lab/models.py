import uuid
from django.db import models
from django.core.validators import MinValueValidator
from core.models import BaseModel
from patients.models import Visit


class LabInventory(BaseModel):
    CATEGORY_CHOICES = (
        ('REAGENT', 'Reagent'),
        ('KIT', 'Kit'),
    )

    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    qty = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.item_name

    @property
    def is_low_stock(self):
        return self.qty <= self.reorder_level


class LabCharge(BaseModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='lab_charges')
    test_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Store dynamic test results (e.g. {"Cholesterol": {"value": "142", "unit": "mg/dl", "normal": "Up to 200 mg/dl"}})
    results = models.JSONField(null=True, blank=True)
    report_date = models.DateTimeField(null=True, blank=True)
    technician_name = models.CharField(max_length=255, blank=True, null=True)
    specimen = models.CharField(max_length=100, default='BLOOD', blank=True, null=True)

    def __str__(self):
        return f"{self.test_name} - {getattr(self.visit, 'id', self.visit.id)}"
