import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle, 
  Star,
  MessageCircle,
  Smartphone,
  ArrowRight,
  Crown
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Organize e gerencie todos os dados dos seus pacientes de forma segura e eficiente."
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Agende consultas, receba confirmações automáticas e evite conflitos de horário."
    },
    {
      icon: FileText,
      title: "Prontuários Digitais",
      description: "Crie e gerencie prontuários eletrônicos com templates personalizáveis."
    },
    {
      icon: CreditCard,
      title: "Controle Financeiro",
      description: "Acompanhe pagamentos, gere relatórios e mantenha suas finanças organizadas."
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Visualize dados importantes para tomar decisões estratégicas em sua clínica."
    },
    {
      icon: Shield,
      title: "Segurança LGPD",
      description: "Seus dados e de seus pacientes protegidos com a mais alta segurança."
    }
  ];

  const benefits = [
    "Redução de 70% no tempo administrativo",
    "Aumento de 40% na eficiência operacional", 
    "Diminuição de 85% no retrabalho",
    "Controle total sobre agenda e finanças",
    "Relatórios automáticos para tomada de decisão",
    "Segurança e conformidade com LGPD"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthClinic</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
            <a href="#precos" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <a href="/app/auth">Entrar</a>
            </Button>
            <Button asChild>
              <a href="/app/auth">Começar Grátis</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Cuidar de pessoas é <br />
              <span className="text-primary">sua missão.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Cuidar da burocracia é a nossa. Gerencie sua clínica com a plataforma mais completa do mercado.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-4" asChild>
                <a href="/app/auth">Começar Grátis</a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Agendar Demo
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              ✨ Grátis para até 3 pacientes • 🔒 Seguro e compatível com LGPD
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Para de abrir planilha, sonar no caderninho
            </h2>
            <p className="text-xl text-muted-foreground">
              ou tentar adivinhar quanto faturou.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Assistant Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Assistente no <br />
                <span className="text-primary">WhatsApp</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Receba notificações de novos agendamentos direto no seu WhatsApp
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Confirme consultas de forma rápida e prática
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Tenha lembretes automáticos para não perder nenhum compromisso
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <Smartphone className="w-64 h-64 text-primary/20" />
                <MessageCircle className="absolute top-16 left-16 w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Sabemos que você ama o que faz, mas...
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Liberar sua rotina do operacional é abrir espaço pra crescer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <a href="/app/auth">Começar Grátis Agora</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="max-w-4xl mx-auto p-8 text-center">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
              ))}
            </div>
            
            <blockquote className="text-2xl text-foreground mb-6 font-medium">
              "Transformou completamente a gestão da nossa clínica. Agora posso focar no que realmente importa: cuidar dos meus pacientes."
            </blockquote>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Dra. Ana Silva</p>
                <p className="text-muted-foreground">Clínica Vida Saudável</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Quanto vale ter a agenda cheia sem estresse?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Comece agora e sinta a diferença em 7 dias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild>
              <a href="/app/auth">
                Começar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">HealthClinic</span>
              </div>
              <p className="text-muted-foreground text-sm">
                A plataforma mais completa para gestão de clínicas de saúde.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Segurança</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">WhatsApp</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © 2024 HealthClinic. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}