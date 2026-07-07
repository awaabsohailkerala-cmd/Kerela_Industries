import { useState, useEffect, useCallback, useRef } from 'react';
import { billingApi } from '../services/billingApi';

// Generic CRUD hook for billing resources
export const useBillingCRUD = (service, initialFilters = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const debounceTimer = useRef(null);

    const fetchData = useCallback(async (filterParams = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await service.getAll(filterParams);
            setData(result || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [service]);

    useEffect(() => {
        fetchData(appliedFilters);
    }, []);

    const applyFilters = useCallback((newFilters) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        setFilters(newFilters);
        debounceTimer.current = setTimeout(() => {
            const cleanFilters = {};
            Object.keys(newFilters).forEach(key => {
                const value = newFilters[key];
                if (value !== '' && value !== null && value !== undefined) {
                    cleanFilters[key] = value;
                }
            });
            setAppliedFilters(cleanFilters);
            fetchData(cleanFilters);
        }, 500);
    }, [fetchData]);

    const create = async (data) => {
        setLoading(true);
        try {
            const result = await service.create(data);
            await fetchData(appliedFilters);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id, data) => {
        setLoading(true);
        try {
            const result = await service.update(id, data);
            await fetchData(appliedFilters);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        setLoading(true);
        try {
            await service.delete(id);
            await fetchData(appliedFilters);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        fetchData(initialFilters);
    };

    return {
        data,
        loading,
        error,
        filters,
        appliedFilters,
        setFilters: applyFilters,
        resetFilters,
        refetch: () => fetchData(appliedFilters),
        create,
        update,
        delete: deleteItem,
    };
};

// Hook for invoice detail with payment summary
export const useInvoiceDetail = (invoiceId) => {
    const [invoice, setInvoice] = useState(null);
    const [paymentSummary, setPaymentSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDetail = useCallback(async () => {
        if (!invoiceId) return;
        setLoading(true);
        setError(null);
        try {
            const [invoiceData, summaryData] = await Promise.all([
                billingApi.invoices.getById(invoiceId),
                billingApi.invoices.getPaymentSummary(invoiceId),
            ]);
            setInvoice(invoiceData);
            setPaymentSummary(summaryData);
        } catch (err) {
            setError(err.message || 'Failed to fetch invoice details');
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return { invoice, paymentSummary, loading, error, refetch: fetchDetail };
};