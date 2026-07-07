import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { billingApi } from '../../services/billingApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import InvoiceStatusBadge from '../../components/billing/InvoiceStatusBadge';
import PaymentStatusBadge from '../../components/billing/PaymentStatusBadge';
import { useNavigate } from 'react-router-dom';

const OutstandingInvoicesPage = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (searchTerm) {
                params.customer_name = searchTerm;
            }
            const data = await billingApi.invoices.getOutstanding(params);
            setInvoices(data || []);
        } catch (error) {
            console.error('Failed to fetch outstanding invoices:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchInvoices();
    };

    const handleResetFilters = () => {
        setFilters({});
        setSearchTerm('');
        fetchInvoices();
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const columns = [
        { key: 'bill_number', label: 'Bill #', width: '120px' },
        {
            key: 'customer',
            label: 'Customer',
            render: (value) => value?.name || 'N/A'
        },
        {
            key: 'grand_total',
            label: 'Grand Total (PKR)',
            render: (value) => {
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? '0.00' : num.toFixed(2);
            }
        },
        {
            key: 'credit_outstanding',
            label: 'Outstanding (PKR)',
            render: (value) => {
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? '0.00' : num.toFixed(2);
            }
        },
        {
            key: 'payment_status',
            label: 'Payment Status',
            render: (value) => <PaymentStatusBadge status={value} />
        },
        {
            key: 'confirmed_at',
            label: 'Confirmed',
            render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
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
                <h1 className="text-3xl font-bold text-neutral-900">Outstanding Invoices</h1>
                <p className="text-neutral-500 mt-1">
                    All invoices with outstanding balance
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Search by customer name..."
                    className="flex-1 min-w-[200px]"
                    value={searchTerm}
                />
                <select
                    value={filters.payment_status || ''}
                    onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                    <option value="">All Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                </select>
                <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
                <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
                <input
                    type="number"
                    placeholder="Min Outstanding"
                    value={filters.min_outstanding || ''}
                    onChange={(e) => setFilters({ ...filters, min_outstanding: e.target.value })}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all w-40"
                />
                <input
                    type="number"
                    placeholder="Max Outstanding"
                    value={filters.max_outstanding || ''}
                    onChange={(e) => setFilters({ ...filters, max_outstanding: e.target.value })}
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
                data={invoices}
                onRowClick={(invoice) => navigate(`/billing/invoices/${invoice.id}`)}
            />
        </div>
    );
};

export default OutstandingInvoicesPage;