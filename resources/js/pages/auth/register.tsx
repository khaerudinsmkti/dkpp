import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { login } from '@/routes';

export default function Register() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <Head title="Pendaftaran Dinonaktifkan - DKPP Indramayu" />
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Pendaftaran Ditutup</h2>
            <p className="max-w-sm text-xs text-slate-500">
                Pendaftaran akun mandiri telah dinonaktifkan. Silakan hubungi Administrator DKPP untuk mendapatkan akses akun petugas.
            </p>
            <Button asChild className="mt-2 rounded-xl bg-[#006565] text-xs font-bold text-white hover:bg-[#005252]">
                <Link href={login()}>Kembali ke Login</Link>
            </Button>
        </div>
    );
}

Register.layout = {
    title: 'Pendaftaran Ditutup',
    description: 'Pendaftaran akun baru telah dinonaktifkan',
};
