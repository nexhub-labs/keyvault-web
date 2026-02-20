import React from "react";
import { Flex, Heading, Text, VStack, Box } from "@chakra-ui/react";
import { motion } from "motion/react";
import { LuArrowRight } from "react-icons/lu";
import { Link } from "react-router";
import AppButton from "../../components/ui/AppButton";

// Chakra + Motion Integration
const MotionHeading = motion.create(Heading);
const MotionText = motion.create(Text);
const MotionBox = motion.create(Box);

const CallToActionSection: React.FC = () => {
    return (
        <Box as="section" py={{ base: 12, md: 20 }} px={{ base: 6, md: 12 }} position="relative" overflow="hidden">
            {/* Mesh Gradient Background Elements */}
            <MotionBox
                position="absolute"
                top="10%"
                right="5%"
                w={{ base: "300px", md: "500px" }}
                h={{ base: "300px", md: "500px" }}
                bgGradient="radial(brand.500/10, transparent 70%)"
                filter="blur(80px)"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                zIndex={0}
                pointerEvents="none"
            />
            <MotionBox
                position="absolute"
                bottom="0%"
                left="10%"
                w={{ base: "250px", md: "400px" }}
                h={{ base: "250px", md: "400px" }}
                bgGradient="radial(brand.600/10, transparent 70%)"
                filter="blur(60px)"
                animate={{
                    x: [0, -40, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                zIndex={0}
                pointerEvents="none"
            />

            {/* Glassmorphism Container */}
            <Flex
                direction="column"
                align="center"
                justify="center"
                position="relative"
                zIndex={1}
                bg="bg.surface/40"
                backdropFilter="blur(12px)"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="3xl"
                py={{ base: 16, md: 20 }}
                px={{ base: 8, md: 16 }}
                maxW="5xl"
                mx="auto"
                shadow="2xl"
            >
                <VStack gap={8} align="center" textAlign="center" maxW="3xl">
                    <MotionHeading
                        fontSize={{ base: "4xl", md: "6xl" }}
                        fontWeight="black"
                        letterSpacing="tighter"
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.8 }}
                        color="fg.primary"
                        lineHeight="1.1"
                        className="font-faustina"
                    >
                        Ready for <Box as="span" color="brand.500">Unshakeable</Box> Security?
                    </MotionHeading>

                    <MotionText
                        fontSize={{ base: "lg", md: "xl" }}
                        color="fg.muted"
                        fontWeight="medium"
                        lineHeight="tall"
                        maxW="2xl"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Join thousands of users who trust KeyVault to protect their digital legacy.
                        Experience security that feels as good as it looks.
                    </MotionText>

                    <Link to={"/generator"} className="w-fit">
                        <AppButton
                            px={12}
                            py={7}
                            fontSize="md"
                            fontWeight="black"
                            letterSpacing="widest"
                            textTransform="uppercase"
                            bg="brand.500"
                            color="white"
                            rounded="full"
                            _hover={{
                                bg: "brand.600",
                                transform: "translateY(-4px)",
                                shadow: "0 20px 40px -10px var(--chakra-colors-brand-500-40)",
                            }}
                        >
                            Get Started for Free <LuArrowRight style={{ marginLeft: "10px" }} />
                        </AppButton>
                    </Link>
                </VStack>
            </Flex>
        </Box>
    );
};

export default CallToActionSection;
