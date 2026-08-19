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

### Heartbeat de la VM

La VM `automatizacion` ejecuta `scripts/rafaops-vm-heartbeat.py` cada 15 minutos mediante el `crontab` del usuario. Recoge únicamente estado operativo: Docker, n8n, workflows activos, ejecuciones agregadas, uptime, RAM, disco y suspensión. No publica IPs, logs, credenciales ni contenido procesado.

La VM autentica mediante una deploy key con acceso exclusivo a este repositorio y escribe `rafaops/vm-status.json` en la rama `rafaops-telemetry`. El dashboard consulta esa rama; `main` y GitHub Pages no se reconstruyen con cada heartbeat.
