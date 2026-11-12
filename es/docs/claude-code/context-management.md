# Gestión del contexto

> Source: https://derob98.github.io/ailmanac/es/docs/claude-code/context-management · AILmanac (CC BY 4.0) · last verified 2026-11-08

/compact frente a /clear, compactación automática y cómo mantener la eficacia a medida que crecen las sesiones.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["Distinguir /clear de /compact y elegir al instante el correcto", "Dirigir una compactación en lugar de dejar que adivine, y ajustar cuándo se dispara la automática", "Saber exactamente qué sobrevive a la compactación y qué se resume y se pierde", "Aplicar cuatro técnicas para mantener afiladas las sesiones largas", "Reconocer los síntomas de una ventana de contexto llena y solucionarlos rápido"]} />

<VerifyNote lastVerified="2026-11-08" source="https://code.claude.com/docs/en/context-window">
Los nombres de los comandos, la ventana de compactación automática y la tabla de lo que sobrevive a la compactación cambian entre versiones — confírmalo en la documentación oficial.
</VerifyNote>

## La idea central

Cada sesión tiene una [ventana de contexto](/docs/foundations/tokens-and-context) finita. A medida que se llena, el contenido más antiguo se comprime y Claude puede empezar a «desviarse». Gestionar el contexto de forma deliberada es lo que mantiene afiladas las sesiones largas.

## Los dos comandos esenciales

Dos comandos cubren casi todas las situaciones. El truco es hacer coincidir el comando con tu intención.

<Flashcards cards={[{front: "/clear", back: "Borra la conversación y empieza de cero. Úsalo cuando cambies a una tarea SIN RELACIÓN. La forma más barata de recuperar un contexto limpio y enfocado. Alias: /reset y /new."}, {front: "/compact", back: "Resume la conversación hasta ahora en una forma compacta — conserva lo esencial y libera espacio. Úsalo cuando quieras CONTINUAR la misma tarea pero la ventana se está llenando. Acepta instrucciones de enfoque opcionales."}]} />

Decide con una sola pregunta: ¿es una tarea nueva o la misma?

```mermaid
flowchart TD
  A{New task or same task?} -->|New / unrelated| B[/clear]
  A -->|Same task, context full| C[/compact]
```

Dos detalles fáciles de pasar por alto:

- **`/compact` acepta instrucciones.** `/compact focus on the auth bug fix` conserva lo que *tú* eliges en lugar de lo que la pasada automática supone importante. Ejecútalo deliberadamente antes de empezar una tarea nueva y larga, en vez de esperar a que la ventana te obligue.
- **`/clear` no es un punto sin retorno.** Pasa un nombre (`/clear auth refactor`) para etiquetar la conversación saliente en el selector de `/resume`, y dentro del mismo proceso de Claude Code el menú de rewind todavía ofrece una entrada `/resume <session-id> (previous session)` — consulta [Checkpoints y Rewind](/docs/claude-code/checkpoints-and-rewind).

## Compactación automática — y cómo moverla

Cuando el contexto se acerca al límite, Claude Code **compacta automáticamente** para que el trabajo continúe sin una parada brusca. En los modelos con ventana de contexto de 1M ocurre por defecto en torno a 967K tokens; los modelos anteriores compactan en el límite de su ventana de contexto. Claude Code también puede compactar una conversación que dejes inactiva.

El umbral lo puedes mover tú. `/autocompact 500k` compacta antes — útil cuando prefieres resumir a tu manera en lugar de al 96 % de llenado — y `/autocompact auto` vuelve a la ventana ajustada para tu modelo.

<PromptCard title="Compactar antes que por defecto">{`/autocompact 500k`}</PromptCard>

<Steps items={[{title: "Valores aceptados", body: "Un número bruto de tokens (500000), uno con sufijo (500k, 1m), auto para volver a la ventana ajustada del modelo, u off para desactivar la compactación automática durante la sesión. Ejecuta /autocompact sin argumento para ver la ventana actual."}, {title: "Dónde se puede configurar", body: "El comando /autocompact guarda en tus ajustes de usuario, bajo el modelo actual en modelSettings. También puedes definir autoCompactWindow en el nivel superior de tu JSON de ajustes o por modelo bajo modelSettings, o usar la variable de entorno CLAUDE_CODE_AUTO_COMPACT_WINDOW."}, {title: "Precedencia, de mayor a menor", body: "CLAUDE_CODE_AUTO_COMPACT_WINDOW, luego autoCompactWindow por modelo en modelSettings, luego autoCompactWindow de nivel superior, luego la ventana por defecto del modelo. Si un ámbito de ajustes de mayor prioridad, como los ajustes administrados, define la ventana, /autocompact guarda tu valor pero la sesión mantiene el de ese ámbito — y te lo indica."}]} />

