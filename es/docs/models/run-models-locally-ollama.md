# Ejecuta modelos de IA en local con Ollama

> Source: https://derob98.github.io/ailmanac/es/docs/models/run-models-locally-ollama · AILmanac (CC BY 4.0) · last verified 2026-10-21

Ejecuta modelos de pesos abiertos (Llama, Mistral, Qwen…) en tu propia máquina — privado, sin conexión, gratis de ejecutar — con Ollama. Instalación, CLI y llamadas desde código.

<LevelBadge level="intermediate" />

Los modelos de frontera viven en la nube, pero toda una clase de modelos de **pesos abiertos** — Llama, Mistral, Qwen, DeepSeek, Gemma — puedes descargarla y ejecutarla en tu propio portátil o servidor. [Ollama](https://ollama.com/) es la forma más sencilla de hacerlo: una instalación, un comando y un modelo funcionando en local. Esta página te lleva de cero a un modelo en marcha, a llamarlo desde código y a conocer los compromisos, para que no esperes que un modelo local de 7B se comporte como uno de frontera.

<Callout type="objectives" items={[
  "Saber POR QUÉ ejecutarías un modelo en local — y los compromisos honestos frente a los modelos de frontera en la nube",
  "Instalar Ollama y ejecutar tu primer modelo con dos comandos",
  "Usar la CLI básica: pull, run, list, ps, rm, stop",
  "Llamar a tu modelo local desde código mediante la API de Ollama compatible con OpenAI",
  "Entender los requisitos de RAM, los tamaños de modelo y la cuantización, para elegir un modelo que tu máquina pueda ejecutar de verdad",
  "Saber cuándo LM Studio (una interfaz gráfica) es mejor punto de partida",
]} />

## Por qué ejecutar un modelo en local (y cuándo no)

Ejecutar un modelo en tu propio hardware te da cuatro cosas:

- **Privacidad** — tus prompts y tus datos nunca salen de tu máquina. Es la razón por la que los equipos de ámbitos regulados o sensibles recurren a modelos locales. (Consulta la bifurcación privacidad/autoalojamiento en [Elegir un modelo](/docs/models/choosing-a-model).)
- **Sin conexión** — sin internet, sin API, sin depender de caídas. El modelo es un archivo en tu disco.
- **Coste** — sin factura por token. Una vez descargado, ejecutarlo es «gratis» (pagas en electricidad y hardware, no en gasto de API). Si el [gasto en tokens](/docs/power-user/token-economy) es tu limitación a escala, lo local puede ganar.
- **Control** — fija una versión exacta, personaliza el comportamiento e intégralo sin límites de frecuencia ni sorpresas en los términos de servicio.

Los compromisos honestos:

- **Brecha de capacidad.** Un modelo que puedes ejecutar en un portátil (1B–14B parámetros) **no** está en la misma liga que un modelo de frontera en la nube en razonamiento difícil, contexto largo o tareas agénticas. Para muchas tareas cotidianas la brecha es pequeña; para las más difíciles es grande.
- **Hardware.** Los modelos más grandes y capaces necesitan más RAM/VRAM de la que tiene una máquina típica. A menudo eliges el *mayor modelo que tu hardware puede ejecutar*, no el mejor que existe.
- **Lo operas tú.** Sin escalado gestionado, sin actualizaciones automáticas: ese es el precio del control.

Un patrón común y duradero: **prototipa y elige** con una evaluación minúscula (el mismo método que con los modelos en la nube — consulta [Elegir un modelo](/docs/models/choosing-a-model)), usa lo local para trabajo privado/sin conexión/barato a escala y recurre a una API de frontera cuando la tarea de verdad necesite la capacidad extra.

## Instala Ollama y ejecuta tu primer modelo

<Steps items={[
  {title: "Instala Ollama", body: "macOS y Windows: descarga el instalador desde ollama.com/download y ejecútalo. Linux: usa el script de instalación oficial (abajo). Esto instala el comando ollama y un servicio local en segundo plano."},
  {title: "Ejecuta un modelo", body: "ollama run <model> descarga el modelo la primera vez que se usa (pueden ser varios GB) y luego te lleva a un chat interactivo. La primera ejecución es lenta porque descarga los pesos; las siguientes son instantáneas."},
  {title: "Chatea y sal", body: "Escribe un prompt y pulsa Intro. Para salir de la sesión interactiva, escribe /bye (o pulsa Ctrl+D). El modelo se queda en la caché del disco para la próxima vez."},
  {title: "Gestiona lo que has descargado", body: "Usa ollama list para ver los modelos instalados y ollama rm <model> para eliminar uno y recuperar espacio en disco."},
]} />

Instalación en Linux (macOS/Windows usan en su lugar el instalador descargado):

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

<PromptCard title="Descarga y ejecuta un modelo pequeño (buena primera elección)">{`ollama run gemma4:e2b`}</PromptCard>

Ese único comando descarga `gemma4:e2b` — el modelo con el que empieza la propia guía de inicio rápido de Ollama, una variante Gemma 4 de tamaño edge con ~2,3B parámetros *efectivos* y unos pocos GB en disco — e inicia un chat interactivo. Para descargar sin chatear todavía, usa `ollama pull` en su lugar.

<VerifyNote lastVerified="2026-10-21" source="https://docs.ollama.com/quickstart">
Los **nombres de modelo, los tamaños de parámetros disponibles y las etiquetas exactas cambian a menudo** a medida que llegan nuevas versiones. Los nombres usados en esta página — `gemma4:e2b`, `qwen3`, `deepseek-r1`, `gemma3`, `mistral`, `llama3.2` — estaban en la biblioteca de Ollama en la fecha de verificación, junto a novedades como `qwen3.5` y las etiquetas más grandes `12b`/`26b`/`31b` de `gemma4`. Trata cualquier nombre/tamaño concreto como perecedero: consulta la biblioteca actual en <a href="https://ollama.com/library">ollama.com/library</a> para los nombres de pull y tamaños de hoy.
</VerifyNote>

## La CLI básica

Un puñado de comandos cubre casi todo. Ejecuta `ollama --help` para ver la lista completa.

```bash
# Download a model without starting a chat
ollama pull qwen3

# Start an interactive chat (downloads first if needed)
ollama run qwen3

# One-shot: pass the prompt inline, get the answer, exit
ollama run qwen3 "Summarize the CAP theorem in two sentences."

# List models you've downloaded
ollama list

# Show models currently loaded in memory
ollama ps

# Stop a running/loaded model (frees memory)
ollama stop qwen3

# Delete a downloaded model to reclaim disk
ollama rm qwen3
```

Dentro de una sesión interactiva de `ollama run`, escribe `/bye` para salir y `/?` para ver los comandos de la sesión. El servicio en segundo plano que realmente sirve los modelos lo inicia `ollama serve` (la aplicación de escritorio lo inicia por ti automáticamente).

## Llámalo desde código (API compatible con OpenAI)

Esta es la parte que hace que los modelos locales sean realmente útiles en las aplicaciones. El servicio en segundo plano de Ollama expone una API HTTP local en **`http://localhost:11434`**, en el puerto por defecto **11434**. Tiene sus propios endpoints nativos (`/api/generate`, `/api/chat`) **y** una capa **compatible con OpenAI** en `/v1`, de modo que la mayor parte del código escrito para el SDK de OpenAI funciona con tu modelo local cambiando dos líneas.

HTTP directo con `curl` (endpoint nativo):

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e2b",
  "messages": [
    { "role": "user", "content": "Why is the sky blue?" }
  ],
  "stream": false
}'
```

Desde Python con el SDK oficial de OpenAI — basta con apuntar `base_url` a Ollama y pasar cualquier `api_key` no vacía (Ollama exige el campo pero ignora su valor):

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required by the SDK, ignored by Ollama
)

response = client.chat.completions.create(
    model="gemma4:e2b",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "Explain gradient descent in two sentences."},
    ],
)

print(response.choices[0].message.content)
```

