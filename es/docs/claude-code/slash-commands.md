# Comandos slash personalizados

> Source: https://derob98.github.io/ailmanac/es/docs/claude-code/slash-commands · AILmanac (CC BY 4.0) · last verified 2026-11-11

Convierte un flujo de trabajo repetible en una sola palabra.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-11" source="https://code.claude.com/docs/en/skills">
Las ubicaciones de los archivos de comandos y las opciones del frontmatter pueden cambiar: confírmalas en la documentación oficial de skills (los comandos personalizados ahora viven allí).
</VerifyNote>

Un comando slash personalizado empaqueta un prompt que sigues reescribiendo en un único `/palabra`. Defínelo una vez y reutilízalo para siempre (y compártelo con tu equipo).

<Callout type="info" items={["Los comandos personalizados se han fusionado con los Skills. Un archivo en .claude/commands/deploy.md y un skill en .claude/skills/deploy/SKILL.md crean ambos /deploy y funcionan igual: tus archivos existentes de .claude/commands/ siguen funcionando. Los Skills añaden un directorio para archivos de apoyo, frontmatter para controlar la invocación y carga automática cuando son relevantes. Para cualquier cosa más allá de un prompt de un solo archivo, prefiere un Skill."]} />

<Callout type="objectives" items={["Explicar qué es un comando slash personalizado y por qué es mejor que reescribir un prompt", "Crear un comando colocando un archivo Markdown en el directorio correcto", "Distinguir los comandos de proyecto de los personales por su ubicación", "Usar los bloques de construcción: $ARGUMENTS, salida de bash incrustada, referencias a archivos y frontmatter", "Elegir entre un comando slash, un skill y un subagente para una tarea dada"]} />

## Cómo funcionan

Un comando es simplemente un archivo Markdown. Colócalo en tu directorio de comandos y su nombre de archivo se convierte en el comando. El cuerpo del archivo es el prompt que Claude ejecuta cuando lo invocas.

La *ubicación* del archivo decide su alcance:

<Steps items={[{title: "Comando de proyecto (compartible)", body: "Guárdalo en .claude/commands/changelog.md → /changelog. Vive en el repositorio, así que todo el equipo lo recibe."}, {title: "Comando personal (todos los proyectos)", body: "Guárdalo en ~/.claude/commands/changelog.md → /changelog. Te acompaña en todos los proyectos de tu máquina."}, {title: "Invócalo", body: "Escribe /palabra en Claude Code. El cuerpo del archivo se convierte en el prompt que ejecuta Claude."}]} />

<Callout type="tip" items={["El nombre de archivo, no el frontmatter, se convierte en el nombre del comando: changelog.md es /changelog. Un archivo de comando acepta el mismo frontmatter que un skill salvo name y paths, así que no puedes renombrar un comando desde dentro del archivo.", "Un subdirectorio añade un espacio de nombres con dos puntos: .claude/commands/frontend/component.md es /frontend:component, no /component."]} />

## Un ejemplo mínimo

Aquí tienes un archivo de comando completo. El frontmatter contiene la `description`; todo lo que hay debajo es el prompt.

<PromptCard title="commit.md — redacta un Conventional Commit">{`---
description: Draft a Conventional Commit message from the staged diff
---

Look at the staged changes with \`git diff --cached\` and write a single
Conventional Commit message (feat/fix/docs/refactor/chore). Output only the
message, no preamble.`}</PromptCard>

Guárdalo como `commit.md` y `/commit` lo hará cada vez. (El nombre es el del archivo: el mismo cuerpo guardado como `changelog.md` sería `/changelog`.)

## Los bloques de construcción útiles

Cuatro ingredientes convierten un prompt estático en un comando flexible:

