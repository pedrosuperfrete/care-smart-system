import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useCreateTipoServico, useTiposServicos } from './useTiposServicos';
import { supabase } from '@/integrations/supabase/client';

export function useMigrarServicos() {
  const { profissional } = useAuth();
  const { data: tiposServicos = [] } = useTiposServicos();
  const createTipoServico = useCreateTipoServico();

  useEffect(() => {
    const migrarServicosProfissional = async () => {
      if (!profissional?.id) return;

      // Verificar se já existem tipos de serviços para este profissional
      const tiposExistentes = tiposServicos.filter(
        tipo => tipo.profissional_id === profissional.id
      );

      if (tiposExistentes.length > 0) return; // Já migrado

      try {
        // Buscar dados antigos do profissional
        const { data: profissionalData, error } = await supabase
          .from('profissionais')
          .select('servicos_precos')
          .eq('id', profissional.id)
          .single();

        if (error || !profissionalData?.servicos_precos) return;

        const servicosAntigos = Array.isArray(profissionalData.servicos_precos) 
          ? profissionalData.servicos_precos 
          : [];

        // Migrar cada serviço para a nova tabela
        for (const servicoRaw of servicosAntigos) {
          const servico = servicoRaw as any; // Cast para contornar tipagem do JSON
          if (servico?.nome && typeof servico.nome === 'string' && servico.nome.trim()) {
            const precoStr = servico.preco ? 
              (typeof servico.preco === 'string' ? servico.preco : servico.preco.toString()) : 
              undefined;
            
            const preco = precoStr ? 
              parseFloat(precoStr.replace(',', '.')) : 
              undefined;

            await createTipoServico.mutateAsync({
              nome: servico.nome.trim(),
              preco: (preco && !isNaN(preco)) ? preco : undefined,
              profissional_id: profissional.id,
              clinica_id: profissional.clinica_id
            });
          }
        }
      } catch (error) {
        console.error('Erro ao migrar serviços:', error);
      }
    };

    migrarServicosProfissional();
  }, [profissional?.id, tiposServicos.length, createTipoServico]);
}