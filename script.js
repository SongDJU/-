// 데이터 저장소
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let members = JSON.parse(localStorage.getItem('members')) || [];
let activities = JSON.parse(localStorage.getItem('activities')) || [];

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    updateDashboard();
    renderBudgets();
    renderExpenses();
    renderMembers();
    renderRecentActivities();
    updateExpenseCategories();
    generateReport();
    
    // 오늘 날짜를 지출 날짜 필드 기본값으로 설정
    const expenseDateInput = document.querySelector('#expenseForm input[name="date"]');
    if (expenseDateInput) {
        expenseDateInput.value = new Date().toISOString().split('T')[0];
    }
});

// 현재 날짜 표시
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateElement.textContent = now.toLocaleDateString('ko-KR', options);
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 모든 네비게이션 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 보고서 탭이면 다시 생성
    if (tabName === 'report') {
        generateReport();
    }
}

// 숫자를 원화 형식으로 변환
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// 활동 기록 추가
function addActivity(message) {
    const activity = {
        id: Date.now(),
        message: message,
        timestamp: new Date().toISOString()
    };
    activities.unshift(activity);
    
    // 최근 10개만 유지
    if (activities.length > 10) {
        activities = activities.slice(0, 10);
    }
    
    localStorage.setItem('activities', JSON.stringify(activities));
    renderRecentActivities();
}

// 최근 활동 렌더링
function renderRecentActivities() {
    const container = document.getElementById('recentActivities');
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">최근 활동이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const date = new Date(activity.timestamp);
        const timeStr = date.toLocaleString('ko-KR');
        
        return `
            <div class="activity-item">
                <div>${activity.message}</div>
                <div class="time">${timeStr}</div>
            </div>
        `;
    }).join('');
}

// 대시보드 업데이트
function updateDashboard() {
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = totalBudget - totalExpense;
    const totalMembers = members.length;
    
    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('totalMembers').textContent = totalMembers + '명';
    
    // 잔액 색상 변경
    const balanceElement = document.getElementById('balance');
    if (balance < 0) {
        balanceElement.style.color = 'var(--danger-color)';
    } else {
        balanceElement.style.color = 'var(--secondary-color)';
    }
}

// === 예산 관리 ===
function addBudget(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const budget = {
        id: Date.now(),
        category: formData.get('category'),
        amount: Number(formData.get('amount')),
        description: formData.get('description'),
        createdAt: new Date().toISOString()
    };
    
    budgets.push(budget);
    localStorage.setItem('budgets', JSON.stringify(budgets));
    
    addActivity(`예산 추가: ${budget.category} - ${formatCurrency(budget.amount)}`);
    renderBudgets();
    updateDashboard();
    updateExpenseCategories();
    form.reset();
}

