from decimal import Decimal

from django.db.models import Q, QuerySet, Sum
from django.db.models.functions import Coalesce
from django.db.models import DecimalField, Value
from django.shortcuts import get_object_or_404

from .models import (
    Category, Inventory, Product, PurchaseItem,
    PurchaseOrder, PurchaseReturn, Shelf, Supplier,
)


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

def get_all_categories():
    return Category.objects.filter(is_deleted=False)

def get_category_by_id(pk: int) -> Category:
    return get_object_or_404(Category, pk=pk, is_deleted=False)


# ---------------------------------------------------------------------------
# Shelf
# ---------------------------------------------------------------------------

def get_all_shelves():
    return Shelf.objects.filter(is_deleted=False)

def get_shelf_by_id(pk: int) -> Shelf:
    return get_object_or_404(Shelf, pk=pk, is_deleted=False)


# ---------------------------------------------------------------------------
# Supplier
# ---------------------------------------------------------------------------

def get_all_suppliers(*, search: str = None) -> QuerySet:
    qs = Supplier.objects.filter(is_deleted=False)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search))
    return qs

def get_supplier_by_id(pk: int) -> Supplier:
    return get_object_or_404(Supplier, pk=pk, is_deleted=False)


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

def get_all_products():
    return Product.objects.select_related("category", "shelf").filter(is_deleted=False)

def get_product_by_id(pk: int) -> Product:
    return get_object_or_404(
        Product.objects.select_related("category", "shelf"),
        pk=pk, is_deleted=False,
    )


# ---------------------------------------------------------------------------
# PurchaseOrder
# ---------------------------------------------------------------------------

def _order_qs():
    return PurchaseOrder.objects.select_related(
        "supplier", "created_by", "updated_by", "confirmed_by", "deleted_by",
    ).prefetch_related(
        "items__product",
        "items__product__category",
        "items__product__shelf",
        "payments",
        "returns__items__purchase_item__product",
    )


def get_all_purchase_orders(
    *,
    status         : str = None,
    supplier_name  : str = None,
    supplier_code  : str = None,
    order_number   : str = None,
    date           : str = None,
    date_from      : str = None,
    date_to        : str = None,
    payment_status : str = None,
    min_amount     : str = None,
    max_amount     : str = None,
) -> QuerySet:
    """Master filter selector — every list view uses this."""
    qs = _order_qs().filter(is_deleted=False)

    if status:
        qs = qs.filter(status=status)
    if supplier_name:
        qs = qs.filter(supplier__name__icontains=supplier_name)
    if supplier_code:
        qs = qs.filter(supplier__code__icontains=supplier_code)
    if order_number:
        qs = qs.filter(order_number__icontains=order_number)
    if date:
        qs = qs.filter(created_at__date=date)
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)
    if payment_status:
        qs = qs.filter(payment_status=payment_status)
    if min_amount:
        qs = qs.filter(net_payable__gte=min_amount)
    if max_amount:
        qs = qs.filter(net_payable__lte=max_amount)

    return qs


def get_draft_purchase_orders() -> QuerySet:
    return _order_qs().filter(is_deleted=False, status=PurchaseOrder.Status.DRAFT)


def get_confirmed_purchase_orders(
    *,
    supplier_name  : str = None,
    supplier_code  : str = None,
    date_from      : str = None,
    date_to        : str = None,
    payment_status : str = None,
    min_amount     : str = None,
    max_amount     : str = None,
) -> QuerySet:
    return get_all_purchase_orders(
        status="confirmed",
        supplier_name=supplier_name,
        supplier_code=supplier_code,
        date_from=date_from,
        date_to=date_to,
        payment_status=payment_status,
        min_amount=min_amount,
        max_amount=max_amount,
    )


def get_purchase_order_by_id(pk: int) -> PurchaseOrder:
    return get_object_or_404(_order_qs(), pk=pk, is_deleted=False)


# ---------------------------------------------------------------------------
# PurchaseItem
# ---------------------------------------------------------------------------

def get_purchase_item_by_id(pk: int) -> PurchaseItem:
    return get_object_or_404(
        PurchaseItem.objects.select_related("order", "product"),
        pk=pk, is_deleted=False,
    )


def get_available_purchase_items_for_fifo(product_id: int) -> QuerySet:
    """
    Returns confirmed purchase items with remaining stock, oldest first (FIFO).
    Used by billing app to consume stock.
    """
    return (
        PurchaseItem.objects
        .filter(
            product_id=product_id,
            is_deleted=False,
            order__status=PurchaseOrder.Status.CONFIRMED,
            remaining_quantity__gt=0,
        )
        .order_by("order__confirmed_at")
    )


