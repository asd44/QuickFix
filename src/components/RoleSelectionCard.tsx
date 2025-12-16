import { ReactNode } from 'react';

interface RoleSelectionCardProps {
    title: string;
    subtitle: string;
    icon: ReactNode;
    selected: boolean;
    onClick: () => void;
}

export function RoleSelectionCard({ title, subtitle, icon, selected, onClick }: RoleSelectionCardProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 relative text-left group ${selected
                    ? 'bg-emerald-50 border-2 border-emerald-400 shadow-sm'
                    : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
                }`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-white text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:text-gray-600'
                }`}>
                {icon}
            </div>

            <div className="flex-1">
                <h3 className={`font-bold text-lg mb-0.5 ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {title}
                </h3>
                <p className={`text-sm ${selected ? 'text-gray-600' : 'text-gray-400'}`}>
                    {subtitle}
                </p>
            </div>

            {selected && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg tracking-wider">
                    SELECTED
                </div>
            )}
        </button>
    );
}
