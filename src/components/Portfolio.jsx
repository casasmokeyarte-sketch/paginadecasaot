import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Portfolio = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const portfolioItems = {
    realism: [
      {
        title: 'Retrato Realista',
        description: 'Tatuaje de retrato en blanco y negro con detalles hiperrealistas'
      },
      {
        title: 'Naturaleza Realista',
        description: 'Diseño floral con técnicas de sombreado realista'
      },
      {
        title: 'Animal Realista',
        description: 'Tatuaje de león con detalles impresionantes'
      }
    ],
    traditional: [
      {
        title: 'Old School',
        description: 'Diseño tradicional con líneas gruesas y colores vibrantes'
      },
      {
        title: 'Neo Tradicional',
        description: 'Estilo tradicional con un toque moderno'
      },
      {
        title: 'Americana',
        description: 'Tatuaje tradicional americano clásico'
      }
    ],
    geometric: [
      {
        title: 'Mandala',
        description: 'Diseño mandala con geometría perfecta'
      },
      {
        title: 'Geometría Sagrada',
        description: 'Patrones geométricos con significado espiritual'
      },
      {
        title: 'Linework',
        description: 'Arte lineal geométrico minimalista'
      }
    ],
    color: [
      {
        title: 'Acuarela',
        description: 'Técnica de acuarela con colores fluidos'
      },
      {
        title: 'Color Vibrante',
        description: 'Diseños con colores brillantes y saturados'
      },
      {
        title: 'Surrealismo',
        description: 'Arte surrealista con paleta de colores única'
      }
    ]
  };

  return (
    <section id="portfolio" className="py-20 bg-[#050510] border-t border-white/5">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Nuestro Portafolio
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Explora nuestra colección de obras de arte en piel. Cada tatuaje cuenta una historia única.
          </p>
        </motion.div>

        <Tabs defaultValue="realism" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 lg:grid-cols-4 mb-12 bg-[#111322] border border-white/10">
            <TabsTrigger value="realism" className="data-[state=active]:bg-[#ff2df0] data-[state=active]:text-white text-[#a7a8c7] hover:text-white">
              Realismo
            </TabsTrigger>
            <TabsTrigger value="traditional" className="data-[state=active]:bg-[#00e5ff] data-[state=active]:text-[#050510] text-[#a7a8c7] hover:text-white">
              Tradicional
            </TabsTrigger>
            <TabsTrigger value="geometric" className="data-[state=active]:bg-[#f4c542] data-[state=active]:text-[#050510] text-[#a7a8c7] hover:text-white">
              Geométrico
            </TabsTrigger>
            <TabsTrigger value="color" className="data-[state=active]:bg-[#ff2df0] data-[state=active]:text-white text-[#a7a8c7] hover:text-white">
              A Color
            </TabsTrigger>
          </TabsList>

          {Object.entries(portfolioItems).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-lg border border-white/10"
                        >
                          <img 
                            className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                            alt={item.title}
                           src="https://images.unsplash.com/photo-1700665653601-aab7aebf9e11" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                            <div>
                              <h3 className="text-[#ff2df0] text-xl font-bold mb-1 drop-shadow-lg">{item.title}</h3>
                              <p className="text-[#f5f5f5] text-sm">{item.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl bg-[#111322] border-white/10 text-[#f5f5f5]">
                        <div className="space-y-4">
                          <img 
                            className="w-full h-auto rounded-lg border border-white/10" 
                            alt={item.title}
                           src="https://images.unsplash.com/photo-1700665653601-aab7aebf9e11" />
                          <div>
                            <h3 className="text-2xl font-bold text-[#ff2df0] mb-2">{item.title}</h3>
                            <p className="text-[#a7a8c7]">{item.description}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default Portfolio;