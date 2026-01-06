const express = require("express");
const sirv = require("sirv");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Endpoint API para analizar riesgos
app.post("/api/analyze", async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Error: OPENROUTER_API_KEY no configurada en .env");
      return res.status(500).json({ error: "Configuración del servidor incompleta" });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Formato de mensaje inválido" });
    }

    console.log("Procesando solicitud de análisis con OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://previnet.xyz", // Opcional, buena práctica
        "X-Title": "Previnet Backend",
      },
      body: JSON.stringify({
        model: req.body.model || "openai/gpt-4o-mini",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error de OpenRouter:", response.status, errorData);
      return res.status(response.status).json({
        error: `OpenRouter API error: ${response.status}`,
        details: errorData,
      });
    }

    const data = await response.json();
    console.log("Respuesta recibida exitosamente de OpenRouter");
    res.json(data);

  } catch (error) {
    console.error("Error interno del servidor:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// Servir frontend estático desde dist
app.use(
  sirv(path.join(__dirname, "dist"), {
    single: true,
  })
);

app.listen(PORT, () => {
  console.log(`Servidor seguro corriendo en el puerto ${PORT}`);
  console.log(`Frontend servido desde: ${path.join(__dirname, "dist")}`);
});