import { useState, useEffect, useCallback } from 'react';
import { purchasesApi } from '../services/purchasesApi';
import { usePaginatedList } from './usePaginatedList';

// Generic hook for CRUD operations — thin wrapper around usePaginatedList.
export const useCRUD = (service, initialFilters = {}) => {
    const {
        data, meta, loading: listLoading, error: listError,
        filters, setFilters, page, setPage, refetch,
    } = usePaginatedList((params) => service.getAll(params), initialFilters);

    const [mutating, setMutating] = useState(false);
    const [mutationError, setMutationError] = useState(null);

    const create = async (payload) => {
        setMutating(true);
        try {
            const result = await service.create(payload);
            await refetch();
            return result;
        } catch (err) {
            setMutationError(err.message);
            throw err;
        } finally {
            setMutating(false);
        }
    };

    const update = async (id, payload) => {
        setMutating(true);
        try {
            const result = await service.update(id, payload);
            await refetch();
            return result;
        } catch (err) {
            setMutationError(err.message);
            throw err;
        } finally {
            setMutating(false);
        }
    };

    const deleteItem = async (id) => {
        setMutating(true);
        try {
            await service.delete(id);
            // Deleted the last item on a page beyond page 1 — step back a page.
            if (data.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                await refetch();
            }
        } catch (err) {
            setMutationError(err.message);
            throw err;
        } finally {
            setMutating(false);
        }
    };

    return {
        data,
        meta,
        page,
        setPage,
        loading: listLoading || mutating,
        error: listError || mutationError,
        filters,
        setFilters,
        refetch,
        create,
        update,
        delete: deleteItem,
    };
};

// Hook for supplier outstanding — Suppliers are excluded from pagination
// (client confirmed there are only ~10-15), so this stays a plain list fetch.
export const useSuppliersOutstanding = (initialFilters = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await purchasesApi.suppliers.getOutstanding(filters);
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, filters, setFilters, refetch: fetchData };
};