Al ser compatible con OpenAI, los mismos patrones que usarías con una API alojada se mantienen — incluidos el streaming y el [uso de herramientas / function calling](/docs/api/tool-use), que funcionan en local igual que en la nube (siempre que el modelo sea realmente bueno en ello). La capa `/v1` de Ollama cubre `/v1/chat/completions`, `/v1/completions`, `/v1/responses`, `/v1/models` (y `/v1/models/{model}`) y `/v1/embeddings`.

## Hardware, tamaños de modelo y cuantización

El número que verás junto a un modelo — **1B, 7B, 8B, 70B** — es su **cantidad de parámetros** (en miles de millones). Más parámetros suele significar más capaz *y* más hambriento de memoria. El límite práctico de lo que puedes ejecutar es la **RAM** (y en una GPU, la **VRAM**).

La **cuantización** es el truco clave que lo hace viable en máquinas normales. Los pesos del modelo se almacenan originalmente en alta precisión (p. ej., 16 bits), pero pueden comprimirse a ~4 bits con un coste de calidad pequeño, a menudo apenas perceptible. Ollama distribuye la mayoría de los modelos cuantizados por defecto, y por eso un modelo con miles de millones de parámetros cabe en unos pocos GB. Una regla general aproximada (verifícala en la página del modelo concreto):

