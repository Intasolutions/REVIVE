from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from revive_cms.utils import export_to_csv

from .models import Patient, Visit
from .serializers import PatientSerializer, VisitSerializer


from .permissions import IsReceptionistOrAdmin

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsReceptionistOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'phone']

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        return export_to_csv(
            self.get_queryset(), 
            "patients", 
            ['id', 'full_name', 'age', 'gender', 'phone', 'created_at']
        )

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """
        Flow:
        - Search by phone
        - If exists -> return existing patient
        - Else -> create new patient
        """
        phone = (request.data.get("phone") or "").strip()
        if not phone:
            return Response({"phone": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        existing = Patient.objects.filter(phone=phone).first()
        if existing:
            return Response(PatientSerializer(existing).data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all().order_by('-created_at')
    serializer_class = VisitSerializer
    permission_classes = [IsReceptionistOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'patient', 'doctor', 'assigned_role']
    search_fields = ['patient__full_name', 'patient__phone']
    ordering_fields = ['created_at', 'updated_at']

    def perform_create(self, serializer):
        visit = serializer.save()
        if visit.doctor:
            from core.models import Notification
            Notification.objects.create(
                recipient=visit.doctor,
                message=f"New patient assigned: {visit.patient.full_name}",
                type='VISIT_ASSIGNED',
                related_id=visit.id
            )

    def perform_update(self, serializer):
        old_doctor = serializer.instance.doctor
        visit = serializer.save()
        if visit.doctor and visit.doctor != old_doctor:
            from core.models import Notification
            Notification.objects.create(
                recipient=visit.doctor,
                message=f"New patient assigned: {visit.patient.full_name}",
                type='VISIT_ASSIGNED',
                related_id=visit.id
            )
