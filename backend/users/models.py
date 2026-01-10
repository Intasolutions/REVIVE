import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import BaseModel


class User(AbstractUser, BaseModel):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('RECEPTION', 'Reception'),
        ('DOCTOR', 'Doctor'),
        ('LAB', 'Lab'),
        ('PHARMACY', 'Pharmacy'),
        ('CASUALTY', 'Casualty'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='RECEPTION')

    def __str__(self):
        return self.username
