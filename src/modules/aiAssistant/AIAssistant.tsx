import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Send, Image as ImageIcon, Sparkles, FileText, ArrowLeft } from "lucide-react";
import {
    analyzeWorkSiteImage,
    chatWithAssistant,
    convertImageToBase64,
    type AIMessage,
    type RiskAnalysis,
} from "../../services/aiAssistant.service";

export default function AIAssistant() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<AIMessage[]>([
        {
            role: "assistant",
            content:
                "¡Hola! Soy tu asistente de prevención de riesgos. Puedes mostrarme una foto del sitio de trabajo y te ayudaré a identificar riesgos y crear un ART.",
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
                content: `❌ Error: ${error.message || "No pude procesar tu solicitud. Verifica tu API key de OpenRouter."}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateARTFromAnalysis = () => {
        if (!lastAnalysis) return;

        const risksText = lastAnalysis.risks.join(", ");

        // Navigate to ART creation with pre-filled data
        navigate("/art/new", {
            state: {
                aiSuggestions: {
                    riesgos: risksText,
                    medidasPreventivas: lastAnalysis.preventiveMeasures.join("\n"),
                    epp: lastAnalysis.requiredPPE.join(", "),
                },
            },
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Asistente IA</h1>
                            <p className="text-sm text-slate-400">Análisis de Riesgos Inteligente</p>
                        </div>
                    </div>
                    <div className="w-20"></div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-100 border border-slate-700"
                                }`}
                        >
                            {msg.imageUrl && (
                                <img
                                    src={msg.imageUrl}
                                    alt="Uploaded"
                                    className="rounded-lg mb-2 max-w-full h-auto"
                                />
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-60 mt-2">
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
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                                <span className="text-slate-400 ml-2">Analizando...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Button */}
            {lastAnalysis && (
                <div className="p-4 max-w-4xl mx-auto w-full">
                    <button
                        onClick={handleCreateARTFromAnalysis}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                        <FileText className="w-5 h-5" />
                        Usar para crear ART
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 p-4">
                <div className="max-w-4xl mx-auto">
                    {selectedImage && (
                        <div className="mb-3 relative inline-block">
                            <img
                                src={selectedImage}
                                alt="Preview"
                                className="h-20 rounded-lg border-2 border-blue-500"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
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
                            className="bg-slate-700 text-white p-3 rounded-xl hover:bg-slate-600 transition-colors"
                            disabled={isLoading}
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = handleImageSelect as any;
                                input.click();
                            }}
                            className="bg-slate-700 text-white p-3 rounded-xl hover:bg-slate-600 transition-colors"
                            disabled={isLoading}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                            placeholder="Escribe tu pregunta o sube una foto..."
                            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || (!input.trim() && !selectedImage)}
                            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
