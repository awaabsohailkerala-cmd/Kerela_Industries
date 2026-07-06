import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { purchasesApi } from '../../services/purchasesApi';
import Table from '../../components/ui/Table';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [shelves, setShelves] = useState([]);

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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({});
        setSearchTerm('');
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
            <div className="flex flex-col sm:flex-row gap-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Search products by name or code..."
                    className="flex-1"
                />
                <Select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    options={[
                        { value: '', label: 'All Categories' },
                        ...categories.map(c => ({ value: c.id, label: c.name })),
                    ]}
                    className="w-48"
                />
                <Select
                    value={filters.shelf || ''}
                    onChange={(e) => handleFilterChange('shelf', e.target.value)}
                    options={[
                        { value: '', label: 'All Shelves' },
                        ...shelves.map(s => ({ value: s.id, label: s.name })),
                    ]}
                    className="w-48"
                />
                {(Object.keys(filters).length > 0 || searchTerm) && (
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Inventory Table */}
            <Table
                columns={columns}
                data={inventory}
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
        </div>
    );
};

export default InventoryPage;