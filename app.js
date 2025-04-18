import {
    db,
    auth,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    signInWithEmailAndPassword,
    onAuthStateChanged
  } from "./firebase-config.js";
  
  const loginBtn = document.getElementById("login-btn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const paidExpenseList = document.getElementById("paid-expense-list");
  const authSection = document.getElementById("auth-section");
  const appSection = document.getElementById("app-section");
  const categorySelect = document.getElementById("category");
  
  const editModalEl = document.getElementById("editModal");
  const editModal = new bootstrap.Modal(editModalEl);
  const editForm = document.getElementById("edit-form");
  const editName = document.getElementById("edit-name");
  const editAmount = document.getElementById("edit-amount");
  const editDate = document.getElementById("edit-date");
  const editCategory = document.getElementById("edit-category");
  
  let currentUser = null;
  let currentEditDocRef = null;
  
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      authSection.style.display = "none";
      appSection.style.display = "block";
      loadCategories();
      loadExpenses();
    } else {
      authSection.style.display = "block";
      appSection.style.display = "none";
    }
  });
  
  async function loadCategories() {
    categorySelect.innerHTML = `<option value="">Select Category</option>`;
    editCategory.innerHTML = `<option value="">Select Category</option>`;
    const categoriesSnapshot = await getDocs(collection(db, "expenseCategories"));
    categoriesSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const option1 = new Option(data.name, data.name);
      const option2 = new Option(data.name, data.name);
      categorySelect.appendChild(option1);
      editCategory.appendChild(option2);
    });
  }
  
  async function loadExpenses() {
    expenseList.innerHTML = '';
    paidExpenseList.innerHTML = '';
  
    const q = query(collection(db, "monthlyExpenses"), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);
  
    let unpaidTotal = 0;
    let paidTotal = 0;
  
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
  
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input me-2";
      checkbox.checked = data.paid === true;
      checkbox.addEventListener("change", async () => {
        await updateDoc(docSnap.ref, { paid: checkbox.checked });
        loadExpenses();
      });
  
      const label = document.createElement("span");
      label.textContent = `${data.date} - ${data.name}: $${parseFloat(data.amount).toFixed(2)}`;
  
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary ms-2";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        currentEditDocRef = docSnap.ref;
        editName.value = data.name;
        editAmount.value = data.amount;
        editDate.value = data.date;
        editCategory.value = data.category;
        editModal.show();
      });
  
      const left = document.createElement("div");
      left.className = "d-flex align-items-center";
      left.appendChild(checkbox);
      left.appendChild(label);
  
      const right = document.createElement("div");
      right.appendChild(editBtn);
  
      li.appendChild(left);
      li.appendChild(right);
  
      if (checkbox.checked) {
        paidExpenseList.appendChild(li);
        paidTotal += parseFloat(data.amount || 0);
      } else {
        expenseList.appendChild(li);
        unpaidTotal += parseFloat(data.amount || 0);
      }
    });
  
    document.getElementById("total-unpaid").innerHTML = `Unpaid Total: $${unpaidTotal.toFixed(2)}`;
    document.getElementById("total-paid").innerHTML = `Paid Total: $${paidTotal.toFixed(2)}`;
  }
  
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const category = categorySelect.value;
  
    if (!name || isNaN(amount) || !date || !category) {
      alert("Please fill all fields.");
      return;
    }
  
    try {
      await addDoc(collection(db, "monthlyExpenses"), {
        name,
        amount,
        date,
        category,
        paid: false,
        uid: currentUser.uid
      });
      expenseForm.reset();
      loadExpenses();
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  });
  
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentEditDocRef) return;
  
    try {
      await updateDoc(currentEditDocRef, {
        name: editName.value.trim(),
        amount: parseFloat(editAmount.value),
        date: editDate.value,
        category: editCategory.value
      });
      editModal.hide();
      loadExpenses();
    } catch (err) {
      console.error("Failed to update:", err);
    }
  });
  