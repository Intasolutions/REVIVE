from django.urls import path
from .views import (
    OPDReportView, FinancialReportView, DoctorReportView,
    PharmacySalesReportView, LabTestReportView, LabInventoryReportView
)

urlpatterns = [
    path('opd/', OPDReportView.as_view(), name='opd-report'),
    path('financial/', FinancialReportView.as_view(), name='financial-report'),
    path('doctor/', DoctorReportView.as_view(), name='doctor-report'),
    path('pharmacy/', PharmacySalesReportView.as_view(), name='pharmacy-report'),
    path('lab/', LabTestReportView.as_view(), name='lab-report'),
    path('inventory/', LabInventoryReportView.as_view(), name='inventory-report'),
]
