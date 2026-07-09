from datetime import date as date_cls, datetime, time
from datetime import timezone as dt_timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Count, QuerySet, Sum
from django.db.models.functions import Coalesce

from billing.models import Invoice, Payment

# Business operates in Pakistan; "which day" an invoice was confirmed must be
# judged in local time, not the UTC day the DateTimeField happens to store.
LOCAL_TZ = ZoneInfo("Asia/Karachi")


def _clean(value):
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


def _local_day_bounds(day: date_cls) -> tuple[datetime, datetime]:
    """
    UTC datetime range covering one full local (Asia/Karachi) calendar day.
    Needed because Invoice.confirmed_at is a UTC-stored DateTimeField —
    Django's default `__date` lookup uses settings.TIME_ZONE (UTC), which
    silently shifts a Pakistan-evening confirmation onto the next UTC day.
    """
    start_local = datetime.combine(day, time.min, tzinfo=LOCAL_TZ)
    end_local   = datetime.combine(day, time.max, tzinfo=LOCAL_TZ)
    return start_local.astimezone(dt_timezone.utc), end_local.astimezone(dt_timezone.utc)


# ---------------------------------------------------------------------------
# Invoices report
# ---------------------------------------------------------------------------

def get_invoices_report_queryset(
    *,
    date      : date_cls = None,
    date_from : date_cls = None,
    date_to   : date_cls = None,
) -> QuerySet:
    """
    Non-draft invoices (confirmed/partial/returned — all real, finalized
    invoices), filtered by their confirmed_at date (Pakistan local day).
    """
    qs = Invoice.objects.filter(is_deleted=False).exclude(
        status=Invoice.Status.DRAFT,
    ).select_related("customer").order_by("-confirmed_at")

    if date:
        start, end = _local_day_bounds(date)
        qs = qs.filter(confirmed_at__gte=start, confirmed_at__lte=end)
    if date_from:
        start, _end = _local_day_bounds(date_from)
        qs = qs.filter(confirmed_at__gte=start)
    if date_to:
        _start, end = _local_day_bounds(date_to)
        qs = qs.filter(confirmed_at__lte=end)

    return qs


def get_invoices_report_stats(queryset: QuerySet) -> dict:
    return queryset.aggregate(
        total_invoices     = Count("id"),
        total_invoices_cash = Coalesce(Sum("grand_total"), Decimal("0")),
    )


# ---------------------------------------------------------------------------
# Cash collected report
# ---------------------------------------------------------------------------

def get_cash_collected_report_queryset(
    *,
    date      : str = None,
    date_from : str = None,
    date_to   : str = None,
) -> QuerySet:
    """
    All payment collections (any method) — money that actually came in.
    Filtered by payment_date.
    """
    qs = Payment.objects.filter(
        is_deleted=False, amount__gt=0,
    ).select_related("invoice__customer").order_by("-payment_date")

    if _clean(date):
        qs = qs.filter(payment_date=_clean(date))
    if _clean(date_from):
        qs = qs.filter(payment_date__gte=_clean(date_from))
    if _clean(date_to):
        qs = qs.filter(payment_date__lte=_clean(date_to))

    return qs


def get_cash_collected_report_stats(queryset: QuerySet) -> dict:
    return queryset.aggregate(
        total_payments        = Count("id"),
        total_cash_collected  = Coalesce(Sum("amount"), Decimal("0")),
    )
