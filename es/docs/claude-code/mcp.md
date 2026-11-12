# Servidores MCP en Claude Code

> Source: https://derob98.github.io/ailmanac/es/docs/claude-code/mcp · AILmanac (CC BY 4.0) · last verified 2026-11-10

Conecta bases de datos, GitHub, navegadores y más mediante el Model Context Protocol.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-10" source="https://code.claude.com/docs/en/mcp">
Los comandos `claude mcp`, los ámbitos de configuración y los transportes evolucionan — confírmalos en la documentación oficial de MCP de Claude Code y en modelcontextprotocol.io. Los cuatro transportes, las rutas de almacenamiento de los ámbitos, la obsolescencia de SSE y el comportamiento de la aprobación de proyecto que se describen más abajo provienen todos de esa página.
</VerifyNote>

El **Model Context Protocol (MCP)** es un estándar abierto para conectar la IA con herramientas y datos externos. Un **servidor MCP** expone capacidades (consultar una base de datos, abrir una PR de GitHub, manejar un navegador); Claude Code se conecta a él y puede **llamar a esas herramientas** durante una sesión. Es la forma de extender a Claude más allá de tu sistema de archivos y tu shell.

<Callout type="objectives" items={["Explicar qué es un servidor MCP y cómo Claude Code llama a sus herramientas", "Distinguir los dos transportes: stdio local y HTTP/SSE remoto", "Añadir un servidor con claude mcp add y leer el JSON que escribe", "Elegir el ámbito correcto (local, project, user) según quién deba ver un servidor", "Conectar una base de datos real a Claude de principio a fin", "Evitar las trampas de seguridad y configuración en las que cae la mayoría"]} />

## La forma de la cosa

```mermaid
flowchart LR
  CC[Claude Code] -- calls tool --> S[MCP server]
  S -- result --> CC
  S --- D[(DB / API / Browser / SaaS)]
```

Declaras los servidores que Claude puede usar; cada servidor publica un conjunto de herramientas con sus esquemas; Claude las elige y las llama como cualquier otra herramienta.

<Flashcards title="Vocabulario de MCP" cards={[{front: "Model Context Protocol (MCP)", back: "Un estándar abierto para conectar la IA con herramientas y datos externos."}, {front: "Servidor MCP", back: "Un programa que expone capacidades — consultar una base de datos, abrir una PR de GitHub, manejar un navegador — como herramientas invocables."}, {front: "Herramienta (tool)", back: "Una capacidad que un servidor MCP publica con un esquema; Claude la elige y la llama como cualquier otra herramienta."}, {front: "Transporte", back: "La forma en que Claude llega a un servidor: stdio (proceso local), HTTP (alojado, a menudo con OAuth), SSE (obsoleto — HTTP recurre a él automáticamente) o WebSocket ws/wss (persistente, con push, solo autenticación por cabecera, sin la opción --transport)."}, {front: "Ámbito (scope)", back: "Quién ve un servidor: local (tú, este proyecto), project (el equipo mediante el commit) o user (tú, en todas partes)."}]} />

## Transportes

Hay cuatro maneras de que Claude llegue a un servidor. Elige según dónde se ejecuta el servidor y cómo se comunica.

- **stdio** — un proceso local que Claude lanza (ideal para herramientas/CLI locales). Esto es lo que significa una entrada JSON sin `type`.
- **HTTP** — un servidor alojado, a menudo con OAuth. La opción por defecto para todo lo remoto.
- **SSE** — **obsoleto**; usa HTTP siempre que puedas. Algunos servicios todavía exponen solo un endpoint SSE y, desde Claude Code v2.1.265, `--transport http` prueba primero HTTP y cambia a SSE por sí solo, así que rara vez necesitas indicar `--transport sse` de forma explícita.
- **WebSocket** (`ws` / `wss`) — una conexión bidireccional persistente, para un servidor que envía eventos sin que se le pidan. `--transport` *no* acepta `ws`: añádelo con `claude mcp add-json '{"type":"ws","url":"wss://…"}'` o escríbelo en `.mcp.json`. Sin OAuth — la autenticación es solo por cabeceras.

