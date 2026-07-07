import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const DraftPreviewPanel = ({ preview }) => {
    if (!preview) {
        return (
            <Card className="p-6">
                <p className="text-center text-neutral-500">No preview available</p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Draft Preview</h3>

            {preview.warnings && (preview.warnings.missing_rate || preview.warnings.missing_stock) && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                        {preview.warnings.missing_rate && '⚠️ Some products are missing selling prices. '}
                        {preview.warnings.missing_stock && '⚠️ Some products have insufficient stock.'}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                        Preview only — no stock reserved, no prices committed. Confirm to finalise.
                    </p>
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.items?.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-between text-sm p-2 border-b border-neutral-100"
                    >
                        <div>
                            <span className="font-medium">{item.product_name}</span>
                            <span className="text-neutral-500 ml-2">× {item.quantity}</span>
                            {item.rate_missing && (
                                <Badge variant="warning" className="ml-2">No Rate</Badge>
                            )}
                            {item.stock_insufficient && (
                                <Badge variant="error" className="ml-2">Low Stock</Badge>
                            )}
                        </div>
                        <span className="font-medium">
                            {item.line_total ? `$${parseFloat(item.line_total).toFixed(2)}` : 'N/A'}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="font-medium">${preview.subtotal || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">GST Total</span>
                    <span className="font-medium">${preview.gst_total || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">WHT Total</span>
                    <span className="font-medium">${preview.wht_total || '0.00'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                    <span>Grand Total</span>
                    <span className="text-primary-600">${preview.grand_total || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                    <span className="text-neutral-500">Total COGS</span>
                    <span className="font-medium">${preview.total_cogs || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Gross Profit</span>
                    <span className="font-medium text-success-600">${preview.gross_profit || '0.00'}</span>
                </div>
            </div>

            <p className="text-xs text-neutral-400 mt-4 italic">
                Preview only — no stock reserved, no prices committed. Confirm to finalise.
            </p>
        </Card>
    );
};

DraftPreviewPanel.propTypes = {
    preview: PropTypes.shape({
        items: PropTypes.array,
        subtotal: PropTypes.string,
        gst_total: PropTypes.string,
        wht_total: PropTypes.string,
        grand_total: PropTypes.string,
        total_cogs: PropTypes.string,
        gross_profit: PropTypes.string,
        warnings: PropTypes.shape({
            missing_rate: PropTypes.bool,
            missing_stock: PropTypes.bool,
        }),
    }),
};

export default DraftPreviewPanel;