from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import datetime

from patients.models import Visit
from billing.models import Invoice
from pharmacy.models import PharmacySale
from lab.models import LabCharge, LabInventoryLog
from medical.models import DoctorNote
import csv
from django.http import HttpResponse

class BaseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # If dates are empty strings or None, default to today
        if not start_date or start_date == 'null' or start_date == 'undefined':
            start_date = timezone.now().date()
        if not end_date or end_date == 'null' or end_date == 'undefined':
            end_date = timezone.now().date()
            
        return str(start_date), str(end_date)

    def export_csv(self, filename, headers, data):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        writer = csv.writer(response)
        writer.writerow(headers)
        for row in data:
            writer.writerow(row)
        return response

class OPDReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        visits = Visit.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('patient', 'doctor')

        if request.query_params.get('export') == 'csv':
            data = [[v.id, v.patient.name, v.doctor.username if v.doctor else "N/A", v.status, v.created_at] for v in visits]
            return self.export_csv("opd_report", ["Visit ID", "Patient", "Doctor", "Status", "Date"], data)
        
        details = [{
            "id": v.id,
            "patient": v.patient.full_name,
            "doctor": v.doctor.username if v.doctor else "N/A",
            "status": v.get_status_display(),
            "date": v.created_at
        } for v in visits]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "OPD Summary",
            "details": details
        })

class DoctorReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        notes = DoctorNote.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('doctor', 'visit__patient')

        if request.query_params.get('export') == 'csv':
            data = [[n.id, n.doctor.username, n.visit.patient.name, n.diagnosis, n.created_at] for n in notes]
            return self.export_csv("doctor_report", ["Note ID", "Doctor", "Patient", "Diagnosis", "Date"], data)

        details = [{
            "id": n.id,
            "doctor": n.doctor.username,
            "patient": n.visit.patient.full_name,
            "diagnosis": n.diagnosis,
            "prescription": n.prescription,
            "notes": n.notes,
            "date": n.created_at
        } for n in notes]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "Doctor Performance",
            "details": details
        })

class FinancialReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        invoices = Invoice.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            payment_status='PAID'
        ).select_related('visit__patient')

        if request.query_params.get('export') == 'csv':
            data = [[i.id, i.visit.patient.name, i.total_amount, i.status, i.created_at] for i in invoices]
            return self.export_csv("financial_report", ["Invoice ID", "Patient", "Amount", "Status", "Date"], data)
        
        total_revenue = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
        details = [{
            "id": i.id,
            "patient": i.visit.patient.full_name if i.visit else "N/A",
            "amount": i.total_amount,
            "status": i.get_payment_status_display(),
            "date": i.created_at
        } for i in invoices]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "Financial Summary",
            "total_revenue": total_revenue,
            "details": details
        })

class PharmacySalesReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        sales = PharmacySale.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        if request.query_params.get('export') == 'csv':
            data = [[s.id, s.patient_name, s.total_amount, s.created_at] for s in sales]
            return self.export_csv("pharmacy_sales", ["Sale ID", "Patient", "Total", "Date"], data)

        details = [{
            "id": s.id,
            "patient": s.visit.patient.full_name if s.visit else "Walk-in", # Fix for pharmacy sale
            "total": s.total_amount,
            "date": s.created_at
        } for s in sales]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "Pharmacy Sales",
            "details": details
        })

class LabTestReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        tests = LabCharge.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('visit__patient')

        if request.query_params.get('export') == 'csv':
            data = [[t.id, t.visit.patient.name, t.test_name, t.amount, t.created_at] for t in tests]
            return self.export_csv("lab_report", ["Test ID", "Patient", "Test Name", "Amount", "Date"], data)

        details = [{
            "id": t.id,
            "patient": t.visit.patient.full_name,
            "test_name": t.test_name,
            "amount": t.amount,
            "date": t.created_at
        } for t in tests]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "Lab Tests",
            "details": details
        })


class LabInventoryReportView(BaseReportView):
    def get(self, request):
        start_date, end_date = self.get_date_range(request)
        
        logs = LabInventoryLog.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('item')

        if request.query_params.get('export') == 'csv':
            data = [[l.id, l.item.item_name, l.transaction_type, l.qty, l.cost, l.performed_by, l.created_at] for l in logs]
            return self.export_csv("inventory_report", ["Log ID", "Item", "Type", "Qty", "Cost", "User", "Date"], data)

        details = [{
            "id": l.id,
            "item_name": l.item.item_name,
            "type": l.transaction_type,
            "qty": l.qty,
            "cost": l.cost,
            "performed_by": l.performed_by,
            "date": l.created_at
        } for l in logs]

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "report_type": "Lab Inventory Logs",
            "details": details
        })
