"use client";

import { useEffect, useMemo, useState } from "react";
import AgentCard from "@/components/Agent/AgentCard";
import WhatsAppChatLink from "@/components/Agent/WhatsAppChatLink";

const HealthcareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>
    </svg>
);

const RestaurantIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>
    </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
    </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
    </svg>
);

const FemaleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="10" r="5"/><path d="M12 15v7"/><path d="M9 19h6"/>
    </svg>
);

const MaleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="10" cy="14" r="5"/><path d="M19 5v5"/><path d="M14 5h5"/><path d="m15 9 5-5"/>
    </svg>
);

const getAgentIcon = (id: string, className?: string) => {
    if (id === "healthcare") return <HealthcareIcon className={className} />;
    if (id === "restaurant") return <RestaurantIcon className={className} />;
    return <MicIcon className={className} />;
};

const getVoiceGender = (voice: string) => {
    const females = ["Aoede", "Kore", "Leda"];
    const males = ["Puck", "Charon", "Fenrir"];
    if (females.includes(voice)) return "Female";
    if (males.includes(voice)) return "Male";
    return "";
};

interface Language { code: string; label: string; }
interface Agent {
    id: string;
    name: string;
    description: string;
    icon: string;
    default_voice: string;
    default_language: string;
    voices: string[];
    languages: Language[];
}

const VOICE_ORDER = ["Aoede", "Puck", "Charon", "Kore", "Fenrir", "Leda"];

function mergeVoices(agents: Agent[]): string[] {
    const set = new Set<string>();
    agents.forEach((a) => a.voices.forEach((v) => set.add(v)));
    const ordered = VOICE_ORDER.filter((v) => set.has(v));
    const rest = [...set].filter((v) => !VOICE_ORDER.includes(v)).sort();
    return [...ordered, ...rest];
}

