// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, Plus, BarChart3, Settings, History, ArrowLeft, Download, Trash2, AlertCircle, Edit2, Search, Upload, X, Eye, EyeOff } from 'lucide-react';

// Utility functions
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatInputIDR = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numbers));
  return `Rp ${formatted}`;
};

const parseIDR = (value) => {
  return parseInt(value.replace(/\D/g, '')) || 0;
};

const getNextPaychecks = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const schedules = [
    { day: 10, month: currentMonth, type: 'transport', label: 'Transport & Food' },
    { day: 15, month: currentMonth, type: 'health', label: 'Health Money' },
    { day: 25, month: currentMonth, type: 'main', label: 'Main Salary' },
    { day: 10, month: currentMonth + 1, type: 'transport', label: 'Transport & Food' },
    { day: 15, month: currentMonth + 1, type: 'health', label: 'Health Money' },
    { day: 25, month: currentMonth + 1, type: 'main', label: 'Main Salary' },
  ];
  
  return schedules
    .map(s => ({
      ...s,
      date: new Date(currentYear, s.month, s.day),
    }))
    .filter(s => s.date > today)
    .slice(0, 3);
};

const getNextPaycheck = () => {
  const upcoming = getNextPaychecks();
  if (upcoming.length === 0) return { date: new Date(), daysRemaining: 30, type: 'Main Salary' };
  
  const next = upcoming[0];
  const today = new Date();
  const daysRemaining = Math.ceil((next.date - today) / (1000 * 60 * 60 * 24));
  
  return {
    date: next.date,
    daysRemaining,
    type: next.label,
  };
};

// LocalStorage hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

