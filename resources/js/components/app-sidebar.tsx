import { Link } from '@inertiajs/react';
import { LayoutGrid, Scale, Store, TrendingUp, Wheat } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as commoditiesIndex } from '@/routes/commodities';
import { index as consumerPricesIndex } from '@/routes/consumer-prices';
import { index as hetsIndex } from '@/routes/hets';
import { index as marketsIndex } from '@/routes/markets';
import type { NavGroup } from '@/types';

const navGroups: NavGroup[] = [
    {
        title: 'Menu Utama',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Pemantauan Pangan',
        items: [
            {
                title: 'Harga Konsumen',
                href: consumerPricesIndex(),
                icon: TrendingUp,
                badge: '25 Komoditas',
            },
            {
                title: 'Kelola HET',
                href: hetsIndex(),
                icon: Scale,
            },
        ],
    },
    {
        title: 'Data Master',
        items: [
            {
                title: 'Kelola Komoditas',
                href: commoditiesIndex(),
                icon: Wheat,
            },
            {
                title: 'Kelola Pasar',
                href: marketsIndex(),
                icon: Store,
            },
        ],
    },
];

function SidebarPromoCard() {
    return (
        <div className="relative mx-1 overflow-hidden rounded-3xl border border-teal-100/80 bg-gradient-to-br from-[#e6f4f2] via-teal-50/70 to-[#d8f0ed] p-4 shadow-xs group-data-[collapsible=icon]:hidden dark:border-teal-900/60 dark:from-teal-950/40 dark:via-teal-900/20 dark:to-teal-950/50">
            <svg
                className="pointer-events-none absolute -right-2 -bottom-2 h-16 w-24 text-teal-200/60 dark:text-teal-900/40"
                viewBox="0 0 100 60"
                fill="currentColor"
            >
                <path d="M0 45 C 30 60, 60 20, 100 35 L 100 60 L 0 60 Z" />
            </svg>
            <div className="relative z-10">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-[#006565] shadow-xs ring-1 ring-teal-100/80 dark:bg-slate-900/90 dark:text-teal-300 dark:ring-teal-900">
                    <Wheat size={18} />
                </div>
                <p className="text-xs leading-snug font-black text-slate-800 dark:text-slate-100">
                    DKPP Indramayu<br />Pantau Pangan
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Pengawasan 25 komoditas & regulasi HET pasar.
                </p>
            </div>
        </div>
    );
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SidebarHeader className="px-3 pt-3.5 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-auto rounded-2xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0 py-2">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter className="mt-auto gap-3 p-3">
                <SidebarPromoCard />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
