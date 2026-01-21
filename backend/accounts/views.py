from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import SIPUser
from .serializers import SIPUserSerializer


class SIPUserViewSet(ModelViewSet):
    queryset = SIPUser.objects.all()
    serializer_class = SIPUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["super_admin", "admin"]:
            return SIPUser.objects.all()

        if user.role == "client":
            return SIPUser.objects.filter(company=user.company)

        raise PermissionDenied("Unauthorized")

    def perform_create(self, serializer):
        sip_user = serializer.save(company=self.request.user.company)
        raw_secret = self.request.data.get("secret")
        sip_user.set_secret(raw_secret)
        sip_user.save()





from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def whoami(request):
    return Response({
        "is_authenticated": request.user.is_authenticated,
        "username": request.user.username if request.user.is_authenticated else None
    })
