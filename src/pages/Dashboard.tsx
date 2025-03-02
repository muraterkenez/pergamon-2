import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cog as Cow,
  Milk,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEvents } from '../hooks/useEvents';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, tasks, loading: eventsLoading, error: eventsError } = useEvents();
  const [animalStats, setAnimalStats] = useState({
    total: 0,
    cattle: 0, // Büyükbaş
    sheep: 0,  // Küçükbaş
    active: 0,
    male: 0,
    female: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAnimalStats();
  }, []);

  const fetchAnimalStats = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('animals')
        .select('*');

      if (fetchError) throw fetchError;

      const animals = data || [];
      
      // Hayvan istatistiklerini hesapla
      const stats = {
        total: animals.length,
        cattle: animals.filter(a => ['Holstein', 'Simental', 'Jersey', 'Angus', 'Hereford', 'Montofon', 'Şarole', 'Limuzin'].includes(a.breed)).length,
        sheep: animals.filter(a => !['Holstein', 'Simental', 'Jersey', 'Angus', 'Hereford', 'Montofon', 'Şarole', 'Limuzin'].includes(a.breed)).length,
        active: animals.filter(a => a.status === 'active').length,
        male: animals.filter(a => a.gender === 'male').length,
        female: animals.filter(a => a.gender === 'female').length
      };

      setAnimalStats(stats);
    } catch (err) {
      console.error('Error fetching animal stats:', err);
      setError(err instanceof Error ? err : new Error('Veriler yüklenirken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  if (loading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || eventsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Veri yüklenirken bir hata oluştu</h3>
        <p className="text-gray-600 mt-2">{(error || eventsError)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Cow className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Hayvan Dağılımı</h3>
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Büyükbaş</span>
              <span className="text-sm font-medium">{animalStats.cattle}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${animalStats.total > 0 ? (animalStats.cattle / animalStats.total) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center mt-3 mb-1">
              <span className="text-sm font-medium">Küçükbaş</span>
              <span className="text-sm font-medium">{animalStats.sheep}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${animalStats.total > 0 ? (animalStats.sheep / animalStats.total) * 100 : 0}%` }}
              ></div>
            </div>
            
            <p className="text-2xl font-bold mt-3">Toplam: {animalStats.total}</p>
          </div>
        </div>

        <DashboardCard
          icon={<Milk className="h-8 w-8 text-green-600" />}
          title="Günlük Süt Üretimi"
          value="2,500 L"
          trend="+3%"
          description="Dünden bugüne"
        />
        <DashboardCard
          icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
          title="Aylık Gelir"
          value="₺125,000"
          trend="+12%"
          description="Geçen aya göre"
        />
        <DashboardCard
          icon={<AlertCircle className="h-8 w-8 text-red-600" />}
          title="Sağlık Kontrolleri"
          value={tasks.filter(t => t.type === 'health' && t.urgent).length.toString()}
          description="Bekleyen kontrol"
          urgent
        />
      </div>

      {/* Alt Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Takvim */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Etkinlik Takvimi</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: tr })}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square p-2" />
              ))}
              
              {days.map((day) => {
                const dayEvents = events.filter(event => 
                  format(parseISO(event.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                );
                
                return (
                  <div
                    key={day.toString()}
                    className={`aspect-square p-2 border border-gray-100 ${
                      !isSameMonth(day, currentMonth)
                        ? 'text-gray-300'
                        : isToday(day)
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="text-sm">{format(day, 'd')}</div>
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`mt-1 text-xs px-1 py-0.5 rounded-full truncate
                          ${event.type === 'health' ? 'bg-red-100 text-red-700' : ''}
                          ${event.type === 'vaccination' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${event.type === 'quality' ? 'bg-green-100 text-green-700' : ''}
                          ${event.type === 'finance' ? 'bg-purple-100 text-purple-700' : ''}
                        `}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Yaklaşan Görevler */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Yaklaşan Görevler</h2>
            <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm">
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-4">
            {tasks.slice(0, 5).map(task => (
              <TaskItem
                key={task.id}
                icon={
                  task.type === 'health' ? <Activity className="h-5 w-5 text-red-600" /> :
                  task.type === 'vaccination' ? <Calendar className="h-5 w-5 text-yellow-600" /> :
                  task.type === 'quality' ? <Activity className="h-5 w-5 text-green-600" /> :
                  <DollarSign className="h-5 w-5 text-purple-600" />
                }
                title={task.title}
                description={task.description}
                date={formatDistanceToNow(parseISO(task.date), { addSuffix: true, locale: tr })}
                urgent={task.urgent}
              />
            ))}
            {tasks.length === 0 && (
              <p className="text-gray-500 text-center py-4">Yaklaşan görev bulunmuyor</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: string;
  description?: string;
  urgent?: boolean;
}

function DashboardCard({ icon, title, value, trend, description, urgent }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        {icon}
        {trend && (
          <span className="text-sm font-medium text-green-600">{trend}</span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className={`text-2xl font-bold mt-2 ${urgent ? 'text-red-600' : ''}`}>{value}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}

interface TaskItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  date: string;
  urgent?: boolean;
}

function TaskItem({ icon, title, description, date, urgent }: TaskItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div className="flex-1">
        <h3 className={`text-sm font-medium ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
      {urgent && (
        <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full">
          Acil
        </span>
      )}
    </div>
  );
}