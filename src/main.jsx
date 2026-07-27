import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from '@/App';
import { supabase } from '@/lib/customSupabaseClient';
import '@/index.css';

// Manejador global para capturar y silenciar reyecciones de promesas no manejadas,
// específicamente el error conocido del SDK de Supabase Realtime al reconectar o enviar
// latidos de corazón (heartbeat) con un token JWT expirado.
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = typeof reason === 'string'
    ? reason
    : (reason?.message || reason?.toString() || '');

  if (message.includes('InvalidJWTToken') || message.includes('JWT claim "exp"')) {
    event.preventDefault(); // Evita el log de "Uncaught (in promise)" en la consola de producción/desarrollo
    console.warn('Realtime: Capturado y silenciado error de token expirado en segundo plano. Solicitando actualización de sesión...');
    
    // Solicita la actualización de la sesión de manera asíncrona si hay un usuario activo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.refreshSession().catch(() => {});
      }
    }).catch(() => {});
  }
});

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error desconocido en la aplicacion.',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root crash captured:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#050510', color: '#f5f5f5', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Se produjo un error al iniciar la app</h1>
          <p style={{ color: '#a7a8c7', marginBottom: '8px' }}>Reinicia la aplicacion. Si el error continua, vuelve a instalar la ultima version de prueba interna.</p>
          <p style={{ color: '#ff9aa2', fontSize: '14px' }}>{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const routerProps = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootErrorBoundary>
    <Router {...routerProps}>
      <App />
    </Router>
  </RootErrorBoundary>
);
