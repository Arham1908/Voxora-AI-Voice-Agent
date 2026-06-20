"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_COOKIE_NAME = "voxora_auth";
const SESSION_MAX_AGE_SECONDS = 15 * 60;

export default function LoginPage() {
    const router = useRouter();
    const [profile, setProfile] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const isAuthenticated = document.cookie
            .split("; ")
            .some((cookie) => cookie === `${AUTH_COOKIE_NAME}=authenticated`);
        if (isAuthenticated) {
            router.replace("/");
        }
    }, [router]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile, password }),
            });

            const data = (await response.json().catch(() => ({}))) as {
                ok?: boolean;
                error?: string;
            };

            if (!response.ok || !data.ok) {
                setError(data.error || "Invalid profile or password.");
                setIsSubmitting(false);
                return;
            }

            document.cookie = `${AUTH_COOKIE_NAME}=authenticated; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
            window.location.assign("/");
        } catch {
            setError("Could not reach the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
            <div className="glass w-full max-w-md rounded-3xl p-8">
                <h1 className="text-3xl font-bold tracking-tight text-sage-900">Sign In</h1>
                <p className="mt-2 text-sage-600">Use your Voxora AI administrator credentials.</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label htmlFor="profile" className="mb-1 block text-sm font-semibold text-sage-700">
                            Profile
                        </label>
                        <input
                            id="profile"
                            type="text"
                            value={profile}
                            onChange={(event) => setProfile(event.target.value)}
                            className="w-full rounded-xl border border-sage-200 bg-white px-4 py-3 text-sage-900 outline-none transition focus:border-sage-400"
                            placeholder="Enter profile"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-sage-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-sage-200 bg-white px-4 py-3 text-sage-900 outline-none transition focus:border-sage-400"
                            placeholder="Enter password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="sage-gradient flex h-12 w-full items-center justify-center rounded-2xl font-semibold text-white shadow-lg transition-all disabled:opacity-60"
                    >
                        {isSubmitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
