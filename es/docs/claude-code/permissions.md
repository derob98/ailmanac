# Permisos y modos de permiso

> Source: https://derob98.github.io/ailmanac/es/docs/claude-code/permissions · AILmanac (CC BY 4.0) · last verified 2026-08-18

Reglas allow/ask/deny y modos: menos confirmaciones sin perder seguridad.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-08-18" source="https://code.claude.com/docs/en/whats-new/2026-w32">
La sintaxis exacta de las reglas y los nombres de los modos evolucionan: confírmalos en la documentación oficial de Claude Code sobre permisos y modos de permiso. **Desde la v2.1.283:** `auto` es el modo de inicio integrado de las sesiones interactivas en terminal y VS Code, en todos los planes y proveedores (ver más abajo).
</VerifyNote>

<Callout type="objectives" items={["Qué significan los tres veredictos de permiso (allow / ask / deny)", "Cómo las reglas de permiso asocian una herramienta con un patrón", "Los seis modos de permiso y cuándo usar cada uno", "Por qué el modo auto es ahora el modo de inicio de las sesiones interactivas, y cómo desactivarlo", "Cómo el modo auto sustituye las confirmaciones por un clasificador de seguridad", "Cómo construir una allowlist inicial sensata que reduzca las confirmaciones sin perder seguridad", "Dónde guardar las reglas de permiso del proyecto y las personales"]} />

Los permisos deciden **qué puede hacer Claude Code sin detenerse a preguntarte**. Si los ajustas bien, ganas fluidez sin perder el control; si los ajustas mal, o lo apruebas todo sin mirar o te ahogas en confirmaciones.

## Los tres veredictos

Cada acción posible se resuelve en uno de estos:

<Flashcards cards={[{front: "allow", back: "Hacerlo, sin preguntar."}, {front: "ask", back: "Pausar y preguntarte: el comportamiento por defecto para todo lo que no esté permitido o denegado de forma explícita."}, {front: "deny", back: "Nunca, ni siquiera si lo pides."}]} />

Las reglas suelen asociar una herramienta con un patrón, por ejemplo allow `Bash(npm run test:*)` o deny `Read(./.env)`.

<PromptCard title="Permitir una herramienta + patrón">{`Bash(npm run test:*)`}</PromptCard>

<PromptCard title="Denegar una herramienta + patrón">{`Read(./.env)`}</PromptCard>

## Modos de permiso

Un modo fija la postura general de una sesión. Hay seis. Recorre los más comunes con `Shift+Tab`, o define `permissions.defaultMode` en la configuración.

| Modo | Se ejecuta sin preguntar | Úsalo cuando |
|---|---|---|
| **`default`** (se muestra como **Manual**) | Solo lecturas | Trabajo diario, cambios delicados |
| **`acceptEdits`** | Lecturas, ediciones de archivos, comandos habituales del sistema de archivos | Una sesión de edición de confianza y bien acotada |
| **`plan`** | Lecturas, más los comandos aprobados por el clasificador cuando el modo auto está disponible; nunca edita tu código fuente | Tareas grandes o arriesgadas: ver [Plan Mode](/docs/claude-code/plan-mode) |
| **`auto`** *(el modo de inicio de las sesiones interactivas desde la v2.1.283)* | Todo, filtrado por un clasificador de seguridad | Tareas largas donde el verdadero riesgo es la fatiga de confirmaciones |
| **`dontAsk`** | Lecturas de archivos en tus directorios de trabajo y herramientas preaprobadas; todo lo que pediría confirmación se deniega | CI y scripts blindados |
| **`bypassPermissions`** | Todo, sin comprobaciones | Solo sandboxes/contenedores: **nunca** en una máquina con secretos |

### El modo auto es ahora el predeterminado de Claude Code

Desde Claude Code **v2.1.283**, `auto` es el modo de inicio integrado de las sesiones interactivas en terminal y VS Code en **todos los planes y proveedores**. En versiones anteriores era el predeterminado de las sesiones nuevas solo en los planes Pro, Max y Team, a partir del 14 de agosto de 2026. La justificación de Anthropic (basada en sus propias pruebas con más de 1.000 usuarios de pago): el clasificador detectó el **89 %** de las acciones dañinas frente al **13,6 %** de la revisión manual, porque los usuarios, ya habituados, aceptaban alrededor del 97 % de las confirmaciones manuales sin leerlas.

