import { Box, Heading, Text, VStack, IconButton, HStack, SimpleGrid, Flex, Input, Badge, Spinner, Center, Button, NativeSelect } from '@chakra-ui/react';
import { Link } from 'react-router';
import { LuTrash2, LuCopy, LuEye, LuEyeOff, LuSearch, LuKeyRound, LuCheck, LuRefreshCw, LuFolder, LuTag, LuPenLine } from 'react-icons/lu';
import { useState } from 'react';
import SpotlightCard from '../../components/SpotlightCard/SpotlightCard';
import { getHeuristicStrength } from '../../utils/security';
import { toaster } from "../../components/ui/toaster";
import { useProjects } from '../../hooks/useProjects';
import {
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogBackdrop,
} from '../../components/ui/dialog';
// import { logger } from '../../utils/logger';

import { VaultItem } from '../../api/vault';
import { useVaultContext } from '../../context/VaultContext';

interface FavoritesListProps {
    vaultItems: VaultItem[];
    loading: boolean;
    decryptPassword: (keyName: string, extra?: { teamId?: string; familyId?: string }) => Promise<string | null>;
    deleteItem: (keyName: string, extra?: { teamId?: string; familyId?: string }) => Promise<void>;
    refresh: (filter?: { projectId?: string; teamId?: string; familyId?: string } | boolean, force?: boolean) => Promise<void>;
    isUnlocked: boolean;
    maxItems?: number; // Optional limit for Dashboard view
}

