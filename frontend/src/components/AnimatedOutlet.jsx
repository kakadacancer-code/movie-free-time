import { motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

export default function AnimatedOutlet() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();

  return <motion.div
    key={pathname}
    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
  ><Outlet /></motion.div>;
}
