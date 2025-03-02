import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { updateSchema } from './lib/supabase';

// Veritabanı şemasını güncelle
updateSchema().then((success) => {
  console.log('Veritabanı şeması kontrol edildi:', success ? 'Başarılı' : 'Başarısız');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);