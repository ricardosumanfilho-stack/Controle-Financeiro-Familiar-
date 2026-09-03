# Integração Supabase - Gestão Financeira Familiar

Este diretório contém os scripts de **Migrations SQL** e as instruções completas para integrar o aplicativo ao Supabase.

---

## 🚀 Como Aplicar as Migrations no Supabase

### Passo 1: Obter seu Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Crie um novo projeto (ou use um existente) e anote a senha do banco PostgreSQL.

### Passo 2: Executar a Migration no SQL Editor
1. No painel do Supabase, clique no menu lateral **SQL Editor** (ícone `>_`).
2. Clique em **+ New query**.
3. Abra o arquivo `supabase/migrations/20260903000001_create_finance_schema.sql` (ou copie pelo botão de cópia dentro do modal do app).
4. Cole todo o conteúdo SQL no editor e clique em **Run** (ou `Ctrl + Enter`).
5. Todas as 16 tabelas, índices e políticas de segurança RLS serão criadas instantaneamente!

### Passo 3: Configurar as Variáveis de Ambiente
1. No Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie:
   - **Project URL** (ex: `https://xyzproject.supabase.co`)
   - **Project API Keys -> `anon` / `public`** (chave pública do cliente)
3. No painel de Configurações/Segredos do AI Studio ou no seu arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

---

## 📂 Estrutura das Tabelas Criadas

| Tabela | Descrição |
| :--- | :--- |
| `app_settings` | Configurações salariais (Ricardo e Ellen), metas da reserva e aluguel |
| `credit_cards` | Cartões de crédito, limites, dias de corte e vencimento |
| `installment_purchases` | Compras parceladas com controle de parcelas restantes |
| `card_subscriptions` | Assinaturas mensais nos cartões (seguro, streaming, etc.) |
| `transactions` | Todas as receitas, despesas, investimentos e transferências |
| `grocery_trips` | Compras de supermercado com lista de produtos e economia |
| `grocery_month_plans` | Planejamento semanal/mensal de supermercado |
| `shopping_lists` | Listas de compras semanais com status de itens |
| `stock_items` | Estoque e despensa familiar com cálculo de reposição |
| `cesta_basica_records` | Registro da cesta básica recebida pela Ellen |
| `cofrinhos` | Contas de investimento com rendimento CDI e metas |
| `cofrinho_movements` | Aportes, retiradas e rendimentos dos cofrinhos |
| `emergency_contributions` | Histórico de aportes na Reserva de Emergência |
| `investment_contributions` | Histórico dos aportes fixos (R$ 500 / pessoa) |
| `renovation_expenses` | Despesas da reforma e compensações com proprietário |
| `monthly_closing_checklists` | Checklist e status de fechamento de cada mês |
