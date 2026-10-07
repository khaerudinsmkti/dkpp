import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

type NavMainProps = {
    items?: NavItem[];
    groups?: NavGroup[];
};

export function NavMain({ items, groups }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    const normalizedGroups: NavGroup[] = groups ?? (items ? [{ items }] : []);

    return (
        <div className="flex flex-col gap-3 py-1">
            {normalizedGroups.map((group, groupIndex) => (
                <SidebarGroup key={group.title ?? groupIndex} className="px-3 py-0">
                    {group.title && (
                        <SidebarGroupLabel className="px-3 pb-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase select-none">
                            {group.title}
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu className="gap-1">
                        {group.items.map((item) => {
                            const active = item.isActive ?? isCurrentUrl(item.href);

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className={cn(
                                            'transition-all duration-200',
                                            active
                                                ? 'bg-[#e6f4f2] font-bold text-[#006565] shadow-xs dark:bg-teal-950/60 dark:text-teal-300'
                                                : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <Link
                                            href={item.href}
                                            prefetch
                                            className="flex w-full items-center justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {item.icon && (
                                                    <item.icon
                                                        size={18}
                                                        className={cn(
                                                            'shrink-0 transition-colors',
                                                            active
                                                                ? 'text-[#006565] dark:text-teal-300'
                                                                : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300',
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate">{item.title}</span>
                                            </div>

                                            {item.badge && (
                                                <span
                                                    className={cn(
                                                        'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors group-data-[collapsible=icon]:hidden',
                                                        active
                                                            ? 'bg-[#006565] text-white dark:bg-teal-400 dark:text-slate-900'
                                                            : 'border border-teal-200/60 bg-teal-50 text-[#006565] dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300',
                                                    )}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </div>
    );
}
