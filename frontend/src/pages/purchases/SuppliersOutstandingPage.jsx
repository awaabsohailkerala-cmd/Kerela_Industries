import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSuppliersOutstanding } from '../../hooks/usePurchases';
import { purchasesApi } from '../../services/purchasesApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import OrderDetailModal from '../../components/purchases/OrderDetailModal';

const SuppliersOutstandingPage = () => {
    const { data, loading, filters, setFilters, refetch } = useSuppliersOutstanding();
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [outstandingOrders, setOutstandingOrders] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

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
        setSelectedOrderId(orderId);
        setShowOrderDetail(true);
    };

    const handleOrderUpdated = () => {
        // Refresh the outstanding orders list
        if (selectedSupplier) {
            purchasesApi.suppliers.getOutstandingOrders(selectedSupplier.id).then(orders => {
                setOutstandingOrders(orders || []);
            });
        }
        // Refresh the main list
        refetch();
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

            <div className="flex gap-4 flex-wrap">
                <SearchBar
                    onSearch={(value) => setFilters({ ...filters, search: value })}
                    placeholder="Search suppliers..."
                    className="flex-1 min-w-[200px]"
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

                <button
                    onClick={() => refetch()}
                    className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                    Apply Filters
                </button>
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

            {/* Order Detail Modal - Reused component */}
            <OrderDetailModal
                isOpen={showOrderDetail}
                onClose={() => {
                    setShowOrderDetail(false);
                    setSelectedOrderId(null);
                }}
                orderId={selectedOrderId}
                onOrderUpdated={handleOrderUpdated}
            />
        </div>
    );
};

export default SuppliersOutstandingPage;