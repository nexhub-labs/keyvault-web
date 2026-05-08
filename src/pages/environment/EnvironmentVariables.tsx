import { useState, useEffect, useMemo } from 'react';
import {
    Box, VStack, Table, IconButton,
    Text, Badge, HStack,
    Input,
    Spinner,
    Flex,
    Alert,
    Button,
    NativeSelect,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    DialogTitle,
    DialogActionTrigger,
    DialogBackdrop,
} from '../../components/ui/dialog';
import { LuCopy, LuEye, LuEyeOff, LuTrash2, LuPlus, LuDownload, LuRefreshCw, LuTerminal, LuLock, LuSearch, LuTag, LuFolderSync, LuFolder, LuPenLine, LuShieldCheck } from 'react-icons/lu';
import { useVaultContext } from '../../context/VaultContext';
import { decryptWithKey, encryptWithKey, authenticateWithPasskey } from '../../utils/crypto';
import { logger } from '../../utils/logger';
import { toaster } from '../../components/ui/toaster';
import axiosInstance from '../../utils/axiosInstance';
import { VaultItem } from '../../api/vault';
import { PasswordInput } from '../../components/ui/password-input';
import { OTPInput } from '../../components/ui/pin-input';
import { useVaultUnlock } from '../../hooks/useVaultUnlock';
import { useVault } from '../../hooks/useVault';
import { AppButton } from '../../components/ui/AppButton';
import { useProjects } from '../../hooks/useProjects';
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from '../../components/ui/accordion';
import { CreateProjectDialog } from '../../components/Projects/CreateProjectDialog';
import { Link, useNavigate } from 'react-router';

interface EnvVar {
    id: string;
    key: string;
    value: string;
    projectId?: string;
    projectName?: string;
    folder: string;
    tags?: string[];
    description?: string;
    iv?: string;
    teamId?: string;
    familyId?: string;
}

interface EnvironmentVariablesProps {
    teamId?: string;
    isAddOpenExternally?: boolean;
    onAddClose?: () => void;
}

