from rest_framework.permissions import BasePermission

class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )
class IsCompanyActive(BasePermission):

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Admins bypass company check
        if request.user.role in ["admin", "super_admin"]:
            return True

        company = getattr(request.user, "company", None)

        if company and not company.is_active:
            return False

        return True
    



class IsAdminRole(BasePermission):
    """
    Allows access only to admin or super_admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["admin", "super_admin"]
        )


class IsClientRole(BasePermission):
    """
    Allows access only to client users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "client"
        )


class IsSuperAdminRole(BasePermission):
    """
    Allows access only to super_admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "super_admin"
        )