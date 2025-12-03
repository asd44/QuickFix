'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const StudentSidebar = () => {
    const pathname = usePathname();

    const links = [
        { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
        { href: '/student/bookings', label: 'My Bookings', icon: '📅' },
        { href: '/student/messages', label: 'Messages', icon: '💬' },
        { href: '/student/favorites', label: 'Favorites', icon: '❤️' },
    ];

    return (
        <aside className="w-full md:w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)] p-4">
            <nav className="space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === link.href
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span className="text-xl">{link.icon}</span>
                        <span className="font-medium">{link.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};
