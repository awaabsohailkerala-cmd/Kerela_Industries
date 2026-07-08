import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const SavedPDFDrawer = ({ isOpen, onClose, pdfs, onDelete, loading }) => {
    const handleDownload = (url, fileName) => {
        window.open(url, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-neutral-900">Saved PDFs</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <LoadingSpinner />
                                </div>
                            ) : pdfs.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📄</div>
                                    <p className="text-neutral-500">No saved PDFs</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pdfs.map((pdf) => (
                                        <div
                                            key={pdf.id}
                                            className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-neutral-900">{pdf.file_name}</p>
                                                    <p className="text-xs text-neutral-500">
                                                        {pdf.date_from && pdf.date_to
                                                            ? `${new Date(pdf.date_from).toLocaleDateString()} - ${new Date(pdf.date_to).toLocaleDateString()}`
                                                            : 'Full history'}
                                                    </p>
                                                    <p className="text-xs text-neutral-400 mt-1">
                                                        Saved by {pdf.saved_by} • {new Date(pdf.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 ml-2">
                                                    <button
                                                        onClick={() => handleDownload(pdf.file_url, pdf.file_name)}
                                                        className="text-primary-600 hover:text-primary-700 text-sm"
                                                    >
                                                        Download
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(pdf.id)}
                                                        className="text-error-600 hover:text-error-700 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

SavedPDFDrawer.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    pdfs: PropTypes.array,
    onDelete: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default SavedPDFDrawer;