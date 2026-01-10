from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorNoteViewSet, CasualtyLogViewSet

router = DefaultRouter()
router.register(r'doctor-notes', DoctorNoteViewSet, basename='doctor-notes')
router.register(r'casualty-logs', CasualtyLogViewSet, basename='casualty-logs')

urlpatterns = [
    path('', include(router.urls)),
]
