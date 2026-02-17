'use client';

import { useState } from 'react';

interface GPSTrackerProps {
    visitId: string;
    onLogged?: (lat: number, lng: number) => void;
}

export default function GPSTracker({ visitId, onLogged }: GPSTrackerProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const logLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch('/api/regulator/field-visits/geo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ visitId, latitude, longitude }),
                    });

                    if (res.ok) {
                        setCoords({ lat: latitude, lng: longitude });
                        if (onLogged) onLogged(latitude, longitude);
                    } else {
                        setError('Failed to log location to server');
                    }
                } catch (err) {
                    setError('Connection error while logging location');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError(`Error: ${err.message}`);
                setLoading(false);
            }
        );
    };

    return (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <span>📍</span> GPS Verification
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Log your current coordinates to verify on-site presence.</p>
                </div>
                {!coords ? (
                    <button
                        onClick={logLocation}
                        disabled={loading}
                        className="btn btn-primary text-xs py-2 px-4 shadow-md shadow-primary-500/20"
                    >
                        {loading ? 'Locating...' : 'Log My Location'}
                    </button>
                ) : (
                    <div className="text-right">
                        <p className="text-xs font-bold text-success-600 flex items-center gap-1 justify-end">
                            <span>✅</span> Logged Successfully
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </p>
                    </div>
                )}
            </div>
            {error && <p className="mt-2 text-xs text-danger-600 font-medium">⚠️ {error}</p>}
        </div>
    );
}
