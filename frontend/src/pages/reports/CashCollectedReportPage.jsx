import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportsApi } from '../../services/reportsApi';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import FilterBar from '../../components/ui/FilterBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const filterConfig = [
    { name: 'date', label: 'Exact Date', type: 'date' },
    { name: 'date_from', label: 'Date From', type: 'date' },
    { name: 'date_to', label: 'Date To', type: 'date' },
];

const columns = [
    { key: 'reference_number', label: 'Reference #', width: '140px' },
    { key: 'invoice_bill_number', label: 'Bill #' },
    { key: 'customer_name', label: 'Customer' },
    {
        key: 'amount',
        label: 'Amount (PKR)',
        render: (value) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return isNaN(num) ? '0.00' : num.toFixed(2);
        },
    },
    {
        key: 'method_display',
        label: 'Method',
        render: (value) => <Badge>{value || 'N/A'}</Badge>,
    },
    {
        key: 'payment_date',
        label: 'Date',
        render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
];

const CashCollectedReportPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';

    const [stats, setStats] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            fetchReport();
        }
    }, [filters]);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await reportsApi.cashCollected.get(filters);
            setStats(data.stats);
            setResults(data.results || []);
        } catch (err) {
            console.error('Failed to fetch cash collected report:', err);
            setError(err.response?.data?.non_field_errors?.[0] || 'Failed to load report.');
            setStats(null);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        navigate('/dashboard');
        return null;
    }

    const handleApplyFilters = (filterValues) => setFilters(filterValues);
    const handleResetFilters = () => setFilters({});

    return (
        <div className="space-y-6">
            <div>
                <Link to="/reports" className="text-sm text-primary-600 hover:text-primary-700">
                    ← Back to Reports
                </Link>
                <h1 className="text-3xl font-bold text-neutral-900 mt-1">Cash Collected Report</h1>
                <p className="text-neutral-500 mt-1">Total cash collected from customers for a selected date or date range</p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    {Object.keys(filters).length > 0 && (
                        <Button variant="secondary" onClick={handleResetFilters}>
                            Clear All
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <FilterBar
                        filters={filterConfig}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                    />
                )}
            </div>

            {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                    <p className="text-sm text-error-600">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="p-4">
                                <p className="text-sm text-neutral-500">Total Payments</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.total_payments}</p>
                            </Card>
                            <Card className="p-4">
                                <p className="text-sm text-neutral-500">Total Cash Collected (PKR)</p>
                                <p className="text-2xl font-bold text-success-600">
                                    {Number(stats.total_cash_collected || 0).toFixed(2)}
                                </p>
                            </Card>
                        </div>
                    )}

                    {results.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💵</div>
                            <h3 className="text-lg font-semibold text-neutral-900">No Payments Found</h3>
                            <p className="text-sm text-neutral-500 mt-1">Try adjusting your date filters</p>
                        </div>
                    ) : (
                        <Table columns={columns} data={results} />
                    )}
                </>
            )}
        </div>
    );
};

export default CashCollectedReportPage;
