import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Lupa Kata Sandi - DKPP Indramayu" />

            {status && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
                    {status}
                </div>
            )}

            <div className="space-y-5">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-xs font-bold text-slate-700"
                                >
                                    Alamat Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="nama@indramayukab.go.id"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="h-11 w-full cursor-pointer rounded-xl bg-[#006565] text-xs font-bold text-white shadow-md shadow-[#006565]/25 transition-all hover:bg-[#005252] sm:text-sm"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Kirim Tautan Pemulihan
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="text-center text-xs text-slate-500">
                    <span>Atau, kembali ke </span>
                    <TextLink
                        href={login()}
                        className="font-bold text-[#006565] no-underline hover:text-[#005252] hover:underline"
                    >
                        halaman masuk
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa Kata Sandi',
    description:
        'Masukkan alamat email akun Anda untuk menerima tautan pemulihan kata sandi',
};