| Bloque de construcción | Qué hace |
| --- | --- |
| **`$ARGUMENTS`** | Inyecta todo lo que el usuario escribió después del comando. `/review src/auth.ts` → la ruta aparece en tu prompt. |
| **`$ARGUMENTS[N]` / `$N`** | Un argumento por índice **basado en 0**. `$ARGUMENTS[0]`, abreviado `$0`, es el *primer* argumento, así que `$1` es el **segundo**, no el primero como en un script de shell. |
| **Ejecutar bash e incrustar la salida** | Los comandos pueden incluir salida de shell (p. ej., el diff actual) para que Claude actúe sobre el estado en vivo. |
| **Referenciar archivos** | Apunta a archivos para incluir su contenido. |
| **Frontmatter** | `description` (se muestra en el menú), `argument-hint`, `allowed-tools`, `disallowed-tools`, `disable-model-invocation`. |

Consulta la [documentación oficial](https://code.claude.com/docs/en/skills) para la sintaxis exacta de argumentos, bash y referencias a archivos.

## Comandos que vale la pena robar

Hay un conjunto inicial en nuestra [Biblioteca de comandos slash](/docs/templates/slash-commands): mensaje de commit, descripción de PR, revisión de código, changelog, scaffold de un componente.

## Comando frente a skill frente a subagente

Tres formas de empaquetar trabajo: la diferencia está en *quién lo activa* y *cuán aislado se ejecuta*:

- **Comando slash**: *tú* activas un flujo de trabajo conocido bajo demanda.
- **[Skill](/docs/claude-code/skills)**: Claude carga la experiencia *automáticamente* cuando es relevante.
- **[Subagente](/docs/claude-code/subagents)**: delega una parte del trabajo a un agente aislado.

<Flashcards cards={[{front: "Comando slash", back: "Tú activas un flujo de trabajo conocido bajo demanda escribiendo /palabra."}, {front: "Skill", back: "Claude carga la experiencia automáticamente cuando es relevante: tú no lo invocas."}, {front: "Subagente", back: "Delega una parte del trabajo a un agente aislado."}, {front: ".claude/commands/x.md", back: "Comando de proyecto /x: vive en el repositorio y se puede compartir con el equipo."}, {front: "~/.claude/commands/x.md", back: "Comando personal /x: te acompaña en todos los proyectos."}, {front: "$ARGUMENTS", back: "Inyecta en el prompt lo que el usuario escribió después del comando."}]} />

<Quiz title="Compruébalo tú mismo" questions={[{q: "¿Dónde guardas un comando slash para que todo tu equipo lo reciba en el repositorio?", options: [".claude/commands/", "~/.claude/commands/", "En cualquier parte de la raíz del repositorio"], answer: 0, explain: ".claude/commands/changelog.md → /changelog es un comando de proyecto: vive en el repositorio y es compartible. La ruta ~/.claude/ es personal, para todos tus proyectos."}, {q: "¿Qué determina el nombre de un comando slash?", options: ["La description del frontmatter", "El nombre del archivo Markdown y el subdirectorio donde está", "El primer encabezado del cuerpo"], answer: 1, explain: "El nombre del archivo se convierte en el comando: changelog.md → /changelog. Un archivo de comando no puede renombrarse a sí mismo: acepta el mismo frontmatter que un skill salvo name y paths. Un subdirectorio antepone un prefijo con dos puntos al nombre, así que commands/frontend/component.md es /frontend:component."}, {q: "¿Qué hace $ARGUMENTS en un comando?", options: ["Lista todos los comandos disponibles", "Inyecta en el prompt lo que el usuario escribió después del comando", "Ejecuta un script de bash"], answer: 1, explain: "$ARGUMENTS inyecta lo que el usuario escribió después del comando; por ejemplo, /review src/auth.ts coloca la ruta en tu prompt."}, {q: "¿Qué opción de empaquetado carga Claude automáticamente cuando es relevante, en lugar de que la actives tú?", options: ["Comando slash", "Skill", "Subagente"], answer: 1, explain: "Un skill carga experiencia automáticamente cuando es relevante. Un comando slash lo activas tú bajo demanda; un subagente delega el trabajo a un agente aislado."}]} />

## Siguiente

- [Skills: Experiencia bajo demanda](/docs/claude-code/skills)
- [Hooks: Automatización determinista](/docs/claude-code/hooks)
- [Biblioteca de comandos slash](/docs/templates/slash-commands)
