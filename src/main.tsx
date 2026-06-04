import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensa en profundidad: si un error de render escapa (p. ej. una violación de las
// reglas de hooks), React desmonta todo el árbol y el usuario ve una PANTALLA BLANCA
// que solo se recupera recargando. Este límite de error muestra una UI recuperable
// en su lugar, de modo que ningún fallo deje al usuario ante una página en blanco.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary] Error de render capturado:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: '#0b1220', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ocurrió un problema al cargar la aplicación</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 420, margin: 0 }}>
            Puedes reintentar sin perder tu borrador. Si el problema persiste, recarga la página.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
