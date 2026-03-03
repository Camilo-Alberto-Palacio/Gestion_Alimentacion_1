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
        let isMounted = true;
        const loadDayData = async () => {
            setIsDataLoaded(false);
            try {
                const docRef = doc(db, 'users', user.uid, 'history', currentDate);
                const docSnap = await getDoc(docRef);

                if (isMounted) {
                    if (docSnap.exists() && docSnap.data().supps) {
                        // Merge limpio: Defaults como base + los datos recuperados encima
                        const loadedSupps = docSnap.data().supps;

                        const mergedSupps = { ...DEFAULT_SUPPS };
                        Object.keys(DEFAULT_SUPPS).forEach(key => {
                            if (loadedSupps[key]) {
                                mergedSupps[key] = { ...DEFAULT_SUPPS[key], ...loadedSupps[key] };
                            }
                        });

                        setActiveSupps(mergedSupps);
                    } else {
                        setActiveSupps(DEFAULT_SUPPS);
                    }
                    setIsDataLoaded(true);
                }
            } catch (error) {
                console.error("Error cargando historial de Firebase:", error);
                if (isMounted) setIsDataLoaded(true);
            }
        };

        if (user && user.uid) {
            loadDayData();
        }

        return () => { isMounted = false; };
    }, [currentDate, user.uid]);

    // Función Helper para Guardado Explícito y Directo a Firebase
    const saveToFirebase = async (payload) => {
        if (!user || !user.uid) return;
        try {
            console.log("Intentando guardar en Firebase:", payload);
            const docRef = doc(db, 'users', user.uid, 'history', currentDate);
            // setDoc overwrite asegura que no queden residuos extraños antiguos en BD
            await setDoc(docRef, { supps: payload });
            console.log("¡Guardado exitoso en Firebase!");
        } catch (error) {
            console.error("Error guardando manual en Firebase:", error);
            alert("Error de Firebase: " + error.message + " (Suele ser permisos de base de datos incorrectos)");
        }
    };

    const toggleSupp = (id) => {
        const newActiveState = !activeSupps[id].active;
        const newSupps = {
            ...activeSupps,
            [id]: { ...activeSupps[id], active: newActiveState }
        };
        setActiveSupps(newSupps);
        saveToFirebase(newSupps);
    };

    const updateSuppTime = (id, timeString) => {
        const [hours, mins] = timeString.split(':').map(Number);
        const floatTime = hours + (mins / 60);

        const newSupps = {
            ...activeSupps,
            [id]: { ...activeSupps[id], time: floatTime }
        };
        setActiveSupps(newSupps);
        saveToFirebase(newSupps);
    };

    const applyRecommendations = (newSupps) => {
        setActiveSupps(newSupps);
        setShowRecomendador(false);
        saveToFirebase(newSupps);
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
            white: isActive ? 'bg-white/10 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'border-white/5 text-slate-500 bg-slate-900/40 hover:bg-slate-800/80 hover:border-white/10 hover:-translate-y-0.5',
            indigo: isActive ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-indigo-500/30 hover:-translate-y-0.5',
            orange: isActive ? 'bg-orange-500/10 border-orange-500/40 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-orange-500/30 hover:-translate-y-0.5',
            amber: isActive ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-amber-500/30 hover:-translate-y-0.5',
            yellow: isActive ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-yellow-500/30 hover:-translate-y-0.5',
            emerald: isActive ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-emerald-500/30 hover:-translate-y-0.5',
            blue: isActive ? 'bg-blue-500/10 border-blue-500/40 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:border-blue-500/30 hover:-translate-y-0.5'
        };

        const iconColors = {
            white: isActive ? 'text-white' : 'text-slate-600',
            indigo: isActive ? 'text-indigo-400' : 'text-slate-600',
            orange: isActive ? 'text-orange-400' : 'text-slate-600',
            amber: isActive ? 'text-amber-400' : 'text-slate-600',
            yellow: isActive ? 'text-yellow-400' : 'text-slate-600',
            emerald: isActive ? 'text-emerald-400' : 'text-slate-600',
            blue: isActive ? 'text-blue-400' : 'text-slate-600'
        };

        return (
            <div className={`relative group p-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 flex flex-col overflow-hidden ${themes[colorTheme]}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${isActive ? 'bg-current opacity-100 shadow-[0_0_10px_currentColor]' : 'bg-transparent opacity-0'}`} />

                <button
                    onClick={() => toggleSupp(id)}
                    className="flex items-center justify-start gap-1.5 w-full text-left"
                >
                    <div className={`p-1.5 rounded-lg bg-black/40 border border-white/5 transition-colors shrink-0 ${iconColors[colorTheme]}`}>
                        {Icon ? <Icon size={12} className={isActive && id === 'flowState' ? "animate-pulse" : ""} /> : <Target size={12} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest truncate transition-colors leading-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            {label}
                        </p>
                    </div>
                </button>

                {isActive && (
                    <div className="mt-1.5 flex items-center justify-between px-2 py-1 rounded-md bg-black/40 border border-white/10 shadow-inner group-hover:bg-black/60 transition-colors w-full">
                        <Clock size={10} className="text-current opacity-60 shrink-0" />
                        <input
                            type="time"
                            value={formatTimeForInput(timeValue)}
                            onChange={(e) => updateSuppTime(id, e.target.value)}
                            className="bg-transparent text-[10px] md:text-[11px] font-mono font-bold w-full outline-none text-current cursor-pointer text-right transition-colors hover:text-white"
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#030509] relative overflow-hidden font-sans text-slate-200">
            {/* Ambient Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                {/* Navbar de Usuario (Flotante) */}
                <div className="max-w-7xl mx-auto mb-10 bg-slate-900/50 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-full px-6 py-3 flex flex-col md:flex-row justify-between items-center backdrop-blur-xl gap-4 sticky top-4 z-50 transition-all hover:bg-slate-900/60">
                    {/* Info de Usuario */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative">
                            <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-500/50 shadow-lg object-cover" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Operador</p>
                            <p className="text-sm font-black text-white">{user.displayName}</p>
                        </div>
                    </div>

                    {/* Date Selector Central - Cyber Style */}
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5 shadow-inner">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex flex-col items-center min-w-[140px] px-2">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                                <Calendar size={10} /> {formatDisplayDate(currentDate)}
                            </span>
                        </div>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Botonera Derecha */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={() => setShowRecomendador(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] rounded-full text-xs font-black text-white uppercase tracking-wider transition-all -translate-y-0.5 active:translate-y-0"
                        >
                            <Brain size={14} /> Auto-Optimize
                        </button>
                        <button onClick={onLogout} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full transition-all flex items-center justify-center">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                <div className={`max-w-7xl mx-auto transition-all duration-700 ${!isDataLoaded ? 'opacity-30 blur-sm pointer-events-none translate-y-4' : 'opacity-100 blur-0 translate-y-0'}`}>

                    {/* Header Principal */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-12 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-[0.25em] text-[9px] uppercase bg-indigo-950/40 px-4 py-1.5 rounded-full w-fit border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" /> Biological Logic Engine v9.0
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
                                Rendimiento <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                    Cognitivo
                                </span>
                            </h1>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 text-center min-w-[140px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest relative z-10">Piso Energético</p>
                                <p className="text-4xl font-black text-white relative z-10">{(activeSupps.creatina.active && activeSupps.magnesio.active) ? '45%' : '35%'}</p>
                            </div>
                            <div className="bg-emerald-950/30 backdrop-blur-xl p-6 rounded-[2rem] border border-emerald-500/30 text-center min-w-[140px] shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[10px] text-emerald-400 font-black uppercase mb-2 tracking-widest relative z-10">Peak CI Estimado</p>
                                <p className="text-4xl font-black text-white relative z-10 text-shadow-sm">145</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 mb-12 flex-1 min-h-0">
                        {/* Area Principal - Charts */}
                        <div className="lg:col-span-12 xl:col-span-7 bg-slate-900/40 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl flex flex-col min-h-[350px]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
                            <div className="flex-1 w-full relative z-10 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="8" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.4} />
                                        <XAxis dataKey="time" interval={3} stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} />
                                        <Area type="monotone" dataKey="optimized" stroke="#818cf8" strokeWidth={5} fillOpacity={1} fill="url(#colorTotal)" name="Capacidad Biohackeada" filter="url(#glow)" />
                                        <Line type="monotone" dataKey="natural" stroke="#334155" strokeWidth={2} dot={false} strokeDasharray="6 6" name="Base Natural" />
                                        <ReferenceLine y={90} stroke="#10b981" strokeDasharray="8 8" opacity={0.5} label={{ value: 'FLOW STATE ZONE', fill: '#10b981', fontSize: 10, fontWeight: '900', position: 'insideBottomRight', padding: 10 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Panel Lateral Modular en 2 Columnas Internas */}
                        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4">

                            {/* MÓDULO 1: FLOW & STIMULANTS */}
                            <div className="bg-slate-900/40 p-4 md:p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-xl">
                                <h3 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Flame size={14} className="text-orange-500" /> Neuro-Stimulants</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                        <TimeableButton id="flowState" label="MODO FLOW 🔥" icon={Target} colorTheme="orange" />
                                    </div>
                                    <TimeableButton id="cafe9am" label="CAFÉ AM" icon={Coffee} colorTheme="amber" />
                                    <TimeableButton id="cafe11am" label="CAFÉ MEDIODÍA" icon={Coffee} colorTheme="amber" />
                                    <TimeableButton id="cafe2pm" label="ESPRESSO PM" icon={Coffee} colorTheme="amber" />
                                    <TimeableButton id="matcha" label="MATCHA FOCUS" icon={Coffee} colorTheme="emerald" />
                                </div>
                            </div>

                            {/* MÓDULO 2: NOOTROPICS & COGNITIVA */}
                            <div className="bg-slate-900/40 p-4 md:p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-xl">
                                <h3 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Brain size={14} className="text-indigo-500" /> Cognitive Stack</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <TimeableButton id="citicolina" label="Citicolina CDP" icon={Star} colorTheme="indigo" />
                                    <TimeableButton id="rhodiola" label="Rhodiola Rosea" icon={Shield} colorTheme="indigo" />
                                    <TimeableButton id="creatina" label="Creatina Mono" colorTheme="blue" />
                                    <TimeableButton id="complejoB" label="Complejo B" colorTheme="blue" />
                                </div>
                            </div>

                            {/* MÓDULO 3: NUTRICIÓN & RECUPERACIÓN */}
                            <div className="bg-slate-900/40 p-4 md:p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-xl">
                                <h3 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Utensils size={14} className="text-emerald-500" /> Fuel & Recovery</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <TimeableButton id="huevosManana" label="HUEVOS AM" colorTheme="yellow" />
                                    <TimeableButton id="huevosNoche" label="HUEVOS PM" colorTheme="yellow" />
                                    <TimeableButton id="cocoaManana" label="COCOA AM" colorTheme="orange" />
                                    <TimeableButton id="cocoaNoche" label="COCOA PM" colorTheme="orange" />
                                    <TimeableButton id="curcuma" label="CÚRCUMA + PIM" colorTheme="amber" />
                                    <TimeableButton id="infusion" label="INFUSIÓN" colorTheme="indigo" />
                                    <TimeableButton id="magnesio" label="MAGNESIO BIS." colorTheme="white" />
                                    <TimeableButton id="sulfato" label="SULFATO" colorTheme="white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
