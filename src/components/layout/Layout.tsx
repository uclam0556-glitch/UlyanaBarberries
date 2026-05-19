import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="pt-14 pb-nav"
      >
        {children}
      </motion.main>
    </div>
  );
}
