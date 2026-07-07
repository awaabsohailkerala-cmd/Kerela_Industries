import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const ReturnForm = ({ onSubmit, onCancel, loading, orderItems }) => {
    const [items, setItems] = useState([]);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState({});

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { invoice_item_id: '', quantity: 1 }
        ]);
    };

    const handleUpdateItem = (index, field, value) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
        if (errors[`item_${index}`]) {
            setErrors(prev => ({ ...prev, [`item_${index}`]: '' }));
        }
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = {};
        items.forEach((item, index) => {
            if (!item.invoice_item_id) {
                newErrors[`item_${index}`] = 'Please select an item';
            }
            if (!item.quantity || item.quantity <= 0) {
                newErrors[`item_${index}`] = 'Quantity must be greater than 0';
            }
            // Check against returnable quantity
            const selectedItem = orderItems.find(i => i.id === parseInt(item.invoice_item_id));
            if (selectedItem && item.quantity > selectedItem.returnable_quantity) {
                newErrors[`item_${index}`] = `Max returnable: ${selectedItem.returnable_quantity}`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (items.length === 0) {
            alert('Please add at least one item to return');
            return;
        }
        onSubmit({
            items: items.map(item => ({
                invoice_item_id: parseInt(item.invoice_item_id),
                quantity: parseInt(item.quantity) || 0,
            })),
            note: note,
        });
    };

    const getReturnableItems = () => {
        return orderItems.filter(item => (item.returnable_quantity || 0) > 0);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-neutral-900">Items to Return</h4>
                    <Button size="sm" onClick={handleAddItem}>
                        Add Item
                    </Button>
                </div>

                {items.length === 0 ? (
                    <p className="text-center text-neutral-500 py-4">No items added yet</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {items.map((item, index) => {
                            const selectedItem = orderItems.find(i => i.id === parseInt(item.invoice_item_id));
                            const returnableQty = selectedItem?.returnable_quantity || 0;

                            return (
                                <div key={index} className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 rounded-lg">
                                    <Select
                                        label="Product"
                                        value={item.invoice_item_id}
                                        onChange={(e) => handleUpdateItem(index, 'invoice_item_id', e.target.value)}
                                        options={[
                                            { value: '', label: 'Select item' },
                                            ...getReturnableItems().map(i => ({
                                                value: i.id,
                                                label: `${i.product_name} (Returnable: ${i.returnable_quantity})`,
                                            })),
                                        ]}
                                        required
                                    />
                                    <Input
                                        label="Quantity"
                                        type="number"
                                        min="1"
                                        max={returnableQty || undefined}
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        required
                                    />
                                    <div className="flex items-end">
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleRemoveItem(index)}
                                            className="w-full"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    {errors[`item_${index}`] && (
                                        <p className="col-span-3 text-sm text-error-500">{errors[`item_${index}`]}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Input
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Return note (optional)"
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    Create Return
                </Button>
            </div>
        </form>
    );
};

ReturnForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    orderItems: PropTypes.array,
};

export default ReturnForm;