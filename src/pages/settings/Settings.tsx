import { Container, VStack, Heading, Text, Box, Tabs, Input, Button, Flex, Badge, HStack, Separator, Spinner, useDisclosure, SimpleGrid } from "@chakra-ui/react";
import { Link } from "react-router";
import { LuUser, LuLock, LuUsers, LuKey, LuCheck, LuTriangle, LuPlus, LuLockOpen, LuCreditCard } from "react-icons/lu";
import Billing from "./Billing";
import { useEffect, useState } from "react";
import BlurText from "../../components/BlurText/BlurText";
import { toaster } from "../../components/ui/toaster";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger
} from "../../components/ui/dialog";
import { useColorModeValue } from "../../components/ui/color-mode";
import { setupTrustedContactsAPI, checkRecoveryStatusAPI, getTrustedContactsAPI, getMasterPasswordStatusAPI, TrustedContactPayload } from "../../api/auth";
import { generateRecoveryKey, splitSecret } from "../../utils/crypto";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    profileSchema,
    trustedContactsSchema,
    ProfileFormValues,
    TrustedContactsFormValues
} from "../../utils/validation";
import { useVaultContext } from "../../context/VaultContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../utils/supabase";
import TwoFactorSetup from "./TwoFactorSetup";
import PasskeySettings from "./PasskeySettings";

