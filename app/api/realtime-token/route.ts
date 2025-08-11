// app/api/realtime-token/route.ts

/**
 * Este endpoint crea una sesión en tiempo real con OpenAI.
 * Actúa como un proxy seguro para no exponer la clave de API de OpenAI al cliente.
 */
export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("La variable de entorno OPENAI_API_KEY no está configurada.");
    }

    // Configuración de la sesión de OpenAI
    const sessionConfig = {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      voice: "alloy", // Voz estándar de OpenAI
      modalities: ["text", "audio"],
      tools: [
        {
          type: "function",
          function: {
            name: "decir_chiste",
            description: "Cuenta un chiste al usuario sobre un tema específico.",
            parameters: {
              type: "object",
              properties: {
                tema: {
                  type: "string",
                  description: "El tema sobre el que debe ser el chiste, por ejemplo, 'programadores'",
                },
              },
              required: ["tema"],
            },
          },
        },
      ],
      // Configuración adicional para la detección de voz
      turn_detection: {
        type: "server_vad",
        threshold: 0.9,
        prefix_padding_ms: 300,
        silence_duration_ms: 1200,
      },
    };

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de la API de OpenAI:", errorData);
      return new Response(JSON.stringify({ error: "No se pudo crear la sesión", details: errorData }), {
        status: response.status,
      });
    }

    const data = await response.json();
    // Devolvemos la respuesta completa de OpenAI al cliente
    return Response.json(data);

  } catch (error) {
    console.error("Error al generar el token de sesión:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: "Error interno del servidor", details: errorMessage }), {
      status: 500,
    });
  }
}
