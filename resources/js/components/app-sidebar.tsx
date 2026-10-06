import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Scale, Store, TrendingUp, Wheat } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Harga Konsumen',
        href: consumerPricesIndex(),
        icon: TrendingUp,
    },
    {
        title: 'Kelola HET',
        href: hetsIndex(),
        icon: Scale,
    },
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
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
