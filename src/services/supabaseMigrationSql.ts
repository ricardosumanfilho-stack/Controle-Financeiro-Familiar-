export const SUPABASE_MIGRATION_SQL = `-- ==============================================================================
-- MIGRATION: 20260903000001_create_finance_schema.sql
-- Descrição: Criação completa das tabelas de Gestão Financeira Familiar no Supabase
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função utilitária para atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. TABELA: app_settings (Configurações Gerais, Salários, Metas, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. TABELA: credit_cards (Cartões de Crédito)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  person TEXT NOT NULL,
  closing_day INTEGER NOT NULL DEFAULT 20,
  due_day INTEGER NOT NULL DEFAULT 27,
  monthly_limit_goal NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
  color TEXT NOT NULL DEFAULT '#6366f1',
  brand TEXT DEFAULT 'Visa/Mastercard',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TABELA: installment_purchases (Compras Parceladas Ativas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS installment_purchases (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  person TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  installment_amount NUMERIC(12, 2) NOT NULL,
  current_installment INTEGER DEFAULT 1,
  total_installments INTEGER NOT NULL,
  remaining_installments INTEGER,
  purchase_date DATE,
  first_due_date TEXT,
  last_due_date TEXT,
  category TEXT NOT NULL DEFAULT 'Cartão',
  status TEXT NOT NULL DEFAULT 'ativa',
  early_paid_installments INTEGER DEFAULT 0,
  early_paid_date DATE,
  card_id TEXT REFERENCES credit_cards(id) ON DELETE SET NULL,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installment_purchases_person ON installment_purchases(person);
CREATE INDEX IF NOT EXISTS idx_installment_purchases_card_id ON installment_purchases(card_id);

-- ------------------------------------------------------------------------------
-- 5. TABELA: card_subscriptions (Assinaturas e Gastos Fixos de Cartão)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  person TEXT NOT NULL,
  card_id TEXT REFERENCES credit_cards(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Assinaturas',
  billing_day INTEGER,
  start_month TEXT,
  end_month TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TABELA: transactions (Transações / Lançamentos Financeiros)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  person TEXT NOT NULL,
  date DATE NOT NULL,
  competence_month TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_reimbursable BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT NOT NULL,
  account_or_pot TEXT,
  notes TEXT,
  card_id TEXT REFERENCES credit_cards(id) ON DELETE SET NULL,
  purchase_date DATE,
  installment_info JSONB,
  subscription_id TEXT REFERENCES card_subscriptions(id) ON DELETE SET NULL,
  is_card_subscription BOOLEAN DEFAULT false,
  grocery_trip_id TEXT,
  cofrinho_movement_id TEXT,
  cofrinho_id TEXT,
  investment_contribution_id TEXT,
  emergency_contribution_id TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_competence_month ON transactions(competence_month);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_person ON transactions(person);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ------------------------------------------------------------------------------
-- 7. TABELA: grocery_trips (Compras de Supermercado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grocery_trips (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  store_name TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  person TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  trip_type TEXT DEFAULT 'semanal',
  week_number INTEGER,
  is_extraordinary BOOLEAN DEFAULT false,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  promo_savings NUMERIC(12, 2) DEFAULT 0,
  cpf_app_savings NUMERIC(12, 2) DEFAULT 0,
  card_savings NUMERIC(12, 2) DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TABELA: grocery_month_plans (Planejamento Mensal de Supermercado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grocery_month_plans (
  month_key TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'opcao_a',
  total_weeks INTEGER NOT NULL DEFAULT 4,
  monthly_goal NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
  ricardo_weekly_planned NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  ricardo_weeks JSONB NOT NULL DEFAULT '[]'::jsonb,
  ellen_planning_type TEXT NOT NULL DEFAULT 'mensal',
  ellen_monthly_planned NUMERIC(12, 2) NOT NULL DEFAULT 400.00,
  ellen_weekly_planned NUMERIC(12, 2) DEFAULT 100.00,
  ellen_actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ellen_completed BOOLEAN NOT NULL DEFAULT false,
  ellen_weeks JSONB DEFAULT '[]'::jsonb,
  carry_over_enabled BOOLEAN DEFAULT true,
  ellen_carry_over_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: shopping_lists (Listas de Compras de Supermercado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'semanal',
  month_key TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_total NUMERIC(12, 2) DEFAULT 0.00,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. TABELA: stock_items (Despensa e Controle de Estoque)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_items (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  category TEXT NOT NULL,
  category_group TEXT,
  last_purchase_date DATE,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  estimated_duration_days INTEGER NOT NULL DEFAULT 30,
  next_purchase_predicted_date DATE,
  last_price_paid NUMERIC(12, 2),
  store TEXT NOT NULL DEFAULT 'Supermercado',
  status TEXT NOT NULL DEFAULT 'suficiente',
  is_from_cesta_basica BOOLEAN DEFAULT false,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. TABELA: cesta_basica_records (Registros da Cesta Básica da Ellen)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cesta_basica_records (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  received_by TEXT NOT NULL DEFAULT 'Ellen',
  estimated_savings NUMERIC(12, 2) NOT NULL DEFAULT 250.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. TABELA: cofrinhos (Contas de Investimento / Cofrinhos com CDI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cofrinhos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  objective TEXT,
  description TEXT,
  person TEXT NOT NULL DEFAULT 'Família',
  institution TEXT NOT NULL,
  application_type TEXT NOT NULL,
  yield_type TEXT NOT NULL DEFAULT 'cdi_100',
  cdi_percentage NUMERIC(6, 2) DEFAULT 100.00,
  custom_annual_rate NUMERIC(6, 2),
  initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  monthly_yield NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  accumulated_yield NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gross_yield NUMERIC(12, 2) DEFAULT 0.00,
  tax_and_fees NUMERIC(12, 2) DEFAULT 0.00,
  start_date DATE,
  target_amount NUMERIC(12, 2),
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  color TEXT NOT NULL DEFAULT '#10b981',
  icon_name TEXT,
  sub_category_purpose TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. TABELA: cofrinho_movements (Movimentações: Aportes, Retiradas e Rendimentos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cofrinho_movements (
  id TEXT PRIMARY KEY,
  cofrinho_id TEXT NOT NULL REFERENCES cofrinhos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  person TEXT NOT NULL,
  gross_amount NUMERIC(12, 2),
  tax_amount NUMERIC(12, 2),
  is_extraordinary_share BOOLEAN DEFAULT false,
  sub_purpose TEXT,
  destination_cofrinho_id TEXT REFERENCES cofrinhos(id) ON DELETE SET NULL,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  emergency_contribution_id TEXT,
  investment_contribution_id TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. TABELA: emergency_contributions (Aportes da Reserva de Emergência)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contributions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  person TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  institution TEXT NOT NULL,
  is_extraordinary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'realizado',
  transaction_id TEXT,
  cofrinho_movement_id TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. TABELA: investment_contributions (Aportes de Investimento R$ 500 por Pessoa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_contributions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  person TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  target_asset TEXT NOT NULL,
  status TEXT DEFAULT 'realizado',
  transaction_id TEXT,
  cofrinho_movement_id TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. TABELA: renovation_expenses (Reforma da Casa e Créditos com o Proprietário)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS renovation_expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  paid_by TEXT NOT NULL,
  receipt_description TEXT,
  owner_authorized TEXT NOT NULL DEFAULT 'pendente',
  requested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  accepted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  under_analysis_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  already_compensated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. TABELA: monthly_closing_checklists (Checklist de Fechamento Mensal)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_closing_checklists (
  month_key TEXT PRIMARY KEY,
  checked_items JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 18. TRIGGERS: Atualização Automática de 'updated_at'
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'app_settings', 'credit_cards', 'installment_purchases', 'card_subscriptions',
        'transactions', 'grocery_trips', 'grocery_month_plans', 'shopping_lists',
        'stock_items', 'cesta_basica_records', 'cofrinhos', 'cofrinho_movements',
        'emergency_contributions', 'investment_contributions', 'renovation_expenses',
        'monthly_closing_checklists'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 19. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_month_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cesta_basica_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofrinhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofrinho_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_closing_checklists ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'app_settings', 'credit_cards', 'installment_purchases', 'card_subscriptions',
        'transactions', 'grocery_trips', 'grocery_month_plans', 'shopping_lists',
        'stock_items', 'cesta_basica_records', 'cofrinhos', 'cofrinho_movements',
        'emergency_contributions', 'investment_contributions', 'renovation_expenses',
        'monthly_closing_checklists'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Allow all for anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END;
$$;
`;
