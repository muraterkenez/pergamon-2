import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Barcode as Barn, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
}

export function Sidebar({ menuItems }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [farmName, setFarmName] = useState<string>('Çiftlik Yönetimi');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFarmName();
    }
  }, [user]);

  const fetchFarmName = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching farm name:', error);
        return;
      }

      if (data && data.name) {
        setFarmName(data.name);
      }
    } catch (err) {
      console.error('Error fetching farm name:', err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Barn className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-bold">{farmName}</h1>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar for desktop */}
      <div className={cn(
        "bg-white shadow-lg flex-shrink-0 z-30",
        "fixed md:static inset-y-0 left-0 transform transition-transform duration-300 ease-in-out",
        "md:translate-x-0 md:w-64",
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
      )}>
        <div className="p-6 md:pt-6 pt-16">
          <div className="flex items-center gap-3">
            <Barn className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold">{farmName}</h1>
          </div>
        </div>
        <nav className="mt-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors",
                location.pathname === item.path && "bg-blue-50 text-blue-600"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}