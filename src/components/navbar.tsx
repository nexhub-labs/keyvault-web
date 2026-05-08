import { forwardRef, useState } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    IconButton,
    Image,
    Separator,
    Stack,
    Avatar,
    Text,
    Container,
    Portal,
} from "@chakra-ui/react";
import {
    // LuMoon, LuSun, 
    LuMenu,
    LuX,
    LuUser,
    LuLogOut,
    LuSettings,
    LuKeyRound,
    LuGithub,
    LuComponent,
} from "react-icons/lu";
// import { useColorMode, useColorModeValue } from "./ui/color-mode";
import { Link, useNavigate, useLocation } from "react-router";
import { supabase } from "../utils/supabase";
import { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import { useVaultContext } from "../context/VaultContext";
import {
    MenuContent,
    MenuItem,
    MenuTrigger,
    MenuRoot,
    MenuSeparator,
} from "./ui/menu";
import { motion, AnimatePresence } from "motion/react";
import { AuthButton } from "./ui/AuthButton";

// SignInStatus component now forwards its ref as HTMLDivElement.
interface SignInStatusProps {
    user: User | null;
}

const SignInStatus = forwardRef<HTMLDivElement, SignInStatusProps>(({ user }, ref) => {
    const navigate = useNavigate();

    const { clearSession } = useVaultContext();

    const logout = async () => {
        clearSession();
        await supabase.auth.signOut();
        navigate('/');
    };

    if (user) {
        return (
            <Box ref={ref}>
                <MenuRoot positioning={{ placement: "bottom-end" }}>
                    <MenuTrigger asChild>
                        <Button variant="ghost" size="sm" rounded="full" px={0} _hover={{ bg: "transparent" }}>
                            <Avatar.Root size="sm" variant="solid" colorPalette="blue">
                                <Avatar.Image src={user.user_metadata?.avatar_url} />
                                <Avatar.Fallback children={user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'} />
                            </Avatar.Root>
                        </Button>
                    </MenuTrigger>
                    <MenuContent portalled={false} fontSize={"sm"} minW="220px" rounded="2xl" shadow="2xl" border="1px solid" borderColor="border.subtle" bg="bg.subtle" p={2}>
                        <Box px={4} py={3}>
                            <Text fontWeight="black" color="fg.primary" letterSpacing="tight" truncate>{user.user_metadata?.full_name}</Text>
                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" truncate>{user.email}</Text>
                        </Box>
                        <MenuSeparator />
                        <Link to="/dashboard">
                            <MenuItem value="dashboard" cursor="pointer" gap={2}>
                                <LuUser /> Dashboard
                            </MenuItem>
                        </Link>
                        <Link to="/vault">
                            <MenuItem value="vault" cursor="pointer" gap={2}>
                                <LuKeyRound /> My Vault
                            </MenuItem>
                        </Link>
                        <Link to="/settings">
                            <MenuItem value="settings" cursor="pointer" gap={2}>
                                <LuSettings /> Settings
                            </MenuItem>
                        </Link>
                        <MenuSeparator />
                        <MenuItem value="logout" color="red.400" onClick={logout} cursor="pointer" gap={2}>
                            <LuLogOut /> Logout
                        </MenuItem>
                    </MenuContent>
                </MenuRoot>
            </Box>
        );
    }
    return (
        <Box ref={ref}>
            <Link to="/login">
                <AuthButton variant="primary" size="sm" rounded="full" px={6} fontWeight="bold">
                    Get Started <LuComponent />
                </AuthButton>
            </Link>
        </Box>
    );
});
SignInStatus.displayName = "SignInStatus";

// export const ColorModeToggle = () => {
//     const { toggleColorMode } = useColorMode();
//     return (
//         <IconButton
//             aria-label="Toggle Color Mode"
//             children={useColorModeValue(<LuSun />, <LuMoon />)}
//             onClick={toggleColorMode}
//             rounded="full"
//             width="fit"
//             size="sm"
//             variant="ghost"
//             color="fg.muted"
//             _hover={{ transform: "rotate(180deg)", color: "fg.primary", bg: "bg.subtle" }}
//             transition="all 0.3s ease"
//         />
//     );
// };

const DesktopMenu = ({ menuItems, user, currentPath }: { menuItems: { label: string; path: string; }[]; user: User | null; currentPath: string; }) => (
    <HStack gap={6} display={{ base: "none", md: "flex" }}>
        {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
                <Link to={item.path} key={item.label}>
                    <Button
                        variant="ghost"
                        color={isActive ? "brand.400" : "fg.muted"}
                        bg={isActive ? "brand.500/10" : "transparent"}
                        _hover={{
                            color: isActive ? "brand.400" : "fg.primary",
                            bg: isActive ? "brand.500/10" : "bg.subtle",
                            transform: "translateY(-1px)"
                        }}
                        rounded="full"
                        size="sm"
                        fontWeight={isActive ? "bold" : "medium"}
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    >
                        {item.label}
                    </Button>
                </Link>
            );
        })}
        <Separator orientation="vertical" h={5} borderColor="border.subtle" />
        <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            rounded="full"
            _hover={{ color: "fg.primary", bg: "bg.subtle" }}
            asChild
        >
            <a href="https://github.com/alphadevking/keyvault" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
                <LuGithub />
            </a>
        </IconButton>
        {/* <ColorModeToggle /> */}
        <SignInStatus user={user} />
    </HStack>
);

