import { useRef } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import "./SpotlightCard.css";

interface SpotlightCardProps extends BoxProps {
  children: React.ReactNode;
  spotlightColor?: string;
}

const SpotlightCard = ({ children, spotlightColor = "rgba(255, 255, 255, 0.25)", ...props }: SpotlightCardProps) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      divRef.current.style.setProperty("--mouse-x", `${x}px`);
      divRef.current.style.setProperty("--mouse-y", `${y}px`);
      divRef.current.style.setProperty("--spotlight-color", spotlightColor);
    }
  };

  return (
    <Box
      ref={divRef}
      onMouseMove={handleMouseMove}
      className="card-spotlight"
      {...props}
    >
      {children}
    </Box>
  );
};

export default SpotlightCard;