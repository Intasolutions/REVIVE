from rest_framework import serializers
from .models import LabInventory, LabCharge


class LabInventorySerializer(serializers.ModelSerializer):
    item_id = serializers.UUIDField(source='id', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = LabInventory
        fields = ['item_id', 'item_name', 'category', 'qty', 'reorder_level', 'is_low_stock', 'created_at', 'updated_at']
        read_only_fields = ['item_id', 'is_low_stock', 'created_at', 'updated_at']


class LabChargeSerializer(serializers.ModelSerializer):
    lc_id = serializers.UUIDField(source='id', read_only=True)
    visit_id = serializers.UUIDField(source='visit.id', read_only=True)
    patient_name = serializers.CharField(source='visit.patient.full_name', read_only=True)
    patient_age = serializers.CharField(source='visit.patient.age', read_only=True)
    patient_sex = serializers.CharField(source='visit.patient.gender', read_only=True)

    class Meta:
        model = LabCharge
        fields = [
            'lc_id', 'visit', 'visit_id', 'patient_name', 'patient_age', 'patient_sex',
            'test_name', 'amount', 'status', 'results', 'report_date', 'technician_name',
            'specimen', 'created_at', 'updated_at'
        ]
        read_only_fields = ['lc_id', 'created_at', 'updated_at']
