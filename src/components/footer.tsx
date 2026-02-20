import { Box, Container, Flex, Stack, Text, Image, Heading, Grid, HStack } from "@chakra-ui/react";
import { Link } from "react-router";
import { FaGithubAlt, FaInstagram, FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { GooglePlay } from "../assets";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { useSystemStatus } from "../hooks/useSystemStatus";

const MotionBox = motion.create(Box);
const MotionStack = motion.create(Stack);

const footerLinks = [
    {
        title: "Product",
        links: [
            { label: "Password generator", href: "/generator" },
            { label: "Dashboard", href: "/dashboard", auth: true },
            { label: "Environment variables", href: "/environment", auth: true },
            { label: "Security settings", href: "/settings", auth: true },
            { label: "Pricing", href: "/pricing" },
        ]
    },
    {
        title: "Resources",
        links: [
            { label: "About us", href: "/about" },
            { label: "Terms of service", href: "/terms" },
            { label: "Privacy policy", href: "/privacy" },
            { label: "System status", href: "/status" },
        ]
    }
];

const socialLinks = [
    { icon: FaXTwitter, label: "Twitter", href: "https://twitter.com/NexhubLabs" },
    { icon: FaGithubAlt, label: "GitHub", href: "https://github.com/nexhub-labs" },
    { icon: FaLinkedinIn, label: "LinkedIn", href: "https://www.linkedin.com/company/nexhub-labs" },
    { icon: FaInstagram, label: "Instagram", href: "https://www.instagram.com/nexhublabs" }
];

const Footer = () => {
    const { session } = useAuth();
    const user = session?.user;
    const { version, status } = useSystemStatus();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <MotionBox
            as="footer"
            pt={32}
            pb={20}
            bg="bg.canvas"
            borderTop="1px solid"
            borderColor="border.subtle"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
        >
            <Container maxW={"container.xl"}>
                <Grid
                    templateColumns={{ base: "1fr", lg: "2.5fr 1fr 1fr 1.5fr" }}
                    gap={{ base: 16, lg: 8 }}
                    mb={24}
                >
                    {/* Brand section */}
                    <MotionStack gap={8} variants={itemVariants}>
                        <Link to="/">
                            <Flex align="center" gap={3}>
                                <Image src="/kv_outline.svg" alt="logo" boxSize={8} objectFit="contain" />
                                <Heading size="xl" fontWeight="bold" color="fg.primary" letterSpacing="tighter">
                                    Key<Box as="span" color="brand.500">Vault</Box>
                                </Heading>
                            </Flex>
                        </Link>
                        <Text color="fg.muted" lineHeight="relaxed" maxW="320px" fontSize="sm">
                            The world's most trusted open-source password manager. Secure, simple, and always within reach. Built for the modern security-conscious user.
                        </Text>
                        <HStack gap={3}>
                            {socialLinks.map((social) => (
                                <Link key={social.label} to={social.href} target="_blank" rel="noopener noreferrer">
                                    <MotionBox
                                        whileHover={{ y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                        p={2.5}
                                        rounded="full"
                                        bg="bg.muted"
                                        color="fg.muted"
                                        _hover={{ color: "brand.500", bg: "brand.500/10" }}
                                        style={{ transition: "all 0.1s" }}
                                    >
                                        <social.icon fontSize="24px" />
                                    </MotionBox>
                                </Link>
                            ))}
                        </HStack>
                    </MotionStack>

                    {/* Navigation groups */}
                    {footerLinks.map((group) => (
                        <MotionStack key={group.title} gap={6} variants={itemVariants}>
                            <Text fontWeight="bold" fontSize="xs" color="fg.muted" letterSpacing="widest">
                                {group.title}
                            </Text>
                            <Stack gap={3}>
                                {group.links.filter(link => !link.auth || (link.auth && user)).map((link) => (
                                    <Link key={link.label} to={link.href}>
                                        <Text
                                            fontSize="sm"
                                            color="fg.muted"
                                            _hover={{ color: "brand.500", transform: "translateX(4px)" }}
                                            transition="all 0.2s"
                                        >
                                            {link.label}
                                        </Text>
                                    </Link>
                                ))}
                            </Stack>
                        </MotionStack>
                    ))}

                    {/* Apps section */}
                    <MotionStack gap={6} variants={itemVariants}>
                        <Text fontWeight="bold" fontSize="xs" color="fg.muted" letterSpacing="widest">
                            Mobile apps
                        </Text>
                        <Stack gap={4}>
                            <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link to="#" target="_blank">
                                    <Image
                                        rounded="xl"
                                        src={GooglePlay}
                                        alt="google play"
                                        width="140px"
                                        transition="filter 0.3s"
                                        _hover={{ filter: "brightness(1.1)" }}
                                    />
                                </Link>
                            </MotionBox>
                            <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link to="#" target="_blank">
                                    <Image
                                        rounded="xl"
                                        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                                        alt="app store"
                                        width="140px"
                                        transition="filter 0.3s"
                                        _hover={{ filter: "brightness(1.1)" }}
                                    />
                                </Link>
                            </MotionBox>
                        </Stack>
                    </MotionStack>
                </Grid>

                {/* Bottom section */}
                <MotionBox
                    pt={12}
                    borderTop="1px solid"
                    borderColor="border.subtle"
                    variants={itemVariants}
                >
                    <Flex
                        direction={{ base: "column", md: "row" }}
                        justify="space-between"
                        align={{ base: "start", md: "center" }}
                        gap={8}
                    >
                        <Stack gap={2}>
                            <Text fontSize="xs" color="fg.muted">
                                © {new Date().getFullYear()} Nexhub Labs. All rights reserved.
                            </Text>
                            <Text fontSize="2xs" color="fg.subtle" fontWeight="medium">
                                Zero-knowledge architecture. Built with security at its core.
                            </Text>
                        </Stack>

                        <HStack gap={6} wrap="wrap">
                            <Link to="/status">
                                <MotionBox
                                    whileHover={{ scale: 1.02 }}
                                    px={4}
                                    py={2}
                                    bg="bg.muted"
                                    rounded="full"
                                    border="1px solid"
                                    borderColor="border.subtle"
                                    _hover={{ borderColor: "brand.500/30" }}
                                    style={{ transition: "all 0.2s" }}
                                >
                                    <HStack gap={3}>
                                        <Box
                                            w={1.5}
                                            h={1.5}
                                            rounded="full"
                                            bg={status === "ok" ? "green.500" : status === "degraded" ? "orange.500" : "red.500"}
                                            boxShadow={status === "ok" ? "0 0 12px var(--chakra-colors-green-500)" : "none"}
                                        />
                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                                            System <Text as="span" color="fg.primary">
                                                {status === "ok" ? "Operational" : status === "degraded" ? "Degraded" : "Down"}
                                            </Text>
                                        </Text>
                                    </HStack>
                                </MotionBox>
                            </Link>
                            <Box px={3} py={1} bg="bg.muted" rounded="lg" border="1px solid" borderColor="border.subtle">
                                <Text fontSize="xs" color="fg.subtle" fontWeight="bold">{version}</Text>
                            </Box>
                        </HStack>
                    </Flex>
                </MotionBox>
            </Container>
        </MotionBox>
    );
};

export default Footer;