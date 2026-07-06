import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { purchasesApi } from '../../services/purchasesApi';

const OrderActionButtons = ({
    order,
    onPaymentAdded,
    onOrderUpdated,
    onPrint,
    onSavePDF,
    onViewPaymentSummary,
    className = ''
}) => {
    const isAdmin = true; // This will be passed from parent

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

    const resetPaymentForm = () => {
        setPaymentFormData({
            amount: '',
            method: 'cash',
            payment_date: new Date().toISOString().split('T')[0],
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

            // Call the callback to refresh order data
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
    onOrderUpdated: PropTypes.func,
    onPrint: PropTypes.func,
    onSavePDF: PropTypes.func,
    onViewPaymentSummary: PropTypes.func,
    className: PropTypes.string,
};

export default OrderActionButtons;