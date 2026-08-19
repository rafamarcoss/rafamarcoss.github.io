#!/usr/bin/env python3
"""Collect safe VM telemetry and publish it to the dedicated telemetry branch."""

from __future__ import annotations

import json
import os
import shutil
import socket
import sqlite3
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPOSITORY = Path("/home/rafamarcoss/rafaops-publisher")
DATABASE = Path("/home/rafamarcoss/n8n-data/storage/database.sqlite")
OUTPUT = REPOSITORY / "rafaops" / "vm-status.json"
BRANCH = "rafaops-telemetry"
DEPLOY_KEY = Path("/home/rafamarcoss/.ssh/rafaops_github_ed25519")
NIGHT_AGENT_STATUS = Path("/home/rafamarcoss/night-agent-status.json")


def run(command: list[str], timeout: int = 15) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def service(service_id: str, name: str, status: str, detail: str) -> dict:
    return {"id": service_id, "name": name, "status": status, "detail": detail}


def docker_telemetry() -> tuple[list[dict], dict]:
    services: list[dict] = []
    docker_info = run(["docker", "info", "--format", "{{.ServerVersion}}"])
    if docker_info.returncode != 0:
        services.append(service("docker", "Docker Engine", "failed", "Daemon no disponible"))
        services.append(service("n8n-container", "Contenedor n8n", "failed", "No se puede inspeccionar"))
        return services, {"containerRestarts": None, "n8nVersion": None}

    services.append(service("docker", "Docker Engine", "healthy", f"v{docker_info.stdout.strip()}"))
    inspect = run(["docker", "inspect", "n8n"])
    if inspect.returncode != 0:
        services.append(service("n8n-container", "Contenedor n8n", "failed", "Contenedor ausente"))
        return services, {"containerRestarts": None, "n8nVersion": None}

    container = json.loads(inspect.stdout)[0]
    state = container.get("State", {})
    running = state.get("Status") == "running"
    restarts = int(container.get("RestartCount") or 0)
    services.append(service(
        "n8n-container",
        "Contenedor n8n",
        "healthy" if running else "failed",
        f"{state.get('Status', 'unknown')} · {restarts} reinicios",
    ))

    version_result = run(["docker", "exec", "n8n", "n8n", "--version"], timeout=20) if running else None
    version = version_result.stdout.strip().splitlines()[-1] if version_result and version_result.returncode == 0 else None
    return services, {"containerRestarts": restarts, "n8nVersion": version}


def n8n_http_check() -> tuple[dict, int | None]:
    started = time.monotonic()
    try:
        request = urllib.request.Request(
            "http://127.0.0.1:5678/healthz",
            headers={"User-Agent": "RafaOps-VM/1.0"},
        )
        with urllib.request.urlopen(request, timeout=8) as response:
            body = json.loads(response.read().decode("utf-8"))
        latency = round((time.monotonic() - started) * 1000)
        healthy = response.status == 200 and body.get("status") == "ok"
        return service("n8n-http", "n8n healthz", "healthy" if healthy else "failed", f"HTTP {response.status} · {latency} ms"), latency
    except Exception as error:  # The error type is less useful than the failed probe.
        return service("n8n-http", "n8n healthz", "failed", error.__class__.__name__), None


