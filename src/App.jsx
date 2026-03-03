import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular carga inicial mientras implementamos Firebase real
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <>
            {user ? (
                <Dashboard user={user} onLogout={() => setUser(null)} />
            ) : (
                <Login onLogin={(mockUser) => setUser(mockUser)} />
            )}
        </>
    );
}

export default App;
