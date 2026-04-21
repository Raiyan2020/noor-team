
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MessageSquare, Calendar, Ticket, CheckCircle2, Loader2, AlertCircle, ChevronDown, Image as ImageIcon, Upload, X, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { DASHBOARD_API_BASE_URL } from '../lib/apiConfig';
import { http } from '../services/http';
import { changeBookingStatus } from '../services/bookings/bookings.api';
import { translations, Locale } from '../services/i18n';

// Types based on API response
interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  photo: string;
  wallet: string;
  lang: string;
  is_active: number;
  is_verify: number;
  created_at: string;
}

interface Session {
  id: number;
  session_number: number;
  status: 'scheduled' | 'completed' | 'pending' | 'cancelled';
  schedule: {
    session_date: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
  };
  customer_notes: string | null;
  created_at: string;
}

interface ServiceTranslation {
  id: number;
  language: string;
  name: string;
  description: string | null;
}

interface Service {
  id: number;
  main_image: string;
  price: string;
  translations: ServiceTranslation[];
}

interface Subscription {
  id: number;
  session_count: number;
  remaining_sessions: number;
  completed_sessions: number | null;
  subscription_name: string;
  service: string;
}

interface RequestOption {
  id: number;
  price: string;
  option: {
    id: number | null;
    name: string | null;
  };
  option_value: {
    id: number;
    value: string | null;
    price: string;
  } | null;
}

interface Request {
  id: number;
  request_number: string;
  status: string;
  sessions_info: {
    session_count: number;
    completed_sessions: number;
    remaining_sessions: number;
    progress: number;
  };
  pricing: {
    base_price: string;
    options_price: string;
    total_price: string;
    discount_amount: string;
    final_price: string;
  };
  validity: {
    start_date: string;
    start_time: string;
    end_date: string;
  };
  service: Service;
  subscription: Subscription;
  sessions: Session[];
  options: RequestOption[];
  created_at: string;
  notes: {
    customer_notes: string | null;
    admin_notes: string | null;
  };
}

interface UserImage {
  id: number;
  image: string;
}

interface UserData {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  photo: string;
  wallet: string;
  requests: Request[];
  questionnaire_responses: QuestionnaireResponse[];
  images: UserImage[];
}

interface Question {
  id: number;
  text: string;
}

interface Answer {
  id: number | null;
  text: string;
}

interface QuestionAnswer {
  id: number;
  question: Question;
  answer: Answer;
  created_at: string;
}

interface QuestionnaireProgress {
  answered_count: number;
  total_questions: number;
  completion_percentage: string;
}

interface QuestionnaireResponse {
  id: number;
  status: string;
  completed_at: string | null;
  progress: QuestionnaireProgress;
  answers: QuestionAnswer[];
}

interface ClientProfilePageProps {
  lang?: Locale;
}

