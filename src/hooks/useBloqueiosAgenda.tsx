import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface BloqueioAgenda {
  id: string;
  profissional_id: string;
  data_inicio: string;
  data_fim: string;
  titulo: string;
  descricao?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateBloqueioData {
  data_inicio: string;
  data_fim: string;
  titulo: string;
  descricao?: string;
}

export const useBloqueiosAgenda = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["bloqueios-agenda"],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .select("*")
        .order("data_inicio", { ascending: true });
      
      if (error) throw error;
      return data as BloqueioAgenda[];
    },
    enabled: !!user,
  });
};

export const useCreateBloqueio = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (bloqueioData: CreateBloqueioData) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      // Buscar o profissional atual
      const { data: profissional, error: profError } = await supabase
        .from("profissionais")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (profError || !profissional) {
        throw new Error("Profissional não encontrado");
      }
      
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .insert([
          {
            ...bloqueioData,
            profissional_id: profissional.id,
          },
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-agenda"] });
      toast.success("Bloqueio criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar bloqueio:", error);
      toast.error("Erro ao criar bloqueio");
    },
  });
};

export const useUpdateBloqueio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...bloqueioData }: BloqueioAgenda) => {
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .update(bloqueioData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-agenda"] });
      toast.success("Bloqueio atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar bloqueio:", error);
      toast.error("Erro ao atualizar bloqueio");
    },
  });
};

export const useDeleteBloqueio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bloqueios_agenda")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-agenda"] });
      toast.success("Bloqueio excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir bloqueio:", error);
      toast.error("Erro ao excluir bloqueio");
    },
  });
};