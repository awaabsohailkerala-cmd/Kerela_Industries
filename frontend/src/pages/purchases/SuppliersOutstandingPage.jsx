import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSuppliersOutstanding } from '../../hooks/usePurchases';
import { purchasesApi } from '../../services/purchasesApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FilterBar from '../../components/ui/FilterBar';

const SuppliersOutstandingPage = () => {
    const navigate = useNavigate();
    const { data, loading, filters, setFilters } = useSuppliersOutstanding();
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [outstandingOrders, setOutstandingOrders] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (value) => {
        setSearchTerm(value);
        setFilters(prev => {
            const next = { ...prev };
            if (value) {
                next.search = value;
            } else {
                delete next.search;
            }
            return next;
        });
    };

    const handleApplyFilters = (filterValues) => {
        setFilters(prev => ({
            ...filterValues,
            ...(prev.search ? { search: prev.search } : {}),
        }));
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({});
    };

    const filterConfig = [
        {
            name: 'payment_status',
            label: 'Payment Status',
            type: 'select',
            options: [
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partial' },
            ],
        },
        { name: 'min_outstanding', label: 'Min Outstanding', type: 'number' },
        { name: 'max_outstanding', label: 'Max Outstanding', type: 'number' },
    ];

    const handleViewDetails = async (supplier) => {
        setSelectedSupplier(supplier);
        setShowDetailModal(true);
        setDetailLoading(true);
        try {
            const orders = await purchasesApi.suppliers.getOutstandingOrders(supplier.id);
            setOutstandingOrders(orders || []);
        } catch (error) {
            console.error('Failed to load outstanding orders:', error);
            setOutstandingOrders([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewOrderDetail = (orderId) => {
        navigate(`/purchases/orders/${orderId}`);
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
                <h1 className="text-3xl font-bold text-neutral-900">Suppliers Outstanding</h1>
                <p className="text-neutral-500 mt-1">View suppliers with outstanding balances</p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Search suppliers..."
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
                data={data}
                onRowClick={handleViewDetails}
            />

            {/* Supplier Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedSupplier(null);
                    setOutstandingOrders([]);
                }}
                title="Supplier Details"
                size="lg"
            >
                {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        {selectedSupplier && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-neutral-500">Supplier</p>
                                        <p className="font-medium">{selectedSupplier.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Code</p>
                                        <p className="font-medium">{selectedSupplier.code}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Total Outstanding (PKR)</p>
                                        <p className="text-xl font-bold text-error-600">
                                            {typeof selectedSupplier.outstanding === 'string'
                                                ? parseFloat(selectedSupplier.outstanding).toFixed(2)
                                                : '0.00'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500">Payment Status</p>
                                        <Badge variant={parseFloat(selectedSupplier.outstanding || 0) > 0 ? 'unpaid' : 'paid'}>
                                            {parseFloat(selectedSupplier.outstanding || 0) > 0 ? 'Outstanding' : 'Settled'}
                                        </Badge>
                                    </div>
                                </div>

                                {outstandingOrders.length > 0 ? (
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 mb-3">Outstanding Orders</h3>
                                        <div className="space-y-3">
                                            {outstandingOrders.map((order) => (
                                                <Card
                                                    key={order.id}
                                                    className="p-4 cursor-pointer hover:shadow-card-hover transition-shadow"
                                                    onClick={() => handleViewOrderDetail(order.id)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{order.order_number}</p>
                                                            <p className="text-sm text-neutral-500">
                                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                                            </p>
                                                            <div className="flex gap-2 mt-1">
                                                                <Badge variant={order.status === 'confirmed' ? 'confirmed' : 'draft'}>
                                                                    {order.status}
                                                                </Badge>
                                                                <Badge variant={
                                                                    order.payment_status === 'paid' ? 'paid' :
                                                                        order.payment_status === 'partial' ? 'partial' : 'unpaid'
                                                                }>
                                                                    {order.payment_status || 'N/A'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-error-600">
                                                                {typeof order.payable_outstanding === 'string'
                                                                    ? parseFloat(order.payable_outstanding).toFixed(2)
                                                                    : '0.00'}
                                                            </p>
                                                            <p className="text-sm text-neutral-500">
                                                                Total: {typeof order.net_payable === 'string'
                                                                    ? parseFloat(order.net_payable).toFixed(2)
                                                                    : '0.00'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-neutral-500 py-4">No outstanding orders</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default SuppliersOutstandingPage;