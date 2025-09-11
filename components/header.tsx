import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">Logo</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-accent hover:text-primary-foreground transition-colors duration-200">
              Sobre Nós
            </a>
            <a
              href="#testimonials"
              className="text-accent hover:text-primary-foreground transition-colors duration-200"
            >
              Depoimentos
            </a>
            <a href="#contact" className="text-accent hover:text-primary-foreground transition-colors duration-200">
              Contato
            </a>
          </nav>

          <Button variant="secondary" className="hidden md:inline-flex">
            Começar Agora
          </Button>
        </div>
      </div>
    </header>
  )
}
