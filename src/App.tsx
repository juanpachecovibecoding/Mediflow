import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Lock, LogIn, Activity, Smile, ArrowLeft, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookingPortal from './components/BookingPortal';
import LandingPage from './components/LandingPage';

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError('Error al iniciar sesión con Google. Verifique los permisos.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Activity className="w-10 h-10 text-sky-600 animate-spin mb-3" />
        <p className="text-slate-500 font-medium text-sm">Cargando panel...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-sky-100 rounded-2xl text-sky-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Acceso Profesional</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Panel de gestión para odontólogo, asistentes y administración técnica.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition shadow-md shadow-slate-900/20 text-sm active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              Ingresar con Google
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la página principal
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Usuario autenticado: ingresar al Dashboard
  return <Dashboard user={user} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/reservar" element={<BookingPortal />} />
        <Route path="/reservar/:clinicId" element={<BookingPortal />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/dashboard" element={<AdminApp />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/terminos" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
