import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,
) => boolean;

export type IsCurrentOrParentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();
    const origin =
        typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost';
    const currentParsed = new URL(page.url, origin);
    const currentUrlPath = currentParsed.pathname;

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,
    ) => {
        const urlString = toUrl(urlToCheck);
        if (!urlString || urlString === '#') {
            return false;
        }

        const effectiveCurrent = currentUrl
            ? new URL(currentUrl, origin)
            : currentParsed;

        let targetParsed: URL;
        try {
            targetParsed = new URL(urlString, origin);
        } catch {
            return false;
        }

        const pathMatches = startsWith
            ? effectiveCurrent.pathname.startsWith(targetParsed.pathname)
            : targetParsed.pathname === effectiveCurrent.pathname;

        if (!pathMatches) {
            return false;
        }

        const targetEntries = Array.from(targetParsed.searchParams.entries());
        if (targetEntries.length > 0) {
            return targetEntries.every(([key, value]) => {
                const currentVal = effectiveCurrent.searchParams.get(key);
                if (currentVal !== null) {
                    return currentVal === value;
                }
                // Default tab dashboard saat URL /realisasi-anggaran/murni atau /perubahan tanpa ?tab=
                if (
                    key === 'tab' &&
                    value === 'dashboard' &&
                    effectiveCurrent.pathname.startsWith('/realisasi-anggaran')
                ) {
                    return true;
                }
                return false;
            });
        }

        // Jika menu utama tanpa ?tab= (misal /sppd-dalam-kota), jangan aktif saat membuka submenu ?tab=...
        const currentTab = effectiveCurrent.searchParams.get('tab');
        if (currentTab && !startsWith) {
            return false;
        }

        return true;
    };

    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        return isCurrentUrl(urlToCheck, currentUrl, true);
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        whenCurrentUrl,
    };
}
