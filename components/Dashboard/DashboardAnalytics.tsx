"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatCard from "./StatCard";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#2a9aad", "#3a3a5c", "#72c7d6", "#44afc2", "#8b5cf6"];

export default function DashboardAnalytics() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        activeMenuItems: 0,
        totalCalls: 0,
        todayOrders: 0,
        totalAiCost: 0,
        todayAiCost: 0,
        totalAiCalls: 0,
    });

    const [revenueData, setRevenueData] = useState<Array<{
        name: string;
        revenue: number;
        orders: number;
    }>>([]);
    const [salesData, setSalesData] = useState<Array<{
        name: string;
        value: number;
    }>>([]);
    const [aiCostData, setAiCostData] = useState<Array<{
        name: string;
        cost: number;
    }>>([]);
    const [agentData, setAgentData] = useState<Array<{
        name: string;
        value: number;
    }>>([]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [basicStats, revenueStat, salesDis, aiStats] = await Promise.all([
                    api.getStats(),
                    api.getRevenueStats(),
                    api.getSalesDistribution(),
                    api.getGeminiCosts()
                ]);

                setSalesData(salesDis.items_sold_history);
                
                const transformedRevenue = revenueStat.last_7_days.map((item: any) => ({
                    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: item.revenue,
                    orders: item.orders_count
                }));
                setRevenueData(transformedRevenue);

                const transformedAiCost = aiStats.cost_history.map((item: any) => ({
                    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    cost: item.cost
                }));
                setAiCostData(transformedAiCost);

                const transformedAgents = aiStats.agent_breakdown.map((item: any) => ({
                    name: item.agent_type,
                    value: item.cost
                }));
                setAgentData(transformedAgents);

                setStats({
                    totalOrders: basicStats.total_orders,
                    totalRevenue: basicStats.total_revenue,
                    activeMenuItems: basicStats.total_menu_items,
                    totalCalls: basicStats.total_calls,
                    todayRevenue: basicStats.today_revenue,
                    todayOrders: basicStats.today_orders,
                    totalAiCost: aiStats.total_usd,
                    todayAiCost: aiStats.today_usd,
                    totalAiCalls: aiStats.total_calls
                });
            } catch (error) {
                console.error("Dashboard data load error:", error);
            }
        };
        loadStats();
    }, []);

    const statCards = [
        {
            label: "Total Revenue",
            value: `PKR ${stats.totalRevenue.toLocaleString()}`,
            icon: <><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>
        },
        {
            label: "AI Session Cost",
            value: `$${Number(stats.totalAiCost).toFixed(4)}`,
            icon: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
            highlight: true
        },
        {
            label: "Total Orders",
            value: stats.totalOrders.toString(),
            icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>
        },
        {
            label: "AI Calls",
            value: stats.totalAiCalls.toString(),
            icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></>
        }
    ];

    const customTooltipStyle = {
        borderRadius: '14px',
        border: 'none',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        padding: '12px 16px',
        fontSize: '13px',
        fontWeight: 500,
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
                {statCards.map((card, index) => (
                    <StatCard
                        key={index}
                        label={card.label}
                        value={card.value}
                        icon={card.icon}
                        className={card.highlight ? "ring-1 ring-purple/15 bg-gradient-to-br from-purple-50/30 to-violet-50/20" : ""}
                    />
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Revenue Flow */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="mb-6 flex justify-between items-start">
                        <div className="section-header !mb-0">
                            <div className="icon-box">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                                </svg>
                            </div>
                            <div>
                                <h3>Revenue Flow</h3>
                                <p>Weekly revenue vs order volume</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2a9aad" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#2a9aad" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef8fa" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#72c7d6', fontSize: 11, fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#72c7d6', fontSize: 11, fontWeight: 500 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Area type="monotone" dataKey="revenue" stroke="#2a9aad" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={{ fill: '#2a9aad', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#2a9aad', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-3 border-sage-100 border-t-sage-500"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Cost Analysis */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="mb-6">
                        <div className="section-header !mb-0">
                            <div className="icon-box" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M20 12a8 8 0 0 0-8-8v8h8z"/>
                                </svg>
                            </div>
                            <div>
                                <h3>AI Cost Analysis</h3>
                                <p>Gemini token utilization costs (7D)</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={aiCostData}>
                                <defs>
                                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f3ff" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#c4b5fd', fontSize: 11, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#c4b5fd', fontSize: 11, fontWeight: 500 }} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAi)" dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Category Mix */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="mb-4">
                        <div className="section-header !mb-0">
                            <div className="icon-box" style={{ background: 'linear-gradient(135deg, #eef8fa, #d5eff4)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a9aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                                </svg>
                            </div>
                            <div>
                                <h3>Category Mix</h3>
                                <p>Inventory distribution</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={salesData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value" strokeWidth={0}>
                                    {salesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Agent Performance */}
                <div className="glass rounded-2xl p-6 sm:p-8">
                    <div className="mb-4">
                        <div className="section-header !mb-0">
                            <div className="icon-box" style={{ background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <div>
                                <h3>Agent Performance</h3>
                                <p>Cost allocation by agent persona</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={agentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value" strokeWidth={0}>
                                    {agentData.map((entry, index) => (
                                        <Cell key={`ai-${index}`} fill={["#8b5cf6", "#d946ef", "#6366f1", "#a855f7"][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
