import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router';
import { Provider } from './components/ui/provider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider defaultTheme="dark">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
