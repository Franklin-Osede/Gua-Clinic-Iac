import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App'

// Props del widget
export interface GuaWidgetProps {
  locale?: string
  theme?: string
  baseUrl?: string
}

class GuaWidget extends HTMLElement {
  private root: ReactDOM.Root | null = null
  private props: GuaWidgetProps = {}

  connectedCallback() {
    // Obtener props de los atributos
    this.props = {
      locale: this.getAttribute('locale') || 'es',
      theme: this.getAttribute('theme') || 'light',
      baseUrl: this.getAttribute('base-url') || ''
    }

    // Crear contenedor
    const mount = document.createElement('div')
    mount.id = 'gua-widget-container'
    this.appendChild(mount)

    // Renderizar React app
    this.root = ReactDOM.createRoot(mount)
    this.root.render(<App {...this.props} />)

    // Emitir evento ready
    this.dispatchEvent(new CustomEvent('ready', { 
      detail: { 
        widget: this,
        props: this.props
      } 
    }))
  }

  disconnectedCallback() {
    this.root?.unmount()
  }

  // Método para actualizar props
  updateProps(newProps: Partial<GuaWidgetProps>) {
    this.props = { ...this.props, ...newProps }
    
    // Re-renderizar si está montado
    if (this.root) {
      this.root.render(<App {...this.props} />)
    }
  }

  // Método para emitir eventos
  emitEvent(eventName: string, data?: any) {
    this.dispatchEvent(new CustomEvent(eventName, { 
      detail: data 
    }))
  }
}

// Registrar el custom element
customElements.define('gua-widget', GuaWidget)

// Exportar para uso programático
export { GuaWidget }
export default GuaWidget

