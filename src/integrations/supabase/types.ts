export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string
          confirmado_pelo_paciente: boolean | null
          criado_em: string
          data_fim: string
          data_inicio: string
          id: string
          observacoes: string | null
          paciente_id: string
          pagamento_id: string | null
          profissional_id: string
          status: Database["public"]["Enums"]["status_agendamento"] | null
          tipo_servico: string
          valor: number | null
        }
        Insert: {
          atualizado_em?: string
          confirmado_pelo_paciente?: boolean | null
          criado_em?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          pagamento_id?: string | null
          profissional_id: string
          status?: Database["public"]["Enums"]["status_agendamento"] | null
          tipo_servico: string
          valor?: number | null
        }
        Update: {
          atualizado_em?: string
          confirmado_pelo_paciente?: boolean | null
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          pagamento_id?: string | null
          profissional_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"] | null
          tipo_servico?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          cnpj: string
          conta_bancaria: string | null
          criado_em: string
          endereco: string | null
          id: string
          nome: string
          pix_chave: string | null
        }
        Insert: {
          cnpj: string
          conta_bancaria?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          nome: string
          pix_chave?: string | null
        }
        Update: {
          cnpj?: string
          conta_bancaria?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          nome?: string
          pix_chave?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo_url: string
          assinado_digital: boolean | null
          criado_em: string
          id: string
          modelo_id: string | null
          nome_arquivo: string
          paciente_id: string
          profissional_id: string | null
          status_assinatura: string | null
          tipo: string
        }
        Insert: {
          arquivo_url: string
          assinado_digital?: boolean | null
          criado_em?: string
          id?: string
          modelo_id?: string | null
          nome_arquivo: string
          paciente_id: string
          profissional_id?: string | null
          status_assinatura?: string | null
          tipo: string
        }
        Update: {
          arquivo_url?: string
          assinado_digital?: boolean | null
          criado_em?: string
          id?: string
          modelo_id?: string | null
          nome_arquivo?: string
          paciente_id?: string
          profissional_id?: string | null
          status_assinatura?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_acesso: {
        Row: {
          acao: string
          detalhes: string | null
          id: string
          ip_address: unknown | null
          modulo: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acao: string
          detalhes?: string | null
          id?: string
          ip_address?: unknown | null
          modulo: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          detalhes?: string | null
          id?: string
          ip_address?: unknown | null
          modulo?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_acesso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_documentos: {
        Row: {
          cabecalho_clinica: string | null
          clinica_id: string | null
          conteudo_html: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          cabecalho_clinica?: string | null
          clinica_id?: string | null
          conteudo_html: string
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          cabecalho_clinica?: string | null
          clinica_id?: string | null
          conteudo_html?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_documentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_prontuarios: {
        Row: {
          campos_json: Json | null
          clinica_id: string | null
          criado_em: string
          especialidade: string | null
          id: string
          nome: string
        }
        Insert: {
          campos_json?: Json | null
          clinica_id?: string | null
          criado_em?: string
          especialidade?: string | null
          id?: string
          nome: string
        }
        Update: {
          campos_json?: Json | null
          clinica_id?: string | null
          criado_em?: string
          especialidade?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_prontuarios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          criado_em: string
          data_emissao: string | null
          id: string
          link_nf: string | null
          numero_nf: string | null
          paciente_id: string
          pagamento_id: string
          status_emissao:
            | Database["public"]["Enums"]["status_emissao_nf"]
            | null
          valor_nf: number | null
        }
        Insert: {
          criado_em?: string
          data_emissao?: string | null
          id?: string
          link_nf?: string | null
          numero_nf?: string | null
          paciente_id: string
          pagamento_id: string
          status_emissao?:
            | Database["public"]["Enums"]["status_emissao_nf"]
            | null
          valor_nf?: number | null
        }
        Update: {
          criado_em?: string
          data_emissao?: string | null
          id?: string
          link_nf?: string | null
          numero_nf?: string | null
          paciente_id?: string
          pagamento_id?: string
          status_emissao?:
            | Database["public"]["Enums"]["status_emissao_nf"]
            | null
          valor_nf?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          clinica_id: string
          cpf: string
          criado_em: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          risco: Database["public"]["Enums"]["risco_paciente"] | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          clinica_id: string
          cpf: string
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          risco?: Database["public"]["Enums"]["risco_paciente"] | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          clinica_id?: string
          cpf?: string
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          risco?: Database["public"]["Enums"]["risco_paciente"] | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string
          atualizado_em: string
          conciliar_auto: boolean | null
          criado_em: string
          data_pagamento: string | null
          data_vencimento: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          gateway_id: string | null
          id: string
          link_pagamento: string | null
          parcelado: boolean | null
          parcelas_recebidas: number | null
          parcelas_totais: number | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          valor_pago: number
          valor_total: number
        }
        Insert: {
          agendamento_id: string
          atualizado_em?: string
          conciliar_auto?: boolean | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          gateway_id?: string | null
          id?: string
          link_pagamento?: string | null
          parcelado?: boolean | null
          parcelas_recebidas?: number | null
          parcelas_totais?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor_pago: number
          valor_total: number
        }
        Update: {
          agendamento_id?: string
          atualizado_em?: string
          conciliar_auto?: boolean | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          gateway_id?: string | null
          id?: string
          link_pagamento?: string | null
          parcelado?: boolean | null
          parcelas_recebidas?: number | null
          parcelas_totais?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          assinatura_digital: string | null
          ativo: boolean
          atualizado_em: string
          clinica_id: string | null
          criado_em: string
          crm_cro: string
          especialidade: string
          id: string
          nome: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          assinatura_digital?: string | null
          ativo?: boolean
          atualizado_em?: string
          clinica_id?: string | null
          criado_em?: string
          crm_cro: string
          especialidade: string
          id?: string
          nome: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          assinatura_digital?: string | null
          ativo?: boolean
          atualizado_em?: string
          clinica_id?: string | null
          criado_em?: string
          crm_cro?: string
          especialidade?: string
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissionais_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuarios: {
        Row: {
          agendamento_id: string | null
          conteudo: string
          criado_em: string
          editado_por: string | null
          id: string
          paciente_id: string
          profissional_id: string
          template_id: string | null
          ultima_edicao: string
        }
        Insert: {
          agendamento_id?: string | null
          conteudo: string
          criado_em?: string
          editado_por?: string | null
          id?: string
          paciente_id: string
          profissional_id: string
          template_id?: string | null
          ultima_edicao?: string
        }
        Update: {
          agendamento_id?: string | null
          conteudo?: string
          criado_em?: string
          editado_por?: string | null
          id?: string
          paciente_id?: string
          profissional_id?: string
          template_id?: string | null
          ultima_edicao?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_editado_por_fkey"
            columns: ["editado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "modelos_prontuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          id: string
          senha_hash: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email: string
          id?: string
          senha_hash: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          id?: string
          senha_hash?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      forma_pagamento: "pix" | "cartao" | "dinheiro" | "link"
      risco_paciente: "baixo" | "medio" | "alto"
      status_agendamento: "pendente" | "confirmado" | "realizado" | "faltou"
      status_emissao_nf: "emitida" | "pendente" | "erro"
      status_pagamento: "pendente" | "pago" | "vencido" | "estornado"
      tipo_usuario: "admin" | "profissional" | "recepcionista"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      forma_pagamento: ["pix", "cartao", "dinheiro", "link"],
      risco_paciente: ["baixo", "medio", "alto"],
      status_agendamento: ["pendente", "confirmado", "realizado", "faltou"],
      status_emissao_nf: ["emitida", "pendente", "erro"],
      status_pagamento: ["pendente", "pago", "vencido", "estornado"],
      tipo_usuario: ["admin", "profissional", "recepcionista"],
    },
  },
} as const
