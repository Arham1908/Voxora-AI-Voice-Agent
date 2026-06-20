import { FaWhatsapp } from "react-icons/fa";

type WhatsAppChatLinkProps = {
    className?: string;
    phoneNumber?: string;
    agentId?: string;
    agentName?: string;
};

function normalizeWhatsAppNumber(value?: string) {
    const digits = value?.replace(/\D/g, "") ?? "";

    if (digits.startsWith("00")) return digits.slice(2);
    if (digits.startsWith("0")) return `92${digits.slice(1)}`;
    return digits;
}

export default function WhatsAppChatLink({
    className = "",
    phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    agentName,
}: WhatsAppChatLinkProps) {
    const whatsappNumber = normalizeWhatsAppNumber(phoneNumber);
    const message = agentName ? `Hi, I want to chat about ${agentName}.` : "Hi, I want to chat.";
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className={`inline-flex h-10 min-w-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:bg-[#1ebe5d] hover:shadow-xl sm:px-4 ${className}`}
        >
            <FaWhatsapp size={22} className="shrink-0" />
            <span className="truncate">WhatsApp</span>
        </a>
    );
}

