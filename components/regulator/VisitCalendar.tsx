'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface Visit {
    id: string;
    tenant: { name: string };
    scheduledDate: string;
    purpose: string;
    status: string;
}

export default function VisitCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVisits();
    }, [currentMonth]);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const startDate = startOfMonth(currentMonth).toISOString();
            const endDate = endOfMonth(currentMonth).toISOString();
            const res = await fetch(`/api/regulator/field-visits/schedule?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setVisits(data);
            }
        } catch (error) {
            console.error('Failed to fetch calendar visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="card p-6 bg-white shadow-lg border-white/40">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">←</button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
                {days.map((day) => {
                    const dayVisits = visits.filter(v => isSameDay(new Date(v.scheduledDate), day));
                    return (
                        <div key={day.toString()} className="min-h-[100px] p-2 border border-gray-50 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-primary-600' : 'text-gray-700'}`}>
                                {format(day, 'd')}
                            </span>
                            <div className="mt-1 space-y-1">
                                {dayVisits.map(v => (
                                    <div key={v.id} className="text-[10px] p-1 bg-primary-100 text-primary-700 rounded truncate font-medium" title={v.purpose}>
                                        {v.tenant.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
