from django.urls import path

from .views import (
    LedgerPrintView,
    LedgerSavedPDFDeleteView,
    LedgerSavedPDFListView,
    LedgerSavePDFView,
    SupplierLedgerBySupplierView,
    SupplierLedgerDetailView,
    SupplierLedgerListView,
)

urlpatterns = [
    # List all ledgers
    path("", SupplierLedgerListView.as_view(), name="ledger-list"),

    # Ledger by ledger id
    path("<int:pk>/", SupplierLedgerDetailView.as_view(), name="ledger-detail"),

    # Ledger by supplier id (convenience)
    path("supplier/<int:supplier_id>/", SupplierLedgerBySupplierView.as_view(), name="ledger-by-supplier"),

    # PDF — print (stream, no save)
    path("<int:pk>/print/", LedgerPrintView.as_view(), name="ledger-print"),

    # PDF — save to disk
    path("<int:pk>/pdf/save/", LedgerSavePDFView.as_view(), name="ledger-pdf-save"),

    # PDF — list saved
    path("<int:pk>/pdf/", LedgerSavedPDFListView.as_view(), name="ledger-pdf-list"),

    # PDF — delete saved
    path("pdf/<int:saved_pdf_id>/", LedgerSavedPDFDeleteView.as_view(), name="ledger-pdf-delete"),
]