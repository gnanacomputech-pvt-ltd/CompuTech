from django.contrib import admin
from apps.website.models import ContactInquiry, StudentRegistrationInquiry, SiteContent


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'subject', 'status', 'created_at']
    list_filter = ['status', 'subject']
    search_fields = ['name', 'email', 'phone', 'message']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Submission Details', {
            'fields': ('name', 'email', 'phone', 'subject', 'message')
        }),
        ('Staff Management', {
            'fields': ('status', 'staff_notes')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    list_per_page = 30


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ['section', 'title', 'subtitle', 'display_order', 'is_active', 'updated_at']
    list_filter = ['section', 'is_active']
    search_fields = ['title', 'subtitle', 'description']
    ordering = ['section', 'display_order']
    readonly_fields = ['id', 'created_at', 'updated_at', 'created_by']
    list_per_page = 50


@admin.register(StudentRegistrationInquiry)
class StudentRegistrationInquiryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'college', 'program', 'course', 'preferred_date', 'status', 'created_at']
    list_filter = ['status', 'course', 'program']
    search_fields = ['full_name', 'email', 'phone', 'college', 'message']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Applicant Details', {
            'fields': ('full_name', 'email', 'phone', 'college')
        }),
        ('Program Preferences', {
            'fields': ('course', 'program', 'preferred_date', 'message')
        }),
        ('Staff Management', {
            'fields': ('status', 'staff_notes')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    list_per_page = 30
