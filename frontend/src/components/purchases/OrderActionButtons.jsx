import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { purchasesApi } from '../../services/purchasesApi';

const OrderActionButtons = ({
    order,
    onPaymentAdded,
    onReturnCreated,
    onOrderUpdated,
    onPrint,
    onSavePDF,
    onViewPaymentSummary,
    className = ''
}) => {
    const isAdmin = true;

    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [paymentFormData, setPaymentFormData] = useState({
        amount: '',
        method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        note: '',
    });
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfFileName, setPdfFileName] = useState(order?.order_number || '');
    const [pdfLoading, setPdfLoading] = useState(false);

    const [showPaymentSummary, setShowPaymentSummary] = useState(false);
    const [paymentSummary, setPaymentSummary] = useState(null);
    const [showPaymentDetail, setShowPaymentDetail] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Return state
    const [showCreateReturnModal, setShowCreateReturnModal] = useState(false);
    const [returnFormData, setReturnFormData] = useState({
        items: [],
        note: '',
    });
    const [returnLoading, setReturnLoading] = useState(false);
    const [orderItems, setOrderItems] = useState([]);

    // Fetch order items when modal opens
    useEffect(() => {
        if (showCreateReturnModal && order?.id) {
            fetchOrderItems();
        }
    }, [showCreateReturnModal, order?.id]);

    const fetchOrderItems = async () => {
        try {
            const orderDetail = await purchasesApi.orders.getById(order.id);
            // The items from the order response have 'id' as the purchase_item_id
            // They also have 'returnable_quantity' field
            setOrderItems(orderDetail.items || []);
        } catch (error) {
            console.error('Failed to fetch order items:', error);
        }
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            method: 'cash',
            payment_date: new Date().toISOString().split('T')[0],
            note: '',
        });
    };

    const resetReturnForm = () => {
        setReturnFormData({
            items: [],
            note: '',
        });
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        try {
            if (!order?.id) {
                throw new Error('No order selected');
            }

            const paymentData = {
                order: parseInt(order.id),
                amount: parseFloat(paymentFormData.amount),
                method: paymentFormData.method,
                payment_date: paymentFormData.payment_date,
                note: paymentFormData.note || '',
            };

            await purchasesApi.payments.create(order.id, paymentData);
            setShowAddPaymentModal(false);
            resetPaymentForm();

            if (onPaymentAdded) {
                onPaymentAdded();
            }

            alert('Payment recorded successfully!');
        } catch (error) {
            console.error('Failed to create payment:', error);
            let errorMessage = 'Failed to record payment';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const messages = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                    errorMessage = `Validation Error:\n${messages}`;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCreateReturn = async (e) => {
        e.preventDefault();
        setReturnLoading(true);
        try {
            if (!order?.id) {
                throw new Error('No order selected');
            }

            // Validate at least one item
            if (returnFormData.items.length === 0) {
                alert('Please add at least one item to return.');
                setReturnLoading(false);
                return;
            }

            // Validate all items have purchase_item_id
            const invalidItems = returnFormData.items.some(item => !item.purchase_item_id);
            if (invalidItems) {
                alert('Please select a product for all return items.');
                setReturnLoading(false);
                return;
            }

            // Validate all items have quantity > 0
            const invalidQuantity = returnFormData.items.some(item => !item.quantity || item.quantity <= 0);
            if (invalidQuantity) {
                alert('Please enter a valid quantity for all return items.');
                setReturnLoading(false);
                return;
            }

            // Format data according to backend expectations
            const returnData = {
                order_id: parseInt(order.id),  // Backend expects 'order_id'
                items: returnFormData.items.map(item => ({
                    purchase_item_id: parseInt(item.purchase_item_id),  // Backend expects 'purchase_item_id'
                    quantity: parseInt(item.quantity) || 0,
                })),
                note: returnFormData.note || '',
            };

            console.log('Sending return data:', returnData); // Debug log

            await purchasesApi.returns.create(order.id, returnData);
            setShowCreateReturnModal(false);
            resetReturnForm();

            if (onReturnCreated) {
                onReturnCreated();
            }

            alert('Return created successfully!');
        } catch (error) {
            console.error('Failed to create return:', error);
            let errorMessage = 'Failed to create return';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const messages = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                    errorMessage = `Validation Error:\n${messages}`;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setReturnLoading(false);
        }
    };

    const handleAddReturnItem = () => {
        setReturnFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { purchase_item_id: '', quantity: 1 }  // Changed from invoice_item_id
            ]
        }));
    };

    const handleUpdateReturnItem = (index, field, value) => {
        setReturnFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleRemoveReturnItem = (index) => {
        setReturnFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handlePrintOrder = async () => {
        try {
            const response = await purchasesApi.orders.print(order.id, false);
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to print order:', error);
        }
    };

    const handleSavePDF = async () => {
        setPdfLoading(true);
        try {
            const data = {
                file_name: pdfFileName || order?.order_number || 'purchase_order',
            };
            await purchasesApi.orders.savePDF(order.id, data);
            setShowPdfModal(false);
            setPdfFileName('');
            if (onSavePDF) {
                onSavePDF();
            }
            alert('PDF saved successfully!');
        } catch (error) {
            console.error('Failed to save PDF:', error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleViewPaymentSummary = async () => {
        try {
            const data = await purchasesApi.orders.getPaymentSummary(order.id);
            setPaymentSummary(data);
            setShowPaymentSummary(true);
        } catch (error) {
            console.error('Failed to fetch payment summary:', error);
        }
    };

    const handleViewPaymentDetail = (payment) => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
    };

    // Get returnable items for the return form
    const getReturnableItems = () => {
        return orderItems.filter(item => (item.returnable_quantity || 0) > 0);
    };

    if (!order || order.status !== 'confirmed') {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-3 ${className}`}>
            <Button
                variant="secondary"
                onClick={handleViewPaymentSummary}
            >
                View Payment Summary
            </Button>
            <Button
                variant="secondary"
                onClick={handlePrintOrder}
            >
                Print Order
            </Button>
            <Button
                variant="secondary"
                onClick={() => {
                    setPdfFileName(order.order_number);
                    setShowPdfModal(true);
                }}
            >
                Save PDF
            </Button>
            <Button
                variant="primary"
                onClick={() => {
                    resetPaymentForm();
                    setShowAddPaymentModal(true);
                }}
            >
                Add Payment
            </Button>
            <Button
                variant="secondary"
                onClick={() => {
                    resetReturnForm();
                    setShowCreateReturnModal(true);
                }}
            >
                Create Return
            </Button>

            {/* Add Payment Modal */}
            <Modal
                isOpen={showAddPaymentModal}
                onClose={() => {
                    setShowAddPaymentModal(false);
                    resetPaymentForm();
                }}
                title="Add Payment"
            >
                <form onSubmit={handleAddPayment} className="space-y-4">
                    <Input
                        label="Amount (PKR)"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={paymentFormData.amount}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                        placeholder="Enter amount"
                        required
                    />

                    <Select
                        label="Payment Method"
                        value={paymentFormData.method}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value })}
                        options={[
                            { value: 'cash', label: 'Cash' },
                            { value: 'jazzcash', label: 'JazzCash' },
                            { value: 'easypaisa', label: 'Easypaisa' },
                            { value: 'bank', label: 'Bank Transfer' },
                        ]}
                        required
                    />

                    <Input
                        label="Payment Date"
                        type="date"
                        value={paymentFormData.payment_date}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                        required
                    />

                    <Input
                        label="Note"
                        value={paymentFormData.note}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, note: e.target.value })}
                        placeholder="Payment note (optional)"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowAddPaymentModal(false);
                                resetPaymentForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={paymentLoading}>
                            Record Payment
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Create Return Modal */}
            <Modal
                isOpen={showCreateReturnModal}
                onClose={() => {
                    setShowCreateReturnModal(false);
                    resetReturnForm();
                }}
                title="Create Return"
                size="lg"
            >
                <form onSubmit={handleCreateReturn} className="space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-neutral-900">Items to Return</h3>
                            <Button size="sm" onClick={handleAddReturnItem}>
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {returnFormData.items.length === 0 ? (
                                <p className="text-center text-neutral-500 py-4">No items added yet. Click "Add Item" to start.</p>
                            ) : (
                                returnFormData.items.map((item, index) => {
                                    const selectedItem = orderItems.find(i => i.id === parseInt(item.purchase_item_id));
                                    const returnableQty = selectedItem?.returnable_quantity || 0;

                                    return (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-lg">
                                            <Select
                                                label="Product"
                                                value={item.purchase_item_id}
                                                onChange={(e) => handleUpdateReturnItem(index, 'purchase_item_id', parseInt(e.target.value))}
                                                options={orderItems.map(i => ({
                                                    value: i.id,
                                                    label: `${i.product_name} (Returnable: ${i.returnable_quantity || 0})`,
                                                }))}
                                                placeholder="Select item"
                                                required
                                            />
                                            <div>
                                                <Input
                                                    label="Quantity"
                                                    type="number"
                                                    min="1"
                                                    max={returnableQty > 0 ? returnableQty : undefined}
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateReturnItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    required
                                                />
                                                {returnableQty > 0 && (
                                                    <p className="text-xs text-neutral-500 mt-1">Max: {returnableQty}</p>
                                                )}
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleRemoveReturnItem(index)}
                                                    className="w-full"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <Input
                        label="Note"
                        value={returnFormData.note}
                        onChange={(e) => setReturnFormData({ ...returnFormData, note: e.target.value })}
                        placeholder="Return note (optional)"
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowCreateReturnModal(false);
                                resetReturnForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={returnLoading}>
                            Create Return
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Save PDF Modal */}
            <Modal
                isOpen={showPdfModal}
                onClose={() => {
                    setShowPdfModal(false);
                    setPdfFileName('');
                }}
                title="Save PDF"
            >
                <div className="space-y-4">
                    <Input
                        label="File Name"
                        value={pdfFileName}
                        onChange={(e) => setPdfFileName(e.target.value)}
                        placeholder="Enter file name"
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowPdfModal(false);
                                setPdfFileName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSavePDF}
                            loading={pdfLoading}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Payment Summary Modal */}
            <Modal
                isOpen={showPaymentSummary}
                onClose={() => {
                    setShowPaymentSummary(false);
                    setPaymentSummary(null);
                }}
                title="Payment Summary"
                size="lg"
            >
                {paymentSummary && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-neutral-500">Order #</p>
                                <p className="font-medium">{paymentSummary.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Supplier</p>
                                <p className="font-medium">{paymentSummary.supplier_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Net Payable</p>
                                <p className="font-medium text-primary-600">
                                    {typeof paymentSummary.net_payable === 'string'
                                        ? parseFloat(paymentSummary.net_payable).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Payment Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentSummary.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                        paymentSummary.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {paymentSummary.payment_status_display || paymentSummary.payment_status || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Total Paid</p>
                                <p className="font-medium text-success-600">
                                    {typeof paymentSummary.total_paid === 'string'
                                        ? parseFloat(paymentSummary.total_paid).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Outstanding</p>
                                <p className="font-medium text-error-600">
                                    {typeof paymentSummary.payable_outstanding === 'string'
                                        ? parseFloat(paymentSummary.payable_outstanding).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                        </div>

                        {paymentSummary.payments && paymentSummary.payments.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3">Payment History</h3>
                                <div className="space-y-2">
                                    {paymentSummary.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleViewPaymentDetail(payment)}
                                        >
                                            <div>
                                                <p className="font-medium">{payment.reference_number}</p>
                                                <p className="text-sm text-neutral-500">{payment.method_display}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-success-600">
                                                    {typeof payment.amount === 'string'
                                                        ? parseFloat(payment.amount).toFixed(2)
                                                        : '0.00'}
                                                </p>
                                                <p className="text-xs text-neutral-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Payment Detail Modal */}
            <Modal
                isOpen={showPaymentDetail}
                onClose={() => {
                    setShowPaymentDetail(false);
                    setSelectedPayment(null);
                }}
                title="Payment Details"
                size="md"
            >
                {selectedPayment && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-neutral-500">Reference Number</p>
                                <p className="font-medium">{selectedPayment.reference_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Amount</p>
                                <p className="font-medium text-success-600">
                                    {typeof selectedPayment.amount === 'string'
                                        ? parseFloat(selectedPayment.amount).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Method</p>
                                <p className="font-medium">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs">
                                        {selectedPayment.method_display || selectedPayment.method}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Payment Date</p>
                                <p className="font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Created By</p>
                                <p className="font-medium">{selectedPayment.created_by || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Created At</p>
                                <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                            </div>
                            {selectedPayment.note && (
                                <div className="col-span-2">
                                    <p className="text-sm text-neutral-500">Note</p>
                                    <p className="font-medium">{selectedPayment.note}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

OrderActionButtons.propTypes = {
    order: PropTypes.object.isRequired,
    onPaymentAdded: PropTypes.func,
    onReturnCreated: PropTypes.func,
    onOrderUpdated: PropTypes.func,
    onPrint: PropTypes.func,
    onSavePDF: PropTypes.func,
    onViewPaymentSummary: PropTypes.func,
    className: PropTypes.string,
};

export default OrderActionButtons;