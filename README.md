# Plantilla de Proyecto: OpenAI Real-time API con Next.js

Este proyecto es una plantilla y un ejemplo funcional que demuestra cómo integrar la **API de Sesiones en Tiempo Real de OpenAI** en una aplicación Next.js. El objetivo es proporcionar una base sólida y fácil de entender para futuros proyectos que requieran transcripción de voz, respuesta de un modelo de lenguaje (LLM) y ejecución de funciones (tools) en tiempo real.

## ¿Qué hace este proyecto?

Esta plantilla implementa un chat de voz interactivo. Puedes hablarle al navegador, y la aplicación:
1.  Captura el audio y lo envía a OpenAI en tiempo real.
2.  Recibe la transcripción de lo que dijiste.
3.  Si mencionas una de las "herramientas" (funciones) definidas, el LLM la ejecuta.
4.  El LLM responde a tu petición con voz sintetizada.

## Arquitectura y Flujo de Datos

La comunicación no es una simple conexión WebSocket. Sigue un flujo específico de OpenAI:

1.  **Petición de Sesión**: El cliente (nuestro hook de React `useRealtime`) hace una petición a un endpoint de nuestra propia API en Next.js (`/api/realtime-token`).
2.  **Creación de Sesión (Backend)**: Nuestro endpoint (`route.ts`) recibe la petición y llama de forma segura a la API de OpenAI (`/v1/realtime/sessions`), enviando la configuración deseada (modelo, voz, herramientas disponibles) y nuestra `OPENAI_API_KEY` secreta.
3.  **Respuesta de OpenAI**: OpenAI responde con los detalles de la sesión, que incluyen una **URL de WebSocket temporal** y un **token de sesión**.
4.  **Conexión WebSocket**: Nuestro backend devuelve estos datos al cliente. El hook `useRealtime` usa esta URL y token para establecer la conexión WebSocket directa con los servidores de OpenAI.
5.  **Comunicación Realtime**: Una vez conectado, el cliente empieza a enviar el audio del micrófono y a recibir eventos del servidor (transcripciones, respuestas del LLM, etc.).

![Diagrama de Arquitectura](https://i.imgur.com/A31e4tJ.png)

## Cómo Empezar

### 1. Configuración

**a. Clave de API:**
   - Renombra el archivo `.env.local.example` a `.env.local`.
   - Abre `.env.local` y añade tu clave secreta de OpenAI:
     ```
     OPENAI_API_KEY="sk-..."
     ```

**b. Instalar Dependencias:**
   ```bash
   npm install
   ```

### 2. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Deberías ver la interfaz de chat. Otorga permisos de micrófono cuando el navegador te lo pida.

## Guía del Código

### Backend: `/app/api/realtime-token/route.ts`

Este es el corazón de la configuración de la sesión. Es un endpoint `GET` que crea la sesión en OpenAI.

- **Seguridad**: Su función principal es actuar como un intermediario seguro. Mantiene tu `OPENAI_API_KEY` oculta en el servidor y solo expone un token de sesión de corta vida al cliente.
- **Configuración del Agente**: Aquí defines el comportamiento de tu asistente de IA.
  - `model`: El modelo a usar (ej: `gpt-4o-mini-realtime`).
  - `voice`: La voz para la respuesta sintetizada.
  - `tools`: **La parte más importante**. Es un array de objetos que describe las funciones que el LLM puede decidir ejecutar. En este ejemplo, hemos definido una herramienta simple `decir_chiste`. El LLM "ve" esta definición y entiende cuándo y cómo llamarla.

### Frontend Hook: `/app/hooks/useRealtime.ts`

Este hook encapsula toda la lógica del cliente para interactuar con la sesión de OpenAI.

- **Estado que Expone**:
  - `isConnected`: `true` o `false`, para saber el estado de la conexión.
  - `transcript`: El texto transcrito de lo que dice el usuario.
  - `llmResponse`: El texto de la respuesta del LLM.
  - `isSpeaking`: `true` si el asistente está hablando.
- **Funciones que Expone**:
  - `start/stop`: Para iniciar y detener la captura de audio.
  - `sendText`: Para enviar un mensaje de texto al LLM (útil para interacciones sin voz).

**Ejemplo de uso en un componente de React:**
```jsx
const { isConnected, transcript, start, stop } = useRealtime();

return (
    <div>
        <p>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</p>
        <button onClick={start}>Hablar</button>
        <button onClick={stop}>Dejar de Hablar</button>
        <p>Tú dijiste: {transcript}</p>
    </div>
);
```

### Frontend UI: `/app/components/ChatInterface.tsx`

Este es un componente de ejemplo que muestra cómo usar el hook `useRealtime` para construir una interfaz de usuario funcional. Contiene:
- Indicadores de estado.
- Botones para controlar la grabación.
- Áreas para mostrar la transcripción y las respuestas del LLM.

## Para Futuros Proyectos

Para adaptar esta plantilla a un nuevo proyecto, solo necesitas:

1.  **Copiar la Carpeta**: Copia toda la carpeta `gpt-realtime` a tu nuevo proyecto.
2.  **Ajustar las Herramientas**: Modifica el array `tools` en `/app/api/realtime-token/route.ts` para definir las funciones específicas que tu nueva aplicación necesita.
3.  **Implementar la Lógica de las Herramientas**: En el hook `useRealtime`, encontrarás un `switch` dentro del `onmessage` que maneja los eventos `tool_calls`. Ahí es donde debes añadir la lógica del cliente para cada una de tus herramientas.
4.  **Construir tu UI**: Usa el hook `useRealtime` en tus componentes de React para construir la interfaz de usuario que necesites.
