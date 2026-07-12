import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useRates } from '../../hooks/useRates';
import RateTable from '../../components/rates/RateTable';
import RateFormModal from '../../components/rates/RateFormModal';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { useNavigate } from 'react-router-dom';

const RatesPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
    const navigate = useNavigate();

    const {
        data, meta, page, setPage, loading,
        filters, setFilters, categories, create, update,
    } = useRates();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedRate, setSelectedRate] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const handleSearch = (value) => {
        setFilters({ ...filters, search: value });
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const handleResetFilters = () => {
        setFilters({});
    };

    const handleEdit = (product, rate) => {
        setSelectedProduct(product);
        setSelectedRate(rate || null);
        setShowModal(true);
    };

    const handleViewHistory = (product) => {
        navigate(`/rates/history/${product.id}`);
    };

    const handleSubmit = async (formData) => {
        setFormLoading(true);
        try {
            if (selectedRate) {
                // Update existing rate
                await update(selectedRate.id, {
                    selling_price: formData.selling_price,
                    note: formData.note,
                });
            } else {
                // Create new rate
                await create({
                    product_id: selectedProduct.id,
                    selling_price: formData.selling_price,
                    note: formData.note,
                });
            }
            setShowModal(false);
            setSelectedProduct(null);
            setSelectedRate(null);
        } catch (error) {
            console.error('Failed to save rate:', error);
            alert(error.response?.data?.detail || 'Failed to save rate');
        } finally {
            setFormLoading(false);
        }
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
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Product Rates</h1>
                <p className="text-neutral-500 mt-1">
                    Manage selling prices for all products
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                    {isAdmin ? 'Admin users can set and edit prices' : 'View-only mode'}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder="Search by product name or code..."
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
                {(Object.keys(filters).length > 0) && (
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Rate Table */}
            <RateTable
                rates={data}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onViewHistory={handleViewHistory}
                loading={loading}
            />

            {meta.totalPages > 1 && (
                <Pagination
                    currentPage={meta.currentPage}
                    totalPages={meta.totalPages}
                    onPageChange={setPage}
                />
            )}

            {/* Rate Form Modal */}
            <RateFormModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedProduct(null);
                    setSelectedRate(null);
                }}
                onSubmit={handleSubmit}
                product={selectedProduct}
                existingRate={selectedRate}
                loading={formLoading}
            />
        </div>
    );
};

export default RatesPage;