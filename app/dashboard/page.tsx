"use client";

import { useState } from "react";
import OrdersTable from "@/components/Dashboard/OrdersTable";
import MenuManager from "@/components/Dashboard/MenuManager";
import DashboardAnalytics from "@/components/Dashboard/DashboardAnalytics";
import ScheduleManager from "@/components/Dashboard/ScheduleManager";
import AppointmentsTable from "@/components/Dashboard/AppointmentsTable";
import CallsTable from "@/components/Dashboard/CallsTable";

type TabType = "analytics" | "menu" | "orders" | "schedule" | "appointments" | "calls";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
        id: "analytics",
        label: "Analytics",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
        ),
    },
    {
        id: "menu",
        label: "Menu",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
        ),
    },
    {
        id: "orders",
        label: "Orders",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
        ),
    },
    {
        id: "schedule",
        label: "Schedule",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
            </svg>
        ),
    },
    {
        id: "appointments",
        label: "Appointments",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: "calls",
        label: "Calls",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
        ),
    },
];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>("analytics");

    return (
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-10 flex flex-col gap-4">
                <div className="animate-fade-up flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-700 shadow-sm flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="9" x="3" y="3" rx="1"/>
                            <rect width="7" height="5" x="14" y="3" rx="1"/>
                            <rect width="7" height="9" x="14" y="12" rx="1"/>
                            <rect width="7" height="5" x="3" y="16" rx="1"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-sage-900">
                            Voxora AI Hub
                        </h1>
                        <p className="text-sage-500 font-medium text-xs sm:text-sm">
                            Precision restaurant management powered by AI.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-1">
                    <div className="tab-nav animate-fade-up min-w-max" style={{ animationDelay: '0.1s' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn flex items-center gap-1.5 sm:gap-2 !px-3 sm:!px-5 ${activeTab === tab.id ? "active" : ""}`}
                            >
                                {tab.icon}
                                <span className="text-xs sm:text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative min-h-[500px]">
                {activeTab === "analytics" && (
                    <div className="animate-fade-up">
                        <DashboardAnalytics />
                    </div>
                )}
                {activeTab === "menu" && (
                    <div className="animate-fade-up">
                        <MenuManager />
                    </div>
                )}
                {activeTab === "orders" && (
                    <div className="animate-fade-up">
                        <OrdersTable />
                    </div>
                )}
                {activeTab === "schedule" && (
                    <div className="animate-fade-up">
                        <ScheduleManager />
                    </div>
                )}
                {activeTab === "appointments" && (
                    <div className="animate-fade-up">
                        <AppointmentsTable />
                    </div>
                )}
                {activeTab === "calls" && (
                    <div className="animate-fade-up">
                        <CallsTable />
                    </div>
                )}
            </div>
        </div>
    );
}
