import { Link } from '@inertiajs/react';
import { LayoutGrid, Layers, Scale, Store, TrendingUp, Wheat } from 'lucide-react';
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
import { index as foodBalanceCommoditiesIndex } from '@/routes/food-balance-commodities';
import { index as foodBalancesIndex } from '@/routes/food-balances';
import { index as hetsIndex } from '@/routes/hets';
import { index as marketsIndex } from '@/routes/markets';
import { index as producerCommoditiesIndex } from '@/routes/producer-commodities';
import { index as producerHapsIndex } from '@/routes/producer-haps';
import { index as producerPricesIndex } from '@/routes/producer-prices';
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
                title: 'Harga Produsen',
                href: producerPricesIndex(),
                icon: Wheat,
                badge: '6 Komoditas',
            },
            {
                title: 'Neraca Pangan',
                href: foodBalancesIndex(),
                icon: Layers,
                badge: '11 Komoditas',
            },
            {
                title: 'Kelola HET Konsumen',
                href: hetsIndex(),
                icon: Scale,
            },
            {
                title: 'Kelola HAP Produsen',
                href: producerHapsIndex(),
                icon: Scale,
            },
        ],
    },
    {
        title: 'Data Master',
        items: [
            {
                title: 'Komoditas Konsumen',
                href: commoditiesIndex(),
                icon: Wheat,
            },
            {
                title: 'Komoditas Produsen',
                href: producerCommoditiesIndex(),
                icon: Wheat,
            },
            {
                title: 'Komoditas Neraca',
                href: foodBalanceCommoditiesIndex(),
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
    return null;
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
