NOVA ARCADE 04 — Documentación operativa

PROYECTO PRINCIPAL
- Web: https://novaarcade04.vercel.app
- GitHub: https://github.com/miprimeraradiodemusica247-design/NovaArcade_04
- Supabase project ref: eyntsvwjesmxzfkuxukj
- Vercel project: novaarcade_04

ARQUITECTURA
- Frontend estático en public/index.html.
- API routes en api/.
- Datos persistentes en Supabase: public.games y public.admin_users.
- Autenticación con Supabase Auth (email/contraseña).
- La autorización de administrador se determina por la fila de public.admin_users cuyo user_id coincide exactamente con auth.uid().
- Los juegos publicados son legibles públicamente; las operaciones de administración requieren una sesión autenticada y pertenencia a admin_users.
- Las notificaciones se envían exclusivamente mediante /api/notify. Las URLs de Discord permanecen en variables secretas del servidor.
- El catálogo se sincroniza desde Playgama mediante private.sync_playgama_catalog(), programado cada 10 minutos.

VARIABLES DE ENTORNO DE VERCEL
Configurar en Project Settings > Environment Variables:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- WEBHOOK_1_CATALOGO
- WEBHOOK_2_SEGURIDAD

No guardar claves secretas, service_role keys, tokens ni URLs privadas de webhooks en el repositorio o en public/index.html. La publishable key puede estar en el cliente; nunca sustituirla por una secret/service_role key.

ADMINISTRACIÓN
- Iniciar sesión desde https://novaarcade04.vercel.app/#admin.
- Crear una cuenta no concede permisos de administrador.
- El acceso requiere que el UUID de Auth exista previamente en public.admin_users.
- No insertar, borrar ni cambiar administradores desde el cliente.
- No compartir contraseñas, tokens de sesión ni claves con terceros.
- La cuenta administrativa existente está asociada al correo configurado en Supabase Auth; el inicio de sesión real debe probarse desde el navegador.

RECUPERACIÓN DE CONTRASEÑA
La interfaz actual no incluye un flujo de recuperación propio. Para recuperar el acceso, utilizar el flujo de recuperación de Supabase Auth desde el panel del proyecto 04 o implementar y probar el flujo de recuperación de extremo a extremo antes de depender de él. No borrar ni recrear el usuario administrador: se perdería la correspondencia de UUID con admin_users.

SEGURIDAD Y OPERACIÓN
- No habilitar acceso público a admin_users.
- Mantener RLS y las políticas actuales de public.games y public.admin_users.
- Revisar la tabla private.playgama_sync_runs antes de activar RLS: actualmente no tiene RLS y requiere una política compatible con la ejecución del cron.
- Activar leaked password protection si el plan de Supabase lo permite (Pro o superior).
- Probar las notificaciones en Discord con una sesión administrativa real; el endpoint /api/health solo confirma que las variables están configuradas, no que Discord haya recibido un mensaje.
- No introducir credenciales de NOVA ARCADE 03. Este proyecto utiliza su propio Supabase independiente.

DESPLIEGUE
- Vercel conectado al repositorio NovaArcade_04, rama main.
- Root Directory: raíz del repositorio.
- Output Directory: public.
- Framework Preset: Other.
- No se requiere comando de build ni instalación.
- Comprobar /api/health, /sitemap.xml, /robots.txt y una ficha de juego después de cada cambio relevante.
