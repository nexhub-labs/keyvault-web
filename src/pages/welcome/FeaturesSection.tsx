import React from "react";
import { Box, Flex, Grid, Heading, Text, VStack } from "@chakra-ui/react";
import { motion } from "motion/react";
import { features } from "../../utils/data";
import { LuLock, LuKey, LuSmartphone, LuSmile } from "react-icons/lu";

const featureIcons = [LuLock, LuKey, LuSmartphone, LuSmile];

// Chakra + Motion Integration
const MotionBox = motion.create(Box);
const MotionHeading = motion.create(Heading);

const FeaturesSection: React.FC = () => {
    return (
        <Flex as="section" direction="column" py={20} px={{ base: 6, lg: 12 }} position="relative">
            <VStack gap={4} textAlign="center" mb={16}>
                <Text
                    fontSize="sm"
                    fontWeight="black"
                    color="brand.500"
                    letterSpacing="widest"
                    textTransform="uppercase"
                >
                    Built for your security
                </Text>
                <MotionHeading
                    fontSize={{ base: "4xl", md: "5xl" }}
                    fontWeight="black"
                    letterSpacing="tight"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    color="fg.primary"
                >
                    Key Features
                </MotionHeading>
                <Text color="fg.muted" fontSize="lg" maxW="2xl">
                    Experience the next generation of password management with features designed to keep your digital life safe and seamless.
                </Text>
            </VStack>

            <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
                gap={8}
            >
                {features.map((feature, index) => {
                    const Icon = featureIcons[index % featureIcons.length];
                    return (
                        <MotionBox
                            key={index}
                            p={8}
                            borderRadius="2xl"
                            bg="bg.surface"
                            border="1px solid"
                            borderColor="border.subtle"
                            shadow="sm"
                            backdropFilter="blur(10px)"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            _hover={{
                                transform: "translateY(-12px)",
                                borderColor: "brand.300",
                                shadow: "0 22px 40px -20px var(--chakra-colors-brand-500-20)",
                                bg: "bg.muted"
                            }}
                            className="group"
                        >
                            <MotionBox
                                p={3}
                                bg="brand.500/10"
                                color="brand.500"
                                rounded="xl"
                                w="fit-content"
                                mb={6}
                                shadow="0 8px 15px -3px var(--chakra-colors-brand-500-20)"
                                _groupHover={{
                                    transform: "rotate(10deg) scale(1.1)",
                                    bg: "brand.500/20",
                                    color: "brand.600"
                                }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <Icon size={24} />
                            </MotionBox>
                            <Heading fontSize="xl" fontWeight="black" mb={4} color="fg.primary">
                                {feature.title}
                            </Heading>
                            <Text color="fg.muted" lineHeight="tall" fontWeight="medium">
                                {feature.description}
                            </Text>
                        </MotionBox>
                    );
                })}
            </Grid>
        </Flex >
    );
};

export default FeaturesSection;