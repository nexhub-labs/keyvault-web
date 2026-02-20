import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { IconButton } from "@chakra-ui/react";
import { LuArrowUp } from "react-icons/lu";
import { motion, AnimatePresence } from "motion/react";

interface ScrollToTopProps {
    disallowedRoutes?: string[];
}

const ScrollToTop = ({ disallowedRoutes = [] }: ScrollToTopProps) => {
    const { pathname } = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Track scroll position for button visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const isDisallowed = disallowedRoutes.includes(pathname);

    return (
        <AnimatePresence>
            {isVisible && !isDisallowed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: "fixed",
                        bottom: "30px",
                        right: "30px",
                        zIndex: 1000,
                    }}
                >
                    <IconButton
                        aria-label="Back to top"
                        onClick={scrollToTop}
                        size="lg"
                        rounded="full"
                        bg="brand.500"
                        color="white"
                        shadow="xl"
                        _hover={{
                            bg: "brand.600",
                            transform: "translateY(-4px)",
                            shadow: "2xl",
                        }}
                        transition="all 0.2s"
                    >
                        <LuArrowUp size={24} />
                    </IconButton>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;
