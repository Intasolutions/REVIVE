from rest_framework import serializers
from .models import LabInventory, LabCharge, LabInventoryLog, LabTest


class LabTestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = LabTest
        fields = ['id', 'name', 'category', 'category_display', 'price', 'normal_range']



class LabInventoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabInventoryLog
        fields = ['id', 'item', 'transaction_type', 'qty', 'cost', 'performed_by', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class LabInventorySerializer(serializers.ModelSerializer):
    item_id = serializers.UUIDField(source='id', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    logs = LabInventoryLogSerializer(many=True, read_only=True)

    class Meta:
        model = LabInventory
        fields = ['item_id', 'item_name', 'category', 'qty', 'cost_per_unit', 'reorder_level', 'is_low_stock', 'logs', 'created_at', 'updated_at']
        read_only_fields = ['item_id', 'is_low_stock', 'logs', 'created_at', 'updated_at']


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
