import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Animals } from './pages/Animals';
import { MilkProduction } from './pages/MilkProduction';
import { Health } from './pages/Health';
import { Finance } from './pages/Finance';
import { Pedigree } from './pages/Pedigree';
import { Production } from './pages/Production';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Settings } from './pages/Settings';
import { Cog as Cow, Milk, Stethoscope, DollarSign, Settings as SettingsIcon, LayoutDashboard, Factory } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
}

export default function App() {
  const menuItems = [
    { icon: <LayoutDashboard size={24} />, label: 'Anasayfa', path: '/' },
    { icon: <Cow size={24} />, label: 'Hayvanlar', path: '/animals' },
    { icon: <Milk size={24} />, label: 'Süt Üretimi', path: '/milk-production' },
    { icon: <Factory size={24} />, label: 'Üretim', path: '/production' },
    { icon: <Stethoscope size={24} />, label: 'Sağlık', path: '/health' },
    { icon: <DollarSign size={24} />, label: 'Finans', path: '/finance' },
    { icon: <SettingsIcon size={24} />, label: 'Ayarlar', path: '/settings' },
  ];

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="flex flex-col md:flex-row h-screen bg-gray-100">
                <Sidebar menuItems={menuItems} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-8 pt-20">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/animals" element={<Animals />} />
                    <Route path="/animals/:id/pedigree" element={<Pedigree />} />
                    <Route path="/milk-production" element={<MilkProduction />} />
                    <Route path="/production" element={<Production />} />
                    <Route path="/health" element={<Health />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}