const FavoritesList = ({ vaultItems, loading, decryptPassword, deleteItem, refresh, isUnlocked, maxItems }: FavoritesListProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [displayLimit, setDisplayLimit] = useState(maxItems || 6);
    const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
    const [isDecrypting, setIsDecrypting] = useState<Record<string, boolean>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>("");
    const [viewProjectId, setViewProjectId] = useState<string>('all');
    const { projects, renameProject } = useProjects();

    const [unassignedName, setUnassignedName] = useState<string>(
        localStorage.getItem('KV_UNASSIGNED_NAME') || 'Unassigned Project'
    );

    // Rename Modal State
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameProjectId, setRenameProjectId] = useState<string>('');
    const [renameOldName, setRenameOldName] = useState<string>('');
    const [renameNewName, setRenameNewName] = useState<string>('');
    const [isRenaming, setIsRenaming] = useState(false);

    const handleSaveUnassignedName = (newName: string) => {
        const val = newName.trim() || 'Unassigned Project';
        localStorage.setItem('KV_UNASSIGNED_NAME', val);
        setUnassignedName(val);
    };
    const { copyToClipboard } = useVaultContext();
    const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (deleteName) {
            try {
                const item = vaultItems.find(i => i._id === deleteId);
                await deleteItem(deleteName, { teamId: item?.teamId, familyId: item?.familyId });
                toaster.create({ title: "Item deleted", type: "success" });
                setDeleteId(null);
                setDeleteName("");
            } catch (error) {
                toaster.create({ title: "Failed to delete item", type: "error" });
            }
        }
    };

    const handleRevealClick = async (keyId: string, keyName: string) => {
        if (decryptedPasswords[keyId]) {
            // Already decrypted, just toggle to hide
            const newDecrypted = { ...decryptedPasswords };
            delete newDecrypted[keyId];
            setDecryptedPasswords(newDecrypted);
        } else {
            // Decrypt using the appropriate key
            setIsDecrypting(prev => ({ ...prev, [keyId]: true }));

            try {
                const item = vaultItems.find(i => i._id === keyId);
                const password = await decryptPassword(keyName, { teamId: item?.teamId, familyId: item?.familyId });
                if (password) {
                    setDecryptedPasswords(prev => ({ ...prev, [keyId]: password }));
                }
            } catch (error) {
                // logger.error('Decryption failed:', error);
                toaster.create({
                    title: "Decryption failed",
                    description: "Check your vault status",
                    type: "error",
                });
            } finally {
                setIsDecrypting(prev => ({ ...prev, [keyId]: false }));
            }
        }
    };

    const handleCopy = (text: string, id: string, label: string) => {
        copyToClipboard(text, label);
        setLastCopiedId(id);
        setTimeout(() => setLastCopiedId(null), 2000);
    };

    const allVaultItems = vaultItems.filter(item =>
        item.secretType === 'password' || item.secretType === 'key' || !item.secretType
    );

    const filteredVault = allVaultItems.filter(item => {
        const matchesSearch = item.keyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesProject = viewProjectId === 'all' || (viewProjectId === 'unassigned' ? !item.projectId : item.projectId === viewProjectId);

        return matchesSearch && matchesProject;
    });

    const displayedVault = filteredVault.slice(0, displayLimit);
    const hasMore = filteredVault.length > displayLimit;

    if (loading && vaultItems.length === 0) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="brand.400" />
            </Center>
        );
    }

    if (vaultItems.length === 0) {
        return (
            <SpotlightCard
                h="full"
                rounded="3xl"
                border="1px solid"
                borderColor="border.subtle"
                bg="bg.surface"
                spotlightColor="rgba(255, 255, 255, 0.02)"
            >
                <VStack spaceY={6} align="center" justify="center" h="400px" textAlign="center" p={10}>
                    <Box p={5} bg="bg.subtle" rounded="2xl" color="fg.muted">
                        <LuKeyRound size={48} />
                    </Box>
                    <VStack spaceY={1}>
                        <Heading size="lg" color="fg.primary" fontWeight="black">Vault is Empty</Heading>
                        <Text color="fg.muted" fontSize="md" maxW="300px">
                            Generate secure passwords and save them to your private vault.
                        </Text>
                    </VStack>
                    <Link to="/generator">
                        <Button variant="solid" colorPalette="brand" rounded="full" px={8} fontWeight="bold">
                            Go to Generator
                        </Button>
                    </Link>
                </VStack>
            </SpotlightCard>
        );
    }

    return (
        <VStack spaceY={10} align="stretch" w="full">
            <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                <HStack gap={3} color="fg.primary" align="center" wrap="wrap">
                    <Box p={2} bg="bg.subtle" rounded="lg" color="brand.500" border="1px solid" borderColor="border.subtle">
                        <LuKeyRound size={20} />
                    </Box>
                    <VStack align="start" spaceY={0}>
                        <Heading size="sm" fontWeight="black" letterSpacing="tight">Vault Items</Heading>
                        <Text fontSize="9px" color="fg.muted" fontWeight="black" letterSpacing="widest" textTransform="uppercase">
                            {allVaultItems.length} SECURE RECORDS
                        </Text>
                    </VStack>
                    <IconButton
                        variant="ghost"
                        size="xs"
                        disabled={loading}
                        aria-label="Refresh Vault"
                        onClick={() => refresh(true)}
                        color="fg.muted"
                        _hover={{ color: "brand.400", bg: "bg.subtle" }}
                        rounded="full"
                        ml={-1}
                    >
                        <LuRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </IconButton>
                </HStack>

                <HStack gap={3} width={{ base: "full", md: "auto" }} wrap="wrap">
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

                    {viewProjectId !== 'all' && (
                        <IconButton
                            variant="surface"
                            size="sm"
                            aria-label="Rename Project"
                            onClick={() => {
                                const pName = viewProjectId === 'unassigned' ? unassignedName : projects.find(p => p._id === viewProjectId)?.name || '';
                                setRenameProjectId(viewProjectId);
                                setRenameOldName(pName);
                                setRenameNewName(pName);
                                setIsRenameOpen(true);
                            }}
                        >
                            <LuPenLine />
                        </IconButton>
                    )}

                    <HStack
                        bg="bg.subtle"
                        px={4}
                        py={1.5}
                        rounded="lg"
                        borderWidth="1px"
                        borderColor="border.subtle"
                        width={{ base: "full", md: "260px" }}
                        _focusWithin={{ borderColor: "brand.400/50", bg: "bg.elevated", shadow: "0 0 12px var(--chakra-colors-brand-500-20)" }}
                        transition="all 0.2s"
                    >
                        <LuSearch color="var(--chakra-colors-fg-muted)" size={18} />
                        <Input
                            placeholder="Search keys or tags..."
                            size="sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            _focus={{ outline: "none" }}
                            bg="transparent"
                            border="none"
                            color="fg.primary"
                            fontWeight="medium"
                        />
                    </HStack>
                </HStack>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
                {displayedVault.map((item) => (
                    <SpotlightCard
                        key={String(item._id.toString())}
                        rounded="2xl"
                        borderWidth="1px"
                        borderColor="border.subtle"
                        bg="bg.surface"
                        backdropFilter="blur(20px)"
                        shadow="sm"
                        spotlightColor="rgba(34, 197, 94, 0.05)"
                        transition="all 0.3s"
                        _hover={{ transform: "translateY(-4px)", shadow: "md", borderColor: "brand.400/30" }}
                    >
                        <VStack align="stretch" spaceY={4} p={5}>
                            <Flex justify="space-between" align="center">
                                <VStack align="start" spaceY={1}>
                                    <HStack wrap="wrap">
                                        <Text fontWeight="black" color="fg.primary" fontSize="lg" truncate maxW="150px" letterSpacing="tight">
                                            {item.keyName}
                                        </Text>
                                        <Badge
                                            size="xs"
                                            variant="subtle"
                                            rounded="md"
                                            colorPalette={getHeuristicStrength(item).color.split('.')[0]}
                                            px={1.5}
                                            textTransform="uppercase"
                                        >
                                            {getHeuristicStrength(item).label}
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="10px" color="fg.muted" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
                                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                    <HStack gap={1} wrap="wrap" mt={1}>
                                        <Badge size="xs" variant="outline" colorPalette={item.projectId ? "blue" : "gray"} rounded="full">
                                            <LuFolder size={10} style={{ marginRight: '4px' }} />
                                            {item.projectId ? (projects.find(p => p._id === item.projectId)?.name || 'Project') : unassignedName}
                                        </Badge>
                                        <Badge size="xs" variant="outline" colorPalette="gray" rounded="full">
                                            {item.folder || 'Unassigned'}
                                        </Badge>
                                        {item.tags?.map(tag => (
                                            <Badge key={tag} size="xs" variant="surface" colorPalette="gray" rounded="full">
                                                <LuTag size={10} style={{ marginRight: '4px' }} />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </HStack>
                                </VStack>
                                <HStack spaceX={1}>
                                    {decryptedPasswords[item._id] && (
                                        <IconButton
                                            variant="subtle"
                                            size="xs"
                                            rounded="md"
                                            aria-label="Copy password"
                                            colorPalette="brand"
                                            disabled={!isUnlocked}
                                            onClick={() => handleCopy(decryptedPasswords[item._id], item._id, item.keyName)}
                                        >
                                            {lastCopiedId === item._id ? <LuCheck size={14} /> : <LuCopy size={14} />}
                                        </IconButton>
                                    )}
                                    <IconButton
                                        variant="subtle"
                                        size="xs"
                                        rounded="md"
                                        disabled={isDecrypting[item._id]}
                                        aria-label={decryptedPasswords[item._id] ? "Hide password" : "Show password"}
                                        onClick={() => handleRevealClick(item._id, item.keyName)}
                                        colorPalette="gray"
                                    >
                                        <LuRefreshCw size={14} className={isDecrypting[item._id] ? "animate-spin" : "hidden"} />
                                        {!isDecrypting[item._id] && (decryptedPasswords[item._id] ? <LuEyeOff size={14} /> : <LuEye size={14} />)}
                                    </IconButton>
                                    <IconButton
                                        variant="ghost"
                                        colorPalette="red"
                                        size="xs"
                                        rounded="md"
                                        aria-label="Remove from vault"
                                        disabled={!isUnlocked}
                                        opacity={0.4}
                                        _hover={{ opacity: 1, bg: "red.500/10" }}
                                        onClick={() => {
                                            setDeleteName(item.keyName);
                                            setDeleteId(item._id);
                                        }}
                                    >
                                        <LuTrash2 size={14} />
                                    </IconButton>
                                </HStack>
                            </Flex>

                            <Box
                                p={5}
                                bg="bg.subtle"
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor="border.subtle"
                                fontFamily="mono"
                                position="relative"
                                overflow="hidden"
                                minH="70px"
                                display="flex"
                                alignItems="center"
                                shadow="inner"
                            >
                                <Text
                                    filter={decryptedPasswords[item._id] ? 'none' : 'blur(16px)'}
                                    transition="all 0.6s cubic-bezier(0.19, 1, 0.22, 1)"
                                    userSelect={decryptedPasswords[item._id] ? 'all' : 'none'}
                                    fontSize="xl"
                                    fontWeight="black"
                                    letterSpacing="0.3em"
                                    w="full"
                                    textAlign="center"
                                    color={decryptedPasswords[item._id] ? "brand.400" : "fg.primary"}
                                >
                                    {decryptedPasswords[item._id] || "••••••••••••••••"}
                                </Text>
                            </Box>
                        </VStack>
                    </SpotlightCard>
                ))}
            </SimpleGrid>

            {hasMore && !maxItems && (
                <Flex justify="center" pt={4}>
                    <Button
                        variant="subtle"
                        colorPalette="gray"
                        rounded="2xl"
                        size="lg"
                        onClick={() => setDisplayLimit(prev => prev + 6)}
                        fontWeight="black"
                        px={10}
                        border="1px solid"
                        borderColor="border.subtle"
                        _hover={{ transform: "translateY(-2px)", bg: "bg.subtle", borderColor: "brand.400/30" }}
                        transition="all 0.3s"
                    >
                        REVEAL MORE RECORDS
                    </Button>
                </Flex>
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

            {filteredVault.length === 0 && searchTerm && (
                <Center flexDirection="column" py={20} border="2px dashed" borderColor="border.subtle" rounded="3xl">
                    <LuSearch size={32} color="var(--chakra-colors-fg-muted)" />
                    <Text color="fg.muted" mt={4} fontWeight="bold">No records found for "{searchTerm}"</Text>
                </Center>
            )}
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

export default FavoritesList;
