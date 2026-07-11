import { useState, useEffect, useCallback } from 'react';
import { ratesApi } from '../services/ratesApi';
import { purchasesApi } from '../services/purchasesApi';

// Every rate already carries its full product — start from that (works for
// every role). Products with no rate yet are appended on top ONLY if the
// caller has Purchases-app access (admin/superuser); normal users have none,
// so that extra fetch is allowed to fail without breaking the rate list.
const combineProductsWithRates = (products, rates) => {
    const rateMap = {};
    const combined = rates
        .filter(rate => rate.product?.id)
        .map(rate => {
            rateMap[rate.product.id] = true;
            return { product: rate.product, rate };
        });

    products
        .filter(product => !rateMap[product.id])
        .forEach(product => combined.push({ product, rate: null }));

    return combined;
};

export const useRates = (initialFilters = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Rates are viewable by every role; the full product list is
            // Purchases-app-gated (admin/superuser only), so it's fetched
            // best-effort and simply omitted for normal users.
            const [ratesResult, productsResult] = await Promise.allSettled([
                ratesApi.getAll(filters),
                purchasesApi.products.getAll(),
            ]);

            if (ratesResult.status === 'rejected') {
                throw ratesResult.reason;
            }
            const rates = ratesResult.value || [];
            const products = productsResult.status === 'fulfilled' ? (productsResult.value || []) : [];

            // Combine products with their rates
            let combined = combineProductsWithRates(products, rates);

            // Apply filters on the frontend
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                combined = combined.filter(item =>
                    (item.product.name && item.product.name.toLowerCase().includes(searchLower)) ||
                    (item.product.code && item.product.code.toLowerCase().includes(searchLower))
                );
            }
            if (filters.category) {
                combined = combined.filter(item => {
                    const catId = item.product.category?.id || item.product.category;
                    return String(catId) === String(filters.category);
                });
            }

            setData(combined);
        } catch (err) {
            setError(err.message || 'Failed to fetch rates');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const create = async (data) => {
        setLoading(true);
        try {
            const result = await ratesApi.create(data);
            await fetchData();
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
            const result = await ratesApi.update(id, data);
            await fetchData();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        filters,
        setFilters,
        refetch: fetchData,
        create,
        update,
    };
};

export const useRateHistory = (productId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await ratesApi.getHistory(productId);
            setData(result || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch history');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { data, loading, error, refetch: fetchHistory };
};