export type User = {
    id: number;
    role_id?: number | null;
    name: string;
    email: string;
    nip?: string | null;
    jabatan?: string | null;
    phone?: string | null;
    is_active?: boolean;
    role_name?: string;
    role_slug?: string;
    role_color?: string;
    is_super_admin?: boolean;
    permissions?: Record<string, Record<string, boolean>>;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
