from rest_framework import generics
from rest_framework.response import Response

from .permissions import IsAdminOrSuperuser
from .selectors import (
    get_cash_collected_report_queryset,
    get_cash_collected_report_stats,
    get_invoices_report_queryset,
    get_invoices_report_stats,
)
from .serializers import (
    InvoiceReportItemSerializer,
    PaymentReportItemSerializer,
    ReportDateFilterSerializer,
)


class InvoicesReportView(generics.ListAPIView):
    """
    GET /reports/invoices/
    Non-draft invoices, filtered by confirmed date.

    Query params (mutually exclusive with each other where noted):
        date      : YYYY-MM-DD — exact day
        date_from : YYYY-MM-DD — range start
        date_to   : YYYY-MM-DD — range end

    Response:
        {"stats": {"total_invoices": int, "total_invoices_cash": decimal},
         "results": [...]}
    """
    permission_classes = [IsAdminOrSuperuser]
    serializer_class   = InvoiceReportItemSerializer

    def get_queryset(self):
        filters = ReportDateFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        return get_invoices_report_queryset(**filters.validated_data)

    def list(self, request, *args, **kwargs):
        queryset   = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        stats      = get_invoices_report_stats(queryset)
        return Response({"stats": stats, "results": serializer.data})


class CashCollectedReportView(generics.ListAPIView):
    """
    GET /reports/cash-collected/
    All payment collections (any method), filtered by payment date.

    Query params (mutually exclusive with each other where noted):
        date      : YYYY-MM-DD — exact day
        date_from : YYYY-MM-DD — range start
        date_to   : YYYY-MM-DD — range end

    Response:
        {"stats": {"total_payments": int, "total_cash_collected": decimal},
         "results": [...]}
    """
    permission_classes = [IsAdminOrSuperuser]
    serializer_class   = PaymentReportItemSerializer

    def get_queryset(self):
        filters = ReportDateFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        return get_cash_collected_report_queryset(**filters.validated_data)

    def list(self, request, *args, **kwargs):
        queryset   = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        stats      = get_cash_collected_report_stats(queryset)
        return Response({"stats": stats, "results": serializer.data})
