// =====================
// STATE MANAGEMENT
// =====================

/**
 * Application state object
 * Maintains all expenses and provides methods for state manipulation
 */
const state = {
    expenses: [],
    currentFilter: 'All',

    /**
     * Initialize state from localStorage or with empty array
     */
    init() {
        this.expenses = this.loadFromStorage();
    },

    /**
     * Add a new expense to state
     * @param {Object} expense - Expense object with amount, category, timestamp, id
     */
    addExpense(expense) {
        this.expenses.push(expense);
        this.saveToStorage();
    },

    /**
     * Remove an expense by ID
     * @param {string} id - Unique expense ID
     */
    removeExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveToStorage();
    },

    /**
     * Set the current category filter
     * @param {string} category - Category name or 'All'
     */
    setFilter(category) {
        this.currentFilter = category;
    },

    /**
     * Get filtered expenses based on current filter
     * @returns {Array} Filtered expenses array
     */
    getFilteredExpenses() {
        if (this.currentFilter === 'All') {
            return this.expenses;
        }
        return this.expenses.filter(expense => expense.category === this.currentFilter);
    },

    /**
     * Calculate total of filtered expenses
     * @returns {number} Total amount
     */
    getTotal() {
        return this.getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0);
    },

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('expenses', JSON.stringify(this.expenses));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },

    /**
     * Load state from localStorage
     * @returns {Array} Expenses array from storage or empty array
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('expenses');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    }
};

// =====================
// DOM ELEMENTS CACHE
// =====================

const elements = {
    form: document.getElementById('expenseForm'),
    amountInput: document.getElementById('amount'),
    categoryInput: document.getElementById('category'),
    filterDropdown: document.getElementById('filterCategory'),
    expensesList: document.getElementById('expensesList'),
    totalAmount: document.getElementById('totalAmount'),
    expenseCount: document.getElementById('expenseCount'),
    amountError: document.getElementById('amountError'),
    categoryError: document.getElementById('categoryError')
};

// =====================
// VALIDATION LOGIC
// =====================

/**
 * Validate form inputs
 * @returns {boolean} True if valid, false otherwise
 */
function validateForm() {
    let isValid = true;

    // Clear previous errors
    elements.amountError.classList.remove('show');
    elements.categoryError.classList.remove('show');

    // Validate amount
    const amount = parseFloat(elements.amountInput.value);
    if (!elements.amountInput.value || amount <= 0) {
        showError(elements.amountError, 'Please enter a positive amount');
        isValid = false;
    }

    // Validate category
    if (!elements.categoryInput.value) {
        showError(elements.categoryError, 'Please select a category');
        isValid = false;
    }

    return isValid;
}

/**
 * Display error message
 * @param {HTMLElement} element - Error element to show
 * @param {string} message - Error message to display
 */
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

// =====================
// UI RENDERING LOGIC
// =====================

/**
 * Render all expenses from filtered state
 */
function renderExpenses() {
    const filteredExpenses = state.getFilteredExpenses();

    if (filteredExpenses.length === 0) {
        elements.expensesList.innerHTML = `
            <div class="empty-state">
                <p>📭 No expenses yet. Add one to get started!</p>
            </div>
        `;
        return;
    }

    elements.expensesList.innerHTML = filteredExpenses
        .map(expense => createExpenseHTML(expense))
        .join('');

    // Attach delete event listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', handleDeleteExpense);
    });
}

/**
 * Create HTML for a single expense item
 * @param {Object} expense - Expense object
 * @returns {string} HTML string for expense item
 */
