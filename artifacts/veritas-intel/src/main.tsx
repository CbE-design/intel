import { createRoot } from 'react-dom/client';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <FirebaseClientProvider>
    <App />
  </FirebaseClientProvider>
);
