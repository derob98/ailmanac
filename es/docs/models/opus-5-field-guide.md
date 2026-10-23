# Claude Opus 5: la guía práctica

> Source: https://derob98.github.io/ailmanac/es/docs/models/opus-5-field-guide · AILmanac (CC BY 4.0) · last verified 2026-07-25

Opus 5 salió el 24 de julio de 2026 como el cuarto modelo de Anthropic en dos meses: el mismo precio de $5/$25 que Opus 4.8, pero más del doble de puntuación en Frontier-Bench, 3× en ARC-AGI-3 frente al siguiente mejor modelo y un nuevo nivel de esfuerzo xhigh/max. Los benchmarks que importan, los dos errores 400 que rompen las migraciones ingenuas y cuándo Opus 5 reemplaza a Fable 5 en tu stack.

<LevelBadge level="intermediate" />

El **24 de julio de 2026** Anthropic lanzó **Claude Opus 5** (`claude-opus-5`), el cuarto modelo en dos meses, después de Sonnet 5 (30 de junio) y Fable 5 / Mythos 5 (9 de junio). El titular es aburrido a propósito: **el mismo precio de $5 de entrada / $25 de salida por MTok que Opus 4.8**, el mismo contexto de 1M y el mismo tope de salida de 128k. Lo interesante es lo que ahora compran esas cifras sin cambios: **44,4 % en Frontier-Bench v0.1 frente al 18,7 % de Opus 4.8** (más del doble), **96,0 % en SWE-bench Verified** y **30,16 % en ARC-AGI-3, aproximadamente el triple del 7,78 % de GPT-5.6 Sol y veinte veces el 1,52 % de Opus 4.8**. Opus 5 es ahora el **modelo por defecto de Claude Max** y el más potente disponible en Claude Pro.

Esta página es la guía práctica: qué significan realmente los números para tu stack, los dos cambios de contrato de la API que provocarán un error 400 en una migración ingenua, cuándo Opus 5 reemplaza legítimamente a Fable 5 (y cuándo no) y el nuevo nivel de esfuerzo `xhigh` / `max`.

<Callout type="objectives" items={[
  "Saber qué es Opus 5: contexto de 1M, salida de 128k, $5 de entrada / $25 de salida por MTok — la misma forma que Opus 4.8, con números claramente mejores",
  "Entender las dos restricciones de la API que rompen las migraciones ingenuas: las limitaciones para desactivar el thinking con esfuerzo alto, y el thinking activado por defecto que consume tu presupuesto de max_tokens",
  "Leer los benchmarks como los leen los líderes de equipos de agentes — Frontier-Bench, ARC-AGI-3, SWE-bench Pro, OSWorld 2.0 — y saber cuáles son significativos para tu carga de trabajo",
  "Hacer las cuentas de precio con honestidad: cuándo Opus 5 con esfuerzo max supera a Fable 5 en coste por tarea resuelta y cuándo no",
  "Elegir el nivel de esfuerzo correcto — los nuevos niveles xhigh y max se justifican en Frontier-Bench y ARC-AGI-3 y malgastan tokens en el resto",
  "Planificar la migración de Opus 4.1 a Opus 5 antes de la fecha de retirada del 5 de agosto de 2026",
]} />

<VerifyNote lastVerified="2026-07-25" source="https://www.anthropic.com/news/claude-opus-5">
La fecha de lanzamiento, el ID del modelo, los precios, los límites de contexto/salida, los niveles de esfuerzo y las cifras de los benchmarks se verificaron el 25 de julio de 2026 con el anuncio de lanzamiento de Anthropic, la vista general de modelos de Claude Platform y la guía de migración de Opus 4.8 → Opus 5. El precio de introducción **no** se aplica a Opus 5: precio estándar de $5 de entrada / $25 de salida por MTok desde el lanzamiento. El modo rápido es una superficie de modelo aparte a $10 / $50 por MTok, ~2,5× más rápido en tiempo real. La Batch API tiene un 50 % de descuento ($2,50 / $12,50). Los aciertos de caché de prompts cuestan $0,50/MTok y las escrituras de 5 min $6,25. Opus 4.1 (`claude-opus-4-1-20250805`) se retira el **5 de agosto de 2026**: migra antes de esa fecha. Contrasta la tabla de [Current Models & Pricing](/docs/whats-new/models-and-pricing) antes de fijar un modelo.
</VerifyNote>

