from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PharmacyStockViewSet, PurchaseInvoiceViewSet, PharmacySaleViewSet, PharmacyBulkUploadView

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='suppliers')
router.register(r'stock', PharmacyStockViewSet, basename='stock')
router.register(r'purchases', PurchaseInvoiceViewSet, basename='purchases')
router.register(r'sales', PharmacySaleViewSet, basename='sales')

urlpatterns = [
    path('bulk-upload/', PharmacyBulkUploadView.as_view(), name='pharmacy-bulk-upload'),
    path('', include(router.urls)),
]