<Callout type="warning" items={["Una entrada JSON con url pero sin type es un error de configuración, no un valor por defecto razonable: Claude Code lee una entrada sin type como un servidor stdio, la omite e informa de que tiene una «url» pero no un «type». Establece siempre \"type\": \"http\" (o \"sse\" / \"ws\") en un servidor remoto que escribas a mano."]} />

## Configurar servidores

El camino más rápido es el comando `claude mcp add`: escribe la configuración por ti. Sigue esta secuencia para ir de cero a un servidor conectado.

<Steps items={[{title: "Añade un servidor stdio local", body: "Ejecuta claude mcp add — todo lo que va después de -- es el comando de arranque que Claude ejecuta por ti."}, {title: "O añade un servidor HTTP remoto", body: "Pasa --transport http y un ámbito, y luego la URL del servidor. Los servidores remotos suelen estar alojados y usar OAuth."}, {title: "Mira qué está conectado", body: "Ejecuta claude mcp list para ver los servidores configurados y su estado de conexión."}, {title: "Inspecciona y autentica", body: "Usa /mcp dentro de una sesión para inspeccionar las herramientas de un servidor y autenticar los servidores remotos."}]} />

<PromptCard title="Añadir un servidor stdio local">{`# A local stdio server (everything after -- is the launch command)
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/code/myproject`}</PromptCard>

<PromptCard title="Añadir un servidor HTTP remoto (compartido con el proyecto)">{`# A remote HTTP server, shared with everyone on the project
claude mcp add --transport http --scope project github https://api.githubcopilot.com/mcp/`}</PromptCard>

Por debajo, todo es JSON. Un servidor con ámbito **project** acaba en un `.mcp.json` en la raíz del repositorio — hazle commit y tus compañeros obtienen las mismas herramientas en cuanto confían en el espacio de trabajo:

```json
{
  "mcpServers": {
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/" }
  }
}
```

<Callout type="warning" items={["No recurras a los paquetes @modelcontextprotocol/server-github, -postgres, -slack ni -puppeteer que encontrarás en tutoriales antiguos. Están archivados y llevan un aviso de obsolescencia de npm que dice «Archived and unmaintained; no security guarantees». Usa el servidor del propio proveedor cuando exista — el de GitHub es el endpoint HTTP de arriba, y el control del navegador pasó a @playwright/mcp. Entre los servidores de referencia en TypeScript, solo filesystem, memory, everything y sequential-thinking siguen manteniéndose."]} />

### El ámbito decide quién ve el servidor

| Ámbito | Se guarda en | Se carga en | Úsalo para |
|---|---|---|---|
| `local` (por defecto) | `~/.claude.json`, bajo la ruta de este proyecto | solo este proyecto | experimentos personales, secretos |
| `project` | `.mcp.json` en el repositorio (con commit) | solo este proyecto, compartido con el equipo | herramientas que todo el equipo debe compartir |
| `user` | `~/.claude.json` | todos tus proyectos | servidores que quieres en todas partes |

<Callout type="warning" items={["El «ámbito local» de MCP no es lo mismo que la configuración local. Un servidor MCP de ámbito local vive en ~/.claude.json, en tu directorio personal — NO en el .claude/settings.local.json del proyecto. Buscarlo en la carpeta del proyecto es un callejón sin salida."]} />

Ejecuta `claude mcp list` para ver qué está conectado y `/mcp` dentro de una sesión para inspeccionar las herramientas y autenticar los servidores remotos. Consulta [Configuración MCP y plantillas de servidor](/docs/templates/mcp-config) para ver puntos de partida listos para copiar y pegar.

## Ejemplo práctico: dale tu base de datos a Claude

