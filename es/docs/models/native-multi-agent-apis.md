# APIs multiagente nativas: la beta multiagente de Responses de OpenAI frente a construirlo tú mismo

> Source: https://derob98.github.io/ailmanac/es/docs/models/native-multi-agent-apis · AILmanac (CC BY 4.0) · last verified 2026-08-01

El 9 de julio de 2026 OpenAI lanzó la beta multiagente de la Responses API y Sol Ultra Mode — el primer proveedor de frontera en convertir «el modelo genera y sintetiza N subagentes en una sola petición HTTP» en una primitiva de primera clase. Qué se lanzó realmente, la forma de la API, las cuentas de coste, qué hace Anthropic en su lugar y cuándo la primitiva nativa supera a un fan-out casero.

<LevelBadge level="advanced" />

Durante dieciocho meses, «multiagente» significó que el fan-out lo escribías *tú*. Escribías el prompt del coordinador, lanzabas N llamadas en paralelo, fusionabas sus JSON y gestionabas los reintentos. El **9 de julio de 2026** OpenAI lo redujo a un parámetro de la petición: **`multi_agent.enabled: true`** en la Responses API, envuelto en una función de consumo llamada **Sol Ultra Mode**. El propio modelo decide cuántos subagentes generar, los ejecuta en paralelo y sintetiza el resultado, todo dentro de una única llamada HTTP. Ningún otro proveedor de frontera ha lanzado una primitiva simétrica. Esta página recoge qué se lanzó realmente, las cifras que hay detrás, qué ofrece Anthropic en su lugar y — lo que importa — las tres cargas de trabajo en las que la primitiva nativa compensa su coste y las dos en las que un fan-out casero sigue ganando.

<Callout type="objectives" items={[
  "Leer el cuerpo exacto de una petición multiagente de la Responses API y saber qué limita realmente max_concurrent_subagents",
  "Hacer las cuentas del coste: qué cobra en realidad «el modelo genera 4 subagentes» a precios de Sol",
  "Situar el mismo terreno en el lado de Anthropic — Cowork, Managed Agents y los subagentes de Claude Code — y ver la brecha de primitivas",
  "Elegir la primitiva adecuada para cada carga: multiagente nativo, fan-out casero, A2A o un único turno largo",
  "Evitar los cuatro modos de fallo que convierten una llamada Ultra de 4 agentes en una factura x4 sin ganancia de precisión"
]} />

<VerifyNote lastVerified="2026-08-01" source="https://developers.openai.com/api/docs/guides/responses-multi-agent">
La superficie multiagente de la Responses API sigue en beta (cabecera <code>OpenAI-Beta: responses_multi_agent=v1</code>). Los nombres de los campos, el valor por defecto de <code>max_concurrent_subagents</code> y qué parámetros son mutuamente excluyentes con el modo multiagente han cambiado desde el lanzamiento del 9 de julio de 2026. Vuelve a verificar la forma de la petición y la lista de incompatibilidades en el documento enlazado antes de publicar.
</VerifyNote>

## La versión en una frase

**Ultra Mode es una capa de consumo sobre `multi_agent.enabled: true` en la Responses API**: una primitiva nativa que permite al modelo generar subagentes en paralelo dentro de una petición, sintetizar sus salidas y devolver una única respuesta. Aporta una mejora de precisión pequeña pero real en tareas paralelizables (Terminal-Bench 2.1: **88,8 % → 91,9 %**), con una factura de tokens que escala aproximadamente de forma lineal con el número de subagentes que el modelo decida generar.

## Qué se lanzó realmente el 9 de julio de 2026

En el mismo lanzamiento aterrizaron dos cosas, y conviene separarlas:

- **Ultra Mode** — un interruptor de *producto* dentro de ChatGPT y Codex. Disponible en el nivel insignia (Sol). Al activarlo, las tareas difíciles se descomponen en ejecuciones paralelas de subagentes antes de la síntesis. Se anuncia como «genera 4+ agentes»; algunos gráficos de benchmarks GA de la propia OpenAI muestran además configuraciones de 16 agentes en BrowseComp y SEC-Bench Pro, pero cuatro es el valor de trabajo por defecto.
- **Beta multiagente de la Responses API** — una primitiva para *desarrolladores*. La misma capacidad subyacente, expuesta como `multi_agent.enabled: true` en `client.beta.responses.create()`. Es lo que usarías para construir tu propia experiencia tipo Ultra.

