# Construyendo un servidor MCP de Tutor de CSS

Este repositorio contiene un servidor simple del Model Context Protocol (MCP) construido con Node.js y TypeScript. Actúa como un "Tutor de CSS", proporcionando actualizaciones personalizadas sobre funciones de CSS a un cliente de IA conectado.

Este servidor demuestra conceptos clave de MCP: la definición de **Recursos** (Resources), **Herramientas** (Tools) y **Prompts**. El objetivo de esta demostración es ayudarte a avanzar desde aquí y construir capacidades agenticas mucho más amplias e interesantes.

## Requisitos Previos

*   Node.js (v18 o posterior recomendado)
*   `npm` (o tu gestor de paquetes de Node.js preferido como `yarn` o `pnpm`)
*   Un cliente de IA capaz de conectarse a un servidor MCP (por ejemplo, la aplicación de escritorio de Claude)
*   Una [Clave de API de OpenRouter](https://openrouter.ai/) (para obtener actualizaciones de CSS en vivo a través de Perplexity)

## Inicio Rápido

Sigue estos pasos para poner en marcha el servidor rápidamente:

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/3mdistal/css-mcp-server.git
    cd css-mcp-server
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm install # O: yarn install / pnpm install
    ```

3.  **Preparar la Clave de API:** La herramienta `get_latest_updates` requiere una clave de API de OpenRouter. Obtén tu clave en [OpenRouter](https://openrouter.ai/). Proporcionarás esta clave a tu cliente MCP en el Paso 5.

4.  **Construir el Servidor:** Compila el código TypeScript.
    ```bash
    npm run build # O: yarn build / pnpm run build
    ```

5.  **Configurar tu Cliente MCP:** Indica a tu cliente cómo iniciar el servidor *y* proporciona la clave de API como una variable de entorno. Aquí tienes un ejemplo para el archivo `claude_desktop_config.json` de la aplicación de escritorio de Claude:

    ```json
    {
      "mcpServers": {
        "css-tutor": {
          "command": "node",
          "args": [
            "/full/path/to/your/css-mcp-server/build/index.js"
          ],
          "env": {
            "OPENROUTER_API_KEY": "sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxx"
          }
        }
      }
    }
    ```
    *(Asegúrate de que la ruta en `args` sea la **ruta absoluta** correcta al archivo `index.js` compilado en tu sistema. Reemplaza la clave de API de ejemplo).*

6.  **Conectar:** Inicia la conexión desde tu cliente MCP. El cliente lanzará el proceso del servidor (con la clave de API en su entorno), ¡y ya puedes empezar a interactuar!

## Uso con Cursor

[Cursor](https://cursor.sh/) es un editor de código centrado en IA que puede actuar como un cliente MCP. Configurar este servidor con Cursor es sencillo, pero requiere un paso adicional para el prompt de guía.

1.  **Configurar el Servidor en Cursor:**
    *   Ve a `Cursor Settings` > `MCP` > `Add new global MCP server`.
    *   Pega el mismo JSON que en el paso de Claude Desktop, con todas las mismas advertencias.

2.  **Crear una Regla de Proyecto de Cursor para el Prompt:** Actualmente, Cursor no utiliza automáticamente los prompts MCP proporcionados por los servidores. En su lugar, debes proporcionar la guía utilizando la función de [Project Rules](https://docs.cursor.com/context/rules-for-ai) de Cursor.
    *   Crea el directorio `.cursor/rules` en la raíz de tu proyecto si no existe.
    *   Crea un archivo dentro llamado `css-tutor.rule` (o cualquier nombre de archivo `.rule`).
    *   Pega el siguiente texto de guía en `css-tutor.rule`:

        ```text
        You are a helpful assistant connecting to a CSS knowledge server. Your goal is to provide the user with personalized updates about new CSS features they haven't learned yet.

        Available Tools:
        1.  `get_latest_updates`: Fetches recent general news and articles about CSS. Use this first to see what's new.
        2.  `read_from_memory`: Checks which CSS concepts the user already knows based on their stored knowledge profile.
        3.  `write_to_memory`: Updates the user's knowledge profile. Use this when the user confirms they have learned or already know a specific CSS concept mentioned in an update.

        Workflow:
        1.  Call `get_latest_updates` to discover recent CSS developments.
        2.  Call `read_from_memory` to get the user's current known concepts (if any).
        3.  Compare the updates with the known concepts (if any). Identify 1-2 *new* concepts relevant to the user. **Important: They _must_ be from the response returned by `get_latest_updates` tool.**
        4.  Present these new concepts to the user, adding any context as needed, in addition to the information returned by the `get_latest_updates`.
        5.  Ask the user if they are familiar with these concepts or if they've learned them now.
        6.  If the user confirms knowledge of a concept, call `write_to_memory` to update their profile for that specific concept.
        7.  Focus on providing actionable, personalized learning updates.
        ```

3.  **Conectar y Usar:**
    *   Asegúrate de que el servidor `css-tutor` esté habilitado en la configuración de MCP de Cursor.
    *   Inicia un nuevo chat o solicitud de generación de código (por ejemplo, Cmd+K) e incluye `@css-tutor-rule` (o el nombre que le hayas dado a tu archivo de regla) en tu solicitud. Esto le indica a Cursor que cargue el contenido de la regla, que incluye las instrucciones sobre cómo usar las herramientas `read_from_memory`, `write_to_memory` y `get_latest_updates` proporcionadas por el servidor MCP conectado.

Ten en cuenta que _sin_ el prompt/regla, Cursor seguirá siendo capaz de utilizar herramientas individuales si se lo pides. El prompt proporciona un flujo de trabajo y un orden para llamar a las herramientas y leer/escribir en la memoria.

## Entendiendo el Código

Esta sección proporciona una visión general de alto nivel de cómo está implementada la servidor.

### Conceptos de MCP Utilizados

*   **Recurso (`css_knowledge_memory`):** Representa los conceptos de CSS conocidos por el usuario, almacenados persistentemente en `data/memory.json`.
*   **Herramientas (Tools):** Acciones que el servidor puede realizar:
    *   `get_latest_updates`: Obtiene noticias de CSS desde OpenRouter/Perplexity.
    *   `read_from_memory`: Lee el contenido del recurso `css_knowledge_memory`.
    *   `write_to_memory`: Modifica el recurso `css_knowledge_memory`.
*   **Prompt (`css-tutor-guidance`):** Instrucciones estáticas que guían al cliente de IA sobre cómo interactuar con las herramientas y el recurso de manera efectiva.

### Estructura del Código

El código está organizado de la siguiente manera:

*   **`data/memory.json`**: Un archivo JSON simple que actúa como base de datos para los conceptos de CSS conocidos. Se incluye una versión predeterminada en el repositorio.
*   **`src/resources/index.ts`**: Define el recurso `css_knowledge_memory`. Incluye:
    *   Un esquema de Zod para validar los datos.
    *   Funciones `readMemory` y `writeMemory` para E/S de archivos.
    *   Registro mediante `server.resource`, especificando el esquema URI `memory://` y los permisos de lectura/escritura. El manejador de lectura devuelve el contenido de `data/memory.json`.
*   **`src/tools/index.ts`**: Define las tres herramientas usando `server.tool`:
    *   `read_from_memory`: Llama a `readMemory`.
    *   `write_to_memory`: Toma `concept` y `known` como entrada (esquema definido con Zod), utiliza `readMemory` y `writeMemory` para actualizar el archivo JSON.
    *   `get_latest_updates`: Requiere `OPENROUTER_API_KEY`, llama a la API de OpenRouter usando `node-fetch` y el modelo `perplexity/sonar-pro`, y devuelve el resumen generado por la IA.
*   **`src/prompts/index.ts`**: Define el prompt estático `css-tutor-guidance` usando `server.prompt`. El texto del prompt está embebido directamente en el código.
*   **`src/index.ts`**: El punto de entrada principal del servidor.
    *   Inicializa la instancia de `McpServer` desde `@modelcontextprotocol/sdk`.
    *   Importa y llama a las funciones `registerPrompts`, `registerResources` y `registerTools` de los otros módulos.
    *   Utiliza `StdioServerTransport` para manejar la comunicación a través de la entrada/salida estándar.
    *   Conecta el servidor al transporte e incluye un manejo básico de errores.
*   **`package.json`**: Define las dependencias (`@modelcontextprotocol/sdk`, `dotenv`, `node-fetch`, `zod`) y el script de compilación (`tsc`).
*   **`.env.example` / `.env`**: Utilizados para almacenar la `OPENROUTER_API_KEY` (si se usa la Opción A para la configuración).
*   **`.gitignore`**: Configurado para ignorar `node_modules`, `build`, `.env` y el contenido de `data/` excepto el archivo predeterminado `data/memory.json`.
*   **`tsconfig.json`**: Configuración estándar de TypeScript.

## Depuración con MCP Inspector

Si necesitas depurar el servidor o inspeccionar los mensajes JSON-RPC brutos que se están intercambiando, puedes usar la herramienta `@modelcontextprotocol/inspector`. Esta herramienta actúa como un cliente MCP básico y lanza tu servidor, mostrándote el flujo de comunicación.

Ejecuta el inspector desde tu terminal en la raíz del proyecto:

```bash
npx @modelcontextprotocol/inspector node ./build/index.js
```

**Explicación:**

*   `npx @modelcontextprotocol/inspector`: Descarga (si es necesario) y ejecuta el paquete del inspector.
*   `node`: El comando utilizado para ejecutar tu servidor.
*   `./build/index.js`: La ruta (relativa a la raíz de tu proyecto) hacia el punto de entrada de tu servidor compilado.

**Variables de Entorno para el Inspector:**

Ten en cuenta que el inspector lanza tu servidor como un proceso hijo. Si tu servidor depende de variables de entorno (como `OPENROUTER_API_KEY` para la herramienta `get_latest_updates`), debes asegurarte de que estén disponibles en el entorno donde ejecutas el comando `npx`. Es posible que el archivo `.env` no se cargue automáticamente en este contexto. Normalmente, puedes anteponer la variable al comando:

```bash
# Ejemplo en Linux/macOS
OPENROUTER_API_KEY="sk-or-xxxxxxxxxx" npx @modelcontextprotocol/inspector node ./build/index.js

# Ejemplo en Windows (Símbolo del sistema)
set OPENROUTER_API_KEY=sk-or-xxxxxxxxxx && npx @modelcontextprotocol/inspector node ./build/index.js

# Ejemplo en Windows (PowerShell)
$env:OPENROUTER_API_KEY="sk-or-xxxxxxxxxx"; npx @modelcontextprotocol/inspector node ./build/index.js
```

Reemplaza `sk-or-xxxxxxxxxx` con tu clave real.

## Conclusión

Esta demo muestra los pasos fundamentales para crear un servidor MCP funcional utilizando el SDK de TypeScript. Definimos un recurso para gestionar el estado, herramientas para realizar acciones (incluyendo la interacción con una API externa) y un prompt para guiar al cliente de IA.

¡Espero que esta demo te ayude a entender cómo construir servidores mucho más complejos (y útiles) que este!

(Además, si encuentras algún 🐛error, no dudes en abrir un issue).
