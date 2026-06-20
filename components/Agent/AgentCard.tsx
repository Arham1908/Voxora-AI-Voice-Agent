"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import VoiceVisualizer from "./VoiceVisualizer";

const PCM_NORMALIZER = 32768;

function readSampleRate(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function downsampleToPcm16Bit(input: Float32Array, inputSampleRate: number, outputSampleRate: number) {
    if (input.length === 0) return new Int16Array(0);
    if (inputSampleRate === outputSampleRate) {
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) pcm[i] = Math.max(-1, Math.min(1, input[i] * 3.0)) * 0x7fff;
        return pcm;
    }
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.max(1, Math.round(input.length / ratio));
    const pcm = new Int16Array(outputLength);
    let outputIndex = 0, inputIndex = 0;
    while (outputIndex < outputLength) {
        const nextInputIndex = Math.min(input.length, Math.round((outputIndex + 1) * ratio));
        let sum = 0, count = 0;
        while (inputIndex < nextInputIndex) { sum += input[inputIndex]; count += 1; inputIndex += 1; }
        const sample = count > 0 ? sum / count : input[Math.min(inputIndex, input.length - 1)];
        pcm[outputIndex] = Math.max(-1, Math.min(1, sample * 3.0)) * 0x7fff;
        outputIndex += 1;
    }
    return pcm;
}

interface AgentCardProps {
    wsUrl: string;        // full WebSocket URL e.g. ws://127.0.0.1:8000/ws/voice/healthcare/?voice=Aoede&language=ur-PK
    agentName: string;   // display name e.g. "Healthcare Appointment"
}
export default function AgentCard({ wsUrl, agentName }: AgentCardProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isFallback, setIsFallback] = useState(false); // true when backend falls back to Vertex AI
    const wsRef = useRef<WebSocket | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(0));
    const activeNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const sessionReadyRef = useRef(false);
    const nextPlayTimeRef = useRef(0);
    const activePlaybackCountRef = useRef(0);
    const outgoingSampleRateRef = useRef(16000);
    const incomingSampleRateRef = useRef(24000);
    const pendingPcmBytesRef = useRef<Uint8Array | null>(null);
    const audioInputBufferRef = useRef<Float32Array>(new Float32Array(0));
    const audioQueueRef = useRef<Promise<void>>(Promise.resolve());
    // Tracks whether the greeting audio is currently playing.
    // While true, mic audio is NOT sent so that mobile VAD doesn't
    // interpret the speaker output as user speech and interrupt the greeting.
    const greetingPlayingRef = useRef(false);
    // Safety timer ID — clears greetingPlayingRef if AudioContext never fires onended
    // (happens when mobile suspends the AudioContext mid-playback).
    const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isBackgrounded, setIsBackgrounded] = useState(false);
    const lastAgentAudioTimeRef = useRef(0);
