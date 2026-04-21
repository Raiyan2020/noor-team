import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X, Phone, Mail, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../services/bookings/useBookings';
import { BookingStatus, ApiBooking } from '../services/bookings/bookings.api';
import { translations, Locale } from '../services/i18n';

interface AppointmentsPageProps {
  lang?: Locale;
}

const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ lang = 'ar' }) => {
  const navigate = useNavigate();
  const perPage = 100; // Fetch more to filter by date locally
  const t = translations[lang];

  const { isLoading, apiRows } = useBookings(lang, 'upcoming', perPage);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);

  // Filter appointments by selected date

  const appointments = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return apiRows.filter((booking) => booking.start_date === dateStr);
  }, [apiRows, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleBookingClick = (booking: ApiBooking) => {
    if (booking.user) {
      setSelectedBooking(booking);
    }
  };

  const closePopup = () => {
    setSelectedBooking(null);
  };

  const renderSkeleton = () => (
    <div className="space-y-4 pb-24">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-[24px] border border-gray-100 animate-pulse">
          <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-full bg-app-bg pt-6 px-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">{t.appointments}</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">{t.todaysSchedule}</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-app-gold">
          <Calendar size={20} />
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between mb-6">
        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-app-text transition-colors">
          <ChevronRight size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
        </button>
        <span className="text-sm font-bold text-app-text">{formatDateDisplay(currentDate)}</span>
        <button onClick={handleNextDay} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-app-text transition-colors">
          <ChevronLeft size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="space-y-4 pb-24">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">{t.noAppointmentsToday}</p>
            </div>
          ) : (
            appointments.map((booking) => {
              const status: BookingStatus = (booking.status as BookingStatus) || 'upcoming';
              const isCompleted = status === 'completed';

              return (
                <div
                  key={booking.id}
                  className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => handleBookingClick(booking)}
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${isCompleted ? 'bg-green-500' : 'bg-app-gold'}`} />

                  <div className="flex justify-between items-start mb-4 pr-3">
                    <div className="flex items-start gap-3">
                      {/* User Info */}
                      {booking.user && (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <img
                            src={booking.user.photo ? booking.user.photo.replace(/\\\//g, '/') : `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user.name)}&background=random`}
                            alt={booking.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user?.name || 'User')}&background=random`;
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-app-text text-lg">{booking.user?.name || booking.booking_number || `#${booking.id}`}</h3>
                        <p className="text-xs text-app-textSec font-medium mt-1 line-clamp-1">{booking.service || '—'}</p>
                        {booking.booking_number && <p className="text-[10px] text-gray-400 mt-0.5">{booking.booking_number}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-app-gold bg-app-gold/5 px-2 py-1 rounded-lg">
                        <Clock size={14} />
                        <span className="text-xs font-bold font-mono pt-0.5" dir="ltr">{booking.start_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pr-3 pt-2 border-t border-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {isCompleted ? t.completed : t.upcoming}
                    </span>
                    <span className="text-xs font-bold text-app-text">{booking.final_price || 23} {t.currency}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* User Details Popup */}
      {selectedBooking && selectedBooking.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={closePopup}>
          <div
            className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl overflow-hidden animate-scaleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-lg mb-4">
                <img
                  src={selectedBooking.user.photo ? selectedBooking.user.photo.replace(/\\\//g, '/') : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.user.name)}&background=random`}
                  alt={selectedBooking.user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.user?.name || 'User')}&background=random`;
                  }}
                />
              </div>

              {/* Name & ID */}
              <h2 className="text-xl font-bold text-app-text mb-1">{selectedBooking.user.name}</h2>
              <span className="text-xs font-medium text-app-gold bg-app-gold/10 px-3 py-1 rounded-full mb-6">
                ID: {selectedBooking.user.id}
              </span>

              {/* Contact Info */}
              <div className="w-full space-y-3 mb-8">
                {selectedBooking.user.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-semibold text-gray-600" dir="ltr">{selectedBooking.user.phone}</span>
                  </div>
                )}

                {selectedBooking.user.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                      <Mail size={14} />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 truncate">{selectedBooking.user.email}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(`/client/${selectedBooking.user!.id}`)}
                className="w-full py-4 bg-app-primary text-white text-white rounded-2xl font-bold text-sm shadow-lg shadow-app-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ backgroundColor: '#483383' }}
              >
                <span>{t.clientProfile}</span>
                <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
