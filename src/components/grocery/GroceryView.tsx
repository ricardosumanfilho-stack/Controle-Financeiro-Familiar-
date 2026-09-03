import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { GroceryTrip, Person } from '../../types';
import { formatCurrency, formatDateBR, formatMonthYearBR, getPersonBadgeColor } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
  TrendingDown,
  Info,
  DollarSign,
  CheckSquare,
  Square,
  Users,
} from 'lucide-react';

interface GroceryViewProps {
  onOpenNewGrocery: () => void;
  onEditGrocery: (trip: GroceryTrip) => void;
}

export const GroceryView: React.FC<GroceryViewProps> = ({
  onOpenNewGrocery,
  onEditGrocery,
}) => {
  const {
    groceryTrips,
    selectedMonth,
    groceryMonthlyGoal,
    setGroceryMonthlyGoal,
    deleteGroceryTrip,
    exportGroceryCSV,
    groceryPlan,
    setGroceryPlanningMode,
    toggleRicardoWeek,
    currentMonthSummary,
  } = useFinance();

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(String(groceryMonthlyGoal));
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<'Todos' | Person>('Todos');
  const [tripToDelete, setTripToDelete] = useState<GroceryTrip | null>(null);

  // Filter trips for the selected month
  const monthTrips = React.useMemo(() => {
    return groceryTrips
      .filter((g) => g.date.startsWith(selectedMonth))
      .filter((g) => (selectedPersonFilter === 'Todos' ? true : g.person === selectedPersonFilter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [groceryTrips, selectedMonth, selectedPersonFilter]);

  const totalSpentMonth = monthTrips.reduce((s, g) => s + g.totalAmount, 0);
  const plannedBudget = currentMonthSummary.groceryPlanned;
  const isOverGoal = totalSpentMonth > plannedBudget;
  const percentageUsed = plannedBudget > 0 ? (totalSpentMonth / plannedBudget) * 100 : 0;
  const remainingBudget = Math.max(0, plannedBudget - totalSpentMonth);

  // Breakdown by person in grocery
  const groceryByPerson = React.useMemo(() => {
    const map: Record<Person, number> = { Família: 0, Ricardo: 0, Ellen: 0 };
    groceryTrips
      .filter((g) => g.date.startsWith(selectedMonth))
      .forEach((g) => {
        map[g.person] += g.totalAmount;
      });
    return map;
  }, [groceryTrips, selectedMonth]);

  // Average per trip
  const avgPerTrip = monthTrips.length > 0 ? totalSpentMonth / monthTrips.length : 0;

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseFloat(tempGoal);
    if (!isNaN(g) && g > 0) {
      setGroceryMonthlyGoal(g);
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            Controle de Supermercado Familiar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Planejamento inteligente: Ricardo (R$ 150/semana) + Ellen (R$ 400/mês) = Meta de {formatCurrency(plannedBudget)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportGroceryCSV}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            Exportar CSV
          </button>

          <button
            id="add-grocery-btn"
            onClick={onOpenNewGrocery}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra</span>
          </button>
        </div>
      </div>

      {/* PLAN SELECTOR: OPÇÃO A (Semanal) vs OPÇÃO B (Mensal Fixo) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Método de Planejamento de Supermercado
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Escolha a Estratégia de Contribuição
            </h3>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setGroceryPlanningMode('opcao_a')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                groceryPlan.mode === 'opcao_a'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Opção A (R$ 150/sem Ricardo + R$ 400 Ellen)
            </button>
            <button
              onClick={() => setGroceryPlanningMode('opcao_b')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                groceryPlan.mode === 'opcao_b'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Opção B (Fixo R$ 1.000/mês)
            </button>
          </div>
        </div>

        {/* Weekly Breakdown for Ricardo & Ellen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card Ricardo */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Ricardo (R$ 150 por semana)
                </h4>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                Meta do mês: {formatCurrency(groceryPlan.ricardoTotalPlanned || (groceryPlan.ricardoWeeks.reduce((s, w) => s + w.plannedAmount, 0)))}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {groceryPlan.totalWeeks || groceryPlan.weeksCount || 4} semanas identificadas no mês de {formatMonthYearBR(selectedMonth)}.
              Marque as semanas executadas:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {groceryPlan.ricardoWeeks.map((week, idx) => (
                <button
                  key={week.weekIndex}
                  onClick={() => toggleRicardoWeek(week.weekIndex)}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    week.completed || week.paid
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold">Sem {idx + 1}</span>
                  {week.completed || week.paid ? (
                    <CheckSquare className="w-4 h-4 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[10px] font-semibold">{formatCurrency(week.plannedAmount)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Ellen */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Ellen (R$ 400 mensal)
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Meta do mês: {formatCurrency(groceryPlan.ellenMonthlyPlanned)}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Contribuição mensal regular e integral no orçamento do supermercado familiar.
            </p>

            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Aporte Mensal Previsto:
              </span>
              <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                {formatCurrency(groceryPlan.ellenMonthlyPlanned)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Budget & Goal Progress Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Orçamento de Supermercado — {formatMonthYearBR(selectedMonth)}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(totalSpentMonth)}
              </h3>
              <span className="text-slate-400 text-sm font-medium">
                de {formatCurrency(plannedBudget)} (Meta Planejada)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingGoal ? (
              <button
                onClick={() => {
                  setTempGoal(String(groceryMonthlyGoal));
                  setIsEditingGoal(true);
                }}
                className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Ajustar Meta Base
              </button>
            ) : (
              <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  X
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Large Visual Meter */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                isOverGoal
                  ? 'bg-red-500'
                  : percentageUsed > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentageUsed)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {percentageUsed.toFixed(1)}% utilizado da meta
            </span>

            {isOverGoal ? (
              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Limite excedido em {formatCurrency(totalSpentMonth - plannedBudget)}!
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saldo restante disponível: <strong>{formatCurrency(remainingBudget)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Mini Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Total de Compras</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {monthTrips.length} idas ao mercado
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Ticket Médio</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {formatCurrency(avgPerTrip)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Família (Geral)</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
              {formatCurrency(groceryByPerson.Família)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">Ricardo / Ellen</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {formatCurrency(groceryByPerson.Ricardo + groceryByPerson.Ellen)}
            </span>
          </div>
        </div>
      </div>

      {/* Person Filter for Trips */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filtrar por Comprador:</span>
          <div className="flex gap-1">
            {(['Todos', 'Família', 'Ricardo', 'Ellen'] as ('Todos' | Person)[]).map((p) => {
              const active = selectedPersonFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPersonFilter(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-500">
          {monthTrips.length} {monthTrips.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Grocery Trips List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {monthTrips.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Nenhuma compra de supermercado registrada para este mês.
            </p>
            <button
              onClick={onOpenNewGrocery}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-xs hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Registrar Primeira Compra
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {monthTrips.map((trip) => {
              const personColors = getPersonBadgeColor(trip.person);

              return (
                <div
                  key={trip.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mt-0.5">
                      <ShoppingBag className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {trip.storeName}
                        </span>

                        {trip.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            Demo
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${personColors.badge}`}>
                          {trip.person}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDateBR(trip.date)}</span>
                        <span>•</span>
                        <span className="capitalize">{trip.paymentMethod}</span>
                        {trip.items && trip.items.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              {trip.items.length} itens detalhados
                            </span>
                          </>
                        )}
                      </div>

                      {trip.notes && (
                        <p className="text-xs text-slate-500 italic">{trip.notes}</p>
                      )}

                      {/* Render Items if detailed */}
                      {trip.items && trip.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {trip.items.map((it) => (
                            <span
                              key={it.id}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {it.name}: {formatCurrency(it.price)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(trip.totalAmount)}
                      </span>
                      <span className="block text-[11px] text-slate-400">Valor da compra</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditGrocery(trip)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTripToDelete(trip)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir Compra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tripToDelete && (
        <ConfirmModal
          isOpen={Boolean(tripToDelete)}
          onClose={() => setTripToDelete(null)}
          onConfirm={() => {
            if (tripToDelete) {
              deleteGroceryTrip(tripToDelete.id);
              setTripToDelete(null);
            }
          }}
          title="Excluir Compra de Supermercado"
          message={`Tem certeza que deseja excluir a compra no estabelecimento "${tripToDelete.storeName}" no valor de ${formatCurrency(tripToDelete.totalAmount)}?`}
          confirmText="Sim, Excluir Compra"
          cancelText="Cancelar"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

