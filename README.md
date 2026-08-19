# rafaelmarcos.tech

Portfolio estático de Rafael Marcos, publicado con GitHub Pages.

## RafaOps

`/rafaops/` es el control plane del laboratorio de automatización. Vigila el portfolio, AI Signal, la integridad del feed y GitHub Actions. Cada ejecución publica estado verificable en `rafaops/status.json`.

La generación diaria usa esta política:

1. Worker especializado para cada tarea.
2. Dos reintentos para errores de transporte.
3. Agente supervisor con otro modelo si falla el JSON o la validación.
4. Fallback final de modelo.
5. Telemetría de intentos, tokens, duración y recuperación.

El workflow manual permite ejecutar `primary_model_failure` en modo `dry_run`. Ese escenario fuerza el fallo del writer principal y comprueba que el supervisor termina la edición sin modificar el feed público.

```bash
node scripts/rafaops-monitor.mjs
node scripts/generate-ai-signal.mjs --dry-run
```

La clave de OpenCode se guarda como `OPENCODE_API_KEY` en GitHub Actions. Nunca se publica en el repositorio ni en la telemetría.
