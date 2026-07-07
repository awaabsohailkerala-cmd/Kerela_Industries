import Badge from '../ui/Badge';

const InvoiceStatusBadge = ({ status }) => {
    const variants = {
        draft: 'draft',
        confirmed: 'confirmed',
        partial: 'warning',
        returned: 'info',
    };

    const labels = {
        draft: 'Draft',
        confirmed: 'Confirmed',
        partial: 'Partial Return',
        returned: 'Returned',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
};

export default InvoiceStatusBadge;