## La versión en un párrafo

Opus 5 es una **mejora de capacidad sin cambio de precio**, no un reajuste de tarifas. Los mismos $5 / $25 por MTok que Opus 4.8, la misma ventana de 1M de tokens, la misma salida máxima de 128k en la Messages API síncrona, la misma fecha de corte de conocimiento fiable, desplazada a **mayo de 2026**. Lo que cambió es lo que hacen esos tokens: en Frontier-Bench v0.1 (la evaluación de agentes de programación más difícil de la propia Anthropic) Opus 5 puntúa **44,4 % con esfuerzo `xhigh`** frente al 18,7 % de Opus 4.8: más del doble al mismo precio de lista. En ARC-AGI-3, la resolución de problemas nuevos salta del 1,52 % al 30,16 %. Dos cambios de contrato romperán las migraciones ingenuas: el adaptive thinking viene activado por defecto y comparte tu presupuesto de `max_tokens` con la respuesta, y `thinking: {"type": "disabled"}` ahora devuelve **400** en los nuevos niveles de esfuerzo `xhigh` o `max`. Opus 5 es el nuevo modelo por defecto en Claude Max, el más potente disponible en Claude Pro, y está disponible a través de la Claude API, Bedrock (`anthropic.claude-opus-5`), Google Cloud (`claude-opus-5`), Microsoft Foundry y Claude Platform on AWS.

## Qué cambió realmente respecto a Opus 4.8

Opus 4.8 salió en abril de 2026 como la primera Opus con ventana de contexto de 1M y adaptive thinking activado por defecto. Opus 5 conserva todos esos valores por defecto, así que en la red la forma de la petición y la respuesta es casi idéntica. Cambiaron cuatro cosas:

- **Los números.** Frontier-Bench v0.1 pasó del 18,7 % al 44,4 % (xhigh) / 43,3 % (max). SWE-bench Multimodal del 38,4 % al 59,4 %. OSWorld 2.0 del 55,7 % al 70,57 %. Zapier AutomationBench del 17,0 % al 26,0 %. ARC-AGI-3 del 1,52 % al 30,16 % con esfuerzo alto.
- **Un nuevo nivel de esfuerzo `max`** se sitúa por encima de `xhigh`, y `thinking: {"type": "disabled"}` ya no funciona en `xhigh` ni `max` (error 400). La idea es que en esos niveles pagas explícitamente por el razonamiento, así que desactivarlo en silencio ahora es un error y no una preferencia.
- **La autoverificación es ahora comportamiento por defecto**, no un hábito inducido por el prompt. La guía de migración de Anthropic advierte expresamente que **elimines las instrucciones manuales de «comprueba tu trabajo»**: de lo contrario obtienes doble verificación y tokens quemados. Es la sorpresa más común en el primer día de ejecutar en Opus 5 código que antes corría en Opus 4.8.
- **La caché de prompts ya no se invalida con cambios de herramientas a mitad de conversación** (beta). Si tu bucle de agente cambia la lista de herramientas en cada paso, el prefijo de caché ahora sobrevive; en Opus 4.8 pagabas una escritura nueva cada vez.

## Los dos errores 400 que romperán la migración