console.log(wsUrl)

    // /* ElevenLabs Code - Commented Out
    // const conversation = useConversation({
    //     onConnect: () => {
    //         console.log("Connected to ElevenLabs");
    //         setIsConnecting(false);
    //     },
    //     onDisconnect: () => {
    //         console.log("Disconnected from ElevenLabs");
    //     },
    //     onError: (error) => {
    //         console.error("ElevenLabs Error:", error);
    //         setIsConnecting(false);
    //     },
    // });

    // const { status, isSpeaking, startSession, endSession, getOutputByteFrequencyData } = conversation;
    // */

    const getOutputByteFrequencyData = () => frequencyDataRef.current;

    const handleInputAudioFrame = useCallback((inputData: Float32Array, inputSampleRate: number) => {
        frequencyDataRef.current = new Uint8Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const val = inputData[i];
            frequencyDataRef.current[i] = Math.max(0, Math.min(255, (val + 1) * 127));
        }

        const ws = wsRef.current;
        const isReady =
            !!ws &&
            ws.readyState === WebSocket.OPEN &&
            sessionReadyRef.current;

        // Suppress mic audio while the agent greeting is playing to prevent
        // mobile VAD from treating speaker echo as user speech.
        const timeSinceLastAgentAudio = Date.now() - lastAgentAudioTimeRef.current;
        if (!isReady || (greetingPlayingRef.current && timeSinceLastAgentAudio < 4000)) {
            return;
        }
        if (greetingPlayingRef.current && timeSinceLastAgentAudio >= 4000) {
            greetingPlayingRef.current = false;
        }

        // Accumulate new frames
        const newBuffer = new Float32Array(audioInputBufferRef.current.length + inputData.length);
        newBuffer.set(audioInputBufferRef.current);
        newBuffer.set(inputData, audioInputBufferRef.current.length);
        audioInputBufferRef.current = newBuffer;

        // Match Twilio's chunk size: 20ms of frames (640 bytes at 16kHz)
        const framesPerBatch = Math.floor(inputSampleRate * 0.02);

        if (audioInputBufferRef.current.length >= framesPerBatch) {
            const pcmData = downsampleToPcm16Bit(
                audioInputBufferRef.current,
                inputSampleRate,
                outgoingSampleRateRef.current,
            );
            ws.send(pcmData.buffer);
            
            // Clear buffer
            audioInputBufferRef.current = new Float32Array(0);
        }
    }, []);

    const cleanupConnection = useCallback(async () => {
        sessionReadyRef.current = false;
        if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; processorRef.current = null; }
        if (workletNodeRef.current) { workletNodeRef.current.port.onmessage = null; workletNodeRef.current.disconnect(); workletNodeRef.current = null; }
        if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
        if (audioContextRef.current) { await audioContextRef.current.close(); audioContextRef.current = null; }
        nextPlayTimeRef.current = 0;
        activePlaybackCountRef.current = 0;
        outgoingSampleRateRef.current = 16000;
        incomingSampleRateRef.current = 24000;
        pendingPcmBytesRef.current = null;
        audioInputBufferRef.current = new Float32Array(0);
        audioQueueRef.current = Promise.resolve();
        frequencyDataRef.current = new Uint8Array(0);
        activeNodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
        activeNodesRef.current = [];
        greetingPlayingRef.current = false;
        if (greetingTimeoutRef.current) { clearTimeout(greetingTimeoutRef.current); greetingTimeoutRef.current = null; }
        setIsSpeaking(false);
        setIsConnected(false);
        setIsConnecting(false);
        setIsFallback(false); // reset fallback banner on disconnect
    }, []);

    const scheduleAudioChunk = useCallback(async (chunk: ArrayBuffer) => {
        const audioContext = audioContextRef.current;
        if (!audioContext) {
            return;
        }

        // Mobile browsers (especially iOS Safari) may silently suspend AudioContext
        // after creation. Resume it before every playback attempt so audio is never
        // lost even if the context was suspended between chunks.
        if (audioContext.state === "suspended") {
            try { await audioContext.resume(); } catch {}
        }

        try {
            let audioBuffer: AudioBuffer;
            const chunkBytes = new Uint8Array(chunk);

            // Check if this is WAV-wrapped (starts with RIFF header)
            const isWav = chunk.byteLength > 4 &&
                chunkBytes.slice(0, 4).every((v, i) => "RIFF".charCodeAt(i) === v);

            if (isWav) {
                pendingPcmBytesRef.current = null;
                // Use decodeAudioData for WAV files
                audioBuffer = await audioContext.decodeAudioData(chunk.slice(0));
            } else {
                // Handle raw 16-bit PCM data with a configurable server sample rate.
                let pcmBytes = chunkBytes;
                const pendingBytes = pendingPcmBytesRef.current;

                if (pendingBytes && pendingBytes.length > 0) {
                    const combined = new Uint8Array(pendingBytes.length + pcmBytes.length);
                    combined.set(pendingBytes);
                    combined.set(pcmBytes, pendingBytes.length);
                    pcmBytes = combined;
                    pendingPcmBytesRef.current = null;
                }

                if (pcmBytes.byteLength < 2) {
                    pendingPcmBytesRef.current = pcmBytes.slice();
                    return;
                }

                if (pcmBytes.byteLength % 2 !== 0) {
                    pendingPcmBytesRef.current = pcmBytes.slice(pcmBytes.byteLength - 1);
                    pcmBytes = pcmBytes.slice(0, pcmBytes.byteLength - 1);
                }

                const pcmData = new Int16Array(
                    pcmBytes.buffer,
                    pcmBytes.byteOffset,
                    pcmBytes.byteLength / 2,
                );
                const samples = pcmData.length;

                audioBuffer = audioContext.createBuffer(1, samples, incomingSampleRateRef.current);

                const channelData = audioBuffer.getChannelData(0);
                for (let i = 0; i < samples; i++) {
                    channelData[i] = pcmData[i] / PCM_NORMALIZER;
                }
            }

            const playbackNode = audioContext.createBufferSource();
            playbackNode.buffer = audioBuffer;
            playbackNode.connect(audioContext.destination);

            const now = audioContext.currentTime;
            if (nextPlayTimeRef.current < now) {
                nextPlayTimeRef.current = now;
            }

            // Mark greeting as in-progress so mic input is suppressed.
            greetingPlayingRef.current = true;
            lastAgentAudioTimeRef.current = Date.now();

            // Safety net: if AudioContext is suspended on mobile and onended never
            // fires, this timer will forcibly clear the gate after a generous
            // deadline (greeting duration + 2 second buffer).
            const safetyMs = Math.ceil(audioBuffer.duration * 1000) + 2000;
            if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
            greetingTimeoutRef.current = setTimeout(() => {
                if (greetingPlayingRef.current) {
                    console.warn("[AgentCard] greetingPlayingRef safety timeout fired — forcing mic open");
                    greetingPlayingRef.current = false;
                }
            }, safetyMs);

            const startAt = nextPlayTimeRef.current;
            playbackNode.start(startAt);
            nextPlayTimeRef.current = startAt + audioBuffer.duration;
            activeNodesRef.current.push(playbackNode);

            activePlaybackCountRef.current += 1;
            setIsSpeaking(true);

            playbackNode.onended = () => {
                const index = activeNodesRef.current.indexOf(playbackNode);
                if (index > -1) {
                    activeNodesRef.current.splice(index, 1);
                }
                activePlaybackCountRef.current = Math.max(0, activePlaybackCountRef.current - 1);
                if (activePlaybackCountRef.current === 0) {
                    setIsSpeaking(false);
                    // All playback finished — allow mic audio to flow again.
                    // A short delay lets any final echo decay before we re-open
                    // the mic, which is especially important on mobile.
                    setTimeout(() => { greetingPlayingRef.current = false; }, 300);
                }
            };
        } catch (error) {
            console.error("Failed to decode/play audio chunk:", error);
            if (activePlaybackCountRef.current === 0) {
                greetingPlayingRef.current = false;
                setIsSpeaking(false);
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            void cleanupConnection();
        };
    }, [cleanupConnection]);

    // Page Visibility API — detect when user backgrounds the mobile browser.
    // The WebSocket will likely be killed by the OS within seconds.
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setIsBackgrounded(true);
                console.warn("[AgentCard] Page hidden — mobile may kill the WebSocket");
            } else {
                setIsBackgrounded(false);
                // Resume AudioContext if it was suspended while backgrounded
                const ctx = audioContextRef.current;
                if (ctx && ctx.state === "suspended") {
                    ctx.resume().catch(() => {});
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    const handleToggleConversation = useCallback(async () => {
        if (isConnected) {
            await cleanupConnection();
        } else {
            setIsConnecting(true);
            try {
                sessionReadyRef.current = false;
                nextPlayTimeRef.current = 0;
                activePlaybackCountRef.current = 0;
                audioInputBufferRef.current = new Float32Array(0);

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                const AudioContextCtor =
                    window.AudioContext ||
                    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

                if (!AudioContextCtor) {
                    throw new Error("AudioContext is not supported in this browser.");
                }

                let audioContext: AudioContext;
                try {
                    audioContext = new AudioContextCtor({ sampleRate: 16000 });
                } catch {
                    audioContext = new AudioContextCtor();
                }

                // Chrome may suspend AudioContext until a user gesture
                if (audioContext.state === "suspended") {
                    await audioContext.resume();
                }

                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                sourceNodeRef.current = source;
                const canUseAudioWorklet =
                    "audioWorklet" in audioContext &&
                    typeof AudioWorkletNode !== "undefined";

                if (canUseAudioWorklet) {
                    await audioContext.audioWorklet.addModule("/audio/pcm-capture-worklet.js");
                    const workletNode = new AudioWorkletNode(audioContext, "pcm-capture-processor", {
                        numberOfInputs: 1,
                        numberOfOutputs: 0,
                        channelCount: 1,
                    });
                    workletNodeRef.current = workletNode;
                    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
                        const frame = new Float32Array(event.data);
                        handleInputAudioFrame(frame, audioContext.sampleRate);
                    };
                    source.connect(workletNode);
                } else {
                    console.warn("AudioWorkletNode is unavailable; falling back to deprecated ScriptProcessorNode.");
                    // Use a smaller buffer size (2048) on mobile for lower latency.
                    // The 4096 default causes 85ms gaps between frames which confuses VAD.
                    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                    const bufferSize = isMobile ? 2048 : 4096;
                    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
                    processorRef.current = processor;
                    processor.onaudioprocess = (event: AudioProcessingEvent) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        handleInputAudioFrame(inputData, event.inputBuffer.sampleRate);
                    };
                    source.connect(processor);
                    processor.connect(audioContext.destination);
                }

                const ws = new WebSocket(wsUrl);
                ws.binaryType = "arraybuffer";

                ws.onopen = () => {
                    console.log("Connected to WebSocket — waiting for session_ready from backend");
                    // Do NOT set sessionReadyRef here — wait for "session_ready" JSON from backend
                    // so we only send audio once Gemini Live is actually connected.
                    setIsConnected(true);
                    setIsConnecting(false);
                };

                ws.onmessage = (event) => {
                    if (typeof event.data === "string") {
                        try {
                            const payload = JSON.parse(event.data) as {
                                type?: string;
                                event?: string;
                                status?: string;
                                code?: string;
                                message?: string;
                                sampleRate?: number;
                                inputSampleRate?: number;
                                outputSampleRate?: number;
                                input_sample_rate?: number;
                                output_sample_rate?: number;
                            };
                            const inputSampleRate =
                                readSampleRate(payload.inputSampleRate) ??
                                readSampleRate(payload.input_sample_rate);
                            const outputSampleRate =
                                readSampleRate(payload.outputSampleRate) ??
                                readSampleRate(payload.output_sample_rate) ??
                                readSampleRate(payload.sampleRate);

                            if (inputSampleRate) {
                                outgoingSampleRateRef.current = inputSampleRate;
                            }

                            if (outputSampleRate) {
                                incomingSampleRateRef.current = outputSampleRate;
                            }

                            const marker = payload.type || payload.event || payload.status;
                            // Backend keep-alive ping — silently ignore it (the send itself
                            // is what keeps the mobile connection open).
                            if (marker === "ping") return;
                            if (marker === "session_ready") {
                                sessionReadyRef.current = true;
                                return;
                            }
                            // Backend signals greeting playback start — mute mic until greeting_ended
                            if (marker === "greeting_started") {
                                greetingPlayingRef.current = true;
                                return;
                            }
                            // Backend signals greeting audio fully sent — mic stays muted until
                            // all queued chunks finish playing (handled in playbackNode.onended).
                            if (marker === "greeting_ended") {
                                // greetingPlayingRef remains true until last chunk's onended fires.
                                // Nothing to do here — the 300ms timeout in onended will clear it.
                                return;
                            }
                            // Backend has transparently switched to Vertex AI (Gemini 2.5 native audio)
                            if (marker === "status" && payload.code === "fallback_vertex") {
                                setIsFallback(true);
                                console.info("[AgentCard] Switched to Vertex AI fallback:", payload.message);
                                return;
                            }
                            if (marker === "clear") {
                                activeNodesRef.current.forEach(n => { try { n.stop(); } catch {} });
                                activeNodesRef.current = [];
                                activePlaybackCountRef.current = 0;
                                nextPlayTimeRef.current = 0;
                                greetingPlayingRef.current = false;
                                setIsSpeaking(false);
                                return;
                            }
                            if (marker === "agent_speaking") {
                                const agentSpeaking = (payload as { value?: boolean }).value;
                                if (agentSpeaking === false) {
                                    // Agent finished speaking — force mic open regardless of onended state.
                                    // This is the iOS safety net: onended is unreliable on iOS Chrome/Safari.
                                    setTimeout(() => {
                                        greetingPlayingRef.current = false;
                                    }, 300); // 300ms echo decay, matching onended handler
                                }
                                return;
                            }
                        } catch {
                            if (event.data.toLowerCase().includes("session_ready")) {
                                sessionReadyRef.current = true;
                                return;
                            }
                        }
                    }

                    if (event.data instanceof ArrayBuffer) {
                        const chunk = (event.data as ArrayBuffer).slice(0);
                        audioQueueRef.current = audioQueueRef.current
                            .then(() => scheduleAudioChunk(chunk))
                            .catch(() => { /* error already logged inside scheduleAudioChunk */ });
                        return;
                    }

                    if (event.data instanceof Blob) {
                        audioQueueRef.current = audioQueueRef.current
                            .then(() => (event.data as Blob).arrayBuffer())
                            .then((chunk) => scheduleAudioChunk(chunk))
                            .catch(() => { /* error already logged inside scheduleAudioChunk */ });
                    }
                };

                ws.onerror = (error) => {
                    console.error("WebSocket Error:", error);
                    setIsConnecting(false);
                };

                ws.onclose = () => {
                    console.log("Disconnected from WebSocket");
                    sessionReadyRef.current = false;
                    nextPlayTimeRef.current = 0;
                    activePlaybackCountRef.current = 0;
                    setIsConnected(false);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error("Failed to start session:", error);
                await cleanupConnection();
            }
        }
    }, [cleanupConnection, handleInputAudioFrame, isConnected, scheduleAudioChunk]);

    return (
        <div className="glass w-full max-w-md rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sage-50 text-sage-500 ${isConnected ? 'animate-pulse-soft' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-sage-900">{agentName}</h2>
                <p className="mt-2 text-sage-600">
                    {isConnected ? "Listening for your voice..." : "Ready to assist you today."}
                </p>
            </div>

            <VoiceVisualizer
                isSpeaking={isSpeaking || isConnected}
                getByteFrequencyData={getOutputByteFrequencyData}
            />

            {/* Fallback notice — shown when backend transparently switched to Vertex AI */}
            {isFallback && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        marginTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.4)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#92400e",
                        animation: "fadeIn 0.4s ease",
                    }}
                >
                    {/* Spinner dot */}
                    <span
                        style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#f59e0b",
                            flexShrink: 0,
                            animation: "pulse 1.5s ease-in-out infinite",
                        }}
                    />
                    Switched to backup model &mdash; call quality unchanged
                </div>
            )}

            {/* Mobile backgrounding warning — WebSocket will drop if user leaves the tab */}
            {isConnected && isBackgrounded && (
                <div
                    role="alert"
                    style={{
                        marginTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(239,68,68,0.10)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#991b1b",
                    }}
                >
                    ⚠️ Please keep this tab open — switching away may end the call.
                </div>
            )}

            <div className="mt-8 flex flex-col gap-4">
                <button
                    onClick={handleToggleConversation}
                    disabled={isConnecting}
                    className={`flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl font-semibold transition-all duration-300 ${isConnected
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "sage-gradient text-white shadow-lg hover:shadow-sage-200"
                        } disabled:opacity-50`}
                >
                    {isConnecting ? (
                        <span className="flex items-center gap-2">
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                        </span>
                    ) : isConnected ? (
                        "End Session"
                    ) : (
                        "Start Conversation"
                    )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-sage-400">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-sage-500' : 'bg-slate-300'}`}></div>
                    {isConnected ? "CONNECTED" : "DISCONNECTED"}
                </div>
            </div>
        </div>
    );
}
