import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { Brain, Clock, Shield, Target, Utensils, Coffee, Flame, Star, LogOut, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Recomendador from './Recomendador';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULT_SUPPS = {
    creatina: { active: false, time: 7.0 }, magnesio: { active: false, time: 21.0 },
    sulfato: { active: false, time: 14.0 }, complejoB: { active: false, time: 7.0 },
    cafe9am: { active: false, time: 9.0 }, cafe11am: { active: false, time: 11.0 },
    cafe2pm: { active: false, time: 14.0 }, matcha: { active: false, time: 18.0 },
    huevosManana: { active: false, time: 8.0 }, huevosNoche: { active: false, time: 20.0 },
    cocoaManana: { active: false, time: 8.0 }, cocoaNoche: { active: false, time: 20.0 },
    curcuma: { active: false, time: 13.0 }, infusion: { active: false, time: 21.5 },
    citicolina: { active: false, time: 8.5 }, rhodiola: { active: false, time: 8.5 },
    flowState: { active: false, time: 9.0 }
};

const Dashboard = ({ user, onLogout }) => {
    // 1. Estado de Fechas
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        today.setMinutes(today.getMinutes() - offset);
        return today.toISOString().split('T')[0];
    });

    // 2. Estado de Suplementos (Inicializa vacío, espera a Firebase)
    const [activeSupps, setActiveSupps] = useState(DEFAULT_SUPPS);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [showRecomendador, setShowRecomendador] = useState(false);

    // Helper para mostrar la fecha bonita en UI
    const formatDisplayDate = (dateStr) => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        today.setMinutes(today.getMinutes() - offset);
        const todayStr = today.toISOString().split('T')[0];

        if (dateStr === todayStr) return "Hoy";

        const dateObj = new Date(dateStr + "T12:00:00");
        return new Intl.DateTimeFormat('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }).format(dateObj);
    };

    const changeDate = (days) => {
        const dateObj = new Date(currentDate + "T12:00:00");
        dateObj.setDate(dateObj.getDate() + days);
        setCurrentDate(dateObj.toISOString().split('T')[0]);
    };

    // 3. Carga de Datos desde Firebase por Fecha
    useEffect(() => {
        const loadDayData = async () => {
            setIsDataLoaded(false);
            try {
                const docRef = doc(db, 'users', user.uid, 'history', currentDate);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setActiveSupps(docSnap.data().supps);
                } else {
                    setActiveSupps(DEFAULT_SUPPS);
                }
            } catch (error) {
                console.error("Error cargando historial de Firebase:", error);
            } finally {
                setIsDataLoaded(true);
            }
        };

        if (user && user.uid) {
            loadDayData();
        }
    }, [currentDate, user.uid]);

    // 4. Guardado de Datos en Firebase (Auto-Save)
    useEffect(() => {
        const saveDayData = async () => {
            // Evitar guardar si apenas se está cargando para no sobreescribir con DEFAULT_SUPPS
            if (!isDataLoaded) return;

            try {
                const docRef = doc(db, 'users', user.uid, 'history', currentDate);
                await setDoc(docRef, { supps: activeSupps }, { merge: true });
            } catch (error) {
                console.error("Error guardando en Firebase:", error);
            }
        };

        saveDayData();
    }, [activeSupps, currentDate, isDataLoaded, user.uid]);


    const toggleSupp = (id) => {
        setActiveSupps(prev => ({
            ...prev,
            [id]: { ...prev[id], active: !prev[id].active }
        }));
    };

    const updateSuppTime = (id, timeString) => {
        const [hours, mins] = timeString.split(':').map(Number);
        const floatTime = hours + (mins / 60);
        setActiveSupps(prev => ({
            ...prev,
            [id]: { ...prev[id], time: floatTime }
        }));
    };

    const applyRecommendations = (newSupps) => {
        setActiveSupps(newSupps);
        setShowRecomendador(false);
    };

    const formatTimeForInput = (floatTime) => {
        const h = Math.floor(floatTime).toString().padStart(2, '0');
        const m = Math.round((floatTime % 1) * 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const data = useMemo(() => {
        const points = [];
        const baseIQ = 133;
        const peakLimitIQ = 145;

        for (let hour = 4; hour <= 23.5; hour += 0.5) {
            const time = hour;
            const h = Math.floor(time);
            const mins = (time % 1) * 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${mins === 0 ? '00' : '30'}`;

            const circadian = 45 + 12 * Math.sin((time - 7) * Math.PI / 12);
            let iTotal = 0;
            let stimDebt = 0;

            const floorBonus = (activeSupps.creatina.active ? 5 : 0) + (activeSupps.magnesio.active ? 5 : 0);
            const slopeK = activeSupps.citicolina.active ? 1.7 : 1.0;

            if (activeSupps.complejoB.active && time >= activeSupps.complejoB.time) iTotal += 12 * Math.exp(-(time - activeSupps.complejoB.time) / (6 * slopeK));
            if (activeSupps.sulfato.active && time >= activeSupps.sulfato.time) iTotal += 8;

            if (activeSupps.cafe9am.active && time >= activeSupps.cafe9am.time) { iTotal += 12 * Math.exp(-(time - activeSupps.cafe9am.time) / 2.5); stimDebt += 1.5; }
            if (activeSupps.cafe11am.active && time >= activeSupps.cafe11am.time) { iTotal += 12 * Math.exp(-(time - activeSupps.cafe11am.time) / 2.5); stimDebt += 1.5; }
            if (activeSupps.cafe2pm.active && time >= activeSupps.cafe2pm.time) { iTotal += 12 * Math.exp(-(time - activeSupps.cafe2pm.time) / 2.5); stimDebt += 1.8; }
            if (activeSupps.matcha.active && time >= activeSupps.matcha.time) { iTotal += 10; stimDebt += 0.8; }

            if (activeSupps.huevosManana.active && time >= activeSupps.huevosManana.time) iTotal += 7;
            if (activeSupps.huevosNoche.active && time >= activeSupps.huevosNoche.time) iTotal += 5;
            if (activeSupps.cocoaManana.active && time >= activeSupps.cocoaManana.time) iTotal += 5;
            if (activeSupps.cocoaNoche.active && time >= activeSupps.cocoaNoche.time) iTotal += 6;
            if (activeSupps.curcuma.active && time >= activeSupps.curcuma.time) iTotal += 6;
            if (activeSupps.infusion.active && time >= activeSupps.infusion.time) iTotal += 4;

            if (activeSupps.citicolina.active && time >= activeSupps.citicolina.time) iTotal += 15 * Math.exp(-(time - activeSupps.citicolina.time) / 4);

            const fatigueTau = activeSupps.rhodiola.active ? 0.45 : 1.0;
            const saturationCoeff = 38;
            const optimizedGain = saturationCoeff * Math.tanh(iTotal / saturationCoeff);

            const crashAmount = (stimDebt * Math.max(0, time - 4) * 0.18) * fatigueTau;
            const compensatoryDrop = time > 15 ? crashAmount : 0;

            const hasNutrition = activeSupps.huevosManana.active && activeSupps.cocoaManana.active;
            const isFlowActive = activeSupps.flowState.active && hasNutrition && time >= activeSupps.flowState.time && iTotal > 20;
            const flowBonus = isFlowActive ? 6 : 0;

            const finalCapacity = Math.max(35 + floorBonus, Math.min(100, circadian + optimizedGain + flowBonus - compensatoryDrop));
            const functionalIQ = baseIQ + ((finalCapacity - 55) * (peakLimitIQ - baseIQ) / 45);

            points.push({
                time: timeStr,
                natural: Math.round(circadian),
                optimized: Math.round(finalCapacity),
                iq: Math.round(Math.max(100, functionalIQ)),
                isFlow: isFlowActive,
                isCrash: compensatoryDrop > 18
            });
        }
        return points;
    }, [activeSupps]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length > 0) {
            const dp = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl min-w-[220px] backdrop-blur-md z-50">
                    <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                        <span className="text-slate-400 font-bold text-xs flex items-center gap-1"><Clock size={12} /> {label}</span>
                        {dp.isFlow && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">FLOW 🔥</span>}
                    </div>
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-2xl border border-white/10 text-center">
                            <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-1">CI Operativo Real</p>
                            <p className="text-4xl font-black text-white leading-none">{dp.iq}</p>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold px-1 text-slate-400">
                            <span className="uppercase tracking-tighter">Capacidad: {dp.optimized}%</span>
                            <span className="text-emerald-500">+{dp.optimized - dp.natural}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (showRecomendador) {
        return <Recomendador currentSupps={activeSupps} onApply={applyRecommendations} onCancel={() => setShowRecomendador(false)} />;
    }

    const TimeableButton = ({ id, label, icon: Icon, colorTheme = "white" }) => {
        const isActive = activeSupps[id].active;
        const timeValue = activeSupps[id].time;

        const themes = {
            white: isActive ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-700 bg-slate-800/20 hover:bg-slate-800/40',
            indigo: isActive ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800/40 border-white/5 text-slate-500 hover:bg-slate-800/60',
            orange: isActive ? 'bg-orange-500/20 border-orange-400 text-orange-100' : 'border-white/5 text-slate-700 bg-slate-800/20 hover:bg-slate-800/40',
            amber: isActive ? 'bg-amber-500/20 border-amber-500 text-amber-100' : 'bg-slate-800/20 border-white/5 text-slate-700 hover:bg-slate-800/40',
            yellow: isActive ? 'bg-yellow-500/20 border-yellow-500 text-yellow-100' : 'border-white/5 text-slate-700 bg-slate-800/20 hover:bg-slate-800/40',
            emerald: isActive ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800/40 border-white/5 text-slate-500 hover:bg-slate-800/60',
            blue: isActive ? 'bg-blue-500/20 border-blue-400 text-blue-100' : 'border-white/5 text-slate-700 bg-slate-800/20 hover:bg-slate-800/40'
        };

        return (
            <div className={`p-2 rounded-2xl border transition-all flex flex-col gap-2 ${themes[colorTheme]}`}>
                <button
                    onClick={() => toggleSupp(id)}
                    className="flex-1 w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider disabled:opacity-50"
                    disabled={!isDataLoaded}
                >
                    {Icon && <Icon size={14} className={isActive && id === 'flowState' ? "animate-bounce" : ""} />}
                    {label}
                </button>

                {isActive && (
                    <div className="flex items-center justify-center gap-1 mt-1 pt-2 border-t border-white/10">
                        <Clock size={10} className="opacity-70" />
                        <input
                            type="time"
                            value={formatTimeForInput(timeValue)}
                            onChange={(e) => updateSuppTime(id, e.target.value)}
                            disabled={!isDataLoaded}
                            className="bg-transparent text-[10px] font-mono text-center w-16 outline-none text-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5 cursor-pointer disabled:opacity-50"
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050810] p-4 md:p-8 font-sans text-slate-200">

            {/* Navbar de Usuario */}
            <div className="max-w-7xl mx-auto mb-8 bg-slate-900/40 border border-white/5 rounded-[2rem] p-4 flex flex-col sm:flex-row justify-between items-center backdrop-blur-md gap-4">

                {/* Info de Usuario */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-indigo-500/30" />
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Bienvenido,</p>
                        <p className="text-sm font-bold text-white">{user.displayName}</p>
                    </div>
                </div>

                {/* Date Selector Central */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex flex-col items-center min-w-[120px]">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                            <Calendar size={10} /> Historial
                        </span>
                        <span className="text-sm font-bold text-white capitalize">{formatDisplayDate(currentDate)}</span>
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Botonera Derecha */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowRecomendador(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600/20 to-emerald-600/20 hover:from-indigo-600/40 hover:to-emerald-600/40 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 transition-all"
                    >
                        <Brain size={14} /> Asistente
                    </button>
                    <button onClick={onLogout} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div className={`max-w-7xl mx-auto transition-opacity duration-500 ${!isDataLoaded ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Header Consolidado */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-[0.2em] text-[10px] uppercase bg-indigo-400/10 px-3 py-1 rounded-full w-fit border border-indigo-400/20">
                            <Shield size={12} /> Biological Logic Engine v9.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                            Tu Perfil <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-indigo-400 to-emerald-400">Cognitivo</span>
                        </h1>
                        <p className="text-slate-500 text-xs mt-2 font-medium">
                            Mostrando la arquitectura biológica para la fecha seleccionada.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-800/30 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/5 text-center min-w-[120px] shadow-xl">
                            <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Piso</p>
                            <p className="text-3xl font-black text-white">{(activeSupps.creatina.active && activeSupps.magnesio.active) ? '45%' : '35%'}</p>
                        </div>
                        <div className="bg-emerald-600/10 backdrop-blur-xl p-5 rounded-[2.5rem] border border-emerald-500/20 text-center min-w-[120px] shadow-xl">
                            <p className="text-[9px] text-emerald-400 font-black uppercase mb-1 tracking-widest">CI Peak</p>
                            <p className="text-3xl font-black text-white">145</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

                    {/* Gráfica */}
                    <div className="lg:col-span-8 bg-slate-900/30 backdrop-blur-md p-6 md:p-8 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
                        <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                                    <XAxis dataKey="time" interval={3} stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="optimized" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#colorTotal)" name="Capacidad Biohackeada" />
                                    <Line type="monotone" dataKey="natural" stroke="#334155" strokeWidth={2} dot={false} strokeDasharray="8 4" name="Base Natural" />
                                    <ReferenceLine y={90} stroke="#4f46e5" strokeDasharray="10 5" label={{ value: 'ZONA DE GENIO', fill: '#818cf8', fontSize: 10, fontWeight: '900', position: 'insideTopRight' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Panel Lateral de Controles */}
                    <div className="lg:col-span-4 flex flex-col gap-4">

                        {/* 1. UPGRADES PREMIUM */}
                        <div className="bg-indigo-600/10 p-5 rounded-[2rem] border border-indigo-500/30 shadow-xl">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Star size={14} fill="currentColor" /> Premium Bio-Optimizers
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <TimeableButton id="citicolina" label="Citicolina" icon={Target} colorTheme="indigo" />
                                <TimeableButton id="rhodiola" label="Rhodiola" icon={Shield} colorTheme="indigo" />
                                <div className="col-span-2">
                                    <TimeableButton id="flowState" label="MODO FLOW 🔥" icon={Flame} colorTheme="orange" />
                                </div>
                            </div>
                        </div>

                        {/* 2. NUTRICIÓN & DESPENSA */}
                        <div className="bg-orange-600/10 p-5 rounded-[2rem] border border-orange-500/20 shadow-md">
                            <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Utensils size={14} /> Nutrición & Despensa
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <TimeableButton id="huevosManana" label="HUEVOS AM" colorTheme="yellow" />
                                <TimeableButton id="huevosNoche" label="HUEVOS PM" colorTheme="yellow" />
                                <TimeableButton id="cocoaManana" label="COCOA AM" colorTheme="orange" />
                                <TimeableButton id="cocoaNoche" label="COCOA PM" colorTheme="orange" />
                                <TimeableButton id="curcuma" label="CÚRCUMA + PIM." colorTheme="amber" />
                                <TimeableButton id="infusion" label="INFUSIÓN NOCHE" colorTheme="blue" />
                            </div>
                        </div>

                        {/* 3. CICLO DE CAFEÍNA */}
                        <div className="bg-amber-600/5 p-5 rounded-[2rem] border border-amber-500/10">
                            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Coffee size={14} /> Neuro-Stimulants
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <TimeableButton id="cafe9am" label="CAFÉ 1" colorTheme="amber" />
                                <TimeableButton id="cafe11am" label="CAFÉ 2" colorTheme="amber" />
                                <TimeableButton id="cafe2pm" label="ESPRESSO" colorTheme="amber" />
                                <TimeableButton id="matcha" label="MATCHA" colorTheme="emerald" />
                            </div>
                        </div>

                        {/* 4. INFRAESTRUCTURA */}
                        <div className="bg-slate-900/50 p-5 rounded-[2rem] border border-white/5">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Protocolo Base</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <TimeableButton id="creatina" label="CREATINA" colorTheme="white" />
                                <TimeableButton id="magnesio" label="MAGNESIO" colorTheme="white" />
                                <TimeableButton id="sulfato" label="SULFATO" colorTheme="white" />
                                <TimeableButton id="complejoB" label="COMPLEJO B" colorTheme="white" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
