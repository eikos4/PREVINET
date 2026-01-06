export type AIMessage = {
    role: "user" | "assistant";
    content: string;
    imageUrl?: string;
    timestamp: Date;
};

export type RiskAnalysis = {
    risks: string[];
    preventiveMeasures: string[];
    requiredPPE: string[];
    rawResponse: string;
};

const SYSTEM_PROMPT = `Eres un experto en prevención de riesgos laborales en construcción en Chile.
Analiza imágenes de sitios de trabajo e identifica riesgos según la normativa chilena (Ley 16.744, DS 594, etc.).

Cuando analices una imagen, estructura tu respuesta así:

**RIESGOS IDENTIFICADOS:**
- [Lista de riesgos específicos]

**MEDIDAS PREVENTIVAS:**
- [Acciones concretas para mitigar cada riesgo]

**EPP REQUERIDO:**
- [Elementos de protección personal necesarios]

Sé conciso, práctico y enfócate en lo más crítico.`;

export async function analyzeWorkSiteImage(
    imageBase64: string,
    userPrompt: string
): Promise<{ response: string; analysis: RiskAnalysis | null }> {
    const messages = [
        {
            role: "system",
            content: SYSTEM_PROMPT,
        },
        {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: imageBase64,
                    },
                },
                {
                    type: "text",
                    text: userPrompt || "Analiza esta imagen e identifica los riesgos laborales presentes.",
                },
            ],
        },
    ];

    // Use the secure backend endpoint
    const BACKEND_API_URL = "/api/analyze";

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Authentication handled by backend
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Backend API error: ${response.status} - ${errorData.error || response.statusText}`
            );
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "";

        const analysis = extractRisksFromResponse(aiResponse);

        return {
            response: aiResponse,
            analysis,
        };
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
}

export async function chatWithAssistant(
    messages: AIMessage[]
): Promise<string> {
    const formattedMessages = [
        {
            role: "system",
            content: SYSTEM_PROMPT,
        },
        ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        })),
    ];

    // Use the secure backend endpoint
    const BACKEND_API_URL = "/api/analyze";

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Authentication handled by backend
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: formattedMessages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Backend API error: ${response.status} - ${errorData.error || response.statusText}`
            );
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No pude generar una respuesta.";
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
}

function extractRisksFromResponse(aiResponse: string): RiskAnalysis | null {
    try {
        const risks: string[] = [];
        const preventiveMeasures: string[] = [];
        const requiredPPE: string[] = [];

        // Extract risks
        const risksMatch = aiResponse.match(/\*\*RIESGOS IDENTIFICADOS:\*\*([\s\S]*?)(?=\*\*|$)/i);
        if (risksMatch) {
            const riskLines = risksMatch[1].split("\n").filter((line) => line.trim().startsWith("-"));
            risks.push(...riskLines.map((line) => line.replace(/^-\s*/, "").trim()));
        }

        // Extract preventive measures
        const measuresMatch = aiResponse.match(/\*\*MEDIDAS PREVENTIVAS:\*\*([\s\S]*?)(?=\*\*|$)/i);
        if (measuresMatch) {
            const measureLines = measuresMatch[1].split("\n").filter((line) => line.trim().startsWith("-"));
            preventiveMeasures.push(...measureLines.map((line) => line.replace(/^-\s*/, "").trim()));
        }

        // Extract PPE
        const ppeMatch = aiResponse.match(/\*\*EPP REQUERIDO:\*\*([\s\S]*?)(?=\*\*|$)/i);
        if (ppeMatch) {
            const ppeLines = ppeMatch[1].split("\n").filter((line) => line.trim().startsWith("-"));
            requiredPPE.push(...ppeLines.map((line) => line.replace(/^-\s*/, "").trim()));
        }

        if (risks.length === 0 && preventiveMeasures.length === 0 && requiredPPE.length === 0) {
            return null;
        }

        return {
            risks,
            preventiveMeasures,
            requiredPPE,
            rawResponse: aiResponse,
        };
    } catch (error) {
        console.error("Error parsing AI response:", error);
        return null;
    }
}

export function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