- Modelos de **~1B–3B**: funcionan cómodamente en la mayoría de los portátiles modernos (unos pocos GB de RAM).
- Modelos de **~7B–8B**: el punto óptimo entre capaz y ejecutable; calcula varios GB de RAM libre.
- Modelos de **~13B–14B**: necesitan una máquina bastante bien equipada.
- Modelos de **~70B+**: necesitan una estación de trabajo/servidor con mucha RAM o una GPU potente — no es territorio típico de portátil.

Una receta práctica: empieza con un modelo pequeño (`gemma4:e2b`), confirma el flujo de principio a fin y luego *sube* al mayor modelo que siga funcionando con fluidez en tu hardware — no al mayor que exista.

<Flashcards title="Vocabulario de modelos locales" cards={[
  {front: "Pesos (weights)", back: "Los números aprendidos (parámetros) que SON el modelo. Ejecutar un modelo en local significa cargar su archivo de pesos en memoria y calcular con él."},
  {front: "Modelo de pesos abiertos", back: "Un modelo cuyos pesos puedes descargar y ejecutar tú mismo (Llama, Mistral, Qwen, DeepSeek, Gemma) — el requisito previo para poder ejecutar en local."},
  {front: "Parámetros (p. ej., 7B)", back: "El número de pesos, en miles de millones. Más alto = en general más capaz y más hambriento de memoria. La palanca principal para saber si tu máquina puede ejecutarlo."},
  {front: "Cuantización", back: "Comprimir los pesos a menor precisión (p. ej., 16 bits → 4 bits) para que el modelo quepa en mucha menos RAM, con un pequeño coste de calidad. Por eso los modelos de miles de millones de parámetros caben en unos pocos GB."},
  {front: "Ventana de contexto", back: "Cuántos tokens (prompt + salida) puede considerar el modelo a la vez. Los modelos locales suelen tener un contexto utilizable menor que los de frontera, y un contexto mayor cuesta más memoria."},
  {front: "Etiqueta de cuantización (p. ej., q4)", back: "Una etiqueta en una variante de modelo que indica su compromiso entre precisión y tamaño — menos bits = más pequeño y rápido, más bits = más cerca de la calidad completa."},
]} />

## LM Studio: una alternativa con interfaz gráfica

