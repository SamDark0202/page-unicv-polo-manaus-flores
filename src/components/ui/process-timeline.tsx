"use client";

import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const processCardVariants = cva(
  "flex border backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300",
  {
    variants: {
      variant: {
        indigo:
          "flex border text-slate-50 border-slate-700/80 backdrop-blur-lg bg-gradient-to-br from-[#0f172a]/95 via-[#1e293b]/90 to-[#1e3a8a]/80 shadow-2xl",
        light: "shadow bg-card text-card-foreground border-border",
      },
      size: {
        sm: "min-w-[25%] max-w-[25%]",
        md: "min-w-[50%] max-w-[50%]",
        lg: "min-w-[75%] max-w-[75%]",
        xl: "min-w-full max-w-full",
      },
    },
    defaultVariants: {
      variant: "indigo",
      size: "md",
    },
  }
);

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

interface ProcessCardProps
  extends Omit<HTMLMotionProps<"div">, "size">,
    VariantProps<typeof processCardVariants> {
  itemsLength: number;
  index: number;
}

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScroll Component"
    );
  }
  return context;
}

export const ContainerScroll: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-[140vh] sm:min-h-[160vh]", className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};

export const ContainerSticky = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("sticky left-0 top-24 w-full overflow-hidden py-4", className)}
    {...props}
  />
));
ContainerSticky.displayName = "ContainerSticky";

export const ProcessCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-4 sm:p-6 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-700/60",
      className
    )}
    {...props}
  />
));
ProcessCardTitle.displayName = "ProcessCardTitle";

export const ProcessCardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-3 p-4 sm:p-6 justify-center flex-1", className)}
    {...props}
  />
));
ProcessCardBody.displayName = "ProcessCardBody";

export const ProcessCard: React.FC<ProcessCardProps> = ({
  className,
  style,
  variant,
  size,
  itemsLength,
  index,
  children,
  ...props
}) => {
  const { scrollYProgress } = useContainerScrollContext();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = React.useState(320);
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    const updateDimensions = () => {
      if (cardRef.current) {
        setCardWidth(cardRef.current.offsetWidth);
      }
      setWindowWidth(window.innerWidth);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const start = index / itemsLength;
  const end = Math.min(1, start + 1 / itemsLength);

  const targetX = -((cardWidth + 24) * index);

  const x = useTransform(
    scrollYProgress,
    [start, end],
    [index === 0 ? 0 : windowWidth, targetX]
  );

  return (
    <motion.div
      ref={cardRef}
      style={{
        x: index === 0 ? 0 : x,
        ...style,
      }}
      className={cn(processCardVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
ProcessCard.displayName = "ProcessCard";
