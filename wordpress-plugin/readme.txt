=== GUA Clinic Widget ===
Contributors: guaclinic
Tags: medical, appointments, widget, clinic
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Widget para sistema de citas médicas GUA Clinic.

== Description ==

El plugin GUA Clinic Widget permite integrar el sistema de citas médicas en tu sitio WordPress.

**Características:**
* Widget responsive para reserva de citas
* Integración con DriCloud
* Soporte para múltiples idiomas
* Temas personalizables
* API REST integrada

**Uso:**
Usa el shortcode `[gua_clinic_widget]` en cualquier página o post.

**Parámetros:**
* `locale`: Idioma del widget (es, en) - Por defecto: es
* `theme`: Tema del widget (light, dark) - Por defecto: light
* `api_url`: URL de la API - Por defecto: https://api.guaclinic.com

**Ejemplos:**
```
[gua_clinic_widget]
[gua_clinic_widget locale="en" theme="dark"]
[gua_clinic_widget api_url="https://staging-api.guaclinic.com"]
```

== Installation ==

1. Sube el archivo `gua-clinic-widget.php` a la carpeta `/wp-content/plugins/`
2. Activa el plugin desde el panel de administración
3. Usa el shortcode `[gua_clinic_widget]` en tus páginas

== Frequently Asked Questions ==

= ¿Cómo personalizo el widget? =

Usa los parámetros del shortcode:
```
[gua_clinic_widget locale="es" theme="light"]
```

= ¿Puedo usar el widget en múltiples páginas? =

Sí, puedes usar el shortcode en tantas páginas como quieras.

= ¿El widget es responsive? =

Sí, el widget se adapta automáticamente a diferentes tamaños de pantalla.

== Screenshots ==

1. Widget en funcionamiento
2. Configuración del shortcode
3. Widget en móvil

== Changelog ==

= 1.0.0 =
* Lanzamiento inicial
* Widget básico de citas
* Integración con DriCloud
* Soporte para múltiples idiomas

== Upgrade Notice ==

= 1.0.0 =
Primera versión del plugin. Instala para comenzar a usar el sistema de citas.



