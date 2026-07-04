from django.urls import path
from .views import ActiveCallsView,OnlineExtensionsView,CallLogListView,system_stats,GlobalActiveCallsView,RevenueSummaryView , RevenueAnalyticsView

urlpatterns = [
    path("active-calls/", ActiveCallsView.as_view()),
    path("online-extensions/", OnlineExtensionsView.as_view()),
    path("calls/", CallLogListView.as_view()),
    path("system/", system_stats),
    path("active-calls/global/", GlobalActiveCallsView.as_view()),
    path("revenue/summary/", RevenueSummaryView.as_view()),
    path("revenue/analytics/", RevenueAnalyticsView.as_view()),


]
