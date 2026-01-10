from django.contrib import admin
from .models import DoctorNote, CasualtyLog

@admin.register(DoctorNote)
class DoctorNoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'visit', 'created_at')
    search_fields = ('visit__patient__full_name',)

@admin.register(CasualtyLog)
class CasualtyLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'visit', 'transfer_path', 'created_at')
