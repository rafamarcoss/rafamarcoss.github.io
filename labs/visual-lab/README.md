# Visual Lab — `/labs/visual-lab/`

Área **aislada** de experimentación visual para `rafaelmarcos.tech`. Permite probar efectos modernos (Motion) y bibliotecas UI (Kokonut UI, Bklit UI) antes de decidir qué entra en producción.

**Nunca toca producción**: la home, `/articles`, `/copywriting`, `/news`, sitemap y robots no se modifican. Todo vive dentro de esta carpeta. Las páginas son `noindex, nofollow` y no aparecen en el sitemap.

---

## Estructura

```
labs/visual-lab/
├── index.html          # Lab principal (sección 01 Motion, vanilla JS)
├── visual-lab.css      # Estilos del lab (mismos tokens que la home)
├── visual-lab.js       # Motion experiments + control panel
├── README.md
├── react-lab/          # Fuente del showcase React (Vite + Tailwind + shadcn)
│   ├── package.json
│   ├── vite.config.js
│   ├── components.json # config shadcn (registries kokonut/bklit)
│   ├── src/
│   │   ├── App.jsx                 # Showcase: secciones 02 Kokonut + 03 Bklit
│   │   ├── index.css               # Tema claro del lab (paleta de la home)
│   │   ├── main.jsx
│   │   ├── lib/
│   │   │   ├── utils.js            # cn() de shadcn
│   │   │   ├── next-image.jsx      # shim de next/image (kokonut usa Next.js)
│   │   │   └── next-link.jsx       # shim de next/link
│   │   ├── components/
│   │   │   ├── kokonutui/          # componentes kokonut (registry oficial)
│   │   │   ├── charts/             # charts bklit (registry oficial @bklit)
│   │   │   └── ui/                 # componentes base shadcn (button, card)
│   │   └── showcase/
│   │       └── kokonut-cardstack.jsx  # copia adaptada de CardStack (datos de integraciones)
│   └── .gitignore                  # ignora node_modules
└── showcase/           # BUILD ESTÁTICO del react-lab (base './', listo para GitHub Pages)
    ├── index.html
    └── assets/
```

---

## Sección 01 — Motion (vanilla)

Experimentos A–F en `visual-lab.js` usando **Motion** (`motion@12`) vía CDN ESM, aislado al lab (patrón CDN igual que anime.js en la home):

| Exp | Nombre | Qué hace |
|---|---|---|
| A | ORIGINAL | card estática (baseline) |
| B | SUBTLE LIFT | `translateY(-3px)` CSS + borde/sombra |
| C | SPRING | spring de Motion (`y:-4, scale:1.015`) |
| D | POINTER RESPONSE | radial suave que sigue al cursor |
| E | SCROLL REVEAL | opacity + `translateY(14px)`, una vez en vista |
| F | BUTTON MICROINTERACTION | hover/press/focus con spring |

**Control panel**: toggles "Motion enabled" y "Reduced motion simulation".

**Reduced motion**: se separan `systemReduced` (media query real, con listener de cambios) y `simulatedReduced` (toggle manual). Condición efectiva:

```js
enabled = state.motion && !state.systemReduced && !state.simulatedReduced
```

**Fix aplicado (Motion)**: la opción correcta de easing en `animate()` es `ease`, no `easing`.

---

## Secciones 02–03 — React Showcase (Kokonut + Bklit)

El lab principal enlaza a `showcase/index.html#kokonut` y `#bklit`.

### Stack
- **Vite 6 + React 18 + Tailwind CSS v4** (`@tailwindcss/vite`).
- **shadcn CLI v4.19** (`components.json`, estilo `base-nova`).
- **Kokonut UI** y **Bklit UI**: instalados desde sus **registries oficiales**.

### Kokonut UI (sección 02)
Registro oficial: `kokonut-labs/kokonutui` → `public/r/*.json` (los usamos vía GitHub raw porque `kokonut.dev` no siempre es alcanzable).

```powershell
npx shadcn@latest add "https://raw.githubusercontent.com/kokonut-labs/kokonutui/main/public/r/<component>.json"
```

Instalados: `bento-grid`, `card-stack`, `smooth-tab`, `spotlight-cards`, `mouse-effect-card` (+ iconos AI auxiliares).

Experimentos:
1. **Bento Grid** — `BentoGrid` real (componente autocontenido, sin props) etiquetado "FlowPilot · Demo SaaS concept".
2. **Card Stack** — `CardStackExample` adaptado: copia en `src/showcase/kokonut-cardstack.jsx` con datos de integraciones (CRM, API workflows, AI agents, analytics). Lógica de motion intacta, solo cambia el array `products`.
3. **Smooth Tabs** — `SmoothTab` con props (`items`, `activeColor`).
4. **Mouse Effect Card** — `MouseEffectCard` con props (`title`, `subtitle`, `topText`).

### Bklit UI (sección 03)
Registro oficial: `@bklit` → `https://ui.bklit.com/r/{name}.json` (añadido con `npx shadcn@latest registry add "@bklit"`).

