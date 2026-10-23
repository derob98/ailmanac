# Claude Fable 5.1: qué cambió y cómo migrar

> Source: https://derob98.github.io/ailmanac/es/docs/models/fable-5-1-field-guide · AILmanac (CC BY 4.0) · last verified 2026-10-21

Anthropic lanzó Claude Fable 5.1 y Mythos 5.1 el 1 de septiembre de 2026: mismo precio de $10/$50, lecturas de caché rebajadas a $0,25, tres cambios incompatibles en la API (error con tool_choice forzado, bloques de thinking unidireccionales, historial de solo adición) y cinco betas aditivas. La guía de migración para quien tenga fijado claude-fable-5 o claude-opus-5.

<LevelBadge level="intermediate" />

El **1 de septiembre de 2026**, Anthropic lanzó **Claude Fable 5.1** (`claude-fable-5-1`) y su gemelo con acceso condicionado a verificación, **Claude Mythos 5.1** (`claude-mythos-5-1`). Si hojeas el lanzamiento, lo archivarás como "Fable, pero mejor" y seguirás adelante. No lo hagas. Es la primera versión intermedia de Claude en la que un simple cambio del ID del modelo puede **devolver 400 en producción**: el `tool_choice` forzado ha desaparecido, los bloques de thinking ahora quedan ligados al modelo y a la conversación que los produjo, y editar el historial de la conversación se aplica como error en las cuentas nuevas. También es la primera versión en la que la línea *más barata* de la tabla de precios es la interesante: las lecturas de caché bajaron de $1 a **$0,25 por MTok**, razón por la que Anthropic puede afirmar que las cargas de trabajo típicas cuestan un 25 % menos y las muy agénticas hasta un 45 % menos, con un precio de lista sin cambios de $10 / $50.

Esta página es la guía de migración: qué cambió, qué se rompe, qué ganas y una lista de comprobación que puedes completar en una tarde.

<Callout type="objectives" items={[
  "Conocer los tres cambios incompatibles que convierten el cambio de claude-fable-5 a claude-fable-5-1 en un 400, y la solución de cada uno",
  "Usar las cinco funciones aditivas: effort por mensaje, mensajes de sistema de alcance de turno, actualizaciones de progreso, lecturas de caché más baratas y procedencia del contenido",
  "Reconocer los siete cambios de comportamiento que aparecen sin tocar el código (menos llamadas paralelas a herramientas, menos narración, prosa más densa, reescrituras de archivos completos)",
  "Leer los benchmarks del lanzamiento frente a Fable 5, Opus 5 y GPT-5.6 Sol sin que te vendan nada",
  "Decidir entre Fable 5.1, Opus 5 y Fable 5 para tu carga de trabajo y luego ejecutar la lista de comprobación de migración",
]} />

