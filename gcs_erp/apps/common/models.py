import uuid
from datetime import datetime
from django.db import models
from django.conf import settings
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def active(self):
        return self.filter(deleted_at__isnull=True, is_active=True)

    def deleted(self):
        return self.filter(deleted_at__isnull=False)

    def delete(self):
        return super().update(deleted_at=timezone.now(), is_active=False)

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        return SoftDeleteQuerySet(self.model, using=self._db).deleted()


class TimeStampedModel(models.Model):
    """
    Standard base model with UUID primary key and audit timestamps.
    Enforces snake_case and UUID primary keys as required by section 4.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeletableModel(TimeStampedModel):
    """
    Base model supporting soft-deletion for audit trail preservation.
    """
    is_active = models.BooleanField(default=True, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])


class AuditModel(SoftDeletableModel):
    """
    Complete audit model with created_by and updated_by linkages.
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
        db_index=True
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated"
    )

    class Meta:
        abstract = True


def generate_business_id(prefix: str, count: int, year: int = None) -> str:
    """
    Generates human-readable business IDs e.g. GCS-INT-2026-000001, GCS-CERT-2026-000042
    """
    if year is None:
        year = timezone.now().year
    return f"GCS-{prefix.upper()}-{year}-{count:06d}"
