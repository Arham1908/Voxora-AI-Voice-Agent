
export default function StatCard({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className?: string }) {
    return (
        <div className={`glass stat-glow flex items-center gap-4 rounded-2xl py-5 px-5 transition-all duration-300 hover:scale-[1.02] cursor-default ${className || ""}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 text-sage-600 shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                </svg>
            </div>
            <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-sage-400">{label}</p>
                <p className="text-xl font-black text-sage-900 mt-0.5 tracking-tight">{value}</p>
            </div>
        </div>
    );
}