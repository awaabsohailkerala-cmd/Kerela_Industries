import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBillingCRUD } from '../../hooks/useBilling';
import { billingApi } from '../../services/billingApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

const CustomerOutstandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, loading, filters, setFilters, resetFilters, refetch } = useBillingCRUD(
        billingApi.customers,
        { search: '' }
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [minOutstanding, setMinOutstanding] = useState('');
    const [maxOutstanding, setMaxOutstanding] = useState('');

    const handleApplyFilters = () => {
        const newFilters = {};
        if (searchTerm) newFilters.search = searchTerm;
        if (paymentStatus) newFilters.payment_status = paymentStatus;
        if (minOutstanding) newFilters.min_outstanding = minOutstanding;
        if (maxOutstanding) newFilters.max_outstanding = maxOutstanding;
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setPaymentStatus('');
        setMinOutstanding('');
        setMaxOutstanding('');
        resetFilters();
    };

    const columns = [
        { key: 'code', label: 'Code', width: '120px' },
        { key: 'name', label: 'Name' },
        {
            key: 'outstanding',
            label: 'Outstanding (PKR)',
            render: (value) => (
                <span className="font-semibold text-error-600">
                    {typeof value === 'string' ? parseFloat(value).toFixed(2) : '0.00'}
                </span>
            )
        },
        {
            key: 'payment_status',
            label: 'Status',
            render: (value) => (
                <Badge variant={value === 'paid' ? 'paid' : value === 'partial' ? 'partial' : 'unpaid'}>
                    {value || 'N/A'}
                </Badge>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Customers Outstanding</h1>
                <p className="text-neutral-500 mt-1">View customers with outstanding balances</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <SearchBar
                    onSearch={setSearchTerm}
                    placeholder="Search by name or code..."
                    className="flex-1 min-w-[200px]"
                    value={searchTerm}
                />
                <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                    <option value="">All Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                </select>
                <input
                    type="number"
                    placeholder="Min Outstanding"
                    value={minOutstanding}
                    onChange={(e) => setMinOutstanding(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all w-40"
                />
                <input
                    type="number"
                    placeholder="Max Outstanding"
                    value={maxOutstanding}
                    onChange={(e) => setMaxOutstanding(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all w-40"
                />
                <Button onClick={handleApplyFilters}>
                    Apply Filters
                </Button>
                <Button variant="secondary" onClick={handleResetFilters}>
                    Reset
                </Button>
            </div>

            <Table
                columns={columns}
                data={data}
                onRowClick={(customer) => navigate(`/billing/customers/${customer.id}`)}
            />
        </div>
    );
};

export default CustomerOutstandingPage;