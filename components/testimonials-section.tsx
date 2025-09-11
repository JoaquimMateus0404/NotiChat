import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Maria Silva",
    role: "CEO, TechCorp",
    content:
      "Excelente serviço! A equipe superou nossas expectativas e entregou resultados excepcionais. Recomendo fortemente.",
    avatar: "/professional-woman-smiling.png",
  },
  {
    name: "João Santos",
    role: "Diretor, InnovaCorp",
    content:
      "Profissionalismo e qualidade em cada detalhe. Trabalhar com esta empresa foi uma das melhores decisões que tomamos.",
    avatar: "/professional-man-smiling.png",
  },
  {
    name: "Ana Costa",
    role: "Gerente, StartupXYZ",
    content:
      "Atendimento personalizado e soluções criativas. Eles realmente entendem as necessidades do cliente e entregam valor.",
    avatar: "/smiling-professional-woman.png",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">O Que Nossos Clientes Dizem</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja os depoimentos de quem já confia em nossos serviços e descobriu o valor que podemos agregar ao seu
            negócio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-card-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <blockquote className="text-card-foreground leading-relaxed">"{testimonial.content}"</blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
