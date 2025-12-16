'use client';

import { useRouter } from 'next/navigation';

export function BackHeader({ title, className }: { title: string; className?: string }) {
    const router = useRouter();

    return (
        <div className={`border-b flex items-center gap-4 sticky top-0 bg-white z-10 shadow-sm ${className ?? 'p-4'}`}>
            <button onClick={() => router.back()} className="text-2xl hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors">
                ←
            </button>
            <h1 className="text-xl font-bold">{title}</h1>
        </div>
    );
}