```powershell
npx shadcn@latest add -y -o "@bklit/<component>"
```

Instalados: `line-chart`, `area-chart`, `bar-chart`, `radar-chart` (+ dependencia `@bklit/shimmering-text`).

Experimentos (dashboard "AI Signal / RafaOps · Telemetry concept", badge **DEMO DATA**, metric cards):
1. **Line Chart** — pipeline runs sobre 14 días (`successful`/`failed`).
2. **Area Chart** — articles/sources procesados en el tiempo.
3. **Bar Chart** — actividad de workflows por categoría.
4. **Radar Chart** — perfil de capacidades (demo telemetry).

Los datos son **demo**, nunca telemetría real.

---

## Cómo ejecutar / construir

```powershell
# Desde react-lab/
cd labs/visual-lab/react-lab

npm install
npm run build      # → genera ../showcase/ (base './', rutas relativas)
npm run dev        # servidor de desarrollo
```

El `showcase/` está commiteado (listo para GitHub Pages sin build en deploy).

Para ver localmente, sirve la raíz del repo:

```powershell
python -m http.server 8000
# http://localhost:8000/labs/visual-lab/
# http://localhost:8000/labs/visual-lab/showcase/
```

---

## Añadir un componente nuevo

### Kokonut
```powershell
npx shadcn@latest add "https://raw.githubusercontent.com/kokonut-labs/kokonutui/main/public/r/<name>.json"
```
Si el componente importa `next/image` o `next/link`, los shims ya están en `src/lib/` y el alias en `vite.config.js`. Si importa otro componente shadcn, instálalo primero (o con `-y -o` para sobrescribir).

### Bklit
```powershell
npx shadcn@latest add -y -o "@bklit/<name>"
```
`-o` evita el prompt de overwrite de `utils`/CSS.

---

## Gotchas / fixes ya aplicados (importante)

1. **`next/image` y `next/link`** — los componentes de kokonut vienen de Next.js. En Vite se resuelven con shims (`src/lib/next-image.jsx`, `next-link.jsx`) y aliases en `vite.config.js`.
2. **`chart-loading-label.jsx` de Bklit** importaba `../components/shimmering-text` (ruta rota del registry). Corregido a `@/components/shimmering-text`.
3. **RadarChart** — `metrics` = array de `{ key, label }`; `data` = array de `{ id, values: { <key>: <value> } }`. Y usa `RadarGrid`/`RadarLabels` además de `RadarArea`/`RadarAxis`.
4. **BarChart** — usa `BarXAxis` (no `XAxis`) y `Grid horizontal`; `Bar` lleva `lineCap="round"`.
5. **CardStack** está hardcodeado (sin prop de datos) → copia adaptada en `src/showcase/kokonut-cardstack.jsx` (solo cambia el array `products`).
6. **BentoGrid** también es autocontenido (sin props, contenido hardcodeado) y usa shims de Next.
7. **CSS**: el build de Bklit puede reescribir `index.css` con tema oscuro y vars duplicadas. `src/index.css` se mantiene como tema claro con las vars `--chart-*` mapeadas a la paleta de la home (teal/blue/coral). Si re-instalas componentes y el CSS se ensucia, re-aplica el `index.css` de este README.
8. **Bundle grande** — Bklit tira de `@visx/*` y `d3`; el JS son ~520 KB (gzip ~172 KB). Para producción habría que code-split y cargar solo el chart necesario.

---

## Validación

Se validó con Playwright (venv de `extractor/`):

```powershell
# desde C:\Users\Rafacha\extractor
.venv\Scripts\python.exe <script>   # carga el lab y el showcase, revisa consola/overflow
```

Checks cubiertos: 0 errores de consola, 0 "Render error", 4 charts renderizando (paths/rects SVG), responsive sin overflow horizontal a 1440/768/375, ratings locales funcionando.

Para el sitio principal: `node scripts/validate-site.mjs` en la raíz.

---

## Bundle sizes (build actual)

| Archivo | Min | gzip |
|---|---|---|
| JS (`showcase/assets/index-*.js`) | ~522 KB | ~172 KB |
| CSS (`showcase/assets/index-*.css`) | ~75 KB | ~12 KB |

---

## Recomendaciones para producción

- **SmoothTab** y **MouseEffectCard** → buenos candidatos: prop-driven, ligeros, limpios.
- **BentoGrid** y **CardStack** → autocontenidos y con contenido hardcodeado; habría que copiar + adaptar los datos (y quitar los shims de Next).
- **Charts de Bklit** → potentes pero pesados (visx/d3); si entran en producción, code-split y cargar solo el chart usado.

---

## URLs

- Lab: `https://rafaelmarcos.tech/labs/visual-lab/`
- Showcase: `https://rafaelmarcos.tech/labs/visual-lab/showcase/`
- Repo: `https://github.com/rafamarcoss/rafamarcoss.github.io` (rama `main`)

Todo el lab es `noindex, nofollow` y no está en el sitemap.