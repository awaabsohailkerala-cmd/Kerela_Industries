import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBillingCRUD } from '../../hooks/useBilling';
import { billingApi } from '../../services/billingApi';
import InvoiceTable from '../../components/billing/InvoiceTable';
import InvoiceFilterBar from '../../components/billing/InvoiceFilterBar';
import Tabs from '../../components/ui/Tabs';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const InvoicesPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState({});

    const { data, loading, filters, setFilters, resetFilters, refetch } = useBillingCRUD(
        billingApi.invoices
    );

    useEffect(() => {
        // Fetch based on tab and filters
        const params = { ...filterValues };
        if (searchTerm) params.bill_number = searchTerm;

        const fetchData = async () => {
            try {
                let result;
                switch (activeTab) {
                    case 'drafts':
                        result = await billingApi.invoices.getDrafts(params);
                        break;
                    case 'confirmed':
                        result = await billingApi.invoices.getConfirmed(params);
                        break;
                    case 'outstanding':
                        result = await billingApi.invoices.getOutstanding(params);
                        break;
                    default:
                        result = await billingApi.invoices.getAll(params);
                }
                // Update data directly (bypassing the hook's fetch)
                refetch();
            } catch (error) {
                console.error('Failed to fetch invoices:', error);
            }
        };
        fetchData();
    }, [activeTab, filterValues, searchTerm]);

    const tabs = [
        { value: 'all', label: 'All Invoices' },
        { value: 'drafts', label: 'Drafts' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'outstanding', label: 'Outstanding' },
    ];

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleApplyFilters = (newFilters) => {
        setFilterValues(newFilters);
    };

    const handleResetFilters = () => {
        setFilterValues({});
        setSearchTerm('');
        resetFilters();
    };

    const handleEdit = (invoice) => {
        navigate(`/billing/invoices/${invoice.id}/edit`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this draft invoice?')) {
            try {
                await billingApi.invoices.delete(id);
                refetch();
            } catch (error) {
                console.error('Failed to delete invoice:', error);
            }
        }
    };

    const handleConfirm = async (id) => {
        if (window.confirm('Are you sure you want to confirm this invoice?')) {
            try {
                await billingApi.invoices.confirm(id);
                refetch();
            } catch (error) {
                console.error('Failed to confirm invoice:', error);
            }
        }
    };

    const handlePrint = (id) => {
        window.open(`/api/billing/invoices/${id}/print/?is_draft=false`, '_blank');
    };

    const handleRowClick = (invoice) => {
        navigate(`/billing/invoices/${invoice.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Invoices</h1>
                    <p className="text-neutral-500 mt-1">Manage all invoices</p>
                </div>
                <Button
                    onClick={() => navigate('/billing/invoices/create')}
                    icon={({ className }) => (
                        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                >
                    Create Invoice
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search by bill number..."
                        className="flex-1"
                        value={searchTerm}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        )}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    {(Object.keys(filterValues).length > 0 || searchTerm) && (
                        <Button variant="secondary" onClick={handleResetFilters}>
                            Clear All
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <InvoiceFilterBar
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                    />
                )}

                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <InvoiceTable
                invoices={data}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                onPrint={handlePrint}
                isAdmin={isAdmin}
                showActions={true}
            />
        </div>
    );
};

export default InvoicesPage;