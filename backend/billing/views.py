from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from patients.models import Visit
from patients.serializers import VisitSerializer
from .models import Invoice
from .serializers import InvoiceSerializer

class IsAdminOrReception(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role in ['ADMIN', 'RECEPTION'] or request.user.is_superuser)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrReception]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['visit__patient__full_name', 'patient_name', 'payment_status']
    filterset_fields = ['payment_status', 'visit__doctor']
    ordering_fields = ['created_at', 'total_amount']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        
        # Revenue Today (Sum of paid invoices)
        revenue = Invoice.objects.filter(
            created_at__date=today, 
            payment_status='PAID'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # Pending Amount (Sum of all pending invoices)
        pending = Invoice.objects.filter(
            payment_status='PENDING'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # Invoices Count Today
        count = Invoice.objects.filter(created_at__date=today).count()

        return Response({
            'revenue_today': revenue,
            'pending_amount': pending,
            'invoices_today': count
        })

    @action(detail=False, methods=['get'])
    def pending_visits(self, request):
        # Pending Billing: Closed Visits that do not have an associated invoice
        # Note: In a real app we might check if 'visit__invoices__isnull=True', 
        # but since related_name='invoices' (one to many?) actually it's one-to-many. 
        # If we want one invoice per visit, we check if any invoice exists.
        
        visits = Visit.objects.filter(status='CLOSED', invoices__isnull=True).order_by('-updated_at')
        serializer = VisitSerializer(visits, many=True)
        return Response(serializer.data)
