import { useCallback, useEffect, useMemo, useState } from "react";
import { Locale } from "../i18n";
import { ApiBooking, ApiPaginationMeta, BookingType, getBookings } from "./bookings.api";

export function useBookings(lang: Locale, type: BookingType, perPage: number, paymentStatus: "paid" | "unpaid" | "all" = "paid", search?: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiBooking[]>([]);
    const [meta, setMeta] = useState<ApiPaginationMeta | null>(null);
    const [page, setPage] = useState(1);

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        const apiPaymentStatus = paymentStatus === "all" ? undefined : paymentStatus;
        const res = await getBookings({ lang, type, page, per_page: perPage, payment_status: apiPaymentStatus, search });
        if (res.ok) {
            setApiRows(res.data ?? []);
            setMeta(res.meta ?? null);
        } else {
            setApiRows([]);
            setMeta(null);
        }
        setIsLoading(false);
    }, [lang, type, page, perPage, paymentStatus, search]);


    useEffect(() => {
        // reset page when type, search, or payment filter changes
        setPage(1);
    }, [type, paymentStatus, search]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    const canPrev = useMemo(() => (meta ? meta.current_page > 1 : false), [meta]);
    const canNext = useMemo(() => (meta ? meta.current_page < meta.last_page : false), [meta]);

    return {
        isLoading,
        apiRows,
        meta,
        page,
        setPage,
        canPrev,
        canNext,
        refetch: fetcher,
    };
}
