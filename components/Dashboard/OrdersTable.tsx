"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import OrderDetailsModal from "./OrderDetailsModal";
import type { Order } from "@/types/order";

export default function OrdersTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const exportToCSV = () => {
        const headers = ["Order ID", "Customer Name", "Status", "Cost (PKR)", "Created At"];
        const rows = orders.map(o => [
            o.id || "",
            `"${(o.customer_name || "").replace(/"/g, '""')}"`,
            o.status || "",
            o.total_price || "",
            o.created_at || ""
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_page_${page}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

  useEffect(() => {
    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await api.getOrders({ page, pageSize });

            const statuses = ["Pending", "Completed", "Cancelled", "Processing"];
            const ordersWithRandomStatus: Order[] = (data.orders || []).map((order: Order): Order => ({
                ...order,
                status: statuses[Math.floor(Math.random() * statuses.length)] as Order['status'],
            }));

            setOrders(ordersWithRandomStatus);
            if (data.total_pages) setTotalPages(data.total_pages);
        } catch (error) {
            console.error("Failed to load orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadOrders();
}, [page]);

    const statusStyles: Record<string, string> = {
        Completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        Cancelled: "bg-red-50 text-red-600 border border-red-200",
        Processing: "bg-blue-50 text-blue-600 border border-blue-200",
        Pending: "bg-amber-50 text-amber-600 border border-amber-200",
    };

    const statusIcons: Record<string, React.ReactNode> = {
        Completed: (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        ),
        Cancelled: (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ),
        Processing: (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
        ),
        Pending: (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ),
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-3 border-sage-100 border-t-sage-500"></div>
                    <span className="text-sm text-sage-400 font-medium">Loading orders...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass overflow-hidden rounded-2xl flex flex-col h-full">
            {/* Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-sage-100/50 bg-white/40 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="section-header !mb-0">
                    <div className="icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                    </div>
                    <div>
                        <h3>Order History</h3>
                        <p>Manage and track all customer interactions</p>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="btn-secondary"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                    </svg>
                    Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[550px]">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-sage-50/50 text-[11px] font-bold uppercase tracking-wider text-sage-400 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="px-6 py-3.5 w-16 text-center">#</th>
                            <th className="px-6 py-3.5">Customer</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5 text-right">Cost</th>
                            <th className="px-6 py-3.5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-50/80">
                        {orders.map((order, index) => (
                            <tr key={order.id} className="hover:bg-sage-50/40 transition-colors group">
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-sage-400 bg-sage-50 rounded-md px-2 py-1">
                                        {(page - 1) * pageSize + index + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sage-100 to-sage-200 text-sage-600 text-xs font-bold shrink-0">
                                            {(order.customer_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-sage-900 text-sm truncate">{order.customer_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${statusStyles[order.status || "Pending"] || statusStyles.Pending}`}>
                                   {/* //     {statusIcons[order.status || "Pending"]} */}
                                        {order.status || "Pending"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-sage-900 text-sm">PKR {order?.total_price}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleViewDetails(order)}
                                        className="btn-secondary !py-1.5 !px-3 !text-xs"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 sm:px-8 py-4 border-t border-sage-100/50 bg-white/40 flex items-center justify-between mt-auto">
                <span className="pagination-info">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="btn-secondary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                        className="btn-secondary"
                    >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                </div>
            </div>

            <OrderDetailsModal
                isOpen={isModalOpen}
                order={selectedOrder}
                onClose={closeModal}
            />
        </div>
    );
}
