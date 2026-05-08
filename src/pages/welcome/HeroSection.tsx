import React from "react";
import { Box, Heading, Text, Flex, Container, HStack, VStack } from "@chakra-ui/react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { Link } from "react-router";
import ShinyText from "../../components/ShinyText/ShinyText";
import DeckCards from "../../components/DeckCards/DeckCards";
import { AppButton } from "../../components/ui/AppButton";

// ─── Motion primitives ────────────────────────────────────────────────────────

const MotionBox = motion.create(Box);

// ─── Stagger variants ─────────────────────────────────────────────────────────

const containerVariants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.11, delayChildren: 0.15 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const rightVariants = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.3 } },
};

// ─── Animated counter badge ───────────────────────────────────────────────────

const TrustBadge: React.FC = () => (
    <motion.div
        variants={itemVariants}
        style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
        <Box
            display="inline-flex"
            alignItems="center"
            gap="8px"
            px="14px"
            py="7px"
            borderRadius="full"
            border="1px solid"
            borderColor="rgba(34,197,94,0.25)"
            bg="rgba(34,197,94,0.07)"
            backdropFilter="blur(8px)"
        >
            {/* Live pulse dot */}
            <Box position="relative" w="7px" h="7px">
                <Box
                    position="absolute"
                    inset={0}
                    borderRadius="full"
                    bg="#22c55e"
                    boxShadow="0 0 6px #22c55e"
                />
                <MotionBox
                    position="absolute"
                    inset="-3px"
                    borderRadius="full"
                    border="1.5px solid #22c55e"
                    animate={{ scale: [1, 1.9, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
            </Box>
            <Text
                fontSize="0.68rem"
                fontWeight="600"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="#22c55e"
                fontFamily="'DM Mono', monospace"
            >
                Zero-Knowledge Security
            </Text>
        </Box>
    </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const HeroSection: React.FC = () => {
    // Subtle parallax on mouse move for the right panel
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rx = useSpring(useTransform(mouseY, [-300, 300], [4, -4]), { stiffness: 60, damping: 20 });
    const ry = useSpring(useTransform(mouseX, [-500, 500], [-6, 6]), { stiffness: 60, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <Box
            position="relative"
            overflow="hidden"
            minH="100vh"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Background layer ── */}
            <Box position="absolute" inset={0} zIndex={0} pointerEvents="none">

                {/* Noise texture */}
                <Box
                    position="absolute"
                    inset={0}
                    opacity={0.032}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Primary green glow — left */}
                <Box
                    position="absolute"
                    top="-20%"
                    left="-15%"
                    w="750px"
                    h="750px"
                    bg="radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 65%)"
                    filter="blur(80px)"
                />

                {/* Secondary glow — right bottom */}
                <Box
                    position="absolute"
                    bottom="-15%"
                    right="-10%"
                    w="600px"
                    h="600px"
                    bg="radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)"
                    filter="blur(100px)"
                />

                {/* Grid — masked to left side only */}
                <Box
                    position="absolute"
                    inset={0}
                    opacity={0.055}
                    style={{
                        backgroundImage: "linear-gradient(rgba(34,197,94,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.8) 1px, transparent 1px)",
                        backgroundSize: "52px 52px",
                        maskImage: "radial-gradient(ellipse 70% 80% at 20% 50%, black 0%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 20% 50%, black 0%, transparent 100%)",
                    }}
                />

                {/* Horizontal separator line */}
                <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    h="1px"
                    bg="linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)"
                />
            </Box>

            <Container maxW="container.xl" position="relative" zIndex={1} h="100%">
                <Flex
                    as="section"
                    direction={{ base: "column", lg: "row" }}
                    align="center"
                    justify="center"
                    gap={{ base: 16, lg: 8 }}
                    minH={{ base: "auto", lg: "calc(100vh - 100px)" }}
                    px={{ base: 5, md: 7, lg: 10 }}
                    py={{ base: 16, lg: 12 }}
                >
                    {/* ── Left column ── */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        style={{ flex: 1 }}
                    >
                        <VStack align="flex-start" gap={6}>

                            <TrustBadge />

                            {/* Headline */}
                            <motion.div variants={itemVariants} style={{ width: "100%" }}>
                                <Heading
                                    as="h1"
                                    fontSize={{ base: "3rem", md: "4rem", lg: "4.5rem" }}
                                    fontWeight="900"
                                    lineHeight="1.02"
                                    letterSpacing="-0.04em"
                                    fontFamily="'Raleway', sans-serif"
                                    color="bg.primary/70"
                                >
                                    Secure your{" "}
                                    <Box
                                        as="span"
                                        color="#22c55e"
                                        style={{
                                            textShadow: "0 0 40px rgba(34,197,94,0.4)",
                                        }}
                                    >
                                        digital life
                                    </Box>
                                    {" "}with{" "}
                                    <Box as="span" display="inline" verticalAlign="bottom">
                                        <ShinyText
                                            text="KeyVault."
                                            disabled={false}
                                            speed={3}
                                            className="shiny-brand"
                                        />
                                    </Box>
                                </Heading>
                            </motion.div>

                            {/* Subtext */}
                            <motion.div variants={itemVariants}>
                                <Text
                                    fontSize={{ base: "sm", lg: "md" }}
                                    color="rgba(200,215,205,0.65)"
                                    fontWeight="400"
                                    lineHeight="1.45"
                                    maxW="480px"
                                    fontFamily="'DM Mono', monospace"
                                >
                                    Generate, store, and manage passwords and passkeys in one
                                    encrypted vault. Your master password never leaves your device.
                                    Nobody but you can read your data.
                                </Text>
                            </motion.div>

                            {/* CTAs */}
                            <motion.div variants={itemVariants}>
                                <HStack gap={4} flexWrap="wrap">
                                    <Link to="/signup">
                                        <AppButton variant="primary">
                                            Get Started For Free
                                        </AppButton>
                                    </Link>
                                    <Link to="/pricing">
                                        <AppButton variant="outline">
                                            See Plans & Pricing
                                        </AppButton>
                                    </Link>
                                </HStack>
                            </motion.div>

                        </VStack>
                    </motion.div>

                    {/* ── Right column — DeckCards ── */}
                    <motion.div
                        variants={rightVariants}
                        initial="hidden"
                        animate="show"
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <MotionBox
                            style={{ rotateX: rx, rotateY: ry, perspective: "1000px" }}
                            position="relative"
                        >
                            {/* Outer glow ring */}
                            <Box
                                position="absolute"
                                inset="-2px"
                                borderRadius="24px"
                                border="1px solid"
                                borderColor="rgba(34,197,94,0.18)"
                                pointerEvents="none"
                                zIndex={2}
                            />

                            {/* Card frame */}
                            <Box
                                borderRadius="22px"
                                overflow="hidden"
                                bg="rgba(8,12,10,0.7)"
                                backdropFilter="blur(24px)"
                                border="1px solid rgba(34,197,94,0.1)"
                                p="10px"
                                position="relative"
                                placeItems="center"
                                gap={2}
                            >
                                {/* Top bar — like a browser chrome or app frame */}
                                <Flex
                                    align="center"
                                    gap="6px"
                                    px="10px"
                                    pb="10px"
                                    borderBottom="1px solid rgba(255,255,255,0.05)"
                                    mb="10px"
                                >
                                    {["#ff5f56", "#ffbd2e", "#27c93f"].map((c, i) => (
                                        <Box key={i} w="9px" h="9px" borderRadius="full" bg={c} opacity={0.7} />
                                    ))}
                                    <Box flex={1} />
                                    <Text
                                        fontFamily="'DM Mono', monospace"
                                        fontSize="0.55rem"
                                        letterSpacing="0.18em"
                                        color="rgba(255,255,255,0.2)"
                                        textTransform="uppercase"
                                    >
                                        keyvault core
                                    </Text>
                                    <Box flex={1} />
                                </Flex>

                                <DeckCards />
                            </Box>

                            {/* Bottom ambient blur glow */}
                            <Box
                                position="absolute"
                                bottom="-30px"
                                left="10%"
                                right="10%"
                                h="60px"
                                bg="#22c55e"
                                opacity={0.07}
                                filter="blur(30px)"
                                borderRadius="full"
                                zIndex={-1}
                                pointerEvents="none"
                            />
                        </MotionBox>
                    </motion.div>
                </Flex>
            </Container>
        </Box>
    );
};

export default HeroSection;