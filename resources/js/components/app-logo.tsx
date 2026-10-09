import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-xs ring-1 ring-purple-600/30">
                <AppLogoIcon className="size-5.5 fill-current text-white" />
            </div>
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white font-headline">
                    {name ?? 'DKPP Indramayu'}
                </span>
                <span className="truncate text-[10px] font-bold tracking-wider text-[#7C3AED] uppercase dark:text-purple-400">
                    Sistem Pangan
                </span>
            </div>
        </div>
    );
}