Si la línea de comandos no es lo tuyo, **[LM Studio](https://lmstudio.ai/)** es una aplicación de escritorio (macOS, Windows, Linux) que hace el mismo trabajo mediante una interfaz gráfica: explorar y descargar modelos abiertos, chatear con ellos en una interfaz integrada y — como Ollama — ejecutar un **servidor local compatible con OpenAI** para que tu código pueda comunicarse con él. Es la puerta de entrada más fácil para quienes no desarrollan o prefieren apuntar y hacer clic en lugar del terminal; Ollama suele ganar cuando quieres una CLI programable por scripts y un servicio ligero en segundo plano. Ambos ejecutan los mismos tipos de modelos de pesos abiertos, así que los conceptos de esta página se trasladan directamente.

<Quiz title="Compruébalo tú mismo" questions={[
  {q: "¿Cuál es el mayor compromiso honesto de ejecutar un modelo en local frente a un modelo de frontera en la nube?", options: ["Los modelos locales no se pueden llamar desde código", "Un modelo local del tamaño de un portátil es menos capaz en tareas difíciles", "Los modelos locales cuestan más por token"], answer: 1, explain: "La brecha de capacidad es el verdadero compromiso: los modelos lo bastante pequeños para ejecutarse en local van por detrás de los modelos de frontera en la nube en las tareas de razonamiento/agénticas más difíciles. El acceso desde código y el coste por token son, en realidad, ventajas de lo local."},
  {q: "¿Qué comando descarga un modelo (si hace falta) Y empieza a chatear con él?", options: ["ollama pull gemma4:e2b", "ollama serve gemma4:e2b", "ollama run gemma4:e2b"], answer: 2, explain: "ollama run descarga la primera vez que se usa y luego abre una sesión interactiva. ollama pull solo descarga; ollama serve inicia el servicio en segundo plano."},
  {q: "Para llamar a tu modelo local desde código con el SDK de OpenAI, ¿qué configuras?", options: ["Una clave de API de OpenAI real y de pago", "base_url en http://localhost:11434/v1 y cualquier api_key no vacía", "Nada — funciona automáticamente contra api.openai.com"], answer: 1, explain: "Apunta base_url al endpoint local /v1 de Ollama y pasa cualquier api_key no vacía (Ollama exige el campo pero ignora su valor)."},
  {q: "¿Por qué un modelo con miles de millones de parámetros puede caber en solo unos pocos GB de RAM?", options: ["Los parámetros se transmiten desde la nube", "La cuantización comprime los pesos a menor precisión", "Ollama solo carga una parte del modelo"], answer: 1, explain: "La cuantización almacena los pesos con menor precisión (p. ej., 4 bits en lugar de 16), reduciendo la huella de memoria con un pequeño coste de calidad."},
]} />

<Callout type="takeaways" items={[
  "Local = privacidad + sin conexión + sin coste por token + control; el compromiso es una brecha de capacidad real y los límites del hardware.",
  "Dos comandos te ponen en marcha: instala Ollama y luego ollama run gemma4:e2b.",
  "CLI básica: pull (descargar), run (chatear), list, ps, stop, rm — eso es casi todo.",
  "Llámalo desde código mediante el endpoint compatible con OpenAI: base_url http://localhost:11434/v1, cualquier api_key no vacía.",
  "El número de parámetros + la cuantización deciden si tu máquina puede ejecutar un modelo — empieza pequeño y sube hasta lo que funcione con fluidez.",
  "¿Prefieres una interfaz gráfica? LM Studio hace el mismo trabajo apuntando y haciendo clic, y también expone un servidor local compatible con OpenAI.",
]} />

## Fuentes y lecturas adicionales

- [Ollama](https://ollama.com/) — sitio oficial y descargas.
- [Biblioteca de modelos de Ollama](https://ollama.com/library) — modelos actuales y sus nombres/tamaños de pull exactos.
- [Referencia de la CLI de Ollama](https://docs.ollama.com/cli) · [Documentación de la API de Ollama](https://docs.ollama.com/api) — referencia autorizada de comandos y endpoints.
- [Entrada del blog de Ollama sobre compatibilidad con OpenAI](https://ollama.com/blog/openai-compatibility) — el endpoint `/v1` y el uso del SDK.
- [Ollama en GitHub](https://github.com/ollama/ollama) — código fuente, incidencias y documentación detallada.
- [LM Studio](https://lmstudio.ai/) — alternativa con interfaz gráfica para ejecutar modelos locales.

## Siguiente

- Antes de dar acceso a herramientas a un modelo descargado → [Pesos abiertos con puerta trasera: la cadena de suministro de los modelos «abliterados»](/docs/security/backdoored-open-weights) — el GGUF que descargas suele ser el tercer eslabón de una cadena de confianza de tres partes
- ¿Vas a pasar un prompt de sistema grande de Claude a un modelo local? → [Por qué un prompt de sistema de 35 KB se rompe en un modelo local](/docs/models/large-system-prompts-on-local-models)
- ¿Hasta dónde puede bajar la cuantización por debajo de 4 bits? → [Cuantización ternaria en la práctica: Bonsai 2 27B en 5,95 GB](/docs/models/ternary-quantization-bonsai-2-27b) — 1,75 bits por peso, y por qué Ollama no puede cargarlo
- Decide local o nube para una tarea → [Elegir un modelo](/docs/models/choosing-a-model)
- Haz que las herramientas funcionen también en local → [Uso de herramientas](/docs/api/tool-use)
- Observa lo que cuesta realmente ejecutar modelos → [Economía de tokens](/docs/power-user/token-economy)