function mergeLanguages(agents: Agent[]): Language[] {
    const byCode = new Map<string, Language>();
    agents.forEach((a) => {
        a.languages.forEach((lang) => {
            if (!byCode.has(lang.code)) byCode.set(lang.code, lang);
        });
    });
    return [...byCode.values()];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
const WS_BASE  = process.env.NEXT_PUBLIC_WS_BASE_URL  

export default function AgentPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [voice, setVoice] = useState<string>("");
    const [language, setLanguage] = useState<string>("");
    const [started, setStarted] = useState(false);

    const globalVoices = useMemo(() => mergeVoices(agents), [agents]);
    const globalLanguages = useMemo(() => mergeLanguages(agents), [agents]);

    useEffect(() => {
        fetch(`${API_BASE}/voice/agents/`)
            .then((r) => r.json())
            .then((data: Agent[]) => {
                setAgents(data);
                if (data.length > 0) {
                    setSelectedAgent(data[0]);
                    setVoice(data[0].default_voice);
                    setLanguage(data[0].default_language);
                }
            })
            .catch(() => {
                // Fallback if API is down
                const fallback: Agent[] = [
                    {
                        id: "healthcare", name: "Healthcare Appointment",
                        description: "Book medical appointments with Sara.",
                        icon: "🏥", default_voice: "Aoede", default_language: "ur-PK",
                        voices: ["Aoede", "Kore", "Leda"],
                        languages: [{ code: "ur-PK", label: "Urdu" }, { code: "en-US", label: "English" }],
                    },
                    {
                        id: "restaurant", name: "Restaurant Booking",
                        description: "Reserve a table with Zara.",
                        icon: "🍽️", default_voice: "Puck", default_language: "ur-PK",
                        voices: ["Aoede", "Puck", "Charon"],
                        languages: [{ code: "ur-PK", label: "Urdu" }, { code: "en-US", label: "English" }],
                    },
                ];
                setAgents(fallback);
                setSelectedAgent(fallback[0]);
                setVoice(fallback[0].default_voice);
                setLanguage(fallback[0].default_language);
            });
    }, []);

    // Keep global selection valid when agent list loads or changes
    useEffect(() => {
        if (globalVoices.length === 0 && globalLanguages.length === 0) return;
        if (voice && !globalVoices.includes(voice)) {
            setVoice(globalVoices[0] ?? "");
        }
        if (language && !globalLanguages.some((l) => l.code === language)) {
            setLanguage(globalLanguages[0]?.code ?? "");
        }
    }, [globalVoices, globalLanguages, voice, language]);

    function selectAgent(agent: Agent) {
        setSelectedAgent(agent);
        setStarted(false);
    }

    function startWithAgent(agent: Agent) {
        setSelectedAgent(agent);
        setStarted(true);
    }

    const wsUrl = selectedAgent
        ? `${WS_BASE}/ws/voice/${selectedAgent.id}/?voice=${voice}&language=${language}`
        : null;
    return (
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
            {/* Page header */}
            <div className="mb-8 sm:mb-10 text-center">
                <span className="mb-3 sm:mb-4 inline-block rounded-full bg-sage-100 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sage-600">
                    Voice Interface
                </span>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-sage-900">
                    Talk to Voxora AI
                </h1>
                <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-sage-600">
                    Choose an agent, your preferred voice, and language.
                </p>

            </div>

            {!started ? (
                <div className="w-full max-w-3xl space-y-8">
                    {/* Agent selector */}
                    <div>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-sage-500">
                            Select Agent
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {agents.map((agent) => (
                                <div key={agent.id} className="space-y-3">
                                    <button
                                        onClick={() => selectAgent(agent)}
                                        className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                                            selectedAgent?.id === agent.id
                                                ? "border-sage-500 bg-sage-50 shadow-lg"
                                                : "border-transparent bg-white shadow hover:border-sage-300"
                                        }`}
                                    >
                                        <span className="text-sage-500">{getAgentIcon(agent.id, "h-10 w-10")}</span>
                                        <div>
                                            <p className="font-bold text-sage-900">{agent.name}</p>
                                            <p className="mt-1 text-sm text-sage-500">{agent.description}</p>
                                        </div>
                                    </button>

                                    <div className="flex flex-col min-h-20 gap-2 sm:flex-row sm:items-stretch">
                                        <WhatsAppChatLink agentId={agent.id} agentName={agent.name} />
                                        <button
                                            type="button"
                                            onClick={() => startWithAgent(agent)}
                                            className="sage-gradient flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl sm:px-4"
                                        >
                                            {getAgentIcon(agent.id, "h-5 w-5 shrink-0")}
                                            <span className="truncate">Start Calling</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {agents.length > 0 && (
                        <>
                            {/* Voice & Language selectors (global — shared across all agents) */}
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                {/* Voice */}
                                <div>
                                    <label className="mb-3 block text-sm font-bold uppercase tracking-widest text-sage-500">
                                        Voice
                                    </label>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {globalVoices.map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => setVoice(v)}
                                                className={`flex flex-col items-center justify-center min-w-[80px] rounded-2xl px-4 py-2.5 transition-all border ${
                                                    voice === v
                                                        ? "bg-[#1d6b77] border-[#1d6b77] text-white shadow-md"
                                                        : "bg-white border-gray-100 text-[#1d6b77] shadow-sm hover:border-[#1d6b77]/30"
                                                }`}
                                            >
                                                <span className="text-[15px] font-semibold">{v}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                                                    voice === v ? "text-white/80" : "text-[#70aeb7]"
                                                }`}>
                                                    {getVoiceGender(v)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Language */}
                                <div>
                                    <label className="mb-3 block text-sm font-bold uppercase tracking-widest text-sage-500">
                                        Language
                                    </label>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {globalLanguages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => setLanguage(lang.code)}
                                                className={`rounded-2xl px-6 py-2.5 text-[15px] font-semibold transition-all border ${
                                                    language === lang.code
                                                        ? "bg-[#1d6b77] border-black border-2 text-white shadow-md"
                                                        : "bg-white border-gray-100 text-[#1d6b77] shadow-sm hover:border-[#1d6b77]/30 border-2 border-transparent"
                                                }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="relative w-full max-w-lg">
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sage-100/50 blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

                    {/* Back button */}
                    <button
                        onClick={() => setStarted(false)}
                        className="relative z-10 mb-6 flex items-center gap-2 text-sm text-sage-500 hover:text-sage-700 transition-colors cursor-pointer"
                    >
                        ← Back to agent selection
                    </button>

                    {/* Summary bar */}
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-2xl bg-white px-4 sm:px-5 py-3 shadow text-xs sm:text-sm text-sage-700">
                        <span>{getAgentIcon(selectedAgent!.id, "h-4 w-4 sm:h-5 sm:w-5")}</span>
                        <span className="font-semibold">{selectedAgent!.name}</span>
                        <span className="text-sage-300 hidden sm:inline">|</span>
                        <span className="flex items-center gap-1"><MicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {voice}</span>
                        <span className="text-sage-300 hidden sm:inline">|</span>
                        <span className="flex items-center gap-1"><GlobeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {globalLanguages.find(l => l.code === language)?.label ?? language}</span>
                    </div>

                    <div className="relative flex flex-col items-center">
                        <AgentCard wsUrl={wsUrl!} agentName={selectedAgent!.name} />
                    </div>
                </div>
            )}
        </div>
    );
}
