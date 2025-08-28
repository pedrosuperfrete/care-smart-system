import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, MessageSquare, BarChart3, Users, Clock, Shield, Zap, Star, Phone, Mail, MapPin, Stethoscope, FileText, DollarSign, TrendingUp, UserPlus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/app/auth");
  };

  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Agendamento online com confirmação automática via WhatsApp",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Stethoscope,
      title: "Prontuários Digitais",
      description: "Prontuários seguros, organizados e sempre acessíveis",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: DollarSign,
      title: "Controle Financeiro",
      description: "Gestão completa de pagamentos e emissão de recibos",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Insights valiosos para crescer seu negócio",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integrado",
      description: "Comunicação automática com seus pacientes",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Controle completo de profissionais e permissões",
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumente seu faturamento",
      description: "Até 40% mais consultas com agenda otimizada"
    },
    {
      icon: Clock,
      title: "Economize tempo",
      description: "3 horas por dia economizadas em tarefas administrativas"
    },
    {
      icon: Shield,
      title: "Segurança total",
      description: "Dados protegidos e conformidade com LGPD"
    },
    {
      icon: Heart,
      title: "Foque no que importa",
      description: "Mais tempo para cuidar dos seus pacientes"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Carlos Silva",
      specialty: "Cardiologista",
      content: "Desde que comecei a usar o Donee, meu faturamento aumentou 35% e tenho muito mais tempo para os pacientes.",
      avatar: "CS"
    },
    {
      name: "Dra. Maria Santos",
      specialty: "Pediatra",
      content: "A organização dos prontuários e a agenda inteligente revolucionaram minha prática médica.",
      avatar: "MS"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" alt="Donee" className="h-8" />
              <span className="text-xl font-bold text-foreground">Donee</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
              <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
              <a href="#depoimentos" className="text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
              <a href="#contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin}>Entrar</Button>
              <Button onClick={handleLogin}>Começar grátis</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              O futuro da gestão
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                médica chegou
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Sistema completo para clínicas e consultórios que querem crescer, 
              automatizar processos e focar no que realmente importa: cuidar dos pacientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4" onClick={handleLogin}>
                Começar teste grátis
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Ver demonstração
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✓ 14 dias grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
            </p>
          </div>
          
          {/* Platform Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border">
              <div className="bg-background rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Dashboard Donee</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pacientes hoje</p>
                        <p className="text-2xl font-bold text-foreground">24</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Faturamento hoje</p>
                        <p className="text-2xl font-bold text-foreground">R$ 4.800</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Próxima consulta</p>
                        <p className="text-2xl font-bold text-foreground">14:30</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pare de usar sistemas separados. Nossa plataforma integrada oferece todas as ferramentas 
              que sua clínica precisa para crescer e prosperar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Integration */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Assistente WhatsApp
                <span className="block text-green-600">100% Automatizado</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Seus pacientes recebem confirmações automáticas, lembretes personalizados 
                e podem reagendar consultas direto pelo WhatsApp. Tudo sem você precisar fazer nada.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Confirmação automática de consultas",
                  "Lembretes 24h e 2h antes",
                  "Reagendamento pelo WhatsApp",
                  "Coleta de feedback automática",
                  "Redução de 80% nos no-shows"
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                Ativar WhatsApp
              </Button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border max-w-sm mx-auto">
                <div className="bg-green-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Donee Bot</span>
                      <p className="text-xs text-gray-500">online agora</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <p className="text-sm text-gray-800">Olá Maria! 👋</p>
                      <p className="text-sm text-gray-800 mt-1">Sua consulta com Dr. João está confirmada para amanhã às 14:00h.</p>
                      <p className="text-xs text-gray-500 mt-2">Hoje 10:30 ✓✓</p>
                    </div>
                    <div className="bg-green-500 text-white rounded-2xl p-4 ml-8">
                      <p className="text-sm">Perfeito! Obrigada pelo lembrete ✓</p>
                      <p className="text-xs text-green-100 mt-1">Hoje 10:32 ✓✓</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <p className="text-sm text-gray-800">Ótimo! Se precisar reagendar, é só responder aqui. 😊</p>
                      <p className="text-xs text-gray-500 mt-2">Hoje 10:33 ✓✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Resultados que nossos clientes alcançam
            </h2>
            <p className="text-xl text-muted-foreground">
              Números reais de profissionais que transformaram suas práticas com o Donee
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              O que dizem nossos clientes
            </h2>
            <p className="text-xl text-muted-foreground">
              Histórias reais de profissionais que transformaram suas práticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para revolucionar sua clínica?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se a centenas de profissionais que já transformaram suas práticas médicas. 
            Teste grátis por 14 dias, sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4" onClick={handleLogin}>
              Começar teste grátis
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
              Falar com especialista
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/90">
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5" />
              <span>14 dias grátis</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Sem taxa de setup</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="py-16 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" alt="Donee" className="h-8" />
                <span className="text-xl font-bold text-foreground">Donee</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                O sistema de gestão mais completo para clínicas e consultórios médicos. 
                Automatize processos, aumente sua eficiência e foque no que realmente importa.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>(11) 99999-9999</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>contato@donee.com.br</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2">
                <li><a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrações</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Donee. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Política de Privacidade
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                LGPD
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;