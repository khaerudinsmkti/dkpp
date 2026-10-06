import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Registrasi - DKPP Indramayu" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4.5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            {/* Name Field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-bold text-slate-700"
                                >
                                    Nama Lengkap
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Nama lengkap Anda"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

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
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="nama@indramayukab.go.id"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError
                                    message={errors.email}
                                    className="mt-1"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-bold text-slate-700"
                                >
                                    Kata Sandi
                                </Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Minimal 8 karakter"
                                    passwordrules={passwordRules}
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError
                                    message={errors.password}
                                    className="mt-1"
                                />
                            </div>

                            {/* Confirm Password Field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-xs font-bold text-slate-700"
                                >
                                    Konfirmasi Kata Sandi
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Ulangi kata sandi"
                                    passwordrules={passwordRules}
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-xs focus:border-[#006565] focus:bg-white focus:ring-2 focus:ring-[#006565]/15 sm:text-sm"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-1"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-[#006565] text-xs font-bold text-white shadow-md shadow-[#006565]/25 transition-all hover:bg-[#005252] sm:text-sm"
                                tabIndex={5}
                                data-test="register-user-button"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Daftar Akun Baru
                            </Button>
                        </div>

                        {/* Login Redirect Link */}
                        <div className="pt-2 text-center text-xs text-slate-500">
                            Sudah memiliki akun petugas?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-bold text-[#006565] no-underline hover:text-[#005252] hover:underline"
                            >
                                Masuk ke Portal
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Registrasi Akun Petugas',
    description:
        'Daftarkan akun resmi enumerator lapangan atau analis ketahanan pangan',
};