<Steps items={[
  {title: "thinking: disabled con xhigh o max devuelve 400", body: "Opus 4.8 permitía desactivar el thinking con cualquier nivel de esfuerzo. Opus 5 solo permite thinking: {\"type\": \"disabled\"} con esfuerzo high o inferior. Combinarlo con xhigh o max es un error duro. Si tienes un wrapper que siempre desactiva el thinking (algunos equipos lo hacen para mantener las respuestas escuetas), baja el esfuerzo a high o elimina el campo thinking y deja que el adaptive thinking funcione."},
  {title: "El adaptive thinking se come tu presupuesto de max_tokens", body: "La misma trampa que en la migración a Sonnet 5. max_tokens es un tope duro sobre toda la salida: bloques de thinking más texto de respuesta. Si dimensionaste max_tokens para 'solo la respuesta' en Opus 4.8 con el thinking desactivado y no lo desactivas en Opus 5, verás respuestas truncadas con stop_reason: 'max_tokens'. Sube max_tokens, baja el esfuerzo a medium o desactiva explícitamente el thinking con esfuerzo high o inferior."},
  {title: "El extended thinking manual sigue dando 400", body: "Heredado de Opus 4.7: thinking: {type: 'enabled', budget_tokens: N} devuelve 400. Usa effort. Si calculabas un presupuesto por petición, sustituye esa lógica por un selector de esfuerzo; el controlador adaptativo ahora decide cuánto pensar según la dificultad de la tarea."},
  {title: "La autoverificación es por defecto — elimina tu verificación en el prompt", body: "No es un 400, sino una regresión silenciosa de coste. Opus 5 itera y se autocomprueba sin que se lo pidas. Cualquier andamiaje del tipo 'ahora verifica tu respuesta paso a paso' que añadiste en 4.6 o 4.8 activará una segunda pasada de verificación y aproximadamente duplicará los tokens de thinking en prompts difíciles. Elimina esas instrucciones y vuelve a ejecutar tu evaluación."}
]} />

<PromptCard title="Migración mínima y segura — de Opus 4.8 a Opus 5">
{`# Before (Opus 4.8) — worked
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    extra_body={"effort": "max"},
    thinking={"type": "disabled"},           # allowed on 4.8 at any effort
    system="After answering, verify your work step by step.",
    messages=[...],
)

# After (Opus 5) — three edits
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16384,                        # thinking now shares this budget
    extra_body={"effort": "max"},
    # thinking={"type": "disabled"}          # 400 at xhigh/max — remove it
    system="Answer the question.",           # drop the verify instruction — Opus 5 self-verifies
    messages=[...],
)`}
</PromptCard>

## Los benchmarks que realmente importan

Anthropic publicó muchas cifras el día del lanzamiento. Tres son determinantes para cargas de trabajo reales, una es un trofeo de marketing y dos merecen una lectura atenta porque muestran dónde Opus 5 *no* es la mejor opción.

- **Frontier-Bench v0.1 — 44,4 % (xhigh) frente al 18,7 % de Opus 4.8.** Es la evaluación de programación agéntica más difícil de Anthropic: tareas de largo recorrido en las que el modelo debe ejecutar herramientas, iterar y autocorregirse. El salto de 2,4× al mismo precio es la razón más sólida para migrar.
- **SWE-bench Verified — 96,0 %.** Casi en el techo. Si usabas Opus 4.8 o Fable 5 para corregir bugs al estilo SWE-bench, Opus 5 es una mejora directa. Pero SWE-bench Verified ya es un benchmark saturado: las diferencias pequeñas ya no discriminan entre modelos como antes.
- **OSWorld 2.0 — 70,57 % frente al 55,7 % de Opus 4.8.** Benchmark de uso del ordenador. Si ejecutas Claude for Chrome, el modo navegador de Claude Cowork o cualquier cosa que haga clic en una interfaz real, este es el número que hay que vigilar.
- **ARC-AGI-3 — 30,16 % (esfuerzo alto) frente al 7,78 % de GPT-5.6 Sol y el 1,52 % de Opus 4.8.** El trofeo de marketing. ARC-AGI-3 mide la resolución de problemas nuevos que resisten la memorización, y Opus 5 es aproximadamente 3× el siguiente mejor modelo. Señal significativa si tu carga de trabajo tiene verdadera novedad; menos si son variantes de cosas que internet ya ha resuelto.
- **SWE-bench Pro — 79,2 % frente al 80,0 % de Fable 5.** Fable 5 todavía supera a Opus 5 por 0,8 pp en el SWE-bench Pro, más difícil. No basta para justificar el doble de precio de Fable 5 en la mayoría de los equipos, pero si estás en el decil superior de complejidad de código y cada punto cuenta, tenlo presente.
- **Explotación en ciberseguridad — Opus 5 queda por detrás de Mythos 5.** Anthropic dice explícitamente que Opus 5 *no* es el mejor modelo de ciberseguridad. Si haces trabajo de ciberdefensa y tu organización está verificada mediante los programas de verificación de Anthropic, Mythos sigue siendo la elección.

