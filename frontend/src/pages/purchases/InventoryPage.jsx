import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { purchasesApi } from '../../services/purchasesApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FilterBar from '../../components/ui/FilterBar';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productDetail, setProductDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadLookups();
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [filters, searchTerm]);

    const loadLookups = async () => {
        try {
            const [cats, shelves] = await Promise.all([
                purchasesApi.categories.getAll(),
                purchasesApi.shelves.getAll(),
            ]);
            setCategories(cats.filter(c => !c.is_deleted));
            setShelves(shelves.filter(s => !s.is_deleted));
        } catch (error) {
            console.error('Failed to load lookups:', error);
        }
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (searchTerm) {
                params.search = searchTerm;
            }
            const data = await purchasesApi.inventory.getAll(params);
            setInventory(data || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            setInventory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleApplyFilters = (filterValues) => {
        setFilters(filterValues);
    };

    const handleResetFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const filterConfig = [
        {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: categories.map(c => ({ value: c.id, label: c.name })),
        },
        {
            name: 'shelf',
            label: 'Shelf',
            type: 'select',
            options: shelves.map(s => ({ value: s.id, label: s.name })),
        },
    ];

    const handleRowClick = async (row) => {
        // Get the product ID from the row
        const productId = row.product?.id;
        if (!productId) return;

        setSelectedProduct(row);
        setShowDetailModal(true);
        setDetailLoading(true);
        try {
            const detail = await purchasesApi.inventory.getByProduct(productId);
            setProductDetail(detail);
        } catch (error) {
            console.error('Failed to fetch product details:', error);
            setProductDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    // Calculate summary stats from the data
    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const lowStockItems = inventory.filter(item => (parseFloat(item.quantity) || 0) <= 5 && (parseFloat(item.quantity) || 0) > 0).length;
    const outOfStockItems = inventory.filter(item => (parseFloat(item.quantity) || 0) <= 0).length;

    const columns = [
        {
            key: 'product',
            label: 'Product Code',
            render: (value) => value?.code || 'N/A'
        },
        {
            key: 'product',
            label: 'Product Name',
            render: (value) => value?.name || 'N/A'
        },
        {
            key: 'product',
            label: 'Category',
            render: (value) => value?.category?.name || 'N/A'
        },
        {
            key: 'product',
            label: 'Shelf',
            render: (value) => value?.shelf?.name || 'N/A'
        },
        {
            key: 'quantity',
            label: 'Quantity',
            render: (value) => {
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return (
                    <span className={`font-semibold ${num <= 0 ? 'text-error-600' : num <= 5 ? 'text-warning-600' : 'text-success-600'}`}>
                        {isNaN(num) ? '0' : num}
                    </span>
                );
            }
        },
        {
            key: 'last_updated_at',
            label: 'Last Updated',
            render: (value) => value ? new Date(value).toLocaleString() : 'N/A'
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
                <h1 className="text-3xl font-bold text-neutral-900">Inventory</h1>
                <p className="text-neutral-500 mt-1">View current inventory levels across all products</p>
                <p className="text-sm text-neutral-400 mt-1">Click on any row to view detailed product information</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Total Products</p>
                    <p className="text-2xl font-bold text-neutral-900">{totalProducts}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Total Stock</p>
                    <p className="text-2xl font-bold text-neutral-900">{totalStock}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Low Stock (≤ 5)</p>
                    <p className="text-2xl font-bold text-warning-600">{lowStockItems}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-neutral-500">Out of Stock</p>
                    <p className="text-2xl font-bold text-error-600">{outOfStockItems}</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Search products by name or code..."
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

            {/* Inventory Table */}
            <Table
                columns={columns}
                data={inventory}
                onRowClick={handleRowClick}
            />

            {inventory.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-neutral-900">No Inventory Found</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {/* Inventory Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedProduct(null);
                    setProductDetail(null);
                }}
                title="Product Details"
                size="lg"
            >
                {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : productDetail ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-neutral-500">Product Name</p>
                                <p className="font-medium">{productDetail.product?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Product Code</p>
                                <p className="font-medium">{productDetail.product?.code || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Category</p>
                                <p className="font-medium">{productDetail.product?.category?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Shelf</p>
                                <p className="font-medium">{productDetail.product?.shelf?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Current Quantity</p>
                                <p className={`text-xl font-bold ${productDetail.quantity <= 0 ? 'text-error-600' :
                                        productDetail.quantity <= 5 ? 'text-warning-600' : 'text-success-600'
                                    }`}>
                                    {productDetail.quantity || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Status</p>
                                <Badge variant={
                                    productDetail.quantity <= 0 ? 'error' :
                                        productDetail.quantity <= 5 ? 'warning' : 'success'
                                }>
                                    {productDetail.quantity <= 0 ? 'Out of Stock' :
                                        productDetail.quantity <= 5 ? 'Low Stock' : 'In Stock'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Last Updated</p>
                                <p className="font-medium">
                                    {productDetail.last_updated_at ? new Date(productDetail.last_updated_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Last Updated By</p>
                                <p className="font-medium">{productDetail.last_updated_by || 'N/A'}</p>
                            </div>
                        </div>

                        {productDetail.product?.description && (
                            <div>
                                <p className="text-sm text-neutral-500">Description</p>
                                <p className="font-medium">{productDetail.product.description}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-neutral-500">No product details available</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InventoryPage;