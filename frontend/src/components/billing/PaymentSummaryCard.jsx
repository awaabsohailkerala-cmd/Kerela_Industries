import PropTypes from 'prop-types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import PaymentStatusBadge from './PaymentStatusBadge';

const PaymentSummaryCard = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
                <p className="text-sm text-neutral-500">Grand Total</p>
                <p className="text-xl font-bold text-neutral-900">
                    {typeof summary.grand_total === 'string'
                        ? parseFloat(summary.grand_total).toFixed(2)
                        : '0.00'}
                </p>
            </Card>
            <Card className="p-4">
                <p className="text-sm text-neutral-500">Total Paid</p>
                <p className="text-xl font-bold text-success-600">
                    {typeof summary.total_paid === 'string'
                        ? parseFloat(summary.total_paid).toFixed(2)
                        : '0.00'}
                </p>
            </Card>
            <Card className="p-4">
                <p className="text-sm text-neutral-500">Credit Outstanding</p>
                <p className="text-xl font-bold text-error-600">
                    {typeof summary.credit_outstanding === 'string'
                        ? parseFloat(summary.credit_outstanding).toFixed(2)
                        : '0.00'}
                </p>
            </Card>
            <Card className="p-4">
                <p className="text-sm text-neutral-500">Payment Status</p>
                <PaymentStatusBadge status={summary.payment_status} />
            </Card>
        </div>
    );
};

PaymentSummaryCard.propTypes = {
    summary: PropTypes.object,
};

export default PaymentSummaryCard;