function createExpenseHTML(expense) {
    const categoryEmojis = {
        Food: '🍔',
        Travel: '✈️',
        Shopping: '🛍️',
        Bills: '📄',
        Others: '📌'
    };

    const categoryClasses = {
        Food: 'badge-food',
        Travel: 'badge-travel',
        Shopping: 'badge-shopping',
        Bills: 'badge-bills',
        Others: 'badge-others'
    };

    const emoji = categoryEmojis[expense.category] || '💰';
    const badgeClass = categoryClasses[expense.category] || 'badge-others';
    const date = new Date(expense.timestamp).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const time = new Date(expense.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="expense-item soft-shadow" data-id="${expense.id}" data-category="${expense.category}">
            <div class="expense-info">
                <div class="category-badge ${badgeClass}" style="color: white; font-weight: bold;">${emoji}</div>
                <div class="expense-details">
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-timestamp">📅 ${date} ⏰ ${time}</div>
                </div>
            </div>
            <div class="expense-right">
                <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                <button class="btn btn-danger btn-delete" data-id="${expense.id}" title="Delete expense">Delete</button>
            </div>
        </div>
    `;
}

/**
 * Update total expense display with smooth animation
 */
function updateTotal() {
    const total = state.getTotal();
    const count = state.getFilteredExpenses().length;

    // Animate the total amount change
    animateValue(elements.totalAmount, parseFloat(elements.totalAmount.textContent) || 0, total, 600);
    
    elements.expenseCount.textContent = `${count} ${count === 1 ? 'expense' : 'expenses'}`;
}

/**
 * Animate numerical value change
 * @param {HTMLElement} element - Element to update
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Animation duration in ms
 */
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(2);
    }, 16);
}

/**
 * Render the entire UI (expenses list + total)
 */
function renderUI() {
    renderExpenses();
    updateTotal();
}

// =====================
// EVENT HANDLERS
// =====================

/**
 * Handle form submission for adding new expense
 * @param {Event} e - Form submission event
 */
function handleAddExpense(e) {
    e.preventDefault();

    // Validate inputs
    if (!validateForm()) {
        return;
    }

    // Create expense object
    const expense = {
        id: generateUID(),
        amount: parseFloat(elements.amountInput.value),
        category: elements.categoryInput.value,
        timestamp: new Date().toISOString()
    };

    // Update state
    state.addExpense(expense);

    // Update UI
    renderUI();

    // Reset form
    elements.form.reset();
    elements.categoryInput.value = '';

    // Visual feedback
    showSuccessMessage();
}

/**
 * Handle expense deletion
 * @param {Event} e - Click event from delete button
 */
function handleDeleteExpense(e) {
    const id = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this expense?')) {
        state.removeExpense(id);
        renderUI();
    }
}

/**
 * Handle category filter change
 * @param {Event} e - Change event from filter dropdown
 */
function handleFilterChange(e) {
    state.setFilter(e.target.value);
    renderUI();
}

/**
 * Show success message (optional animation feedback)
 */
function showSuccessMessage() {
    const originalBgColor = elements.form.style.backgroundColor;
    elements.form.style.backgroundColor = '#d1fae5';
    elements.form.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
    
    setTimeout(() => {
        elements.form.style.backgroundColor = originalBgColor;
        elements.form.style.boxShadow = '';
    }, 600);

    // Add pulse animation
    elements.form.style.animation = 'pulse 0.6s ease-in-out';
    setTimeout(() => {
        elements.form.style.animation = '';
    }, 600);
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Generate unique ID for expense
 * @returns {string} Unique ID
 */
function generateUID() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(value);
}

/**
 * Get category statistics
 * @returns {Object} Statistics by category
 */
function getCategoryStats() {
    const stats = {};
    state.expenses.forEach(expense => {
        if (!stats[expense.category]) {
            stats[expense.category] = { count: 0, total: 0 };
        }
        stats[expense.category].count += 1;
        stats[expense.category].total += expense.amount;
    });
    return stats;
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =====================
// APPLICATION INITIALIZATION
// =====================

/**
 * Initialize the application
 * Called when DOM is fully loaded
 */
function initializeApp() {
    // Initialize state from storage
    state.init();

    // Render initial UI
    renderUI();

    // Attach event listeners
    elements.form.addEventListener('submit', handleAddExpense);
    elements.filterDropdown.addEventListener('change', handleFilterChange);

    // Set initial filter dropdown value
    elements.filterDropdown.value = 'All';

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Log welcome message
    console.log('%c🚀 Smart Expense Tracker Initialized', 'font-size: 14px; color: #6366f1; font-weight: bold;');
    console.log('%cTotal expenses loaded: %c' + state.expenses.length, 'color: #64748b;', 'color: #10b981; font-weight: bold;');
    console.log('%cTotal amount: %c₹' + state.getTotal().toFixed(2), 'color: #64748b;', 'color: #ec4899; font-weight: bold;');
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // ESC: Clear form
    if (e.key === 'Escape') {
        elements.form.reset();
        elements.categoryInput.value = '';
    }

    // Ctrl/Cmd + Enter: Submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement !== elements.form) {
            elements.form.dispatchEvent(new Event('submit'));
        }
    }
}

// =====================
// START APP
// =====================

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}
