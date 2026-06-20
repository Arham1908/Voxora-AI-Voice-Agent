"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GAListener() {
    const pathname = usePathname();

    useEffect(() => {
        if (!GA_ID) return;

        window.gtag?.("config", GA_ID, {
            page_path: pathname,
        });
    }, [pathname]);

    return null;
}