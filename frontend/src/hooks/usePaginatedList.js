import { useState, useEffect, useCallback } from 'react';

// Shared primitive: unwraps a {count, total_pages, current_page, page_size,
// results} paginated response and tracks page/filters state. Every list
// consumer in the app routes through this, directly or via a wrapping hook.
export const usePaginatedList = (fetchFn, initialFilters = {}, pageSize = 25) => {
    const [results, setResults] = useState([]);
    const [meta, setMeta] = useState({ count: 0, totalPages: 1, currentPage: 1, pageSize });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFiltersState] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [extra, setExtra] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchFn({ ...filters, page, page_size: pageSize });
            // Some endpoints (e.g. Suppliers) are deliberately excluded from
            // pagination and still return a plain array — handle both shapes.
            if (Array.isArray(response)) {
                setResults(response);
                setMeta({ count: response.length, totalPages: 1, currentPage: 1, pageSize: response.length });
                setExtra({});
            } else {
                setResults(response?.results || []);
                setMeta({
                    count: response?.count ?? 0,
                    totalPages: response?.total_pages ?? 1,
                    currentPage: response?.current_page ?? page,
                    pageSize: response?.page_size ?? pageSize,
                });
                // Any extra top-level fields a view adds (e.g. "stats") pass through as-is.
                const { count, total_pages, current_page, page_size, results, ...rest } = response || {};
                setExtra(rest);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [fetchFn, filters, page, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Changing filters always resets back to page 1.
    const setFilters = (newFilters) => {
        setFiltersState(newFilters);
        setPage(1);
    };

    return { data: results, meta, extra, loading, error, filters, setFilters, page, setPage, refetch: fetchData };
};