Dos excepciones preservan la intención:

- Si **tú** defines `permissions.defaultMode` en tu configuración de usuario, se mantiene a menos que aceptes un aviso único de cambio en la aplicación.
- Si **tu organización** gestiona el valor predeterminado (configuración gestionada de Team/Enterprise), no cambia nada automáticamente.

Siempre puedes cambiar de modo a mitad de sesión con `Shift+Tab`. Un cambio relacionado que ya está en vigor en esos planes: las llamadas al clasificador que hace el modo auto **ya no cuentan para tus límites de uso**.

<PromptCard title="Activarlo antes (antes del 14 ago): establece auto como predeterminado">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "auto"
  }
}`}</PromptCard>

<PromptCard title="Mantener el comportamiento anterior con confirmaciones después del 14 ago">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "default"
  }
}`}</PromptCard>

### Cómo funciona realmente el modo auto

`auto` es el punto medio entre pedir confirmación para todo y desactivar la seguridad. En lugar de preguntarte, un **modelo clasificador** independiente revisa cada acción antes de ejecutarla y bloquea todo lo que escale más allá de lo que pediste, toque una infraestructura que no reconoce o parezca impulsado por contenido hostil que Claude acaba de leer. Las reglas `ask` explícitas siguen deteniéndose y preguntándote.

Bloquea cosas como `curl | bash`, force push, despliegues y migraciones en producción, `rm -rf` sobre variables sin resolver, manipulación de la transcripción, comandos git destructivos que descartan trabajo sin confirmar y el envío de secretos a destinos externos, mientras deja pasar el trabajo rutinario (ediciones locales, instalación de dependencias declaradas, HTTP de solo lectura, push a tu propia rama). Si bloquea la misma acción repetidamente, el modo auto se pausa y te devuelve las confirmaciones.

El modo auto no es una garantía de seguridad: reduce las confirmaciones, pero no elimina la necesidad de revisar las operaciones delicadas. La disponibilidad depende de tu plan, del modelo y (en Team/Enterprise) de un interruptor del administrador. Si trabajas de verdad sin supervisión (cron, sesiones en la nube, CI), combínalo con [Hardening Autonomous Runs](/docs/security/hardening-autonomous-runs): auto sigue sin ser `bypassPermissions`.

<Callout type="warning" items={["bypassPermissions pertenece a un sandbox. Trabajar en tu máquina real con todas las confirmaciones desactivadas es como un agente acaba tocando algo que no debería. Resérvalo para entornos desechables; si lo que realmente quieres es menos confirmaciones, usa el modo auto. Consulta Hardening Autonomous Runs en /docs/security/hardening-autonomous-runs."]} />

## Una allowlist inicial sensata

El objetivo: preautorizar lo seguro y repetitivo; mantener lo destructivo en **ask** o **deny**.

<Steps items={[{title: "Permite lo seguro y repetitivo", body: "Leer archivos, ejecutar tus comandos de test/lint/build, git status/diff."}, {title: "Pregunta antes de lo de riesgo medio", body: "Instalar dependencias, escribir archivos fuera del proyecto, llamadas de red."}, {title: "Deniega lo destructivo", body: "Leer archivos secretos (.env, archivos de claves), force-push, rm -rf."}]} />

Guarda las reglas del proyecto en [`settings.json`](/docs/claude-code/settings) (compartido) y tus ajustes personales en `settings.local.json`.

<Callout type="tip" items={["Deja que aprenda de tus confirmaciones: aprueba el mismo comando seguro unas cuantas veces y sabrás exactamente qué añadir a tu allowlist, convirtiendo las confirmaciones repetidas en una regla de una sola vez."]} />

