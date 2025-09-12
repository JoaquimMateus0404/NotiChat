export function Footer() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold">Logo</span>
            </div>
            <p className="text-sm opacity-90">
              Transformando ideias em realidade com soluções inovadoras e de qualidade.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Consultoria
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Desenvolvimento
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Suporte
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Treinamento
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <a href="#about" className="hover:text-accent transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-accent transition-colors">
                  Depoimentos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Carreiras
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <div className="space-y-2 text-sm opacity-90">
              <p>cleansoft@gmail.com</p>
              <p>(+244) 933855723</p>
              <p>Luanda, Angola</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-accent transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                  Twitter
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-75">
          <p>&copy; 2024 Empresa. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
