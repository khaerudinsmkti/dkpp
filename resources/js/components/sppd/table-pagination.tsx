import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TablePaginationProps {
    totalItems: number;
    currentPage: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    itemLabel?: string;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function TablePagination({
    totalItems,
    currentPage,
    perPage,
    onPageChange,
    onPerPageChange,
    itemLabel = 'Batch',
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startItem = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1;
    const endItem = Math.min(totalItems, safePage * perPage);

    const getVisiblePages = (): Array<number | 'ellipsis'> => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: Array<number | 'ellipsis'> = [1];
        if (safePage > 3) {
            pages.push('ellipsis');
        }
        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);
        for (let p = start; p <= end; p++) {
            pages.push(p);
        }
        if (safePage < totalPages - 2) {
            pages.push('ellipsis');
        }
        pages.push(totalPages);
        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50/70 px-4 py-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="flex flex-wrap items-center gap-3 text-neutral-600 dark:text-neutral-400">
                <span>
                    Menampilkan{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                        {startItem}–{endItem}
                    </strong>{' '}
                    dari{' '}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                        {totalItems}
                    </strong>{' '}
                    {itemLabel}
                </span>

                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500">
                        Per halaman:
                    </span>
                    <Select
                        value={String(perPage)}
                        onValueChange={(v) => {
                            onPerPageChange(Number(v));
                            onPageChange(1);
                        }}
                    >
                        <SelectTrigger className="h-7 w-[68px] bg-white text-xs font-bold dark:bg-neutral-900">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PER_PAGE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={safePage <= 1}
                    onClick={() => onPageChange(safePage - 1)}
                    className="h-7 gap-1 bg-white px-2 text-xs font-semibold dark:bg-neutral-900"
                >
                    <ChevronLeft className="size-3.5" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                {getVisiblePages().map((item, idx) =>
                    item === 'ellipsis' ? (
                        <span
                            key={`el-${idx}`}
                            className="px-1.5 text-neutral-400"
                        >
                            ...
                        </span>
                    ) : (
                        <Button
                            key={item}
                            type="button"
                            size="sm"
                            variant={item === safePage ? 'default' : 'outline'}
                            onClick={() => onPageChange(item)}
                            className={
                                item === safePage
                                    ? 'h-7 min-w-7 bg-[#006565] px-2 text-xs font-bold text-white hover:bg-[#005252]'
                                    : 'h-7 min-w-7 bg-white px-2 text-xs font-semibold dark:bg-neutral-900'
                            }
                        >
                            {item}
                        </Button>
                    )
                )}

                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={safePage >= totalPages}
                    onClick={() => onPageChange(safePage + 1)}
                    className="h-7 gap-1 bg-white px-2 text-xs font-semibold dark:bg-neutral-900"
                >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