# ---------------------------------------------------------------------------
# PurchaseReturn
# ---------------------------------------------------------------------------

def get_returns_for_order(order_id: int) -> QuerySet:
    return PurchaseReturn.objects.filter(
        order_id=order_id, is_deleted=False,
    ).select_related("created_by", "accepted_by").prefetch_related(
        "items__purchase_item__product",
    )


def get_purchase_return_by_id(pk: int) -> PurchaseReturn:
    return get_object_or_404(
        PurchaseReturn.objects.select_related(
            "order", "created_by", "accepted_by",
        ).prefetch_related("items__purchase_item__product"),
        pk=pk, is_deleted=False,
    )


def get_all_returns(
    *,
    status        : str = None,
    supplier_name : str = None,
    supplier_code : str = None,
    order_number  : str = None,
    date_from     : str = None,
    date_to       : str = None,
) -> QuerySet:
    qs = PurchaseReturn.objects.select_related(
        "order__supplier", "created_by", "accepted_by",
    ).prefetch_related("items__purchase_item__product").filter(is_deleted=False)

    if status:
        qs = qs.filter(status=status)
    if supplier_name:
        qs = qs.filter(order__supplier__name__icontains=supplier_name)
    if supplier_code:
        qs = qs.filter(order__supplier__code__icontains=supplier_code)
    if order_number:
        qs = qs.filter(order__order_number__icontains=order_number)
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    return qs.order_by("-created_at")


# ---------------------------------------------------------------------------
# Supplier Payment
# ---------------------------------------------------------------------------

def get_payments_for_order(order_id: int) -> QuerySet:
    from .models import SupplierPayment
    return SupplierPayment.objects.filter(
        order_id=order_id, is_deleted=False,
    ).select_related("created_by").order_by("-payment_date")


def get_supplier_payment_by_id(pk: int):
    from .models import SupplierPayment
    return get_object_or_404(SupplierPayment, pk=pk, is_deleted=False)


# ---------------------------------------------------------------------------
# Supplier outstanding (aggregate)
# ---------------------------------------------------------------------------

def get_supplier_payable_summary(supplier_id: int) -> dict:
    """
    Aggregate payable summary for one supplier across all confirmed orders.
    Shows total we owe, total we paid, total outstanding.
    """
    orders = PurchaseOrder.objects.filter(
        supplier_id=supplier_id,
        is_deleted=False,
        status=PurchaseOrder.Status.CONFIRMED,
    )
    agg = orders.aggregate(
        total_net_payable       = Sum("net_payable"),
        total_paid              = Sum("total_paid"),
        total_payable_outstanding = Sum("payable_outstanding"),
    )
    return {
        "supplier_id"              : supplier_id,
        "total_net_payable"        : agg["total_net_payable"]          or Decimal("0"),
        "total_paid"               : agg["total_paid"]                 or Decimal("0"),
        "total_payable_outstanding": agg["total_payable_outstanding"]  or Decimal("0"),
    }


def get_suppliers_with_outstanding(*, min_outstanding: float = None) -> QuerySet:
    """Lists suppliers who have outstanding payables. Sorted highest first."""
    qs = Supplier.objects.filter(is_deleted=False).annotate(
        outstanding=Coalesce(
            Sum(
                "purchase_orders__payable_outstanding",
                filter=Q(
                    purchase_orders__is_deleted=False,
                    purchase_orders__status=PurchaseOrder.Status.CONFIRMED,
                ),
            ),
            Value(0, output_field=DecimalField()),
        )
    ).filter(outstanding__gt=0)

    if min_outstanding is not None:
        qs = qs.filter(outstanding__gte=min_outstanding)

    return qs.order_by("-outstanding")


def get_order_payment_summary(order_id: int) -> PurchaseOrder:
    """Full payment breakdown for a single purchase order."""
    return get_object_or_404(
        PurchaseOrder.objects.select_related("supplier").prefetch_related("payments", "items__product"),
        pk=order_id, is_deleted=False,
    )


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

def get_all_inventory():
    return Inventory.objects.select_related(
        "product", "product__category", "product__shelf", "last_updated_by",
    ).all()


def get_inventory_by_product_id(product_id: int) -> Inventory:
    return get_object_or_404(
        Inventory.objects.select_related("product"),
        product_id=product_id,
    )