import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Check,
    CheckCircle2,
    CheckSquare,
    Copy,
    Edit3,
    Eye,
    FileSpreadsheet,
    KeyRound,
    Layers,
    Lock,
    Mail,
    Phone,
    Plus,
    Power,
    RefreshCw,
    Save,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Table2,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface UserItem {
    id: number;
    name: string;
    email: string;
    nip: string | null;
    jabatan: string | null;
    phone: string | null;
    is_active: boolean;
    role_id: number | null;
    role_name: string;
    role_slug: string;
    role_color: string;
    email_verified: boolean;
    created_at: string | null;
}

interface RoleItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    is_system: boolean;
    is_active: boolean;
    users_count: number;
    permissions: Record<string, Record<string, boolean>>;
    granted_permissions_count: number;
    total_possible_permissions: number;
    coverage_percentage: number;
    viewable_modules_count: number;
    updated_at: string | null;
}

interface ModuleDefinition {
    key: string;
    name: string;
    category: string;
    route_hint: string;
    description: string;
}

interface ActionDefinition {
    key: string;
    label: string;
    short: string;
    description: string;
}

interface PageProps {
    users: UserItem[];
    roles: RoleItem[];
    modules: ModuleDefinition[];
    actions: ActionDefinition[];
    statistics: {
        total_users: number;
        active_users: number;
        inactive_users: number;
        total_roles: number;
        system_roles: number;
        custom_roles: number;
        total_modules: number;
        total_actions: number;
        total_granted_permissions: number;
    };
}

const ROLE_COLORS: Record<
    string,
    { label: string; badge: string; dot: string; border: string; lightBg: string }
> = {
    emerald: {
        label: 'Hijau Emerald',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        border: 'border-emerald-300 dark:border-emerald-800',
        lightBg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    },
    teal: {
        label: 'Hijau Toska (DKPP)',
        badge: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
        dot: 'bg-teal-600',
        border: 'border-teal-300 dark:border-teal-800',
        lightBg: 'bg-teal-50/70 dark:bg-teal-950/20',
    },
    blue: {
        label: 'Biru Samudera',
        badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500',
        border: 'border-blue-300 dark:border-blue-800',
        lightBg: 'bg-blue-50/70 dark:bg-blue-950/20',
    },
    indigo: {
        label: 'Biru Indigo',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
        dot: 'bg-indigo-500',
        border: 'border-indigo-300 dark:border-indigo-800',
        lightBg: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    },
    amber: {
        label: 'Kuning Amber',
        badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        border: 'border-amber-300 dark:border-amber-800',
        lightBg: 'bg-amber-50/70 dark:bg-amber-950/20',
    },
    purple: {
        label: 'Ungu Royal',
        badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
        dot: 'bg-purple-500',
        border: 'border-purple-300 dark:border-purple-800',
        lightBg: 'bg-purple-50/70 dark:bg-purple-950/20',
    },
    rose: {
        label: 'Merah Rose',
        badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        border: 'border-rose-300 dark:border-rose-800',
        lightBg: 'bg-rose-50/70 dark:bg-rose-950/20',
    },
    slate: {
        label: 'Abu Slate',
        badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-500',
        border: 'border-slate-300 dark:border-slate-700',
        lightBg: 'bg-slate-50/70 dark:bg-slate-900/30',
    },
};

function getRoleStyle(color?: string) {
    return ROLE_COLORS[color || 'emerald'] || ROLE_COLORS.emerald;
}