export default function ExpenseTracker() {
  const [currentPage, setCurrentPage] = useState('home');
  const [balances, setBalances] = useLocalStorage('balances', {
    main: 0,
    transport: 0,
    health: 0,
    other: 0,
  });
  const [savingsGoals, setSavingsGoals] = useLocalStorage('savingsGoals', {
    main: 0,
    transport: 0,
    health: 0,
  });
  const [autoAdjustAllowance, setAutoAdjustAllowance] = useLocalStorage('autoAdjustAllowance', true);
  const [manualAllowance, setManualAllowance] = useLocalStorage('manualAllowance', 150000);
  const [hideBalance, setHideBalance] = useLocalStorage('hideBalance', false);
  const [expenses, setExpenses] = useLocalStorage('expenses', []);
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const categoryEmojis = {
    'Breakfast': '🍳',
    'Lunch': '🍜',
    'Dinner': '🍽️',
    'Snacks': '🍪',
    'E-Money Top Up': '💳',
    'Internet Package': '📱',
    'Date': '❤️',
    'Gas': '⛽',
    'Coffee': '☕',
  };

  const totalBalance = balances.main + balances.transport + balances.health + balances.other;
  const totalSavings = savingsGoals.main + savingsGoals.transport + savingsGoals.health;
  const availableBalance = totalBalance - totalSavings;
  
  const nextPaycheck = getNextPaycheck();
  const recommendedAllowance = Math.floor(availableBalance / nextPaycheck.daysRemaining);
  const dailyAllowance = autoAdjustAllowance ? recommendedAllowance : manualAllowance;
  
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(e => e.date === today);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayRemaining = dailyAllowance - todaySpent;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'history':
        return <HistoryPage />;
      case 'add':
        return <AddPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };
  function HomePage() {
    const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const [showAllowanceEdit, setShowAllowanceEdit] = useState(false);
    const [tempAllowance, setTempAllowance] = useState(formatInputIDR(manualAllowance.toString()));
    
    const handleSaveAllowance = () => {
      setManualAllowance(parseIDR(tempAllowance));
      setShowAllowanceEdit(false);
    };

    const weekExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= weekAgo;
    });
    const weekSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return expenseDate >= monthStart;
    });
    const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="pb-28 px-4 pt-6 bg-slate-900 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Today</p>
            <p className="text-lg font-semibold text-emerald-400">{formatIDR(todaySpent)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">This Week</p>
            <p className="text-lg font-semibold text-blue-400">{formatIDR(weekSpent)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">This Month</p>
            <p className="text-lg font-semibold text-purple-400">{formatIDR(monthSpent)}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-4 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">All Money</p>
              <p className="text-3xl font-semibold text-white">
                {hideBalance ? 'Rp •••••••' : formatIDR(totalBalance)}
              </p>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {hideBalance ? <EyeOff size={20} className="text-slate-400" /> : <Eye size={20} className="text-slate-400" />}
            </button>
          </div>
          
          {!hideBalance && (
            <>
              <div className="space-y-2 mb-4 pl-4 border-l-2 border-slate-700">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Main Salary</span>
                  <span className="text-sm font-medium text-orange-400">{formatIDR(balances.main)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Transport & Food</span>
                  <span className="text-sm font-medium text-emerald-400">{formatIDR(balances.transport)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Health Money</span>
                  <span className="text-sm font-medium text-purple-400">{formatIDR(balances.health)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Other Income</span>
                  <span className="text-sm font-medium text-blue-400">{formatIDR(balances.other)}</span>
                </div>
              </div>

              <div className="bg-amber-900/30 rounded-xl p-4 mb-4 border border-amber-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-300">🎯 Savings Locked</span>
                  <span className="text-lg font-semibold text-amber-400">{formatIDR(totalSavings)}</span>
                </div>
              </div>

              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-300">✅ Available to Spend</span>
                  <span className="text-lg font-semibold text-emerald-400">{formatIDR(availableBalance)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-4 border border-slate-700">
          {!showAllowanceEdit ? (
            <>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">📅 Today's Allowance</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-semibold text-white">{formatIDR(dailyAllowance)}</p>
                    {!autoAdjustAllowance && (
                      <button 
                        onClick={() => setShowAllowanceEdit(true)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-blue-400 mt-1">💡 AI Recommended: {formatIDR(recommendedAllowance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Next paycheck</p>
                  <p className="text-sm font-medium text-white">{nextPaycheck.daysRemaining} days</p>
                  <p className="text-xs text-slate-500">{nextPaycheck.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg mb-4">
                <input
                  type="checkbox"
                  checked={autoAdjustAllowance}
                  onChange={(e) => setAutoAdjustAllowance(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm text-slate-300">Auto-adjust allowance daily</label>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Edit Daily Allowance</p>
              <input
                type="text"
                value={tempAllowance}
                onChange={(e) => setTempAllowance(formatInputIDR(e.target.value))}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg mb-3 text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllowanceEdit(false)}
                  className="flex-1 py-2 border border-slate-600 rounded-lg text-sm font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllowance}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Spent: {formatIDR(todaySpent)}</span>
              <span className={todayRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {todayRemaining >= 0 ? `Remaining: ${formatIDR(todayRemaining)}` : `Over: ${formatIDR(Math.abs(todayRemaining))}`}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${todaySpent > dailyAllowance ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((todaySpent / dailyAllowance) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
            <button 
              onClick={() => setCurrentPage('history')}
              className="text-sm text-blue-400 font-medium hover:text-blue-300"
            >
              See All
            </button>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No expenses yet. Tap + to add!</p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(expense => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function HistoryPage() {
    const [filter, setFilter] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredExpenses = expenses.filter(e => {
      const matchesSearch = !searchQuery || 
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.amount.toString().includes(searchQuery);
      
      if (!matchesSearch) return false;

      const expenseDate = new Date(e.date);
      const now = new Date();
      
      if (filter === 'today') {
        return e.date === today;
      } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= weekAgo;
      } else {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenseDate >= monthAgo;
      }
    });

    const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
      const date = expense.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(expense);
      return groups;
    }, {});

    const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));
    const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="pb-28 px-4 pt-6 bg-slate-900 min-h-screen">
        <h1 className="text-2xl font-semibold mb-6 text-white">Transaction History</h1>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {['today', 'week', 'month'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                filter === f ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        <div className="bg-slate-800 rounded-xl shadow-lg p-4 mb-4 border border-slate-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              Showing {filteredExpenses.length} transaction{filteredExpenses.length !== 1 && 's'}
            </p>
            <p className="text-lg font-semibold text-white">{formatIDR(totalFiltered)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl shadow-lg p-8 text-center border border-slate-700">
              <p className="text-slate-500">No transactions found</p>
            </div>
          ) : (
            sortedDates.map(date => {
              const dayExpenses = groupedExpenses[date];
              const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
              const dateObj = new Date(date);
              const isToday = date === today;
              const dateLabel = isToday ? 'Today' : dateObj.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });

              return (
                <div key={date} className="bg-slate-800 rounded-2xl shadow-lg p-4 border border-slate-700">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                    <h3 className="font-semibold text-white">{dateLabel}</h3>
                    <p className="text-sm font-medium text-slate-300">{formatIDR(dayTotal)}</p>
                  </div>
                  <div className="space-y-2">
                    {dayExpenses.map(expense => (
                      <ExpenseItem key={expense.id} expense={expense} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  function ExpenseItem({ expense }) {
    const isExpanded = expandedExpense === expense.id;
    
    const handleDelete = () => {
      if (window.confirm(`Delete ${formatIDR(expense.amount)} ${expense.category} expense?`)) {
        setExpenses(expenses.filter(e => e.id !== expense.id));
        setExpandedExpense(null);
      }
    };

    const handleEdit = () => {
      setEditingExpense(expense);
      setCurrentPage('add');
    };

    return (
      <div>
        <div 
          onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            expense.isExceeded ? 'bg-red-900/30 border-l-4 border-red-500' : 'bg-slate-700/50 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{categoryEmojis[expense.category]}</span>
            <div className="flex-1">
              <p className="font-medium text-white">{expense.category}</p>
              {expense.note && <p className="text-xs text-slate-400">{expense.note}</p>}
              {expense.isExceeded && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                  {expense.label}
                </span>
              )}
            </div>
          </div>
          <p className={`font-semibold ${expense.isExceeded ? 'text-red-400' : 'text-white'}`}>
            {formatIDR(expense.amount)}
          </p>
        </div>
        
        {isExpanded && (
          <div className="mt-2 px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-600 rounded-lg text-sm font-medium text-white hover:bg-slate-500 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-900/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors border border-red-500/30"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
            {expense.photo && (
              <div className="mt-2">
                <img src={expense.photo} alt="Receipt" className="w-full rounded-lg" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  function AddPage() {
    const [mode, setMode] = useState('expense');
    const [formData, setFormData] = useState(
      editingExpense ? {
        ...editingExpense,
        amount: formatInputIDR(editingExpense.amount.toString()),
      } : {
        category: 'Breakfast',
        amount: '',
        date: today,
        note: '',
        type: 'main',
        otherLabel: 'debt',
        label: null,
        photo: null,
      }
    );
    const [showExceededWarning, setShowExceededWarning] = useState(false);

    const categories = Object.keys(categoryEmojis);
    const otherIncomeOptions = [
      { value: 'debt', label: 'Debt Payment' },
      { value: 'gift', label: 'Gift/Bonus' },
      { value: 'reimbursement', label: 'Reimbursement' },
      { value: 'side-hustle', label: 'Side Hustle' },
      { value: 'other', label: 'Other' },
    ];

    const handleAmountChange = (value) => {
      const formatted = formatInputIDR(value);
      setFormData({ ...formData, amount: formatted });
      
      const numValue = parseIDR(formatted);
      if (mode === 'expense' && numValue > (dailyAllowance - todaySpent)) {
        setShowExceededWarning(true);
      } else {
        setShowExceededWarning(false);
        setFormData({ ...formData, amount: formatted, label: null });
      }
    };

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Photo must be less than 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, photo: reader.result });
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = () => {
      const amount = parseIDR(formData.amount);
      if (!amount) {
        alert('Please enter an amount');
        return;
      }

      if (mode === 'expense') {
        if (editingExpense) {
          setExpenses(expenses.map(e => 
            e.id === editingExpense.id 
              ? { ...formData, id: e.id, amount, isExceeded: showExceededWarning }
              : e
          ));
          setEditingExpense(null);
        } else {
          const newExpense = {
            id: Date.now(),
            date: formData.date,
            category: formData.category,
            amount,
            note: formData.note,
            isExceeded: showExceededWarning,
            label: formData.label,
            photo: formData.photo,
          };
          setExpenses([newExpense, ...expenses]);
        }
      } else {
        if (formData.type === 'other') {
          setBalances({ ...balances, other: balances.other + amount });
        } else {
          setBalances({ ...balances, [formData.type]: balances[formData.type] + amount });
        }
      }

      setFormData({
        category: 'Breakfast',
        amount: '',
        date: today,
        note: '',
        type: 'main',
        otherLabel: 'debt',
        label: null,
        photo: null,
      });
      setShowExceededWarning(false);
      setCurrentPage('home');
    };

    return (
      <div className="pb-28 px-4 pt-6 bg-slate-900 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => {
              setCurrentPage('home');
              setEditingExpense(null);
            }} 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-2xl font-semibold text-white">{editingExpense ? 'Edit' : 'Add'} Transaction</h1>
        </div>

        {!editingExpense && (
          <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMode('expense')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                mode === 'expense' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setMode('income')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                mode === 'income' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Income
            </button>
          </div>
        )}

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
          {(mode === 'expense' || editingExpense) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryEmojis[cat]} {cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Rp 0"
                  className="w-full p-3 text-lg bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>

              {showExceededWarning && !editingExpense && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="text-red-400 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-red-300">Exceeds Daily Allowance</p>
                      <p className="text-xs text-red-400">
                        This expense exceeds your daily limit by {formatIDR(parseIDR(formData.amount) - (dailyAllowance - todaySpent))}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">Mark this expense as:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, label: 'Liability of the day' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        formData.label === 'Liability of the day' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-slate-700 border border-red-500/30 text-red-400'
                      }`}
                    >
                      Liability
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, label: 'Urgently Needed' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        formData.label === 'Urgently Needed' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-slate-700 border border-red-500/30 text-red-400'
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">📸 Receipt Photo (Optional)</label>
                {formData.photo ? (
                  <div className="relative">
                    <img src={formData.photo} alt="Receipt" className="w-full rounded-lg mb-2" />
                    <button
                      onClick={() => setFormData({ ...formData, photo: null })}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-400">Upload Photo (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {mode === 'income' && !editingExpense && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Income Type</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 bg-slate-700">
                    <input
                      type="radio"
                      name="incomeType"
                      value="main"
                      checked={formData.type === 'main'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-3"
                    />
                    <span className="text-white">Main Salary (25th)</span>
                  </label>
                  <label className="flex items-center p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 bg-slate-700">
                    <input
                      type="radio"
                      name="incomeType"
                      value="transport"
                      checked={formData.type === 'transport'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-3"
                    />
                    <span className="text-white">Transport & Food (10th)</span>
                  </label>
                  <label className="flex items-center p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 bg-slate-700">
                    <input
                      type="radio"
                      name="incomeType"
                      value="health"
                      checked={formData.type === 'health'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-3"
                    />
                    <span className="text-white">Health Money (15th)</span>
                  </label>
                  <label className="flex items-center p-3 border border-emerald-600/50 rounded-lg cursor-pointer hover:bg-emerald-900/30 bg-emerald-900/20">
                    <input
                      type="radio"
                      name="incomeType"
                      value="other"
                      checked={formData.type === 'other'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mr-3"
                    />
                    <span className="font-medium text-emerald-400">Other Income ⭐</span>
                  </label>
                </div>
              </div>

              {formData.type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Income Label</label>
                  <select
                    value={formData.otherLabel}
                    onChange={(e) => setFormData({ ...formData, otherLabel: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    {otherIncomeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: formatInputIDR(e.target.value) })}
                  placeholder="Rp 0"
                  className="w-full p-3 text-lg bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-orange-600 text-white py-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            {editingExpense ? 'Update Expense' : mode === 'expense' ? 'Add Expense' : 'Add Income'}
          </button>
        </div>
      </div>
    );
  }

  function AnalyticsPage() {
    const [period, setPeriod] = useState('weekly');
    
    const categoryData = Object.keys(categoryEmojis).map(category => {
      const total = expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
      return { name: category, value: total };
    }).filter(d => d.value > 0);

    const COLORS = ['#ff6f61', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

    const dailyData = expenses.reduce((acc, expense) => {
      const existing = acc.find(d => d.date === expense.date);
      if (existing) {
        existing.spent += expense.amount;
      } else {
        acc.push({ date: expense.date, spent: expense.amount, allowance: dailyAllowance });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const topCategory = categoryData.sort((a, b) => b.value - a.value)[0];
    const coffeeCount = expenses.filter(e => e.category === 'Coffee').length;
    const coffeeTotal = expenses.filter(e => e.category === 'Coffee').reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="pb-28 px-4 pt-6 bg-slate-900 min-h-screen">
        <h1 className="text-2xl font-semibold mb-6 text-white">Analytics</h1>

        <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              period === 'weekly' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              period === 'monthly' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Total Spent</p>
            <p className="text-lg font-semibold text-white">{formatIDR(totalSpent)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Avg per Day</p>
            <p className="text-lg font-semibold text-white">{formatIDR(Math.floor(totalSpent / 7))}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="45%"
                labelLine={true}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatIDR(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Daily Spending Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6f61" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6f61" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} formatter={(value) => formatIDR(value)} />
              <Area type="monotone" dataKey="spent" stroke="#ff6f61" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl shadow-lg p-6 mb-6 border border-blue-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-semibold text-white">AI Analysis</h2>
          </div>
          <p className="text-sm text-slate-200 mb-4">
            You spent <strong className="text-white">{formatIDR(totalSpent)}</strong> this period. {topCategory && (
              <>Your highest spending category is <strong className="text-white">{topCategory.name}</strong> at {formatIDR(topCategory.value)} ({((topCategory.value / totalSpent) * 100).toFixed(0)}% of total spending).</>
            )}
          </p>
          <p className="text-sm text-slate-200">
            Based on your spending pattern, you're on track to spend approximately <strong className="text-white">{formatIDR(totalSpent * 4)}</strong> this month.
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💡</span>
            <h2 className="text-lg font-semibold text-white">Suggestions</h2>
          </div>
          <ul className="space-y-3">
            {coffeeCount > 0 && (
              <li className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                <span className="text-xl">☕</span>
                <div>
                  <p className="text-sm font-medium text-white">Coffee: {coffeeCount} times ({formatIDR(coffeeTotal)})</p>
                  <p className="text-xs text-slate-400">Try reducing to {Math.max(1, Math.floor(coffeeCount * 0.7))} times per week to save {formatIDR(Math.floor(coffeeTotal * 0.3))}</p>
                </div>
              </li>
            )}
            <li className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xl">🍜</span>
              <div>
                <p className="text-sm font-medium text-white">Consider meal prepping</p>
                <p className="text-xs text-slate-400">Preparing lunch at home could save up to {formatIDR(150000)} per week</p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm font-medium text-white">You're {todayRemaining >= 0 ? 'within' : 'over'} your daily allowance</p>
                <p className="text-xs text-slate-400">{todayRemaining >= 0 ? 'Great job staying disciplined!' : 'Try to adjust spending tomorrow'}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  function SettingsPage() {
    const [tempGoals, setTempGoals] = useState(savingsGoals);
    const [selectedPaycheck, setSelectedPaycheck] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const upcomingPaychecks = getNextPaychecks();

    const handleSaveGoals = () => {
      setSavingsGoals(tempGoals);
      alert('Savings goals updated!');
    };

    const handleExport = (format) => {
      const data = {
        balances,
        savingsGoals,
        dailyAllowance,
        expenses,
        exportDate: new Date().toISOString(),
      };
      
      const dataStr = format === 'json' 
        ? JSON.stringify(data, null, 2)
        : convertToCSV(expenses);
      
      const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
    };

    const convertToCSV = (expenses) => {
      const headers = 'Date,Category,Amount,Note,Exceeded,Label\n';
      const rows = expenses.map(e => 
        `${e.date},${e.category},${e.amount},"${e.note}",${e.isExceeded},${e.label || ''}`
      ).join('\n');
      return headers + rows;
    };

    const handleClearData = () => {
      setExpenses([]);
      setBalances({ main: 0, transport: 0, health: 0, other: 0 });
      setSavingsGoals({ main: 0, transport: 0, health: 0 });
      setManualAllowance(0);
      setShowClearConfirm(false);
      alert('All data cleared!');
    };

    return (
      <div className="pb-28 px-4 pt-6 bg-slate-900 min-h-screen">
        <h1 className="text-2xl font-semibold mb-6 text-white">Settings</h1>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-4 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Savings Goals (Per Paycheck)</h2>
          <div className="bg-blue-900/30 rounded-lg p-4 mb-4 border border-blue-700/50">
            <p className="text-sm text-blue-300 mb-1">
              <span className="font-medium">Upcoming Paychecks:</span>
            </p>
            <div className="space-y-2 mt-2">
              {upcomingPaychecks.map((paycheck, index) => (
                <label key={index} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700">
                  <input
                    type="radio"
                    name="paycheck"
                    value={paycheck.type}
                    checked={selectedPaycheck === paycheck.type}
                    onChange={() => setSelectedPaycheck(paycheck.type)}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-200">
                    {paycheck.date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - {paycheck.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Main Salary Goal</label>
              <input
                type="text"
                value={formatInputIDR(tempGoals.main.toString())}
                onChange={(e) => setTempGoals({ ...tempGoals, main: parseIDR(e.target.value) })}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Transport & Food Goal</label>
              <input
                type="text"
                value={formatInputIDR(tempGoals.transport.toString())}
                onChange={(e) => setTempGoals({ ...tempGoals, transport: parseIDR(e.target.value) })}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Health Money Goal</label>
              <input
                type="text"
                value={formatInputIDR(tempGoals.health.toString())}
                onChange={(e) => setTempGoals({ ...tempGoals, health: parseIDR(e.target.value) })}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>
          <div className="bg-amber-900/30 rounded-lg p-4 mb-4 border border-amber-700/50">
            <p className="text-sm text-amber-300">
              <span className="font-medium">Total Locked:</span> <span className="text-amber-400 font-semibold">{formatIDR(tempGoals.main + tempGoals.transport + tempGoals.health)}</span>
            </p>
          </div>
          <button
            onClick={handleSaveGoals}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Save Goals
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-4 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Data Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Download size={20} />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Export as JSON
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 size={20} />
              Clear All Data
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-2 text-white">About</h2>
          <p className="text-sm text-slate-300">Expense Tracker v1.0</p>
          <p className="text-xs text-slate-500 mt-1">Built with React & Next.js</p>
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Clear All Data?</h3>
              <p className="text-sm text-slate-300 mb-6">
                This will permanently delete all expenses, incomes, balances, and settings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 rounded-lg border border-slate-600 font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function BottomNav() {
    const navItems = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'add', icon: Plus, label: 'Add', isCAB: true },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-area-inset-bottom">
        <div className="relative h-20">
          <div className="absolute inset-0 flex items-center">
            <div className="flex w-full">
              <div className="flex flex-1 justify-around">
                {navItems.slice(0, 2).map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex flex-col items-center justify-center transition-colors ${
                        isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs mt-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="w-20"></div>
              
              <div className="flex flex-1 justify-around">
                {navItems.slice(3, 5).map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex flex-col items-center justify-center transition-colors ${
                        isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs mt-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentPage('add')}
            className="absolute left-1/2 -top-6 transform -translate-x-1/2 z-10"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
              currentPage === 'add' ? 'bg-orange-600 scale-110' : 'bg-orange-600 hover:bg-orange-700 hover:scale-105'
            }`}>
              <Plus size={32} className="text-white" />
            </div>
            <span className={`block text-xs mt-2 ${currentPage === 'add' ? 'text-orange-400 font-medium' : 'text-slate-400'}`}>
              Add
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {renderPage()}
      <BottomNav />
    </div>
  );
}