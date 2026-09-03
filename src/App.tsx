import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { CardsView } from './components/cards/CardsView';
import { SupermarketView } from './components/grocery/SupermarketView';
import { BudgetPerPersonView } from './components/budget/BudgetPerPersonView';
import { GoalsView } from './components/goals/GoalsView';
import { HouseFundView } from './components/house/HouseFundView';
import { RenovationView } from './components/renovation/RenovationView';
import { MonthlyClosingView } from './components/closing/MonthlyClosingView';
import { AlertsView } from './components/alerts/AlertsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { InstallmentModal } from './components/cards/InstallmentModal';
import { CardModal } from './components/cards/CardModal';
import { GroceryModal } from './components/grocery/GroceryModal';
import { LiveMarketModal } from './components/grocery/LiveMarketModal';
import { InvestmentModal } from './components/goals/InvestmentModal';
import { EmergencyModal } from './components/goals/EmergencyModal';
import { ExportImportModal } from './components/export/ExportImportModal';
import { GoogleSheetsModal } from './components/sheets/GoogleSheetsModal';
import { SupabaseModal } from './components/supabase/SupabaseModal';
import { CreditCard, GroceryTrip, Transaction, InstallmentPurchase } from './types';
import { motion, AnimatePresence } from 'motion/react';

function MainAppContent() {
  const { activeTab, shoppingLists, updateShoppingList, convertShoppingListToTrip } = useFinance();

  // Standalone Live Market Mode detection (e.g. ?mode=live-market&listId=xyz)
  const searchParams = new URLSearchParams(window.location.search);
  const isLiveMarketParam = searchParams.get('mode') === 'live-market' || window.location.hash.includes('live-market');
  const targetListId = searchParams.get('listId');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<InstallmentPurchase | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [editingGrocery, setEditingGrocery] = useState<GroceryTrip | null>(null);

  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [investmentDefaultPerson, setInvestmentDefaultPerson] = useState<'Ricardo' | 'Ellen'>('Ricardo');

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalMode, setEmergencyModalMode] = useState<'contribution' | 'settings'>('contribution');

  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // If in Standalone Live Market Mode, render dedicated full-screen view
  if (isLiveMarketParam) {
    const activeList = (targetListId ? shoppingLists.find((l) => l.id === targetListId) : null) || shoppingLists[0];

    if (!activeList) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 mb-4">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Nenhuma lista de compras ativa</h1>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Não encontramos a lista solicitada. Crie uma lista ou acerte o link para iniciar o Modo Mercado.
          </p>
          <button
            onClick={() => {
              window.location.href = window.location.origin + window.location.pathname;
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs"
          >
            Voltar ao App Principal
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans antialiased">
        <LiveMarketModal
          isOpen={true}
          isStandalone={true}
          onClose={() => {
            window.location.href = window.location.origin + window.location.pathname;
          }}
          list={activeList}
          onUpdateList={(updatedItems) => {
            updateShoppingList(activeList.id, { items: updatedItems });
          }}
          onFinalizeTrip={({ listId, storeName, totalAmount, person, paymentMethod, tripType, weekNumber, savingsAmount, items }) => {
            convertShoppingListToTrip(listId, storeName, person, paymentMethod, totalAmount, tripType, weekNumber, savingsAmount, items);
            window.location.href = window.location.origin + window.location.pathname;
          }}
        />
      </div>
    );
  }

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleOpenNewCard = () => {
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleOpenNewGrocery = () => {
    setEditingGrocery(null);
    setIsGroceryModalOpen(true);
  };

  const handleEditGrocery = (trip: GroceryTrip) => {
    setEditingGrocery(trip);
    setIsGroceryModalOpen(true);
  };

  const handleOpenNewInvestment = (person: 'Ricardo' | 'Ellen' = 'Ricardo') => {
    setInvestmentDefaultPerson(person);
    setIsInvestmentModalOpen(true);
  };

  const handleOpenNewEmergency = () => {
    setEmergencyModalMode('contribution');
    setIsEmergencyModalOpen(true);
  };

  const handleOpenEmergencySettings = () => {
    setEmergencyModalMode('settings');
    setIsEmergencyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white pb-20 lg:pb-8">
      {/* Top Navbar */}
      <Navbar
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenExportImport={() => setIsExportImportModalOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenNewInstallment={() => setIsInstallmentModalOpen(true)}
                onOpenNewGrocery={handleOpenNewGrocery}
                onOpenNewInvestment={handleOpenNewInvestment}
                onOpenNewEmergency={handleOpenNewEmergency}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                onOpenNewTransaction={handleOpenNewTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}

            {activeTab === 'cards' && (
              <CardsView
                onOpenNewInstallment={() => {
                  setEditingInstallment(null);
                  setIsInstallmentModalOpen(true);
                }}
                onEditInstallment={(inst) => {
                  setEditingInstallment(inst);
                  setIsInstallmentModalOpen(true);
                }}
                onOpenNewCard={handleOpenNewCard}
                onEditCard={handleEditCard}
              />
            )}

            {activeTab === 'grocery' && (
              <SupermarketView />
            )}

            {activeTab === 'budget' && (
              <BudgetPerPersonView />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                onOpenNewInvestment={handleOpenNewInvestment}
                onOpenNewEmergency={handleOpenNewEmergency}
                onOpenEmergencySettings={handleOpenEmergencySettings}
              />
            )}

            {activeTab === 'house' && (
              <HouseFundView />
            )}

            {activeTab === 'renovation' && (
              <RenovationView />
            )}

            {activeTab === 'closing' && (
              <MonthlyClosingView onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)} />
            )}

            {activeTab === 'alerts' && (
              <AlertsView />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
                onOpenSupabase={() => setIsSupabaseModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenSupabase={() => setIsSupabaseModalOpen(true)} />

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        editingTransaction={editingTransaction}
      />

      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => {
          setIsInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
        installmentToEdit={editingInstallment}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        editingCard={editingCard}
      />

      <GroceryModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        editingTrip={editingGrocery}
      />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        defaultPerson={investmentDefaultPerson}
      />

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        mode={emergencyModalMode}
      />

      <ExportImportModal
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
