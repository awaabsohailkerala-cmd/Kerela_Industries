import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (searchTerm) {
                params.search = searchTerm;
            }
            const data = await billingApi.customers.getOutstanding(params);
            setCustomers(data || []);
        } catch (error) {
            console.error('Failed to fetch customers with outstanding:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [filters, searchTerm]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchCustomers();
    };

    const handleResetFilters = () => {
        setFilters({});
        setSearchTerm('');
        setTimeout(() => {
            fetchCustomers();
        }, 0);
    };

    const columns = [
        { key: 'code', label: 'Code', width: '120px' },
        { key: 'name', label: 'Name' },
        {
            key: 'outstanding',
            label: 'Outstanding (PKR)',
            render: (value) => {
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? '0.00' : num.toFixed(2);
            }
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
                <p className="text-sm text-neutral-400 mt-1">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''} with outstanding balance
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Search by name or code..."
                    className="flex-1 min-w-[200px]"
                    value={searchTerm}
                />
                <select
                    value={filters.payment_status || ''}
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                >
                    <option value="">All Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                </select>
                <input
                    type="number"
                    placeholder="Min Outstanding"
                    value={filters.min_outstanding || ''}
                    onChange={(e) => handleFilterChange('min_outstanding', e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all w-40"
                />
                <input
                    type="number"
                    placeholder="Max Outstanding"
                    value={filters.max_outstanding || ''}
                    onChange={(e) => handleFilterChange('max_outstanding', e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all w-40"
                />
                <Button onClick={handleApplyFilters}>
                    Apply Filters
                </Button>
                <Button variant="secondary" onClick={handleResetFilters}>
                    Reset
                </Button>
            </div>

            {customers.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-lg font-semibold text-neutral-900">No Customers with Outstanding</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                        All customers have settled their balances.
                    </p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={customers}
                    onRowClick={(customer) => navigate(`/billing/customers/${customer.id}`)}
                />
            )}
        </div>
    );
};

export default CustomerOutstandingPage;