<Callout type="tip" items={["Trata la compactación automática como una red de seguridad, no como una estrategia. Limpiar entre tareas sin relación mantiene el contexto más limpio que dejar que la ventana se llene hasta que se dispare la compactación automática.", "Cuando compactes, hazlo a propósito: /compact con instrucciones de enfoque supera a una pasada automática que adivina qué importaba."]} />

## Qué sobrevive a la compactación

La compactación resume la *conversación*. Todo lo que tu configuración carga desde el disco se gestiona por separado — por eso una sesión compactada sigue conociendo las convenciones de tu proyecto.

<Steps items={[{title: "Reinyectado desde el disco", body: "El system prompt y el estilo de salida siguen aplicándose; vuelven el CLAUDE.md de la raíz del proyecto, las reglas sin ámbito, la memoria automática y el plan que Claude escribió en plan mode. Las descripciones de las skills se reconstruyen a partir de tus skills actuales (Claude Code v2.1.304 o posterior). Si la sesión empezó con una instantánea de git status, Claude Code lee una nueva."}, {title: "Recargado bajo demanda", body: "Las reglas con frontmatter paths: y los archivos CLAUDE.md anidados en subdirectorios se resumen y se pierden, y solo se recargan cuando Claude toca de nuevo un archivo que coincida. Si una regla debe persistir tras la compactación, elimina el frontmatter paths: o muévela al CLAUDE.md de la raíz del proyecto."}, {title: "Restaurado parcialmente", body: "Claude Code vuelve a leer hasta cinco de los archivos que Claude leyó o editó, empezando por los modificados más recientemente — pero un archivo de más de 5.000 tokens vuelve como una referencia de ruta ('Referenced file') sin su contenido. Los cuerpos de las skills invocadas se reinyectan con un tope de 5.000 tokens por skill y 25.000 en total, descartando primero las más antiguas y conservando el inicio del archivo: pon lo importante al principio de SKILL.md."}, {title: "Resumido y perdido", body: "La conversación en sí, incluido el contexto que los hooks añadieron antes. Los hooks SessionStart que coinciden con la fuente 'compact' se ejecutan de nuevo y su salida se une al contexto compactado — es el hook que debes usar para todo lo que deba volver."}, {title: "Intacto", body: "Los comandos en segundo plano y los subagentes en segundo plano siguen ejecutándose, y Claude Code recuerda a Claude cuáles siguen activos para que no lance un duplicado."}]} />

## Técnicas para mantener la eficacia

Además de los dos comandos, cuatro hábitos mantienen ligero tu contexto desde el principio.

<Steps items={[{title: "Una tarea por sesión", body: "No dejes que una tarde de trabajo sin relación se acumule en un solo contexto."}, {title: "Delega las lecturas pesadas en subagentes", body: "Entrega las lecturas grandes a subagentes — consumen SU contexto y devuelven solo la conclusión. Consulta /docs/claude-code/subagents."}, {title: "Referencia, no pegues", body: "Señala los archivos a Claude con @path en lugar de pegar bloques grandes, y mantén CLAUDE.md ligero (consulta /docs/claude-code/claude-md)."}, {title: "Vigila el presupuesto", body: "Ejecuta /context para ver un desglose en vivo por categoría — una cuadrícula de colores más sugerencias de optimización para herramientas que cargan mucho el contexto y para memoria inflada, incluidos los archivos CLAUDE.md y de memoria automática que se cargaron. Pasa 'all' para expandir la lista por elemento en modo pantalla completa. Una statusline que muestre el uso del contexto te da la misma señal de forma pasiva. Consulta /docs/claude-code/statusline."}]} />

<PromptCard title="Ver adónde fue realmente tu contexto">{`/context`}</PromptCard>

Estos enlazan con la documentación al día: [subagentes](/docs/claude-code/subagents), [CLAUDE.md](/docs/claude-code/claude-md) y [statusline](/docs/claude-code/statusline).

:::tip[Síntoma → solución]
Si Claude empieza a olvidar una instrucción anterior o a repetirse, es probable que la ventana esté llena. `/compact` (misma tarea) o `/clear` (tarea nueva) suele arreglarlo al instante. Ejecuta `/context` para confirmarlo — cuando la conversación ha superado de verdad la ventana, su salida indica por cuánto te has pasado y qué comando libera espacio. Más en [¿Por qué hizo eso Claude?](/docs/contribute/troubleshooting).

Si en cambio te aparece `Autocompact is thrashing`, la compactación funciona pero algo sobredimensionado vuelve a llenar la ventana una y otra vez — consulta [Solución de problemas de Claude Code](/docs/claude-code/troubleshooting).
:::

