from django.urls import path
from .views import (
    OPDReportView, FinancialReportView, 
    PharmacySalesReportView, LabTestReportView,
    DoctorReportView
)

urlpatterns = [
    path('opd/', OPDReportView.as_view(), name='report-opd'),
    path('financial/', FinancialReportView.as_view(), name='report-financial'),
    path('pharmacy/', PharmacySalesReportView.as_view(), name='report-pharmacy'),
    path('lab/', LabTestReportView.as_view(), name='report-lab'),
    path('doctor/', DoctorReportView.as_view(), name='report-doctor'),
]
