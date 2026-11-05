import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Storefront } from './components/Storefront';
import './index.css';

// /tienda es la tienda online pública; el resto es el sistema de gestión
const isStore = window.location.pathname.replace(/\/+$/, '') === '/tienda';
createRoot(document.getElementById('root')!).render(isStore ? <Storefront /> : <App />);

// La app queda guardada en el equipo para poder abrirla sin internet (solo en producción)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('No se pudo activar el modo sin conexión:', err));
  });
}
