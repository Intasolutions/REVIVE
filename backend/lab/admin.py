from django.contrib import admin
from .models import LabInventory, LabCharge

@admin.register(LabInventory)
class LabInventoryAdmin(admin.ModelAdmin):
    list_display = ('item_name', 'category', 'qty', 'reorder_level')
    list_filter = ('category',)
    search_fields = ('item_name',)

@admin.register(LabCharge)
class LabChargeAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'amount', 'visit', 'created_at')
