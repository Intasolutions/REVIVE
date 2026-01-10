from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabInventoryViewSet, LabChargeViewSet

router = DefaultRouter()
router.register(r'inventory', LabInventoryViewSet)
router.register(r'charges', LabChargeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