def n8n_database_stats(now: datetime) -> tuple[dict, dict]:
    stats = {
        "activeWorkflows": None,
        "executions24h": None,
        "successfulExecutions24h": None,
        "failedExecutions24h": None,
        "lastExecution": None,
    }
    try:
        connection = sqlite3.connect(f"file:{DATABASE}?mode=ro", uri=True, timeout=3)
        active = connection.execute("select count(*) from workflow_entity where active=1").fetchone()[0]
        cutoff = (now - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        grouped = dict(connection.execute(
            "select status, count(*) from execution_entity where startedAt >= ? group by status",
            (cutoff,),
        ).fetchall())
        latest = connection.execute(
            "select startedAt, stoppedAt, status, workflowId from execution_entity order by startedAt desc limit 1"
        ).fetchone()
        connection.close()
        total = sum(grouped.values())
        failed = int(grouped.get("error", 0) + grouped.get("crashed", 0))
        success = int(grouped.get("success", 0))
        stats.update({
            "activeWorkflows": active,
            "executions24h": total,
            "successfulExecutions24h": success,
            "failedExecutions24h": failed,
            "lastExecution": {
                "startedAt": latest[0],
                "stoppedAt": latest[1],
                "status": latest[2],
                "workflowId": latest[3],
            } if latest else None,
        })
        return service("n8n-workflows", "Workflows n8n", "healthy", f"{active} activos · {total} ejecuciones/24 h"), stats
    except (OSError, sqlite3.Error) as error:
        return service("n8n-workflows", "Workflows n8n", "unknown", error.__class__.__name__), stats


def host_metrics() -> dict:
    memory_info = {}
    for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
        key, value = line.split(":", 1)
        memory_info[key] = int(value.strip().split()[0]) * 1024
    memory_total = memory_info["MemTotal"]
    memory_available = memory_info["MemAvailable"]
    disk = shutil.disk_usage("/")
    uptime = int(float(Path("/proc/uptime").read_text(encoding="utf-8").split()[0]))
    return {
        "uptimeSeconds": uptime,
        "load1": round(os.getloadavg()[0], 2),
        "memoryUsedBytes": memory_total - memory_available,
        "memoryTotalBytes": memory_total,
        "diskUsedBytes": disk.used,
        "diskTotalBytes": disk.total,
    }


def power_check() -> dict:
    targets = ["sleep.target", "suspend.target", "hibernate.target", "hybrid-sleep.target"]
    active = [target for target in targets if run(["systemctl", "is-active", target], timeout=5).stdout.strip() == "active"]
    return service(
        "power",
        "Política de energía",
        "failed" if active else "healthy",
        "Activo: " + ", ".join(active) if active else "Objetivos de suspensión inactivos",
    )


def night_agent_check() -> tuple[dict, dict | None]:
    if not NIGHT_AGENT_STATUS.is_file():
        return service("night-agent", "Night agent", "unknown", "Sin ejecuciones todavía"), None
    try:
        payload = json.loads(NIGHT_AGENT_STATUS.read_text(encoding="utf-8"))
        allowed = {
            key: payload.get(key)
            for key in (
                "schemaVersion", "runId", "status", "goalLabel", "iteration",
                "maxIterations", "score", "targetScore", "updatedAt", "worktreeName", "summary",
            )
        }
        active = allowed.get("status") in {"planning", "dispatching", "working"}
        detail = f"{allowed.get('status', 'unknown')} · iteración {allowed.get('iteration', 0)}/{allowed.get('maxIterations', 0)}"
        return service("night-agent", "Night agent", "healthy" if active else "unknown", detail), allowed
    except (OSError, ValueError, TypeError) as error:
        return service("night-agent", "Night agent", "unknown", error.__class__.__name__), None


def collect() -> dict:
    now = datetime.now(timezone.utc)
    services, docker_metrics = docker_telemetry()
    http_service, latency = n8n_http_check()
    database_service, n8n_metrics = n8n_database_stats(now)
    night_service, night_agent = night_agent_check()
    services.extend([http_service, database_service, power_check(), night_service])
    critical_failed = any(item["status"] == "failed" and item["id"] in {"docker", "n8n-container", "n8n-http"} for item in services)
    return {
        "schemaVersion": 1,
        "generatedAt": iso(now),
        "host": socket.gethostname(),
        "health": "incident" if critical_failed else "operational",
        "summary": "n8n o Docker necesitan atención" if critical_failed else "VM y n8n responden correctamente",
        "metrics": {**host_metrics(), **docker_metrics, "n8nLatencyMs": latency, **n8n_metrics},
        "agentLoop": night_agent,
        "services": services,
    }


def publish(payload: dict) -> None:
    if not REPOSITORY.is_dir() or not DEPLOY_KEY.is_file():
        raise RuntimeError("RafaOps publisher is not installed")
    git_env = os.environ.copy()
    git_env["GIT_SSH_COMMAND"] = f"ssh -i {DEPLOY_KEY} -o IdentitiesOnly=yes"
    pull = subprocess.run(
        ["git", "pull", "--ff-only", "origin", BRANCH],
        cwd=REPOSITORY,
        env=git_env,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if pull.returncode != 0:
        raise RuntimeError(f"Telemetry pull failed: {pull.stderr.strip()}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run(["git", "add", "rafaops/vm-status.json"], cwd=REPOSITORY, check=True)
    changed = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPOSITORY, check=False).returncode == 1
    if not changed:
        return
    subprocess.run(
        ["git", "commit", "-m", f"ops: VM heartbeat {payload['generatedAt']}"],
        cwd=REPOSITORY,
        check=True,
        capture_output=True,
        text=True,
    )
    push = subprocess.run(
        ["git", "push", "origin", BRANCH],
        cwd=REPOSITORY,
        env=git_env,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )
    if push.returncode != 0:
        raise RuntimeError(f"Telemetry push failed: {push.stderr.strip()}")


def main() -> int:
    try:
        payload = collect()
        publish(payload)
        print(f"{payload['generatedAt']} RafaOps VM: {payload['health']}")
        return 0
    except Exception as error:
        print(f"RafaOps VM failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
