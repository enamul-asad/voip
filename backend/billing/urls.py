
from django.urls import path
from .views import (
    InvoiceListView,
    InvoiceDownloadView,
    AdjustCreditView,
    MarkInvoicePaidView,
    CompanyBillingHistoryView,
    InvoiceDetailView,
    RevenueSummaryView,
)

urlpatterns = [
    # ==========================
    # INVOICES
    # ==========================
    path("invoices/", InvoiceListView.as_view()),
    path("invoices/download/", InvoiceDownloadView.as_view()),
    path("invoices/<int:invoice_id>/", InvoiceDetailView.as_view()),
    path("invoices/<int:invoice_id>/mark-paid/", MarkInvoicePaidView.as_view()),

    # ==========================
    # CREDIT CONTROL
    # ==========================
    path("companies/<int:company_id>/adjust-credit/", AdjustCreditView.as_view()),
    path("companies/<int:company_id>/history/", CompanyBillingHistoryView.as_view()),

    # ==========================
    # REVENUE (ADMIN)
    # ==========================
    path("revenue-summary/", RevenueSummaryView.as_view()),
]