Digamos que quieres que Claude responda preguntas sobre un Postgres local en lugar de pegar tú los resultados de las consultas. Añade el servidor con ámbito project para que tus compañeros también lo tengan.

Las bases de datos son donde más duele el problema de los servidores archivados: el antiguo `@modelcontextprotocol/server-postgres` ya no se mantiene y no hay un reemplazo oficial, así que el nombre del paquete es la única decisión que tienes que tomar tú. Elige un servidor de la comunidad que se mantenga, [revísalo](/docs/security/reviewing-third-party-code) y luego conéctalo — la forma es la misma elijas el que elijas:

<PromptCard title="Añadir un servidor Postgres con ámbito project">{`# Replace the package with a maintained Postgres MCP server you have reviewed.
# The connection string is read-only on purpose — see below.
claude mcp add --scope project db -- npx -y <postgres-mcp-server> "postgresql://readonly@localhost/app"`}</PromptCard>

Ahora, en una sesión, puedes hacer la pregunta en lenguaje natural y dejar que Claude se encargue del bucle de consultas:

<PromptCard title="Hacer una pregunta a la base de datos">{`How many users signed up last week? Check the DB.`}</PromptCard>

Claude llama a la herramienta de consulta que publica el servidor, recibe filas y responde — sin bucle de copiar y pegar. Mantén la cadena de conexión de solo lectura salvo que Claude necesite escribir de verdad. Y si lo único que querías era una consulta, ten en cuenta que `psql -c '…'` a través de Bash cuesta una fracción de los tokens; [El impuesto de tokens de MCP](/docs/claude-code/mcp-token-cost) explica cuándo gana cada uno.

Como tiene ámbito project, un compañero que haga pull del repositorio obtiene la misma capacidad, pero **ni en silencio ni al instante**. Un servidor de un `.mcp.json` con commit queda en `⏸ Pending approval` hasta que ejecute `claude` en la carpeta y acepte el cuadro de diálogo de confianza del espacio de trabajo. Un repositorio clonado no puede preaprobar sus propios servidores: `enableAllProjectMcpServers` o `enabledMcpjsonServers` incluidos en el `.claude/settings.json` del proyecto se *ignoran* en una carpeta no confiable. En cambio, las aprobaciones de un `~/.claude/settings.json` a nivel de usuario, de la configuración gestionada o pasadas con `--settings` sí se aplican ahí. Esa es la respuesta habitual a «¿por qué mi compañero no ve el servidor?»

## Confianza y seguridad

<Callout type="warning" items={["Un servidor MCP ejecuta código y puede leer datos y realizar acciones — conecta solo servidores en los que confíes.", "Dale a cada servidor el mínimo privilegio que necesite.", "Cualquier contenido externo que devuelva un servidor puede contener inyección de prompts.", "Revisa los servidores de terceros antes de conectarlos."]} />

:::warning[Trata los servidores MCP como si instalaras software]
Un servidor MCP ejecuta código y puede leer datos y realizar acciones. Conecta solo servidores en los que confíes, dales el **mínimo privilegio** necesario y recuerda que cualquier contenido externo que devuelvan puede contener [inyección de prompts](/docs/security/prompt-injection). Revisa primero los servidores de terceros — consulta [Revisar código de terceros](/docs/security/reviewing-third-party-code).
:::

## MCP también en las apps

MCP también impulsa los **Conectores** de las apps de Claude — el mismo estándar, otra superficie. Consulta [Conectores (MCP) en las apps](/docs/claude-app/connectors) y, para la API, [MCP y conexión a herramientas](/docs/api/mcp).

## Errores comunes

