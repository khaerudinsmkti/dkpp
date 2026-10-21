import { Link } from '@inertiajs/react';
import { Apple, Compass, FileSpreadsheet, LayoutGrid, Layers, MapPin, Package, PieChart, Scale, ShieldCheck, Store, TrendingUp, Wheat } from 'lucide-react';
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
import { index as cppdIndex } from '@/routes/cppd';
import { index as foodBalanceCommoditiesIndex } from '@/routes/food-balance-commodities';
import { index as foodBalancesIndex } from '@/routes/food-balances';
import { index as hetsIndex } from '@/routes/hets';
import { index as marketsIndex } from '@/routes/markets';
import { index as pphFoodGroupsIndex } from '@/routes/pph-food-groups';
import { index as pphScoreDetailsIndex } from '@/routes/pph-score-details';
import { index as pphScoresIndex } from '@/routes/pph-scores';
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
                title: 'Indeks Ketahanan Pangan (IKP)',
                href: '/ikp-scores',
                icon: ShieldCheck,
            },
            {
                title: 'Kerawanan Pangan (SKPG)',
                href: '/skpg-admin',
                icon: MapPin,
            },
            {
                title: 'FSVA (Ketahanan Desa)',
                href: '/fsva-admin',
                icon: Compass,
            },
            {
                title: 'Cadangan Pangan (CPPD)',
                href: cppdIndex(),
                icon: Package,
            },
            {
                title: 'Harga Konsumen',
                href: consumerPricesIndex(),
                icon: TrendingUp,
            },
            {
                title: 'Harga Produsen',
                href: producerPricesIndex(),
                icon: Wheat,
            },
            {
                title: 'Neraca Pangan',
                href: foodBalancesIndex(),
                icon: Layers,
            },
            {
                title: 'Skor PPH',
                href: pphScoresIndex(),
                icon: PieChart,
            },
            {
                title: 'Detail Skor PPH',
                href: pphScoreDetailsIndex(),
                icon: FileSpreadsheet,
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
                title: 'Kelompok Pangan PPH',
                href: pphFoodGroupsIndex(),
                icon: Apple,
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
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-r border-teal-200/80 bg-gradient-to-b from-[#eaf6f4] via-[#f5fbf9] to-[#dff0ec] shadow-xs dark:border-emerald-950/70 dark:from-[#062421] dark:via-[#041a18] dark:to-[#02100e]"
        >
            <SidebarHeader className="px-3 pt-3.5 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-auto rounded-2xl p-2 hover:bg-emerald-100/60 dark:hover:bg-white/5 transition-colors">
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

            <SidebarFooter className="mt-auto gap-3 p-3 border-t border-teal-200/50 dark:border-emerald-950/60">
                <SidebarPromoCard />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
