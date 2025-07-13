import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface DadosRelatorio {
  tipo: string;
  periodo: string;
  inicioPersonalizado?: Date;
  fimPersonalizado?: Date;
}

export const useExportarRelatorios = () => {
  const { user } = useAuth();

  const obterDadosRelatorio = async (dados: DadosRelatorio) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Buscar profissional atual
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

      if (!profissional) {
        toast({
          title: "Erro",
          description: "Profissional não encontrado",
          variant: "destructive"
        });
        return null;
      }

      // Definir período baseado na seleção
      let dataInicio: Date;
      let dataFim: Date;

      if (dados.periodo === 'personalizado' && dados.inicioPersonalizado && dados.fimPersonalizado) {
        dataInicio = dados.inicioPersonalizado;
        dataFim = dados.fimPersonalizado;
      } else {
        const hoje = new Date();
        switch (dados.periodo) {
          case 'ultima-semana':
            dataInicio = new Date(hoje.setDate(hoje.getDate() - 7));
            dataFim = new Date();
            break;
          case 'ultimo-mes':
            dataInicio = new Date(hoje.setMonth(hoje.getMonth() - 1));
            dataFim = new Date();
            break;
          case 'ultimo-trimestre':
            dataInicio = new Date(hoje.setMonth(hoje.getMonth() - 3));
            dataFim = new Date();
            break;
          default:
            dataInicio = new Date(hoje.setMonth(hoje.getMonth() - 1));
            dataFim = new Date();
        }
      }

      // Buscar dados baseado no tipo de relatório
      switch (dados.tipo) {
        case 'consultas':
          return await gerarRelatorioConsultas(profissional.id, dataInicio, dataFim);
        case 'pacientes':
          return await gerarRelatorioPacientes(profissional.id, dataInicio, dataFim);
        case 'financeiro':
          return await gerarRelatorioFinanceiro(profissional.id, dataInicio, dataFim);
        case 'produtividade':
          return await gerarRelatorioProdutividade(profissional.id, dataInicio, dataFim);
        default:
          return null;
      }
    } catch (error) {
      console.error('Erro ao obter dados do relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
      return null;
    }
  };

  const gerarRelatorioConsultas = async (profissionalId: string, dataInicio: Date, dataFim: Date) => {
    const { data: consultas } = await supabase
      .from('agendamentos')
      .select(`
        *,
        pacientes (nome, cpf, telefone),
        pagamentos!fk_pagamento_agendamento (valor_total, status)
      `)
      .eq('profissional_id', profissionalId)
      .gte('data_inicio', dataInicio.toISOString())
      .lte('data_inicio', dataFim.toISOString())
      .order('data_inicio', { ascending: false });

    return {
      titulo: 'Relatório de Consultas',
      periodo: `${format(dataInicio, 'dd/MM/yyyy')} - ${format(dataFim, 'dd/MM/yyyy')}`,
      dados: consultas?.map(consulta => ({
        'Data': format(new Date(consulta.data_inicio), 'dd/MM/yyyy HH:mm'),
        'Paciente': consulta.pacientes?.nome || 'N/A',
        'CPF': consulta.pacientes?.cpf || 'N/A',
        'Telefone': consulta.pacientes?.telefone || 'N/A',
        'Tipo de Serviço': consulta.tipo_servico,
        'Status': consulta.status,
        'Valor': consulta.valor ? `R$ ${Number(consulta.valor).toFixed(2)}` : 'N/A',
        'Status Pagamento': consulta.pagamentos?.[0]?.status || 'Não informado',
        'Observações': consulta.observacoes || ''
      })) || []
    };
  };

  const gerarRelatorioPacientes = async (profissionalId: string, dataInicio: Date, dataFim: Date) => {
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select(`
        id,
        profissional_id,
        data_inicio,
        status,
        pacientes (*)
      `)
      .eq('profissional_id', profissionalId)
      .gte('data_inicio', dataInicio.toISOString())
      .lte('data_inicio', dataFim.toISOString());

    // Agrupar consultas por paciente
    const pacientesAgrupados = agendamentos?.reduce((acc: any, agendamento) => {
      const paciente = agendamento.pacientes;
      if (!paciente) return acc;
      
      if (!acc[paciente.id]) {
        acc[paciente.id] = {
          ...paciente,
          totalConsultas: 0,
          consultasRealizadas: 0,
          ultimaConsulta: null
        };
      }
      
      acc[paciente.id].totalConsultas++;
      if (agendamento.status === 'realizado') {
        acc[paciente.id].consultasRealizadas++;
      }
      
      if (!acc[paciente.id].ultimaConsulta || 
          new Date(agendamento.data_inicio) > new Date(acc[paciente.id].ultimaConsulta)) {
        acc[paciente.id].ultimaConsulta = agendamento.data_inicio;
      }
      
      return acc;
    }, {}) || {};

    return {
      titulo: 'Relatório de Pacientes',
      periodo: `${format(dataInicio, 'dd/MM/yyyy')} - ${format(dataFim, 'dd/MM/yyyy')}`,
      dados: Object.values(pacientesAgrupados).map((paciente: any) => ({
        'Nome': paciente.nome,
        'CPF': paciente.cpf,
        'Email': paciente.email || 'N/A',
        'Telefone': paciente.telefone || 'N/A',
        'Data Nascimento': paciente.data_nascimento ? 
          format(new Date(paciente.data_nascimento), 'dd/MM/yyyy') : 'N/A',
        'Total Consultas': paciente.totalConsultas,
        'Consultas Realizadas': paciente.consultasRealizadas,
        'Última Consulta': paciente.ultimaConsulta ? 
          format(new Date(paciente.ultimaConsulta), 'dd/MM/yyyy') : 'N/A',
        'Risco': paciente.risco || 'baixo',
        'Observações': paciente.observacoes || ''
      }))
    };
  };

  const gerarRelatorioFinanceiro = async (profissionalId: string, dataInicio: Date, dataFim: Date) => {
    const { data: pagamentos } = await supabase
      .from('pagamentos')
      .select(`
        *,
        agendamentos!inner (
          profissional_id,
          data_inicio,
          tipo_servico,
          pacientes (nome)
        )
      `)
      .eq('agendamentos.profissional_id', profissionalId)
      .gte('agendamentos.data_inicio', dataInicio.toISOString())
      .lte('agendamentos.data_inicio', dataFim.toISOString());

    const totalRecebido = pagamentos?.filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + Number(p.valor_pago), 0) || 0;
    
    const totalPendente = pagamentos?.filter(p => p.status === 'pendente')
      .reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

    return {
      titulo: 'Relatório Financeiro',
      periodo: `${format(dataInicio, 'dd/MM/yyyy')} - ${format(dataFim, 'dd/MM/yyyy')}`,
      resumo: {
        'Total Recebido': `R$ ${totalRecebido.toFixed(2)}`,
        'Total Pendente': `R$ ${totalPendente.toFixed(2)}`,
        'Total Geral': `R$ ${(totalRecebido + totalPendente).toFixed(2)}`
      },
      dados: pagamentos?.map(pagamento => ({
        'Data Consulta': format(new Date((pagamento as any).agendamentos.data_inicio), 'dd/MM/yyyy'),
        'Paciente': (pagamento as any).agendamentos.pacientes?.nome || 'N/A',
        'Serviço': (pagamento as any).agendamentos.tipo_servico,
        'Valor Total': `R$ ${Number(pagamento.valor_total).toFixed(2)}`,
        'Valor Pago': `R$ ${Number(pagamento.valor_pago).toFixed(2)}`,
        'Forma Pagamento': pagamento.forma_pagamento,
        'Status': pagamento.status,
        'Data Pagamento': pagamento.data_pagamento ? 
          format(new Date(pagamento.data_pagamento), 'dd/MM/yyyy') : 'N/A',
        'Data Vencimento': pagamento.data_vencimento ? 
          format(new Date(pagamento.data_vencimento), 'dd/MM/yyyy') : 'N/A'
      })) || []
    };
  };

  const gerarRelatorioProdutividade = async (profissionalId: string, dataInicio: Date, dataFim: Date) => {
    const { data: consultas } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissionalId)
      .gte('data_inicio', dataInicio.toISOString())
      .lte('data_inicio', dataFim.toISOString());

    const totalConsultas = consultas?.length || 0;
    const consultasRealizadas = consultas?.filter(c => c.status === 'realizado').length || 0;
    const consultasCanceladas = consultas?.filter(c => c.status === 'faltou').length || 0;
    const taxaComparecimento = totalConsultas > 0 ? (consultasRealizadas / totalConsultas) * 100 : 0;

    // Agrupar por dia para ver produtividade diária
    const produtividadeDiaria = consultas?.reduce((acc: any, consulta) => {
      const dia = format(new Date(consulta.data_inicio), 'yyyy-MM-dd');
      if (!acc[dia]) {
        acc[dia] = { total: 0, realizadas: 0, canceladas: 0 };
      }
      acc[dia].total++;
      if (consulta.status === 'realizado') acc[dia].realizadas++;
      if (consulta.status === 'faltou') acc[dia].canceladas++;
      return acc;
    }, {}) || {};

    return {
      titulo: 'Relatório de Produtividade',
      periodo: `${format(dataInicio, 'dd/MM/yyyy')} - ${format(dataFim, 'dd/MM/yyyy')}`,
      resumo: {
        'Total de Consultas': totalConsultas,
        'Consultas Realizadas': consultasRealizadas,
        'Consultas Canceladas': consultasCanceladas,
        'Taxa de Comparecimento': `${taxaComparecimento.toFixed(1)}%`
      },
      dados: Object.entries(produtividadeDiaria).map(([dia, dados]: [string, any]) => ({
        'Data': format(new Date(dia), 'dd/MM/yyyy'),
        'Total Consultas': dados.total,
        'Consultas Realizadas': dados.realizadas,
        'Consultas Canceladas': dados.canceladas,
        'Taxa Comparecimento': `${dados.total > 0 ? ((dados.realizadas / dados.total) * 100).toFixed(1) : 0}%`
      }))
    };
  };

  const exportarCSV = async (dados: DadosRelatorio) => {
    try {
      const relatorio = await obterDadosRelatorio(dados);
      if (!relatorio) return;

      // Converter dados para CSV
      const headers = Object.keys(relatorio.dados[0] || {});
      const csvContent = [
        `# ${relatorio.titulo}`,
        `# Período: ${relatorio.periodo}`,
        '',
        headers.join(','),
        ...relatorio.dados.map((linha: any) => 
          headers.map(header => `"${linha[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${relatorio.titulo.replace(/ /g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: "Relatório CSV exportado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar CSV",
        variant: "destructive"
      });
    }
  };

  const exportarPDF = async (dados: DadosRelatorio) => {
    try {
      const relatorio = await obterDadosRelatorio(dados);
      if (!relatorio) return;

      // Para PDF, vamos criar um HTML simples e usar window.print()
      const htmlContent = `
        <html>
          <head>
            <title>${relatorio.titulo}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #264c43; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .resumo { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>${relatorio.titulo}</h1>
            <p><strong>Período:</strong> ${relatorio.periodo}</p>
            
            ${(relatorio as any).resumo ? `
              <div class="resumo">
                <h3>Resumo</h3>
                ${Object.entries((relatorio as any).resumo).map(([key, value]) => 
                  `<p><strong>${key}:</strong> ${value}</p>`
                ).join('')}
              </div>
            ` : ''}
            
            <table>
              <thead>
                <tr>
                  ${Object.keys(relatorio.dados[0] || {}).map(header => 
                    `<th>${header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${relatorio.dados.map((linha: any) => 
                  `<tr>
                    ${Object.values(linha).map(value => 
                      `<td>${value || ''}</td>`
                    ).join('')}
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: "Sucesso",
        description: "Relatório PDF enviado para impressão!"
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive"
      });
    }
  };

  return {
    exportarCSV,
    exportarPDF,
    obterDadosRelatorio
  };
};