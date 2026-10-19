import '@fontsource-variable/exo-2/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/board.css';
import './styles/layout.css';
import './styles/panel.css';
import './styles/dialog.css';
import './styles/home.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { preloadPieces } from './ui/pieceArt';

preloadPieces();

const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento #root');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
