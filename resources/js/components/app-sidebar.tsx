import { Link, usePage } from '@inertiajs/react';
import {
    Apple,
    Award,
    Briefcase,
    Coins,
    Compass,
    FileSpreadsheet,
    FolderKanban,
    LayoutGrid,
    Layers,
    MapPin,
    Package,
    PieChart,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Store,
    TrendingUp,
    UserCheck,
    Users,
    Wheat,
} from 'lucide-react';
import { useMemo } from 'react';
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
import type { NavGroup, NavItem } from '@/types';

interface PermissionAwareNavItem extends NavItem {
    moduleKey?: string;
    items?: PermissionAwareNavItem[];
}

interface PermissionAwareNavGroup {
    title?: string;
    items: PermissionAwareNavItem[];
}

const rawNavGroups: PermissionAwareNavGroup[] = [
    {
        title: 'Menu Utama',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
                moduleKey: 'dashboard',
            },
        ],
    },
    {
        title: 'Pemantauan Pangan',
        items: [
            {
                title: 'IKP',
                href: '/ikp-scores',
                icon: ShieldCheck,
                moduleKey: 'ikp',
            },
            {
                title: 'SKPG',
                href: '/skpg-admin',
                icon: MapPin,
                moduleKey: 'skpg',
            },
            {
                title: 'FSVA',
                href: '/fsva-admin',
                icon: Compass,
                moduleKey: 'fsva',
            },
            {
                title: 'CPPD',
                href: cppdIndex(),
                icon: Package,
                moduleKey: 'cppd',
            },
            {
                title: 'Harga Konsumen',
                href: consumerPricesIndex(),
                icon: TrendingUp,
                moduleKey: 'consumer_prices',
            },
            {
                title: 'Harga Produsen',
                href: producerPricesIndex(),
                icon: Wheat,
                moduleKey: 'producer_prices',
            },
            {
                title: 'Neraca Pangan',
                href: foodBalancesIndex(),
                icon: Layers,
                moduleKey: 'food_balances',
            },
            {
                title: 'Skor PPH',
                href: pphScoresIndex(),
                icon: PieChart,
                moduleKey: 'pph_scores',
            },
            {
                title: 'Detail Skor PPH',
                href: pphScoreDetailsIndex(),
                icon: FileSpreadsheet,
                moduleKey: 'pph_scores',
            },
            {
                title: 'Kelola HET Konsumen',
                href: hetsIndex(),
                icon: Scale,
                moduleKey: 'hets_haps',
            },
            {
                title: 'Kelola HAP Produsen',
                href: producerHapsIndex(),
                icon: Scale,
                moduleKey: 'hets_haps',
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
                moduleKey: 'commodities',
            },
            {
                title: 'Komoditas Produsen',
                href: producerCommoditiesIndex(),
                icon: Wheat,
                moduleKey: 'commodities',
            },
            {
                title: 'Komoditas Neraca',
                href: foodBalanceCommoditiesIndex(),
                icon: Wheat,
                moduleKey: 'commodities',
            },
            {
                title: 'Kelompok Pangan PPH',
                href: pphFoodGroupsIndex(),
                icon: Apple,
                moduleKey: 'pph_food_groups',
            },
            {
                title: 'Kelola Pasar',
                href: marketsIndex(),
                icon: Store,
                moduleKey: 'markets',
            },
        ],
    },
    {
        title: 'SPPD Dalam Kota',
        items: [
            {
                title: 'Input & Batch SPPD',
                href: '/sppd-dalam-kota',
                icon: Briefcase,
                moduleKey: 'sppd_dalam_kota',
            },
            {
                title: 'Master Data SPPD',
                href: '#',
                icon: Layers,
                moduleKey: 'sppd_dalam_kota',
                items: [
                    {
                        title: 'Sub Kegiatan',
                        href: '/sppd-dalam-kota?tab=sub_kegiatan',
                        icon: FolderKanban,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Nomor DPA',
                        href: '/sppd-dalam-kota?tab=dpa',
                        icon: FileSpreadsheet,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Data Pegawai',
                        href: '/sppd-dalam-kota?tab=pegawai',
                        icon: Users,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Kepala Dinas',
                        href: '/sppd-dalam-kota?tab=kepala_dinas',
                        icon: Award,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Data PPTK',
                        href: '/sppd-dalam-kota?tab=pptk',
                        icon: UserCheck,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Data Bendahara',
                        href: '/sppd-dalam-kota?tab=bendahara',
                        icon: Coins,
                        moduleKey: 'sppd_dalam_kota',
                    },
                    {
                        title: 'Zonasi & Tarif',
                        href: '/sppd-dalam-kota?tab=zonasi',
                        icon: MapPin,
                        moduleKey: 'sppd_dalam_kota',
                    },
                ],
            },
        ],
    },
    {
        title: 'Administrasi Sistem',
        items: [
            {
                title: 'User, Role & Hak Akses',
                href: '/users-roles',
                icon: ShieldAlert,
                moduleKey: 'users_roles',
            },
        ],
    },
];

function SidebarPromoCard() {
    return null;
}

export function AppSidebar() {
    const page = usePage();
    const { auth } = page.props;
    const user = auth?.user;
    const currentUrlStr = page.url;

    const filteredNavGroups: NavGroup[] = useMemo(() => {
        const isSuper = user?.is_super_admin ?? true;
        const perms = user?.permissions;

        let currentPath = '/dashboard';
        let currentTab: string | null = null;
        try {
            const parsed = new URL(currentUrlStr, 'http://localhost');
            currentPath = parsed.pathname;
            currentTab = parsed.searchParams.get('tab');
        } catch {
            // fallback
        }

        const resolveSppdActive = (
            item: PermissionAwareNavItem,
        ): NavItem => {
            const mappedChildren = item.items
                ? item.items
                      .filter((sub) => {
                          if (isSuper || !perms || !sub.moduleKey) {
                              return true;
                          }
                          return Boolean(perms[sub.moduleKey]?.view);
                      })
                      .map(resolveSppdActive)
                : undefined;

            if (
                typeof item.href === 'string' &&
                item.href.startsWith('/sppd-dalam-kota')
            ) {
                const itemUrl = new URL(item.href, 'http://localhost');
                const itemTab = itemUrl.searchParams.get('tab');
                const isMatch =
                    currentPath === '/sppd-dalam-kota' &&
                    (itemTab
                        ? currentTab === itemTab
                        : !currentTab || currentTab === 'sppd');

                return {
                    ...item,
                    isActive: isMatch,
                    items: mappedChildren,
                };
            }

            return {
                ...item,
                items: mappedChildren,
            };
        };

        return rawNavGroups
            .map((group) => ({
                title: group.title,
                items: group.items
                    .filter((item) => {
                        if (isSuper || !perms || !item.moduleKey) {
                            return true;
                        }
                        return Boolean(perms[item.moduleKey]?.view);
                    })
                    .map(resolveSppdActive),
            }))
            .filter((group) => group.items.length > 0);
    }, [user, currentUrlStr]);

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
                <NavMain groups={filteredNavGroups} />
            </SidebarContent>

            <SidebarFooter className="mt-auto gap-3 p-3 border-t border-teal-200/50 dark:border-emerald-950/60">
                <SidebarPromoCard />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
