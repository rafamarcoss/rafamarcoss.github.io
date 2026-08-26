# Google Search Console

Esta integración usa solo la API oficial de Google Search Console. Envía el sitemap y consulta el estado de indexación de las URLs. No solicita indexación individual, no usa la Google Indexing API y no automatiza el navegador.

## Google Cloud

1. Crea o selecciona un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Activa **Google Search Console API** en ese proyecto.
3. En **IAM y administración → Cuentas de servicio**, crea una Service Account.
4. En la cuenta, crea una clave de tipo JSON y descárgala en una ubicación segura fuera de este repositorio.
5. Copia el email de la Service Account. Tiene un formato parecido a `name@project-id.iam.gserviceaccount.com`.

## Search Console

La propiedad es una **Domain Property**: `sc-domain:rafaelmarcos.tech`. Añade el email de la Service Account como usuario de la propiedad con acceso completo (rol Owner / Full access) para enviar sitemaps y usar URL Inspection.

Los scripts usan exactamente `sc-domain:rafaelmarcos.tech` como `siteUrl`; el sitemap enviado es `https://rafaelmarcos.tech/sitemap.xml`.

## GitHub Actions

En el repositorio abre **Settings → Secrets and variables → Actions**. Crea este secret con el JSON completo de la Service Account:

`GSC_SERVICE_ACCOUNT_JSON`

El workflow `.github/workflows/gsc-monitor.yml` se ejecuta una vez al día y también admite ejecución manual. En la ejecución manual, activa `submit_sitemap` solo cuando quieras volver a enviar `https://rafaelmarcos.tech/sitemap.xml`. La inspección corre siempre después.

El workflow no publica cambios ni guarda informes. Una URL aún no indexada se muestra en el resumen, pero no hace fallar el job. Fallan la autenticación, permisos, cuota o errores reales de la API.

## Uso local

No copies la clave JSON al repositorio. En PowerShell, para una sesión temporal:

```powershell
$env:GSC_SERVICE_ACCOUNT_JSON = Get-Content -Raw 'C:\ruta-segura\service-account.json'
npm run gsc:submit
npm run gsc:inspect
```

En macOS o Linux:

```bash
export GSC_SERVICE_ACCOUNT_JSON="$(cat /ruta-segura/service-account.json)"
npm run gsc:submit
npm run gsc:inspect
```

Para inspeccionar solo URLs concretas:

```bash
node scripts/gsc-inspect.mjs https://rafaelmarcos.tech/copywriting/
```

Para guardar un informe local temporal:

```bash
npm run gsc:inspect -- --json
```

El archivo queda en `reports/gsc-index-status.json`. `reports/`, `node_modules/` y nombres habituales de credenciales locales están ignorados por Git.

## Límites

La URL Inspection API consulta el estado conocido por Google; no fuerza rastreo ni indexación. El script procesa las URLs secuencialmente y espera 350 ms entre llamadas para no consumir cuota de forma agresiva. Enviar un sitemap es una señal para Google, no una garantía de rastreo o indexación.
