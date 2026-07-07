import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const ReturnList = ({ returns, onAccept, isAdmin }) => {
    if (!returns || returns.length === 0) {
        return (
            <div className="text-center py-4 text-neutral-500">
                No returns for this invoice
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'pending',
            accepted: 'accepted',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className="space-y-3">
            {returns.map((returnItem, index) => (
                <motion.div
                    key={returnItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium">{returnItem.reference_number}</p>
                            <p className="text-sm text-neutral-500">
                                {new Date(returnItem.created_at).toLocaleString()}
                            </p>
                            {returnItem.note && (
                                <p className="text-sm text-neutral-600 mt-1">{returnItem.note}</p>
                            )}
                            {returnItem.items && returnItem.items.length > 0 && (
                                <div className="mt-2 text-sm">
                                    <p className="text-neutral-500">Items:</p>
                                    {returnItem.items.map((item, idx) => (
                                        <p key={idx} className="text-neutral-600">
                                            {item.product_name} × {item.quantity}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="mb-1">{getStatusBadge(returnItem.status)}</div>
                            {returnItem.total_return_amount && (
                                <p className="font-medium text-primary-600">
                                    {typeof returnItem.total_return_amount === 'string'
                                        ? parseFloat(returnItem.total_return_amount).toFixed(2)
                                        : '0.00'}
                                </p>
                            )}
                            {returnItem.status === 'pending' && isAdmin && (
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => onAccept(returnItem.id)}
                                    className="mt-2"
                                >
                                    Accept Return
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

ReturnList.propTypes = {
    returns: PropTypes.array,
    onAccept: PropTypes.func,
    isAdmin: PropTypes.bool,
};

export default ReturnList;