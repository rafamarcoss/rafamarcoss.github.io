# SEO técnico — auditoría y estado

Documentación de la arquitectura de enlazado interno, canonicalización y estado de redirects de `rafaelmarcos.tech`.

## Enlazado interno

Arquitectura objetivo:

```
HOME
├── /articles/
│   ├── AI Agents for Customer Support
│   ├── CRM Automation: 7 Workflows
│   ├── AI Agents vs Traditional Automation
│   └── What Is SaaS Automation
└── /copywriting/
```

Estado (auditado en agosto 2026):

- **Home** enlaza a `/articles/` y `/copywriting/` en el nav, el menú móvil y el footer.
- **`/articles/`** enlaza a los 4 artículos (cards).
- **`/copywriting/`** enlaza a los 4 artículos (Selected Writing).
- **Cada artículo** tiene al menos 2 enlaces internos contextuales en el cuerpo + un CTA natural a `/copywriting/`.
- Los artículos se enlazan entre sí por relación semántica real:

| Artículo | Enlaces contextuales |
|---|---|
| AI Agents for Customer Support | AI Agents vs Traditional Automation, CRM Automation, What Is SaaS Automation |
| AI Agents vs Traditional Automation | AI Agents for Customer Support, What Is SaaS Automation |
| CRM Automation: 7 Workflows | What Is SaaS Automation, AI Agents vs Traditional Automation, AI Agents for Customer Support |
| What Is SaaS Automation | AI Agents vs Traditional Automation, CRM Automation |

Los enlaces se mantienen en las fuentes Markdown (`content/articles/*.md`) y se regeneran con `npm run build:articles`.

## Canonicalización y redirects

Auditoría con peticiones HTTP reales (GitHub Pages + Cloudflare en DNS):

| Variante | HTTP | Redirects | Final |
|---|---|---|---|
| `http://rafaelmarcos.tech/` | 200 | 0 | `http://rafaelmarcos.tech/` ⚠️ |
| `http://www.rafaelmarcos.tech/` | 200 | 1 | `http://rafaelmarcos.tech/` ⚠️ |
| `https://www.rafaelmarcos.tech/` | 200 | 1 | `https://rafaelmarcos.tech/` ✓ |
| `https://rafaelmarcos.tech/` | 200 | 0 | `https://rafaelmarcos.tech/` ✓ |

Canonical HTML (consistente en todas las variantes):

- `/` → `<link rel="canonical" href="https://rafaelmarcos.tech/">`
- `/articles/ai-agents-for-customer-support/` → `<link rel="canonical" href="https://rafaelmarcos.tech/articles/ai-agents-for-customer-support/">`

### Estado

- **www → non-www**: funciona (1 redirect, resuelto por GitHub Pages/Cloudflare).
- **HTTP → HTTPS**: NO se fuerza. `http://` devuelve 200 (no 301). El canonical HTML ya apunta a HTTPS, pero lo correcto es forzar el salto a nivel de edge.
- Sin loops. Máximo un salto de redirect.

### Configuración externa requerida (Cloudflare)

La web está detrás de **Cloudflare** (los A/AAAA del apex y de www son de Cloudflare). GitHub Pages no permite forzar HTTP→HTTPS desde el repositorio (sirve ambos). La solución es en Cloudflare:

1. **Always Use HTTPS**: Dashboard → tu dominio → **SSL/TLS → Edge Certificates → Always Use HTTPS = ON**. Esto emite un 301 de `http://*` a `https://*` en el edge, un solo salto.

No añadir **meta refresh** ni redirects por JavaScript (GitHub Pages no los necesita y son perjudiciales para SEO).

## Monitor Google Search Console

El monitor (`scripts/gsc-inspect.mjs` + `.github/workflows/gsc-monitor.yml`) clasifica cada URL del sitemap:

- `INDEXED` — indexada correctamente.
- `WAITING` — Discovered/Not indexed o Unknown to Google con < 5 días desde publicación/primer avistamiento.
- `ATTENTION` — lo mismo con >= 5 días.
- `ERROR` — error de API, robots bloqueado, fetch fallido, canonical conflict u otro problema técnico.

La antigüedad se calcula con fechas fiables del proyecto (frontmatter de artículos, fecha en la URL de news) o del reporte anterior (`firstSeenAt`), nunca inventada.

El reporte se escribe en `reports/gsc-index-status.json` (gitignored, se persiste entre ejecuciones mediante GitHub Actions artifacts) e incluye por URL: `classification`, `bucket`, `coverageState`, `verdict`, `indexingState`, `robotsTxtState`, `pageFetchState`, `googleCanonical`, `userCanonical`, `lastCrawlTime`, `firstSeenAt`, `daysWaiting`, `previousClassification`, `errors`.

La comparación entre ejecuciones muestra: cambios por bucket (`+N Indexed`, etc.), URLs recién indexadas y URLs que necesitan atención con los días que llevan así. No genera ruido cuando no hay cambios.

`gsc:submit` solo envía el sitemap cuando se solicita explícitamente (`submit_sitemap=true` en el dispatch); la ejecución programada no lo reenvía.