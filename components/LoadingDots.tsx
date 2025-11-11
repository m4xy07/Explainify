import { motion } from "framer-motion";

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-2 w-2 rounded-full bg-gradient-to-r from-[#7b5cff] to-[#00a1ff]"
          animate={{ opacity: [0.2, 1, 0.2], y: [-1, 1, -1] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: dot * 0.15,
          }}
        />
      ))}
    </span>
  );
}
