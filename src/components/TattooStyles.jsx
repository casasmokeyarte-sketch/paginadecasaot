import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Paintbrush, PenTool, Layers, Zap, Feather, Eye } from 'lucide-react';

const TattooStyles = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const styles = [
    {
      id: 1,
      title: 'Realismo',
      description: 'Capturamos la realidad en la piel con detalles fotográficos y sombreados precisos.',
      icon: Eye,
      color: 'text-[#ff2df0]',
      border: 'hover:border-[#ff2df0]'
    },
    {
      id: 2,
      title: 'Neotradicional',
      description: 'Evolución del estilo tradicional con líneas más variadas, colores vibrantes y profundidad.',
      icon: Layers,
      color: 'text-[#00e5ff]',
      border: 'hover:border-[#00e5ff]'
    },
    {
      id: 3,
      title: 'Blackwork',
      description: 'Diseños impactantes utilizando únicamente tinta negra, desde geometría hasta arte abstracto.',
      icon: PenTool,
      color: 'text-[#f4c542]',
      border: 'hover:border-[#f4c542]'
    },
    {
      id: 4,
      title: 'Acuarela',
      description: 'Efectos de pinceladas y salpicaduras que imitan la pintura fluida sobre lienzo.',
      icon: Paintbrush,
      color: 'text-[#ff2df0]',
      border: 'hover:border-[#ff2df0]'
    },
    {
      id: 5,
      title: 'Dotwork',
      description: 'Imágenes complejas formadas por miles de puntos individuales para texturas únicas.',
      icon: Zap,
      color: 'text-[#00e5ff]',
      border: 'hover:border-[#00e5ff]'
    },
    {
      id: 6,
      title: 'Japonés',
      description: 'Iconografía tradicional oriental como dragones y kois con flujos anatómicos perfectos.',
      icon: Feather,
      color: 'text-[#f4c542]',
      border: 'hover:border-[#f4c542]'
    }
  ];

  return (
    <section id="styles" className="py-20 bg-[#050510] border-t border-white/5">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Estilos y Técnicas
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Dominamos una amplia variedad de estilos para dar vida a tu visión artística.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {styles.map((style, index) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className={`bg-[#111322] p-8 rounded-2xl border border-white/5 ${style.border} transition-all duration-300 group`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-lg bg-[#15162a] border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  <style.icon className={style.color} size={32} />
                </div>
                <span className="text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                  0{index + 1}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-[#f5f5f5] mb-3 group-hover:text-[#ff2df0] transition-colors">
                {style.title}
              </h3>
              <p className="text-[#a7a8c7] leading-relaxed">
                {style.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TattooStyles;