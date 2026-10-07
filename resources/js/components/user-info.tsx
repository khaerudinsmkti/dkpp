import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200/80 dark:ring-slate-700">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-[#e6f4f2] text-xs font-bold text-[#006565] dark:bg-teal-950 dark:text-teal-300">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-800 dark:text-slate-200">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
