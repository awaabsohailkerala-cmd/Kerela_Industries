import { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../services/ledgerApi';

// Hook for ledger list
export const useLedgerList = (initialFilters = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const cleanFilters = {};
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                    cleanFilters[key] = filters[key];
                }
            });
            const result = await ledgerApi.getAll(cleanFilters);
            setData(result || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch ledgers');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, filters, setFilters, refetch: fetchData };
};

// Hook for ledger detail
export const useLedgerDetail = (ledgerId, initialFilters = {}) => {
    const [ledger, setLedger] = useState(null);
    const [entries, setEntries] = useState([]);
    const [closingBalance, setClosingBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

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
            const result = await ledgerApi.getById(ledgerId, cleanFilters);
            setLedger(result.ledger);
            setEntries(result.entries || []);
            setClosingBalance(result.closing_balance || 0);
        } catch (err) {
            setError(err.message || 'Failed to fetch ledger details');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [ledgerId, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ledger,
        entries,
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
            const result = await ledgerApi.getSavedPDFs(ledgerId);
            setData(result || []);
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