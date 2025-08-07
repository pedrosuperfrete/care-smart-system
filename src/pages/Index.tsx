import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, MessageSquare, BarChart3, Users, Clock, Shield, Zap, Star, Phone, Mail, MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" alt="Donee" className="h-8" />
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
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                <div className="w-full h-80 bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-teal-200/30 to-blue-200/30"></div>
                  <div className="relative z-10 text-center">
                    <Calendar className="w-24 h-24 text-teal-600 mx-auto mb-4" />
                    <p className="text-sm text-teal-700 font-medium">Agenda Inteligente</p>
                  </div>
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
                  <div className="bg-white rounded-lg p-6 shadow-lg w-80">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800">Dashboard</h4>
                      <div className="text-xs text-gray-500">+ add</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Pacientes hoje</span>
                        <span className="text-sm font-medium text-gray-900">12</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Faturamento</span>
                        <span className="text-sm font-medium text-gray-900">R$ 2.400</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Próximo paciente</span>
                        <span className="text-sm font-medium text-gray-900">14:30</span>
                      </div>
                    </div>
                  </div>
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
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                Ver como
              </Button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl p-6 shadow-lg max-w-sm mx-auto border">
                <div className="bg-green-50 rounded-2xl p-6 h-96 flex flex-col">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Dr. Assistente</span>
                      <p className="text-xs text-gray-500">online</p>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800">Olá Maria! Sua consulta com Dr. João está confirmada para amanhã às 14:00h.</p>
                      <p className="text-xs text-gray-500 mt-1">Hoje 10:30</p>
                    </div>
                    <div className="bg-green-500 text-white rounded-lg p-3 ml-8">
                      <p className="text-sm">Obrigada! Estarei lá no horário ✓</p>
                      <p className="text-xs text-green-100 mt-1">Hoje 10:32</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800">Perfeito! Lembrando que você pode cancelar ou reagendar até 2h antes pelo WhatsApp.</p>
                      <p className="text-xs text-gray-500 mt-1">Hoje 10:33</p>
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
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl p-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-800">Plataforma</h4>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <span className="font-medium text-gray-800">Dashboard</span>
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Pacientes</span>
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Agenda</span>
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Financeiro</span>
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
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
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
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
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Tempo é precioso</h3>
              <p className="text-muted-foreground text-sm">
                Menos tempo com burocracia, mais tempo cuidando de pessoas
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Segurança total</h3>
              <p className="text-muted-foreground text-sm">
                Dados protegidos e em conformidade com a LGPD
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Mais consultas</h3>
            <p className="text-muted-foreground text-sm">
              Otimize sua agenda e atenda mais pacientes
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Controle financeiro</h3>
            <p className="text-muted-foreground text-sm">
              Saiba exatamente quanto e quando você recebe
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Relacionamento</h3>
            <p className="text-muted-foreground text-sm">
              Melhore a experiência dos seus pacientes
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Conformidade</h3>
            <p className="text-muted-foreground text-sm">
              Sistema em conformidade com CFM e LGPD
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Economia de tempo</h3>
            <p className="text-muted-foreground text-sm">
              Automatize tarefas repetitivas e burocráticas
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-yellow-600" />
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
              <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/lovable-uploads/65e05e81-18b0-4ef9-a06f-f137ba0eb5b3.png" alt="Dra. Carla Pedroza" className="w-full h-full object-cover" />
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

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            Quanto vale ter a agenda cheia sem estresse?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece agora e sinta a diferença em 7 dias.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>14 dias de teste grátis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>Sem taxa de adesão</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>Cancele quando quiser</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>Suporte especializado incluído</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4">Teste por 14 dias</h3>
              <p className="mb-6 opacity-90">Sem compromisso, sem cartão de crédito</p>
              <Button size="lg" className="w-full bg-white text-teal-600 hover:bg-gray-100 text-lg px-8 py-3">
                Começar teste grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" alt="Donee" className="h-8 brightness-0 invert" />
              </div>
              <p className="text-gray-300 mb-4">
                Sistema completo para gestão de clínicas e consultórios médicos.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">t</span>
                </div>
                <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Recursos</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Integrações</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Sobre nós</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Imprensa</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Central de ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Donee. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm">Termos de uso</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm">Política de privacidade</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;