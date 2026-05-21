import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Utensils, PenTool, ShoppingBag, Palette, Heart, Pill } from 'lucide-react'; // Added Pill icon

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  const services = [{
    title: 'SAZON RELLENO',
    subtitle: 'Comida y Bebida',
    description: 'El sabor que te llena el alma.',
    features: ['Hamburguesas', 'Papas Fritas', 'Almuerzos', 'Hot Dog', 'Bebidas Frías', 'Y Algo Más...'],
    icon: Utensils,
    gradient: 'from-[#ff6b6b] to-[#ee5253]',
    // Red/Orange for food
    price: 'Delicioso'
  }, {
    title: 'TATTOO STUDIO ZONA AK',
    subtitle: 'Arte Corporal',
    description: 'Los cuadros que no te imaginas lo hacemos.',
    features: ['Professional Artist', 'Reserva Ahora', 'Agenda Abierta', 'Diseños Personalizados'],
    icon: PenTool,
    gradient: 'from-[#00d2d3] to-[#2e86de]',
    // Cyan/Blue for tattoo/art
    price: 'Profesional'
  }, {
    title: 'SMOKE SET',
    subtitle: 'Tienda Especializada',
    description: 'Encuentra todo lo que necesitas y más.',
    features: ['Accesorios', 'Estupendos y Mas', 'Bono', 'Haga de Contar', 'Herramientas', 'Bongs'],
    icon: ShoppingBag,
    gradient: 'from-[#5f27cd] to-[#9b59b6]',
    // Purple for smoke shop
    price: 'Variedad'
  }, {
    title: 'ZONA ART',
    subtitle: 'Galería y Creación',
    description: 'Los cuadros que no te imaginas, lo verás o te lo hacemos.',
    features: ['Obras Originales', 'Encargos', 'Exhibiciones', 'Arte Urbano'],
    icon: Palette,
    gradient: 'from-[#feca57] to-[#ff9f43]',
    // Yellow/Orange for art
    price: 'Creatividad'
  }, {
    title: 'DULCE FARMA',
    subtitle: 'Bienestar y Novedades',
    description: 'TODO LO QUE NECESITAS EN TU MOMENTÓ EUFÓRICO',
    features: ['Cuidado Personal', 'Productos Exclusivos', 'Novedades', 'Para tu Bienestar'],
    icon: Pill,
    image: '/dulce-farma.png',
    gradient: 'from-[#e040fb] to-[#7b1fa2]',
    price: 'Vitalidad'
  }, {
    title: 'SMOKE SEX OT',
    subtitle: 'Intimidad y Placer',
    description: 'SEX-SHOP ACCESORIOS ROPA ESTIMULADORES Y MAS...',
    features: ['Accesorios Íntimos', 'Ropa Sensual', 'Estimuladores', 'Y Mucho Más...'],
    icon: Heart,
    // Using Heart icon for intimacy
    gradient: 'from-[#ff007f] to-[#ff80ab]',
    // Pink/Light Pink for sex shop
    price: 'Pasión'
  }];
  return <section id="services" className="py-20 bg-[#050510]">
      <div className="container mx-auto px-4">
        <motion.div ref={ref} initial={{
        opacity: 0,
        y: 50
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8
      }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Nuestros Servicios
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Descubre nuestra amplia gama de productos y servicios diseñados para ofrecerte experiencias únicas. Desde gastronomía hasta arte corporal, todo en un solo lugar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"> {/* Adjusted grid for 6 items */}
          {services.map((service, index) => <motion.div key={index} initial={{
          opacity: 0,
          y: 50
        }} animate={isInView ? {
          opacity: 1,
          y: 0
        } : {}} transition={{
          duration: 0.5,
          delay: index * 0.1
        }} whileHover={{
          y: -10,
          transition: {
            duration: 0.2
          }
        }} className="relative bg-[#111322] rounded-2xl shadow-lg hover:shadow-[0_0_20px_rgba(255,45,240,0.15)] transition-all overflow-hidden group border border-white/5 h-full flex flex-col">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient}`}></div>
              
              <div className="p-6 flex-grow flex flex-col">
                {service.image ? (
                  <div className="w-full rounded-xl overflow-hidden mb-4 border border-white/10">
                    <img src={service.image} alt={service.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg mx-auto`}>
                    <service.icon className="text-white mix-blend-overlay" size={32} />
                  </div>
                )}

                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1 text-center">{service.title}</h3>
                <p className="text-sm text-[#a7a8c7] text-center mb-3 uppercase tracking-wider">{service.subtitle}</p>
                
                {/* Price/Tag Badge */}
                <div className="flex justify-center mb-4">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${service.gradient} text-white`}>
                     {service.price}
                   </span>
                </div>

                <p className="text-[#a7a8c7] mb-6 text-center italic">"{service.description}"</p>

                <div className="mt-auto">
                   <ul className="space-y-2">
                    {service.features.map((feature, idx) => <li key={idx} className="flex items-start">
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${service.gradient} mr-2 font-bold`}>✓</span>
                        <span className="text-[#f5f5f5] text-sm">{feature}</span>
                      </li>)}
                  </ul>
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
            </motion.div>)}
        </div>

        {/* This button has been removed from here as it is not needed according to the images */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 bg-[#15162a] border border-white/10 rounded-2xl p-8 md:p-12 text-center text-[#f5f5f5] relative overflow-hidden"
         >
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff2df0]/10 to-[#00e5ff]/10 pointer-events-none"></div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
          <p className="text-lg mb-6 text-[#a7a8c7]">
             Recuerda, no es lo mismo leer este volante que conocerlo...!!!
             Escríbenos o llámanos porque tenemos más de lo que tú piensas.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/contact')}
            className="bg-white text-[#050510] px-8 py-3 rounded-full font-semibold hover:bg-[#ff2df0] hover:text-white transition-colors z-10 relative"
          >
            Contáctanos Ahora
          </motion.button>
         </motion.div> */}

         {/* New section based on the image: "Recuerda no es lo mismo leer este volante que conocerlo...!!!" */}
         <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8,
        delay: 0.5
      }} className="mt-16 bg-[#15162a] border border-white/10 rounded-2xl p-8 md:p-12 text-center text-[#f5f5f5] relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-[#ff2df0]/10 to-[#00e5ff]/10 pointer-events-none"></div>
           <p className="text-2xl md:text-3xl font-bold mb-4 text-[#a7a8c7] italic">"Recuerda no es lo mismo leer esta informaciòn que conocerlo...!!!"</p>
           <p className="text-lg text-[#a7a8c7]">
             Escríbenos o llámanos porque tenemos más de lo que tú piensas.
           </p>
         </motion.div>
      </div>
    </section>;
};
export default Services;