const Settings = () => {
    const { isUnlocked } = useVaultContext();
    const { session } = useAuth();
    const user = session?.user ?? null;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("account");

    const surfaceBg = useColorModeValue("white", "bg.surface");
    const borderSubtle = useColorModeValue("gray.200", "border.subtle");

    // Fetch pricing limits on auth change
    // Recovery Management State
    const [masterPasswordSetup, setMasterPasswordSetup] = useState(false);
    const [contactsSetup, setContactsSetup] = useState(false);
    const [configuredContacts, setConfiguredContacts] = useState(0);
    const [recoveryStatusLoading, setRecoveryStatusLoading] = useState(true);
    const [recoveryRequestStatus, setRecoveryRequestStatus] = useState<'none' | 'pending' | 'complete' | 'expired' | 'no_request'>('none');
    const [approvedShards, setApprovedShards] = useState<number[]>([]);
    const [requiredCount, setRequiredCount] = useState(2); // Default to 2-of-3 threshold

    // Modal for managing contacts
    const { open, onOpen, onClose } = useDisclosure();
    const [contactsLoading, setContactsLoading] = useState(false);

    // Form hooks
    const profileForm = useForm<ProfileFormValues>({
        resolver: yupResolver(profileSchema),
        mode: 'onChange',
    });

    const contactsForm = useForm<TrustedContactsFormValues>({
        resolver: yupResolver(trustedContactsSchema),
        mode: 'onChange',
        defaultValues: {
            contacts: ['', '', ''],
        },
    });

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            profileForm.setValue('fullName', user.user_metadata.full_name);
        }
        // Load recovery status
        if (user) {
            loadRecoveryStatus();
        }
    }, [user, profileForm]);

    const loadRecoveryStatus = async () => {
        setRecoveryStatusLoading(true);

        // Execute all three API calls in parallel but handle each independently
        await Promise.allSettled([
            // Master password status
            (async () => {
                try {
                    const data = await getMasterPasswordStatusAPI();
                    setMasterPasswordSetup(data.hasMasterSetup);
                    return { success: true, type: 'master' as const };
                } catch (error) {
                    setMasterPasswordSetup(false);
                    return { success: false, type: 'master' as const, error };
                }
            })(),

            // Trusted contacts
            (async () => {
                try {
                    const data = await getTrustedContactsAPI();
                    if (data && data.length > 0) {
                        // API returns array of TrustedContactPayload (now use standardized 'email')
                        const contactEmails = data.map((c) => c.email).filter(Boolean);
                        contactsForm.setValue('contacts', contactEmails);
                        const validContacts = contactEmails.filter((c: string) => c && c.includes('@'));
                        setConfiguredContacts(validContacts.length);
                        setContactsSetup(validContacts.length === 3);
                    } else {
                        contactsForm.setValue('contacts', ['', '', '']);
                        setConfiguredContacts(0);
                        setContactsSetup(false);
                    }
                    return { success: true, type: 'contacts' as const };
                } catch (error) {
                    contactsForm.setValue('contacts', ['', '', '']);
                    setConfiguredContacts(0);
                    setContactsSetup(false);
                    return { success: false, type: 'contacts' as const, error };
                }
            })(),

            // Recovery status
            (async () => {
                try {
                    const data = await checkRecoveryStatusAPI();

                    // Map backend response to frontend state
                    if (data.status === 'no_request') {
                        setRecoveryRequestStatus('none');
                        setApprovedShards([]);
                    } else if (data.status === 'pending') {
                        setRecoveryRequestStatus('pending');
                        // Use real approvedCount from backend
                        const approvedCount = data.approvedCount || 0;
                        const requiredFromBackend = data.requiredCount || 2;
                        setRequiredCount(requiredFromBackend);
                        // Create array of approved shard indices based on real count
                        // For display purposes, we'll show which shard indices are approved
                        // Assuming shards are numbered 1, 2, 3
                        const approvedShardIndices = approvedCount > 0 ?
                            Array.from({ length: approvedCount }, (_, i) => i + 1) :
                            [];
                        setApprovedShards(approvedShardIndices);
                    } else if (data.status === 'complete') {
                        setRecoveryRequestStatus('complete');
                        // For complete status, show all 3 shards as approved
                        setApprovedShards([1, 2, 3]);
                    } else if (data.status === 'expired') {
                        setRecoveryRequestStatus('expired');
                        setApprovedShards([]);
                    }

                    return { success: true, type: 'recovery' as const };
                } catch (error) {
                    setRecoveryRequestStatus('none');
                    setApprovedShards([]);
                    return { success: false, type: 'recovery' as const, error };
                }
            })()
        ]);
        setRecoveryStatusLoading(false);
    };

    const handleUpdateProfile = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: data.fullName }
            });

            if (error) throw error;
            toaster.create({ title: "Profile updated successfully", type: "success" });
        } catch (error) {
            const err = error as { message?: string };
            toaster.create({ title: err.message || "Failed to update profile", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveContacts = async (data: TrustedContactsFormValues) => {
        const contacts = data.contacts ?? [];
        const lowerContacts = contacts.map(c => c.toLowerCase());
        const userEmail = user?.email?.toLowerCase();

        if (userEmail && lowerContacts.includes(userEmail)) {
            toaster.create({ title: "You cannot add yourself as a trusted contact", type: "error" });
            return;
        }

        setContactsLoading(true);
        try {
            // Generate a new recovery key for this setup
            const recoveryKey = generateRecoveryKey();

            // Split the recovery key using Shamir's Secret Sharing (2-of-3)
            const shares = splitSecret(recoveryKey, 2, 3);

            // Prepare contacts for API with real key shards
            const contactsWithShards: TrustedContactPayload[] = (data.contacts || []).slice(0, 3).map((email: string, index: number) => ({
                email, // Use email as per standardized interface
                keyShard: shares[index], // Real Shamir shard
                shardIndex: index + 1
            }));

            // Call API to setup trusted contacts
            await setupTrustedContactsAPI(contactsWithShards);

            // Update local state
            const validContacts = (data.contacts || []).filter((c: string) => c.includes('@'));
            setConfiguredContacts(validContacts.length);
            setContactsSetup(validContacts.length === 3);

            // Show success with the recovery key for the user to save securely
            // The recovery key is NOT stored by the app - user must save it themselves
            toaster.create({
                title: "Trusted contacts configured successfully",
                description: `Your recovery key: ${recoveryKey}. Copy and store it securely - this is the only time it will be shown.`,
                type: "success",
                duration: 15000, // Longer duration so user can copy
            });
            onClose();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string, error?: string } }, message?: string };

            // Handle specific backend validation errors
            let errorMessage = "Failed to setup trusted contacts";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            if (errorMessage.includes('already set up')) {
                errorMessage = "Trusted contacts are already configured. Use Manage to update them.";
            }

            toaster.create({
                title: errorMessage,
                type: "error"
            });
        } finally {
            setContactsLoading(false);
        }
    };

    const getSecurityStatusColor = (isConfigured: boolean) => {
        return isConfigured ? "green" : "yellow";
    };

    const getSecurityStatusIcon = (isConfigured: boolean) => {
        return isConfigured ? <LuCheck /> : <LuTriangle />;
    };

    if (!user) return null;

    return (
        <Box minH="100vh" bg="transparent" overflowX="hidden">
            <Container maxW="container.md" py={{ base: 6, md: 12 }} px={{ base: 4, md: 6 }}>
                <VStack align="stretch" spaceY={10}>
                    <Box>
                        <BlurText
                            text="Personalize your"
                            delay={50}
                            className="text-xl font-medium mb-2"
                            color="fg.muted"
                        />
                        <Heading size={{ base: "4xl", md: "5xl" }} fontWeight="black" color="fg.primary" letterSpacing="tighter">
                            Security <Box as="span" color="brand.400">Settings</Box>
                        </Heading>
                    </Box>

                    <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)} variant="plain" colorPalette="brand">
                        <Tabs.List bg="bg.surface" w="full" display="flex" p={1} rounded="2xl" border="1px solid" borderColor="border.subtle" mb={8} overflowX="auto" whiteSpace="nowrap" css={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            <Tabs.Trigger value="account" flex={1} display="flex" justifyContent="center" gap={2} px={4} py={2} rounded="xl" _selected={{ bg: "bg.subtle", color: "fg.primary", shadow: "sm" }} color="fg.muted">
                                <LuUser /> Account
                            </Tabs.Trigger>
                            <Tabs.Trigger value="security" flex={1} display="flex" justifyContent="center" gap={2} px={4} py={2} rounded="xl" _selected={{ bg: "bg.subtle", color: "fg.primary", shadow: "sm" }} color="fg.muted">
                                <LuLock /> Security
                            </Tabs.Trigger>
                            <Tabs.Trigger value="billing" flex={1} display="flex" justifyContent="center" gap={2} px={4} py={2} rounded="xl" _selected={{ bg: "bg.subtle", color: "fg.primary", shadow: "sm" }} color="fg.muted">
                                <LuCreditCard /> Billing
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="account">
                            <Box
                                rounded={{ base: "2xl", md: "3xl" }}
                                p={{ base: 6, md: 8 }}
                                w="full"
                                bg={surfaceBg}
                                border="1px solid"
                                borderColor={borderSubtle}
                            >
                                <VStack align="stretch" spaceY={6}>
                                    <Heading size="md" color="fg.primary" fontWeight="bold">Profile Information</Heading>
                                    <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)}>
                                        <VStack align="stretch" spaceY={4}>
                                            <Box>
                                                <Text fontSize="xs" fontWeight="black" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={2}>Full Name</Text>
                                                <Input
                                                    {...profileForm.register('fullName')}
                                                    variant="subtle"
                                                    bg="bg.subtle"
                                                    border="1px solid"
                                                    borderColor={profileForm.formState.errors.fullName ? "red.500" : "border.subtle"}
                                                    rounded="xl"
                                                    color="fg.primary"
                                                />
                                                {profileForm.formState.errors.fullName && (
                                                    <Text fontSize="xs" color="red.400" mt={1}>
                                                        {profileForm.formState.errors.fullName.message}
                                                    </Text>
                                                )}
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" fontWeight="black" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={2}>Email Address</Text>
                                                <Input defaultValue={user.email} disabled variant="subtle" bg="bg.subtle" border="1px solid" borderColor="border.subtle" rounded="xl" opacity={0.6} color="fg.muted" />
                                            </Box>
                                        </VStack>
                                        <Button
                                            type="submit"
                                            colorPalette="blue"
                                            size="lg"
                                            rounded="xl"
                                            mt={4}
                                            disabled={loading || !profileForm.formState.isValid}
                                        >
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </form>
                                </VStack>
                            </Box>
                        </Tabs.Content>

                        <Tabs.Content value="security">
                            <Box
                                rounded={{ base: "2xl", md: "3xl" }}
                                p={{ base: 6, md: 8 }}
                                w="full"
                                bg={surfaceBg}
                                border="1px solid"
                                borderColor={borderSubtle}
                            >
                                <VStack align="stretch" spaceY={6}>
                                    <Heading size="md" color="fg.primary" fontWeight="bold">Vault Access Status</Heading>

                                    <Box rounded="xl" bg={isUnlocked ? "green.500/10" : "orange.500/10"} p={{ base: 4, md: 5 }} border="1px solid" borderColor={isUnlocked ? "green.500/20" : "orange.500/20"}>
                                        <Flex align={{ base: "start", md: "center" }} gap={{ base: 3, md: 4 }} direction={{ base: "column", md: "row" }}>
                                            <Box
                                                p={2}
                                                rounded="full"
                                                bg={isUnlocked ? "green.500" : "orange.500"}
                                                color="white"
                                            >
                                                {isUnlocked ? <LuLockOpen size={20} /> : <LuLock size={20} />}
                                            </Box>
                                            <VStack align="start" gap={1} flex={1}>
                                                <Text fontWeight="bold" color={isUnlocked ? "green.500" : "orange.500"}>
                                                    {isUnlocked ? "Vault Unlocked" : "Vault Locked"}
                                                </Text>
                                                <Text fontSize="sm" color="fg.muted">
                                                    {isUnlocked
                                                        ? "Your Master Encryption Key is active in memory. You can access your passwords."
                                                        : "Unlock your vault to access your secured data."}
                                                </Text>
                                            </VStack>
                                            {!isUnlocked && (
                                                <Box w={{ base: "full", md: "auto" }} mt={{ base: 2, md: 0 }}>
                                                    <Link to="/unlock-vault" style={{ display: "block" }}>
                                                        <Button size="sm" colorPalette="blue" variant="solid" w={{ base: "full", md: "auto" }}>
                                                            Unlock Now
                                                        </Button>
                                                    </Link>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    <Box>
                                        <TwoFactorSetup />
                                    </Box>

                                    <Separator my={4} borderColor="border.subtle" />

                                    <Box>
                                        <PasskeySettings />
                                    </Box>

                                    <Separator my={4} borderColor="border.subtle" />

                                    <Heading size="sm" color="fg.primary" fontWeight="bold">Recovery System</Heading>

                                    {recoveryStatusLoading ? (
                                        <Flex justify="center" py={8}>
                                            <Spinner color="green.400" />
                                        </Flex>
                                    ) : (
                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                            {/* Master Password Status */}
                                            <Box
                                                rounded="2xl"
                                                p={4}
                                                bg="bg.subtle"
                                                border="1px solid"
                                                borderColor={borderSubtle}
                                            >
                                                <HStack justify="space-between">
                                                    <VStack align="start" spaceY={1}>
                                                        <HStack spaceY={2}>
                                                            <Badge
                                                                colorPalette={getSecurityStatusColor(masterPasswordSetup)}
                                                                variant="solid"
                                                                rounded="full"
                                                                size="sm"
                                                            >
                                                                {getSecurityStatusIcon(masterPasswordSetup)}
                                                            </Badge>
                                                            <Text fontWeight="bold" color="fg.primary">Master Password Recovery</Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="fg.muted">
                                                            {masterPasswordSetup
                                                                ? "✅ Configured with recovery options"
                                                                : "⚠️ Not configured - vulnerable to data loss"}
                                                        </Text>
                                                    </VStack>
                                                    {!masterPasswordSetup ? (
                                                        <Link to="/setup-master">
                                                            <Button size="sm" variant="subtle" colorPalette="blue">
                                                                <LuPlus /> Setup
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Link to="/recovery">
                                                            <Button size="sm" variant="subtle" color="fg.muted" _hover={{ color: "fg.primary", bg: "bg.subtle" }}>
                                                                View Options
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </HStack>
                                            </Box>

                                            {/* Trusted Contacts Status */}
                                            <Box
                                                rounded="2xl"
                                                p={4}
                                                bg="bg.subtle"
                                                border="1px solid"
                                                borderColor={borderSubtle}
                                            >
                                                <HStack justify="space-between" align="start">
                                                    <VStack align="start" spaceY={1} flex={1}>
                                                        <HStack spaceY={2}>
                                                            <Badge
                                                                colorPalette={getSecurityStatusColor(contactsSetup)}
                                                                variant="solid"
                                                                rounded="full"
                                                                size="sm"
                                                            >
                                                                {getSecurityStatusIcon(contactsSetup)}
                                                            </Badge>
                                                            <Text fontWeight="bold" color="fg.primary">Trusted Contacts</Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="fg.muted">
                                                            {contactsSetup
                                                                ? "✅ 3 contacts configured"
                                                                : `⚠️ ${configuredContacts}/3 contacts configured`}
                                                        </Text>
                                                    </VStack>
                                                    <Button size="sm" variant="subtle" colorPalette="blue" onClick={onOpen}>
                                                        <LuUsers /> {contactsSetup ? "Manage" : "Setup"}
                                                    </Button>
                                                </HStack>
                                            </Box>

                                            {/* Recovery Request Status */}
                                            {recoveryRequestStatus !== 'none' && (
                                                <Box
                                                    rounded="2xl"
                                                    p={4}
                                                    bg="bg.subtle"
                                                    border="1px solid"
                                                    borderColor={borderSubtle}
                                                >
                                                    <VStack align="start" spaceY={1}>
                                                        <HStack spaceY={2}>
                                                            <Badge
                                                                colorPalette={
                                                                    recoveryRequestStatus === 'complete' ? 'green' :
                                                                        recoveryRequestStatus === 'pending' ? 'yellow' : 'red'
                                                                }
                                                                variant="solid"
                                                                rounded="full"
                                                                size="sm"
                                                            >
                                                                {recoveryRequestStatus === 'complete' ? '✓' :
                                                                    recoveryRequestStatus === 'pending' ? '⏳' : '✗'}
                                                            </Badge>
                                                            <Text fontWeight="bold" color="fg.primary">Recovery Request</Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="fg.muted">
                                                            {recoveryRequestStatus === 'complete'
                                                                ? 'Recovery completed successfully'
                                                                : recoveryRequestStatus === 'pending'
                                                                    ? `${approvedShards.length}/${requiredCount} contacts approved`
                                                                    : 'Recovery request expired'
                                                            }
                                                        </Text>
                                                        {recoveryRequestStatus === 'pending' && approvedShards.length > 0 && (
                                                            <Text fontSize="xs" color="fg.muted">
                                                                Approved contacts: {approvedShards.join(', ')}
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </Box>
                                            )}

                                            {/* Recovery Key Status */}
                                            <Box
                                                rounded="2xl"
                                                p={4}
                                                bg="bg.subtle"
                                                border="1px solid"
                                                borderColor={borderSubtle}
                                            >
                                                <HStack justify="space-between">
                                                    <VStack align="start" spaceY={1}>
                                                        <HStack spaceY={2}>
                                                            <Badge
                                                                colorPalette={getSecurityStatusColor(masterPasswordSetup)}
                                                                variant="solid"
                                                                rounded="full"
                                                                size="sm"
                                                            >
                                                                <LuKey />
                                                            </Badge>
                                                            <Text fontWeight="bold" color="fg.primary">Recovery Key</Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="fg.muted">
                                                            {masterPasswordSetup
                                                                ? "✅ Generated and secured"
                                                                : "⚠️ Not generated"}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </Box>
                                        </SimpleGrid>
                                    )}
                                </VStack>
                            </Box>
                        </Tabs.Content>

                        <Tabs.Content value="billing">
                            <Billing />
                        </Tabs.Content>
                    </Tabs.Root>
                </VStack >
            </Container >

            {/* Trusted Contacts Management Dialog */}
            < DialogRoot open={open} onOpenChange={() => onClose()}>
                <DialogContent bg="bg.elevated" border="1px solid" borderColor="border.subtle">
                    <DialogHeader>
                        <DialogTitle color="fg.primary">Manage Trusted Contacts</DialogTitle>
                        <DialogCloseTrigger color="fg.muted" />
                    </DialogHeader>
                    <form onSubmit={contactsForm.handleSubmit(handleSaveContacts)}>
                        <DialogBody>
                            <VStack align="stretch" spaceY={4}>
                                <Text color="fg.muted" fontSize="sm">
                                    Add 3 trusted friends or family members. If you lose access, any 2 of them can approve a recovery request.
                                </Text>
                                {Array.from({ length: 3 }, (_, i) => (
                                    <Box key={i}>
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb={2}>
                                            Contact {i + 1}
                                        </Text>
                                        <Input
                                            {...contactsForm.register(`contacts.${i}`)}
                                            placeholder={`Enter email address`}
                                            bg="bg.subtle"
                                            border="1px solid"
                                            borderColor={contactsForm.formState.errors.contacts?.[i] ? "red.500" : "border.subtle"}
                                            color="fg.primary"
                                        />
                                        {contactsForm.formState.errors.contacts?.[i] && (
                                            <Text fontSize="xs" color="red.400" mt={1}>
                                                {contactsForm.formState.errors.contacts[i]?.message}
                                            </Text>
                                        )}
                                    </Box>
                                ))}
                                {contactsForm.formState.errors.contacts && (
                                    <Text fontSize="xs" color="red.400" mt={2}>
                                        {contactsForm.formState.errors.contacts.message}
                                    </Text>
                                )}
                            </VStack>
                        </DialogBody>
                        <DialogFooter>
                            <HStack spaceX={3}>
                                <Button variant="subtle" onClick={onClose} disabled={contactsLoading}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    colorPalette="blue"
                                    disabled={contactsLoading || !contactsForm.formState.isValid}
                                >
                                    {contactsLoading ? <Spinner size="sm" /> : "Save Contacts"}
                                </Button>
                            </HStack>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </DialogRoot >
        </Box >
    );
};

export default Settings;