La confusión que dejó el marketing es real: los desarrolladores no paran de preguntar «¿cómo llamo a Ultra Mode desde la API?». La respuesta es que no se llama: activas la beta multiagente, que es la primitiva que hay bajo la función de producto.

## La petición multiagente de la Responses API

En concreto, esta es la forma (SDK de Python):

<PromptCard title="Llamada multiagente mínima a la Responses API">
{`from openai import OpenAI

client = OpenAI()

resp = client.beta.responses.create(
    model="gpt-5.6-sol",
    input="Audit this repo for auth-bypass patterns and write a report.",
    multi_agent={
        "enabled": True,
        "max_concurrent_subagents": 3,
    },
    tools=[...],  # your MCP tools, function tools, etc.
    extra_headers={"OpenAI-Beta": "responses_multi_agent=v1"},
)`}
</PromptCard>

Cuatro aspectos poco evidentes de esta forma:

- **`max_concurrent_subagents` no es un presupuesto total.** Limita los turnos de subagente *activos* en todo el árbol en un momento dado: raíz más descendientes. El modelo puede generar un número *total* mucho mayor de subagentes durante la vida de la petición; lo único que no puede es tener más de N en ejecución a la vez.
- **La profundidad no tiene límite.** Un subagente puede generar a su vez subagentes. No hay un tope fijo ni para la profundidad del árbol ni para el número total de subagentes por ejecución. Tu superficie de coste no es «N llamadas», sino un árbol que el modelo da forma en tiempo de ejecución.
- **La raíz sintetiza.** El agente raíz se encarga de fusionar las respuestas de los subagentes en la respuesta final. No recibes un objeto estructurado `{subagents: [...]}`; recibes una sola respuesta, y los turnos intermedios de los agentes son opacos para tu código.
- **Algunos parámetros se desactivan en silencio.** `reasoning.summary` y `max_tool_calls` no se admiten con multiagente activado, y el endpoint de compactación no se admite en respuestas multiagente. Si dependes de los resúmenes de razonamiento para la observabilidad, los pierdes en cuanto lo activas.

## Las cuentas del coste que nadie imprime en la página de marketing

Con el precio GA de Sol, **5 $ de entrada / 30 $ de salida por millón de tokens**, la aritmética no perdona. A partir de los análisis de desarrolladores que hicieron ingeniería inversa de ejecuciones reales de Ultra:

- **Una tarea que Ultra descompone en 2 subagentes** ≈ 2x el coste en tokens de salida de una sola llamada a Sol, porque ambos subagentes generan salida y, además, la raíz genera la síntesis.
- **Una tarea para la que Ultra genera 5 subagentes** ≈ 5x, con el mismo razonamiento y proporcionalmente más repetición de tokens de entrada a lo largo del árbol.
- **Los gráficos de BrowseComp / SEC-Bench que muestran configuraciones de 16 agentes** no son una comida gratis: son una demostración de nivel investigador, no un valor por defecto. Con 16 subagentes concurrentes en Sol, hablamos de una cifra de dos dígitos medios en dólares por consulta difícil solo en tokens de salida.

La forma de pensarlo: **pagas un Monte Carlo de llamadas a Sol más una pasada de síntesis encima.** A veces eso compra la precisión suficiente para importar. A veces es solo una factura x4 por una tarea que una única llamada habría resuelto.

## Qué compra realmente la precisión

Las mejoras publicadas en las evaluaciones paralelizables — las cargas para las que se diseñó Ultra Mode — son reales pero modestas:

| Benchmark | Sol (individual) | Sol Ultra | Delta | Qué mide la evaluación |
| --- | --- | --- | --- | --- |
| Terminal-Bench 2.1 | 88,8 % | 91,9 % | +3,1 | Planificación de línea de comandos en varios pasos, coordinación de herramientas |
| BrowseComp | 87,5 % | 92,2 % | +4,7 | Investigación web con múltiples fuentes y síntesis |
| SEC-Bench Pro | — | 74,3 % | (cifra del modo individual no publicada) | Razonamiento sobre documentos regulatorios en grandes corpus |

