import React, { useState } from 'react';
import { Brain, Shield, Sparkles } from 'lucide-react';
// import { auth, provider, signInWithPopup } from '../firebase'; // Comentado hasta tener config

const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            /*
            // Esta será la conexión real a Firebase:
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            onLogin({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL
            });
            */

            // Mock Login para demostración mientras se configura Firebase:
            // Cuando conectes Firebase real, user.displayName traerá tu nombre de Google.
            setTimeout(() => {
                onLogin({
                    uid: 'demo-user-123',
                    displayName: 'Tu Nombre Real Aquí', // <- Cambiará automáticamente con Firebase
                    email: 'demo@biohacking.com',
                    photoURL: '/assets/avatar1.png'
                });
                setLoading(false);
            }, 1500);

        } catch (err) {
            console.error(err);
            setError('Error al iniciar sesión con Google.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050810] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200 relative overflow-hidden">
            {/* Efectos de fondo */}
            <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="p-4 bg-indigo-500/20 rounded-3xl text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <Brain size={48} />
                    </div>
                </div>
                <h2 className="text-center text-4xl font-black text-white tracking-tighter mb-2">
                    Biohacking <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-indigo-400 to-emerald-400">Total</span>
                </h2>
                <p className="text-center text-slate-400 text-sm font-medium">
                    Sistema Inteligente de Gestión de Componentes Biológicos
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10">
                <div className="bg-slate-900/40 backdrop-blur-xl py-12 px-6 shadow-2xl rounded-[3rem] sm:px-12 border border-white/5 mx-4 sm:mx-0">

                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Accede a tu Panel Cognitivo</h3>
                            <p className="text-sm text-slate-500">Sincroniza tus métricas, rutinas de suplementos y obtén recomendaciones de estado de Flow.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full flex justify-center items-center gap-3 py-4 px-4 border border-white/10 rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-300
                ${loading ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02] hover:shadow-indigo-500/25'}
              `}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                        <path d="M1 1h22v22H1z" fill="none" />
                                    </svg>
                                    <span>Continuar con Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/30 p-3 rounded-2xl flex items-center gap-3">
                                <Shield size={18} className="text-emerald-400" />
                                <span className="text-xs text-slate-400 font-medium tracking-tight">Datos Privados</span>
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded-2xl flex items-center gap-3">
                                <Sparkles size={18} className="text-amber-400" />
                                <span className="text-xs text-slate-400 font-medium tracking-tight">AI Optimizado</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
