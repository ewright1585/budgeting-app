// Regenerated app.js with fixed date formatting
//const db = firebase.firestore();
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const paidExpenseList = document.getElementById('paidExpenseList');
const categorySelect = document.getElementById('category');
const editCategorySelect = document.getElementById('editCategory');
const budgetChart = document.getElementById('budgetChart');

function loadCategories() {
  db.collection('expenseCategories').orderBy('name').get().then(snapshot => {
    snapshot.forEach(doc => {
      const { name } = doc.data();
      const option1 = document.createElement('option');
      const option2 = document.createElement('option');
      option1.value = option2.value = name;
      option1.textContent = option2.textContent = name;
      categorySelect.appendChild(option1);
      editCategorySelect.appendChild(option2);
    });
  });
}

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!expenseForm.checkValidity()) return;

  const name = document.getElementById('name').value;
  const amount = parseInt(document.getElementById('amount').value);
  const dueDate = new Date(document.getElementById('dueDate').value);
  const dueDay = dueDate.getDate();
  const category = categorySelect.value;
  const notes = document.getElementById('notes').value;
  const recurring = document.getElementById('recurring').checked;

  await db.collection('expenses').add({
    name, amount, dueDate: dueDate.toISOString(), dueDay, category, notes, recurring, balance: amount
  });

  expenseForm.reset();
  expenseForm.classList.remove('was-validated');
  checkAndGenerateRecurringExpenses();
loadExpenses();
checkAndGenerateRecurringExpenses();
});

function loadExpenses(categoryFilter = '', dateFilter = '') {
  let query = db.collection('expenses');
  if (categoryFilter) query = query.where('category', '==', categoryFilter);
  if (dateFilter) query = query.where('dueDate', '>=', dateFilter);
  query.orderBy('dueDate').get().then(snapshot => {
    const data = [];
    expenseList.innerHTML = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      d.id = doc.id;
      data.push(d);
    });
    renderExpenses(data);
    drawChart(data);
  });
}

function renderExpenses(data) {
  const selectedPeriod = document.getElementById('filterPayPeriod')?.value;
  let start = null, end = null;
  if (selectedPeriod) {
    [start, end] = selectedPeriod.split('|').map(date => new Date(date + 'T00:00:00'));
  }
  expenseList.innerHTML = '';
  data.forEach(d => {
    const li = document.createElement('li');
    const dueDate = new Date(d.dueDate + 'T00:00:00');
    const isOverdue = dueDate < new Date();
    const isInPeriod = start && end && dueDate >= start && dueDate <= end;
    li.className = 'list-group-item d-flex justify-content-between align-items-start' + (isOverdue ? ' list-group-item-danger' : '') + (isInPeriod ? ' border border-3 border-primary' : '');
    li.innerHTML = `
      <div class="me-3">
        <div class="form-check" title="Mark this expense as paid">
          <input class="form-check-input me-2" type="checkbox" id="paid-${d.id}" onclick="markAsPaid('${d.id}')" />
          <label class="form-check-label" for="paid-${d.id}">Paid</label>
        </div>
      </div>
      <div class="flex-grow-1">
        <strong>${d.name}</strong> - $${d.amount}
        <small class="text-muted">(${d.category})</small><br>
        <small>Due: ${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}${isOverdue ? ' <span class=\"badge bg-danger ms-2\">Overdue</span>' : ''}</small>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-primary" onclick="openEditModal('${d.id}')">Edit</button>
      </div>
    `;
    expenseList.appendChild(li);
  });
  };


function loadPaidExpenses() {
  db.collection('paidExpenses').orderBy('dueDate').get().then(snapshot => {
    paidExpenseList.innerHTML = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start';
      li.innerHTML = `
        <div>
          <strong>${d.name}</strong> - $${d.amount}
          <small class="text-muted">(${d.category})</small><br>
          <small>Paid: ${new Date(d.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
        </div>
      `;
      paidExpenseList.appendChild(li);
    });
  });
}

function markAsPaid(id) {
  const ref = db.collection('expenses').doc(id);
  ref.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      data.paidDate = new Date().toISOString();
      db.collection('paidExpenses').add(data).then(() => {
        ref.delete().then(() => {
          loadExpenses();
          loadPaidExpenses();
        });
      });
    }
  });
}

window.openEditModal = function (id) {
  db.collection('expenses').doc(id).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('editId').value = id;
      document.getElementById('editName').value = data.name;
      document.getElementById('editAmount').value = data.amount;
      document.getElementById('editDueDate').value = data.dueDate.substring(0, 10);
      document.getElementById('editCategory').value = data.category;
      document.getElementById('editRecurring').checked = data.recurring;
      document.getElementById('editNotes').value = data.notes || '';
      new bootstrap.Modal(document.getElementById('editModal')).show();
    }
  });
};