export default function UsersRolesIndex({
    users,
    roles,
    modules,
    actions,
    statistics,
}: PageProps) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    // Active tab: 'users' | 'roles' | 'matrix'
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'matrix'>('users');

    // Matrix sub-view mode: 'detail' (single role × CRUD actions) | 'overview' (all modules × all roles)
    const [matrixMode, setMatrixMode] = useState<'detail' | 'overview'>('detail');

    // =========================================================================
    // TAB 1: USER MANAGEMENT STATES
    // =========================================================================
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
    const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [uName, setUName] = useState('');
    const [uEmail, setUEmail] = useState('');
    const [uNip, setUNip] = useState('');
    const [uJabatan, setUJabatan] = useState('');
    const [uPhone, setUPhone] = useState('');
    const [uRoleId, setURoleId] = useState<string>(String(roles[0]?.id || ''));
    const [uPassword, setUPassword] = useState('');
    const [uIsActive, setUIsActive] = useState(true);
    const [isSavingUser, setIsSavingUser] = useState(false);

    const [editUserOpen, setEditUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    const [deleteUserOpen, setDeleteUserOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const q = userSearch.trim().toLowerCase();
            const matchesSearch =
                q === '' ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.nip && u.nip.toLowerCase().includes(q)) ||
                (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
                u.role_name.toLowerCase().includes(q);

            const matchesRole =
                userRoleFilter === 'all' || String(u.role_id) === userRoleFilter;

            const matchesStatus =
                userStatusFilter === 'all' ||
                (userStatusFilter === 'active' && u.is_active) ||
                (userStatusFilter === 'inactive' && !u.is_active);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, userSearch, userRoleFilter, userStatusFilter]);

    // =========================================================================
    // TAB 2: ROLE MANAGEMENT STATES
    // =========================================================================
    const [createRoleOpen, setCreateRoleOpen] = useState(false);
    const [rName, setRName] = useState('');
    const [rDescription, setRDescription] = useState('');
    const [rColor, setRColor] = useState('teal');
    const [rIsActive, setRIsActive] = useState(true);
    const [rTemplate, setRTemplate] = useState('view_only');
    const [rCopyRoleId, setRCopyRoleId] = useState<string>('none');
    const [isSavingRole, setIsSavingRole] = useState(false);

    const [editRoleOpen, setEditRoleOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

    const [deleteRoleOpen, setDeleteRoleOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);

    // =========================================================================
    // TAB 3: ACCESS MATRIX STATES
    // =========================================================================
    const defaultMatrixRole = useMemo(() => {
        return roles.find((r) => r.slug !== 'super-admin') || roles[0] || null;
    }, [roles]);

    const [selectedMatrixRoleId, setSelectedMatrixRoleId] = useState<number>(
        defaultMatrixRole?.id || 0
    );
    const [matrixSearch, setMatrixSearch] = useState('');
    const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('all');
    const [draftPermissions, setDraftPermissions] = useState<
        Record<string, Record<string, boolean>>
    >({});
    const [hasUnsavedMatrix, setHasUnsavedMatrix] = useState(false);
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);

    const selectedMatrixRole = useMemo(() => {
        return roles.find((r) => r.id === selectedMatrixRoleId) || roles[0] || null;
    }, [roles, selectedMatrixRoleId]);

    useEffect(() => {
        if (selectedMatrixRole) {
            setDraftPermissions(
                JSON.parse(JSON.stringify(selectedMatrixRole.permissions || {}))
            );
            setHasUnsavedMatrix(false);
        }
    }, [selectedMatrixRole]);

    const moduleCategories = useMemo(() => {
        return Array.from(new Set(modules.map((m) => m.category)));
    }, [modules]);

    const filteredModules = useMemo(() => {
        return modules.filter((m) => {
            const q = matrixSearch.trim().toLowerCase();
            const matchQ =
                q === '' ||
                m.name.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q) ||
                m.route_hint.toLowerCase().includes(q);
            const matchCat =
                matrixCategoryFilter === 'all' || m.category === matrixCategoryFilter;
            return matchQ && matchCat;
        });
    }, [modules, matrixSearch, matrixCategoryFilter]);

    const groupedModules = useMemo(() => {
        const groups: Record<string, ModuleDefinition[]> = {};
        filteredModules.forEach((m) => {
            if (!groups[m.category]) {
                groups[m.category] = [];
            }
            groups[m.category].push(m);
        });
        return groups;
    }, [filteredModules]);

    // Calculate live stats of draftPermissions
    const draftStats = useMemo(() => {
        let granted = 0;
        let viewableModules = 0;
        const total = modules.length * actions.length;

        modules.forEach((m) => {
            const mPerms = draftPermissions[m.key] || {};
            if (mPerms.view) {
                viewableModules++;
            }
            actions.forEach((a) => {
                if (mPerms[a.key]) {
                    granted++;
                }
            });
        });

        return {
            granted,
            total,
            viewableModules,
            pct: total > 0 ? Math.round((granted / total) * 100) : 0,
        };
    }, [draftPermissions, modules, actions]);

    // =========================================================================
    // HANDLERS: USER CRUD
    // =========================================================================
    const handleOpenCreateUser = () => {
        setUName('');
        setUEmail('');
        setUNip('');
        setUJabatan('');
        setUPhone('');
        setURoleId(String(roles[0]?.id || ''));
        setUPassword('');
        setUIsActive(true);
        setCreateUserOpen(true);
    };

    const handleSubmitCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uName.trim() || !uEmail.trim() || !uPassword) {
            toast.error('Mohon lengkapi nama, email, dan kata sandi pengguna.');
            return;
        }

        setIsSavingUser(true);
        router.post(
            '/users-roles/users',
            {
                name: uName.trim(),
                email: uEmail.trim(),
                nip: uNip.trim() || null,
                jabatan: uJabatan.trim() || null,
                phone: uPhone.trim() || null,
                role_id: Number(uRoleId),
                password: uPassword,
                is_active: uIsActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Pengguna '${uName.trim()}' berhasil ditambahkan.`);
                    setCreateUserOpen(false);
                    setIsSavingUser(false);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Gagal menambahkan pengguna.');
                    setIsSavingUser(false);
                },
            }
        );
    };

    const handleOpenEditUser = (u: UserItem) => {
        setEditingUser(u);
        setUName(u.name);
        setUEmail(u.email);
        setUNip(u.nip || '');
        setUJabatan(u.jabatan || '');
        setUPhone(u.phone || '');
        setURoleId(String(u.role_id || roles[0]?.id || ''));
        setUPassword('');
        setUIsActive(u.is_active);
        setEditUserOpen(true);
    };

    const handleSubmitEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSavingUser(true);
        router.put(
            `/users-roles/users/${editingUser.id}`,
            {
                name: uName.trim(),
                email: uEmail.trim(),
                nip: uNip.trim() || null,
                jabatan: uJabatan.trim() || null,
                phone: uPhone.trim() || null,
                role_id: Number(uRoleId),
                password: uPassword || null,
                is_active: uIsActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Data pengguna '${uName.trim()}' berhasil diperbarui.`);
                    setEditUserOpen(false);
                    setEditingUser(null);
                    setIsSavingUser(false);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Gagal memperbarui pengguna.');
                    setIsSavingUser(false);
                },
            }
        );
    };

    const handleToggleUserStatus = (u: UserItem) => {
        router.post(
            `/users-roles/users/${u.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Status pengguna '${u.name}' berhasil diperbarui.`);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Gagal mengubah status pengguna.');
                },
            }
        );
    };

    const handleConfirmDeleteUser = () => {
        if (!userToDelete) return;

        setIsSavingUser(true);
        router.delete(`/users-roles/users/${userToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Pengguna '${userToDelete.name}' berhasil dihapus.`);
                setDeleteUserOpen(false);
                setUserToDelete(null);
                setIsSavingUser(false);
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] || 'Gagal menghapus pengguna.');
                setIsSavingUser(false);
            },
        });
    };

    // =========================================================================
    // HANDLERS: ROLE CRUD
    // =========================================================================
    const handleOpenCreateRole = (copyFromRole?: RoleItem) => {
        setRName(copyFromRole ? `${copyFromRole.name} (Salinan)` : '');
        setRDescription(copyFromRole?.description || '');
        setRColor(copyFromRole?.color || 'teal');
        setRIsActive(true);
        setRTemplate('view_only');
        setRCopyRoleId(copyFromRole ? String(copyFromRole.id) : 'none');
        setCreateRoleOpen(true);
    };

    const handleSubmitCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rName.trim()) {
            toast.error('Nama role wajib diisi.');
            return;
        }

        setIsSavingRole(true);
        router.post(
            '/users-roles/roles',
            {
                name: rName.trim(),
                description: rDescription.trim() || null,
                color: rColor,
                is_active: rIsActive,
                template: rTemplate,
                copy_from_role_id: rCopyRoleId !== 'none' ? Number(rCopyRoleId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Role '${rName.trim()}' berhasil ditambahkan.`);
                    setCreateRoleOpen(false);
                    setIsSavingRole(false);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Gagal membuat role baru.');
                    setIsSavingRole(false);
                },
            }
        );
    };

    const handleOpenEditRole = (role: RoleItem) => {
        setEditingRole(role);
        setRName(role.name);
        setRDescription(role.description || '');
        setRColor(role.color || 'emerald');
        setRIsActive(role.is_active);
        setEditRoleOpen(true);
    };

    const handleSubmitEditRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        setIsSavingRole(true);
        router.put(
            `/users-roles/roles/${editingRole.id}`,
            {
                name: rName.trim(),
                description: rDescription.trim() || null,
                color: rColor,
                is_active: rIsActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Role '${rName.trim()}' berhasil diperbarui.`);
                    setEditRoleOpen(false);
                    setEditingRole(null);
                    setIsSavingRole(false);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Gagal memperbarui role.');
                    setIsSavingRole(false);
                },
            }
        );
    };

    const handleConfirmDeleteRole = () => {
        if (!roleToDelete) return;

        setIsSavingRole(true);
        router.delete(`/users-roles/roles/${roleToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Role '${roleToDelete.name}' berhasil dihapus.`);
                setDeleteRoleOpen(false);
                setRoleToDelete(null);
                setIsSavingRole(false);
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] || 'Gagal menghapus role.');
                setIsSavingRole(false);
            },
        });
    };

    // =========================================================================
    // HANDLERS: ACCESS PERMISSION MATRIX
    // =========================================================================
    const isSuperAdminRoleSelected = selectedMatrixRole?.slug === 'super-admin';

    const handleToggleCell = (moduleKey: string, actionKey: string) => {
        if (isSuperAdminRoleSelected) {
            toast.info('Super Administrator selalu memiliki hak akses penuh.');
            return;
        }

        setDraftPermissions((prev) => {
            const next = { ...prev };
            const currentModule = { ...(next[moduleKey] || {}) };
            const newValue = !currentModule[actionKey];
            currentModule[actionKey] = newValue;

            // Auto-enable 'view' if any other action is enabled
            if (actionKey !== 'view' && newValue) {
                currentModule.view = true;
            }
            // Auto-disable other actions if 'view' is turned off
            if (actionKey === 'view' && !newValue) {
                actions.forEach((a) => {
                    currentModule[a.key] = false;
                });
            }

            next[moduleKey] = currentModule;
            return next;
        });
        setHasUnsavedMatrix(true);
    };

    const handleToggleModuleRow = (moduleKey: string) => {
        if (isSuperAdminRoleSelected) return;

        setDraftPermissions((prev) => {
            const next = { ...prev };
            const currentModule = { ...(next[moduleKey] || {}) };
            const allChecked = actions.every((a) => Boolean(currentModule[a.key]));

            actions.forEach((a) => {
                currentModule[a.key] = !allChecked;
            });

            next[moduleKey] = currentModule;
            return next;
        });
        setHasUnsavedMatrix(true);
    };

    const handleToggleActionColumn = (actionKey: string) => {
        if (isSuperAdminRoleSelected) return;

        setDraftPermissions((prev) => {
            const next = { ...prev };
            const allChecked = modules.every((m) => Boolean(next[m.key]?.[actionKey]));
            const targetVal = !allChecked;

            modules.forEach((m) => {
                const modMap = { ...(next[m.key] || {}) };
                modMap[actionKey] = targetVal;
                if (actionKey !== 'view' && targetVal) {
                    modMap.view = true;
                }
                if (actionKey === 'view' && !targetVal) {
                    actions.forEach((a) => {
                        modMap[a.key] = false;
                    });
                }
                next[m.key] = modMap;
            });

            return next;
        });
        setHasUnsavedMatrix(true);
    };

    const handleApplyMatrixPreset = (
        preset: 'all' | 'view_only' | 'operator' | 'clear'
    ) => {
        if (isSuperAdminRoleSelected) return;

        setDraftPermissions(() => {
            const next: Record<string, Record<string, boolean>> = {};
            modules.forEach((m) => {
                next[m.key] = {};
                actions.forEach((a) => {
                    if (preset === 'all') {
                        next[m.key][a.key] = true;
                    } else if (preset === 'view_only') {
                        next[m.key][a.key] =
                            m.key !== 'users_roles' && a.key === 'view';
                    } else if (preset === 'operator') {
                        next[m.key][a.key] =
                            m.key !== 'users_roles' &&
                            ['view', 'create', 'update', 'import_export'].includes(
                                a.key
                            );
                    } else {
                        next[m.key][a.key] = m.key === 'dashboard' && a.key === 'view';
                    }
                });
            });
            return next;
        });
        setHasUnsavedMatrix(true);
    };

    const handleSaveMatrix = () => {
        if (!selectedMatrixRole || isSuperAdminRoleSelected) return;

        setIsSavingMatrix(true);
        router.put(
            `/users-roles/roles/${selectedMatrixRole.id}/matrix`,
            {
                permissions: draftPermissions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Matriks hak akses untuk role '${selectedMatrixRole.name}' berhasil disimpan!`
                    );
                    setHasUnsavedMatrix(false);
                    setIsSavingMatrix(false);
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            'Gagal menyimpan matriks hak akses.'
                    );
                    setIsSavingMatrix(false);
                },
            }
        );
    };

    const jumpToRoleMatrix = (roleId: number) => {
        setSelectedMatrixRoleId(roleId);
        setMatrixMode('detail');
        setActiveTab('matrix');
    };

    return (
        <>
            <Head title="Kelola User, Role & Matriks Hak Akses - DKPP Indramayu" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ========================================================= */}
                {/* HEADER SECTION                                            */}
                {/* ========================================================= */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#006565] text-white shadow-sm">
                                <ShieldAlert className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Manajemen User, Role &amp; Matriks Hak Akses
                                </h1>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Kelola akun aparatur DKPP, kelompok peran organisasi, dan matriks otorisasi akses pada seluruh modul sistem.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => handleOpenCreateRole()}
                            className="gap-2 border-teal-300 text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                        >
                            <Shield className="size-4" />
                            Tambah Role Baru
                        </Button>
                        <Button
                            onClick={handleOpenCreateUser}
                            className="gap-2 bg-[#006565] text-white shadow-xs hover:bg-[#005252]"
                        >
                            <UserPlus className="size-4" />
                            Tambah Pengguna Baru
                        </Button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* KPI OVERVIEW CARDS                                        */}
                {/* ========================================================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-500">
                                Total Pengguna Terdaftar
                            </CardTitle>
                            <Users className="size-4 text-[#006565]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_users} Akun
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                <span className="font-semibold text-emerald-600">
                                    {statistics.active_users} aktif
                                </span>{' '}
                                &bull; {statistics.inactive_users} non-aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-teal-200 bg-teal-50/40 dark:border-teal-950/60 dark:bg-teal-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-teal-700 dark:text-teal-400">
                                Total Role / Peran
                            </CardTitle>
                            <ShieldCheck className="size-4 text-teal-700 dark:text-teal-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-teal-800 dark:text-teal-300">
                                {statistics.total_roles} Role
                            </div>
                            <p className="mt-1 text-xs text-teal-700/80 dark:text-teal-400/80">
                                {statistics.system_roles} role sistem &bull;{' '}
                                {statistics.custom_roles} role kustom
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-950/60 dark:bg-blue-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                Cakupan Modul Sistem
                            </CardTitle>
                            <Layers className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {statistics.total_modules} Modul
                            </div>
                            <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
                                {statistics.total_actions} level aksi per modul (
                                {statistics.total_modules * statistics.total_actions} titik kontrol)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-950/60 dark:bg-amber-950/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                Hak Akses Terkonfigurasi
                            </CardTitle>
                            <KeyRound className="size-4 text-amber-700 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                                {statistics.total_granted_permissions} Izin
                            </div>
                            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                                Total izin aktif pada matriks seluruh role
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ========================================================= */}
                {/* 3-TAB NAVIGATION SWITCHER                                 */}
                {/* ========================================================= */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
                    <div className="inline-flex flex-wrap rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                activeTab === 'users'
                                    ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200/80 dark:bg-neutral-800 dark:text-teal-300 dark:ring-neutral-700'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            }`}
                        >
                            <Users className="size-4" />
                            <span>1. Kelola Pengguna ({users.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                activeTab === 'roles'
                                    ? 'bg-white text-[#006565] shadow-xs ring-1 ring-neutral-200/80 dark:bg-neutral-800 dark:text-teal-300 dark:ring-neutral-700'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            }`}
                        >
                            <Shield className="size-4" />
                            <span>2. Kelola Role / Peran ({roles.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('matrix')}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                activeTab === 'matrix'
                                    ? 'bg-[#006565] text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            }`}
                        >
                            <Table2 className="size-4" />
                            <span>3. Matriks Hak Akses</span>
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                    activeTab === 'matrix'
                                        ? 'bg-amber-400 text-neutral-950'
                                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                }`}
                            >
                                Matrix
                            </span>
                        </button>
                    </div>

                    {activeTab === 'matrix' && (
                        <div className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
                            <button
                                type="button"
                                onClick={() => setMatrixMode('detail')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    matrixMode === 'detail'
                                        ? 'bg-white text-[#006565] shadow-2xs dark:bg-neutral-800 dark:text-teal-300'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                            >
                                <CheckSquare className="size-3.5" />
                                <span>Konfigurasi Matriks per Role</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMatrixMode('overview')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    matrixMode === 'overview'
                                        ? 'bg-white text-[#006565] shadow-2xs dark:bg-neutral-800 dark:text-teal-300'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                            >
                                <Layers className="size-3.5" />
                                <span>Perbandingan Lintas Role</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ========================================================= */}
                {/* TAB 1: KELOLA PENGGUNA (USER MANAGEMENT)                  */}
                {/* ========================================================= */}
                {activeTab === 'users' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold">
                                        Daftar Pengguna Sistem DKPP
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Menampilkan {filteredUsers.length} dari {users.length} akun terdaftar
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-neutral-400" />
                                        <Input
                                            placeholder="Cari nama, email, NIP, jabatan..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="h-9 pl-9 text-xs"
                                        />
                                    </div>

                                    <Select
                                        value={userRoleFilter}
                                        onValueChange={setUserRoleFilter}
                                    >
                                        <SelectTrigger className="h-9 w-[190px] text-xs">
                                            <SelectValue placeholder="Semua Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Role</SelectItem>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={userStatusFilter}
                                        onValueChange={setUserStatusFilter}
                                    >
                                        <SelectTrigger className="h-9 w-[140px] text-xs">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="active">Status Aktif</SelectItem>
                                            <SelectItem value="inactive">Non-aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <th className="px-4 py-3 text-center w-12">No</th>
                                            <th className="px-4 py-3">Pengguna &amp; Email</th>
                                            <th className="px-4 py-3">NIP &amp; Jabatan</th>
                                            <th className="px-4 py-3">Role / Hak Akses</th>
                                            <th className="px-4 py-3">Kontak</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-sm text-neutral-400"
                                                >
                                                    Tidak ditemukan pengguna yang sesuai dengan filter pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u, idx) => {
                                                const roleStyle = getRoleStyle(u.role_color);
                                                const isSelf = currentUserId === u.id;
                                                return (
                                                    <tr
                                                        key={u.id}
                                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 text-center font-semibold text-neutral-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-extrabold text-[#006565] ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-300">
                                                                    {u.name
                                                                        .split(' ')
                                                                        .slice(0, 2)
                                                                        .map((n) => n[0])
                                                                        .join('')
                                                                        .toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                                        <span>{u.name}</span>
                                                                        {isSelf && (
                                                                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                                                Anda
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                                                                        <Mail className="size-3 text-neutral-400" />
                                                                        <span>{u.email}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                                {u.jabatan || '-'}
                                                            </div>
                                                            <div className="font-mono text-[11px] text-neutral-500">
                                                                {u.nip ? `NIP. ${u.nip}` : 'NIP belum diisi'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (u.role_id) {
                                                                        jumpToRoleMatrix(u.role_id);
                                                                    }
                                                                }}
                                                                title="Klik untuk melihat matriks hak akses role ini"
                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-transform hover:scale-105 cursor-pointer ${roleStyle.badge}`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 rounded-full ${roleStyle.dot}`}
                                                                />
                                                                <span>{u.role_name}</span>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                            {u.phone ? (
                                                                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                                    <Phone className="size-3 text-neutral-400" />
                                                                    {u.phone}
                                                                </span>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {u.is_active ? (
                                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                                                                    <CheckCircle2 className="mr-1 size-3" />
                                                                    Aktif
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-neutral-100 text-neutral-600 border-neutral-300"
                                                                >
                                                                    <XCircle className="mr-1 size-3" />
                                                                    Non-aktif
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="inline-flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleOpenEditUser(u)}
                                                                    className="h-7 px-2 text-xs"
                                                                    title="Edit Pengguna & Role"
                                                                >
                                                                    <Edit3 className="size-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={isSelf}
                                                                    onClick={() => handleToggleUserStatus(u)}
                                                                    className={`h-7 px-2 text-xs ${
                                                                        u.is_active
                                                                            ? 'text-amber-600 hover:bg-amber-50'
                                                                            : 'text-emerald-600 hover:bg-emerald-50'
                                                                    }`}
                                                                    title={
                                                                        u.is_active
                                                                            ? 'Nonaktifkan Akun'
                                                                            : 'Aktifkan Akun'
                                                                    }
                                                                >
                                                                    <Power className="size-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={isSelf}
                                                                    onClick={() => {
                                                                        setUserToDelete(u);
                                                                        setDeleteUserOpen(true);
                                                                    }}
                                                                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                                    title="Hapus Pengguna"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* TAB 2: KELOLA ROLE / PERAN (ROLE MANAGEMENT)              */}
                {/* ========================================================= */}
                {activeTab === 'roles' && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role) => {
                            const style = getRoleStyle(role.color);
                            return (
                                <Card
                                    key={role.id}
                                    className={`flex flex-col justify-between border transition-shadow hover:shadow-md ${style.border}`}
                                >
                                    <CardHeader className={`pb-3 ${style.lightBg}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${style.badge}`}
                                                >
                                                    <span
                                                        className={`size-2 rounded-full ${style.dot}`}
                                                    />
                                                    {role.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {role.is_system ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-200/80 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        <Lock className="size-2.5" />
                                                        Sistem
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                                                        Kustom
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-1 font-mono text-[11px] text-neutral-400">
                                            slug: {role.slug}
                                        </div>
                                        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 min-h-[2rem]">
                                            {role.description || 'Tidak ada deskripsi tambahan.'}
                                        </p>
                                    </CardHeader>

                                    <CardContent className="pt-4">
                                        {/* Progress bar coverage */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                                                    Cakupan Matriks Hak Akses
                                                </span>
                                                <span className="font-extrabold text-[#006565] dark:text-teal-400">
                                                    {role.granted_permissions_count} /{' '}
                                                    {role.total_possible_permissions} izin (
                                                    {role.coverage_percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                <div
                                                    className={`h-full rounded-full transition-all ${style.dot}`}
                                                    style={{
                                                        width: `${Math.min(100, role.coverage_percentage)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-2.5 text-xs dark:bg-neutral-900">
                                            <div>
                                                <div className="text-[10px] text-neutral-400">
                                                    Pengguna Aktif
                                                </div>
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                                    {role.users_count} Orang
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-neutral-400">
                                                    Modul Dapat Diakses
                                                </div>
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                                                    {role.viewable_modules_count} dari{' '}
                                                    {modules.length} Modul
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                            <Button
                                                size="sm"
                                                onClick={() => jumpToRoleMatrix(role.id)}
                                                className="h-8 gap-1.5 bg-[#006565] text-xs text-white hover:bg-[#005252]"
                                            >
                                                <Table2 className="size-3.5" />
                                                Atur Matriks Akses
                                            </Button>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenCreateRole(role)}
                                                    className="h-8 px-2 text-xs"
                                                    title="Duplikasi Role ini"
                                                >
                                                    <Copy className="size-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenEditRole(role)}
                                                    className="h-8 px-2 text-xs"
                                                    title="Edit Informasi Role"
                                                >
                                                    <Edit3 className="size-3.5" />
                                                </Button>
                                                {!role.is_system && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setRoleToDelete(role);
                                                            setDeleteRoleOpen(true);
                                                        }}
                                                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                                                        title="Hapus Role"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: MATRIKS HAK AKSES (ACCESS PERMISSION MATRIX)       */}
                {/* ========================================================= */}
                {activeTab === 'matrix' && matrixMode === 'detail' && (
                    <div className="space-y-4">
                        {/* Role Selector Pill Bar */}
                        <Card className="border-teal-200/80 bg-gradient-to-r from-teal-50/60 via-white to-emerald-50/40 dark:border-teal-900/60 dark:from-teal-950/30 dark:via-neutral-900 dark:to-emerald-950/20">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                                                Pilih Role untuk Mengonfigurasi Matriks Hak Akses:
                                            </h3>
                                            <p className="text-xs text-neutral-500">
                                                Centang izin aksi (Lihat, Tambah, Ubah, Hapus, Import/Export) untuk setiap modul sistem DKPP.
                                            </p>
                                        </div>

                                        {hasUnsavedMatrix && !isSuperAdminRoleSelected && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-extrabold text-amber-900 animate-pulse">
                                                <AlertTriangle className="size-3.5" />
                                                Ada perubahan matriks yang belum disimpan
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {roles.map((r) => {
                                            const active = r.id === selectedMatrixRole?.id;
                                            const st = getRoleStyle(r.color);
                                            return (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => setSelectedMatrixRoleId(r.id)}
                                                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                                        active
                                                            ? 'border-[#006565] bg-[#006565] text-white shadow-sm ring-2 ring-[#006565]/30'
                                                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-2 rounded-full ${
                                                            active ? 'bg-amber-300' : st.dot
                                                        }`}
                                                    />
                                                    <span>{r.name}</span>
                                                    <span
                                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                                                            active
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                        }`}
                                                    >
                                                        {r.coverage_percentage}%
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Matrix Toolbar & Presets */}
                        {selectedMatrixRole && (
                            <Card className="border-sidebar-border/70 shadow-xs">
                                <CardHeader className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <CardTitle className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                                                    Matriks Hak Akses: {selectedMatrixRole.name}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="border-teal-300 bg-teal-50 text-teal-800 font-bold"
                                                >
                                                    {draftStats.viewableModules} / {modules.length}{' '}
                                                    Modul Aktif ({draftStats.granted}/
                                                    {draftStats.total} Izin)
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-neutral-500">
                                                {selectedMatrixRole.description}
                                            </p>
                                        </div>

                                        {/* Quick Presets & Save Button */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {!isSuperAdminRoleSelected ? (
                                                <>
                                                    <span className="text-[11px] font-bold text-neutral-400 mr-1">
                                                        Preset Cepat:
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApplyMatrixPreset('all')
                                                        }
                                                        className="h-8 text-xs"
                                                    >
                                                        Pilih Semua
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApplyMatrixPreset('operator')
                                                        }
                                                        className="h-8 text-xs"
                                                    >
                                                        Standar Operator
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApplyMatrixPreset('view_only')
                                                        }
                                                        className="h-8 text-xs"
                                                    >
                                                        Hanya Lihat
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApplyMatrixPreset('clear')
                                                        }
                                                        className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Reset Minimal
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={isSavingMatrix}
                                                        onClick={handleSaveMatrix}
                                                        className="h-8 gap-1.5 bg-[#006565] text-xs font-bold text-white shadow-xs hover:bg-[#005252]"
                                                    >
                                                        <Save className="size-3.5" />
                                                        {isSavingMatrix
                                                            ? 'Menyimpan...'
                                                            : 'Simpan Matriks Hak Akses'}
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                                    <Lock className="size-3.5" />
                                                    <span>
                                                        Role Super Administrator memiliki akses penuh permanen ke seluruh modul.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Filter Modul Bar */}
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="relative w-64">
                                                <Search className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-neutral-400" />
                                                <Input
                                                    placeholder="Cari nama modul atau route..."
                                                    value={matrixSearch}
                                                    onChange={(e) =>
                                                        setMatrixSearch(e.target.value)
                                                    }
                                                    className="h-8 pl-8 text-xs"
                                                />
                                            </div>
                                            <Select
                                                value={matrixCategoryFilter}
                                                onValueChange={setMatrixCategoryFilter}
                                            >
                                                <SelectTrigger className="h-8 w-[190px] text-xs">
                                                    <SelectValue placeholder="Semua Kategori Modul" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Semua Kategori Modul
                                                    </SelectItem>
                                                    {moduleCategories.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>
                                                            {cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="inline-block size-2.5 rounded-xs bg-[#006565]" />
                                                Diizinkan
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <span className="inline-block size-2.5 rounded-xs border border-neutral-300 bg-white" />
                                                Tidak Diizinkan
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-xs">
                                            <thead>
                                                <tr className="border-b-2 border-neutral-200 bg-neutral-100/90 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900">
                                                    <th className="px-4 py-3.5 font-extrabold min-w-[280px]">
                                                        Modul &amp; Menu Sistem
                                                    </th>
                                                    {actions.map((act) => {
                                                        const allColChecked = modules.every((m) =>
                                                            Boolean(
                                                                draftPermissions[m.key]?.[act.key]
                                                            )
                                                        );
                                                        return (
                                                            <th
                                                                key={act.key}
                                                                className="px-3 py-3.5 text-center min-w-[115px] border-l border-neutral-200/70 dark:border-neutral-800"
                                                            >
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-extrabold text-neutral-800 dark:text-neutral-200">
                                                                        {act.label}
                                                                    </span>
                                                                    {!isSuperAdminRoleSelected && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleToggleActionColumn(
                                                                                    act.key
                                                                                )
                                                                            }
                                                                            className="text-[10px] font-bold text-[#006565] hover:underline cursor-pointer"
                                                                        >
                                                                            {allColChecked
                                                                                ? 'Batal Semua'
                                                                                : 'Pilih Kolom'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                    <th className="px-3 py-3.5 text-center min-w-[110px] border-l border-neutral-200/70 bg-emerald-50/60 dark:border-neutral-800 dark:bg-emerald-950/20">
                                                        <span className="font-extrabold text-[#006565] dark:text-teal-300">
                                                            Akses Penuh Baris
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                                {Object.entries(groupedModules).map(
                                                    ([category, catModules]) => (
                                                        <React.Fragment key={category}>
                                                            {/* Category Section Banner */}
                                                            <tr className="bg-teal-50/70 dark:bg-teal-950/30">
                                                                <td
                                                                    colSpan={actions.length + 2}
                                                                    className="px-4 py-2 text-[11px] font-extrabold tracking-wider text-[#006565] uppercase dark:text-teal-300"
                                                                >
                                                                    Kategori: {category} (
                                                                    {catModules.length} Modul)
                                                                </td>
                                                            </tr>

                                                            {catModules.map((mod) => {
                                                                const modPerms =
                                                                    draftPermissions[mod.key] || {};
                                                                const grantedCount = actions.filter(
                                                                    (a) => Boolean(modPerms[a.key])
                                                                ).length;
                                                                const allRowChecked =
                                                                    grantedCount === actions.length;

                                                                return (
                                                                    <tr
                                                                        key={mod.key}
                                                                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40 transition-colors"
                                                                    >
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div>
                                                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                                                        {mod.name}
                                                                                    </div>
                                                                                    <div className="mt-0.5 text-[11px] text-neutral-500">
                                                                                        {
                                                                                            mod.description
                                                                                        }
                                                                                    </div>
                                                                                    <div className="mt-1 font-mono text-[10px] text-teal-700 dark:text-teal-400">
                                                                                        {
                                                                                            mod.route_hint
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`shrink-0 text-[10px] font-bold ${
                                                                                        grantedCount ===
                                                                                        actions.length
                                                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                                                            : grantedCount >
                                                                                                0
                                                                                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                                                                                              : 'border-neutral-200 bg-neutral-100 text-neutral-400'
                                                                                    }`}
                                                                                >
                                                                                    {grantedCount}/
                                                                                    {actions.length}
                                                                                </Badge>
                                                                            </div>
                                                                        </td>

                                                                        {actions.map((act) => {
                                                                            const checked = Boolean(
                                                                                modPerms[act.key]
                                                                            );
                                                                            return (
                                                                                <td
                                                                                    key={act.key}
                                                                                    onClick={() =>
                                                                                        handleToggleCell(
                                                                                            mod.key,
                                                                                            act.key
                                                                                        )
                                                                                    }
                                                                                    className={`px-3 py-3 text-center border-l border-neutral-100 dark:border-neutral-800 transition-colors ${
                                                                                        isSuperAdminRoleSelected
                                                                                            ? 'cursor-not-allowed'
                                                                                            : 'cursor-pointer'
                                                                                    } ${
                                                                                        checked
                                                                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/15'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    <div
                                                                                        className="inline-flex items-center justify-center"
                                                                                        onClick={(
                                                                                            e
                                                                                        ) =>
                                                                                            e.stopPropagation()
                                                                                        }
                                                                                    >
                                                                                        <Checkbox
                                                                                            checked={
                                                                                                checked
                                                                                            }
                                                                                            disabled={
                                                                                                isSuperAdminRoleSelected
                                                                                            }
                                                                                            onCheckedChange={() =>
                                                                                                handleToggleCell(
                                                                                                    mod.key,
                                                                                                    act.key
                                                                                                )
                                                                                            }
                                                                                            className="size-4 data-[state=checked]:bg-[#006565] data-[state=checked]:border-[#006565]"
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                            );
                                                                        })}

                                                                        {/* Row Select All Toggle */}
                                                                        <td className="px-3 py-3 text-center border-l border-neutral-200 bg-emerald-50/20 dark:border-neutral-800">
                                                                            <button
                                                                                type="button"
                                                                                disabled={
                                                                                    isSuperAdminRoleSelected
                                                                                }
                                                                                onClick={() =>
                                                                                    handleToggleModuleRow(
                                                                                        mod.key
                                                                                    )
                                                                                }
                                                                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                                                    allRowChecked
                                                                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                                                                        : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                                                                                } ${
                                                                                    isSuperAdminRoleSelected
                                                                                        ? 'opacity-60 cursor-not-allowed'
                                                                                        : 'cursor-pointer'
                                                                                }`}
                                                                            >
                                                                                {allRowChecked ? (
                                                                                    <>
                                                                                        <Check className="size-3" />
                                                                                        <span>
                                                                                            Penuh
                                                                                        </span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>
                                                                                        Pilih Semua
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3 (MODE 2): PERBANDINGAN MATRIKS LINTAS ROLE          */}
                {/* ========================================================= */}
                {activeTab === 'matrix' && matrixMode === 'overview' && (
                    <Card className="border-sidebar-border/70 shadow-xs">
                        <CardHeader className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold">
                                        Matriks Perbandingan Hak Akses Lintas Role (Cross-Role Matrix)
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">
                                        Peta perbandingan otorisasi seluruh Role terhadap {modules.length} modul sistem. Klik pada kolom role untuk mengubah matriksnya.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b-2 border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900">
                                            <th className="sticky left-0 z-20 bg-neutral-100 px-4 py-3.5 font-extrabold min-w-[250px] border-r border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                                                Modul Sistem DKPP
                                            </th>
                                            {roles.map((r) => {
                                                const st = getRoleStyle(r.color);
                                                return (
                                                    <th
                                                        key={r.id}
                                                        className="px-3 py-3 text-center min-w-[155px] border-r border-neutral-200/70 dark:border-neutral-800"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => jumpToRoleMatrix(r.id)}
                                                            className="group flex flex-col items-center gap-1 w-full cursor-pointer"
                                                            title={`Klik untuk mengedit matriks ${r.name}`}
                                                        >
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold group-hover:scale-105 transition-transform ${st.badge}`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 rounded-full ${st.dot}`}
                                                                />
                                                                {r.name}
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-neutral-400">
                                                                {r.coverage_percentage}% Cakupan
                                                            </span>
                                                        </button>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {modules.map((mod) => (
                                            <tr
                                                key={mod.key}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                        {mod.name}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-400">
                                                        {mod.category}
                                                    </div>
                                                </td>
                                                {roles.map((r) => {
                                                    const mPerms = r.permissions[mod.key] || {};
                                                    const activeKeys = actions
                                                        .filter((a) => Boolean(mPerms[a.key]))
                                                        .map((a) => a.short);
                                                    const count = activeKeys.length;

                                                    return (
                                                        <td
                                                            key={r.id}
                                                            onClick={() => jumpToRoleMatrix(r.id)}
                                                            className="px-3 py-2.5 text-center border-r border-neutral-100 cursor-pointer hover:bg-teal-50/40 dark:border-neutral-800"
                                                        >
                                                            {count === actions.length ? (
                                                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900">
                                                                    <CheckCircle2 className="size-3 text-emerald-700" />
                                                                    Akses Penuh (5/5)
                                                                </span>
                                                            ) : count > 1 ? (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                                                                        {count}/5 Izin Aktif
                                                                    </span>
                                                                    <span className="text-[10px] text-neutral-500">
                                                                        {activeKeys.join(', ')}
                                                                    </span>
                                                                </div>
                                                            ) : count === 1 && mPerms.view ? (
                                                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                                                    <Eye className="size-3" />
                                                                    Hanya Lihat
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-300 dark:text-neutral-600">
                                                                    <X className="size-3" />
                                                                    Tidak Ada
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ========================================================= */}
                {/* DIALOG: TAMBAH PENGGUNA BARU                              */}
                {/* ========================================================= */}
                <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                            <DialogDescription>
                                Buat akun pengguna baru dan tetapkan Role untuk menentukan matriks hak aksesnya.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitCreateUser} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="c-user-name">Nama Lengkap &amp; Gelar *</Label>
                                    <Input
                                        id="c-user-name"
                                        value={uName}
                                        onChange={(e) => setUName(e.target.value)}
                                        placeholder="Contoh: Ir. Ahmad Fauzi, M.Si"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="c-user-email">Alamat Email *</Label>
                                    <Input
                                        id="c-user-email"
                                        type="email"
                                        value={uEmail}
                                        onChange={(e) => setUEmail(e.target.value)}
                                        placeholder="nama@indramayukab.go.id"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="c-user-nip">NIP (Opsional)</Label>
                                    <Input
                                        id="c-user-nip"
                                        value={uNip}
                                        onChange={(e) => setUNip(e.target.value)}
                                        placeholder="198501012010011001"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="c-user-jabatan">Jabatan / Unit Kerja</Label>
                                    <Input
                                        id="c-user-jabatan"
                                        value={uJabatan}
                                        onChange={(e) => setUJabatan(e.target.value)}
                                        placeholder="Analis Ketahanan Pangan"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="c-user-phone">No. WhatsApp / Telepon</Label>
                                    <Input
                                        id="c-user-phone"
                                        value={uPhone}
                                        onChange={(e) => setUPhone(e.target.value)}
                                        placeholder="081234567890"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Pilih Role / Peran Organisasi *</Label>
                                    <Select value={uRoleId} onValueChange={setURoleId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name} ({r.coverage_percentage}% akses)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="c-user-pass">Kata Sandi Login *</Label>
                                    <Input
                                        id="c-user-pass"
                                        type="password"
                                        value={uPassword}
                                        onChange={(e) => setUPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="c-user-active"
                                        checked={uIsActive}
                                        onCheckedChange={(v) => setUIsActive(Boolean(v))}
                                    />
                                    <Label htmlFor="c-user-active" className="text-xs font-normal">
                                        Aktifkan akun pengguna ini sekarang
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateUserOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingUser}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingUser ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: EDIT PENGGUNA                                     */}
                {/* ========================================================= */}
                <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Data Pengguna &amp; Role</DialogTitle>
                            <DialogDescription>
                                Perbarui profil aparatur, penetapan role, atau ganti kata sandi.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitEditUser} className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="e-user-name">Nama Lengkap *</Label>
                                    <Input
                                        id="e-user-name"
                                        value={uName}
                                        onChange={(e) => setUName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="e-user-email">Alamat Email *</Label>
                                    <Input
                                        id="e-user-email"
                                        type="email"
                                        value={uEmail}
                                        onChange={(e) => setUEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="e-user-nip">NIP</Label>
                                    <Input
                                        id="e-user-nip"
                                        value={uNip}
                                        onChange={(e) => setUNip(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="e-user-jabatan">Jabatan</Label>
                                    <Input
                                        id="e-user-jabatan"
                                        value={uJabatan}
                                        onChange={(e) => setUJabatan(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="e-user-phone">No. WhatsApp / Telepon</Label>
                                    <Input
                                        id="e-user-phone"
                                        value={uPhone}
                                        onChange={(e) => setUPhone(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Role / Peran Organisasi *</Label>
                                    <Select value={uRoleId} onValueChange={setURoleId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name} ({r.coverage_percentage}% akses)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="e-user-pass">
                                        Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)
                                    </Label>
                                    <Input
                                        id="e-user-pass"
                                        type="password"
                                        value={uPassword}
                                        onChange={(e) => setUPassword(e.target.value)}
                                        placeholder="Isi hanya jika ingin mereset password"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                                    <Checkbox
                                        id="e-user-active"
                                        checked={uIsActive}
                                        onCheckedChange={(v) => setUIsActive(Boolean(v))}
                                    />
                                    <Label htmlFor="e-user-active" className="text-xs font-normal">
                                        Akun pengguna berstatus Aktif
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditUserOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingUser}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: HAPUS PENGGUNA                                    */}
                {/* ========================================================= */}
                <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus Pengguna</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus akun pengguna{' '}
                                <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteUserOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                disabled={isSavingUser}
                                onClick={handleConfirmDeleteUser}
                                className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                                {isSavingUser ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: TAMBAH ROLE BARU                                  */}
                {/* ========================================================= */}
                <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Buat Role / Peran Baru</DialogTitle>
                            <DialogDescription>
                                Tambahkan kelompok role baru lalu sesuaikan izin aksesnya pada tab Matriks Hak Akses.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitCreateRole} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="c-role-name">Nama Role *</Label>
                                <Input
                                    id="c-role-name"
                                    value={rName}
                                    onChange={(e) => setRName(e.target.value)}
                                    placeholder="Contoh: Koordinator Lapangan Kecamatan"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="c-role-desc">Deskripsi Tugas &amp; Wewenang</Label>
                                <Input
                                    id="c-role-desc"
                                    value={rDescription}
                                    onChange={(e) => setRDescription(e.target.value)}
                                    placeholder="Jelaskan ruang lingkup akses untuk role ini..."
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Tema Warna Badge</Label>
                                    <Select value={rColor} onValueChange={setRColor}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ROLE_COLORS).map(([key, cfg]) => (
                                                <SelectItem key={key} value={key}>
                                                    {cfg.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Salin Matriks dari Role Lain</Label>
                                    <Select value={rCopyRoleId} onValueChange={setRCopyRoleId}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Gunakan Template Standar
                                            </SelectItem>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    Salin: {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {rCopyRoleId === 'none' && (
                                <div className="space-y-1.5">
                                    <Label>Template Awal Matriks Hak Akses</Label>
                                    <Select value={rTemplate} onValueChange={setRTemplate}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="view_only">
                                                Hanya Lihat (Read-Only Semua Modul)
                                            </SelectItem>
                                            <SelectItem value="operator">
                                                Operator (Lihat, Tambah, Ubah, Import/Export)
                                            </SelectItem>
                                            <SelectItem value="full">
                                                Akses Penuh Seluruh Modul
                                            </SelectItem>
                                            <SelectItem value="empty">
                                                Minimal (Hanya Dashboard)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateRoleOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingRole}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingRole ? 'Menyimpan...' : 'Buat Role'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: EDIT ROLE                                         */}
                {/* ========================================================= */}
                <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
                            <DialogDescription>
                                Perbarui nama, deskripsi, dan warna label role.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitEditRole} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="e-role-name">Nama Role *</Label>
                                <Input
                                    id="e-role-name"
                                    value={rName}
                                    onChange={(e) => setRName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="e-role-desc">Deskripsi</Label>
                                <Input
                                    id="e-role-desc"
                                    value={rDescription}
                                    onChange={(e) => setRDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Warna Badge</Label>
                                <Select value={rColor} onValueChange={setRColor}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROLE_COLORS).map(([key, cfg]) => (
                                            <SelectItem key={key} value={key}>
                                                {cfg.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditRoleOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingRole}
                                    className="bg-[#006565] text-white hover:bg-[#005252]"
                                >
                                    {isSavingRole ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ========================================================= */}
                {/* DIALOG: HAPUS ROLE                                        */}
                {/* ========================================================= */}
                <Dialog open={deleteRoleOpen} onOpenChange={setDeleteRoleOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus Role</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus role{' '}
                                <strong>{roleToDelete?.name}</strong>?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteRoleOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                disabled={isSavingRole}
                                onClick={handleConfirmDeleteRole}
                                className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                                {isSavingRole ? 'Menghapus...' : 'Ya, Hapus Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

UsersRolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'User, Role & Hak Akses',
            href: '/users-roles',
        },
    ] satisfies BreadcrumbItem[],
};