<Callout type="takeaways" items={["/clear borra la conversación para empezar de cero — úsalo en tareas sin relación (alias: /reset, /new)", "/compact resume la sesión para liberar espacio — úsalo para continuar la misma tarea cuando la ventana se llena, y pasa instrucciones de enfoque para que conserve lo que te importa", "La compactación automática es una red de seguridad, no una estrategia: se dispara en torno a 967K tokens en los modelos de contexto 1M, y /autocompact 500k (o auto, o off) mueve esa línea", "La compactación resume la conversación pero reinyecta desde el disco CLAUDE.md, las reglas sin ámbito, la memoria automática y el plan; las reglas con ámbito de ruta, los CLAUDE.md anidados y el contenido de archivos grandes no vuelven intactos", "Mantén el contexto ligero: una tarea por sesión, delega las lecturas pesadas en subagentes, referencia archivos en lugar de pegarlos y revisa /context o una statusline", "Olvidos o repeticiones indican una ventana llena — /compact (misma tarea) o /clear (tarea nueva) lo arregla"]} />

<Quiz title="Ponte a prueba" questions={[{q: "Terminas una tarea y pasas a algo completamente distinto. ¿Qué comando?", options: ["/compact — para resumir el trabajo anterior", "/clear — para borrar la conversación y empezar de cero", "Ninguno — que lo gestione la compactación automática"], answer: 1, explain: "/clear borra la conversación y empieza de cero. Es la forma más barata de recuperar un contexto limpio y enfocado cuando cambias a una tarea sin relación."}, {q: "Estás a mitad de una tarea y la ventana de contexto se está llenando, pero quieres seguir con el mismo trabajo. ¿Qué comando?", options: ["/clear — para liberar el máximo espacio", "/compact — para resumir la conversación conservando lo esencial", "Abrir una terminal nueva"], answer: 1, explain: "/compact resume la conversación hasta ahora en una forma compacta, conservando lo esencial y liberando espacio — ideal para continuar la misma tarea."}, {q: "¿Cuál es la forma correcta de pensar en la compactación automática?", options: ["La estrategia principal para gestionar el contexto", "Una red de seguridad cuyo umbral puedes mover — un /clear proactivo y un /compact deliberado dan mejores resultados", "Un bug que deberías desactivar"], answer: 1, explain: "La compactación automática permite que el trabajo continúe sin una parada brusca cuando el contexto se acerca al límite — en torno a 967K tokens por defecto en los modelos de contexto 1M. Es una red de seguridad: limpiar entre tareas sin relación y compactar a propósito con instrucciones de enfoque superan ambos a confiar en ella. También puedes mover la línea con /autocompact 500k, o desactivarla para la sesión con /autocompact off."}, {q: "Guardas una regla en un archivo con frontmatter `paths:`. La sesión se compacta. ¿Sigue aplicándose la regla?", options: ["Sí — las reglas siempre se reinyectan desde el disco tras la compactación", "No de inmediato — solo se recarga cuando Claude toca de nuevo un archivo que coincida", "No — desaparece durante el resto de la sesión"], answer: 1, explain: "Las reglas con ámbito de ruta se cargan en el historial de mensajes cuando Claude lee o edita su archivo disparador, así que la compactación las resume junto con la conversación. Se recargan bajo demanda la próxima vez que se toque un archivo que coincida. Solo el CLAUDE.md de la raíz del proyecto y las reglas sin ámbito se reinyectan incondicionalmente desde el disco — así que si una regla debe sobrevivir a cada compactación, elimina el frontmatter paths: o muévela allí."}, {q: "Claude empieza a olvidar una instrucción anterior o a repetirse. ¿Cuál es la causa probable y la solución?", options: ["Un problema de red — reinicia tu máquina", "Probablemente la ventana está llena — /compact (misma tarea) o /clear (tarea nueva)", "El modelo está roto — cambia de modelo"], answer: 1, explain: "Olvidar o repetirse suele significar que la ventana está llena. /compact (misma tarea) o /clear (tarea nueva) normalmente lo arregla al instante."}]} />

## Siguiente

- [Auditoría del presupuesto de contexto](/docs/claude-code/context-budget-audit) — la lista de comprobación de una vez por proyecto: `/skill-doctor`, topes de salida, `omitClaudeMd`, la ventana de compactación automática
- [Checkpoints y Rewind](/docs/claude-code/checkpoints-and-rewind) — `/rewind` para deshacer ediciones o comprimir el contexto desde cualquier punto
- [Tokens, contexto y memoria](/docs/foundations/tokens-and-context)
- [Subagentes y agentes paralelos](/docs/claude-code/subagents)
- [Personalización de la statusline](/docs/claude-code/statusline)
