from django.urls import path

from .views import (
    # Lookup tables
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    ShelfListCreateView,
    ShelfRetrieveUpdateDestroyView,

    # Supplier
    SupplierListCreateView,
    SupplierRetrieveUpdateDestroyView,
    SupplierOutstandingListView,
    SupplierPayableSummaryView,

    # Product
    ProductListCreateView,
    ProductRetrieveUpdateDestroyView,

    # Purchase Orders
    PurchaseOrderListCreateView,
    PurchaseOrderRetrieveUpdateDestroyView,
    PurchaseOrderConfirmView,
    DraftPurchaseOrderListView,
    ConfirmedPurchaseOrderListView,

    # Supplier Payments
    SupplierPaymentListCreateView,
    SupplierPaymentDestroyView,
    PurchaseOrderPaymentSummaryView,

    # Purchase Returns
    PurchaseReturnListCreateView,
    AllPurchaseReturnsListView,
    PurchaseReturnAcceptView,

    # PDF
    PurchaseOrderPrintView,
    PurchaseOrderSavePDFView,
    PurchaseOrderSavedPDFListView,
    SavedPurchaseOrderPDFDeleteView,

    # Inventory
    InventoryListView,
    InventoryRetrieveView,
)

urlpatterns = [

    # -----------------------------------------------------------------------
    # Lookup tables
    # -----------------------------------------------------------------------
    path("categories/",        CategoryListCreateView.as_view(),          name="category-list-create"),
    path("categories/<int:pk>/", CategoryRetrieveUpdateDestroyView.as_view(), name="category-detail"),

    path("shelves/",           ShelfListCreateView.as_view(),             name="shelf-list-create"),
    path("shelves/<int:pk>/",  ShelfRetrieveUpdateDestroyView.as_view(),  name="shelf-detail"),

    # -----------------------------------------------------------------------
    # Supplier
    # -----------------------------------------------------------------------
    path("suppliers/",                       SupplierListCreateView.as_view(),          name="supplier-list-create"),
    path("suppliers/outstanding/",           SupplierOutstandingListView.as_view(),     name="supplier-outstanding-list"),
    path("suppliers/<int:pk>/",              SupplierRetrieveUpdateDestroyView.as_view(), name="supplier-detail"),
    path("suppliers/<int:pk>/payable-summary/", SupplierPayableSummaryView.as_view(),  name="supplier-payable-summary"),

    # -----------------------------------------------------------------------
    # Product
    # -----------------------------------------------------------------------
    path("products/",          ProductListCreateView.as_view(),           name="product-list-create"),
    path("products/<int:pk>/", ProductRetrieveUpdateDestroyView.as_view(), name="product-detail"),

    # -----------------------------------------------------------------------
    # Purchase Orders
    # -----------------------------------------------------------------------
    path("orders/",                    PurchaseOrderListCreateView.as_view(),          name="purchase-order-list-create"),
    path("orders/drafts/",             DraftPurchaseOrderListView.as_view(),           name="purchase-order-drafts"),
    path("orders/confirmed/",          ConfirmedPurchaseOrderListView.as_view(),       name="purchase-order-confirmed"),
    path("orders/<int:pk>/",           PurchaseOrderRetrieveUpdateDestroyView.as_view(), name="purchase-order-detail"),
    path("orders/<int:pk>/confirm/",   PurchaseOrderConfirmView.as_view(),             name="purchase-order-confirm"),

    # -----------------------------------------------------------------------
    # Supplier Payments (nested under order)
    # -----------------------------------------------------------------------
    path("orders/<int:order_id>/payments/",     SupplierPaymentListCreateView.as_view(),    name="supplier-payment-list-create"),
    path("payments/<int:pk>/",                  SupplierPaymentDestroyView.as_view(),       name="supplier-payment-delete"),
    path("orders/<int:pk>/payment-summary/",    PurchaseOrderPaymentSummaryView.as_view(),  name="purchase-order-payment-summary"),

    # -----------------------------------------------------------------------
    # Purchase Returns
    # -----------------------------------------------------------------------
    path("orders/<int:order_id>/returns/",  PurchaseReturnListCreateView.as_view(),  name="purchase-return-list-create"),
    path("returns/",                        AllPurchaseReturnsListView.as_view(),    name="purchase-return-list-all"),
    path("returns/<int:pk>/accept/",        PurchaseReturnAcceptView.as_view(),      name="purchase-return-accept"),

    # -----------------------------------------------------------------------
    # PDF
    # -----------------------------------------------------------------------
    path("orders/<int:pk>/print/",      PurchaseOrderPrintView.as_view(),         name="purchase-order-print"),
    path("orders/<int:pk>/pdf/save/",   PurchaseOrderSavePDFView.as_view(),       name="purchase-order-pdf-save"),
    path("orders/<int:pk>/pdf/",        PurchaseOrderSavedPDFListView.as_view(),  name="purchase-order-pdf-list"),
    path("pdf/<int:saved_pdf_id>/",     SavedPurchaseOrderPDFDeleteView.as_view(), name="purchase-order-pdf-delete"),

    # -----------------------------------------------------------------------
    # Inventory
    # -----------------------------------------------------------------------
    path("inventory/",                    InventoryListView.as_view(),            name="inventory-list"),
    path("inventory/<int:product_id>/",   InventoryRetrieveView.as_view(),        name="inventory-detail"),
]