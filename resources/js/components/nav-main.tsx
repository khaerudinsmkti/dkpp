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
                        <SidebarGroupLabel className="px-3 pb-1.5 text-[10.5px] font-extrabold tracking-wider text-[#006565]/80 uppercase select-none dark:text-emerald-400/90">
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
                                            'transition-all duration-200 rounded-xl px-3 py-2',
                                            active
                                                ? 'bg-gradient-to-r from-[#006565] via-emerald-700 to-teal-700 font-bold !text-white shadow-md shadow-[#006565]/20 ring-1 ring-[#006565]/30 data-[active=true]:!text-white dark:from-emerald-500 dark:via-emerald-600 dark:to-teal-600 dark:!text-white dark:shadow-emerald-950/60 dark:ring-white/20 dark:data-[active=true]:!text-white'
                                                : 'font-medium text-slate-700 hover:bg-emerald-100/70 hover:text-[#006565] active:bg-emerald-100/90 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                                        )}
                                    >
                                        <Link
                                            href={item.href}
                                            prefetch
                                            className={cn("flex w-full items-center", active && "!text-white")}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {item.icon && (
                                                    <item.icon
                                                        size={18}
                                                        className={cn(
                                                            'shrink-0 transition-colors',
                                                            active
                                                                ? '!text-white drop-shadow-xs'
                                                                : 'text-teal-700/60 group-hover:text-[#006565] dark:text-emerald-400/60 dark:group-hover:text-emerald-300',
                                                        )}
                                                    />
                                                )}
                                                <span className={cn("truncate", active ? "!text-white font-bold" : "")}>
                                                    {item.title}
                                                </span>
                                            </div>
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