Tres observaciones sobre esta tabla:

- La banda de +3–5 puntos es coherente con lo que el muestreo en paralelo ha aportado históricamente en otras fronteras (best-of-N, self-consistency). La primitiva es realmente útil; la mejora no es un salto cualitativo.
- Son el *mejor caso*: evaluaciones elegidas para mostrar el modo. En tareas secuenciales (una edición lineal de código, la reescritura de un solo archivo, un chat corto), Ultra añade latencia de síntesis y coste sin mover la precisión.
- En el mismo gráfico de Terminal-Bench 2.1, Opus 4.8 de Anthropic obtuvo un 78,9 %: es decir, la ventaja de Sol Ultra procede *tanto* del mejor modelo base *como* del impulso multiagente apilado encima. Si migras de Opus a Sol Ultra, no atribuyas toda la diferencia a la primitiva multiagente.

## Qué hace Anthropic en su lugar

Anthropic no ha lanzado una primitiva de API simétrica. Los análogos más cercanos resuelven cada uno una parte distinta del mismo problema:

- **[Cowork](/docs/api/cowork-and-agent-teams)** — una superficie de *producto*. Un espacio de trabajo agéntico de escritorio donde un agente realiza trabajo sostenido de varios pasos junto al usuario. Comparable a Ultra Mode como *función*, pero no como primitiva de API.
- **[Managed Agents](/docs/api/managed-agents) y los [almacenes de memoria de managed agents](/docs/api/managed-agents-memory-stores)** — un bucle de agente alojado con estado persistente y programación. Cubre el hueco de «agente de fondo de larga duración», no el de «generar 4 en paralelo y fusionar».
- **[Subagentes de Claude Code](/docs/claude-code/subagents) y los [límites de flota de subagentes](/docs/claude-code/subagent-fleet-limits)** — una primitiva de subagentes de primera clase, pero limitada a la CLI de Claude Code. Está documentada, se puede lanzar en paralelo y es el análogo *más cercano* a `multi_agent.enabled`, con la diferencia importante de que el prompt del coordinador lo escribes tú.
- **[Building Agents](/docs/api/building-agents) sobre la Messages API** — el camino casero. Lanzas N llamadas `messages.create` en paralelo, escribes el prompt de síntesis y gestionas los reintentos. El mismo resultado, más código.

La brecha: **ninguna superficie de la API de Anthropic permite hoy activar un único booleano para que el propio modelo decida cuántos subagentes generar y fusione su trabajo.** Si quieres ese comportamiento con Claude, lo construyes: consulta [Cowork & Agent Teams](/docs/api/cowork-and-agent-teams) para la parte de producto y [Managed Agents](/docs/api/managed-agents) para la primitiva de bucle alojado.

## Elegir la primitiva adecuada para cada carga

<Steps items={[
  {title: "¿La tarea es realmente paralelizable?", body: "Si las subtareas pueden ejecutarse sin esperar los resultados de las demás — auditar un repositorio, investigar un tema en muchas fuentes, refactorizar N archivos de forma independiente — una forma de fan-out compensa su coste. Si la tarea es secuencial (editar A, luego leer el resultado de A, luego editar B), cualquier primitiva multiagente añade sobrecoste de síntesis sin beneficio."},
  {title: "¿Necesitas inspeccionar los turnos intermedios?", body: "El multiagente nativo (Ultra, beta multiagente de Responses) oculta los turnos de los subagentes a tu código. Si necesitas rastros de auditoría, atribución de coste por subagente o la capacidad de intervenir a mitad de ejecución, construye tú el fan-out. Los subagentes de Claude Code te dan visibilidad; la beta multiagente de la Responses API no."},
  {title: "¿Los subagentes cruzan una frontera de confianza?", body: "Si las subtareas pertenecen a organizaciones, nubes o proveedores distintos, estás fuera del alcance de cualquier primitiva de un único proveedor. Usa A2A — consulta /docs/models/a2a-protocol-agent-to-agent. El multiagente nativo es intra-modelo; A2A es inter-agente."},
  {title: "¿El coste está acotado o es abierto?", body: "Los árboles multiagente nativos se forman en tiempo de ejecución: no puedes predecir la factura de tokens a partir de la petición. Si tu aplicación tiene un SLA de coste por petición, prefiere un fan-out casero donde controles la anchura del abanico, o fija un tope estricto de max_output_tokens en la raíz."},
  {title: "¿Necesitas los +3–5 puntos de precisión?", body: "Si tu evaluación dice que la tarea se resuelve al 85 % con una sola llamada y que el 90 % marca la diferencia entre lanzar o no, el multiagente nativo es una forma de bajo rozamiento de comprarlo. Si una sola llamada a Sol u Opus ya resuelve la tarea, Ultra es una factura x4 por una ganancia de 0 puntos."}
]} />

