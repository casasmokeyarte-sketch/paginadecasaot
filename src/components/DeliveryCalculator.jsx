import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet';
const DeliveryCalculator = () => {
  return <>
      <Helmet>
        <title>Calculadora de Domicilios - Casa Smoke y Arte</title>
        <meta name="description" content="Calcula el costo de tu domicilio fácilmente con nuestra herramienta interactiva." />
      </Helmet>
      <section className="min-h-screen pt-32 pb-20 bg-[#050510] flex flex-col items-center">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Truck className="w-8 h-8 text-[#ff2df0]" />
              <span className="text-[#00e5ff] font-bold tracking-wider uppercase">Envíos Seguros</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#f5f5f5] mb-6 leading-tight">
              Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2df0] to-[#00e5ff]">Domicilios</span>
            </h1>
            <p className="text-xl text-[#a7a8c7] max-w-2xl mx-auto mb-8">Utiliza nuestra herramienta oficial para cotizar el valor exacto de tu envío antes de realizar tu pedido. esta calculculadora la puede usar  toda persona intreresada  es publica, y los precios que arroja con ajustado al clase de servios que presta </p>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="bg-[#111322] border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff2df0]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00e5ff]/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center relative z-10">
              <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl mb-10 border border-white/5 bg-[#050510]/50">
                 <img src="https://horizons-cdn.hostinger.com/9c34d6a0-7f3d-4ce5-a2cd-77bc39639101/7e77a4abbd1a9921cb36887f7d46ab27.png" alt="Calculadora Smoke OT Flamingo - Calculadora de Domicilios" className="w-full h-auto object-contain hover:scale-105 transition-transform duration-700 ease-in-out" />
              </div>

              <div className="text-center space-y-8 w-full max-w-md">
                <p className="text-[#f5f5f5] text-lg font-medium">
                  Haz clic en el botón a continuación para acceder a nuestra calculadora interactiva.
                </p>

                <a href="https://www.canva.com/design/DAGutL4GpVI/wA7CyJvxgyHv6_bY_VRV9A/view?utm_content=DAGutL4GpVI&utm_campaign=designshare&utm_medium=embeds&utm_source=link" target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button size="lg" className="w-full h-16 bg-gradient-to-r from-[#ff2df0] via-[#d91cb8] to-[#ff2df0] bg-[length:200%_auto] animate-gradient hover:shadow-[0_0_30px_rgba(255,45,240,0.6)] text-white font-bold text-xl rounded-2xl transition-all duration-300 group">
                    <Calculator className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                    Calcular Domicilio
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
                
                <p className="text-sm text-[#a7a8c7]/60">
                  Serás redirigido a nuestra herramienta externa segura.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>;
};
export default DeliveryCalculator;