import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import OrderActionButtons from './OrderActionButtons';
import OrderStatusBadge from './OrderStatusBadge';
import OrderPaymentStatusBadge from './OrderPaymentStatusBadge';
import { purchasesApi } from '../../services/purchasesApi';

const OrderDetailModal = ({
    isOpen,
    onClose,
    orderId,
    onOrderUpdated,
    className = '',
}) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pdfs, setPdfs] = useState([]);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const detail = await purchasesApi.orders.getById(orderId);
            setOrder(detail);
            if (detail.status === 'confirmed') {
                fetchPDFs(orderId);
            }
        } catch (error) {
            console.error('Failed to load order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPDFs = async (id) => {
        try {
            const data = await purchasesApi.orders.getPDFs(id);
            setPdfs(data || []);
        } catch (error) {
            console.error('Failed to fetch PDFs:', error);
            setPdfs([]);
        }
    };

    const handleRefreshOrder = async () => {
        await fetchOrderDetails();
        if (onOrderUpdated) {
            onOrderUpdated();
        }
    };

    const getStatusBadge = (status) => <OrderStatusBadge status={status} />;
    const getPaymentStatusBadge = (status) => <OrderPaymentStatusBadge status={status} />;

    if (loading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="lg">
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Order Details"
            size="lg"
            className={className}
        >
            {order && (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500">Order Number</p>
                            <p className="font-medium">{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Status</p>
                            {getStatusBadge(order.status)}
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Supplier</p>
                            <p className="font-medium">{order.supplier?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Payment Type</p>
                            <p className="font-medium">{order.payment_type || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Gross Amount (PKR)</p>
                            <p className="font-medium">
                                {typeof order.gross_amount === 'string'
                                    ? parseFloat(order.gross_amount).toFixed(2)
                                    : '0.00'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Net Payable (PKR)</p>
                            <p className="font-medium text-primary-600">
                                {typeof order.net_payable === 'string'
                                    ? parseFloat(order.net_payable).toFixed(2)
                                    : '0.00'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Payment Status</p>
                            {getPaymentStatusBadge(order.payment_status)}
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Total Paid (PKR)</p>
                            <p className="font-medium text-success-600">
                                {typeof order.total_paid === 'string'
                                    ? parseFloat(order.total_paid).toFixed(2)
                                    : '0.00'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Payable Outstanding (PKR)</p>
                            <p className="font-medium text-error-600">
                                {typeof order.payable_outstanding === 'string'
                                    ? parseFloat(order.payable_outstanding).toFixed(2)
                                    : '0.00'}
                            </p>
                        </div>
                        {order.advance_amount && parseFloat(order.advance_amount) > 0 && (
                            <div>
                                <p className="text-sm text-neutral-500">Advance Amount (PKR)</p>
                                <p className="font-medium">
                                    {typeof order.advance_amount === 'string'
                                        ? parseFloat(order.advance_amount).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                        )}
                        {order.gst_total && parseFloat(order.gst_total) > 0 && (
                            <div>
                                <p className="text-sm text-neutral-500">GST Total (PKR)</p>
                                <p className="font-medium">
                                    {typeof order.gst_total === 'string'
                                        ? parseFloat(order.gst_total).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                        )}
                        {order.wht_total && parseFloat(order.wht_total) > 0 && (
                            <div>
                                <p className="text-sm text-neutral-500">WHT Total (PKR)</p>
                                <p className="font-medium">
                                    {typeof order.wht_total === 'string'
                                        ? parseFloat(order.wht_total).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                        )}
                        {order.confirmed_at && (
                            <div>
                                <p className="text-sm text-neutral-500">Confirmed</p>
                                <p className="font-medium">{new Date(order.confirmed_at).toLocaleString()}</p>
                            </div>
                        )}
                        {order.description && (
                            <div className="col-span-2">
                                <p className="text-sm text-neutral-500">Description</p>
                                <p className="font-medium">{order.description}</p>
                            </div>
                        )}
                    </div>

                    {order.items && order.items.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-neutral-900 mb-3">Items</h3>
                            <div className="space-y-2">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-neutral-500">
                                                {item.quantity} × {typeof item.unit_price === 'string'
                                                    ? parseFloat(item.unit_price).toFixed(2)
                                                    : '0.00'}
                                            </p>
                                            <p className="text-xs text-neutral-400">
                                                Remaining: {item.remaining_quantity} | Returned: {item.returned_quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {typeof item.total_price === 'string'
                                                    ? parseFloat(item.total_price).toFixed(2)
                                                    : '0.00'}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                GST: {typeof item.gst_amount === 'string'
                                                    ? parseFloat(item.gst_amount).toFixed(2)
                                                    : '0.00'} |
                                                WHT: {typeof item.wht_amount === 'string'
                                                    ? parseFloat(item.wht_amount).toFixed(2)
                                                    : '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons for Confirmed Orders */}
                    {order.status === 'confirmed' && (
                        <div className="pt-4 border-t border-neutral-200">
                            <OrderActionButtons
                                order={order}
                                onPaymentAdded={handleRefreshOrder}
                                onReturnCreated={handleRefreshOrder}
                                onSavePDF={handleRefreshOrder}
                            />
                        </div>
                    )}

                    {/* Saved PDFs Section */}
                    {order.status === 'confirmed' && pdfs.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-neutral-900 mb-3">Saved PDFs</h3>
                            <div className="space-y-2">
                                {pdfs.map((pdf) => (
                                    <div key={pdf.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{pdf.file_name}</p>
                                            <p className="text-xs text-neutral-500">
                                                Saved: {new Date(pdf.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this PDF?')) {
                                                    purchasesApi.orders.deletePDF(pdf.id).then(() => {
                                                        fetchPDFs(order.id);
                                                    });
                                                }
                                            }}
                                            className="text-sm text-error-600 hover:text-error-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

OrderDetailModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onOrderUpdated: PropTypes.func,
    className: PropTypes.string,
};

export default OrderDetailModal;