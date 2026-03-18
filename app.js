const state = {
  accessToken: localStorage.getItem("accessToken") || "",
  user: null,
  accounts: []
};

const messageBox = document.getElementById("messageBox");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const transferForm = document.getElementById("transferForm");
const accountsGrid = document.getElementById("accountsGrid");
const fromAccount = document.getElementById("fromAccount");
const toAccount = document.getElementById("toAccount");
const tokenStatus = document.getElementById("tokenStatus");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const totalBalance = document.getElementById("totalBalance");
const logoutButton = document.getElementById("logoutButton");
const refreshSessionButton = document.getElementById("refreshSessionButton");
const statusBadge = document.getElementById("statusBadge");

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

registerForm.addEventListener("submit", (event) => handleAuthSubmit(event, "/api/auth/register"));
loginForm.addEventListener("submit", (event) => handleAuthSubmit(event, "/api/auth/login"));
transferForm.addEventListener("submit", handleTransfer);
logoutButton.addEventListener("click", logout);
refreshSessionButton.addEventListener("click", refreshSession);

function switchTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  registerForm.classList.toggle("hidden", tabName !== "register");
  loginForm.classList.toggle("hidden", tabName !== "login");
  setMessage("");
}

function setMessage(message, isError = false) {
  messageBox.textContent = message;
  messageBox.style.color = isError ? "#b42318" : "#0a6d55";
}

function setAuth(accessToken, user) {
  state.accessToken = accessToken;
  state.user = user;
  localStorage.setItem("accessToken", accessToken);
  tokenStatus.textContent = accessToken ? "Available" : "Missing";
  statusBadge.textContent = accessToken ? "Signed in" : "Signed out";
  logoutButton.classList.toggle("hidden", !accessToken);
}

function clearAuth() {
  state.accessToken = "";
  state.user = null;
  state.accounts = [];
  localStorage.removeItem("accessToken");
  tokenStatus.textContent = "Missing";
  statusBadge.textContent = "Signed out";
  logoutButton.classList.add("hidden");
  renderDashboard();
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.accessToken) {
    headers.Authorization = `Bearer ${state.accessToken}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await refreshSession(true);

    if (refreshed) {
      return apiFetch(path, options);
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function handleAuthSubmit(event, endpoint) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  try {
    const data = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setAuth(data.accessToken, data.user);
    setMessage(data.message);
    event.currentTarget.reset();
    await loadAccounts();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function loadAccounts() {
  try {
    const data = await apiFetch("/api/accounts/me");
    state.user = data.user;
    state.accounts = data.accounts;
    renderDashboard();
  } catch (error) {
    setMessage(error.message, true);
  }
}

function renderDashboard() {
  userName.textContent = state.user?.name || "Guest User";
  userEmail.textContent = state.user?.email || "Sign in to load account details.";

  const balance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  totalBalance.textContent = formatCurrency(balance);

  accountsGrid.innerHTML = state.accounts
    .map(
      (account) => `
        <article class="account-card">
          <p class="eyebrow">${account.type} account</p>
          <h4>${account.accountNumber}</h4>
          <p>Currency: ${account.currency}</p>
          <p class="amount">${formatCurrency(account.balance)}</p>
        </article>
      `
    )
    .join("");

  const optionsMarkup = state.accounts
    .map(
      (account) =>
        `<option value="${account._id}">${capitalize(account.type)} • ${account.accountNumber.slice(-4)}</option>`
    )
    .join("");

  fromAccount.innerHTML = `<option value="">Select source</option>${optionsMarkup}`;
  toAccount.innerHTML = `<option value="">Select destination</option>${optionsMarkup}`;
}

async function handleTransfer(event) {
  event.preventDefault();

  try {
    const payload = {
      fromAccountId: fromAccount.value,
      toAccountId: toAccount.value,
      amount: document.getElementById("transferAmount").value
    };
    const data = await apiFetch("/api/accounts/transfer", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    state.accounts = data.accounts;
    renderDashboard();
    transferForm.reset();
    setMessage(data.message);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function refreshSession(silent = false) {
  try {
    const data = await apiFetch("/api/auth/refresh", { method: "POST" });
    setAuth(data.accessToken, data.user);

    if (!silent) {
      setMessage(data.message);
    }

    await loadAccounts();
    return true;
  } catch (error) {
    if (!silent) {
      setMessage(error.message, true);
    }

    clearAuth();
    return false;
  }
}

async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setMessage("Logged out successfully.");
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    clearAuth();
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

if (state.accessToken) {
  loadAccounts();
} else {
  refreshSession(true);
}
