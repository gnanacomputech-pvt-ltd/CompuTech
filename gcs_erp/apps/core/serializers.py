from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from apps.core.models import (
    User, Role, Permission, UserRole, Institution,
    Department, Program, Batch, Student, Employee, Enrollment
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer enriching token response with roles and user profile.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['roles'] = user.get_role_codes()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        roles = user.get_role_codes()

        # Gather all permissions across roles
        permissions = list(
            Permission.objects.filter(
                perm_roles__role__user_roles__user=user
            ).values_list('code', flat=True).distinct()
        )

        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'roles': roles,
            'permissions': permissions
        }

        # Include linked student or employee ID if present
        if hasattr(user, 'student_profile'):
            data['user']['student_id'] = user.student_profile.business_id
            data['user']['institution_id'] = str(user.student_profile.institution_id)
        if hasattr(user, 'employee_profile'):
            data['user']['employee_id'] = user.employee_profile.employee_id

        data['_message'] = "Login successful"
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect existing password.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    """Request password reset — just needs a valid email format."""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token, uid, and the new password."""
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'is_active', 'is_staff', 'is_verified', 'avatar', 'roles', 'created_at']
        read_only_fields = ['id', 'created_at', 'roles']

    def get_roles(self, obj):
        return obj.get_role_codes()


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BatchSerializer(serializers.ModelSerializer):
    program_title = serializers.ReadOnlyField(source='program.title')
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user.full_name')
    student_usn = serializers.ReadOnlyField(source='student.usn')
    program_title = serializers.ReadOnlyField(source='program.title')
    batch_name = serializers.ReadOnlyField(source='batch.name')
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'enrolled_at', 'created_at', 'updated_at']