<VerifyNote lastVerified="2026-09-14" source="https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1">
Los IDs de modelo, precios, cambios incompatibles, cabeceras beta y notas de comportamiento proceden del documento oficial de Anthropic "What's new in Claude Fable 5.1", de la [descripción general del modelo](https://platform.claude.com/docs/en/models/fable-5-1/overview), de la [guía de migración](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide) y de la [página de precios](https://platform.claude.com/docs/en/about-claude/pricing), todos leídos el 14 de septiembre de 2026. Las cifras de benchmarks son las propias de Anthropic, tomadas del [anuncio del lanzamiento](https://www.anthropic.com/claude-fable-and-mythos-5-1). Las tres betas que se nombran aquí pueden cambiar de forma; vuelve a comprobar las cabeceras antes de publicar. Para la tabla de modelos vigente, consulta [Modelos y precios actuales](/docs/whats-new/models-and-pricing).
</VerifyNote>

## La versión en un párrafo

Fable 5.1 es el sucesor de [Fable 5](/docs/models/fable-5-mythos-5-flagship): mismo nivel de clase Mythos por encima de Opus, misma ventana de contexto de 1M de tokens, mismo máximo de salida de 128K, mismos $10 de entrada / $50 de salida, mismo tokenizador, mismo thinking adaptativo siempre activo, mismo comportamiento `stop_reason: "refusal"` dentro de la respuesta y mismo requisito de retención de 30 días (sin ZDR). La orientación de Anthropic sigue igual en espíritu: **empieza con Opus 5** para la mayoría del trabajo y recurre a Fable 5.1 "para razonamiento exigente y trabajo agéntico de largo horizonte, o cuando tus evaluaciones con Claude Opus 5 a mayor effort sigan quedándose cortas". Lo nuevo: tres cambios incompatibles, cinco funciones aditivas, una lectura de caché un 75 % más barata y un conjunto de cambios de comportamiento que conviene conocer antes de que te los muestre tu suite de evaluación.

## Tres cambios incompatibles

Son las razones por las que no basta con cambiar el ID. Cada uno es un 400, no una degradación silenciosa.

### 1. El uso forzado de herramientas devuelve un error

`tool_choice: {"type": "any"}` y `{"type": "tool", "name": "..."}` ahora devuelven un 400 `invalid_request_error`:

```text
tool_choice: type "tool" and "any" are not supported for this model.
```

La razón es instructiva: el thinking está siempre activo y una llamada forzada a una herramienta se lo saltaría, de modo que el modelo haría su razonamiento dentro de los argumentos de la herramienta y la calidad de los argumentos bajaría. La comprobación se aplica en la Messages API, la Message Batches API y el endpoint de conteo de tokens. `auto` (el valor por defecto) y `none` no cambian.

**La solución** son dos líneas: deja `tool_choice` en `auto`, pon `strict: true` en la herramienta con `additionalProperties: false` en el esquema, y *di* en el prompt cuándo se aplica la herramienta. La nota de Anthropic es que Fable 5.1 "sigue de forma fiable las instrucciones explícitas sobre herramientas". Si lo que querías en realidad era JSON válido según un esquema y no una llamada a herramienta, pasa a las [salidas estructuradas](/docs/api/structured-output).

<PromptCard title="Llamada forzada a herramienta → herramienta strict + instrucción explícita">
{`# Before (Fable 5) — now a 400 on Fable 5.1
"tool_choice": {"type": "tool", "name": "record_summary"}

# After (Fable 5.1)
"tools": [{
  "name": "record_summary",
  "description": "Record the structured summary of the document.",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {"summary": {"type": "string"}},
    "required": ["summary"],
    "additionalProperties": false
  }
}],
"tool_choice": {"type": "auto"},
"messages": [{"role": "user",
  "content": "Summarize: The meeting moved to Thursday. Call the record_summary tool with your result."}]`}
</PromptCard>

### 2. Los bloques de thinking son unidireccionales

Cada bloque de thinking ahora registra qué modelo lo produjo, y la conservación va en un solo sentido: **Fable 5.1 puede leer los bloques de thinking de Opus 5, Fable 5, Mythos 5 y todos los Claude anteriores; ninguno de ellos puede leer los de Fable 5.1.** Una conversación que pasa *a* Fable 5.1 conserva su razonamiento. Una conversación que sale *de* ella (un router, un fallback a Opus 5, una rebaja de modelo para ahorrar costes a mitad de sesión) pierde el razonamiento de los turnos de Fable 5.1.

La API lo gestiona **descartando** los bloques que el modelo de destino no puede leer antes de que los vea. Los bloques descartados no se facturan ni cuentan en `input_tokens`. Sin la cabecera beta `thinking-binding-controls-2026-08-01`, el descarte es **silencioso**; con ella, se informa en un array de nivel superior `input_transformations`. Si enrutas entre modelos, envía la cabecera y registra ese array. La pérdida silenciosa de razonamiento es justo lo que luego aparece en un informe de bug como "el modelo se volvió más tonto después del paso 12".

### 3. Editar turnos anteriores invalida los bloques de thinking

Este hay que leerlo dos veces. Modificar **cualquier cosa** anterior a un bloque de thinking de Fable 5.1, es decir, el prompt `system`, el array `tools` o cualquier mensaje previo, invalida todos los bloques de thinking posteriores. Donde se aplica la comprobación, la siguiente petición se rechaza con un 400 cuyo mensaje dice `The block is bound to a different conversation`.

Reglas de aplicación a día de hoy:

- **Cuentas creadas el 31 de agosto de 2026 o después:** se aplica.
- **Cuentas anteriores:** la API registra la discrepancia, pero solo actúa si tú configuras `thinking.block_binding.prefix_mismatch_behavior`.
- **Mythos 5.1** no ejecuta esta comprobación en absoluto.
- Claude Code, claude.ai, Managed Agents y el Agent SDK mantienen el prefijo intacto por ti. **Solo corren riesgo los arrays `messages` construidos a mano.**

La lista de Anthropic de lo que invalida bloques, parafraseada, es una lista de hábitos comunes en los arneses de agentes:

| Invalida todos los bloques de thinking posteriores | Los mantiene válidos |
| --- | --- |
| Editar, reordenar o eliminar un turno anterior conservando los posteriores | Eliminar una serie inicial de bloques de thinking, empezando por los más antiguos |
| Inyectar un recordatorio o una línea de estado por petición en un turno anterior y quitarlo en la siguiente petición | La compactación del lado del servidor o la [edición de contexto](/docs/api/memory-and-context-editing) que recorta el historial |
| Reconstruir el `system` o los `tools` de nivel superior entre peticiones de una misma conversación | Mover marcadores `cache_control` |
| Una URL de imagen o documento que más tarde sirve *bytes distintos* (la comprobación es sobre bytes, así que una URL firmada rotatoria para el mismo archivo no da problema) | Cambiar `effort` entre peticiones |

Todas las soluciones se reducen a una regla: **trata la conversación como de solo adición.** Los recordatorios por turno pasan a ser [mensajes de sistema de alcance de turno](#mensajes-de-sistema-de-alcance-de-turno-beta) (más abajo). Los cambios de herramientas e instrucciones pasan a ser [mensajes de sistema a mitad de conversación y cambios de herramientas](/docs/api/mid-conversation-system-messages). El recorte pasa a ser compactación del lado del servidor. Para continuar en lugar de dar error, envía la cabecera `thinking-binding-controls-2026-08-01` con `prefix_mismatch_behavior: "drop_block"`; el descarte se informa entonces en `input_transformations` con `reason: "prefix_binding_mismatch"`.

Anthropic lo presenta en parte como una medida **antidestilación**: la publicación del lanzamiento dice que las cuentas nuevas de la API ya no pueden editar manualmente el contexto previo conservando la transcripción, lo que cierra una técnica de destilación documentada públicamente. La ventaja práctica para ti es que la misma disciplina también mantiene caliente la [caché de prompts](/docs/api/prompt-caching).

## Cinco funciones aditivas

### Effort por mensaje (beta)

Ahora puedes cambiar `effort` a mitad de conversación **sin invalidar la caché de prompts**. Súbelo para el paso difícil, bájalo para los rutinarios. Envía la cabecera beta `mid-conversation-output-config-2026-07-01` e inserta un mensaje de sistema solo con effort; el nuevo nivel se aplica desde el siguiente turno del usuario. Compatible con Fable 5.1, Mythos 5.1 y Opus 5 en la Claude API y en Google Cloud.

<PromptCard title="Bajar el effort en un turno de resumen sin romper la caché">
{`{
  "model": "claude-fable-5-1",
  "max_tokens": 4096,
  "output_config": {"effort": "high"},
  "messages": [
    {"role": "user", "content": "Plan a migration from SQLite to PostgreSQL in three short steps."},
    {"role": "assistant", "content": "1. Export the SQLite data. 2. Create the PostgreSQL schema. 3. Import the data and verify row counts."},
    {"role": "system", "content": [], "output_config": {"effort": "low"}},
    {"role": "user", "content": "Summarize the plan in one sentence."}
  ]
}
# header: anthropic-beta: mid-conversation-output-config-2026-07-01`}
</PromptCard>

Esto se combina con la guía de effort de [Thinking y effort](/docs/api/thinking-and-effort) y [Ajuste del effort](/docs/api/effort-tuning): el valor por defecto es `high`, y "un solo nivel para toda la sesión" pasa a ser la opción perezosa, no la única.

### Mensajes de sistema de alcance de turno (beta)

Pon `clear_at: "next_user_message"` en un mensaje con `role: "system"` y tendrá autoridad de prompt de sistema solo durante el turno actual, y dejará de renderizarse en cuanto exista un mensaje `user` posterior. Sigues reenviándolo tal cual, así que nada anterior cambia, la caché sigue coincidiendo, los bloques de thinking posteriores siguen siendo válidos y un mensaje ya borrado **no cuesta tokens de entrada**. Cabecera: `mid-conversation-system-clear-at-2026-08-21`.

```json
{
  "role": "system",
  "clear_at": "next_user_message",
  "content": "Results have landed in your inbox. Check it before running more code."
}
```

Es el sustituto autorizado del patrón "inyectar un recordatorio y borrarlo en la siguiente petición" que el cambio incompatible 3 ahora castiga.

### Actualizaciones de progreso entre llamadas a herramientas (beta)

Fable 5.1, como Fable 5, escribe breves notas de progreso entre llamadas a herramientas, cada una como su propio bloque `thinking` justo antes de la llamada. Con el valor por defecto `thinking.display: "omitted"` esas notas llegan **vacías**, de modo que un turno agéntico largo parece silencioso para tus usuarios. Novedad: `display: "updates"` (cabecera `thinking-display-updates-2026-08-18`) devuelve las notas de progreso como texto mientras el razonamiento sigue oculto. Cualquier bloque de thinking con texto no vacío es entonces una línea de estado que puedes mostrar. `"summarized"` también las devuelve, mezcladas con el razonamiento resumido. La cadena de pensamiento en bruto sigue sin devolverse nunca.

### Lecturas de caché a $0,25 por MTok

| | Entrada base | Escritura de caché 5 min | Escritura de caché 1 h | **Lectura de caché** | Salida |
| --- | --- | --- | --- | --- | --- |
| Fable 5 | $10 | $12,50 | $20 | $1,00 | $50 |
| **Fable 5.1** | $10 | $12,50 | $20 | **$0,25** | $50 |

Las lecturas de caché cuestan 0,025× la entrada base en Fable 5.1 y Mythos 5.1, frente a 0,1× en todos los demás modelos de Claude. Las escrituras y el mínimo de 512 tokens de prompt cacheable no cambian; el batch sigue con un 50 % de descuento ($5 / $25). Para un bucle largo de agente que relee en cada turno un prefijo grande en caché, de aquí sale el "hasta un 45 % más barato" de la publicación del lanzamiento. Nota comparativa: GPT-6 Astra de OpenAI, lanzado tres días después con el mismo precio de lista de $10 / $50, cobra **$1,00** por las lecturas de caché, cuatro veces la tarifa de Fable 5.1; consulta la [guía de Astra](/docs/models/openai-astra-preview).

### Procedencia del contenido

Todo el texto de Fable 5.1 y Mythos 5.1 lleva la marca de agua estadística de texto de Anthropic en todas las plataformas. Los archivos que produce Claude (mediante ejecución de código, por ejemplo) llevan Content Credentials [C2PA](https://c2pa.org/) firmadas cuando se recuperan a través de la Files API. Anthropic afirma que la marca de agua no añade tokens ni caracteres ocultos, no contiene información sobre ti ni sobre tu organización y no requiere cambios en las peticiones. Contexto: Anthropic firmó en julio de 2026 el Código de Buenas Prácticas de la UE (EU AI Act) sobre transparencia del contenido generado por IA, y hay una API de detección en vista previa privada para reguladores, verificadores de datos, investigadores y empresas que necesitan verificación.

## Siete cambios de comportamiento que verás sin tocar el código

Anthropic los documenta abiertamente, y cada uno tiene una solución por prompt en la guía oficial [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1). Búscalos en tus evaluaciones antes de que los encuentren tus usuarios.

<Flashcards cards={[
  { front: "Las llamadas paralelas a herramientas son más variables", back: "Fable 5.1 puede emitir UNA sola llamada a herramienta por turno donde Fable 5 agrupaba varias, sobre todo en arneses de bash y editor y en uso del ordenador, donde las siguientes lecturas solo se sobreentienden. La calidad no cambia; suben los tokens, las idas y vueltas y el tiempo real. Solución: una línea en el prompt de sistema que diga 'agrupa las llamadas a herramientas independientes'." },
  { front: "Menos actualizaciones de progreso durante ejecuciones largas de herramientas", back: "Menos texto visible para el usuario entre llamadas a herramientas, y más aún con un effort alto. Solución: configura thinking.display en \"updates\" (beta), elimina cualquier línea del prompt que diga 'guarda los hallazgos para la respuesta final' y pide explícitamente una línea inicial, actualizaciones periódicas y un resumen final." },
  { front: "Responde de memoria con más frecuencia con effort bajo", back: "Con effort: low el modelo llama menos a las herramientas de búsqueda y recuperación. Solución: sube el effort en los turnos que necesiten datos recientes (el effort por mensaje lo hace barato) o añade una indicación de verificación." },
  { front: "Prosa más densa", back: "Frases más largas y menos saltos de párrafo en algunas salidas. Solución: indica explícitamente la densidad objetivo y la longitud de los párrafos." },
  { front: "Menos formato en el chat", back: "Usa negritas, encabezados y listas MENOS que los Claude anteriores. Las reglas contra el formato que escribiste para Opus 4.x ahora pueden suprimir la estructura que el contenido necesita. Revísalas y relájalas." },
  { front: "Citas sin marcar en los resúmenes", back: "Es más probable que reproduzca pasajes de la fuente sin marcarlos como citas. Solución: indícale que marque los fragmentos literales, o comprueba después la coincidencia en todo lo que publiques." },
  { front: "Reescrituras de archivos completos para ediciones pequeñas", back: "Es más probable que reescriba un archivo de texto entero en lugar de hacer una edición puntual. Mismo resultado, más tokens de salida y más tiempo. Solución: indica 'prefiere ediciones puntuales; nunca reescribas un archivo para cambiar una sola línea'." },
]} />

## Qué se mantiene exactamente igual que en Fable 5

Si ya conectaste bien Fable 5, todo esto se mantiene sin tocar:

- El thinking adaptativo está siempre activo. `thinking: {"type": "enabled"}` con `budget_tokens` y `{"type": "disabled"}` devuelven ambos 400. Omite `thinking` o envía `{"type": "adaptive"}`.
- `thinking.display` es `"omitted"` por defecto; la cadena de pensamiento en bruto no se devuelve nunca.
- El thinking intercalado es automático, sin cabecera beta.
- El prefill devuelve 400. Los valores no predeterminados de `temperature`, `top_p` y `top_k` devuelven 400.
- Las denegaciones llegan como HTTP 200 con `stop_reason: "refusal"` y un `stop_details.category`; no se te factura una denegación que llega antes de cualquier salida. Los destinos de fallback permitidos son **Opus 5 y Opus 4.8**, y el [crédito de fallback](/docs/api/server-side-fallbacks) te devuelve el coste de caché de prompts del cambio. El patrón completo está en [Denegaciones y seguridad](/docs/api/refusals-and-safety).
- La retención de 30 días es obligatoria; una petición de una organización o un workspace sin ella devuelve 400. Ambos modelos son Covered Models.
- Una divergencia que conviene conocer: **ni Fable 5.1 ni Mythos 5.1 son compatibles con Priority Tier.** Fable 5 sí. Si compraste capacidad prioritaria, es un motivo para quedarte por ahora en Fable 5.

## Los benchmarks del lanzamiento, leídos con honestidad

Números de Anthropic, arneses de Anthropic. Las comparaciones con GPT-5.6 Sol son las que OpenAI discutiría primero, y el propio GPT-6 Astra de OpenAI se lanzó tres días después, así que considera esto el estado de la cuestión el 1 de septiembre, no el 14.

| Benchmark | Fable 5.1 | Fable 5 | Opus 5 | GPT-5.6 Sol |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | **55,8 %** (Mythos 5.1: 60,9 %) | 42,0 % | 52,3 % | 37,3 % |
| Terminal-Bench-Science 0.1 | **52,6 %** | 24,7 % | 29,0 % | 22,4 % |
| GDPval-AA v2 (Elo) | **1853** | 1723 | 1824 | 1711 |
| OSWorld 2.0, partial / strict | **77,9 % / 41,7 %** | 72,9 % / 36,1 % | 75,4 % / 39,6 % | — |
| Humanity's Last Exam, sin herramientas / con herramientas | **60,9 % / 65,0 %** | 57,8 % / 63,8 % | 56,6 % / 63,6 % | — |
| AutomationBench | **31,4 %** | 17,1 % | 26,9 % | 19,6 % |
| CursorBench 3.2.0 | **73,4 %** | 70,5 % | 70,0 % | 67,2 % |

Tres lecturas que importan más que cualquier fila suelta:

1. **El salto de Fable 5 a 5.1 es mayor en el trabajo agéntico de largo horizonte** (Terminal-Bench-Science se duplicó, AutomationBench casi se duplicó). Es coherente con el posicionamiento de la propia Anthropic de "úsalo cuando Opus 5 con mayor effort siga quedándose corto": la mejora está en ejecuciones de horas, no en el chat.
2. **Opus 5 está más cerca de lo que sugiere el titular** en varias filas (Terminal-Bench 4.0: 52,3 frente a 55,8; GDPval: 1824 frente a 1853) a la mitad del precio de lista. Anthropic insiste en que empieces con Opus 5 por algo.
3. **Las citas de clientes hablan de tokens, no solo de precisión.** Cognition, Rogo, Browserbase y Block citan menos tokens para resultados iguales o mejores. Combinado con las lecturas de caché a $0,25, "Fable 5.1 es más barato que Fable 5 para el mismo trabajo" es una afirmación más defendible que "Fable 5.1 es más inteligente".

Los ejemplos científicos de la publicación del lanzamiento (aglutinantes de proteínas con una tasa de acierto de ~50 % en 12 dianas frente al 10–15 % habitual, un mapa de elevación de Venus con resolución de 2–3 km a partir de datos de radar de Magellan de hace 30 años, aceleraciones de 2,5× en siete modelos genómicos de código abierto) son resultados de investigación comunicados por Anthropic, no benchmarks. Una señal interesante para cargas de investigación, no un dato para decidir una compra.

## Fable 5.1 vs Opus 5 vs Fable 5: la decisión

| Tu situación | Elige | Por qué |
| --- | --- | --- |
| La mayor parte del trabajo de producción, sensible al coste | **Opus 5** | Recomendación por defecto de la propia Anthropic; la mitad del precio; lee los bloques de thinking de Fable 5.1 si alguna vez enrutas hacia arriba |
| Programación autónoma de horas, investigación o creación de documentos/hojas de cálculo/presentaciones donde Opus 5 con effort `high` sigue sin llegar | **Fable 5.1** | Las mayores diferencias están justo aquí; las lecturas de caché abaratan los bucles largos frente a Fable 5 |
| Dependes de Priority Tier | **Fable 5** (por ahora) | Fable 5.1 y Mythos 5.1 no están en Priority Tier |
| Fuerzas `tool_choice` y no puedes cambiar el arnés en este sprint | **Fable 5** | Fable 5.1 devuelve 400; migra primero el arnés y luego el modelo |
| Enrutas o haces fallback entre modelos a mitad de conversación | Cualquiera, pero **envía la cabecera de thinking-binding** | Si no, al bajar desde Fable 5.1 su razonamiento se descarta en silencio |
| La retención cero de datos es contractual | **Opus 5** | Fable 5.x y Mythos 5.x requieren retención de 30 días |
| Investigación en ciberdefensa o ciencias de la vida que necesita menos intervenciones del clasificador | **Mythos 5.1**, si tu organización está verificada | Mismo modelo, distinta configuración de salvaguardas; solicita el Cyber Verification Program (tres niveles) en lugar de esperar una invitación |

## Lista de comprobación de migración

Anthropic distribuye una skill incluida que hace la mayor parte de esto en Claude Code. Ejecútala primero y luego verifica lo que no puede ver.

<PromptCard title="Automatizar el cambio de ID y las correcciones de parámetros">
{`/claude-api migrate this project to claude-fable-5-1`}
</PromptCard>

<Steps items={[
  { title: "Cambia el ID y busca con grep el tool_choice forzado", body: "claude-fable-5 → claude-fable-5-1 (Bedrock: anthropic.claude-fable-5-1). Luego busca con grep tool_choice con type any o tool. Cada coincidencia pasa a ser strict: true + additionalProperties: false + una instrucción explícita 'llama a la herramienta X', o se traslada a salidas estructuradas. No olvides las llamadas de conteo de tokens: también validan." },
  { title: "Ejecuta la comprobación de edición del historial", body: "Si tu código construye el array messages por su cuenta, ejecuta una sesión real con la cabecera thinking-binding-controls-2026-08-01 y prefix_mismatch_behavior: \"drop_block\", y registra input_transformations. Cada entrada prefix_binding_mismatch es un lugar donde editas el historial. Arregla el origen: recordatorios por turno → mensajes de sistema de alcance de turno; cambios de system/tools → mensajes de sistema a mitad de conversación; recorte → compactación del lado del servidor. Luego elige a conciencia tu prefix_mismatch_behavior de producción." },
  { title: "Audita las rutas de enrutamiento y fallback", body: "En cualquier lugar donde una conversación pueda pasar de Fable 5.1 a Opus 5, Fable 5 o anteriores, decide si perder el razonamiento de Fable 5.1 es aceptable. Envía la cabecera de binding para que al menos se informe del descarte. Confirma que tu destino de fallback es Opus 5 u Opus 4.8 (los únicos permitidos)." },
  { title: "Reajusta el effort y valora el effort por mensaje", body: "El valor por defecto es high. Para bucles largos, añade la beta mid-conversation-output-config-2026-07-01 y baja el effort en los turnos rutinarios; súbelo en los turnos que necesiten recuperación de datos recientes, ya que con effort low el modelo responde de memoria con más frecuencia." },
  { title: "Añade las líneas de prompt para el bucle del agente", body: "Una línea que pida agrupar las llamadas a herramientas independientes; una que pida una línea inicial, actualizaciones periódicas y un resumen final (y configura thinking.display en updates si tu interfaz muestra el progreso); una que prefiera ediciones puntuales a reescrituras de archivos completos. Relaja cualquier regla contra el formato escrita para Opus 4.x." },
  { title: "Vuelve a ejecutar las evaluaciones y revisa el coste", body: "Las denegaciones, el fallback, el crédito de fallback y el tokenizador no cambian, así que la diferencia que ves es comportamiento real. Compara el gasto en lecturas de caché antes y después: si no bajó, tu prefijo no es estable y el paso 2 no está terminado." },
]} />

## Mythos 5.1: el mismo modelo, distintas salvaguardas

Anthropic afirma que Fable 5.1 y Mythos 5.1 son **el mismo modelo de base con distintas configuraciones de salvaguardas**, con las mismas especificaciones y precios. Mythos 5.1 solo se concede a organizaciones verificadas mediante los programas de verificación de Anthropic: el **Cyber Verification Program** para el trabajo de seguridad defensiva y un Life Sciences Verification Program para el trabajo en biología. Dos cosas cambiaron para *todos* en el lado de las salvaguardas: Fable 5.1 ahora puede identificar vulnerabilidades de software para trabajo defensivo (Anthropic informa de aproximadamente un 60 % menos de intervenciones de las salvaguardas de ciberseguridad por sesión), mientras que las tareas de doble uso como las pruebas de penetración, la generación de exploits y el escaneo de vulnerabilidades en binarios se siguen redirigiendo a los modelos Opus; y las salvaguardas de biología se activan aproximadamente un 85 % menos en consultas benignas de biología elemental y medicina. Mythos 5.1 tampoco ejecuta la comprobación de vinculación a la conversación en los bloques de thinking. Si no estás verificado, la instrucción de Anthropic es simplemente: usa Fable 5.1.

<VerifyNote lastVerified="2026-10-21" source="https://support.claude.com/en/articles/14604842">
Verificarse es una **solicitud, no una invitación**: eso cambió el 6 de octubre de 2026, cuando Project Glasswing se reestructuró en los tres niveles del Cyber Verification Program: **Defense Access** (organizaciones y particulares con planes de pago), **Red Team Access** (solo organizaciones) y **Specialized Access** (solo organizaciones, revisado en colaboración con el gobierno de EE. UU., y donde acabaron los miembros existentes de Glasswing). Cada nivel concede Opus 5.5, Sonnet 5.5 y Mythos 5.1. Solicítalo a través del Verification Portal en `portal.anthropic.com/programs`; las decisiones suelen llegar en siete días hábiles. La elegibilidad depende de que la defensa sea tu actividad real: "Organizations whose main business falls outside that scope may not be eligible."
</VerifyNote>

Ojo con los nombres: la [guía de Fable 5](/docs/models/fable-5-mythos-5-flagship) explicaba Mythos 5 como "Fable 5 sin los clasificadores de seguridad". Para 5.1, la formulación de Anthropic es "distintas configuraciones de salvaguardas", y Mythos 5.1 sigue impulsando el propio producto Claude Security de Anthropic. Trátalo como un despliegue configurado de otra manera, no como uno sin filtros.

## Comprobación rápida

<Quiz questions={[
  {
    q: "Migras una integración de Fable 5 a claude-fable-5-1 y ahora falla toda petición con tool_choice de tipo \"tool\". ¿Cuál es la solución autorizada?",
    options: [
      "Añadir la cabecera beta thinking-binding-controls",
      "Mantener tool_choice en auto, poner strict: true en la herramienta con additionalProperties: false y decirle al modelo en el prompt cuándo llamarla (o pasar a salidas estructuradas)",
      "Poner thinking en disabled para que la llamada forzada pueda continuar",
      "Bajar a effort: low"
    ],
    answer: 1,
    explain: "Fable 5.1 devuelve un 400 para tool_choice any y tool porque una llamada forzada se saltaría el thinking siempre activo y empujaría el razonamiento a los argumentos. La solución de Anthropic es el uso estricto de herramientas con auto más una instrucción explícita, o las salidas estructuradas. Desactivar el thinking es en sí mismo un 400 en este modelo."
  },
  {
    q: "Un router baja una conversación de Fable 5.1 a Opus 5 para ahorrar costes. ¿Qué pasa con los bloques de thinking de Fable 5.1?",
    options: [
      "Opus 5 los lee con normalidad",
      "La petición falla con un 400",
      "La API los descarta antes de que Opus 5 los vea; el descarte es silencioso salvo que envíes la cabecera thinking-binding-controls-2026-08-01, que lo informa en input_transformations",
      "Se convierten en bloques de texto"
    ],
    answer: 2,
    explain: "La conservación es unidireccional: Fable 5.1 lee el thinking de los modelos anteriores; ningún modelo anterior lee el de Fable 5.1. Los bloques ilegibles se descartan sin facturarse, en silencio por defecto, y se informan en input_transformations con la cabecera beta."
  },
  {
    q: "Tu bucle de agente inyecta un recordatorio de estado de una línea en el turno de usuario anterior en cada petición y lo quita en la siguiente. En una cuenta nueva de la API esto ahora da error. ¿Qué lo sustituye?",
    options: [
      "Un mensaje de sistema de alcance de turno con clear_at: \"next_user_message\" (cabecera beta mid-conversation-system-clear-at-2026-08-21)",
      "Reconstruir el prompt de sistema en cada petición",
      "Poner el recordatorio en tool_choice",
      "Pasar a Mythos 5.1"
    ],
    answer: 0,
    explain: "Editar cualquier cosa anterior a un bloque de thinking de Fable 5.1 invalida los bloques posteriores. Los mensajes de sistema de alcance de turno tienen autoridad de sistema durante un turno, permanecen en el historial tal cual, no cuestan tokens de entrada una vez borrados y mantienen válidos tanto la caché como los bloques de thinking."
  },
  {
    q: "Fable 5.1 mantiene el precio de lista de $10 / $50 de Fable 5. ¿De dónde sale la afirmación de Anthropic de 'hasta un 45 % más barato en trabajo muy agéntico'?",
    options: [
      "Un aumento del descuento de batch al 75 %",
      "Las lecturas de caché pasan de $1,00 a $0,25 por MTok (0,025× la entrada base en lugar de 0,1×), además de menos tokens por tarea",
      "Un tokenizador más pequeño",
      "Tokens de thinking gratuitos"
    ],
    answer: 1,
    explain: "La única fila de precios que cambió es la de lecturas de caché, ahora una cuarta parte de la tarifa de Fable 5. Los bucles largos que releen un prefijo en caché en cada turno son donde esto se acumula; los clientes de Anthropic también informan de menos tokens por tarea."
  }
]} />

## Conclusiones

<Callout type="takeaways" items={[
  "Fable 5.1 es un reemplazo directo de Fable 5 SOLO si nunca fuerzas tool_choice, nunca editas el historial de la conversación y nunca enrutas bloques de thinking a un modelo anterior. Busca con grep las tres cosas antes de cambiar el ID.",
  "Trata las conversaciones como de solo adición: mensajes de sistema de alcance de turno para recordatorios por turno, mensajes a mitad de conversación para cambios de instrucciones y herramientas, compactación del lado del servidor para recortar. Mantiene válidos los bloques de thinking Y caliente la caché.",
  "La historia de precios son las lecturas de caché a $0,25. Los bucles largos de agentes salen más baratos; los chats cortos, no. Opus 5 a $5 / $25 sigue siendo el 'empieza aquí' de la propia Anthropic.",
  "Espera menos llamadas paralelas a herramientas, menos narración, prosa más densa y reescrituras de archivos completos; cada uno tiene una solución de una línea en el prompt, y thinking.display: \"updates\" restaura el progreso visible.",
  "Priority Tier y ZDR son las dos razones contractuales para quedarse en Fable 5 u Opus 5.",
]} />

## Siguiente

- [Claude Fable 5 y Mythos 5: la guía del modelo insignia](/docs/models/fable-5-mythos-5-flagship) — el cableado de denegaciones y fallback que se mantiene sin cambios
- [Mensajes de sistema a mitad de conversación](/docs/api/mid-conversation-system-messages) — el conjunto de herramientas de solo adición que esta versión da por supuesto
- [GPT-6 Astra: la guía para usuarios de Claude](/docs/models/openai-astra-preview) — el competidor que salió tres días después con el mismo precio de lista
