import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        for (const group of normalizedGroups) {
            for (const item of group.items) {
                if (item.items && item.items.length > 0) {
                    const hasActiveChild = item.items.some(
                        (sub) =>
                            sub.isActive ??
                            (sub.href ? isCurrentUrl(sub.href) : false),
                    );
                    if (hasActiveChild) {
                        initial[item.title] = true;
                    }
                }
            }
        }
        return initial;
    });

    useEffect(() => {
        setOpenMenus((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const group of normalizedGroups) {
                for (const item of group.items) {
                    if (item.items && item.items.length > 0) {
                        const hasActiveChild = item.items.some(
                            (sub) =>
                                sub.isActive ??
                                (sub.href ? isCurrentUrl(sub.href) : false),
                        );
                        if (hasActiveChild && !next[item.title]) {
                            next[item.title] = true;
                            changed = true;
                        }
                    }
                }
            }
            return changed ? next : prev;
        });
    }, [normalizedGroups, isCurrentUrl]);

    const toggleSubmenu = (title: string) => {
        setOpenMenus((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

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
                            const hasChildren =
                                Array.isArray(item.items) &&
                                item.items.length > 0;

                            if (hasChildren) {
                                const hasActiveChild = item.items!.some(
                                    (sub) =>
                                        sub.isActive ??
                                        (sub.href
                                            ? isCurrentUrl(sub.href)
                                            : false),
                                );
                                const isOpen = Boolean(openMenus[item.title]);

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            type="button"
                                            onClick={() =>
                                                toggleSubmenu(item.title)
                                            }
                                            tooltip={{ children: item.title }}
                                            className={cn(
                                                'transition-all duration-200 rounded-xl px-3 py-2 cursor-pointer',
                                                hasActiveChild
                                                    ? 'bg-emerald-100/80 font-bold text-[#006565] ring-1 ring-[#006565]/20 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'font-medium text-slate-700 hover:bg-emerald-100/70 hover:text-[#006565] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                                            )}
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                {item.icon && (
                                                    <item.icon
                                                        size={18}
                                                        className={cn(
                                                            'shrink-0 transition-colors',
                                                            hasActiveChild
                                                                ? 'text-[#006565] dark:text-emerald-300'
                                                                : 'text-teal-700/60 dark:text-emerald-400/60',
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight
                                                className={cn(
                                                    'ml-auto size-4 shrink-0 text-teal-700/70 transition-transform duration-200 dark:text-emerald-400/70',
                                                    isOpen && 'rotate-90',
                                                )}
                                            />
                                        </SidebarMenuButton>

                                        {isOpen && (
                                            <SidebarMenuSub className="mt-1 border-l-2 border-teal-200/80 pl-2.5 dark:border-emerald-800/70">
                                                {item.items!.map((sub) => {
                                                    const subActive =
                                                        sub.isActive ??
                                                        (sub.href
                                                            ? isCurrentUrl(
                                                                  sub.href,
                                                              )
                                                            : false);

                                                    return (
                                                        <SidebarMenuSubItem
                                                            key={sub.title}
                                                        >
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={
                                                                    subActive
                                                                }
                                                                className={cn(
                                                                    'h-8 rounded-lg px-2.5 transition-all duration-150',
                                                                    subActive
                                                                        ? 'bg-gradient-to-r from-[#006565] via-emerald-700 to-teal-700 font-bold !text-white shadow-md shadow-[#006565]/20 ring-1 ring-[#006565]/30 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#006565] data-[active=true]:via-emerald-700 data-[active=true]:to-teal-700 data-[active=true]:!text-white hover:!text-white dark:from-emerald-500 dark:via-emerald-600 dark:to-teal-600 dark:data-[active=true]:from-emerald-500 dark:data-[active=true]:to-teal-600'
                                                                        : 'text-xs font-medium text-slate-600 hover:bg-emerald-100/70 hover:text-[#006565] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                                                                )}
                                                            >
                                                                <Link
                                                                    href={
                                                                        sub.href ??
                                                                        '#'
                                                                    }
                                                                    prefetch
                                                                    className={cn(
                                                                        'flex w-full items-center gap-2',
                                                                        subActive &&
                                                                            '!text-white',
                                                                    )}
                                                                >
                                                                    {sub.icon && (
                                                                        <sub.icon
                                                                            className={cn(
                                                                                'size-3.5 shrink-0',
                                                                                subActive
                                                                                    ? '!text-white'
                                                                                    : 'text-teal-700/60 dark:text-emerald-400/60',
                                                                            )}
                                                                        />
                                                                    )}
                                                                    <span
                                                                        className={cn(
                                                                            'truncate text-xs',
                                                                            subActive &&
                                                                                '!text-white font-bold',
                                                                        )}
                                                                    >
                                                                        {
                                                                            sub.title
                                                                        }
                                                                    </span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    );
                                                })}
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                );
                            }

                            const active =
                                item.isActive ??
                                (item.href ? isCurrentUrl(item.href) : false);

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
                                            href={item.href ?? '#'}
                                            prefetch
                                            className={cn(
                                                'flex w-full items-center',
                                                active && '!text-white',
                                            )}
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
                                                <span
                                                    className={cn(
                                                        'truncate',
                                                        active
                                                            ? '!text-white font-bold'
                                                            : '',
                                                    )}
                                                >
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