- **Ámbito equivocado.** Un servidor añadido con ámbito `local` no aparecerá para tus compañeros; uno que solo querías para ti no debería subirse con ámbito `project`. Elige con intención.
- **Demasiados servidores, demasiadas herramientas.** La búsqueda de herramientas está activada por defecto, así que un servidor conectado normalmente te cuesta en cada turno los *nombres* de sus herramientas y las instrucciones del servidor en lugar de sus esquemas completos — pero sigue siendo un impuesto por turno, y los esquemas entran en el contexto en el momento en que Claude los busca. Conecta lo que la tarea necesita, no todo tu catálogo. Consulta [El impuesto de tokens de MCP](/docs/claude-code/mcp-token-cost) para ver las cifras reales, los modos de `ENABLE_TOOL_SEARCH` y cómo la ejecución de código reduce el segundo coste.
- **Conexiones con demasiados privilegios.** Dale a un servidor de base de datos un rol de solo lectura salvo que Claude necesite escribir de verdad. MCP vuelve reales las capacidades — acótalas.
- **Olvidar el riesgo de inyección.** Todo lo que devuelve un servidor (una página web, el cuerpo de una incidencia, una fila) es texto no confiable que puede contener [inyección de prompts](/docs/security/prompt-injection). No conectes un servidor potente con capacidad de escritura junto a uno no confiable con capacidad de lectura sin pensarlo bien.

<Quiz title="Compruébalo tú mismo" questions={[{q: "¿Qué transporte es un proceso local que el propio Claude lanza?", options: ["HTTP/SSE remoto", "stdio", "OAuth"], answer: 1, explain: "stdio es un proceso local que Claude lanza — ideal para herramientas y CLI locales. Los otros tres son remotos: HTTP (a menudo con OAuth), el obsoleto SSE y WebSocket."}, {q: "¿Dónde se escribe un servidor con ámbito project y qué tiene que hacer un compañero?", options: ["En tu configuración de usuario; solo tú lo ves", "En un .mcp.json en la raíz del repositorio; tras hacer pull, aún tiene que confiar en el espacio de trabajo para que salga de Pending approval", "En una caché global oculta; nadie puede editarla"], answer: 1, explain: "El ámbito project acaba en un .mcp.json con commit en la raíz del repositorio. Pero un repositorio clonado no puede aprobar sus propios servidores — un enableAllProjectMcpServers incluido en el commit se ignora en una carpeta no confiable, así que el servidor espera en Pending approval hasta que el compañero acepte el cuadro de diálogo de confianza del espacio de trabajo."}, {q: "¿Por qué mantener de solo lectura una conexión a base de datos cuando Claude solo necesita leer?", options: ["Hace que las consultas se ejecuten más rápido", "Mínimo privilegio — MCP vuelve reales las capacidades, así que no concedas acceso de escritura salvo que sea realmente necesario", "El protocolo exige el solo lectura"], answer: 1, explain: "Dale a los servidores el mínimo privilegio que necesiten. MCP vuelve reales las capacidades, así que un rol de solo lectura evita escrituras no deseadas."}]} />

<Callout type="takeaways" items={["MCP es un estándar abierto; un servidor MCP expone herramientas que Claude Code llama como cualquier otra herramienta.", "Cuatro transportes: stdio (un proceso que Claude lanza), HTTP (el predeterminado para lo remoto), SSE (obsoleto — HTTP cambia a él por sí solo) y WebSocket ws/wss (push, autenticación por cabecera, solo con add-json).", "claude mcp add escribe la configuración por ti; por debajo es JSON. El ámbito project vive en un .mcp.json con commit, y la copia de un compañero se queda en Pending approval hasta que confíe en el espacio de trabajo.", "El ámbito controla la visibilidad: local (tú, este proyecto), project (con commit para el equipo), user (tú, en todas partes).", "Trata los servidores como instalar software: confianza, mínimo privilegio y atención a la inyección de prompts en todo lo que devuelven."]} />

## Siguiente

- [Crea y conecta tu primer servidor MCP (guía paso a paso)](/docs/walkthroughs/first-mcp-server)
- [Configuración MCP y plantillas de servidor](/docs/templates/mcp-config)
- [Proteger agentes y herramientas](/docs/security/securing-agents)
