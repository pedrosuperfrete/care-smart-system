import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, MessageSquare, BarChart3, Users, Clock, Shield, Zap, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-foreground">doace</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground">Início</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Recursos</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Preços</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Contato</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost">Entrar</Button>
            <Button>Começar grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Cuidar de pessoas é sua missão.
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Cuidar da burocracia é a nossa.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Sistema completo para gestão de clínicas e consultórios médicos, 
                com agenda inteligente, prontuários digitais e muito mais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-3">
                  Começar agora
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Ver demonstração
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-24 h-24 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Para de abrir planilha, somar no caderninho ou tentar adivinhar quanto faturou.
          </h2>
          <p className="text-xl text-muted-foreground">
            Tudo que você precisa para gerenciar sua clínica em um só lugar.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="mb-12 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Libere sua agenda das tarefas que não geram valor.
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Agenda online com confirmação automática via WhatsApp
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Controle financeiro com emissão de recibos automatizada
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Prontuários digitais seguros e organizados
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Relatórios completos para tomada de decisões
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 h-full flex items-center justify-center">
                  <BarChart3 className="w-32 h-32 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* WhatsApp Assistant Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Assistente no WhatsApp
              </h2>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Confirmação automática de consultas
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Lembretes personalizados para pacientes
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Reagendamento fácil e rápido
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Coleta de feedback automatizada
                  </span>
                </li>
              </ul>
              <Button size="lg">
                Começar grátis
              </Button>
            </div>
            <div className="relative">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-lg max-w-sm mx-auto">
                <div className="bg-primary/10 rounded-2xl p-6 h-96 flex flex-col justify-between">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground">Dr. Assistente</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-sm text-foreground">Olá! Sua consulta está confirmada para amanhã às 14h.</p>
                    </div>
                    <div className="bg-primary/20 rounded-lg p-3 ml-8">
                      <p className="text-sm text-foreground">Obrigado! Estarei lá.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <span className="font-semibold text-foreground">Dashboard</span>
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-semibold text-foreground">Pacientes</span>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-semibold text-foreground">Agenda</span>
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-semibold text-foreground">Financeiro</span>
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Plataforma de Gestão Inteligente
              </h2>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Interface intuitiva e fácil de usar
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Relatórios em tempo real
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Backup automático na nuvem
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Suporte técnico especializado
                  </span>
                </li>
              </ul>
              <Button size="lg">
                Conhecer plataforma
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-8">
            Sabemos que você ama o que faz, mas...
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Tempo é precioso</h3>
              <p className="text-muted-foreground text-sm">
                Menos tempo com burocracia, mais tempo cuidando de pessoas
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Segurança total</h3>
              <p className="text-muted-foreground text-sm">
                Dados protegidos e em conformidade com a LGPD
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Eficiência máxima</h3>
              <p className="text-muted-foreground text-sm">
                Automatize processos e aumente sua produtividade
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Liberar sua rotina do operacional é abrir espaço pra crescer.
          </h2>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Mais consultas</h3>
            <p className="text-muted-foreground text-sm">
              Otimize sua agenda e atenda mais pacientes
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Controle financeiro</h3>
            <p className="text-muted-foreground text-sm">
              Saiba exatamente quanto e quando você recebe
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Relacionamento</h3>
            <p className="text-muted-foreground text-sm">
              Melhore a experiência dos seus pacientes
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Conformidade</h3>
            <p className="text-muted-foreground text-sm">
              Sistema em conformidade com CFM e LGPD
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Economia de tempo</h3>
            <p className="text-muted-foreground text-sm">
              Automatize tarefas repetitivas e burocráticas
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Qualidade</h3>
            <p className="text-muted-foreground text-sm">
              Ofereça um atendimento de excelência
            </p>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="text-lg px-8 py-3">
            Começar grátis
          </Button>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Depoimentos reais de quem trocou o caos pela leveza e viu o negócio crescer.
          </h2>
          
          <Card className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-16 h-16 text-primary" />
              </div>
              <div>
                <p className="text-lg text-muted-foreground mb-4 italic">
                  "Meu faturamento cresceu 45% em apenas 6 meses. Hoje conseguo atender muito mais pacientes 
                  e ainda sobra tempo para estudar e me especializar."
                </p>
                <div>
                  <p className="font-semibold text-foreground">Dra. Carla Pedroza</p>
                  <p className="text-sm text-muted-foreground">Dermatologista, São Paulo</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Quanto vale ter a agenda cheia sem estresse?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece agora a junta a diferença em 7 dias.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Começar teste grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-bold text-foreground">doace</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Sistema completo para gestão de clínicas e consultórios médicos.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Recursos</a></li>
                <li><a href="#" className="hover:text-foreground">Preços</a></li>
                <li><a href="#" className="hover:text-foreground">Integrações</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Sobre nós</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Carreiras</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Central de ajuda</a></li>
                <li><a href="#" className="hover:text-foreground">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Doace. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
