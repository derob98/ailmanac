<div align="center">

# AILmanac

### La guía de Claude y de las herramientas de IA que te dice cuándo se revisó cada página por última vez.

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Italiano](./README.it.md)

**[Lee el sitio en español](https://derob98.github.io/ailmanac/es/)**

</div>

---

Las herramientas de IA cambian cada semana, y casi ninguna guía dice cuándo se escribió. AILmanac es una guía libre y abierta sobre **Claude** (las apps, **Claude Code** y la **API**) y sobre los demás modelos y agentes que lo rodean. Cada página indica su nivel, está escrita en lenguaje sencillo y muestra la fecha en que se verificó con su fuente.

> [!NOTE]
> AILmanac es un proyecto independiente. No está afiliado a Anthropic, ni patrocinado ni respaldado por Anthropic. "Claude" y "Anthropic" son marcas de Anthropic. Si AILmanac y la [documentación oficial](https://docs.anthropic.com) no coinciden, vale la documentación oficial.

## Úsalo dentro de Claude Code

Dos comandos añaden la guía a Claude Code como plugin:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

Después, en cualquier sesión:

- **Haz una pregunta** sobre Claude, Claude Code, la API o MCP. La skill `ailmanac` busca la respuesta en la guía y cita la página con su fecha de verificación, en lugar de responder de memoria.
- **Ejecuta `/ailmanac:claude-md-check`** en un proyecto. Compara tu `CLAUDE.md` con el repositorio que describe y con la forma en que se cargan los archivos de memoria, y propone las correcciones.
- **Siete paquetes de skills por rol** se activan cuando hacen falta: desarrollo, investigación, análisis de datos, escritura, marketing, estudio y productividad diaria.

Las skills solo leen páginas públicas de este sitio. No se envía nada de tu proyecto a AILmanac.

## Lo demás

Las cifras actualizadas, las páginas añadidas recientemente, cómo contribuir y las licencias están en el [README en inglés](./README.md). La guía está traducida a doce idiomas: una página aún sin traducir se muestra en inglés.
