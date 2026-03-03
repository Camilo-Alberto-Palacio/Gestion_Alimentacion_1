import React, { useState } from 'react';
import { Brain, Heart, Zap, Moon, Check, X } from 'lucide-react';

const Recomendador = ({ currentSupps, onApply, onCancel }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        goal: '', // 'focus', 'energy', 'sleep'
        caffeineSensitivity: '', // 'high', 'low'
        budget: '', // 'basic', 'premium'
    });

    const handleAnswer = (key, value) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        setStep(prev => prev + 1);
    };

    const generateRecommendations = () => {
        // Partimos de todo apagado para armar el perfil limpio basado en salud
        let recs = {
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

        // 1. Base Universal de Salud (Recomendado para todos)
        recs.magnesio.active = true; // Excelente para el sueño y estrés
        recs.complejoB.active = true; // Energía base celular
        recs.huevosManana.active = true; // Colina natural

        // 2. Personalización por Objetivo
        if (answers.goal === 'focus') {
            recs.citicolina.active = answers.budget === 'premium';
            recs.cocoaManana.active = true; // Vasodilatador leve
            recs.flowState.active = true;
        } else if (answers.goal === 'energy') {
            recs.creatina.active = true;
            recs.rhodiola.active = answers.budget === 'premium';
        } else if (answers.goal === 'sleep') {
            recs.infusion.active = true;
            recs.huevosNoche.active = true; // Triptófano
            recs.caffeineSensitivity = 'high'; // Forzar reducción de cafeína
        }

        // 3. Ajuste por Sensibilidad a estimulantes
        if (answers.caffeineSensitivity === 'high') {
            recs.matcha.active = true; // L-Teanina ayuda a calmar
            recs.cafe9am.active = true; // Solo uno en la mañana
        } else {
            recs.cafe9am.active = true;
            recs.cafe11am.active = true;
            if (answers.goal === 'energy') recs.cafe2pm.active = true;
        }

        // 4. Adaptógenos Generales
        recs.curcuma.active = true; // Antiinflamatorio natural siempre bueno

        return recs;
    };

    const steps = [
        {
            title: '¿Cuál es tu objetivo principal hoy?',
            icon: <Target className="text-indigo-400" size={32} />,
            options: [
                { label: 'Enfoque Profundo (Deep Work)', value: 'focus', icon: <Brain size={20} /> },
                { label: 'Energía Física y Resistencia', value: 'energy', icon: <Zap size={20} /> },
                { label: 'Recuperación y Sueño Reparador', value: 'sleep', icon: <Moon size={20} /> }
            ]
        },
        {
            title: '¿Cómo toleras la cafeína?',
            icon: <Heart className="text-rose-400" size={32} />,
            options: [
                { label: 'Me pone ansioso/a o me quita el sueño', value: 'high', icon: <X size={20} /> },
                { label: 'La tolero bien, necesito el empuje', value: 'low', icon: <Zap size={20} /> }
            ]
        },
        {
            title: '¿Qué nivel de stack deseas usar?',
            icon: <Sparkles className="text-amber-400" size={32} />,
            options: [
                { label: 'Stack Base (Nutrición y básicos)', value: 'basic', icon: <Check size={20} /> },
                { label: 'Stack Premium (Nootrópicos avanzados)', value: 'premium', icon: <Star size={20} /> }
            ]
        }
    ];

    if (step >= steps.length) {
        const finalRecs = generateRecommendations();
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4">
                <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-emerald-500/30 max-w-md w-full text-center shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-400">
                            <Check size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Perfil Optimizado!</h2>
                    <p className="text-slate-400 text-sm mb-8">Hemos ajustado tus suplementos basándonos en protocolos de salud para maximizar tu {answers.goal === 'focus' ? 'enfoque' : answers.goal === 'energy' ? 'energía' : 'descanso'}.</p>

                    <div className="flex gap-4">
                        <button onClick={onCancel} className="flex-1 py-3 px-4 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-all">
                            Cancelar
                        </button>
                        <button onClick={() => onApply(finalRecs)} className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25 transition-all">
                            Aplicar Stack
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentStepData = steps[step];

    return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[3rem] border border-indigo-500/20 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : i < step ? 'w-4 bg-indigo-500/50' : 'w-4 bg-slate-800'}`}></div>
                        ))}
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex justify-center mb-6">{currentStepData.icon}</div>
                <h2 className="text-2xl font-black text-white text-center mb-8">{currentStepData.title}</h2>

                <div className="space-y-4">
                    {currentStepData.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(step === 0 ? 'goal' : step === 1 ? 'caffeineSensitivity' : 'budget', opt.value)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-slate-800/30 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-left transition-all group"
                        >
                            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 transition-colors">
                                {opt.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Importamos los iconos que faltaban en el archivo
import { Target, Sparkles, Star } from 'lucide-react';

export default Recomendador;