## Cuándo Opus 5 reemplaza a Fable 5 (y cuándo no)

La pregunta interesante que fuerza este lanzamiento: **¿cuándo necesitas realmente el precio de $10 / $50 de Fable 5?** La afirmación de Anthropic es que Opus 5 queda a menos de un 0,5 % del pico de Fable 5 en CursorBench 3.2 a la mitad de coste, y que iguala el resultado de Fable 5 en OSWorld 2.0 por «algo más de un tercio del coste». Esa es la versión fuerte del argumento. La versión honesta:

- **Elige Opus 5** para programación agéntica, uso del ordenador, automatización de negocio, razonamiento en ciencias de la vida y cualquier caso en que el coste por tarea resuelta importe más que el último 1-3 pp de calidad. Eso es >90 % de las cargas de producción.
- **Elige Fable 5** cuando la carga de trabajo sea (a) agentes de larga duración donde la ejecución *marginal* se beneficie realmente del último punto porcentual (Anthropic presenta Fable 5 como «inteligencia de nueva generación para agentes de larga duración»), (b) tareas de código difíciles al estilo SWE-bench Pro donde hayas medido una diferencia real, o (c) cualquier carga que ya esté en la zona de la curva precisión-coste donde pagar el doble compra calidad real.
- **Elige Mythos** para trabajo de ciberdefensa, si tu organización está verificada. Desde el 6 de octubre de 2026 la vía de entrada es una solicitud al [Cyber Verification Program](https://support.claude.com/en/articles/14604842) —el sucesor del [Project Glasswing](https://anthropic.com/glasswing), que era solo por invitación— y lo que conceden sus niveles es Mythos 5.1.

<PromptCard title="Honest cost-per-solved-task math">
{`# Fable 5 on a hard agentic task
#   ~500k input tokens, ~50k output tokens
#   500 * $10/M + 50 * $50/M = $5.00 + $2.50 = $7.50 per run
#   Fable 5 solve rate: ~46% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $7.50 / 0.46 = ~$16.30

# Opus 5 on the same task
#   Same token budget
#   500 * $5/M + 50 * $25/M = $2.50 + $1.25 = $3.75 per run
#   Opus 5 solve rate: ~44.4% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $3.75 / 0.444 = ~$8.45

# Opus 5 wins on cost-per-solved-task by ~48% at near-parity quality.
# Break-even: Fable 5 would need to be 2x cheaper per successful run,
# i.e. Opus 5 would have to drop below ~23% solve rate for Fable 5 to win.`}
</PromptCard>

## El nuevo nivel max — cuándo se justifica

Opus 5 introduce `max` como un nivel explícito por encima de `xhigh`. El adaptive thinking ahora abarca `low → medium → high → xhigh → max`, y `high` es el valor por defecto en la Claude API y en Claude Code. Dos observaciones de los benchmarks del lanzamiento:

- En Frontier-Bench v0.1, `xhigh` puntúa en realidad 44,4 % frente al 43,3 % de `max`: max *no* es estrictamente mejor. Quema más tokens por intento, pero el razonamiento extra no siempre se traduce en aciertos en esta evaluación.
- En tareas que premian la deliberación larga —ARC-AGI-3, problemas de investigación novedosos, razonamiento matemático difícil (nivel medalla de oro de la IMO 2026, 42/42)— los niveles altos sí se justifican.

La regla práctica: **usa `high` por defecto, pasa a `xhigh` cuando tu evaluación muestre mejoras medibles y usa `max` solo en cargas donde hayas verificado que la profundidad de razonamiento importa más que el rendimiento.** No pongas `max` y esperes lo mejor; mide.

## Ciencias de la vida, seguridad y postura en ciberseguridad

Tres números que conviene anotar:

- **Ciencias de la vida.** Opus 5 supera a Opus 4.8 en 10,2 puntos porcentuales en química orgánica y en 7,7 pp en predicción de proteínas. Si construyes agentes para biología estructural, bioinformática o planificación de síntesis, es un salto real, no una mejora dentro del ruido.
- **Resistencia a la inyección de prompts.** En el benchmark de Gray Swan, el éxito del atacante baja del 5,5 % de Opus 4.8 al **2,0 %**. En los entornos de navegador de Claude Cowork, las salvaguardas del modo automático llevan el éxito de inyección de prompts en el navegador al **0 %** según las mediciones de Anthropic. Relevante para quien despliegue agentes al estilo Claude-for-Chrome.
- **Clasificadores de ciberseguridad.** Las salvaguardas cibernéticas de Opus 5 intervienen **~85 % menos a menudo que en Fable 5**: como Opus 5 deliberadamente no es el mejor modelo de ciberseguridad, la tasa de intervención se ha reducido. Si veías rechazos de seguridad espurios en prompts legítimos de investigación de seguridad en Fable 5, Opus 5 se sentirá notablemente menos quisquilloso.

## Calendario de retiradas que debes planificar

- **Opus 4.1 (`claude-opus-4-1-20250805`)** se retira el **5 de agosto de 2026**, once días después del lanzamiento de Opus 5. Si alguna superficie de producción sigue fijada a Opus 4.1, migra esta semana.
- **Opus 4.5 / 4.6 / 4.7 / 4.8** siguen disponibles como «Legacy models» en la vista general de la plataforma, pero cuenta con los ciclos estándar de deprecación de 12 meses. Trata Opus 5 como el destino de migración para todo lo nuevo.
- **El ID de modelo de Opus 5 es una instantánea fijada**, no un puntero siempre actualizado. Desde la generación 4.6, el formato de ID sin fecha sigue significando «instantánea fija». Un futuro `claude-opus-5-1` sería un ID nuevo, no una actualización silenciosa de `claude-opus-5`.

## Pruébalo — un solo comando

<PromptCard title="Run Opus 5 with the recommended defaults">
{`# Python — Claude SDK
from anthropic import Anthropic
client = Anthropic()

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=8192,                    # room for adaptive thinking + response
    extra_body={"effort": "high"},      # default; move to xhigh only if evals justify
    system="You are a senior engineer. Answer directly and iterate until the task is complete.",
    messages=[{"role": "user", "content": "..."}],
)

# Claude Code
claude --model claude-opus-5

# For fast mode (2.5x speed, 2x cost)
# model="claude-opus-5-fast"  # separate model ID, $10/$50 per MTok`}
</PromptCard>

## Hoja de referencia

<Flashcards cards={[
  {front: "Precio de la API de Opus 5", back: "$5 por MTok de entrada, $25 por MTok de salida — idéntico a Opus 4.8. La Batch API tiene un 50 % de descuento ($2,50 / $12,50). Aciertos de caché de prompts a $0,50/MTok."},
  {front: "Opus 5 frente a Opus 4.8 en Frontier-Bench v0.1", back: "44,4 % con xhigh (Opus 5) frente al 18,7 % (Opus 4.8). Más del doble al mismo precio."},
  {front: "Opus 5 frente a Fable 5 en coste por tarea resuelta", back: "Opus 5 resuelve con calidad casi equivalente por aproximadamente la mitad del coste en tokens. Para que Fable 5 ganara en coste, la tasa de resolución de Opus 5 tendría que caer por debajo de ~23 %."},
  {front: "El nuevo nivel de esfuerzo", back: "max — por encima de xhigh. En Frontier-Bench v0.1, xhigh (44,4 %) supera en realidad a max (43,3 %). Usa max solo donde se haya verificado que la profundidad de razonamiento importa."},
  {front: "La trampa de la autoverificación", back: "Opus 5 se autoverifica por defecto. Las instrucciones 'verifica tu respuesta paso a paso' de Opus 4.6/4.8 ahora provocan doble verificación y aproximadamente duplican los tokens de thinking en prompts difíciles. Elimínalas."},
  {front: "Los dos errores 400 de la migración", back: "(1) thinking: disabled con xhigh o max. (2) El budget_tokens manual de thinking sigue dando 400 (heredado de 4.7). Además, el adaptive thinking activado por defecto consume tu max_tokens: sube el tope."},
  {front: "Resultado en ARC-AGI-3", back: "30,16 % con esfuerzo alto — ~3× el 7,78 % de GPT-5.6 Sol y ~20× el 1,52 % de Opus 4.8. Trofeo de marketing, pero señal real en tareas genuinamente nuevas."},
  {front: "Retirada de Opus 4.1", back: "5 de agosto de 2026 — migra antes de esa fecha cualquier superficie de producción fijada a claude-opus-4-1-20250805."}
]} />

## Comprueba lo que has aprendido

<Quiz questions={[
  {
    q: "Migras a Opus 5 un wrapper que fijaba `model=\"claude-opus-4-8\"`, `effort: \"max\"` y `thinking: {\"type\": \"disabled\"}`. ¿Qué ocurre?",
    options: [
      "Funciona sin problemas: mismo comportamiento, mejores números.",
      "Devuelve un error 400 porque en Opus 5 no se puede desactivar el thinking con esfuerzo max.",
      "Ignora en silencio el indicador de desactivación y se ejecuta con adaptive thinking.",
      "Baja automáticamente a esfuerzo xhigh."
    ],
    answer: 1,
    explain: "Opus 5 solo permite thinking: {\"type\": \"disabled\"} con esfuerzo high o inferior. Combinarlo con xhigh o max devuelve un 400 duro. Baja el esfuerzo a high o elimina el campo thinking y deja que funcione el adaptive thinking."
  },
  {
    q: "Tu prompt de Opus 4.8 termina con 'Ahora verifica tu respuesta paso a paso.' Cambias a Opus 5 y ves aproximadamente el doble de coste en tokens de thinking en prompts difíciles. ¿Por qué?",
    options: [
      "Opus 5 tiene un bug en su ruta de verificación.",
      "El tokenizador de Opus 5 es distinto, así que las instrucciones de verificación cuestan más.",
      "Opus 5 se autoverifica por defecto; la instrucción del prompt provoca una segunda pasada de verificación.",
      "El adaptive thinking está desactivado en Opus 5."
    ],
    answer: 2,
    explain: "La guía de migración de Anthropic advierte expresamente que elimines la verificación inducida por el prompt. Opus 5 itera y se autocomprueba sin que se lo pidas, así que el andamiaje antiguo causa doble verificación. Elimina la instrucción y vuelve a ejecutar tu evaluación."
  },
  {
    q: "Para una carga de producción de programación agéntica en la que importa la tasa de resolución y el coste es una restricción real, ¿qué modelo respaldan con más fuerza los datos del lanzamiento de Opus 5?",
    options: [
      "Fable 5 — gana en SWE-bench Pro por 0,8 pp, así que domina la calidad.",
      "Opus 5 — calidad casi equivalente en Frontier-Bench y CursorBench a la mitad del precio de lista de Fable 5.",
      "Sonnet 5 — la opción más barata siempre es la elección por defecto correcta.",
      "Mythos 5 — el modelo de nivel más alto disponible."
    ],
    answer: 1,
    explain: "Opus 5 queda a menos de un 0,5 % del pico de Fable 5 en CursorBench 3.2 a la mitad de coste. En Frontier-Bench, la cuenta de coste por tarea resuelta muestra a Opus 5 ganando en torno a un 48 % con calidad casi equivalente. Fable 5 solo gana cuando el último 1-3 pp de calidad justifica el doble de factura de tokens."
  },
  {
    q: "Pones `effort: \"max\"` en cada petición esperando una calidad estrictamente mejor que con `xhigh`. ¿Qué sugieren los datos del lanzamiento de Anthropic?",
    options: [
      "max siempre es estrictamente mejor que xhigh: compensa los tokens extra.",
      "max es peor que xhigh en todos los benchmarks: no lo uses nunca.",
      "max ayuda en algunas tareas (razonamiento novedoso, matemáticas difíciles), pero en Frontier-Bench v0.1 xhigh puntúa en realidad más alto (44,4 % frente a 43,3 %).",
      "max solo funciona para tareas de uso del ordenador."
    ],
    answer: 2,
    explain: "max no es estrictamente mejor. En Frontier-Bench v0.1, xhigh supera a max. Los niveles altos se justifican en ARC-AGI-3, matemáticas de nivel IMO y tareas con problemas novedosos: mide antes de poner max por defecto."
  },
  {
    q: "¿Cuál de estas es la fecha de retirada que debes planificar tras el lanzamiento de Opus 5?",
    options: [
      "Opus 4.5 se retira el 5 de agosto de 2026.",
      "Opus 4.1 (claude-opus-4-1-20250805) se retira el 5 de agosto de 2026.",
      "Opus 4.8 se retira el 31 de diciembre de 2026.",
      "No hay retiradas activas ligadas al lanzamiento de Opus 5."
    ],
    answer: 1,
    explain: "Opus 4.1 se retira el 5 de agosto de 2026, once días después del lanzamiento de Opus 5. Cualquier superficie de producción que siga fijada a claude-opus-4-1-20250805 debe migrar antes de esa fecha."
  }
]} />

## Adónde ir después

- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide) — el nivel equilibrado y el valor por defecto de Claude Code; migrar desde Sonnet 4.6 tiene sus propias trampas 400
- [Fable 5 & Mythos 5: The Flagship Field Guide](/docs/models/fable-5-mythos-5-flagship) — cuándo el nivel superior justifica realmente el doble de coste
- [Choosing a Model in 2026](/docs/models/choosing-a-model) — el árbol de decisión de toda la gama de Anthropic
- [Adaptive Thinking & Effort Tuning](/docs/api/thinking-and-effort) — cómo se traduce el esfuerzo en gasto real de tokens
- [Prompt Caching Economics](/docs/frontiers/prompt-caching-economics) — la cuenta de aciertos de caché que convierte el precio de portada de Opus 5 en tu factura real
- [Current Models & Pricing](/docs/whats-new/models-and-pricing) — la tabla siempre actualizada; consúltala antes de fijar un modelo

