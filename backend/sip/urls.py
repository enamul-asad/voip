from django.urls import path
from .views import (
    SIPUserListView,
    SIPUserCreateView,
    ToggleSIPUserView,
    ResetSIPPasswordView
)

urlpatterns = [
    path("users/", SIPUserListView.as_view()),
    path("users/create/", SIPUserCreateView.as_view()),
    path("users/<int:pk>/toggle/", ToggleSIPUserView.as_view()),
    path("users/<int:pk>/reset-password/", ResetSIPPasswordView.as_view()),
]