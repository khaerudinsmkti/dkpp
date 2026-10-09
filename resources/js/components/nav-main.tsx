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
                                                ? 'bg-[#F5F3FF] font-semibold text-[#7C3AED] shadow-xs dark:bg-purple-950/60 dark:text-purple-300'
                                                : 'font-medium text-slate-600 hover:bg-[#F5F3FF]/60 hover:text-[#7C3AED] dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
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
                                                                ? 'text-[#7C3AED] dark:text-purple-300'
                                                                : 'text-slate-400 group-hover:text-[#7C3AED] dark:text-slate-500 dark:group-hover:text-slate-300',
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
                                                            ? 'bg-[#7C3AED] text-white dark:bg-purple-500 dark:text-white'
                                                            : 'border border-purple-200/60 bg-[#F5F3FF] text-[#7C3AED] dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300',
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
