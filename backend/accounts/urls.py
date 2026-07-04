from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    MeView,
    CompanySettingsView,
    LogoutAllView,
    ChangePasswordView,
    BalanceStatusView,
    CreateCompanyUserView,
)

from .views_admin import AdminCompanyViewSet



# 🔹 Admin router
admin_router = DefaultRouter()
admin_router.register(
    "admin/companies",
    AdminCompanyViewSet,
    basename="admin-companies"
)

urlpatterns = [
    # -------- AUTH --------
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("me/", MeView.as_view()),

    # -------- CLIENT --------
    path("balance-status/", BalanceStatusView.as_view()),
    path("settings/company/", CompanySettingsView.as_view()),
    path("logout-all/", LogoutAllView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
    path("admin/companies/<int:company_id>/users/", CreateCompanyUserView.as_view()
),

    # -------- ADMIN --------
    path("", include(admin_router.urls)),
]
