import PropTypes from 'prop-types';
import Badge from '../ui/Badge';

const EntryTypeBadge = ({ type }) => {
    const variants = {
        purchase: 'error',
        payment: 'success',
        return: 'info',
        advance: 'warning',
    };

    const labels = {
        purchase: 'Purchase',
        payment: 'Payment',
        return: 'Return',
        advance: 'Advance',
    };

    return <Badge variant={variants[type] || 'default'}>{labels[type] || type}</Badge>;
};

EntryTypeBadge.propTypes = {
    type: PropTypes.oneOf(['purchase', 'payment', 'return', 'advance']).isRequired,
};

export default EntryTypeBadge;