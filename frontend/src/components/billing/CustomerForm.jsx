import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CustomerForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        mobile: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                code: initialData.code || '',
                address: initialData.address || '',
                mobile: initialData.mobile || '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.code) newErrors.code = 'Code is required';
        if (!formData.address) newErrors.address = 'Address is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                error={errors.name}
                required
            />
            <Input
                label="Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter unique code"
                error={errors.code}
                required
            />
            <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                error={errors.address}
                required
            />
            <Input
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number (optional)"
            />
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Update Customer' : 'Create Customer'}
                </Button>
            </div>
        </motion.form>
    );
};

CustomerForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default CustomerForm;