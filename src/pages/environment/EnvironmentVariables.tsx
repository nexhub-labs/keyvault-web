import { useState, useEffect } from 'react';
import {
    Box, VStack, Table, IconButton,
    Text, Badge, HStack,
    Input,
    Spinner,
    Flex,
    Alert,
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
import { LuCopy, LuEye, LuEyeOff, LuTrash2, LuPlus, LuDownload, LuRefreshCw, LuTerminal, LuLock, LuSearch } from 'react-icons/lu';
import { useVaultContext } from '../../context/VaultContext';
import { decryptWithKey } from '../../utils/crypto';
import { logger } from '../../utils/logger';
import { toaster } from '../../components/ui/toaster';
import axiosInstance from '../../utils/axiosInstance';
import { VaultItem } from '../../api/vault';
import { PasswordInput } from '../../components/ui/password-input';
import { OTPInput } from '../../components/ui/pin-input';
import { useVaultUnlock } from '../../hooks/useVaultUnlock';
import { useVault } from '../../hooks/useVault';
import { Link } from 'react-router';
import { AppButton } from '../../components/ui/AppButton';
import { Button } from '@chakra-ui/react';

interface EnvVar {
    id: string;
    key: string;
    value: string; // Decrypted value for display
    projectId?: string;
    description?: string;
    iv?: string; // stored IV 
}

interface EnvironmentVariablesProps {
    teamId?: string;
    isAddOpenExternally?: boolean;
    onAddClose?: () => void;
}

const EnvironmentVariables = ({ teamId, isAddOpenExternally, onAddClose }: EnvironmentVariablesProps) => {
    const { mek, teamKeys, isUnlocked } = useVaultContext();
    const { vaultItems, refresh, saveToVault, loading: isVaultLoading } = useVault({ autoFetch: false });
    const [variables, setVariables] = useState<EnvVar[]>([]);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>("");

    // Inline unlock state
    const { unlock, fetchSalt, masterPasswordSalt, isUnlocking } = useVaultUnlock();
    const [masterPassword, setMasterPassword] = useState("");
    const [totpToken, setTotpToken] = useState("");
    const [requires2FA, setRequires2FA] = useState(false);

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
        setMasterPassword("");
        setTotpToken("");
        setRequires2FA(false);
    };

    // Load variables
    useEffect(() => {
        // We always try to fetch, fetchVariables handles missing keys by showing "(Locked)"
        fetchVariables();
    }, [mek, teamId, teamKeys, vaultItems]);

    // Fetch master password salt if adding and vault is locked
    useEffect(() => {
        if (isAddOpen && !mek) {
            fetchSalt();
        }
    }, [isAddOpen, mek, fetchSalt]);

    const fetchVariables = async () => {
        const effectiveKey = teamId ? teamKeys[teamId] : mek;

        try {
            const data = teamId
                ? vaultItems.filter((i: VaultItem) => i.teamId === teamId && i.secretType === 'env_var')
                : vaultItems.filter((i: VaultItem) => i.secretType === 'env_var' || (!i.secretType && i.keyName.includes('_'))); // Heuristic for older env vars if type missing, but schema says default is 'password'

            const decrypted: (EnvVar | null)[] = await Promise.all(data.map(async (item: VaultItem) => {
                if (!effectiveKey) {
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: '(Locked)',
                        projectId: item.projectId,
                        iv: item.iv
                    };
                }

                try {
                    const decryptedValue = await decryptWithKey(item.encryptedData, item.iv, effectiveKey);
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: decryptedValue,
                        projectId: item.projectId,
                        iv: item.iv
                    };
                } catch (e) {
                    return {
                        id: item._id,
                        key: item.keyName,
                        value: 'ERROR: DECRYPTION FAILED',
                        projectId: item.projectId,
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
                    if (result.error === 'TwoFactorRequired') {
                        setRequires2FA(true);
                    } else {
                        toaster.create({ title: "Unlock failed", description: result.error, type: "error" });
                    }
                    setIsAdding(false);
                    return;
                }
            }

            // At this point we are unlocked (either previously or just now)
            await saveToVault(newVarKey.toUpperCase(), newVarValue, { teamId, secretType: 'env_var' });

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

    const toggleShowValue = (id: string) => {
        setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toaster.create({ title: "Copied to clipboard", type: "success" });
    };

    const handleExport = () => {
        const content = variables.map(v => `${v.key}=${v.value}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env';
        a.click();
    };

    const filteredVariables = variables.filter(v =>
        v.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <Button variant="outline" size="sm" rounded="lg" onClick={handleExport} disabled={variables.length === 0 || !isUnlocked}>
                        <LuDownload /> Export
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
            ) : (
                <Table.Root size="sm" variant="outline">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader width="30%">Key</Table.ColumnHeader>
                            <Table.ColumnHeader width="40%">Value</Table.ColumnHeader>
                            <Table.ColumnHeader width="15%">Project</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {searchTerm && filteredVariables.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={4} textAlign="center" py={10}>
                                    <VStack gap={2}>
                                        <LuSearch size={24} color="var(--chakra-colors-fg-muted)" />
                                        <Text color="fg.muted" fontWeight="bold">No records matching "{searchTerm}"</Text>
                                    </VStack>
                                </Table.Cell>
                            </Table.Row>
                        ) : filteredVariables.map((v) => (
                            <Table.Row key={v.id.toString()}>
                                <Table.Cell fontWeight="bold" fontFamily="mono" color="brand.400">
                                    {v.key}
                                </Table.Cell>
                                <Table.Cell>
                                    <HStack>
                                        <Text fontFamily="mono" fontSize="sm" maxW="300px" truncate>
                                            {v.value === '(Locked)' ? '(Locked)' : (showValues[v.id] ? v.value : '•'.repeat(Math.min(20, v.value.length)))}
                                        </Text>
                                        <IconButton
                                            aria-label="Toggle visibility"
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => toggleShowValue(v.id)}
                                            disabled={v.value === '(Locked)'}
                                        >
                                            {showValues[v.id] ? <LuEyeOff /> : <LuEye />}
                                        </IconButton>
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell>
                                    {v.projectId ? <Badge>{v.projectId}</Badge> : <Badge colorPalette="gray" variant="surface">Global</Badge>}
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                    <HStack justify="end">
                                        <IconButton aria-label="Copy value" variant="ghost" size="xs" onClick={() => handleCopy(v.value)} disabled={v.value === '(Locked)'}>
                                            <LuCopy />
                                        </IconButton>
                                        <IconButton
                                            aria-label="Delete variable"
                                            variant="ghost"
                                            size="xs"
                                            colorPalette="red"
                                            onClick={() => {
                                                setDeleteName(v.key);
                                                setDeleteId(v.id);
                                            }}
                                            disabled={!isUnlocked}
                                        >
                                            <LuTrash2 />
                                        </IconButton>
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
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
                        >
                            {isAdding || isUnlocking ? <Spinner size="sm" /> : (mek ? "ARCHIVE & ENCRYPT" : "UNLOCK & ARCHIVE")}
                        </AppButton>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </VStack>
    );
};

export default EnvironmentVariables;