const EnvironmentVariables = ({ teamId, isAddOpenExternally, onAddClose }: EnvironmentVariablesProps) => {
    const navigate = useNavigate();
    const { mek, vaultKey, teamKeys, familyKeys, isUnlocked, copyToClipboard } = useVaultContext();
    const { vaultItems, refresh, saveToVault, loading: isVaultLoading, updateItem } = useVault({ autoFetch: false });
    const [variables, setVariables] = useState<EnvVar[]>([]);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [newVarTags, setNewVarTags] = useState('');
    const [newVarFolder, setNewVarFolder] = useState('Unassigned');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [viewProjectId, setViewProjectId] = useState<string>('all'); // Main view filter
    const [isAdding, setIsAdding] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>("");

    // Move to Project State
    const [moveItemId, setMoveItemId] = useState<string | null>(null);
    const [moveItemKey, setMoveItemKey] = useState<string>("");
    const [moveTargetProjectId, setMoveTargetProjectId] = useState<string>("");
    const [moveTargetFolder, setMoveTargetFolder] = useState<string>("Unassigned");
    const [moveSourceProjectId, setMoveSourceProjectId] = useState<string>("");
    const [isMoving, setIsMoving] = useState(false);

    // Inline unlock state
    const { unlock, fetchSalt, masterPasswordSalt, isUnlocking } = useVaultUnlock();
    const [masterPassword, setMasterPassword] = useState("");
    const [totpToken, setTotpToken] = useState("");
    const [requires2FA, setRequires2FA] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Rename Modal State
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameProjectId, setRenameProjectId] = useState<string>('');
    const [renameOldName, setRenameOldName] = useState<string>('');
    const [renameNewName, setRenameNewName] = useState<string>('');
    const [isRenaming, setIsRenaming] = useState(false);

    const [unassignedName, setUnassignedName] = useState<string>(
        localStorage.getItem('KV_UNASSIGNED_NAME') || 'Unassigned'
    );

    const handleSaveUnassignedName = (newName: string) => {
        const val = newName.trim() || 'Unassigned';
        localStorage.setItem('KV_UNASSIGNED_NAME', val);
        setUnassignedName(val);
    };

    const { renameProject, projects, refresh: refreshProjects } = useProjects();

    // Sync external open state
    useEffect(() => {
        if (isAddOpenExternally !== undefined) {
            setIsAddOpen(isAddOpenExternally);
        }
    }, [isAddOpenExternally]);

    const handleDialogClose = () => {
        setIsAddOpen(false);
        onAddClose?.();
        // Reset states
        setNewVarKey('');
        setNewVarValue('');
        setNewVarTags('');
        // If we are in a main project view, keep that project selected in the add modal
        setSelectedProjectId(viewProjectId !== 'all' ? viewProjectId : '');
        setMasterPassword("");
        setTotpToken("");
        setRequires2FA(false);
    };

    // Load variables
    useEffect(() => {
        // Trigger fetch based on context
        refresh(teamId ? { teamId } : undefined);
    }, [teamId]);

    useEffect(() => {
        // We always try to fetch, fetchVariables handles missing keys by showing "(Locked)"
        fetchVariables();
    }, [mek, teamId, teamKeys, familyKeys, vaultItems]);

    // Fetch master password salt if adding and vault is locked
    useEffect(() => {
        if (isAddOpen && !mek) {
            fetchSalt();
        }
    }, [isAddOpen, mek, fetchSalt]);

    const fetchVariables = async () => {
        try {
            const data = vaultItems.filter((i: VaultItem) => {
                // Tenancy filtering is now partially handled by state, but we filter based on context
                if (teamId) {
                    if (i.teamId !== teamId) return false;
                } else {
                    // Strict Personal Context Isolation: hide team and family records.
                    if (i.teamId || i.familyId) return false;
                }

                // Type filtering: explicitly 'env_var' or heuristic for older variables
                const isLikelyEnvVar = i.keyName.includes('_') || /^[A-Z0-9]+$/.test(i.keyName);
                return i.secretType === 'env_var' || (!i.secretType && isLikelyEnvVar);
            });

            const decrypted: (EnvVar | null)[] = await Promise.all(data.map(async (item: VaultItem) => {
                // Per-item key selection (Gap #1, #2 context)
                let itemKey: CryptoKey | null = null;
                if (item.teamId) {
                    itemKey = teamKeys[item.teamId] || null;
                } else if (item.familyId) {
                    itemKey = familyKeys[item.familyId] || null;
                } else {
                    itemKey = vaultKey || mek;
                }

                if (!itemKey) {
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: '(Locked)',
                        projectId: item.projectId,
                        folder: item.folder || 'Unassigned',
                        iv: item.iv,
                        tags: item.tags,
                        teamId: item.teamId,
                        familyId: item.familyId
                    };
                }

                try {
                    const decryptedValue = await decryptWithKey(item.encryptedData, item.iv, itemKey);
                    const project = projects.find(p => p._id === item.projectId);
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: decryptedValue,
                        projectId: item.projectId,
                        projectName: project?.name,
                        folder: item.folder || 'Unassigned',
                        tags: item.tags,
                        teamId: item.teamId,
                        familyId: item.familyId,
                        iv: item.iv
                    };
                } catch (e) {
                    const project = projects.find(p => p._id === item.projectId);
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: 'ERROR: DECRYPTION FAILED',
                        projectId: item.projectId,
                        projectName: project?.name,
                        folder: item.folder || 'Unassigned',
                        tags: item.tags,
                        teamId: item.teamId,
                        familyId: item.familyId,
                        iv: item.iv
                    };
                }
            }));

            // Sort by key name
            const sorted = decrypted
                .filter((item): item is EnvVar => item !== null)
                .sort((a, b) => a.key.localeCompare(b.key));

            setVariables(sorted);
        } catch (error) {
            logger.error('Failed to process env vars', error);
        }
    };

    const handleAddVariable = async (directTotpToken?: string) => {
        const tokenToUse = directTotpToken ?? totpToken;

        if (!newVarKey || !newVarValue) {
            toaster.create({ title: "Key and Value are required", type: "error" });
            return;
        }

        setIsAdding(true);
        try {
            if (!mek) {
                if (!masterPassword || !masterPasswordSalt) {
                    toaster.create({ title: "Master password required", type: "error" });
                    setIsAdding(false);
                    return;
                }

                const result = await unlock(masterPassword, masterPasswordSalt, tokenToUse);
                if (!result.success || !result.mek) {
                    if (result.error === 'TwoFactorDisabled') {
                        toaster.create({ title: "Setup 2FA Required", description: "You must enable 2FA to modify your vault.", type: "error" });
                        navigate('/setup-2fa');
                    } else if (result.error === 'TwoFactorRequired') {
                        setRequires2FA(true);
                    } else {
                        toaster.create({ title: "Unlock failed", description: result.error, type: "error" });
                    }
                    setIsAdding(false);
                    return;
                }
            }

            // At this point we are unlocked (either previously or just now)
            const project = projects.find(p => p._id === selectedProjectId);
            const tags = newVarTags.split(',').map(t => t.trim()).filter(t => t !== '');

            await saveToVault(newVarKey.toUpperCase(), newVarValue, {
                projectId: selectedProjectId || undefined,
                teamId: project?.teamId || teamId,
                familyId: project?.familyId,
                tags,
                folder: (newVarFolder && newVarFolder.trim()) || 'Unassigned',
                secretType: 'env_var'
            });

            toaster.create({ title: "Secret secured in vault", type: "success" });
            handleDialogClose();
            refresh(true); // Forced refresh
        } catch (error) {
            logger.error('Failed to add variable', error);
            toaster.create({ title: "Failed to add variable", type: "error" });
        } finally {
            setIsAdding(false);
        }
    };

    const confirmDelete = async () => {
        if (deleteName) {
            try {
                await axiosInstance.post('/keyvault/delete', {
                    keyName: deleteName,
                    teamId: teamId || undefined
                });
                toaster.create({ title: "Item purged", type: "success" });
                refresh(true);
                setDeleteId(null);
                setDeleteName("");
            } catch (error) {
                logger.error('Failed to delete variable', error);
                toaster.create({ title: "Delete failed", type: "error" });
            }
        }
    };

    const handleMove = async () => {
        if (!moveItemId || !moveItemKey || !isUnlocked) return;

        setIsMoving(true);
        try {
            // 1. Locate the source record and its encryption context
            const item = variables.find(v => v.id === moveItemId);
            if (!item || !item.iv) throw new Error("Source record not found or missing IV");

            const targetProject = projects.find(p => p._id === moveTargetProjectId);

            // Determine effective source and target project IDs
            const effectiveSourceProjectId = item.projectId || "";
            const effectiveTargetProjectId = moveTargetProjectId || "";
            const effectiveSourceFolder = item.folder || 'Unassigned';
            const effectiveTargetFolder = moveTargetFolder || 'Unassigned';

            // Prevent moving to the exact same location
            if (effectiveSourceProjectId === effectiveTargetProjectId && effectiveSourceFolder === effectiveTargetFolder) {
                toaster.create({ title: "Already there", description: "The record is already in the specified project and folder.", type: "info" });
                return;
            }

            // 2. Identify keys for transcoding
            let sourceKey: CryptoKey | null = null;
            if (item.teamId) sourceKey = teamKeys[item.teamId] || null;
            else if (item.familyId) sourceKey = familyKeys[item.familyId] || null;
            else sourceKey = vaultKey || mek;

            let targetKey: CryptoKey | null = null;
            if (targetProject?.teamId) targetKey = teamKeys[targetProject.teamId] || null;
            else if (targetProject?.familyId) targetKey = familyKeys[targetProject.familyId] || null;
            else targetKey = vaultKey || mek;

            if (!sourceKey || !targetKey) {
                toaster.create({
                    title: "Action Blocked",
                    description: "You must unlock the target vault (Team or Family) before moving a record into it.",
                    type: "error"
                });
                return;
            }

            const needsTranscoding = sourceKey !== targetKey;
            let transcodePayload: { encryptedData?: string, iv?: string } = {};

            if (needsTranscoding) {
                // 3. Elite Security Handshake: Hardware Confirmation for Move
                toaster.create({ title: "Authorized Handshake Required", description: "Verify your identity to authorize context move.", type: "info" });
                const { verification } = await authenticateWithPasskey();
                if (!verification.verified) throw new Error("Hardware authorization failed");

                // 4. Perform Transcoding (Zero-Knowledge)
                const plainText = await decryptWithKey(item.value, item.iv, sourceKey);
                const { encryptedData, iv } = await encryptWithKey(plainText, targetKey);
                transcodePayload = { encryptedData, iv };
            }

            // 5. Atomic Update
            const extra = teamId ? { currentTeamId: teamId } : undefined;
            await updateItem(moveItemKey, {
                projectId: moveTargetProjectId || "", // Pass empty string if unassigned
                folder: moveTargetFolder || 'Unassigned',
                ...transcodePayload
            }, extra);

            toaster.create({ title: "Secure Transfer Complete", description: `Record bound to ${targetProject?.name || unassignedName}`, type: "success" });
            setMoveItemId(null);
            setMoveItemKey("");
            setMoveTargetProjectId("");
        } catch (error: any) {
            logger.error('Secure move failed', error);
            const msg = error.message === "Hardware authorization failed" ? "Move aborted: Biometric verification failed." : "Failed to move variable";
            toaster.create({ title: "Transfer Failed", description: msg, type: "error" });
        } finally {
            setIsMoving(false);
        }
    };

    const toggleShowValue = (id: string) => {
        setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = (text: string, label: string = "Value") => {
        copyToClipboard(text, label);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // 1. Log Security Event (Gap #7)
            await axiosInstance.post('/audit/log', {
                action: 'ENV_EXPORT',
                resourceType: 'Environment',
                resourceId: teamId || 'Personal',
                severity: 'WARN',
                details: {
                    count: variables.length,
                    teamId
                }
            });

            // 2. Perform Export
            const content = variables.map(v => `${v.key}=${v.value}`).join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = teamId ? `team-${teamId}.env` : '.env';
            a.click();

            toaster.create({ title: "Environment exported", description: "Security audit trail recorded.", type: "success" });
            setIsExportConfirmOpen(false);
        } catch (error) {
            logger.error('Export failed', error);
            toaster.create({ title: "Export failed", description: "Could not record security audit trail.", type: "error" });
        } finally {
            setIsExporting(false);
        }
    };

    const filteredVariables = variables.filter(v => {
        const matchesSearch = v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesProject = viewProjectId === 'all' || (viewProjectId === 'unassigned' ? !v.projectId : v.projectId === viewProjectId);

        return matchesSearch && matchesProject;
    });

    const groupedVars = filteredVariables.reduce((acc, curr) => {
        const pId = curr.projectId || 'unassigned';
        const folder = curr.folder || 'Unassigned';
        if (!acc[pId]) acc[pId] = {};
        if (!acc[pId][folder]) acc[pId][folder] = [];
        acc[pId][folder].push(curr);
        return acc;
    }, {} as Record<string, Record<string, EnvVar[]>>);

    const existingFolders = useMemo(() => {
        if (!selectedProjectId) {
            // Unassigned project folders
            return Array.from(new Set(variables.filter(v => !v.projectId).map(v => v.folder || 'Unassigned')));
        }
        return Array.from(new Set(variables.filter(v => v.projectId === selectedProjectId).map(v => v.folder || 'Unassigned')));
    }, [variables, selectedProjectId]);

    return (
        <VStack spaceY={6} align="stretch" w="full">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <HStack gap={3} align="center">
                    <Box p={2} bg="bg.subtle" rounded="lg" color="brand.500" border="1px solid" borderColor="border.subtle">
                        <LuTerminal size={20} />
                    </Box>
                    <VStack align="start" spaceY={0}>
                        <Text fontSize="md" fontWeight="black" letterSpacing="tight">Secret Records</Text>
                        <Text fontSize="10px" color="fg.muted" fontWeight="black" letterSpacing="widest" textTransform="uppercase">
                            {variables.length} ENVIRONMENT KEYS
                        </Text>
                    </VStack>
                    <IconButton
                        variant="ghost"
                        size="xs"
                        disabled={isVaultLoading}
                        onClick={() => refresh(true)}
                        color="fg.muted"
                        _hover={{ color: "brand.400", bg: "bg.subtle" }}
                        rounded="full"
                    >
                        <LuRefreshCw size={14} className={isVaultLoading ? "animate-spin" : ""} />
                    </IconButton>
                </HStack>

                <HStack gap={3}>
                    <NativeSelect.Root size="sm" width="180px">
                        <NativeSelect.Field
                            value={viewProjectId}
                            onChange={(e) => setViewProjectId(e.target.value)}
                            bg="bg.subtle"
                            rounded="lg"
                            fontWeight="bold"
                        >
                            <option value="all">All Projects</option>
                            <option value="unassigned">{unassignedName}</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>

                    <HStack
                        bg="bg.subtle"
                        px={4}
                        py={1.5}
                        rounded="lg"
                        borderWidth="1px"
                        borderColor="border.subtle"
                        width={{ base: "full", md: "240px" }}
                        _focusWithin={{ borderColor: "brand.400/50", bg: "bg.elevated" }}
                    >
                        <LuSearch size={16} color="var(--chakra-colors-fg-muted)" />
                        <Input
                            placeholder="Search keys..."
                            size="sm"
                            variant="flushed"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </HStack>
                    <Button variant="outline" size="sm" rounded="lg" onClick={() => setIsExportConfirmOpen(true)} disabled={variables.length === 0 || !isUnlocked}>
                        <LuDownload /> Export
                    </Button>
                    <Button colorPalette="brand" size="sm" rounded="lg" onClick={() => setIsCreateProjectOpen(true)}>
                        <LuPlus /> New Project
                    </Button>
                </HStack>
            </Flex>

            {/* Locked Warning Banner */}
            {!isUnlocked && variables.length > 0 && (
                <Alert.Root status="info" variant="subtle" rounded="xl" bg="bg.subtle" border="1px solid" borderColor="border.subtle">
                    <Alert.Indicator>
                        <LuLock />
                    </Alert.Indicator>
                    <Alert.Title fontSize="xs" fontWeight="black" letterSpacing="tight">Vault is Locked</Alert.Title>
                    <Alert.Description fontSize="xs" fontWeight="medium">
                        You can see the list of keys, but values remain encrypted. Unlock the vault to manage or view secret values.
                    </Alert.Description>
                </Alert.Root>
            )}

            {isVaultLoading && variables.length === 0 ? (
                <VStack py={20}>
                    <Spinner size="xl" color="brand.400" />
                    <Text fontSize="sm" color="fg.muted" mt={4} fontWeight="bold">Syncing Records...</Text>
                </VStack>
            ) : !isUnlocked && variables.length === 0 ? (
                <VStack py={16} gap={6} textAlign="center" border="1px dashed" borderColor="border.subtle" rounded="3xl" bg="bg.subtle/30" backdropFilter="blur(10px)">
                    <Box p={5} bg="bg.surface" rounded="2xl" shadow="inner" border="1px solid" borderColor="whiteAlpha.100">
                        <LuLock size={48} color="var(--chakra-colors-brand-500)" />
                    </Box>
                    <VStack gap={1}>
                        <Text fontSize="xl" fontWeight="black" letterSpacing="tight">Vault is Sealed</Text>
                        <Text fontSize="sm" color="fg.muted" maxW="280px" fontWeight="medium">
                            Unlock your high-security vault to decrypt and manage your environment secrets.
                        </Text>
                    </VStack>
                    <Link to="/unlock-vault">
                        <AppButton variant="primary" size="lg" px={10} w={{ base: "full", sm: "auto" }}>
                            <LuLock /> UNLOCK SECRETS
                        </AppButton>
                    </Link>
                </VStack>
            ) : variables.length === 0 ? (
                <VStack py={16} gap={6} textAlign="center" border="1px dashed" borderColor="border.subtle" rounded="3xl" bg="bg.subtle/30">
                    <Box p={5} bg="bg.surface" rounded="2xl" shadow="inner">
                        <LuTerminal size={48} color="var(--chakra-colors-brand-400)" />
                    </Box>
                    <VStack gap={1}>
                        <Text fontSize="xl" fontWeight="black" letterSpacing="tight">No Secrets Found</Text>
                        <Text fontSize="sm" color="fg.muted" maxW="300px" fontWeight="medium">
                            You haven't archived any secure variables yet. Create your first record to begin.
                        </Text>
                    </VStack>
                    <AppButton variant="primary" size="lg" px={10} onClick={() => setIsAddOpen(true)}>
                        <LuPlus /> ARCHIVE SECRET
                    </AppButton>
                </VStack>
            ) : filteredVariables.length === 0 ? (
                <VStack py={10} textAlign="center">
                    <LuSearch size={32} color="var(--chakra-colors-fg-muted)" />
                    <Text color="fg.muted" fontWeight="bold" mt={4}>No records matching "{searchTerm}"</Text>
                </VStack>
            ) : (
                <AccordionRoot collapsible multiple bg="bg.surface" rounded="2xl" border="1px solid" borderColor="border.subtle" shadow="sm">
                    {Object.keys(groupedVars).map((pId) => {
                        const project = projects.find(p => p._id === pId);
                        const isUnassignedProject = pId === 'unassigned';
                        const pName = isUnassignedProject ? unassignedName : (project?.name || 'Unknown Project');

                        // Tenancy styling
                        const isTeam = !!project?.teamId;
                        const isFamily = !!project?.familyId;
                        const ptColor = isUnassignedProject ? 'gray' : (isTeam ? 'orange' : isFamily ? 'teal' : 'brand');

                        if (viewProjectId !== 'all' && viewProjectId !== pId) return null;

                        return (
                            <AccordionItem key={pId} value={pId} borderBottom="1px solid" borderColor="border.subtle" _last={{ borderBottom: "none" }}>
                                <AccordionItemTrigger px={6} py={4} _hover={{ bg: "bg.subtle" }}>
                                    <HStack gap={3} w="full">
                                        <Box p={2} bg={`${ptColor}.500/10`} rounded="lg" color={`${ptColor}.500`}>
                                            <LuFolder size={18} />
                                        </Box>
                                        <VStack align="start" gap={0} flex={1}>
                                            <HStack>
                                                <Text fontWeight="black">{pName}</Text>
                                                <Box
                                                    as="span"
                                                    display="inline-flex"
                                                    p={1}
                                                    rounded="full"
                                                    color="fg.muted"
                                                    _hover={{ color: "brand.500", bg: "bg.elevated" }}
                                                    transition="all 0.2s"
                                                    cursor="pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameProjectId(pId);
                                                        setRenameOldName(pName);
                                                        setRenameNewName(pName);
                                                        setIsRenameOpen(true);
                                                    }}
                                                >
                                                    <LuPenLine size={14} />
                                                </Box>
                                            </HStack>
                                            <Text fontSize="xs" color="fg.muted">
                                                {isUnassignedProject ? 'Global Context' : (isTeam ? 'Team Project' : isFamily ? 'Family Project' : 'Personal Project')}
                                            </Text>
                                        </VStack>
                                        <Badge size="sm" variant="surface" colorPalette={ptColor}>
                                            {Object.values(groupedVars[pId]).reduce((sum, current) => sum + current.length, 0)} items
                                        </Badge>
                                    </HStack>
                                </AccordionItemTrigger>
                                <AccordionItemContent px={6} pb={4} pt={2}>
                                    <VStack align="stretch" spaceY={6} mt={2}>
                                        {Object.keys(groupedVars[pId]).sort((a, b) => a === 'Unassigned' ? -1 : b === 'Unassigned' ? 1 : a.localeCompare(b)).map(folderName => (
                                            <Box key={folderName}>
                                                <HStack mb={3} gap={2} color="fg.muted">
                                                    <LuFolder size={14} />
                                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">{folderName}</Text>
                                                    <Box flex={1} h="1px" bg="border.subtle" />
                                                </HStack>
                                                <Table.Root size="sm" variant="outline" rounded="xl" overflow="hidden">
                                                    <Table.Header bg="bg.subtle">
                                                        <Table.Row>
                                                            <Table.ColumnHeader width="30%">Key</Table.ColumnHeader>
                                                            <Table.ColumnHeader width="40%">Value</Table.ColumnHeader>
                                                            <Table.ColumnHeader width="15%">Tags</Table.ColumnHeader>
                                                            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {groupedVars[pId][folderName].map((v) => (
                                                            <Table.Row key={v.id.toString()}>
                                                                <Table.Cell fontWeight="bold" fontFamily="mono" color="brand.400">{v.key}</Table.Cell>
                                                                <Table.Cell>
                                                                    <HStack>
                                                                        <Text fontFamily="mono" fontSize="sm" maxW="300px" truncate>
                                                                            {v.value === '(Locked)' ? '(Locked)' : (showValues[v.id] ? v.value : '•'.repeat(Math.min(20, v.value.length)))}
                                                                        </Text>
                                                                        <IconButton aria-label="Toggle visibility" variant="ghost" size="xs" onClick={() => toggleShowValue(v.id)} disabled={v.value === '(Locked)'}>
                                                                            {showValues[v.id] ? <LuEyeOff /> : <LuEye />}
                                                                        </IconButton>
                                                                    </HStack>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    {v.tags && v.tags.length > 0 && (
                                                                        <HStack gap={1} wrap="wrap">
                                                                            {v.tags.slice(0, 2).map((tag, i) => (
                                                                                <Badge key={i} size="xs" colorPalette="cyan" variant="subtle" textTransform="none">{tag}</Badge>
                                                                            ))}
                                                                            {v.tags.length > 2 && <Text fontSize="10px">+{v.tags.length - 2}</Text>}
                                                                        </HStack>
                                                                    )}
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right">
                                                                    <HStack justify="end">
                                                                        <IconButton aria-label="Copy value" variant="ghost" size="xs" onClick={() => handleCopy(v.value)} disabled={v.value === '(Locked)'}>
                                                                            <LuCopy />
                                                                        </IconButton>
                                                                        <IconButton aria-label="Move record" variant="ghost" size="xs" disabled={!isUnlocked} onClick={() => {
                                                                            setMoveItemKey(v.key);
                                                                            setMoveItemId(v.id);
                                                                            setMoveSourceProjectId(pId === 'unassigned' ? "" : pId);
                                                                            setMoveTargetProjectId("");
                                                                            setMoveTargetFolder(v.folder);
                                                                        }}>
                                                                            <LuFolderSync />
                                                                        </IconButton>
                                                                        <IconButton aria-label="Delete variable" variant="ghost" size="xs" colorPalette="red" disabled={!isUnlocked} onClick={() => {
                                                                            setDeleteName(v.key);
                                                                            setDeleteId(v.id);
                                                                        }}>
                                                                            <LuTrash2 />
                                                                        </IconButton>
                                                                    </HStack>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                                </Table.Root>
                                            </Box>
                                        ))}
                                    </VStack>
                                </AccordionItemContent>
                            </AccordionItem>
                        );
                    })}
                </AccordionRoot>
            )}

            {/* Custom Delete Confirmation Dialog */}
            <DialogRoot open={!!deleteId} onOpenChange={(details: { open: boolean }) => !details.open && setDeleteId(null)}>
                <DialogBackdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
                <DialogContent bg="bg.elevated" borderWidth="1px" borderColor="border.subtle" rounded="2xl" shadow="2xl">
                    <DialogHeader>
                        <DialogTitle color="fg.primary" fontWeight="black">Safety Reset</DialogTitle>
                    </DialogHeader>
                    <DialogBody color="fg.muted">
                        Are you certain you wish to purge <Text as="span" fontWeight="black" color="brand.400">"{deleteName}"</Text>? This record will be permanently deleted from the zero-knowledge database.
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="ghost" onClick={() => setDeleteId(null)} color="fg.muted">Cancel</Button>
                        </DialogActionTrigger>
                        <Button colorPalette="red" rounded="xl" px={8} fontWeight="bold" onClick={confirmDelete}>
                            <LuTrash2 /> Purge Record
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger color="fg.muted" />
                </DialogContent>
            </DialogRoot>

            {/* Export Confirmation Dialog (Gap #7) */}
            <DialogRoot open={isExportConfirmOpen} onOpenChange={(details: { open: boolean }) => !details.open && setIsExportConfirmOpen(false)}>
                <DialogBackdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
                <DialogContent bg="bg.elevated" borderWidth="1px" borderColor="border.subtle" rounded="2xl" shadow="2xl">
                    <DialogHeader>
                        <DialogTitle color="fg.primary" fontWeight="black" display="flex" alignItems="center" gap={2}>
                            < LuLock color="var(--chakra-colors-brand-500)" /> Security Clearance
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody color="fg.muted">
                        <VStack align="start" spaceY={4}>
                            <Text>
                                You are about to export <Text as="span" fontWeight="black" color="brand.400">{variables.length}</Text> decrypted secrets to a local file.
                            </Text>
                            <Box p={3} bg="bg.subtle" rounded="lg" border="1px solid" borderColor="orange.500/30" w="full">
                                <Text fontSize="xs" fontWeight="bold" color="orange.500">
                                    CAUTION: Local .env files are stored in plain text. Ensure your local environment is secure.
                                </Text>
                            </Box>
                            <Text fontSize="xs">
                                **Audit Trail:** A permanent record of this export action will be stored in the security logs.
                            </Text>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="ghost" onClick={() => setIsExportConfirmOpen(false)} color="fg.muted">Abort</Button>
                        </DialogActionTrigger>
                        <AppButton rounded="xl" px={8} fontWeight="bold" onClick={handleExport} loading={isExporting}>
                            Authorize & Download
                        </AppButton>
                    </DialogFooter>
                    <DialogCloseTrigger color="fg.muted" />
                </DialogContent>
            </DialogRoot>

            {/* Add Variable Dialog */}
            <DialogRoot open={isAddOpen} onOpenChange={(e) => !e.open && handleDialogClose()}>
                <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle" rounded="2xl" shadow="2xl">
                    <DialogHeader>
                        <DialogTitle fontSize="xl" fontWeight="black" letterSpacing="tight">Archive Secure Secret</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack spaceY={5}>
                            <Box w="full">
                                <Text fontSize="xs" fontWeight="black" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="widest">Variable Key</Text>
                                <Input
                                    placeholder="e.g. DATABASE_PRODUCTION_URL"
                                    value={newVarKey}
                                    onChange={(e) => setNewVarKey(e.target.value.toUpperCase())}
                                    fontFamily="mono"
                                    fontWeight="bold"
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.subtle"
                                />
                            </Box>
                            <Box w="full">
                                <Text fontSize="xs" fontWeight="black" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="widest">Secret Value</Text>
                                <PasswordInput
                                    placeholder="Enter encrypted value"
                                    value={newVarValue}
                                    onChange={(e) => setNewVarValue(e.target.value)}
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.subtle"
                                />
                            </Box>
                            <Box w="full">
                                <HStack mb={2} color="fg.muted">
                                    <LuFolder size={14} />
                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Project Scoping</Text>
                                </HStack>
                                <NativeSelect.Root size="lg">
                                    <NativeSelect.Field
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        bg="bg.subtle"
                                        rounded="xl"
                                        fontWeight="bold"
                                    >
                                        <option value="">Unassigned</option>
                                        {Array.from(new Map(projects.map(p => [p.name, p])).values()).map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>

                            <Box w="full">
                                <HStack mb={2} color="fg.muted">
                                    <LuFolder size={14} />
                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Folder Name</Text>
                                </HStack>
                                <Input
                                    placeholder="e.g. Production, Staging"
                                    value={newVarFolder}
                                    onChange={(e) => setNewVarFolder(e.target.value)}
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.subtle"
                                    list="existing-folders"
                                />
                                <datalist id="existing-folders">
                                    {existingFolders.map(f => (
                                        <option key={f} value={f} />
                                    ))}
                                </datalist>
                            </Box>

                            <Box w="full">
                                <HStack mb={2} color="fg.muted">
                                    <LuTag size={14} />
                                    <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Tags</Text>
                                </HStack>
                                <Input
                                    placeholder="e.g. production, ci-cd (comma separated)"
                                    value={newVarTags}
                                    onChange={(e) => setNewVarTags(e.target.value)}
                                    size="lg"
                                    rounded="xl"
                                    bg="bg.subtle"
                                />
                            </Box>
                            {!mek && (
                                <Box w="full" p={5} bg="bg.muted" rounded="2xl" border="1px solid" borderColor="brand.500/20 shadow='inner'">
                                    <HStack mb={3} color="brand.400" align="center">
                                        <LuLock size={18} />
                                        <Text fontSize="sm" fontWeight="black" letterSpacing="tight">Vault Protection Active</Text>
                                    </HStack>
                                    <Text fontSize="xs" color="fg.muted" mb={5} fontWeight="medium">
                                        Your vault is currently sealed. Provide your master password to unlock and authorize this encryption.
                                    </Text>
                                    <VStack spaceY={4}>
                                        <PasswordInput
                                            placeholder="Vault Master Password"
                                            value={masterPassword}
                                            onChange={(e) => setMasterPassword(e.target.value)}
                                            size="md"
                                            rounded="xl"
                                            disabled={requires2FA || isAdding}
                                            bg="bg.surface"
                                        />
                                        {requires2FA && (
                                            <Box w="full">
                                                <Text fontSize="xs" fontWeight="black" textAlign="center" mb={4} color="brand.400" textTransform="uppercase" letterSpacing="widest">
                                                    Authorization Token Required
                                                </Text>
                                                <HStack justify="center">
                                                    <OTPInput
                                                        length={6}
                                                        value={totpToken}
                                                        onChange={setTotpToken}
                                                        onComplete={(value) => handleAddVariable(value)}
                                                        disabled={isAdding}
                                                    />
                                                </HStack>
                                            </Box>
                                        )}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </DialogBody>
                    <DialogFooter borderTop="1px solid" borderColor="border.subtle" pt={4}>
                        <Button variant="ghost" onClick={handleDialogClose} disabled={isAdding} fontWeight="bold">Cancel</Button>
                        <AppButton
                            variant="primary"
                            size="lg"
                            px={8}
                            onClick={() => handleAddVariable()}
                            disabled={!newVarKey || !newVarValue || isAdding || (!mek && !masterPassword)}
                            width={{ base: "full", sm: "auto" }}
                            loading={isAdding || isUnlocking}
                        >
                            {mek ? "ARCHIVE & ENCRYPT" : "UNLOCK & ARCHIVE"}
                        </AppButton>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

            {/* Move to Project Dialog */}
            <DialogRoot open={!!moveItemId} onOpenChange={(details: { open: boolean }) => {
                if (!details.open) {
                    setMoveItemId(null);
                    setMoveItemKey("");
                    setMoveTargetProjectId("");
                    setMoveSourceProjectId("");
                }
            }}>
                <DialogBackdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
                <DialogContent bg="bg.elevated" borderWidth="1px" borderColor="border.subtle" rounded="2xl" shadow="2xl">
                    <DialogHeader>
                        <DialogTitle color="fg.primary" fontWeight="black" display="flex" alignItems="center" gap={2}>
                            <LuFolderSync color="var(--chakra-colors-brand-500)" size={24} /> Secure Transcode & Move
                        </DialogTitle>
                    </DialogHeader>
                    {(() => {
                        const targetProject = projects.find(p => p._id === moveTargetProjectId);
                        const item = variables.find(v => v.id === moveItemId);

                        let needsTranscoding = false;

                        if (item) {
                            let sourceKey: CryptoKey | null = null;
                            if (item.teamId) sourceKey = teamKeys[item.teamId] || null;
                            else if (item.familyId) sourceKey = familyKeys[item.familyId] || null;
                            else sourceKey = vaultKey || mek;

                            let targetKey: CryptoKey | null = null;
                            if (targetProject?.teamId) targetKey = teamKeys[targetProject.teamId] || null;
                            else if (targetProject?.familyId) targetKey = familyKeys[targetProject.familyId] || null;
                            else targetKey = vaultKey || mek;

                            needsTranscoding = sourceKey !== targetKey;
                        }

                        // Determine effective source and target project IDs
                        const effectiveSourceProjectId = moveSourceProjectId || "";
                        const effectiveTargetProjectId = moveTargetProjectId || "";
                        const effectiveSourceFolder = item?.folder || "Unassigned";
                        const effectiveTargetFolder = moveTargetFolder || "Unassigned";

                        const isSameLocation = effectiveSourceProjectId === effectiveTargetProjectId && effectiveSourceFolder === effectiveTargetFolder;

                        return (
                            <>
                                <DialogBody color="fg.muted">
                                    <VStack align="start" spaceY={4} w="full">
                                        <Text fontSize="sm">
                                            You are about to move <Text as="span" fontWeight="black" color="brand.400">{moveItemKey}</Text> to a new project.
                                        </Text>
                                        <Box w="full">
                                            <Text fontSize="xs" fontWeight="black" mb={2} textTransform="uppercase" letterSpacing="widest">Target Project</Text>
                                            <NativeSelect.Root size="md">
                                                <NativeSelect.Field
                                                    value={moveTargetProjectId}
                                                    onChange={(e) => setMoveTargetProjectId(e.target.value)}
                                                    bg="bg.surface"
                                                    rounded="lg"
                                                    fontWeight="bold"
                                                >
                                                    <option value="">{unassignedName}</option>
                                                    {Array.from(new Map(projects.map(p => [p.name, p])).values()).map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                        </Box>
                                        <Box w="full">
                                            <Text fontSize="xs" fontWeight="black" mb={2} textTransform="uppercase" letterSpacing="widest">Target Folder</Text>
                                            <Input
                                                placeholder="e.g. Production, Staging"
                                                value={moveTargetFolder}
                                                onChange={(e) => setMoveTargetFolder(e.target.value)}
                                                bg="bg.surface"
                                                rounded="lg"
                                                fontWeight="bold"
                                            />
                                        </Box>

                                        {needsTranscoding && (
                                            <HStack w="full" p={3} bg="brand.500/5" border="1px solid" borderColor="brand.500/20" rounded="xl" gap={3}>
                                                <LuShieldCheck color="var(--chakra-colors-brand-500)" size={20} />
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="xs" fontWeight="black" color="brand.400">Elite Security Active</Text>
                                                    <Text fontSize="10px" color="fg.muted">Hardware biometric verification required to authorize context move.</Text>
                                                </VStack>
                                            </HStack>
                                        )}
                                    </VStack>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogActionTrigger asChild>
                                        <Button variant="ghost" onClick={() => setMoveItemId(null)} color="fg.muted">Cancel</Button>
                                    </DialogActionTrigger>
                                    <AppButton loading={isMoving} rounded="xl" px={8} fontWeight="bold" onClick={handleMove} disabled={isSameLocation}>
                                        Move Record
                                    </AppButton>
                                </DialogFooter>
                            </>
                        );
                    })()}
                    <DialogCloseTrigger color="fg.muted" />
                </DialogContent>
            </DialogRoot>

            <CreateProjectDialog
                open={isCreateProjectOpen}
                onOpenChange={setIsCreateProjectOpen}
                onSuccess={async (pId) => {
                    await refreshProjects();
                    setSelectedProjectId(pId);
                    setIsAddOpen(true);
                }}
            />
            <DialogRoot open={isRenameOpen} onOpenChange={(e) => setIsRenameOpen(e.open)}>
                <DialogContent bg="bg.panel" border="1px solid" borderColor="brand.500/20" rounded="2xl" shadow="2xl">
                    <DialogHeader>
                        <DialogTitle color="fg.primary">
                            {renameProjectId === 'unassigned' ? "Rename Display Label" : "Rename Project"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack spaceY={4} align="stretch">
                            <Text fontSize="sm" color="fg.muted">
                                {renameProjectId === 'unassigned'
                                    ? "Customize how 'Unassigned Project' appears in your dashboard (stored locally)."
                                    : "Enter a new name for this project."}
                            </Text>
                            <Input
                                placeholder="New name"
                                value={renameNewName}
                                onChange={(e) => setRenameNewName(e.target.value)}
                                bg="bg.surface"
                                autoFocus
                            />
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogActionTrigger>
                        <Button
                            colorPalette="brand"
                            disabled={isRenaming || !renameNewName.trim() || renameNewName === renameOldName}
                            onClick={async () => {
                                setIsRenaming(true);
                                try {
                                    if (renameProjectId === 'unassigned') {
                                        handleSaveUnassignedName(renameNewName);
                                        toaster.create({ title: "Label updated", type: "success" });
                                        setIsRenameOpen(false);
                                    } else {
                                        await renameProject(renameProjectId, renameNewName);
                                        toaster.create({ title: "Project renamed", type: "success" });
                                        setIsRenameOpen(false);
                                    }
                                } catch (error) {
                                    toaster.create({ title: "Rename failed", type: "error" });
                                } finally {
                                    setIsRenaming(false);
                                }
                            }}
                        >
                            {isRenaming ? <Spinner size="sm" /> : "Save"}
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </VStack>
    );
};

export default EnvironmentVariables;
