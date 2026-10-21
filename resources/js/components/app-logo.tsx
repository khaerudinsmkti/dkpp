import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;
    const [imgFailed, setImgFailed] = useState(false);

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex aspect-square size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006565] to-emerald-700 text-white shadow-xs ring-1 ring-emerald-500/30 overflow-hidden p-1.5">
                {!imgFailed ? (
                    <img
                        src="/storage/indramayu_logo.png"
                        alt="Logo Indramayu"
                        className="h-full w-auto object-contain drop-shadow-xs"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <AppLogoIcon className="size-5.5 fill-current text-white" />
                )}
            </div>
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white font-headline">
                    {name ?? 'DKPP Indramayu'}
                </span>
                <span className="truncate text-[10px] font-bold tracking-wider text-[#006565] uppercase dark:text-emerald-400">
                    Sistem Pangan
                </span>
            </div>
        </div>
    );
}
