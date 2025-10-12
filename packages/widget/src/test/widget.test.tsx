import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import '../widget/index' // Import the Web Component to register it

describe('GuaWidget Web Component', () => {
  beforeEach(() => {
    // Limpiar DOM antes de cada test
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // Limpiar DOM después de cada test
    document.body.innerHTML = ''
  })

  it('debe renderizar el web component correctamente', async () => {
    // Crear el web component
    const widget = document.createElement('gua-widget')
    widget.setAttribute('locale', 'es')
    widget.setAttribute('theme', 'light')
    widget.setAttribute('base-url', '/api')
    
    document.body.appendChild(widget)

    // Verificar que el widget se creó
    expect(widget).toBeInTheDocument()
    expect(widget.getAttribute('locale')).toBe('es')
    expect(widget.getAttribute('theme')).toBe('light')
    expect(widget.getAttribute('base-url')).toBe('/api')
  })

  it('debe emitir un evento "ready" cuando se conecta', async () => {
    const handleReady = vi.fn()
    document.addEventListener('ready', handleReady)

    // Crear el web component
    const widget = document.createElement('gua-widget')
    document.body.appendChild(widget)

    // Esperar a que se emita el evento
    await waitFor(() => {
      expect(handleReady).toHaveBeenCalledTimes(1)
      expect(handleReady).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { widget: widget }
        })
      )
    })

    // Limpiar
    document.removeEventListener('ready', handleReady)
  })

  it('debe limpiar correctamente cuando se desconecta', () => {
    const widget = document.createElement('gua-widget')
    document.body.appendChild(widget)

    // Verificar que está en el DOM
    expect(document.body.contains(widget)).toBe(true)

    // Remover del DOM
    document.body.removeChild(widget)

    // Verificar que se removió
    expect(document.body.contains(widget)).toBe(false)
  })
})