import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] overflow-x-hidden selection:bg-[#22c55e]/30 selection:text-[#22c55e]">

      <Navbar />


      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-grow w-full mx-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>


      <Footer />
    </div>
  );
};

export default Layout;