function renderBudgets() {
    const tbody = document.getElementById('budgetTableBody');
    
    if (budgets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">등록된 예산이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = budgets.map(budget => {
        const date = new Date(budget.createdAt).toLocaleDateString('ko-KR');
        
        return `
            <tr>
                <td><strong>${budget.category}</strong></td>
                <td>${formatCurrency(budget.amount)}</td>
                <td>${budget.description || '-'}</td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteBudget(${budget.id})">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteBudget(id) {
    if (!confirm('이 예산을 삭제하시겠습니까?')) return;
    
    const budget = budgets.find(b => b.id === id);
    budgets = budgets.filter(b => b.id !== id);
    localStorage.setItem('budgets', JSON.stringify(budgets));
    
    addActivity(`예산 삭제: ${budget.category}`);
    renderBudgets();
    updateDashboard();
    updateExpenseCategories();
}

// 지출 카테고리 업데이트
function updateExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    select.innerHTML = '<option value="">선택하세요</option>';
    
    budgets.forEach(budget => {
        const option = document.createElement('option');
        option.value = budget.category;
        option.textContent = budget.category;
        select.appendChild(option);
    });
}

// === 지출 관리 ===
function addExpense(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const expense = {
        id: Date.now(),
        category: formData.get('category'),
        amount: Number(formData.get('amount')),
        date: formData.get('date'),
        vendor: formData.get('vendor'),
        description: formData.get('description'),
        createdAt: new Date().toISOString()
    };
    
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    addActivity(`지출 추가: ${expense.category} - ${formatCurrency(expense.amount)} (${expense.vendor})`);
    renderExpenses();
    updateDashboard();
    form.reset();
    
    // 날짜 필드 초기화
    form.querySelector('input[name="date"]').value = new Date().toISOString().split('T')[0];
}

function renderExpenses() {
    const tbody = document.getElementById('expenseTableBody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">등록된 지출이 없습니다.</td></tr>';
        return;
    }
    
    // 날짜 순으로 정렬 (최신순)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedExpenses.map(expense => {
        const date = new Date(expense.date).toLocaleDateString('ko-KR');
        
        return `
            <tr>
                <td>${date}</td>
                <td><strong>${expense.category}</strong></td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${expense.vendor}</td>
                <td>${expense.description || '-'}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteExpense(id) {
    if (!confirm('이 지출을 삭제하시겠습니까?')) return;
    
    const expense = expenses.find(e => e.id === id);
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    addActivity(`지출 삭제: ${expense.category} - ${formatCurrency(expense.amount)}`);
    renderExpenses();
    updateDashboard();
}

// === 회원 관리 ===
function addMember(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const member = {
        id: Date.now(),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        joinedAt: new Date().toISOString()
    };
    
    members.push(member);
    localStorage.setItem('members', JSON.stringify(members));
    
    addActivity(`회원 추가: ${member.name} (${getRoleName(member.role)})`);
    renderMembers();
    updateDashboard();
    form.reset();
}

function getRoleName(role) {
    const roles = {
        'member': '일반 회원',
        'admin': '관리자',
        'treasurer': '총무'
    };
    return roles[role] || role;
}

function renderMembers() {
    const tbody = document.getElementById('memberTableBody');
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">등록된 회원이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = members.map(member => {
        const date = new Date(member.joinedAt).toLocaleDateString('ko-KR');
        
        return `
            <tr>
                <td><strong>${member.name}</strong></td>
                <td>${member.email}</td>
                <td>${member.phone || '-'}</td>
                <td>${getRoleName(member.role)}</td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteMember(${member.id})">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteMember(id) {
    if (!confirm('이 회원을 삭제하시겠습니까?')) return;
    
    const member = members.find(m => m.id === id);
    members = members.filter(m => m.id !== id);
    localStorage.setItem('members', JSON.stringify(members));
    
    addActivity(`회원 삭제: ${member.name}`);
    renderMembers();
    updateDashboard();
}

// === 보고서 ===
function generateReport() {
    const period = document.getElementById('reportPeriod').value;
    const now = new Date();
    let filteredExpenses = expenses;
    
    // 기간 필터링
    if (period === 'month') {
        filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
        });
    } else if (period === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const expenseQuarter = Math.floor(expenseDate.getMonth() / 3);
            return expenseQuarter === quarter && 
                   expenseDate.getFullYear() === now.getFullYear();
        });
    } else if (period === 'year') {
        filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === now.getFullYear();
        });
    }
    
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = totalBudget - totalExpense;
    const usagePercent = totalBudget > 0 ? ((totalExpense / totalBudget) * 100).toFixed(1) : 0;
    
    document.getElementById('reportBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('reportExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('reportBalance').textContent = formatCurrency(balance);
    document.getElementById('reportUsage').textContent = usagePercent + '%';
    
    // 사용률 색상 변경
    const usageElement = document.getElementById('reportUsage');
    if (usagePercent > 90) {
        usageElement.style.color = 'var(--danger-color)';
    } else if (usagePercent > 70) {
        usageElement.style.color = 'var(--warning-color)';
    } else {
        usageElement.style.color = 'var(--secondary-color)';
    }
    
    // 항목별 지출 집계
    const categoryData = {};
    filteredExpenses.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += Number(expense.amount);
    });
    
    renderCategoryBreakdown(categoryData, totalExpense);
}

function renderCategoryBreakdown(categoryData, totalExpense) {
    const container = document.getElementById('categoryBreakdown');
    
    if (Object.keys(categoryData).length === 0) {
        container.innerHTML = '<p class="empty-message">지출 내역이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
            
            // 해당 카테고리의 예산 찾기
            const budget = budgets.find(b => b.category === category);
            const budgetAmount = budget ? budget.amount : 0;
            const budgetUsage = budgetAmount > 0 ? ((amount / budgetAmount) * 100).toFixed(1) : 0;
            
            return `
                <div class="category-item">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>${category}</strong>
                            <span>${formatCurrency(amount)} (${percentage}%)</span>
                        </div>
                        ${budget ? `
                            <div style="font-size: 0.9rem; color: #7f8c8d;">
                                예산: ${formatCurrency(budgetAmount)} | 사용률: ${budgetUsage}%
                            </div>
                            <div class="category-progress">
                                <div class="category-progress-bar" style="width: ${Math.min(budgetUsage, 100)}%; background: ${budgetUsage > 90 ? 'var(--danger-color)' : budgetUsage > 70 ? 'var(--warning-color)' : 'var(--secondary-color)'}"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
}

// 데이터 내보내기
function exportData() {
    const data = {
        budgets,
        expenses,
        members,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `총무관리_데이터_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    addActivity('데이터를 내보냈습니다.');
}
