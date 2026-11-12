# Packs de skills y plantillas de SKILL.md

> Source: https://derob98.github.io/ailmanac/es/docs/templates/skills · AILmanac (CC BY 4.0) · last verified 2026-07-20

Agent Skills listas para usar según el tipo de usuario, además de cómo escribir las tuyas.

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-07-20" source="https://code.claude.com/docs/en/skills">
La estructura de los archivos de skill y los lugares donde se pueden usar (Claude Code, Claude.ai, Cowork, sesiones en la nube) evolucionan — confirma los detalles en la documentación oficial de Skills. Los comandos personalizados ahora están fusionados con las skills: los archivos en `.claude/commands/` siguen funcionando, pero la forma recomendada son las skills.
</VerifyNote>

Una **Skill** le da a Claude una experiencia focalizada que carga *bajo demanda* cuando tu petición
coincide — así no tienes que volver a explicar tus necesidades cada vez. AILmanac incluye un conjunto de
**packs de skills listos para usar**, uno por cada tipo de usuario. Aprende el concepto en profundidad en
la página de [Skills](/docs/claude-code/skills).

## Packs ya hechos

Están en la carpeta
[`plugins/ailmanac/skills`](https://github.com/derob98/ailmanac/tree/main/plugins/ailmanac/skills) del repositorio:

| Pack | Para | Qué hace |
|---|---|---|
| `ailmanac` | Cualquiera que pregunte sobre Claude u otras herramientas de IA | Busca la respuesta en esta guía y cita la página con su fecha de verificación |
| `claude-md-check` | Usuarios de Claude Code | Revisa tu `CLAUDE.md` frente a tu repositorio y a cómo se cargan los archivos de memoria |
| `writing-content-pro` | Redactores, marketers, creadores | Brief → borrador por pasadas → adapta tu voz → reutiliza |
| `developer-workflow` | Desarrolladores | Programación con contexto primero, revisiones, pruebas, commits claros |
| `research-analyst` | Investigadores, analistas | Síntesis basada en fuentes con disciplina de citación |
| `data-analyst` | Usuarios de datos y hojas de cálculo | SQL/fórmulas + lecturas en lenguaje claro + comprobaciones estadísticas de sensatez |
| `business-marketing` | Fundadores, propietarios de pymes | Posicionamiento, copy, comunicación con clientes, planificación ligera |
| `student-learning` | Estudiantes y aprendices | Tutoría socrática + enseñar de vuelta (aprende, no solo copies) |
| `everyday-productivity` | Todo el mundo | Correo, resúmenes, planificación, decisiones |

Cada uno incorpora las reglas de la casa: **da contexto, itera y verifica lo que importa.**

## Instálalos (Claude Code)

Todos a la vez, como plugin:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

O copia un solo pack desde un clon del repositorio:

```bash
# personal — available in all your projects
mkdir -p ~/.claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro ~/.claude/skills/

# or per-project — shareable with your team via the repo
mkdir -p .claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro .claude/skills/
```

Claude activa la skill automáticamente cuando tu petición coincide con su
`description`. En Claude.ai / Cowork, crea una skill y pega el
`SKILL.md` del pack (la disponibilidad varía según el plan).

## Escribe la tuya — la plantilla mínima

Una skill es una carpeta con un `SKILL.md`: frontmatter YAML + instrucciones. La
`description` es el **disparador** — escríbela como "Use when…". Solo la `description`
es obligatoria; el nombre del comando sale del nombre de la carpeta.

```markdown
---
description: Use when the user is doing X — be specific about the trigger so Claude knows when to load this and when not to.
---

# My Skill

Short statement of the role/goal.

## Workflow
1. Step one…
2. Step two…

## Rules
- The non-negotiables (accuracy, privacy, output format).

## Default output
What a good response looks like.
```

### Lista de comprobación de validez

- [ ] La carpeta está en kebab-case — se convierte en el `/command-name`.
- [ ] `description` dice **cuándo usarla** (el disparador), no solo qué es. Pon primero el caso de uso principal (la `description` combinada con `when_to_use` se trunca a 1.536 caracteres en el listado de skills).
- [ ] Las instrucciones son específicas y acotadas — una tarea clara.
- [ ] Sin secretos, credenciales ni datos personales o de clientes.
- [ ] Indica cómo gestionar la incertidumbre (no inventar; verificar).

## Relacionado

- [Skills: experiencia bajo demanda](/docs/claude-code/skills) — el concepto completo
- [Comandos de barra personalizados](/docs/claude-code/slash-commands) — estos los activas tú bajo demanda
- [Subagentes](/docs/claude-code/subagents) — delega bloques enteros de trabajo


## Siguiente

- [Configuración de MCP y andamios de servidores](/docs/templates/mcp-config)
