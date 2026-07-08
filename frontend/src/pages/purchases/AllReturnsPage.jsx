import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { purchasesApi } from '../../services/purchasesApi';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchBar from '../../components/ui/SearchBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import FilterBar from '../../components/ui/FilterBar';
import { Link } from 'react-router-dom';

const AllReturnsPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';

    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        fetchAllReturns();
    }, [filters, searchTerm]);

    const loadSuppliers = async () => {
        try {
            const data = await purchasesApi.suppliers.getAll();
            setSuppliers(data || []);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        }
    };

    const fetchAllReturns = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (searchTerm) {
                params.order_number = searchTerm;
            }
            const data = await purchasesApi.returns.getAll(params);
            console.log('Returns data:', data);
            setReturns(data || []);
        } catch (error) {
            console.error('Failed to fetch returns:', error);
            setReturns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = (filterValues) => {
        setFilters(filterValues);
    };

    const handleResetFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleAcceptReturn = async (returnId) => {
        if (!window.confirm('Are you sure you want to accept this return?')) return;

        try {
            await purchasesApi.returns.accept(returnId);
            fetchAllReturns();
        } catch (error) {
            console.error('Failed to accept return:', error);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'pending',
            accepted: 'accepted',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    const columns = [
        { key: 'reference_number', label: 'Return #', width: '140px' },
        {
            key: 'order_number',
            label: 'Order #',
            render: (value) => value || 'N/A'
        },
        {
            key: 'supplier_name',
            label: 'Supplier',
            render: (value) => value || 'N/A'
        },
        {
            key: 'status',
            label: 'Status',
            render: getStatusBadge
        },
        {
            key: 'total_return_amount',
            label: 'Amount (PKR)',
            render: (value) => {
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? '0.00' : num.toFixed(2);
            }
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        { key: 'note', label: 'Note', render: (value) => value || '-' },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (_, row) => row.status === 'pending' && isAdmin && (
                <Button
                    size="sm"
                    variant="success"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptReturn(row.id);
                    }}
                >
                    Accept
                </Button>
            ),
        },
    ];

    // Filter configuration for the FilterBar
    const filterConfig = [
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Accepted' },
            ],
        },
        {
            name: 'supplier_name',
            label: 'Supplier Name',
            type: 'select',
            options: [
                { value: '', label: 'All Suppliers' },
                ...suppliers.map(s => ({ value: s.name, label: s.name })),
            ],
        },
        {
            name: 'supplier_code',
            label: 'Supplier Code',
            type: 'select',
            options: [
                { value: '', label: 'All Supplier Codes' },
                ...suppliers.map(s => ({ value: s.code, label: s.code })),
            ],
        },
        { name: 'order_number', label: 'Order Number', type: 'text' },
        { name: 'date_from', label: 'Date From', type: 'date' },
        { name: 'date_to', label: 'Date To', type: 'date' },
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">All Returns</h1>
                    <p className="text-neutral-500 mt-1">View all purchase returns across all orders</p>
                </div>
                <Link to="/purchases/orders" className="text-sm text-primary-600 hover:text-primary-700">
                    ← Back to Orders
                </Link>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Search by order number..."
                            className="w-full"
                        />
                    </div>
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
                    {(Object.keys(filters).length > 0 || searchTerm) && (
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

            <Table
                columns={columns}
                data={returns}
                onRowClick={(ret) => {
                    setSelectedReturn(ret);
                    setShowDetailModal(true);
                }}
            />

            {/* Return Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedReturn(null);
                }}
                title="Return Details"
                size="lg"
            >
                {selectedReturn && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-neutral-500">Return Number</p>
                                <p className="font-medium">{selectedReturn.reference_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Order Number</p>
                                <p className="font-medium">{selectedReturn.order_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Supplier</p>
                                <p className="font-medium">{selectedReturn.supplier_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Status</p>
                                {getStatusBadge(selectedReturn.status)}
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Total Return Amount (PKR)</p>
                                <p className="font-medium text-primary-600">
                                    {typeof selectedReturn.total_return_amount === 'string'
                                        ? parseFloat(selectedReturn.total_return_amount).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Total Return Gross (PKR)</p>
                                <p className="font-medium">
                                    {typeof selectedReturn.total_return_gross === 'string'
                                        ? parseFloat(selectedReturn.total_return_gross).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Total Return GST (PKR)</p>
                                <p className="font-medium">
                                    {typeof selectedReturn.total_return_gst === 'string'
                                        ? parseFloat(selectedReturn.total_return_gst).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Total Return WHT (PKR)</p>
                                <p className="font-medium">
                                    {typeof selectedReturn.total_return_wht === 'string'
                                        ? parseFloat(selectedReturn.total_return_wht).toFixed(2)
                                        : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Created</p>
                                <p className="font-medium">{new Date(selectedReturn.created_at).toLocaleString()}</p>
                            </div>
                            {selectedReturn.accepted_at && (
                                <div>
                                    <p className="text-sm text-neutral-500">Accepted</p>
                                    <p className="font-medium">{new Date(selectedReturn.accepted_at).toLocaleString()}</p>
                                </div>
                            )}
                            {selectedReturn.accepted_by && (
                                <div>
                                    <p className="text-sm text-neutral-500">Accepted By</p>
                                    <p className="font-medium">{selectedReturn.accepted_by}</p>
                                </div>
                            )}
                            {selectedReturn.note && (
                                <div className="col-span-2">
                                    <p className="text-sm text-neutral-500">Note</p>
                                    <p className="font-medium">{selectedReturn.note}</p>
                                </div>
                            )}
                        </div>

                        {selectedReturn.items && selectedReturn.items.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3">Returned Items</h3>
                                <div className="space-y-2">
                                    {selectedReturn.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.product_name}</p>
                                                <p className="text-sm text-neutral-500">
                                                    {item.quantity} × {typeof item.unit_price === 'string'
                                                        ? parseFloat(item.unit_price).toFixed(2)
                                                        : '0.00'}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    GST: {typeof item.gst === 'string' ? parseFloat(item.gst).toFixed(2) : '0'}% |
                                                    WHT: {typeof item.wht === 'string' ? parseFloat(item.wht).toFixed(2) : '0'}%
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-primary-600">
                                                    {typeof item.total_amount === 'string'
                                                        ? parseFloat(item.total_amount).toFixed(2)
                                                        : '0.00'}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    Gross: {typeof item.gross_amount === 'string'
                                                        ? parseFloat(item.gross_amount).toFixed(2)
                                                        : '0.00'} |
                                                    GST: {typeof item.gst_amount === 'string'
                                                        ? parseFloat(item.gst_amount).toFixed(2)
                                                        : '0.00'} |
                                                    WHT: {typeof item.wht_amount === 'string'
                                                        ? parseFloat(item.wht_amount).toFixed(2)
                                                        : '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReturn.status === 'pending' && isAdmin && (
                            <div className="flex gap-3 pt-4 border-t border-neutral-200">
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        handleAcceptReturn(selectedReturn.id);
                                        setShowDetailModal(false);
                                        fetchAllReturns();
                                    }}
                                >
                                    Accept Return
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AllReturnsPage;