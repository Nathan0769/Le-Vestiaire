"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type SpotlightProps = {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  duration?: number;
  xOffset?: number;
};

export const Spotlight = ({
  gradientFirst = "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .24) 0, hsla(210, 100%, 55%, .14) 50%, hsla(210, 100%, 45%, 0) 80%)",
  gradientSecond = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .20) 0, hsla(210, 100%, 55%, .12) 80%, transparent 100%)",
  gradientThird = "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .14) 0, hsla(210, 100%, 45%, .09) 80%, transparent 100%)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps = {}) => {
  const [dimensions, setDimensions] = useState({
    width,
    height,
    smallWidth,
    translateY,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth < 640) {
        // Mobile: much smaller spotlights
        setDimensions({
          width: 280,
          height: 690,
          smallWidth: 120,
          translateY: -175,
        });
      } else if (screenWidth < 1024) {
        // Tablet: medium-sized spotlights
        setDimensions({
          width: 400,
          height: 980,
          smallWidth: 170,
          translateY: -250,
        });
      } else {
        // Desktop: original size
        setDimensions({
          width,
          height,
          smallWidth,
          translateY,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [width, height, smallWidth, translateY]);

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1.5,
      }}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <motion.div
        animate={{
          x: [0, xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${dimensions.translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 left-0`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${dimensions.smallWidth}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${dimensions.smallWidth}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 left-0 origin-top-left`}
        />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-screen h-screen z-40 pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${dimensions.translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 right-0`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${dimensions.smallWidth}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${dimensions.smallWidth}px`,
            height: `${dimensions.height}px`,
          }}
          className={`absolute top-0 right-0 origin-top-right`}
        />
      </motion.div>
    </motion.div>
  );
};