document.getElementById('editExpenseForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) return;

  const id = document.getElementById('editId').value;
  const updatedData = {
    name: document.getElementById('editName').value,
    amount: parseInt(document.getElementById('editAmount').value),
    dueDate: document.getElementById('editDueDate').value,
    dueDay: new Date(document.getElementById('editDueDate').value).getDate(),
    category: document.getElementById('editCategory').value,
    recurring: document.getElementById('editRecurring').checked,
    notes: document.getElementById('editNotes').value,
    balance: parseInt(document.getElementById('editAmount').value)
  };

  await db.collection('expenses').doc(id).update(updatedData);
  bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
  loadExpenses();
});

document.getElementById('deleteExpense').addEventListener('click', async () => {
  const id = document.getElementById('editId').value;
  await db.collection('expenses').doc(id).delete();
  bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
  loadExpenses();
});

function checkAndGenerateRecurringExpenses() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const key = `recurringCheck_${currentYear}_${currentMonth}`;

  // Prevent regeneration more than once per month
  if (localStorage.getItem(key)) return;

  db.collection('expenses')
    .where('recurring', '==', true)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const exp = doc.data();
        const expDueDate = new Date(exp.dueDate);

        if (expDueDate.getMonth() !== currentMonth || expDueDate.getFullYear() !== currentYear) {
          const newDueDate = new Date(currentYear, currentMonth, exp.dueDay);

          db.collection('expenses').add({
            ...exp,
            dueDate: newDueDate.toISOString(),
            dueDay: newDueDate.getDate(),
            balance: exp.amount
          });
        }
      });

      localStorage.setItem(key, 'true');
    });
};
function drawChart(data) {
  const categories = {};
  data.forEach(exp => {
    categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
  });

  const chartData = {
    labels: Object.keys(categories),
    datasets: [{
      label: 'Expenses by Category',
      data: Object.values(categories),
      backgroundColor: ['#0d6efd', '#6c757d', '#198754', '#dc3545', '#ffc107']
    }]
  };

  new Chart(budgetChart, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Expenses Summary' }
      }
    }
  });
}

loadCategories();

// Insert filter UI elements
const filterControls = document.createElement('div');
filterControls.className = 'd-flex flex-wrap gap-2 mb-3';
filterControls.innerHTML = `
  <select id="filterCategory" class="form-select" style="max-width: 200px">
    <option value="">All Categories</option>
  </select>
    <select id="filterPayPeriod" class="form-select" style="max-width: 200px">
    <option value="">All Pay Periods</option>
  </select>
  <button class="btn btn-primary" id="applyFilters">Apply Filters</button>
  <button class="btn btn-secondary" id="resetFilters">Reset</button>
`;
document.querySelector('#expenseList').parentElement.insertBefore(filterControls, document.querySelector('#expenseList'));

// Populate filter category dropdown
// Duplicate declaration removed
// Duplicate category dropdown population removed

// Generate pay period options starting from 2025-04-10 every 14 days for the next 6 months
const filterPayPeriod = document.getElementById('filterPayPeriod');
const startDate = new Date('2025-04-10');
const today = new Date();
const endDate = new Date('2025-12-31');
while (startDate <= endDate) {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 14);
  const opt = document.createElement('option');
  opt.value = `${startDate.toISOString().split('T')[0]}|${end.toISOString().split('T')[0]}`;
  opt.textContent = `${startDate.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  filterPayPeriod.appendChild(opt);
  startDate.setDate(startDate.getDate() + 14);
}

// Handle filter logic
document.getElementById('applyFilters').addEventListener('click', () => {
  const cat = document.getElementById('filterCategory').value;
    const payPeriod = document.getElementById('filterPayPeriod').value;

  if (payPeriod) {
    const [start, end] = payPeriod.split('|');
    db.collection('expenses')
      .where('dueDate', '>=', start)
      .where('dueDate', '<=', end)
      .orderBy('dueDate')
      .get()
      .then(snapshot => {
        expenseList.innerHTML = '';
        const filteredData = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (!cat || d.category === cat) {
            d.id = doc.id;
            filteredData.push(d);
          }
        });
        renderExpenses(filteredData);
      });
  } else {
    loadExpenses(cat);
  }
});

document.getElementById('resetFilters').addEventListener('click', () => {
  document.getElementById('filterCategory').value = '';
    document.getElementById('filterPayPeriod').value = '';
  loadExpenses();
});

// Populate filter category dropdown
const filterCategory = document.getElementById('filterCategory');
db.collection('expenseCategories').orderBy('name').get().then(snapshot => {
  snapshot.forEach(doc => {
    const { name } = doc.data();
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    filterCategory.appendChild(opt);
  });
});

// Handle filter logic
document.getElementById('applyFilters').addEventListener('click', () => {
  const cat = document.getElementById('filterCategory').value;
  
  loadExpenses(cat, date);
});

document.getElementById('resetFilters').addEventListener('click', () => {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterDate').value = '';
  loadExpenses();
});
loadExpenses();
loadPaidExpenses();