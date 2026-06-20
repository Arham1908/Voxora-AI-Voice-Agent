"use client";

import { useRouter } from "next/navigation";

const AUTH_COOKIE_NAME = "voxora_auth";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
        router.replace("/login");
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="rounded-lg border border-sage-300 px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50"
        >
            Logout
        </button>
    );
}
