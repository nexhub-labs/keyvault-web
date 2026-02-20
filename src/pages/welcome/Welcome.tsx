import { Box } from "@chakra-ui/react";
import TestimonialsSection from "./TestimonialsSection";
import CallToActionSection from "./CallToActionSection";
import FAQ from "./FAQ";
import HeroSection from "./HeroSection";
// import { FeaturesSection } from "./FeaturesSection";

const Welcome = () => {
    return (
        <>
            <Box bg="bg.surface">
                <HeroSection />
                {/* <FeaturesSection /> */}
                <TestimonialsSection />
                <CallToActionSection />
                <FAQ />
            </Box>
        </>
    );
};

export default Welcome;