import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initLocalStorageEncryption } from './utils/crypto.ts';

// Enable transparent AES-encryption for data-at-rest in localStorage
initLocalStorageEncryption();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