## Fuentes y lecturas adicionales

- [Introducing Claude Opus 5 — Anthropic (24 July 2026)](https://www.anthropic.com/news/claude-opus-5) — el anuncio de lanzamiento, las tablas de benchmarks y las notas de seguridad
- [Claude Platform docs — Models overview](https://platform.claude.com/docs/en/models/overview) — tablas de precios, IDs de instantáneas, identificadores de Bedrock/GCP, valores de esfuerzo por defecto
- [Migration guide — Opus 4.8 to Opus 5](https://platform.claude.com/docs/en/about-claude/models/migration-guide) — la lista oficial de cambios de contrato y la advertencia sobre autoverificación
- [MarkTechPost — Opus 5 launch coverage (24 July 2026)](https://www.marktechpost.com/2026/07/24/meet-the-new-claude-opus-5-frontier-class-agentic-coding-and-computer-use-at-unchanged-opus-pricing/) — desglose benchmark por benchmark con SWE-bench, ARC-AGI-3 y Chartography
- [Interesting Engineering — Opus 5 coding coverage](https://interestingengineering.com/culture/anthropic-claude-opus-5-coding-performance) — enfoque de coste por tarea
- [TheNextWeb — Opus 5 launch analysis](https://thenextweb.com/news/anthropic-claude-opus-5-launch-frontier-bench-coding) — ritmo de lanzamientos y comparación con Fable 5
- [BigGo Finance — Opus 5 pricing analysis](https://finance.biggo.com/news/f43fc4c1-53fd-4f49-9e0e-4246307a0391) — economía del modo rápido y cambios en la caché de prompts
- [Model deprecations — Anthropic](https://platform.claude.com/docs/en/about-claude/model-deprecations) — la fecha de retirada de Opus 4.1 y la política general de ciclo de vida


## Siguiente

- [Claude Opus 5.5: The Field Guide](/docs/models/opus-5-5-field-guide) — el sucesor, lanzado el 22 de septiembre de 2026: $4/$20, lecturas de caché con tarifa del 5 % y cuatro cambios incompatibles más además de los anteriores
- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide)
