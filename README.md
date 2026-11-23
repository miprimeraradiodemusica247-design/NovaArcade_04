# NOVA ARCADE 04

Plataforma web de juegos online en español.

## Producción
- Web: https://novaarcade04.vercel.app
- Panel de administración: https://novaarcade04.vercel.app/#admin
- Sitemap: https://novaarcade04.vercel.app/sitemap.xml

## Repositorio y arquitectura
- Repositorio: https://github.com/miprimeraradiodemusica247-design/NovaArcade_04
- Frontend estático: `public/index.html`
- API serverless: `api/`
- Rutas y cabeceras de Vercel: `vercel.json`
- Base de datos y autenticación: proyecto Supabase independiente de NOVA ARCADE 03.
- Sincronización del catálogo Playgama: función programada en Supabase.

## Desarrollo
Este proyecto no requiere un proceso de compilación para servir el frontend estático. Las rutas API se ejecutan en Vercel.

Antes de desplegar:
1. Ejecutar `node --check` sobre los archivos JavaScript de `api/`.
2. Validar la sintaxis del JavaScript de navegador y el JSON-LD de `public/index.html`.
3. Comprobar las rutas SEO de `vercel.json`.
4. Confirmar que no se han añadido archivos `.env` ni credenciales al repositorio.

Los controles automáticos están definidos en `.github/workflows/quality.yml`.

## Operación y seguridad
La configuración operativa de autenticación, permisos, variables de entorno, recuperación de contraseña y comprobaciones de producción está documentada en [README-AUTH-SUPABASE.txt](README-AUTH-SUPABASE.txt).

No introducir claves secretas, tokens, contraseñas ni URLs privadas de webhooks en el frontend o en el repositorio. No compartir ni reutilizar credenciales de NOVA ARCADE 03.

## Datos
Los juegos y los usuarios se conservan en el proyecto Supabase de NOVA ARCADE 04. No ejecutar limpiezas, reinicializaciones ni migraciones destructivas sin copia de seguridad y autorización explícita.
