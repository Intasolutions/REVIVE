from rest_framework import serializers
from .models import Patient, Visit


class PatientSerializer(serializers.ModelSerializer):
    p_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'p_id', 'full_name', 'age', 'gender', 'phone', 'address', 'id_proof', 'created_at', 'updated_at']
        read_only_fields = ['id', 'p_id', 'created_at', 'updated_at']

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
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id', 'v_id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'assigned_role',
            'status', 'vitals', 'prescription', 'lab_referral_details', 'patient_age', 'patient_gender', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'v_id', 'created_at', 'updated_at']

    prescription = serializers.SerializerMethodField()
    lab_referral_details = serializers.SerializerMethodField()

    def get_lab_referral_details(self, obj):
        if hasattr(obj, 'doctor_note'):
            return obj.doctor_note.lab_referral_details
        return None

    def get_prescription(self, obj):
        # Safely get prescription from related DoctorNote
        if hasattr(obj, 'doctor_note'):
            return obj.doctor_note.prescription
        return None

    def validate_doctor(self, doctor):
        # Allow doctor to be null if assigned_role is not DOCTOR, but if provided, must be a doctor?
        # Actually logic: If assigned_role is DOCTOR, a doctor user SHOULD arguably be selected, but maybe not mandatory immediately.
        # If doctor IS provided, they MUST be a doctor role.
        if doctor and getattr(doctor, "role", None) != "DOCTOR":
            raise serializers.ValidationError("Selected user is not a doctor.")
        return doctor