## Cuatro modos de fallo que convierten Ultra en una factura x4 por nada

- **Activarlo para tareas secuenciales.** El modelo sigue descomponiendo y sintetizando aunque la tarea no se paralelice. Pagas la sobrecarga de coordinación en un trabajo que nunca la necesitó. Regla práctica: si no puedes explicar qué estaría haciendo el segundo subagente mientras el primero se ejecuta, no actives el multiagente.
- **Dejar la observabilidad por resumen de razonamiento en tu panel.** `reasoning.summary` no se admite en silencio con multiagente. Si tu monitorización depende de él, obtendrás campos vacíos y pensarás que el modelo no razona. Despliega un cambio de esquema *antes* de activar el flag.
- **Usar `max_tool_calls` como límite de seguridad.** También se desactiva en silencio con multiagente. La garantía que creías tener — «como máximo 20 llamadas a herramientas por petición» — desaparece. Aplica los techos de llamadas a herramientas en la capa del adaptador de herramientas, no mediante el parámetro de la petición.
- **Suponer que `max_concurrent_subagents` es un tope de coste.** Limita los subagentes *activos* en un momento dado, no el total generado durante la petición. Una sola llamada Ultra puede generar decenas de subagentes de forma secuencial y seguir respetando un límite `max_concurrent_subagents: 3`. Si tu techo es el coste, añade un max_output_tokens a nivel de petición.

## Lo que el «multiagente nativo» no es

Con él se confunden a menudo dos primitivas cercanas:

- **No es muestreo `n > 1`.** El antiguo parámetro `n` de OpenAI muestrea varias completaciones y las devuelve todas; tú eliges una. El multiagente ejecuta subagentes distintos *haciendo trabajo distinto* y sintetiza sus salidas. Lo primero es muestreo por temperatura; lo segundo es descomposición de tareas.
- **No es inferencia por lotes.** La [batch API](/docs/api/message-batches) procesa en segundo plano muchas peticiones independientes. El multiagente son muchos subagentes *coordinados* dentro de *una* petición interactiva. El batch está orientado al rendimiento; el multiagente, al resultado.

## Hacia dónde va esto

El protocolo A2A (consulta [A2A: el protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent)) cubre el multiagente *entre proveedores*. `multi_agent.enabled: true` cubre el multiagente *dentro del modelo*. El hueco sin cubrir es una primitiva **entre proveedores**: el modelo del proveedor A genera un subagente en el proveedor B y fusiona el resultado; todavía no existe una especificación pública. Cuando llegue, lo hará como A2A más un verbo de traspaso nativo, no como una API nueva en ninguno de los dos lados. Vigila ese espacio.

