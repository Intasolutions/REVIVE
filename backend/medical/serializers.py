from rest_framework import serializers
from .models import DoctorNote, CasualtyLog


class DoctorNoteSerializer(serializers.ModelSerializer):
    note_id = serializers.UUIDField(source='id', read_only=True)
    visit_id = serializers.UUIDField(source='visit.id', read_only=True)

    class Meta:
        model = DoctorNote
        fields = ['note_id', 'visit', 'visit_id', 'diagnosis', 'prescription', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['note_id', 'created_at', 'updated_at']


class CasualtyLogSerializer(serializers.ModelSerializer):
    log_id = serializers.UUIDField(source='id', read_only=True)
    visit_id = serializers.UUIDField(source='visit.id', read_only=True)

    class Meta:
        model = CasualtyLog
        fields = ['log_id', 'visit', 'visit_id', 'transfer_path', 'treatment_notes', 'created_at', 'updated_at']
        read_only_fields = ['log_id', 'created_at', 'updated_at']
