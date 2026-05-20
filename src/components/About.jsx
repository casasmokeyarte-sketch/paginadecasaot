import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Heart, Users, Award, Sparkles, HeartHandshake as Handshake, Lightbulb, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });

  const features = [{
    icon: Heart,
    title: 'Pasión por el Arte',
    description: 'Más que un estudio de tatuajes, toda nuestra casa es una obra de arte inmersiva donde cada rincón cuenta una historia.',
    color: 'text-[#ff2df0]',
    bg: 'bg-[#ff2df0]/10'
  }, {
    icon: Users,
    title: 'Artistas Profesionales',
    description: 'Nuestro equipo cuenta con años de experiencia y formación continua.',
    color: 'text-[#00e5ff]',
    bg: 'bg-[#00e5ff]/10'
  }, {
    icon: Award,
    title: 'Calidad Garantizada',
    description: 'Nos enfocamos en ofrecer la mejor calidad en cada producto y un servicio al cliente que supera las expectativas.',
    color: 'text-[#f4c542]',
    bg: 'bg-[#f4c542]/10'
  }];

  const commitmentPoints = [{
    icon: Lightbulb,
    title: 'Innovación Constante',
    description: 'Siempre estamos buscando nuevas formas de mejorar nuestros servicios y productos, manteniéndonos a la vanguardia de las tendencias y tecnologías.'
  }, {
    icon: Handshake,
    title: 'Relaciones Duraderas',
    description: 'Nos esforzamos por construir conexiones significativas con nuestros clientes y colaboradores, basadas en la confianza y el respeto mutuo.'
  }, {
    icon: Sparkles,
    title: 'Experiencias Memorables',
    description: 'Cada interacción con Casa Smoke y Arte está diseñada para ser especial, ofreciendo momentos inolvidables que trascienden lo ordinario.'
  }];

  return (
    <>
      <Helmet>
        <title>Sobre Nosotros - Casa Smoke y Arte</title>
        <meta name="description" content="Conoce la historia, misión y compromiso de Casa Smoke y Arte. Somos un espacio cultural que fusiona arte, cultura urbana y tatuajes." />
      </Helmet>
      <section id="about" className="py-20 bg-[#050510]">
        <div className="container mx-auto px-4">
          <motion.div 
            ref={ref} 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8 }} 
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              Sobre Nosotros
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
              Casa Smoke y Arte SSOT S.A.S es más que un estudio de tatuajes. Somos un espacio cultural donde el arte, la experiencia y la pasión se fusionan para crear momentos únicos e inolvidables. Nacimos con la visión de ofrecer una selecta y diversa gama de productos y servicios que promuevan la diversión personal y la expresión artística. Nos caracterizamos por romper las barreras ofreciendo momentos únicos para cada cliente y empleados; Teniendo como bandera  la responsabilidad, la ética y un trato humano, y asi poder  reflejar un profundo respeto por la creatividad y la individualidad.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30 }} 
                animate={isInView ? { opacity: 1, y: 0 } : {}} 
                transition={{ duration: 0.5, delay: index * 0.1 }} 
                whileHover={{ y: -10, transition: { duration: 0.2 } }} 
                className="bg-[#111322] p-6 rounded-2xl border border-white/5 hover:border-[#ff2df0]/30 hover:shadow-[0_0_20px_rgba(255,45,240,0.1)] transition-all"
              >
                <div className={`w-16 h-16 rounded-full ${feature.bg} flex items-center justify-center mb-4 mx-auto border border-white/5`}>
                  <feature.icon className={feature.color} size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#f5f5f5] mb-2 text-center">{feature.title}</h3>
                <p className="text-[#a7a8c7] text-center">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Single Image Section */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              animate={isInView ? { opacity: 1, x: 0 } : {}} 
              transition={{ duration: 0.8 }} 
              className="relative group h-[500px] w-full"
            >
               <div className="absolute -inset-2 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
               
               <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#050510] border border-white/10 shadow-2xl">
                 <img
                   src="/nosotros.jpeg"
                   alt="Productos y accesorios de Casa Smoke y Arte"
                   className="w-full h-full object-cover"
                 />
                 {/* Dark Overlay for better text visibility (optional, currently minimal) */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/80 via-transparent to-transparent opacity-60"></div>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={isInView ? { opacity: 1, x: 0 } : {}} 
              transition={{ duration: 0.8 }} 
              className="space-y-6"
            >
              <h3 className="text-3xl font-bold text-[#f5f5f5]">Nuestra Historia</h3>
              <p className="text-[#a7a8c7] leading-relaxed">Nacimos de una idea sencilla pero poderosa: No olvidar que estuvimos y estamos más en este lado de la cama, que el otro lado que viene a la vuelta de la esquina de tu casa y nunca llega. Siempre cerca de ti, sin olvidar nuestras raíces ni perder de vista el futuro.</p>
              <p className="text-[#a7a8c7] leading-relaxed">Un año en el mercado, pero con un impacto creciente: A pesar de nuestra corta trayectoria, nos hemos posicionado en la mente y el corazón de quienes valoran la calidad y la innovación.</p>
              <p className="text-[#a7a8c7] leading-relaxed">Una marca confiable: Reconocida por estar presente justo cuando más nos necesitas, ofreciendo siempre productos modernos y sustentables.</p>
            </motion.div>
          </div>

          {/* New Section: Nuestra Misión */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 0.4 }} 
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              Nuestra Misión: Rompiendo Barreras y Creando Posibilidades
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
              Nuestra misión es sencilla pero poderosa: "Romper las barreras de lo convencional y crear infinitas posibilidades". Esto se logra a través de:
            </p>
            <ul className="text-left text-[#a7a8c7] max-w-2xl mx-auto mt-6 space-y-4 list-disc list-inside">
              <li>
                <strong>Diversidad en Productos y Servicios:</strong> Ofrecemos una gama variada que va desde el arte del tatuaje hasta la cultura urbana, siempre buscando la singularidad.
              </li>
              <li>
                <strong>Fomento de la Expresión Personal:</strong> Creemos que cada persona es una obra de arte, y por eso impulsamos la expresión individual a través de nuestros diseños.
              </li>
              <li>
                <strong>Creación de Experiencias Memorables:</strong> No solo vendemos productos o servicios, creamos momentos y recuerdos que permanecen con cada cliente.
              </li>
              <li>
                <strong>Un Equipo Humano Apasionado:</strong> Nuestros profesionales son la columna vertebral de nuestro éxito, trabajando con ética, responsabilidad y un profundo respeto por el arte.
              </li>
            </ul>
          </motion.div>

          {/* New Section: ¿Qué Nos Diferencia? */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 0.6 }} 
            className="mb-20 bg-[#111322] p-8 md:p-12 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#f5f5f5] text-center mb-8">
              ¿Qué Nos Diferencia?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] mx-auto mb-10"></div>
            <div className="space-y-8 text-lg text-[#a7a8c7]">
              <p>
                <strong>Un Lugar para Todas las Expresiones:</strong> No importa si buscas un tatuaje significativo, una prenda que refleje tu estilo o simplemente un espacio donde la creatividad fluya, Casa Smoke y Arte es tu destino.
              </p>
              <p>
                <strong>Comunidad y Respeto:</strong> Valoramos la diversidad y creamos un ambiente inclusivo donde todos se sientan bienvenidos y respetados. Fomentamos la interacción y el intercambio de ideas entre artistas y clientes.
              </p>
              <p>
                <strong>Calidad que Inspira:</strong> Desde la aguja que toca tu piel hasta el material de nuestras prendas, cada detalle se selecciona con el más alto estándar de calidad para asegurar durabilidad y satisfacción.
              </p>
              <p>
                <strong>Responsabilidad Social y Ambiental:</strong> Nos comprometemos con prácticas sostenibles y apoyamos causas que promueven el arte y la cultura en nuestra comunidad. Creemos en un futuro donde el arte y el bienestar se unan.
              </p>
            </div>
          </motion.div>

          {/* New Section: Nuestro Compromiso Contigo */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 0.8 }} 
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              Nuestro Compromiso Contigo
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto mb-12">
              En Casa Smoke y Arte, nuestra relación contigo va más allá de una simple transacción. Nos dedicamos a ofrecerte valor en cada interacción:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {commitmentPoints.map((point, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={isInView ? { opacity: 1, scale: 1 } : {}} 
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.8 }} 
                  className="bg-[#111322] p-6 rounded-2xl border border-white/10 hover:border-[#00e5ff]/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all"
                >
                  <div className="flex items-center justify-center mb-4">
                    <point.icon className="text-[#00e5ff]" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-[#f5f5f5] mb-2">{point.title}</h3>
                  <p className="text-[#a7a8c7]">{point.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* New Section: Ejemplo de Nuestro Impacto */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 1.0 }} 
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              Ejemplo de Nuestro Impacto
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto mb-8">
              Lo que comenzó hace 1 año y 7 meses como un sueño enfocado solo en la venta de pipas, ha evolucionado increíblemente. Hoy somos una tienda local consolidada donde vives verdaderas experiencias, gestionando con orgullo más de 800 productos diferentes para nuestra comunidad.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-12">
              <div className="bg-[#111322] p-8 rounded-2xl border border-white/10 shadow-lg text-center w-full md:w-auto min-w-[200px]">
                <p className="text-5xl font-bold text-[#ff2df0] mb-2">1.7</p>
                <p className="text-xl text-[#f5f5f5]">Años de Trayectoria</p>
              </div>
              <div className="bg-[#111322] p-8 rounded-2xl border border-white/10 shadow-lg text-center w-full md:w-auto min-w-[200px]">
                <p className="text-5xl font-bold text-[#00e5ff] mb-2">800+</p>
                <p className="text-xl text-[#f5f5f5]">Productos Únicos</p>
              </div>
            </div>
          </motion.div>

          {/* New Section: Únete a Nuestra Comunidad */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 1.2 }} 
            className="text-center bg-[#111322] p-8 md:p-12 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-6">
              Únete a Nuestra Comunidad
            </h2>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto mb-8">
              Te invitamos a ser parte de esta aventura, donde la creatividad no tiene límites y cada idea encuentra su lienzo. Síguenos en nuestras redes sociales, visita nuestro estudio y descubre un universo de posibilidades.
            </p>
            <Button 
              size="lg" 
              className="mt-6 bg-gradient-to-r from-[#ff2df0] via-[#d91cb8] to-[#ff2df0] bg-[length:200%_auto] animate-gradient hover:shadow-[0_0_30px_rgba(255,45,240,0.6)] text-white font-bold text-xl rounded-full transition-all duration-300 group"
              onClick={() => {
                /* Placeholder for social media link */
                alert("🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀");
              }}
            >
              <Link2 className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              Explora y Conéctate
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default About;