<Quiz questions={[
  {
    q: "¿Qué limita max_concurrent_subagents en la beta multiagente de Responses?",
    options: [
      "El número total de subagentes que la petición puede llegar a generar",
      "El número de turnos de subagente activos en cualquier momento en todo el árbol, sin contar la raíz",
      "La profundidad del árbol (hasta dónde pueden los subagentes generar sus propios subagentes)",
      "El número de llamadas a herramientas que puede hacer cada subagente"
    ],
    answer: 1,
    explain: "Es un tope de concurrencia sobre los turnos de subagente activos en todo el árbol en un momento dado, y excluye la raíz. No hay un tope fijo para el total de subagentes por petición ni para la profundidad del árbol: el modelo da forma al árbol en tiempo de ejecución."
  },
  {
    q: "Activas el multiagente y tu panel de monitorización muestra de pronto campos de resumen de razonamiento vacíos. ¿Qué ha pasado?",
    options: [
      "El modelo falló en silencio: reintenta la petición",
      "reasoning.summary no se admite cuando multi_agent está activado; la API lo descarta en silencio",
      "Los subagentes se ejecutaron pero la pasada de síntesis agotó el tiempo",
      "Tu cabecera beta es incorrecta"
    ],
    answer: 1,
    explain: "reasoning.summary y max_tool_calls se desactivan en silencio con multiagente activado, y la compactación no se admite. Si la observabilidad o la seguridad dependen de esos parámetros, despliega un cambio de esquema antes de activar el flag."
  },
  {
    q: "Necesitas subagentes en paralelo que se ejecuten en cuentas de clientes distintas de dos proveedores. ¿Qué primitiva es la correcta?",
    options: [
      "Beta multiagente de la Responses API de OpenAI con max_concurrent_subagents: 2",
      "Subagentes de Claude Code",
      "El protocolo A2A, con cada proveedor exponiendo una Agent Card",
      "GPT-5.6 Ultra Mode a través de ChatGPT"
    ],
    answer: 2,
    explain: "El multiagente nativo (Ultra, beta de Responses, subagentes de Claude Code) es intra-modelo o intra-runtime. Cuando los subagentes cruzan una frontera de organización, nube o proveedor, necesitas A2A — consulta /docs/models/a2a-protocol-agent-to-agent."
  },
  {
    q: "¿Cuál de estos es un mal candidato para Ultra Mode / multi_agent.enabled?",
    options: [
      "Auditar una base de código grande en busca de una clase de vulnerabilidad en muchos archivos",
      "Investigación web con múltiples fuentes donde cada una se puede leer de forma independiente",
      "La reescritura de un solo archivo en la que cada edición depende de la anterior",
      "Comparar presentaciones regulatorias de muchas empresas"
    ],
    answer: 2,
    explain: "Las tareas secuenciales, donde el paso B necesita la salida del paso A, no se paralelizan. El multiagente sigue descomponiendo y sintetizando, y añade latencia y 2x+ tokens sin ganancia de precisión. Regla práctica: si no puedes decir qué estaría haciendo el segundo subagente mientras el primero se ejecuta, no lo actives."
  }
]} />

<Flashcards items={[
  {front: "Multiagente nativo (definición de esta página)", back: "Una primitiva de API de primera clase en la que el propio modelo genera y sintetiza N subagentes en paralelo dentro de una petición HTTP. A agosto de 2026, OpenAI es el único proveedor de frontera que ofrece una, mediante multi_agent.enabled en la beta de la Responses API."},
  {front: "Ultra Mode frente a la beta multi_agent", back: "La misma primitiva subyacente, dos superficies. Ultra Mode es el interruptor de consumo en ChatGPT/Codex; la beta multiagente es la API para desarrolladores. No se llama a «Ultra» desde código: se activa el multiagente."},
  {front: "max_concurrent_subagents", back: "Limita cuántos turnos de subagente pueden estar activos a la vez en todo el árbol, sin contar la raíz. No es un tope del total ni de la profundidad. El modelo puede generar muchos más subagentes durante la vida de la petición."},
  {front: "Incompatibilidades silenciosas de parámetros", back: "Con multi_agent.enabled: reasoning.summary no se admite, max_tool_calls no se admite y el endpoint de compactación no se admite. Las tres son silenciosas: la API acepta la petición y descarta la restricción."},
  {front: "Delta de Sol Ultra en Terminal-Bench 2.1", back: "88,8 % (individual) → 91,9 % (Ultra), una ganancia de +3,1 puntos. Coherente con las ganancias de best-of-N que el muestreo en paralelo ha aportado históricamente. Real pero modesta."},
  {front: "Regla de escalado del coste", back: "El multiagente nativo factura de forma aproximadamente lineal con el número de subagentes que genera el modelo, más una pasada de síntesis. Dos subagentes ≈ 2x tokens de salida; cinco ≈ 5x. Actívalo cuando la mejora de precisión justifique el multiplicador, no por defecto."},
  {front: "La respuesta de Anthropic en el mismo terreno", back: "No hay una API simétrica única. Cowork es la superficie de producto, Managed Agents es el bucle alojado, los subagentes de Claude Code son la primitiva de primera clase dentro de la CLI y el fan-out casero sobre la Messages API es la alternativa flexible. Todas exigen que escribas el prompt del coordinador."},
  {front: "Cuándo usar A2A en su lugar", back: "Cuando los subagentes cruzan una frontera de proveedor, nube u organización. El multiagente nativo es intra-modelo; A2A es inter-agente. Se componen: puedes tener un endpoint A2A cuya implementación use internamente multiagente para resolver la tarea delegada."}
]} />

