import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground text-balance">Sobre Nossa Empresa</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Somos uma empresa dedicada a fornecer soluções inovadoras e de alta qualidade para nossos clientes. Com
              anos de experiência no mercado, construímos uma reputação sólida baseada na confiança e excelência.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nossa missão é transformar ideias em realidade, oferecendo serviços personalizados que atendem às
              necessidades específicas de cada cliente. Acreditamos na importância de relacionamentos duradouros e no
              crescimento mútuo.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Clientes Satisfeitos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">10+</div>
                  <div className="text-sm text-muted-foreground">Anos de Experiência</div>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" className="mt-6">
              Saiba Mais
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
              <img
                src="/about-og-image.png"
                alt="Equipe profissional trabalhando em escritório moderno"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
