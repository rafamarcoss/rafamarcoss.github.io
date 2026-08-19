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

### Night Agent Loop

El agente nocturno convierte una meta en un bucle evaluado:

1. n8n envía la meta y las evidencias a `deepseek-v4-pro`.
2. DeepSeek devuelve una sola tarea estructurada, sin comandos de shell.
3. Orca crea un Run, una Task y un worktree independiente.
4. Codex implementa el paso y reporta `worker_done`.
5. El runner ejecuta únicamente los tests definidos en el archivo de meta.
6. DeepSeek puntúa el diff, los archivos modificados y los tests. Decide continuar, aceptar o pedir revisión humana.

No hace push, merge, despliegue ni cambios fuera del repositorio. El resultado termina en la tarjeta `in-review` de Orca.

```bash
node scripts/night-agent.mjs plan --goal agent-loop/example.goal.json
node scripts/night-agent.mjs run --goal agent-loop/example.goal.json
node scripts/night-agent.mjs status
node scripts/night-agent.mjs stop
node scripts/night-agent.mjs feedback --goal agent-loop/example.goal.json --text "Mi revisión concreta"
```

El workflow importable está en `n8n/rafaops-night-supervisor.workflow.json`. La clave de OpenCode permanece en la variable `OPENCODE_API_KEY` del contenedor n8n.
