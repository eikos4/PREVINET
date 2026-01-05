import { useState, useRef, useEffect } from "react";
import { Camera, Send, Image as ImageIcon, X, Minimize2, Maximize2 } from "lucide-react";
import {
    analyzeWorkSiteImage,
    chatWithAssistant,
    convertImageToBase64,
    type AIMessage,
    type RiskAnalysis,
} from "../../services/aiAssistant.service";

type FloatingAIAssistantProps = {
    onCreateART?: (analysis: RiskAnalysis) => void;
};

export default function FloatingAIAssistant({ onCreateART }: FloatingAIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<AIMessage[]>([
        {
            role: "assistant",
            content:
                "¡Hola! Soy tu asistente de prevención. Envíame una foto del sitio de trabajo y te ayudaré a identificar riesgos.",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [lastAnalysis, setLastAnalysis] = useState<RiskAnalysis | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isMinimized]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await convertImageToBase64(file);
            setSelectedImage(base64);
        } catch (error) {
            console.error("Error converting image:", error);
            alert("Error al cargar la imagen");
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() && !selectedImage) return;

        const userMessage: AIMessage = {
            role: "user",
            content: input || "Analiza esta imagen",
            imageUrl: selectedImage || undefined,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            let aiResponse: string;
            let analysis: RiskAnalysis | null = null;

            if (selectedImage) {
                const result = await analyzeWorkSiteImage(selectedImage, input);
                aiResponse = result.response;
                analysis = result.analysis;
                setLastAnalysis(analysis);
                setSelectedImage(null);
            } else {
                aiResponse = await chatWithAssistant([...messages, userMessage]);
            }

            const assistantMessage: AIMessage = {
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error("Error communicating with AI:", error);
            const errorMessage: AIMessage = {
                role: "assistant",
                content: `❌ Error: ${error.message || "No pude procesar tu solicitud. Verifica tu API key de OpenRouter en el archivo .env"}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseForART = () => {
        if (lastAnalysis && onCreateART) {
            onCreateART(lastAnalysis);
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-pulse"
                title="Asistente IA"
            >
                <span className="text-3xl">🤖</span>
            </button>
        );
    }

    return (
        <div
            className={`fixed ${isMinimized ? "bottom-6 right-6 w-80" : "bottom-6 right-6 w-96"
                } bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 z-50 transition-all`}
            style={{ maxHeight: isMinimized ? "60px" : "600px" }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h3 className="text-white font-bold text-sm">Asistente IA</h3>
                        <p className="text-purple-100 text-xs">Análisis de Riesgos</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-800">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-700 text-slate-100"
                                        }`}
                                >
                                    {msg.imageUrl && (
                                        <img
                                            src={msg.imageUrl}
                                            alt="Uploaded"
                                            className="rounded-lg mb-2 max-w-full h-auto"
                                        />
                                    )}
                                    <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                                    <p className="text-[10px] opacity-60 mt-1">
                                        {msg.timestamp.toLocaleTimeString("es-CL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-700 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Action Button */}
                    {lastAnalysis && (
                        <div className="p-2 bg-slate-800">
                            <button
                                onClick={handleUseForART}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                            >
                                ✅ Usar para crear ART
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 bg-slate-900 rounded-b-2xl border-t border-slate-700">
                        {selectedImage && (
                            <div className="mb-2 relative inline-block">
                                <img
                                    src={selectedImage}
                                    alt="Preview"
                                    className="h-16 rounded-lg border-2 border-blue-500"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-600 transition-colors"
                                disabled={isLoading}
                                title="Tomar foto"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = "image/*";
                                    input.onchange = handleImageSelect as any;
                                    input.click();
                                }}
                                className="bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-600 transition-colors"
                                disabled={isLoading}
                                title="Subir imagen"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || (!input.trim() && !selectedImage)}
                                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
