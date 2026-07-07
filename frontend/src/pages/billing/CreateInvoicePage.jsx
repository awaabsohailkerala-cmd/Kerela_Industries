import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { billingApi } from '../../services/billingApi';
import { purchasesApi } from '../../services/purchasesApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LineItemRow from '../../components/billing/LineItemRow';
import DraftPreviewPanel from '../../components/billing/DraftPreviewPanel';

const CreateInvoicePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [preview, setPreview] = useState(null);

    const [formData, setFormData] = useState({
        customer_id: '',
        items: [],
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [customersData, productsData] = await Promise.all([
                billingApi.customers.getAll(),
                purchasesApi.products.getAll(),
            ]);
            setCustomers(customersData || []);
            setProducts(productsData || []);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { product_id: '', quantity: 1, discount: 0, gst: 0, wht: 0, selling_price: 0 }
            ]
        }));
    };

    const handleUpdateItem = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    const updatedItem = { ...item, [field]: value };
                    // If product changes, update selling price
                    if (field === 'product_id') {
                        const product = products.find(p => p.id === parseInt(value));
                        updatedItem.selling_price = product?.rate?.selling_price || 0;
                    }
                    return updatedItem;
                }
                return item;
            })
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                customer_id: parseInt(formData.customer_id),
                items: formData.items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity) || 0,
                    discount: parseFloat(item.discount) || 0,
                    gst: parseFloat(item.gst) || 0,
                    wht: parseFloat(item.wht) || 0,
                })),
            };
            const result = await billingApi.invoices.create(data);
            navigate(`/billing/invoices/${result.id}`);
        } catch (error) {
            console.error('Failed to create invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/billing/invoices');
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Create Invoice</h1>
                    <p className="text-neutral-500 mt-1">Create a new draft invoice</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        Create Draft
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <div className="max-w-md">
                        <Select
                            label="Customer"
                            value={formData.customer_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                            options={[
                                { value: '', label: 'Select customer' },
                                ...customers.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` })),
                            ]}
                            required
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-neutral-900">Line Items</h3>
                        <Button size="sm" onClick={handleAddItem}>
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.items.length === 0 ? (
                            <p className="text-center text-neutral-500 py-8">No items added yet. Click "Add Item" to start.</p>
                        ) : (
                            formData.items.map((item, index) => (
                                <LineItemRow
                                    key={index}
                                    index={index}
                                    item={item}
                                    products={products}
                                    onUpdate={handleUpdateItem}
                                    onRemove={handleRemoveItem}
                                    canEdit={true}
                                />
                            ))
                        )}
                    </div>
                </Card>

                {formData.items.length > 0 && (
                    <DraftPreviewPanel preview={preview} />
                )}
            </form>
        </div>
    );
};

export default CreateInvoicePage;