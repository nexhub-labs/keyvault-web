import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { Navbar } from "./navbar";
import NetworkBanner from "./NetworkBanner";
import { useLocation } from "react-router";

const Header = () => {
    const location = useLocation();

    // Robust check for authentication and recovery routes
    const isAuthRoute = (path: string) => {
        const authStartPaths = [
            "/login",
            "/signup",
            "/forgot-password",
            "/reset-password",
            "/unlock-vault",
            "/setup-master",
            "/recovery"
        ];
        return authStartPaths.includes(path) || path.startsWith("/auth/");
    };

    const showNavbar = !isAuthRoute(location.pathname);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!headerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                document.documentElement.style.setProperty('--header-height', `${entry.contentRect.height}px`);
                // console.log('Header height updated:', entry.contentRect.height);
            }
        });

        resizeObserver.observe(headerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <Box
            ref={headerRef}
            position="sticky"
            top="0"
            zIndex="1000"
            w="full"
            transition="all 0.1s ease-in-out"
            bg="transparent"
            p={4}
            pb={1}
            spaceY={2}
        >
            <NetworkBanner />
            {showNavbar && <Navbar />}
        </Box>
    );
};

export default Header;
