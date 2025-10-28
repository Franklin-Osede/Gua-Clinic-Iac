<?php
/**
 * Plugin Name: GUA Clinic Widget
 * Description: Widget para sistema de citas médicas GUA Clinic
 * Version: 1.0.0
 * Author: GUA Clinic
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

class GuaClinicWidget {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('gua_clinic_widget', array($this, 'render_widget'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    public function init() {
        // Registrar shortcode
        add_shortcode('gua_clinic_widget', array($this, 'render_widget'));
    }
    
    public function enqueue_scripts() {
        // Solo cargar en páginas que usen el shortcode
        if (is_singular() && has_shortcode(get_post()->post_content, 'gua_clinic_widget')) {
            wp_enqueue_script(
                'gua-widget',
                'https://cdn.gua.com/gua-widget.js', // URL del CDN
                array(),
                '1.0.0',
                true
            );
        }
    }
    
    public function render_widget($atts) {
        // Atributos por defecto
        $atts = shortcode_atts(array(
            'locale' => 'es',
            'theme' => 'light',
            'api_url' => 'https://api.guaclinic.com' // URL de producción
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
        document.addEventListener('DOMContentLoaded', function() {
            // Configurar el widget
            const container = document.getElementById('<?php echo esc_js($container_id); ?>');
            
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
        });
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