const MobileMenu = ({ menuItems, user, currentPath, isOpen, onClose }: { menuItems: { label: string; path: string; }[]; user: User | null; currentPath: string; isOpen: boolean; onClose: () => void; }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <Portal>
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="bg.canvas/80"
                        backdropFilter="blur(4px)"
                        zIndex="1500"
                        onClick={onClose}
                    />
                    <Box
                        position="fixed"
                        top="80px"
                        left="50%"
                        transform="translateX(-50%)"
                        zIndex="1600"
                        w="calc(100% - 32px)"
                        maxW="lg"
                        mx="auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <Box
                                bg="bg.surface/90"
                                backdropFilter="blur(20px)"
                                rounded="3xl"
                                shadow="2xl"
                                border="1px solid"
                                borderColor="border.subtle"
                                p={4}
                                overflow="hidden"
                            >
                                <Stack align="stretch" gap={2}>
                                    {menuItems.map((item) => {
                                        const isActive = currentPath === item.path;
                                        return (
                                            <Link to={item.path} key={item.label} onClick={onClose}>
                                                <Button
                                                    variant="ghost"
                                                    width="full"
                                                    justifyContent="flex-start"
                                                    color={isActive ? "brand.400" : "fg.muted"}
                                                    bg={isActive ? "brand.500/10" : "transparent"}
                                                    _hover={{ color: "fg.primary", bg: "bg.subtle" }}
                                                    rounded="xl"
                                                >
                                                    {item.label}
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                    <Separator borderColor="border.subtle" my={2} />
                                    <Box pt={2}>
                                        <SignInStatus user={user} />
                                    </Box>
                                </Stack>
                            </Box>
                        </motion.div>
                    </Box>
                </Portal>
            )}
        </AnimatePresence>
    );
};

export const Navbar = () => {
    const { session } = useAuth();
    const user = session?.user ?? null;
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { label: "Generator", path: "/generator" },
        { label: "Pricing", path: "/pricing" },
        ...(user ? [
            { label: "Teams", path: "/teams" },
        ] : []),
    ];

    return (
        <Container
            as="nav"
            maxW="fit-content"
            minW={{ base: "calc(100% - 32px)", md: "800px" }}
            p={2.5}
            bg="bg.surface/70"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="border.primary"
            mx="auto"
            rounded="full"
            shadow="xl"
            transition="all 0.3s ease-in-out"
            _hover={{ shadow: "2xl", transform: "translateY(-1px)" }}
        >
            <Flex
                justify="space-between"
                align="center"
            >
                <Link to="/">
                    <Flex direction="row" justify="center" align="center" gap={2}>
                        <Image src="/kv_outline.svg" alt="Logo" boxSize={8} objectFit="contain" />
                        <Heading size="lg" as="h1" fontWeight="bold" color="fg.primary" letterSpacing="tight">
                            Key<Box as="span" color="brand.400">Vault</Box>
                        </Heading>
                    </Flex>
                </Link>
                <DesktopMenu menuItems={menuItems} user={user} currentPath={location.pathname} />
                <IconButton
                    aria-label="Open Menu"
                    display={{ base: "flex", md: "none" }}
                    variant="ghost"
                    size="md"
                    color="fg.muted"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <LuX /> : <LuMenu />}
                </IconButton>
                <MobileMenu
                    menuItems={menuItems}
                    user={user}
                    currentPath={location.pathname}
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />
            </Flex>
        </Container>
    );
};
