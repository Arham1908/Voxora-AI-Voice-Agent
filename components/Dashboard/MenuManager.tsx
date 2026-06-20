"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface MenuItem {
    id: string;
    name: string;
    cost: number;
    category: number | null;
    category_name?: string;
}

export default function MenuManager() {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [newItem, setNewItem] = useState({ name: "", cost: "", category: "" });
    const [newCat, setNewCat] = useState({ name: "", description: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCatSubmitting, setIsCatSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    
    // Searchable dropdown state
    const [catSearchTerm, setCatSearchTerm] = useState("");
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    
    const pageSize = 12;

    const exportToCSV = () => {
        const headers = ["ID", "Name", "Cost (PKR)", "Category"];
        const rows = menu.map(m => [
            m.id,
            `"${(m.name || "").replace(/"/g, '""')}"`,
            m.cost,
            `"${(m.category_name || "General").replace(/"/g, '""')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `menu_page_${page}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        loadData();
    }, [page, selectedCategoryId]);

    const loadData = async () => {
        try {
            const menuData = await api.getMenu({ 
                page, 
                pageSize, 
                categoryId: selectedCategoryId || undefined 
            });
            setMenu(menuData.menu || []);
            if (menuData.total_pages) setTotalPages(menuData.total_pages);
            
            const catData = await api.getCategories();
            setCategories(catData.categories || []);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCat.name) return;
        setIsCatSubmitting(true);
        try {
            await api.createCategory({ name: newCat.name, description: newCat.description });
            setNewCat({ name: "", description: "" });
            loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsCatSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Delete category? This might orphan menu items.")) return;
        try {
            await api.deleteCategory(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.cost) return;

        setIsSubmitting(true);
        try {
            await api.createMenuItem({
                name: newItem.name,
                cost: parseFloat(newItem.cost),
                category: newItem.category ? parseInt(newItem.category) : undefined
            });
            setNewItem({ name: "", cost: "", category: "" });
            setCatSearchTerm("");
            loadData();
        } catch (error) {
            console.error("Failed to add item:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        setDeletingId(id);
        try {
            await api.deleteMenuItem(id);
            setMenu(menu.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Failed to delete menu item. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    // Map of vibrant colors for category badges
    const catColors = [
        { bg: "from-teal-50 to-cyan-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
        { bg: "from-violet-50 to-purple-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
        { bg: "from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
        { bg: "from-rose-50 to-pink-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
        { bg: "from-emerald-50 to-green-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
        { bg: "from-blue-50 to-sky-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
    ];

    const getCatColor = (index: number) => catColors[index % catColors.length];

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Top Row: Category Manager + Add Item */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Manager */}
                <div className="glass rounded-2xl p-6">
                    <div className="section-header">
                        <div className="icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                                <path d="M7 7h.01"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Manage Categories</h3>
                            <p>Organize your menu into groups</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleAddCategory} className="flex gap-3 mb-5">
                        <input
                            type="text"
                            placeholder="New category name..."
                            value={newCat.name}
                            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                            className="input-premium flex-1"
                        />
                        <button
                            type="submit"
                            disabled={isCatSubmitting || !newCat.name}
                            className="btn-primary"
                        >
                            {isCatSubmitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14"/><path d="M12 5v14"/>
                                    </svg>
                                    Add
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2.5">
                        {categories.map((c, idx) => {
                            const color = getCatColor(idx);
                            return (
                                <span
                                    key={c.id}
                                    className={`category-chip bg-gradient-to-r ${color.bg} ${color.border} ${color.text}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                                    {c.name}
                                    <button
                                        onClick={() => handleDeleteCategory(c.id)}
                                        className="chip-delete"
                                        title={`Delete ${c.name}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                        {categories.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-sage-400 italic py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                                No categories yet. Create one above.
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Menu Item */}
                <div className="glass rounded-2xl p-6">
                    <div className="section-header">
                        <div className="icon-box" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M2 12h20"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Add New Item</h3>
                            <p>Create a new menu entry</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleAdd} className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Item name"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="input-premium"
                            />
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Select category..."
                                    value={catSearchTerm}
                                    onChange={(e) => {
                                        setCatSearchTerm(e.target.value);
                                        setIsCatDropdownOpen(true);
                                        setNewItem({ ...newItem, category: "" });
                                    }}
                                    onFocus={() => setIsCatDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsCatDropdownOpen(false), 200)}
                                    className="input-premium"
                                />
                                {isCatDropdownOpen && (
                                    <div className="absolute top-full left-0 z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-sage-100 bg-white/98 py-1 shadow-xl backdrop-blur-lg">
                                        <div 
                                            className="cursor-pointer px-4 py-2.5 text-sm text-sage-500 hover:bg-sage-50 hover:text-sage-700 flex items-center gap-2 transition-colors"
                                            onClick={() => {
                                                setNewItem({ ...newItem, category: "" });
                                                setCatSearchTerm("");
                                                setIsCatDropdownOpen(false);
                                            }}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-sage-300" />
                                            General (No Category)
                                        </div>
                                        {categories
                                            .filter(c => c.name.toLowerCase().includes(catSearchTerm.toLowerCase()))
                                            .map((c, idx) => {
                                                const color = getCatColor(idx);
                                                return (
                                                    <div 
                                                        key={c.id} 
                                                        className="cursor-pointer px-4 py-2.5 text-sm text-sage-800 hover:bg-sage-50 flex items-center gap-2 transition-colors"
                                                        onClick={() => {
                                                            setNewItem({ ...newItem, category: String(c.id) });
                                                            setCatSearchTerm(c.name);
                                                            setIsCatDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                                                        {c.name}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 text-sm font-medium">PKR</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newItem.cost}
                                    onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                                    className="input-premium pl-12"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newItem.name || !newItem.cost}
                                className="btn-primary"
                            >
                                {isSubmitting ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/><path d="M12 5v14"/>
                                        </svg>
                                        Add Item
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Menu Catalog */}
            <div className="glass rounded-2xl p-6 sm:p-8 flex flex-col min-h-[500px]">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="section-header !mb-0">
                        <div className="icon-box" style={{ background: 'linear-gradient(135deg, #eef8fa, #d5eff4)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a9aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Menu Catalog</h3>
                            <p>{menu.length} items • Page {page} of {totalPages}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => {
                                setSelectedCategoryId(e.target.value);
                                setPage(1);
                            }}
                            className="select-premium"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
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
                </div>

                {/* Menu Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                    {menu.map((item, idx) => {
                        const catIdx = categories.findIndex(c => c.name === item.category_name);
                        const color = catIdx >= 0 ? getCatColor(catIdx) : null;
                        return (
                            <div key={item.id} className="menu-card group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col flex-1 mr-2">
                                        <p className="font-bold text-sage-900 text-base leading-tight group-hover:text-sage-700 transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-sage-400 font-semibold mt-1.5 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M14 3l-2 18"/>
                                            </svg>
                                            {item.id}
                                        </p>
                                    </div>
                                    {item.category_name && (
                                        <span className={`category-badge ${color ? `bg-gradient-to-r ${color.bg} ${color.border} ${color.text}` : ''}`}>
                                            {item.category_name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end justify-between mt-auto pt-2">
                                    <div>
                                        <p className="price-tag">PKR {item.cost}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id, item.name)}
                                        disabled={deletingId === item.id}
                                        className="btn-danger-subtle"
                                    >
                                        {deletingId === item.id ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                </svg>
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {menu.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-sage-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40">
                                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                            </svg>
                            <p className="font-medium">No menu items found</p>
                            <p className="text-xs mt-1">Add items using the form above</p>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                <div className="pagination-wrapper mt-6">
                    <span className="pagination-info">
                        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn-secondary"
                        >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
