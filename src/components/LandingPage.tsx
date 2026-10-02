import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MessageCircle, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Smile, 
  HeartPulse, 
  Lock, 
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { ClinicConfig } from '../../server';

export default function LandingPage() {
  const [clinic, setClinic] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clinic-config')
      .then((res) => res.json())
      .then((data: ClinicConfig) => {
        setClinic(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando clinic-config:', err);
        setLoading(false);
      });
  }, []);

  const clinicName = clinic?.clinicName || 'Consultorio Odontológico Dr. Juan Pérez';
  const doctorName = clinic?.doctorName || 'Dr. Juan Pérez';
  const specialty = clinic?.specialty || 'Odontología Integral, Ortodoncia e Implantes';
  const phone = clinic?.phone || '+54 9 11 1234-5678';
  const whatsappNumber = clinic?.whatsappNumber?.replace(/\D/g, '') || '5491112345678';
  const address = clinic?.address || 'Av. Corrientes 1234, Piso 3, Of. A, CABA';
  const workingHours = clinic?.workingHours || 'Lunes a Viernes de 09:00 a 19:00 hs';
  const services = clinic?.services || [];
  const insurances = clinic?.insurances || ['Particular', 'OSDE', 'Swiss Medical', 'Galeno'];

  const waLink = `https://wa.me/${whatsappNumber}?text=Hola%20${encodeURIComponent(doctorName)},%20quisiera%20consultar%20por%20un%20turno`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      
      {/* 1. TOP BAR */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> {workingHours}
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> {address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Turnos Disponibles Hoy
            </span>
            <Link to="/admin" className="hover:text-white transition flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3" /> Acceso Profesional
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-sky-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  {clinic?.branding?.logoText || doctorName}
                </span>
                <span className="text-xs text-sky-600 font-semibold tracking-wider uppercase">
                  {clinic?.branding?.logoBadge || 'Odontología Especializada'}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 font-medium text-slate-600 text-sm">
              <a href="#tratamientos" className="hover:text-sky-600 transition">Tratamientos</a>
              <a href="#coberturas" className="hover:text-sky-600 transition">Obras Sociales</a>
              <a href="#nosotros" className="hover:text-sky-600 transition">El Consultorio</a>
              <a href="#testimonios" className="hover:text-sky-600 transition">Opiniones</a>
              <a href="#contacto" className="hover:text-sky-600 transition">Ubicación</a>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href={waLink} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
              </a>
              <Link 
                to="/reservar" 
                className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4" /> Reservar Turno
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-sky-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Atención Odontológica de Vanguardia
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Una sonrisa sana y radiante con <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500">atención sin dolor</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Bienvenido al consultorio del <strong>{doctorName}</strong>. Combinamos calidez humana, tecnología digital y tratamientos personalizados para que volver al dentista sea una experiencia agradable.
              </p>

              {/* CTAs DESTACADOS */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a 
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Consultar por WhatsApp
                </a>

                <Link 
                  to="/reservar"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-sky-500 text-base font-bold px-7 py-3.5 rounded-2xl shadow-sm transition-all"
                >
                  <Calendar className="w-5 h-5 text-sky-600" />
                  Ver Agenda Online
                </Link>
              </div>

              {/* MINI BADGES */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">+12</p>
                  <p className="text-xs text-slate-500">Años de experiencia</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">4.9 ★</p>
                  <p className="text-xs text-slate-500">+850 Pacientes felices</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">0%</p>
                  <p className="text-xs text-slate-500">Demoras innecesarias</p>
                </div>
              </div>
            </div>

            {/* HERO CARD ILUSTRATIVA */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-sky-100 to-cyan-50 flex items-center justify-center overflow-hidden mb-6 relative">
                  <img 
                    src="/turnely.jpg" 
                    alt={doctorName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback si no hay imagen
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-4">
                    <div className="text-white">
                      <p className="font-bold text-lg leading-tight">{doctorName}</p>
                      <p className="text-xs text-sky-200">{specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Agenda Disponible</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Turnos en tiempo real
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">Turnos de 30 a 60 minutos</p>
                      <p className="text-slate-500">Sin salas de espera llenas ni demoras</p>
                    </div>
                  </div>

                  <Link 
                    to="/reservar"
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-md shadow-sky-600/20"
                  >
                    Elegir Horario Ahora <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SECCIÓN TRATAMIENTOS */}
      <section id="tratamientos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sky-600 font-bold text-xs uppercase tracking-wider">Especialidades</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Tratamientos Diseñados para tu Salud y Estética
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Diagnósticos precisos con instrumental esterilizado y tecnología de punta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={service.id || index}
                className="group p-7 rounded-3xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-5 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" /> {service.duration}
                  </span>
                  <Link 
                    to="/reservar"
                    className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Agendar <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN OBRAS SOCIALES & COBERTURAS */}
      <section id="coberturas" className="py-16 bg-slate-100/60 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sky-600 font-bold text-xs uppercase tracking-wider">Coberturas Médicas</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-4">
            Trabajamos con las Principales Prepagas y Obras Sociales
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto mb-8">
            Consultanos por WhatsApp con tu credencial para confirmarte el alcance de tu cobertura de forma inmediata.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
            {insurances.map((ins, idx) => (
              <span 
                key={idx}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-sm hover:border-sky-300 transition"
              >
                {ins}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hola,%20quisiera%20consultar%20si%20mi%20obra%20social%20tiene%20cobertura`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              ¿No ves tu cobertura? Escribinos y te asesoramos
            </a>
          </div>
        </div>
      </section>

      {/* 6. SOBRE EL PROFESIONAL */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sky-600 font-bold text-xs uppercase tracking-wider">El Consultorio</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">
                Tecnología Digital y Calidez en Cada Consulta
              </h2>
              
              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>
                  En el consultorio del <strong>{doctorName}</strong> entendemos que la visita al odontólogo suele generar dudas e incertidumbre. Por eso, nuestro objetivo primordial es que te sientas cómodo, escuchado y seguro desde el primer minuto.
                </p>
                <p>
                  Contamos con protocolos estrictos de esterilización, instrumental de última generación y anestesia computarizada indolora para que te olvides de los viejos miedos al dentista.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <ShieldCheck className="w-6 h-6 text-sky-600 mb-2" />
                  <p className="font-bold text-slate-900 text-sm">Garantía Clínica</p>
                  <p className="text-xs text-slate-600">Materiales aprobados de primera línea internacional.</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <Award className="w-6 h-6 text-sky-600 mb-2" />
                  <p className="font-bold text-slate-900 text-sm">Puntualidad Absoluta</p>
                  <p className="text-xs text-slate-600">Respetamos tu tiempo: turnos sin esperas.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 font-semibold text-xs border border-sky-500/30">
                  Atención Inmediata
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  ¿Tenés una duda urgente o dolor agudo?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Escribinos ahora mismo a nuestro WhatsApp. Nuestro asistente virtual y equipo de recepción te darán respuesta en el acto y coordinarán tu atención prioritaria.
                </p>
                <a 
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm"
                >
                  <MessageCircle className="w-5 h-5" /> Enviar Mensaje a WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIOS */}
      <section id="testimonios" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sky-600 font-bold text-xs uppercase tracking-wider">Testimonios Reales</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Lo que Dicen Nuestros Pacientes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  "Siempre le tuve pánico al dentista, pero la paciencia y el trato del doctor fueron increíbles. Me hice una limpieza y un tratamiento de conducto sin sentir absolutamente nada de dolor."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                  MG
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Mariana Gómez</p>
                  <p className="text-xs text-slate-400">Paciente de Ortodoncia</p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  "Agendé por WhatsApp en menos de dos minutos. Me pasaron el link, elegí el horario y al otro día me llegó el recordatorio. La puntualidad del consultorio es impecable."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  CR
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Carlos Rodríguez</p>
                  <p className="text-xs text-slate-400">Paciente General</p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  "El blanqueamiento dental me cambió la sonrisa por completo. Excelente atención, instalaciones super modernas y muy limpio todo. Lo recomiendo 100%."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                  LF
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Lucía Fernández</p>
                  <p className="text-xs text-slate-400">Estética Dental</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. UBICACIÓN Y CONTACTO */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-sky-400 font-bold text-xs uppercase tracking-wider">Contacto & Ubicación</span>
              <h2 className="text-3xl font-extrabold mt-2 mb-6">Estamos a Pocas Cuadras de Vos</h2>

              <div className="space-y-4 text-slate-300 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Dirección:</p>
                    <p>{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Horarios de Atención:</p>
                    <p>{workingHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Teléfono de Contacto:</p>
                    <p>{phone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-wrap gap-4">
                <a 
                  href={waLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
                </a>
                <Link 
                  to="/reservar" 
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  <Calendar className="w-4 h-4" /> Ver Turnos Libres
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <Smile className="w-16 h-16 text-sky-400" />
              <h3 className="font-bold text-xl text-white">{clinicName}</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Atención odontológica programada para asegurar el tiempo y dedicación que cada paciente merece.
              </p>
              <a 
                href={clinic?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
              >
                Abrir en Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacidad" className="hover:text-slate-300 transition">Privacidad</Link>
            <Link to="/terminos" className="hover:text-slate-300 transition">Términos</Link>
            <Link to="/admin" className="hover:text-white transition flex items-center gap-1 font-semibold text-slate-300">
              <Lock className="w-3 h-3" /> Panel Administrativo
            </Link>
          </div>
        </div>
      </footer>

      {/* 10. BOTÓN FLOTANTE DE WHATSAPP */}
      <a 
        href={waLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ¿Dudas? Chateá con nosotros
        </span>
      </a>

    </div>
  );
}
