import { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../services/ledgerApi';
import { usePaginatedList } from './usePaginatedList';

// Hook for ledger list — thin wrapper around usePaginatedList.
export const useLedgerList = (initialFilters = {}) => {
    const { data, meta, loading, error, filters, setFilters, page, setPage, refetch } =
        usePaginatedList((params) => ledgerApi.getAll(params), initialFilters);

    return { data, meta, page, setPage, loading, error, filters, setFilters, refetch };
};

// Hook for ledger detail — entries come back paginated (manually, on the
// backend, since running balance is computed over the full history first).
export const useLedgerDetail = (ledgerId, initialFilters = {}, pageSize = 25) => {
    const [ledger, setLedger] = useState(null);
    const [entries, setEntries] = useState([]);
    const [meta, setMeta] = useState({ count: 0, totalPages: 1, currentPage: 1, pageSize });
    const [closingBalance, setClosingBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFiltersState] = useState(initialFilters);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async () => {
        if (!ledgerId) return;
        setLoading(true);
        setError(null);
        try {
            const cleanFilters = {};
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                    cleanFilters[key] = filters[key];
                }
            });
            const result = await ledgerApi.getById(ledgerId, { ...cleanFilters, page, page_size: pageSize });
            setLedger(result.ledger);
            setEntries(result.results || []);
            setClosingBalance(result.closing_balance || 0);
            setMeta({
                count: result.count ?? 0,
                totalPages: result.total_pages ?? 1,
                currentPage: result.current_page ?? page,
                pageSize: result.page_size ?? pageSize,
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch ledger details');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [ledgerId, filters, page, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setFilters = (newFilters) => {
        setFiltersState(newFilters);
        setPage(1);
    };

    return {
        ledger,
        entries,
        meta,
        page,
        setPage,
        closingBalance,
        loading,
        error,
        filters,
        setFilters,
        refetch: fetchData
    };
};

// Hook for saved PDFs
export const useSavedPDFs = (ledgerId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!ledgerId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await ledgerApi.getSavedPDFs(ledgerId, { page_size: 500 });
            setData(result?.results ?? result ?? []);
        } catch (err) {
            setError(err.message || 'Failed to fetch saved PDFs');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [ledgerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const deletePDF = async (pdfId) => {
        setLoading(true);
        try {
            await ledgerApi.deleteSavedPDF(pdfId);
            await fetchData();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refetch: fetchData, deletePDF };
};