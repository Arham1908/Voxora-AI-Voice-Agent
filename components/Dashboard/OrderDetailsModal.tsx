"use client";

import type { Order } from "@/types/order";

interface OrderDetailsModalProps {
    isOpen: boolean;
    order: Order | null;
    onClose: () => void;
}

export default function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
    if (!isOpen || !order) return null;

    const statusStyles: Record<string, string> = {
        Completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        Cancelled: "bg-red-50 text-red-600 border border-red-200",
        Processing: "bg-blue-50 text-blue-600 border border-blue-200",
        Pending: "bg-amber-50 text-amber-600 border border-amber-200",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-up border border-sage-100/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-sage-100/50 bg-gradient-to-r from-sage-50/50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 text-sage-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-sage-900">Order Details</h3>
                                <p className="text-xs text-sage-400 font-medium">Order #{order.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sage-400 cursor-pointer hover:bg-sage-100 hover:text-sage-600 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="px-6 sm:px-8 py-6 space-y-6">
                    {/* Customer Information */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            </svg>
                            <h4 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Customer Information</h4>
                        </div>
                        <div className="space-y-2 bg-sage-50/30 rounded-xl p-4 border border-sage-100/40">
                            <div className="flex justify-between text-sm">
                                <span className="text-sage-500 font-medium">Name</span>
                                <span className="font-semibold text-sage-900">{order.customer_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-sage-500 font-medium">Phone</span>
                                <span className="font-semibold text-sage-900">{order.phone_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-sage-500 font-medium">Created</span>
                                <span className="font-semibold text-sage-900">
                                    {new Date(order.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            <h4 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Delivery Address</h4>
                        </div>
                        <div className="space-y-2 bg-sage-50/30 rounded-xl p-4 border border-sage-100/40">
                            <div className="flex justify-between text-sm">
                                <span className="text-sage-500 font-medium">Address</span>
                                <span className="font-semibold text-sage-900 text-right max-w-[60%]">{order.address}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-sage-500 font-medium">Landmark</span>
                                <span className="font-semibold text-sage-900 text-right">{order.landmark}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/>
                            </svg>
                            <h4 className="text-xs font-bold text-sage-500 uppercase tracking-wider">Order Items</h4>
                        </div>
                        <div className="space-y-2">
                            {order.items.map((item, index) => {
                                const unitPrice = item.price ?? item.cost ?? 0;
                                const quantity = item.qty ?? 0;
                                return (
                                    <div key={index} className="flex justify-between items-center p-3.5 bg-sage-50/30 rounded-xl border border-sage-100/40 hover:bg-sage-50/60 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-semibold text-sage-900 text-sm">{item.name}</p>
                                            <p className="text-xs text-sage-500 mt-0.5">Qty: {quantity} × PKR {unitPrice}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sage-900 text-sm">PKR {unitPrice * quantity}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total + Status */}
                    <div className="pt-4 border-t border-sage-100/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold text-sage-500">Total Price</span>
                            <span className="text-xl font-black text-sage-900" style={{ background: 'linear-gradient(135deg, #1d6574, #2a9aad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                PKR {Number(order.total_price).toFixed(2)}
                            </span>
                        </div>
                        {order.status && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-sage-500">Status</span>
                                <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold ${
                                    statusStyles[order.status] || statusStyles.Pending
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-sage-100/50 bg-sage-50/20">
                    <button
                        onClick={onClose}
                        className="btn-primary w-full justify-center"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
