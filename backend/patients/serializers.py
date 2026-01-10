from rest_framework import serializers
from .models import Patient, Visit


class PatientSerializer(serializers.ModelSerializer):
    p_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Patient
        fields = ['p_id', 'full_name', 'age', 'gender', 'phone', 'address', 'id_proof', 'created_at', 'updated_at']
        read_only_fields = ['p_id', 'created_at', 'updated_at']

    def validate_phone(self, value):
        cleaned = value.strip()
        # simple validation; adjust for your country format if needed
        if not cleaned.isdigit():
            raise serializers.ValidationError("Phone must contain only digits.")
        if len(cleaned) < 8 or len(cleaned) > 15:
            raise serializers.ValidationError("Phone length must be between 8 and 15 digits.")
        return cleaned


class VisitSerializer(serializers.ModelSerializer):
    v_id = serializers.UUIDField(source='id', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id', 'v_id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'status', 'vitals', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'v_id', 'created_at', 'updated_at']

    def validate_doctor(self, doctor):
        if doctor and getattr(doctor, "role", None) != "DOCTOR":
            raise serializers.ValidationError("Selected user is not a doctor.")
        return doctor
