<?php
/**
 * Plugin Name: GUA Clinic Widget
 * Description: Widget para sistema de citas médicas GUA Clinic
 * Version: 1.0.7
 * Author: GUA Clinic
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

class GuaClinicWidget {
    private static $scripts_enqueued = false;
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('gua_clinic_widget', array($this, 'render_widget'));
        // También intentar cargar scripts en wp_enqueue_scripts como fallback
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    public function init() {
        // Registrar shortcode
        add_shortcode('gua_clinic_widget', array($this, 'render_widget'));
        
        // Registrar bloque Gutenberg para facilitar el uso
        $this->register_gutenberg_block();
    }
    
    /**
     * Registra un bloque Gutenberg reutilizable para el widget
     * Esto permite que los editores inserten el widget sin memorizar el shortcode
     * El bloque usa el shortcode estándar de WordPress para renderizar
     */
    private function register_gutenberg_block() {
        // Solo registrar si Gutenberg está disponible (WordPress 5.0+)
        if (!function_exists('register_block_type')) {
            return;
        }
        
        // Registrar bloque dinámico que renderiza el shortcode
        register_block_type('gua-clinic/widget', array(
            'attributes' => array(
                'locale' => array(
                    'type' => 'string',
                    'default' => 'es',
                ),
                'theme' => array(
                    'type' => 'string',
                    'default' => 'light',
                ),
                'api_url' => array(
                    'type' => 'string',
                    'default' => 'https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod',
                ),
            ),
            'render_callback' => array($this, 'render_gutenberg_block'),
            'category' => 'widgets',
            'title' => 'GUA Clinic Widget',
            'description' => 'Inserta el widget de citas médicas GUA Clinic',
            'icon' => 'calendar-alt',
            'keywords' => array('citas', 'widget', 'gua', 'clinic'),
        ));
    }
    
    /**
     * Renderiza el bloque Gutenberg (usa el mismo shortcode internamente)
     * Esto asegura que el bloque siempre use la misma lógica que el shortcode
     */
    public function render_gutenberg_block($attributes) {
        // Construir atributos del shortcode
        $shortcode_atts = array();
        if (!empty($attributes['locale'])) {
            $shortcode_atts[] = 'locale="' . esc_attr($attributes['locale']) . '"';
        }
        if (!empty($attributes['theme'])) {
            $shortcode_atts[] = 'theme="' . esc_attr($attributes['theme']) . '"';
        }
        if (!empty($attributes['api_url'])) {
            $shortcode_atts[] = 'api_url="' . esc_attr($attributes['api_url']) . '"';
        }
        
        // Construir el shortcode completo
        $shortcode = '[gua_clinic_widget';
        if (!empty($shortcode_atts)) {
            $shortcode .= ' ' . implode(' ', $shortcode_atts);
        }
        $shortcode .= ']';
        
        // Renderizar el shortcode (esto carga los scripts automáticamente)
        return do_shortcode($shortcode);
    }
    
    /**
     * Carga los scripts y estilos del widget
     * Se llama automáticamente cuando se renderiza el shortcode
     */
    private function enqueue_widget_assets() {
        // Evitar cargar múltiples veces
        if (self::$scripts_enqueued) {
            return;
        }
        
        // Cargar CSS PRIMERO (crítico para que Tailwind y estilos funcionen)
        $css_url = plugins_url('style.css', __FILE__);
        $css_path = plugin_dir_path(__FILE__) . 'style.css';
        if (file_exists($css_path)) {
            $css_version = '1.0.7-' . filemtime($css_path);
            // ⚠️ IMPORTANTE: Cargar CSS con prioridad alta y sin dependencias
            wp_enqueue_style(
                'gua-widget-css',
                $css_url,
                array(), // Sin dependencias para evitar conflictos
                $css_version,
                'all'
            );
        }
        
        // Cargar JavaScript
        $widget_url = plugins_url('gua-widget.iife.js', __FILE__);
        $widget_path = plugin_dir_path(__FILE__) . 'gua-widget.iife.js';
        
        // Si no existe localmente, usar CDN como fallback
        if (!file_exists($widget_path)) {
            $widget_url = 'https://cdn.gua.com/gua-widget.js';
            $version = '1.0.7';
        } else {
            // Agregar timestamp para evitar caché del navegador
            $version = '1.0.7-' . filemtime($widget_path);
        }
        
        wp_enqueue_script(
            'gua-widget',
            $widget_url,
            array(),
            $version,
            true
        );
        
        self::$scripts_enqueued = true;
    }
    
    /**
     * Intenta cargar scripts en wp_enqueue_scripts como fallback
     * Esto ayuda cuando el shortcode está en bloques de Gutenberg o widgets
     * Mejorado para no depender de caché - siempre verifica el contenido actual
     */
    public function enqueue_scripts() {
        // Intentar detectar el shortcode de varias formas (sin depender de caché)
        $should_load = false;
        
        // Método 1: Verificar en contenido del post actual (sin caché)
        if (is_singular()) {
            $post = get_post();
            if ($post) {
                // Obtener contenido fresco, no desde caché
                $content = $post->post_content;
                if (has_shortcode($content, 'gua_clinic_widget') || 
                    strpos($content, '[gua_clinic_widget') !== false) {
                    $should_load = true;
                }
            }
        }
        
        // Método 2: Verificar en bloques de Gutenberg (sin caché)
        if (!$should_load && is_singular()) {
            $post = get_post();
            if ($post && has_blocks($post->post_content)) {
                // Buscar el shortcode en los bloques directamente
                $content = $post->post_content;
                if (strpos($content, 'gua_clinic_widget') !== false ||
                    strpos($content, '[gua_clinic_widget') !== false) {
                    $should_load = true;
                }
            }
        }
        
        // Método 3: Verificar en widgets/sidebars (sin caché)
        if (!$should_load) {
            // Buscar en todos los sidebars activos - renderizar sin caché
            global $wp_registered_sidebars;
            if (is_array($wp_registered_sidebars)) {
                foreach ($wp_registered_sidebars as $sidebar) {
                    if (is_active_sidebar($sidebar['id'])) {
                        // Renderizar sidebar sin caché para detectar shortcode
                        ob_start();
                        dynamic_sidebar($sidebar['id']);
                        $sidebar_content = ob_get_clean();
                        if (strpos($sidebar_content, 'gua_clinic_widget') !== false ||
                            strpos($sidebar_content, '[gua_clinic_widget') !== false) {
                            $should_load = true;
                            break;
                        }
                    }
                }
            }
        }
        
        // Método 4: Verificar en la página actual completa (último recurso)
        if (!$should_load) {
            // Obtener el contenido completo de la página sin caché
            global $wp_query;
            if ($wp_query && $wp_query->is_main_query()) {
                // Verificar en el output buffer si está disponible
                $current_content = ob_get_contents();
                if ($current_content && (
                    strpos($current_content, 'gua_clinic_widget') !== false ||
                    strpos($current_content, '[gua_clinic_widget') !== false
                )) {
                    $should_load = true;
                }
            }
        }
        
        if ($should_load) {
            $this->enqueue_widget_assets();
        }
    }
    
    public function render_widget($atts) {
        // ⚠️ CRÍTICO: Cargar scripts cuando se renderiza el shortcode
        // Esto asegura que los scripts se carguen incluso si wp_enqueue_scripts no los detectó
        $this->enqueue_widget_assets();
        
        // Atributos por defecto
        $atts = shortcode_atts(array(
            'locale' => 'es',
            'theme' => 'light',
            'api_url' => 'https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod' // API Gateway HTTP API v2
        ), $atts);
        
        // Generar ID único para el contenedor
        $container_id = 'gua-widget-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" class="gua-widget-container">
            <div class="gua-widget-loading">
                <p>Cargando sistema de citas...</p>
            </div>
        </div>
        
        <script>
        (function() {
            // Esperar a que el DOM esté completamente listo
            function initWidget() {
                const container = document.getElementById('<?php echo esc_js($container_id); ?>');
                
                if (!container) {
                    console.error('GUA Widget: Container not found');
                    return;
                }
                
                // Crear el elemento del widget
                const widget = document.createElement('gua-widget');
                widget.setAttribute('locale', '<?php echo esc_js($atts['locale']); ?>');
                widget.setAttribute('theme', '<?php echo esc_js($atts['theme']); ?>');
                widget.setAttribute('base-url', '<?php echo esc_js($atts['api_url']); ?>');
                
                // Reemplazar el loading con el widget
                container.innerHTML = '';
                container.appendChild(widget);
                
                // Eventos del widget
                widget.addEventListener('ready', function(event) {
                    console.log('GUA Widget ready:', event.detail);
                });
                
                widget.addEventListener('success', function(event) {
                    console.log('GUA Widget success:', event.detail);
                    // Aquí puedes mostrar notificaciones de éxito
                });
                
                widget.addEventListener('error', function(event) {
                    console.error('GUA Widget error:', event.detail);
                    // Aquí puedes mostrar mensajes de error
                });
            }
            
            // Inicializar cuando el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initWidget);
            } else {
                initWidget();
            }
        })();
        </script>
        
        <style>
        .gua-widget-container {
            width: 100%;
            min-height: 500px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .gua-widget-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 500px;
            background: #f9f9f9;
        }
        
        .gua-widget-loading p {
            margin: 0;
            color: #666;
            font-size: 16px;
        }
        </style>
        <?php
        return ob_get_clean();
    }
}

// Inicializar el plugin
new GuaClinicWidget();

// Hook de activación
register_activation_hook(__FILE__, function() {
    // Crear opciones por defecto si es necesario
});

// Hook de desactivación
register_deactivation_hook(__FILE__, function() {
    // Limpiar opciones si es necesario
});
