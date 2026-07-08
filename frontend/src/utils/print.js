export const printInvoice = async (invoiceId, isDraft = false) => {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Please login again to print');
        }

        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(
            `${baseUrl}/api/billing/invoices/${invoiceId}/print/?is_draft=${isDraft}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to print invoice');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        console.error('Print error:', error);
        throw error;
    }
};