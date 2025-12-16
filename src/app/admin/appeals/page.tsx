'use client';

import { useState, useEffect } from 'react';
import { ComplaintService } from '@/lib/services/complaint.service';
import { SuspensionAppeal } from '@/lib/types/database';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function AppealsPage() {
    const [appeals, setAppeals] = useState<SuspensionAppeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'resolved' | 'reviewed'>('pending');

    useEffect(() => {
        loadAppeals();
    }, [filter]);

    const loadAppeals = async () => {
        setLoading(true);
        try {
            const data = await ComplaintService.getAllAppeals(filter);
            setAppeals(data);
        } catch (error) {
            console.error('Failed to load appeals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async (id: string) => {
        try {
            await ComplaintService.updateAppealStatus(id, 'resolved');
            loadAppeals(); // Refresh list to remove it from pending or show as resolved
        } catch (error) {
            console.error('Failed to resolve appeal:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Suspension Appeals</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {(['pending', 'resolved'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : appeals.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No {filter} appeals</h3>
                        <p className="mt-1 text-gray-500">There are no appeals to review at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {appeals.map((appeal) => (
                            <div key={appeal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {appeal.userName || 'Provider'}
                                                </h3>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                    {appeal.userEmail}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                {appeal.mobile}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appeal.status === 'resolved'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {appeal.status.toUpperCase()}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {appeal.createdAt?.toDate ? appeal.createdAt.toDate().toLocaleDateString() + ' ' + appeal.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-md border border-red-100 mb-6">
                                        <h4 className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">Complaint / Appeal Description</h4>
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {appeal.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 border-t pt-4">
                                        <Link
                                            href={`/admin/providers/view?id=${appeal.userId}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            View Profile
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </Link>

                                        {appeal.status === 'pending' && (
                                            <div className="ml-auto flex gap-3">
                                                <button
                                                    onClick={() => handleMarkResolved(appeal.id)}
                                                    className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                                                >
                                                    Mark as Resolved
                                                </button>
                                                <Link href={`/admin/providers/view?id=${appeal.userId}`}>
                                                    <button className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm border border-transparent transition-colors">
                                                        Review & Act
                                                    </button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
