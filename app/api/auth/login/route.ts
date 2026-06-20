import { NextResponse } from "next/server";

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const profile =
        typeof body === "object" &&
        body !== null &&
        "profile" in body &&
        typeof (body as { profile: unknown }).profile === "string"
            ? (body as { profile: string }).profile
            : "";
    const password =
        typeof body === "object" &&
        body !== null &&
        "password" in body &&
        typeof (body as { password: unknown }).password === "string"
            ? (body as { password: string }).password
            : "";

    const expectedProfile = process.env.VOXORA_ADMIN_PROFILE ?? "";
    const expectedPassword = process.env.VOXORA_ADMIN_PASSWORD ?? "";

    if (!expectedProfile || !expectedPassword) {
        return NextResponse.json(
            { ok: false, error: "Login is not configured on the server." },
            { status: 503 },
        );
    }

    if (profile === expectedProfile && password === expectedPassword) {
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Invalid profile or password." }, { status: 401 });
}
