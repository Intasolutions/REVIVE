from rest_framework import serializers
from .models import DoctorNote


class DoctorNoteSerializer(serializers.ModelSerializer):
    note_id = serializers.UUIDField(source='id', read_only=True)
    visit_id = serializers.UUIDField(source='visit.id', read_only=True)

    created_by = serializers.UUIDField(source='created_by.id', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = DoctorNote
        fields = ['note_id', 'visit', 'visit_id', 'diagnosis', 'prescription', 'notes', 'lab_referral_details', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['note_id', 'created_at', 'updated_at']


