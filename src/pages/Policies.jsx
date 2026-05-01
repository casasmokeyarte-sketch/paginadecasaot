import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Gavel, Users, ShieldCheck } from 'lucide-react';

const Policies = () => {
  const policies = [
    {
      icon: Users,
      title: "Perfil Corporativo",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#ff2df0] mb-2">Misión</h3>
            <p>Romper las barreras de lo convencional y crear infinitas posibilidades a través del arte, la cultura y experiencias únicas. Ofrecemos una selecta y diversa gama de productos y servicios que promueven la expresión artística y la individualidad, con un profundo respeto por la ética, la responsabilidad y el trato humano.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#ff2df0] mb-2">Visión</h3>
            <p>Ser el epicentro de la cultura urbana y artística en Colombia y Latinoamérica, reconocidos como una marca confiable e innovadora que fusiona el arte del tatuaje, la moda y experiencias inmersivas. Aspiramos a construir una comunidad global donde la creatividad no tiene límites y cada persona se siente inspirada a expresar su autenticidad.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#ff2df0] mb-2">Valores</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Pasión:</strong> Somos artistas y creadores apasionados por lo que hacemos.</li>
              <li><strong>Calidad:</strong> Nos comprometemos con la excelencia en cada producto, servicio y detalle.</li>
              <li><strong>Innovación:</strong> Buscamos constantemente nuevas formas de sorprender y agregar valor.</li>
              <li><strong>Respeto:</strong> Fomentamos un ambiente inclusivo y respetuoso para clientes y colaboradores.</li>
              <li><strong>Comunidad:</strong> Construimos relaciones duraderas basadas en la confianza y el apoyo mutuo.</li>
              <li><strong>Responsabilidad:</strong> Actuamos con integridad, ética y compromiso social y ambiental.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Gavel,
      title: "Marco Legal y Ético",
      content: (
        <div className="space-y-4">
          <p>Casa Smoke y Arte SSOT S.A.S., identificada con NIT 901.812.871-3, se rige por la legislación de la República de Colombia. Nuestro compromiso es operar con total transparencia, cumpliendo con todas las normativas aplicables, incluyendo las comerciales, tributarias, laborales y de protección al consumidor.</p>
          <p><strong>Ética Empresarial:</strong> Rechazamos cualquier forma de corrupción, soborno o práctica desleal. Nuestras relaciones comerciales se basan en la honestidad, la integridad y el respeto mutuo.</p>
          <p><strong>Protección de Datos (Habeas Data):</strong> En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, garantizamos la protección de los datos personales de nuestros clientes, usuarios y empleados. La información recopilada se utiliza exclusivamente para los fines informados y consentidos, y no se comparte con terceros sin autorización explícita, salvo las excepciones previstas por la ley. Los titulares de la información pueden ejercer sus derechos de conocer, actualizar, rectificar y suprimir sus datos a través de nuestros canales de contacto.</p>
        </div>
      )
    },
    {
      icon: ShieldCheck,
      title: "Manual de Políticas del Cliente",
      content: (
         <div className="space-y-4">
          <p><strong>Derechos del Cliente:</strong> Todo cliente tiene derecho a recibir un trato digno y respetuoso, información clara y veraz sobre nuestros productos y servicios, y un servicio de alta calidad.</p>
          <p><strong>Peticiones, Quejas y Reclamos (PQR):</strong> Hemos dispuesto un canal oficial de PQR en nuestro sitio web para que los clientes puedan radicar sus solicitudes. Nos comprometemos a dar respuesta oportuna y efectiva en los plazos establecidos por la ley.</p>
          <p><strong>Garantías:</strong> La garantía de los productos se rige por los términos especificados para cada artículo y la normativa colombiana. Para servicios de tatuaje, garantizamos el uso de materiales estériles y de la más alta calidad, y ofrecemos una sesión de retoque (si aplica) bajo las condiciones acordadas con el artista.</p>
          <p><strong>Políticas de Devolución y Reembolso:</strong> Los productos pueden ser devueltos dentro de los 5 días hábiles siguientes a la entrega, siempre que se encuentren en perfecto estado y con su empaque original. No se realizan devoluciones de dinero para servicios ya prestados (ej. tatuajes). Los depósitos para citas de tatuaje no son reembolsables en caso de cancelación por parte del cliente con menos de 48 horas de antelación.</p>
        </div>
      )
    },
    {
      icon: FileText,
      title: "Términos y Condiciones de Uso y Servicio",
      content: (
        <div className="space-y-4 prose prose-invert max-w-none text-[#a7a8c7]">
          <p>Al acceder y utilizar nuestro sitio web y servicios, usted acepta los siguientes términos:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Uso del Sitio Web:</strong> El contenido de este sitio es para su información y uso general. Está sujeto a cambios sin previo aviso. Queda prohibido el uso indebido del sitio, incluyendo la introducción de material malicioso o tecnológicamente dañino.</li>
            <li><strong>Propiedad Intelectual:</strong> Todo el contenido, incluyendo logos, textos, gráficos, y diseños, es propiedad de Casa Smoke y Arte SSOT S.A.S. o sus licenciantes y está protegido por leyes de derechos de autor.</li>
            <li><strong>Cuentas de Usuario:</strong> Usted es responsable de mantener la confidencialidad de su cuenta y contraseña y de restringir el acceso a su computadora.</li>
            <li><strong>Precios y Pagos:</strong> Todos los precios están en Pesos Colombianos (COP) y pueden cambiar sin previo aviso. Aceptamos los métodos de pago indicados en la plataforma.</li>
            <li><strong>Servicios de Tatuaje:</strong> Para realizarse un tatuaje es obligatorio ser mayor de edad. Requerimos un depósito para asegurar la cita. El diseño final y el precio se acuerdan directamente con el artista.</li>
            <li><strong>Limitación de Responsabilidad:</strong> Casa Smoke y Arte no será responsable por daños indirectos, incidentales o consecuentes que surjan del uso de nuestros productos o servicios.</li>
            <li><strong>Ley Aplicable:</strong> Estos términos se regirán e interpretarán de acuerdo con las leyes de Colombia.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>Nuestras Políticas - Casa Smoke y Arte</title>
        <meta name="description" content="Conoce el perfil corporativo, marco legal, políticas de cliente y términos y condiciones de Casa Smoke y Arte SSOT S.A.S." />
      </Helmet>
      <div className="bg-[#050510] py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] tracking-tight">
              Nuestras Políticas
            </h1>
            <p className="mt-4 text-lg text-[#a7a8c7] max-w-2xl mx-auto">
              Transparencia, compromiso y claridad. Conoce los pilares que guían nuestro trabajo y nuestra relación contigo.
            </p>
             <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mt-6"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-4xl mx-auto bg-[#111322] rounded-2xl border border-white/10 shadow-2xl p-4 sm:p-8"
          >
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {policies.map((policy, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4">
                      <policy.icon className="h-6 w-6 text-[#00e5ff]" />
                      <span>{policy.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-10">
                      {policy.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Policies;