<Callout type="takeaways" items={["Tres veredictos: allow (sin confirmación), ask (por defecto: pausa y confirma), deny (nunca).", "Las reglas asocian una herramienta con un patrón, como Bash(npm run test:*) o Read(./.env).", "Seis modos fijan la postura de la sesión: default (Manual), acceptEdits, plan, auto, dontAsk, bypassPermissions.", "Desde la v2.1.283, auto es el modo de inicio de las sesiones interactivas en terminal y VS Code en todos los planes; un defaultMode que hayas definido tú se mantiene, y los valores predeterminados gestionados por la organización no se tocan.", "El modo auto filtra cada acción con un clasificador de seguridad en lugar de preguntarte: es la herramienta contra la fatiga de confirmaciones, no bypassPermissions.", "Construye una allowlist: allow para lo seguro y repetitivo, ask para el riesgo medio, deny para lo destructivo.", "Las reglas compartidas van en settings.json; los ajustes personales en settings.local.json."]} />

<Quiz title="Compruébalo tú mismo" questions={[{q: "¿Qué hace el veredicto predeterminado 'ask' ante una acción que no está permitida ni denegada de forma explícita?", options: ["La ejecuta en silencio", "Se detiene y te pide confirmación", "La bloquea de forma permanente"], answer: 1, explain: "ask es el comportamiento predeterminado para todo lo que no esté permitido o denegado de forma explícita: se detiene y te pregunta."}, {q: "¿Qué modo de permiso es seguro SOLO en sandboxes o contenedores, nunca en una máquina con secretos?", options: ["plan", "acceptEdits", "bypassPermissions"], answer: 2, explain: "bypassPermissions omite por completo las confirmaciones y las comprobaciones de seguridad; resérvalo para entornos desechables, nunca para una máquina con secretos."}, {q: "Quieres muchas menos confirmaciones de permiso en una tarea larga, pero sin perder una red de seguridad. ¿Qué modo?", options: ["bypassPermissions: se salta todas las confirmaciones", "auto: un clasificador filtra cada acción y bloquea las arriesgadas", "dontAsk: nunca te interrumpe"], answer: 1, explain: "El modo auto sustituye las confirmaciones por un clasificador que bloquea escaladas como curl | bash, force push y despliegues en producción. bypassPermissions elimina la red de seguridad; dontAsk simplemente deniega todo lo que no esté preaprobado."}, {q: "¿Dónde debes guardar las reglas de permiso compartidas del proyecto y dónde los ajustes personales?", options: ["Ambos en settings.local.json", "Las reglas del proyecto en settings.json; los ajustes personales en settings.local.json", "Las reglas del proyecto en settings.local.json; los ajustes personales en settings.json"], answer: 1, explain: "Las reglas del proyecto van en settings.json (compartido); los ajustes personales van en settings.local.json."}, {q: "¿Cuál de estos elementos pertenece a la lista 'deny' de una allowlist inicial sensata?", options: ["git status / diff", "rm -rf y leer .env", "Ejecutar tus comandos de test/lint/build"], answer: 1, explain: "Deniega lo destructivo: leer archivos secretos (.env, archivos de claves), force-push y rm -rf."}, {q: "El 14 de agosto de 2026, ¿qué ocurre en un plan Pro si ya habías definido permissions.defaultMode como 'default' en tu configuración de usuario?", options: ["Se sobrescribe automáticamente con 'auto'", "Se mantiene 'default' a menos que aceptes un aviso único de cambio en la aplicación", "El modo auto se aplica igualmente en silencio a cada sesión nueva"], answer: 1, explain: "Un defaultMode que definiste tú en la configuración de usuario se conserva; Claude Code ofrece un aviso único de cambio pero no sobrescribe tu elección. Los valores predeterminados gestionados por la organización tampoco se tocan."}]} />

## Siguiente

- [settings.json: el sistema de configuración](/docs/claude-code/settings)
- [Hooks](/docs/claude-code/hooks): aplica reglas de forma determinista, más allá de allow/deny
- [Sandbox Credential Masking](/docs/claude-code/sandbox-credential-masking): deja que `gh`, `npm` y `aws` se autentiquen sin que el comando en el sandbox llegue a tener el secreto real
- [Seguridad y uso responsable](/docs/security/responsible-use)
