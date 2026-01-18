from rest_framework import serializers
from .models import LabInventory, LabCharge, LabInventoryLog, LabTest, LabTestParameter


class LabTestParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestParameter
        fields = ['id', 'name', 'unit', 'normal_range']


class LabTestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    parameters = LabTestParameterSerializer(many=True, required=False)

    class Meta:
        model = LabTest
        fields = ['id', 'name', 'category', 'category_display', 'price', 'normal_range', 'parameters']

    def create(self, validated_data):
        parameters_data = validated_data.pop('parameters', [])
        lab_test = LabTest.objects.create(**validated_data)
        for param_data in parameters_data:
            LabTestParameter.objects.create(test=lab_test, **param_data)
        return lab_test

    def update(self, instance, validated_data):
        parameters_data = validated_data.pop('parameters', None)
        instance.name = validated_data.get('name', instance.name)
        instance.category = validated_data.get('category', instance.category)
        instance.price = validated_data.get('price', instance.price)
        instance.normal_range = validated_data.get('normal_range', instance.normal_range)
        instance.save()

        if parameters_data is not None:
            instance.parameters.all().delete()
            for param_data in parameters_data:
                LabTestParameter.objects.create(test=instance, **param_data)
        
        return instance



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
