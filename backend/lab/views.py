from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import LabInventory, LabCharge
from .serializers import LabInventorySerializer, LabChargeSerializer


class IsLabOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, "role", None) in ["LAB", "ADMIN"]


class LabInventoryViewSet(viewsets.ModelViewSet):
    queryset = LabInventory.objects.all().order_by('item_name')
    serializer_class = LabInventorySerializer
    permission_classes = [IsLabOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item_name', 'category']
    ordering_fields = ['qty', 'reorder_level']

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        qs = LabInventory.objects.filter(qty__lte=models.F('reorder_level')).order_by('qty')
        return Response(self.get_serializer(qs, many=True).data)


class LabChargeViewSet(viewsets.ModelViewSet):
    queryset = LabCharge.objects.all().order_by('-created_at')
    serializer_class = LabChargeSerializer
    permission_classes = [IsLabOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['test_name', 'visit__patient__full_name', 'visit__patient__phone']
    filterset_fields = ['visit', 'status']
