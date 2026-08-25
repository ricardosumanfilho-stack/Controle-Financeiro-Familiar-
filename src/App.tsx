import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { DemoBanner } from './components/layout/DemoBanner';
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
import { InvestmentModal } from './components/goals/InvestmentModal';
import { EmergencyModal } from './components/goals/EmergencyModal';
import { ExportImportModal } from './components/export/ExportImportModal';
import { GoogleSheetsModal } from './components/sheets/GoogleSheetsModal';
import { CreditCard, GroceryTrip, Transaction } from './types';
import { motion, AnimatePresence } from 'motion/react';

function MainAppContent() {
  const { activeTab } = useFinance();

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

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
      />

      {/* Demo Banner */}
      <DemoBanner onOpenExportImport={() => setIsExportImportModalOpen(true)} />

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
                onOpenNewInstallment={() => setIsInstallmentModalOpen(true)}
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
              <SettingsView onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        editingTransaction={editingTransaction}
      />

      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
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