const ClientProfilePage: React.FC<ClientProfilePageProps> = ({ lang = 'ar' }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    subscriptions: false,
    questionnaire: false,
    history: false,
    gallery: false
  });

  const [selectedSession, setSelectedSession] = useState<{ session: Session, request: Request } | null>(null);
  console.log(selectedSession?.request.options);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const additionalTranslations = {
    gallery: lang === 'ar' ? 'معرض الصور' : 'Gallery',
    noImages: lang === 'ar' ? 'لا توجد صور' : 'No images found',
    addImage: lang === 'ar' ? 'إضافة صورة' : 'Add Image',
    uploadImages: lang === 'ar' ? 'رفع الصور' : 'Upload Images',
    selectImages: lang === 'ar' ? 'اختر صور' : 'Select Images',
    uploading: lang === 'ar' ? 'جاري الرفع...' : 'Uploading...',
    uploadSuccess: lang === 'ar' ? 'تم رفع الصور بنجاح' : 'Images uploaded successfully',
    uploadError: lang === 'ar' ? 'حدث خطأ أثناء رفع الصور' : 'Error uploading images',
    dragDrop: lang === 'ar' ? 'اضغط لاختيار الصور' : 'Click to select images',
    maxSize: lang === 'ar' ? 'الحد الأقصى 5 ميجابايت' : 'Max size 5MB',
    remove: lang === 'ar' ? 'حذف' : 'Remove',
    sessionDetails: lang === 'ar' ? 'تفاصيل الجلسة' : 'Session Details',
    options: lang === 'ar' ? 'الإضافات' : 'Options',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
    basePrice: lang === 'ar' ? 'السعر الأساسي' : 'Base Price',
    optionsPrice: lang === 'ar' ? 'سعر الإضافات' : 'Options Price',
    totalPrice: lang === 'ar' ? 'الإجمالي' : 'Total Price',
    finalPrice: lang === 'ar' ? 'السعر النهائي' : 'Final Price',
    discount: lang === 'ar' ? 'الخصم' : 'Discount',
    customerNotes: lang === 'ar' ? 'ملاحظات العميلة' : 'Customer Notes',
    adminNotes: lang === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes',
  };

  const t = { ...translations[lang], ...additionalTranslations };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (clientId) {
      fetchUserProfile(clientId);
    }
  }, [clientId]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await http.get(`${DASHBOARD_API_BASE_URL}/users/${userId}`);

      if (response.data && response.data.data) {
        setUserData(response.data.data);
      } else {
        setError(lang === 'ar' ? 'لم يتم العثور على بيانات العميلة' : 'Client data not found');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(lang === 'ar' ? 'حدث خطأ في تحميل بيانات العميلة' : 'Error fetching client data');
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmAttendance = async (sessionId: number) => {
    setIsConfirming(true);
    try {
      // Call API to confirm attendance (change status to completed)
      const res = await changeBookingStatus(sessionId, 'completed', lang as Locale);

      if (res.ok) {
        // Refresh data after confirmation
        if (clientId) {
          await fetchUserProfile(clientId);
        }
      }
    } catch (err) {
      console.error('Error confirming attendance:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const getServiceName = (service: Service | null | undefined, lang: string): string => {
    if (!service || !service.translations) return t.service;
    const translation = service.translations.find(tr => tr.language === lang);
    return translation?.name || service.translations.find(tr => tr.language === 'en')?.name || service.translations[0]?.name || t.service;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Extract HH:mm from HH:mm:ss
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const validFiles = filesArray.filter((file) => file.type.startsWith('image/'));

      if (validFiles.length !== filesArray.length) {
        toast.error(lang === 'ar' ? 'يجب اختيار صور فقط' : 'Please select images only');
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);

      // Create previews
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      // Revoke old URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !clientId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('user_id', clientId);

      // Compression options
      const options = {
        maxSizeMB: 1, // Maximum file size in MB
        maxWidthOrHeight: 800, // Resize to max 800px (width or height)
        useWebWorker: true,
        fileType: 'image/webp', // Convert to WebP format
        initialQuality: 0.8, // 80% quality
      };

      // Compress each image before uploading
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        try {
          // Compress the image
          const compressedFile = await imageCompression(file, options);

          // Create a new File object with .webp extension
          const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
          const webpFile = new File([compressedFile], fileName, { type: 'image/webp' });

          formData.append(`images[${index}]`, webpFile);
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError);
          // If compression fails, use the original file
          formData.append(`images[${index}]`, file);
        }
      }

      await http.post(`${DASHBOARD_API_BASE_URL}/user-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(t.uploadSuccess);
      setIsUploadModalOpen(false);
      setSelectedFiles([]);
      setPreviews([]);

      // Refresh profile
      fetchUserProfile(clientId);
    } catch (err) {
      console.error('Error uploading images:', err);
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-app-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-app-gold text-white px-6 py-3 rounded-full font-semibold hover:scale-95 transition-transform"
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg text-gray-400 font-semibold">
        {lang === 'ar' ? 'لم يتم العثور على بيانات العميلة' : 'Client data not found'}
      </div>
    );
  }

  // Find the next scheduled session
  const upcomingSession = userData.requests
    ?.flatMap(req => req.sessions || [])
    .find(session => session.status === 'scheduled' && session.schedule.session_date);

  const upcomingRequest = upcomingSession
    ? userData.requests.find(req => req.sessions?.some(s => s.id === upcomingSession.id))
    : null;
  console.log(upcomingRequest);

  return (
    <div className="min-h-full bg-app-bg pt-6 pb-24">
      {/* Navbar */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-app-text hover:bg-gray-50"
        >
          <ArrowRight size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
        </button>
        <span className="font-semibold text-lg">{t.clientProfile}</span>
        <div className="w-10" />
      </div>

      {/* Profile Card */}
      <div className="mx-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6 text-center">
        <div className="w-20 h-20 bg-app-bg rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
          {userData.photo && !userData.photo.includes('unknown.svg') ? (
            <img src={userData.photo.replace(/\\\//g, '/')} alt={userData.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-app-gold text-2xl font-semibold">{userData.name.charAt(0)}</span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-app-text mb-1">{userData.name}</h2>
        <p className="text-sm text-gray-400 font-mono mb-2" dir="ltr">{userData.phone}</p>

        {userData.wallet && parseFloat(userData.wallet) > 0 && (
          <div className="inline-block bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            {t.wallet}: {parseFloat(userData.wallet).toFixed(3)} {t.currency}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <a href={`tel:${userData.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <Phone size={18} />
          </a>
          <a href={`https://wa.me/${userData.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <MessageSquare size={18} />
          </a>
        </div>
      </div>

      {/* Quick Action: Confirm Attendance */}
      {upcomingSession && upcomingRequest && (
        <div className="mx-6 mb-8">
          <div
            onClick={() => setSelectedSession({ session: upcomingSession, request: upcomingRequest })}
            className="bg-[#483383] text-white p-6 rounded-[24px] shadow-xl shadow-[#483383]/20 relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/60 text-xs font-semibold mb-1">{t.upcomingAppointment}</p>
                  <h3 className="text-lg font-semibold">{getServiceName(upcomingRequest.service, lang)}</h3>
                  <p className="text-white/80 text-xs mt-1">
                    {t.sessionNumberOf.replace('{current}', upcomingSession.session_number.toString()).replace('{total}', upcomingRequest.sessions_info.session_count.toString())}
                  </p>

                  {userData.questionnaire_responses && userData.questionnaire_responses.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 bg-white/10 w-fit px-2 py-1.5 rounded-lg border border-white/10">
                      <div className="text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
                      </div>
                      <span className="text-xs text-white/90 font-medium">
                        {userData.questionnaire_responses[0].progress.answered_count}/{userData.questionnaire_responses[0].progress.total_questions} {userData.questionnaire_responses[0].progress.completion_percentage === "100.00" || userData.questionnaire_responses[0].status === 'completed' ? t.completed : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md text-center">
                  <div className="text-xs opacity-80">{formatDate(upcomingSession.schedule.session_date!)}</div>
                  <div className="font-mono font-semibold">{formatTime(upcomingSession.schedule.start_time!)}</div>
                </div>

              </div>

              <button
                onClick={() => handleConfirmAttendance(upcomingSession.id)}
                disabled={isConfirming}
                className="w-full bg-white text-[#483383] py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.confirmAttendanceMessage}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{t.confirmAttendanceAction}</span>
                  </>
                )}
              </button>
            </div>
            {/* Decor */}
            <div className={`absolute top-0 ${lang === 'ar' ? 'right-0 -mr-10' : 'left-0 -ml-10'} w-32 h-32 bg-white/5 rounded-full -mt-10`} />
            <div className={`absolute bottom-0 ${lang === 'ar' ? 'left-0 -ml-10' : 'right-0 -mr-10'} w-24 h-24 bg-white/5 rounded-full -mb-10`} />
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6 px-6">
        {/* Active Subscriptions/Requests */}
        {/* Active Subscriptions/Requests */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('subscriptions')}
            className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-app-text flex items-center gap-2">
              <Ticket size={18} className="text-app-gold" />
              {t.activeSubscriptions}
            </h3>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-300 ${expandedSections.subscriptions ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.subscriptions && (
            <div className="px-5 pb-5">
              {userData.requests && userData.requests.length > 0 ? (
                <div className="space-y-3">
                  {userData.requests.map(request => (
                    <div key={request.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-app-text">{getServiceName(request.service, lang)}</p>
                          <p className="text-xs text-gray-400 mt-1">{t.orderNumber}: {request.request_number}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${request.status === 'completed' ? 'bg-green-50 text-green-600' :
                          request.status === 'active' ? 'bg-blue-50 text-blue-600' :
                            request.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                              'bg-gray-100 text-gray-400'
                          }`}>
                          {request.status === 'completed' ? t.completed :
                            request.status === 'active' ? t.active :
                              request.status === 'pending' ? t.pending : request.status}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-500">{t.progress}</span>
                          <span className="font-semibold text-app-text">
                            {request.sessions_info.completed_sessions} / {request.sessions_info.session_count} {t.sessions}
                          </span>
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-app-gold transition-all"
                            style={{ width: `${request.sessions_info.progress}%` }}
                          />
                        </div>
                      </div>

                      {request.validity.start_date && (
                        <div className="mt-3 text-xs text-gray-500 flex gap-1">
                          <span>{t.validFrom.replace('{date}', formatDate(request.validity.start_date))}</span>
                          {request.validity.end_date && <span> {t.validUntil.replace('{date}', formatDate(request.validity.end_date))}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">{t.noActiveSubscriptions}</p>
              )}
            </div>
          )}
        </div>

        {/* Questionnaire Responses */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('questionnaire')}
            className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-app-text flex items-center gap-2">
              <div className="text-app-gold">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
              </div>
              {t.questionnaireResponses}
            </h3>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-300 ${expandedSections.questionnaire ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.questionnaire && (
            <div className="px-5 pb-5">
              {userData.questionnaire_responses && userData.questionnaire_responses.length > 0 ? (
                <div className="space-y-4">
                  {userData.questionnaire_responses.map((response) => (
                    <div key={response.id} className="space-y-3">
                      {response.answers && response.answers.length > 0 ? (
                        response.answers.map((ans) => (
                          <div key={ans.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-app-text mb-1">{ans.question.text}</p>
                            <p className="text-sm text-gray-600 font-medium">{ans.answer.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2 border-b border-gray-50 last:border-0">{t.clientDidNotAnswer}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">{t.noContentYet}</p>
              )}
            </div>
          )}
        </div>

        {/* Sessions History */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('history')}
            className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-app-text flex items-center gap-2">
              <Calendar size={18} className="text-app-gold" />
              {t.sessions}
            </h3>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-300 ${expandedSections.history ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.history && (
            <div className="px-5 pb-5">
              <div className="space-y-4">
                {userData.requests?.flatMap(req =>
                  req.sessions?.map(session => ({
                    ...session,
                    serviceName: getServiceName(req.service, lang),
                    requestNumber: req.request_number
                  })) || []
                )
                  .filter(session => session.schedule.session_date) // Only show scheduled sessions
                  .sort((a, b) => {
                    // Sort by date desc
                    const dateA = a.schedule.session_date || '';
                    const dateB = b.schedule.session_date || '';
                    return dateB.localeCompare(dateA);
                  })
                  .slice(0, 10) // Show last 10 sessions
                  .map(session => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-app-text">{session.serviceName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <span>{t.sessions} {session.session_number}</span>
                          <span>•</span>
                          <span dir="ltr">{formatDate(session.schedule.session_date!)}</span>
                          {session.schedule.start_time && (
                            <>
                              <span>•</span>
                              <span dir="ltr">{formatTime(session.schedule.start_time)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${session.status === 'completed' ? 'bg-green-50 text-green-600' :
                        session.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                          session.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            session.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {session.status === 'completed' ? t.completed :
                          session.status === 'scheduled' ? t.upcomingStatus :
                            session.status === 'pending' ? t.pending :
                              session.status === 'cancelled' ? t.canceledStatus : session.status}
                      </span>
                    </div>
                  ))}

                {(!userData.requests || userData.requests.flatMap(r => r.sessions || []).filter(s => s.schedule.session_date).length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-4">{t.noScheduledSessions}</p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Gallery Section */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('gallery')}
            className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-app-text flex items-center gap-2">
              <ImageIcon size={18} className="text-app-gold" />
              {t.gallery}
            </h3>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-300 ${expandedSections.gallery ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedSections.gallery && (
            <div className="px-5 pb-5">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 bg-[#483383] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#3d2b70] transition-colors"
                >
                  <Plus size={16} />
                  {t.addImage}
                </button>
              </div>

              {userData.images && userData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userData.images.map((img) => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-gray-100 group relative">
                      <img
                        src={img.image.replace(/\\\//g, '/')}
                        alt="Client gallery"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">{t.noImages}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t.uploadImages}</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Input */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-[#483383]/10 text-[#483383] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{t.dragDrop}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.selectImages}</p>
                </div>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-6 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {translations[lang].cancel}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="px-6 py-3 rounded-xl font-semibold bg-[#483383] text-white hover:bg-[#3d2b70] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading && <Loader2 size={18} className="animate-spin" />}
                {uploading ? t.uploading : t.uploadImages}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-lg">{t.sessionDetails}</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-app-text">{getServiceName(selectedSession.request.service, lang)}</h4>
                  <span className="bg-[#483383] text-white text-xs px-2 py-1 rounded-lg">
                    {selectedSession.session.session_number} / {selectedSession.request.sessions_info.session_count}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(selectedSession.session.schedule.session_date || "")}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {formatTime(selectedSession.session.schedule.start_time || "")}</span>
                </div>
              </div>

              {/* Options */}
              {selectedSession.request.options && selectedSession.request.options.length > 0 && (
                <div>
                  <h4 className="font-semibold text-app-text mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-app-gold rounded-full"></div>
                    {t.options}
                  </h4>
                  <div className="space-y-2">
                    {selectedSession.request.options.map(opt => (
                      <div key={opt.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <span className="text-gray-700 text-sm">
                          {opt.option.name + ":" + opt.option_value?.value || `Option #${opt.id}`}
                        </span>
                        <span className="font-semibold text-app-text text-sm">
                          {parseFloat(opt.price).toFixed(3)} {t.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.basePrice}</span>
                  <span className="font-medium">{parseFloat(selectedSession.request.pricing.base_price || "0").toFixed(3)} {t.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.optionsPrice}</span>
                  <span className="font-medium">{parseFloat(selectedSession.request.pricing.options_price || "0").toFixed(3)} {t.currency}</span>
                </div>


                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>{t.finalPrice}</span>
                  <span>{parseFloat(selectedSession.request.pricing.final_price).toFixed(3)} {t.currency}</span>
                </div>
              </div>

              {/* Notes */}
              {(selectedSession.request.notes.customer_notes || selectedSession.request.notes.admin_notes) && (
                <div>
                  <h4 className="font-semibold text-app-text mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-app-gold rounded-full"></div>
                    {t.notes}
                  </h4>
                  <div className="space-y-3">
                    {selectedSession.request.notes.customer_notes && (
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-600 font-semibold mb-1">{t.customerNotes}</p>
                        <p className="text-sm text-gray-700">{selectedSession.request.notes.customer_notes}</p>
                      </div>
                    )}
                    {selectedSession.request.notes.admin_notes && (
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-semibold mb-1">{t.adminNotes}</p>
                        <p className="text-sm text-gray-700">{selectedSession.request.notes.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfilePage;
