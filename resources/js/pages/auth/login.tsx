import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk - DKPP Indramayu" />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Email Field */}
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
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@indramayukab.go.id"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password Field */}
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-bold text-slate-700"
                                    >
                                        Kata Sandi
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-bold text-[#006565] no-underline hover:text-[#005252] hover:underline"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center space-x-2.5 pt-0.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-slate-300 data-[state=checked]:border-[#006565] data-[state=checked]:bg-[#006565]"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-xs font-medium text-slate-600 select-none"
                                >
                                    Ingat saya di perangkat ini
                                </Label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-[#006565] text-xs font-bold text-white shadow-md shadow-[#006565]/25 transition-all hover:bg-[#005252] sm:text-sm"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk ke Portal
                            </Button>
                        </div>

                        {/* Sign Up Redirect */}
                        <div className="pt-2 text-center text-xs text-slate-500">
                            Belum memiliki akun petugas?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={6}
                                className="font-bold text-[#006565] no-underline hover:text-[#005252] hover:underline"
                            >
                                Registrasi Sekarang
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Portal',
    description: 'Gunakan akun resmi Anda untuk mengakses sistem dan dashboard',
};
