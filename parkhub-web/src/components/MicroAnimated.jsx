import { motion } from "framer-motion";
import { useFeatures } from "../context/FeaturesContext";

/**
 * Motion wrapper that adds micro-interactions when the feature is enabled.
 * When disabled, renders children without animation wrappers.
 *
 * Press: scale down on tap (0.97)
 * Hover: subtle lift (-2px)
 */

export function MicroAnimated({ children, noHover, noPress, ...rest }) {
  const { isEnabled } = useFeatures();
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!isEnabled("micro_animations") || prefersReducedMotion) {
    return <div {...rest}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={
        noHover ? undefined : { y: -2, transition: { duration: 0.15 } }
      }
      whileTap={
        noPress ? undefined : { scale: 0.97, transition: { duration: 0.08 } }
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — adds staggered entrance animation for children.
 * Falls back to a plain div when micro_animations is disabled.
 */
export function StaggerContainer({ children, className, delay = 0 }) {
  const { isEnabled } = useFeatures();

  if (!isEnabled("micro_animations")) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  const { isEnabled } = useFeatures();

  if (!isEnabled("micro_animations")) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