## Fuentes y lecturas adicionales

- [Multi-agent — OpenAI API guide](https://developers.openai.com/api/docs/guides/responses-multi-agent) — la referencia oficial de la beta multiagente de Responses: forma de la petición, semántica de `max_concurrent_subagents`, lista de parámetros no admitidos y cabecera beta.
- [GPT-5.6: Frontier intelligence that scales with your ambition — OpenAI](https://openai.com/index/gpt-5-6/) — entrada de lanzamiento de Sol, Terra, Luna y Ultra Mode, con el posicionamiento de la familia.
- [Previewing GPT-5.6 Sol — OpenAI](https://openai.com/index/previewing-gpt-5-6-sol/) — la página de avance anterior, útil para la metodología de los benchmarks.
- [GPT-5.6 Sol Ultra Mode: 64 Subagents on One Problem — Digital Applied](https://www.digitalapplied.com/blog/gpt-5-6-sol-ultra-mode-64-subagents-2026) — las cuentas de coste lineales tras las cifras de 2x/5x («N agentes pueden quemar hasta N veces los tokens de una ejecución de un solo agente con la misma tarifa por token»), además del valor de trabajo por defecto de 4 agentes y su techo de tokens de «hasta 4x la línea base».
- [How to Use GPT-5.6 Ultra Mode: Multi-Agent Coordination for Complex Tasks — MindStudio](https://www.mindstudio.ai/blog/gpt-5-6-ultra-mode-multi-agent-coordination) — el detalle del valor por defecto de 4 agentes y de los 16 agentes en algunos gráficos.
- [OpenAI Releases GPT-5.6 (Sol, Terra, Luna) — MarkTechPost](https://www.marktechpost.com/2026/07/09/openai-releases-gpt-5-6-a-three-tier-model-family-with-programmatic-tool-calling/) — cobertura del lanzamiento y de la primitiva Programmatic Tool Calling lanzada junto con el multiagente.
- [GPT-5.6 & ChatGPT Work for Claude Users](/docs/models/gpt-5-6-sol-terra-luna) — la página hermana de AILmanac sobre la propia familia de modelos.
- [Cowork & Agent Teams](/docs/api/cowork-and-agent-teams) — el análogo de Anthropic a nivel de producto.
- [Managed Agents](/docs/api/managed-agents) — la primitiva de bucle alojado en Claude.
- [Subagentes de Claude Code](/docs/claude-code/subagents) y [Subagent Fleet Limits](/docs/claude-code/subagent-fleet-limits) — la primitiva de subagentes de primera clase dentro de la CLI.
- [A2A: el protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent) — el hermano entre proveedores; úsalo cuando los subagentes cruzan una frontera de confianza.
- [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) — una primitiva distinta que también se lanzó en el mismo evento de OpenAI (su versión basada en JS), y la versión de Claude en sandbox de Python.

## Siguiente

- [OpenAI Agents API vs Claude Managed Agents](/docs/models/openai-agents-api-vs-managed-agents) — la capa de septiembre de 2026 por encima de esta: sesiones duraderas y sandboxes, comparadas con el bucle alojado de Anthropic
- [A2A: el protocolo Agent-to-Agent](/docs/models/a2a-protocol-agent-to-agent)
