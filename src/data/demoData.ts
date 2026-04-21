
export interface TeamClient {
  id: string;
  name: string;
  phone: string;
  notes: string;
  totalVisits: number;
  lastVisit: string;
}

export interface TeamAppointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  time: string; // 24h format HH:mm
  date: string; // YYYY-MM-DD
  status: 'upcoming' | 'completed' | 'canceled' | 'no_show';
  duration: number; // minutes
}

export interface TeamSubscription {
  id: string;
  clientId: string;
  title: string;
  totalSessions: number;
  usedSessions: number;
  status: 'active' | 'expired';
}

const CLIENTS: TeamClient[] = [
  { id: 'c1', name: 'أمل العتيبي', phone: '90001234', notes: 'تفضل القهوة بدون سكر، بشرة حساسة', totalVisits: 5, lastVisit: '2023-10-15' },
  { id: 'c2', name: 'سارة الكندري', phone: '55551234', notes: '', totalVisits: 12, lastVisit: '2023-10-20' },
  { id: 'c3', name: 'نورة المطيري', phone: '66667777', notes: 'تحب الهدوء أثناء الجلسة', totalVisits: 3, lastVisit: '2023-09-01' },
];

// Generate some appointments around today
const generateAppointments = (): TeamAppointment[] => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    { id: 'a1', clientId: 'c1', clientName: 'أمل العتيبي', serviceName: 'علاج شعر ملكي', time: '10:00', date: formatDate(today), status: 'upcoming', duration: 60 },
    { id: 'a2', clientId: 'c2', clientName: 'سارة الكندري', serviceName: 'منيكير وبديكير', time: '11:30', date: formatDate(today), status: 'upcoming', duration: 45 },
    { id: 'a3', clientId: 'c3', clientName: 'نورة المطيري', serviceName: 'مكياج سهرة', time: '14:00', date: formatDate(today), status: 'upcoming', duration: 90 },
    { id: 'a4', clientId: 'c1', clientName: 'أمل العتيبي', serviceName: 'استشارة', time: '09:00', date: formatDate(yesterday), status: 'completed', duration: 30 },
    { id: 'a5', clientId: 'c2', clientName: 'سارة الكندري', serviceName: 'قص شعر', time: '16:00', date: formatDate(tomorrow), status: 'upcoming', duration: 60 },
  ];
};

const APPOINTMENTS = generateAppointments();

const SUBSCRIPTIONS: TeamSubscription[] = [
  { id: 's1', clientId: 'c1', title: 'باقة علاج الشعر (5 جلسات)', totalSessions: 5, usedSessions: 2, status: 'active' },
  { id: 's2', clientId: 'c2', title: 'باقة العناية بالأظافر', totalSessions: 10, usedSessions: 9, status: 'active' },
];

export const teamData = {
  getAppointmentsByDate: (date: string) => {
    return APPOINTMENTS.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  },
  
  getClientById: (id: string) => {
    return CLIENTS.find(c => c.id === id);
  },

  getClientAppointments: (clientId: string) => {
    return APPOINTMENTS.filter(a => a.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date));
  },

  getClientActiveSubscriptions: (clientId: string) => {
    return SUBSCRIPTIONS.filter(s => s.clientId === clientId && s.status === 'active');
  },

  updateAppointmentStatus: (id: string, status: TeamAppointment['status']) => {
    const idx = APPOINTMENTS.findIndex(a => a.id === id);
    if (idx !== -1) {
      APPOINTMENTS[idx].status = status;
    }
  }
};
