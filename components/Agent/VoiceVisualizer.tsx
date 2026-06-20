"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
    isSpeaking: boolean;
    getByteFrequencyData?: () => Uint8Array | undefined;
}

export default function VoiceVisualizer({ isSpeaking, getByteFrequencyData }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isSpeaking || !getByteFrequencyData) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            const data = getByteFrequencyData();
            if (!data) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 4;
            const gap = 2;
            const totalWidth = data.length * (barWidth + gap);
            const startX = (canvas.width - totalWidth) / 2;

            ctx.fillStyle = "#627b62"; // sage-500

            for (let i = 0; i < data.length; i++) {
                const height = (data[i] / 255) * canvas.height;
                const x = startX + i * (barWidth + gap);
                const y = (canvas.height - height) / 2;

                // Draw rounded bars
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, height, 2);
                ctx.fill();
            }

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isSpeaking, getByteFrequencyData]);

    return (
        <div className="flex items-center justify-center p-4">
            <canvas
                ref={canvasRef}
                width={300}
                height={60}
                className="opacity-80 transition-opacity duration-500"
                style={{ opacity: isSpeaking ? 1 : 0.3 }}
            />
        </div>
    );
}
