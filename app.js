/* ============================================================
   app.js — DATA BANK — Library Management System
   All CRUD operations now call Supabase via database.js helpers.
   Depends on: database.js (must be loaded first)
   ============================================================ */

'use strict';

/* ============================================================
   APPLICATION STATE
   ============================================================ */

let currentUser    = null;
let toastHideTimer = null;

/* ============================================================
   AUTH SCREEN INITIALIZATION
   ============================================================ */

window.onload = async function () {
  await loadDatabase();                       // fetch from Supabase

  if (getElement('auth-stat-books'))
    getElement('auth-stat-books').textContent = db.books.length;
  if (getElement('auth-stat-members'))
    getElement('auth-stat-members').textContent = db.members.filter(m => m.isActive).length;
  if (getElement('auth-stat-staff'))
    getElement('auth-stat-staff').textContent = db.staff.length;
};

/* ============================================================
   UTILITY — DOM & DATA LOOKUPS
   ============================================================ */

function getElement(id)            { return document.getElementById(id); }
function findBookById(id)          { return db.books.find(b => b.id === id); }
function findAuthorById(id)        { return db.authors.find(a => a.id === id); }
function findCategoryById(id)      { return db.categories.find(c => c.id === id); }
function findMemberById(id)        { return db.members.find(m => m.id === id); }
function findStaffById(id)         { return db.staff.find(s => s.id === id); }

function getMemberFullName(memberId) {
  const m = findMemberById(memberId);
  return m ? `${m.firstName} ${m.lastName}` : '—';
}
function getBookTitle(bookId) {
  const b = findBookById(bookId);
  return b ? b.title : '—';
}
function getAuthorFullName(authorId) {
  const a = findAuthorById(authorId);
  return a ? `${a.firstName} ${a.lastName}` : '—';
}
function getTodayDateString() { return new Date().toISOString().split('T')[0]; }
function addDaysToDate(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function getInitials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

/* ============================================================
   UTILITY — BADGES & TOASTS
   ============================================================ */

function renderBadge(text, color) {
  return `<span class="badge badge-${color}">${text}</span>`;
}

function renderStatusBadge(status) {
  const green = ['Active', 'Fulfilled', 'Paid'];
  const red   = ['Overdue', 'Cancelled', 'Unpaid'];
  const teal  = ['Returned', 'Inactive'];
  if (green.includes(status))  return renderBadge(status, 'green');
  if (red.includes(status))    return renderBadge(status, 'red');
  if (teal.includes(status))   return renderBadge(status, 'teal');
  if (status === 'Pending')    return renderBadge(status, 'amber');
  return renderBadge(status, 'gray');
}

function showToast(message, type = 'success') {
  const el = getElement('toast-notification');
  el.textContent = message;
  el.className = `toast-notification toast-${type} show`;
  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function showLoading(message = 'Loading…') {
  const el = getElement('toast-notification');
  el.textContent = message;
  el.className = 'toast-notification toast-info show';
}

function hideLoading() {
  const el = getElement('toast-notification');
  el.classList.remove('show');
}

/* ============================================================
   MODALS
   ============================================================ */

function openModal(modalId) {
  getElement(modalId).classList.add('open');
  populateModalDropdowns(modalId);
}

function closeModal(modalId) {
  getElement(modalId).classList.remove('open');
}

function populateModalDropdowns(modalId) {
  if (modalId === 'loan-modal') {
    getElement('loan-modal-member').innerHTML = db.members
      .filter(m => m.isActive)
      .map(m => `<option value="${m.id}">${m.firstName} ${m.lastName}</option>`)
      .join('');
    getElement('loan-modal-book').innerHTML = db.books
      .map(b => `<option value="${b.id}">${b.title}</option>`)
      .join('');
    getElement('loan-modal-staff').innerHTML = db.staff
      .map(s => `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`)
      .join('');
    getElement('loan-modal-loan-date').value = getTodayDateString();
    getElement('loan-modal-due-date').value  = addDaysToDate(getTodayDateString(), 14);
  }

  if (modalId === 'reservation-modal') {
    getElement('reservation-modal-member').innerHTML = db.members
      .filter(m => m.isActive)
      .map(m => `<option value="${m.id}">${m.firstName} ${m.lastName}</option>`)
      .join('');
    getElement('reservation-modal-book').innerHTML = db.books
      .map(b => `<option value="${b.id}">${b.title}</option>`)
      .join('');
    getElement('reservation-modal-date').value   = getTodayDateString();
    getElement('reservation-modal-expiry').value = addDaysToDate(getTodayDateString(), 7);
  }

  if (modalId === 'book-modal') {
    getElement('book-modal-category').innerHTML = db.categories
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');
    getElement('book-modal-author').innerHTML = db.authors
      .map(a => `<option value="${a.id}">${a.firstName} ${a.lastName}</option>`)
      .join('');
  }

  if (modalId === 'profile-modal' && currentUser?.role === 'member') {
    const m = currentUser.member;
    getElement('profile-modal-first-name').value = m.firstName;
    getElement('profile-modal-last-name').value  = m.lastName;
    getElement('profile-modal-phone').value      = m.phone   || '';
    getElement('profile-modal-address').value    = m.address || '';
  }

  if (modalId === 'fine-modal') {
    getElement('fine-modal-loan').innerHTML = db.loans
      .filter(l => l.status === 'Active' || l.status === 'Overdue')
      .map(l => {
        const m = findMemberById(l.memberId);
        const b = findBookById(l.bookId);
        return `<option value="${l.id}">${m ? m.lastName : 'Unknown'} — ${b ? b.title : 'Unknown'}</option>`;
      })
      .join('');
  }
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */

let selectedLoginRole = 'member';

function selectLoginRole(roleName) {
  selectedLoginRole = roleName;
  getElement('role-card-member').classList.toggle('selected', roleName === 'member');
  getElement('role-card-admin').classList.toggle('selected',  roleName === 'admin');
}

function switchAuthTab(tabName) {
  const tabs = getElement('auth-tabs').querySelectorAll('.auth-tab');
  tabs[0].classList.toggle('active', tabName === 'login');
  tabs[1].classList.toggle('active', tabName === 'signup');
  getElement('login-form').style.display  = tabName === 'login'  ? '' : 'none';
  getElement('signup-form').style.display = tabName === 'signup' ? '' : 'none';
}

async function handleLogin() {
  const email    = getElement('login-email').value.trim();
  const password = getElement('login-password').value;
  const errEl    = getElement('login-error');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Please enter your email and password.';
    errEl.style.display = 'block';
    return;
  }

  if (selectedLoginRole === 'admin') {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      currentUser = { role: 'admin' };
      enterApp();
    } else {
      errEl.textContent = 'Invalid admin credentials.';
      errEl.style.display = 'block';
    }
    return;
  }

  // Member login — check against Supabase-fetched cache
  const match = db.members.find(m => m.email === email && m.password === password);
  if (!match) {
    errEl.textContent = 'No account found with those credentials.';
    errEl.style.display = 'block';
    return;
  }
  if (!match.isActive) {
    errEl.textContent = 'This account is inactive. Please contact the library.';
    errEl.style.display = 'block';
    return;
  }
  currentUser = { role: 'member', member: match };
  enterApp();
}

async function handleSignup() {
  const firstName      = getElement('signup-first-name').value.trim();
  const lastName       = getElement('signup-last-name').value.trim();
  const email          = getElement('signup-email').value.trim();
  const phone          = getElement('signup-phone').value.trim();
  const membershipType = getElement('signup-membership-type').value;
  const password       = getElement('signup-password').value;
  const passwordConfirm = getElement('signup-confirm-password').value;

  const errEl  = getElement('signup-error');
  const succEl = getElement('signup-success');
  errEl.style.display = 'none';
  succEl.style.display = 'none';

  if (!firstName || !lastName || !email || !password) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (password !== passwordConfirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  if (db.members.find(m => m.email === email)) {
    errEl.textContent = 'An account with this email already exists.';
    errEl.style.display = 'block';
    return;
  }

  const today    = getTodayDateString();
  const expiry   = addDaysToDate(today, 365);

  try {
    showLoading('Creating account…');
    const newMember = await insertMember({
      firstName,
      lastName,
      email,
      password,
      phone,
      membershipType,
      joinDate:  today,
      expiryDate: expiry,
      isActive:  true,
      address:   '',
    });
    db.members.push(newMember);
    hideLoading();

    succEl.textContent = `Account created! You can now sign in as ${firstName} ${lastName}.`;
    succEl.style.display = 'block';

    ['signup-first-name','signup-last-name','signup-email',
     'signup-phone','signup-password','signup-confirm-password']
      .forEach(id => { getElement(id).value = ''; });

    setTimeout(() => switchAuthTab('login'), 2000);
  } catch (err) {
    hideLoading();
    errEl.textContent = 'Error creating account: ' + (err.message || err);
    errEl.style.display = 'block';
  }
}

/* ============================================================
   APP ENTRY & LOGOUT
   ============================================================ */

const ADMIN_NAVIGATION = [
  { sectionLabel: 'Overview',     items: [{ pageId: 'dashboard', icon: '⊞', label: 'Dashboard' }] },
  { sectionLabel: 'Catalog',      items: [{ pageId: 'books', icon: '📚', label: 'Books' }, { pageId: 'authors', icon: '✍️', label: 'Authors' }] },
  { sectionLabel: 'Circulation',  items: [
    { pageId: 'members-admin',      icon: '👥', label: 'Members'      },
    { pageId: 'loans-admin',        icon: '📋', label: 'Loans'        },
    { pageId: 'reservations-admin', icon: '🔖', label: 'Reservations' },
    { pageId: 'fines-admin',        icon: '💰', label: 'Fines'        },
  ]},
  { sectionLabel: 'System', items: [
    { pageId: 'staff', icon: '🛡️', label: 'Staff'       },
    { pageId: 'sql',   icon: '⌨️', label: 'SQL Queries' },
  ]},
];

const MEMBER_NAVIGATION = [
  { sectionLabel: 'My Library', items: [
    { pageId: 'member-home',    icon: '⊞', label: 'My Dashboard' },
    { pageId: 'member-browse',  icon: '📚', label: 'Browse Books' },
    { pageId: 'member-history', icon: '📋', label: 'Loan History' },
    { pageId: 'member-fines',   icon: '💰', label: 'My Fines'     },
    { pageId: 'member-profile', icon: '👤', label: 'My Profile'   },
  ]},
];

function enterApp() {
  getElement('auth-screen').style.display = 'none';
  getElement('app-screen').classList.add('visible');

  const isAdmin   = currentUser.role === 'admin';
  const navDef    = isAdmin ? ADMIN_NAVIGATION : MEMBER_NAVIGATION;

  buildSidebarNavigation(navDef);
  updateSidebarUserCard(isAdmin);
  showOverdueNotificationIfNeeded();

  const firstPage = isAdmin ? 'dashboard' : 'member-home';
  showPage(firstPage, getElement(`nav-${firstPage}`));
}

function buildSidebarNavigation(navDef) {
  getElement('sidebar-nav').innerHTML = navDef.map(section => `
    <div class="nav-section">${section.sectionLabel}</div>
    ${section.items.map(item => `
      <div class="nav-item" id="nav-${item.pageId}" onclick="showPage('${item.pageId}', this)">
        <span class="nav-icon">${item.icon}</span>${item.label}
      </div>
    `).join('')}
  `).join('');
}

function updateSidebarUserCard(isAdmin) {
  const avatar   = getElement('sidebar-avatar');
  const name     = getElement('sidebar-name');
  const role     = getElement('sidebar-role');
  const topName  = getElement('topbar-user-name');

  if (isAdmin) {
    avatar.textContent           = 'AD';
    avatar.style.backgroundColor = 'var(--color-gold-subtle)';
    avatar.style.color           = 'var(--color-gold)';
    name.textContent             = 'Administrator';
    role.textContent             = 'Admin Account';
    topName.textContent          = 'Admin';
  } else {
    const m = currentUser.member;
    const initials = getInitials(m.firstName, m.lastName);
    avatar.textContent           = initials;
    avatar.style.backgroundColor = 'var(--color-teal-subtle)';
    avatar.style.color           = 'var(--color-teal)';
    name.textContent             = `${m.firstName} ${m.lastName}`;
    role.textContent             = `${m.membershipType} Member`;
    topName.textContent          = m.firstName;
  }
}

function showOverdueNotificationIfNeeded() {
  const count = db.loans.filter(l => l.status === 'Overdue').length;
  if (count > 0) getElement('notification-dot').style.display = 'block';
}

function handleLogout() {
  currentUser = null;
  getElement('app-screen').classList.remove('visible');
  getElement('auth-screen').style.display = 'flex';
  getElement('login-email').value    = '';
  getElement('login-password').value = '';
  getElement('login-error').style.display = 'none';
  selectLoginRole('member');
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const PAGE_TITLES = {
  'dashboard':           'Dashboard',
  'books':               'Books',
  'authors':             'Authors',
  'members-admin':       'Members',
  'loans-admin':         'Loans',
  'reservations-admin':  'Reservations',
  'fines-admin':         'Fines',
  'staff':               'Staff',
  'sql':                 'SQL Queries',
  'member-home':         'My Dashboard',
  'member-browse':       'Browse Catalog',
  'member-history':      'Loan History',
  'member-fines':        'My Fines',
  'member-profile':      'My Profile',
};

const PAGE_RENDER_FUNCTIONS = {
  'dashboard':           renderDashboard,
  'books':               renderBooksPage,
  'authors':             renderAuthorsPage,
  'members-admin':       renderMembersAdminPage,
  'loans-admin':         renderLoansAdminPage,
  'reservations-admin':  renderReservationsPage,
  'fines-admin':         renderFinesPage,
  'staff':               renderStaffPage,
  'sql':                 renderSqlPage,
  'member-home':         renderMemberHomePage,
  'member-browse':       renderMemberBrowsePage,
  'member-history':      renderMemberHistoryPage,
  'member-fines':        renderMemberFinesPage,
  'member-profile':      renderMemberProfilePage,
};

function showPage(pageId, clickedEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = getElement(`page-${pageId}`);
  if (page) page.classList.add('active');
  if (clickedEl) clickedEl.classList.add('active');

  getElement('topbar-title').textContent = PAGE_TITLES[pageId] || pageId;

  const fn = PAGE_RENDER_FUNCTIONS[pageId];
  if (fn) fn();
}

/* ============================================================
   ADMIN RENDERS
   ============================================================ */

function renderDashboard() {
  const activeLoansCount  = db.loans.filter(l => l.status === 'Active').length;
  const overdueLoansCount = db.loans.filter(l => l.status === 'Overdue').length;
  const totalUnpaidFines  = db.fines.filter(f => !f.isPaid).reduce((t, f) => t + f.amount, 0);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  getElement('dashboard-greeting').textContent = `${greeting}, Admin 👋`;

  const stats = [
    { icon: '📚', label: 'Total Books',   value: db.books.length,
      meta: `${db.categories.length} categories`, bg: 'var(--color-gold-subtle)', color: 'var(--color-gold)' },
    { icon: '👥', label: 'Members',       value: db.members.filter(m => m.isActive).length,
      meta: 'Active accounts',              bg: 'var(--color-teal-subtle)', color: 'var(--color-teal)' },
    { icon: '📋', label: 'Active Loans',  value: activeLoansCount,
      meta: `${overdueLoansCount} overdue`, bg: 'var(--color-blue-subtle)', color: 'var(--color-blue)' },
    { icon: '💰', label: 'Unpaid Fines',  value: `₱${totalUnpaidFines.toLocaleString()}`,
      meta: `${db.fines.filter(f => !f.isPaid).length} pending`,
      bg: 'var(--color-red-subtle)',  color: 'var(--color-red)' },
  ];

  getElement('admin-stats-row').innerHTML = stats.map((s, i) => `
    <div class="stat-card" style="animation-delay:${i*0.07}s">
      <div class="stat-top">
        <div><div class="stat-label">${s.label}</div></div>
        <div class="stat-icon" style="background-color:${s.bg};color:${s.color}">${s.icon}</div>
      </div>
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-meta">${s.meta}</div>
    </div>
  `).join('');

  const recentLoans = [...db.loans].reverse().slice(0, 7);
  getElement('dashboard-recent-loans').innerHTML = recentLoans.map(l => `
    <tr>
      <td>${getMemberFullName(l.memberId)}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${getBookTitle(l.bookId)}</td>
      <td>${renderStatusBadge(l.status)}</td>
    </tr>
  `).join('');

  const overdue = db.loans.filter(l => l.status === 'Overdue');
  getElement('dashboard-overdue-loans').innerHTML = overdue.length
    ? overdue.map(l => `
        <tr>
          <td>${getMemberFullName(l.memberId)}</td>
          <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${getBookTitle(l.bookId)}</td>
          <td style="color:var(--color-red);font-size:12.5px">${l.dueDate}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3"><div class="empty-state"><div class="empty-state-icon">✓</div><p>No overdue loans</p></div></td></tr>`;
}

function renderBooksPage() {
  const q = (getElement('book-search-input')?.value || '').toLowerCase();
  const filtered = db.books.filter(b => !q || b.title.toLowerCase().includes(q) || b.isbn.includes(q));
  const empty = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📚</div><p>No books found</p></div></td></tr>`;

  getElement('books-table-body').innerHTML = filtered.length
    ? filtered.map(b => {
        const author   = findAuthorById(b.authorId);
        const category = findCategoryById(b.categoryId);
        return `
          <tr>
            <td style="font-family:monospace;font-size:12px;color:var(--color-text-muted)">${b.isbn}</td>
            <td style="font-weight:500">${b.title}</td>
            <td>${author ? getAuthorFullName(b.authorId) : '—'}</td>
            <td>${category ? renderBadge(category.name, 'blue') : ''}</td>
            <td style="color:var(--color-text-secondary)">${b.publishYear}</td>
            <td><span style="font-weight:600;color:var(--color-teal)">${b.totalCopies}</span></td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditBookModal(${b.id})">✎</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBook(${b.id})">✕</button>
              </div>
            </td>
          </tr>
        `;
      }).join('')
    : empty;
}

function renderAuthorsPage() {
  const tbody = getElement('authors-table-body');
  if (!tbody) return;
  tbody.innerHTML = db.authors.map(a => {
    const count = db.books.filter(b => b.authorId === a.id).length;
    return `
      <tr>
        <td style="font-weight:500">${a.firstName} ${a.lastName}</td>
        <td>${a.nationality || '—'}</td>
        <td>${a.birthYear   || '—'}</td>
        <td>${count}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteAuthor(${a.id})">✕</button></td>
      </tr>
    `;
  }).join('');
}

function renderMembersAdminPage() {
  const q = (getElement('member-search-input')?.value || '').toLowerCase();
  const filtered = db.members.filter(m =>
    !q || `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
  );
  const typeColors = { Student: 'teal', Faculty: 'gold', Public: 'blue' };

  getElement('members-table-body').innerHTML = filtered.map(m => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:30px;height:30px;border-radius:50%;background-color:var(--color-teal-subtle);
                      color:var(--color-teal);display:flex;align-items:center;justify-content:center;
                      font-size:11px;font-weight:600;flex-shrink:0">
            ${getInitials(m.firstName, m.lastName)}
          </div>
          <span style="font-weight:500">${m.firstName} ${m.lastName}</span>
        </div>
      </td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${m.email}</td>
      <td>${renderBadge(m.membershipType, typeColors[m.membershipType] || 'gray')}</td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${m.expiryDate || '—'}</td>
      <td>${renderBadge(m.isActive ? 'Active' : 'Inactive', m.isActive ? 'green' : 'red')}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditMemberModal(${m.id})">✎</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="toggleMemberActiveStatus(${m.id})">
            ${m.isActive ? '✕' : '↺'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderLoansAdminPage() {
  const q = (getElement('loan-search-input')?.value || '').toLowerCase();
  const filtered = db.loans.filter(l =>
    !q || getMemberFullName(l.memberId).toLowerCase().includes(q) || getBookTitle(l.bookId).toLowerCase().includes(q)
  );

  getElement('loans-table-body').innerHTML = filtered.map(l => `
    <tr>
      <td style="font-weight:500">${getMemberFullName(l.memberId)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${getBookTitle(l.bookId)}</td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${l.loanDate}</td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${l.dueDate}</td>
      <td style="font-size:13px;color:var(--color-text-muted)">${l.returnDate || '—'}</td>
      <td>${renderStatusBadge(l.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${l.status === 'Active' || l.status === 'Overdue'
            ? `<button class="btn btn-success btn-sm" onclick="markLoanAsReturned(${l.id})">Return</button>`
            : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLoan(${l.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderReservationsPage() {
  getElement('reservations-table-body').innerHTML = db.reservations.map(r => {
    const m = findMemberById(r.memberId);
    const b = findBookById(r.bookId);
    return `
      <tr>
        <td style="font-weight:500">${m ? `${m.firstName} ${m.lastName}` : '—'}</td>
        <td style="font-size:13px">${b ? b.title : '—'}</td>
        <td style="font-size:13px;color:var(--color-text-secondary)">${r.reservationDate}</td>
        <td style="font-size:13px;color:var(--color-text-secondary)">${r.expiryDate}</td>
        <td>${renderStatusBadge(r.status)}</td>
        <td>${r.status === 'Pending'
          ? `<button class="btn btn-danger btn-sm" onclick="cancelReservation(${r.id})">Cancel</button>`
          : ''}</td>
      </tr>
    `;
  }).join('');
}

function renderFinesPage() {
  getElement('fines-table-body').innerHTML = db.fines.map(f => {
    const loan   = db.loans.find(l => l.id === f.loanId);
    const member = loan ? getMemberFullName(loan.memberId) : '—';
    const book   = loan ? getBookTitle(loan.bookId) : '—';
    return `
      <tr>
        <td style="font-weight:500">${member}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${book}</td>
        <td><span style="font-weight:700;color:${f.isPaid ? 'var(--color-green)' : 'var(--color-red)'}">₱${f.amount.toFixed(2)}</span></td>
        <td style="font-size:13px;color:var(--color-text-secondary)">${f.reason}</td>
        <td>${renderBadge(f.isPaid ? 'Paid' : 'Unpaid', f.isPaid ? 'green' : 'red')}</td>
        <td>${!f.isPaid
          ? `<button class="btn btn-success btn-sm" onclick="markFineAsPaid(${f.id})">Mark Paid</button>`
          : ''}</td>
      </tr>
    `;
  }).join('');
}

function renderStaffPage() {
  const roleColors = { Librarian: 'gold', Assistant: 'teal', Admin: 'blue' };

  getElement('staff-table-body').innerHTML = db.staff.map(s => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:30px;height:30px;border-radius:50%;background-color:var(--color-gold-subtle);
                      color:var(--color-gold);display:flex;align-items:center;justify-content:center;
                      font-size:11px;font-weight:600">
            ${getInitials(s.firstName, s.lastName)}
          </div>
          <span style="font-weight:500">${s.firstName} ${s.lastName}</span>
        </div>
      </td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${s.email}</td>
      <td>${renderBadge(s.role, roleColors[s.role] || 'gray')}</td>
      <td style="font-size:13px;color:var(--color-text-secondary)">${s.hireDate}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditStaffModal(${s.id})">✎</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteStaff(${s.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   SQL PAGE RENDER (unchanged — uses in-memory db cache)
   ============================================================ */

const SQL_QUERY_SECTIONS = [
  {
    sectionLabel: 'SELECT Queries (Q1–Q10)', labelColor: 'var(--color-teal)',
    queries: [
      { name: 'Q1 — Books with categories',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nORDER BY c.categoryname, b.title;` },
      { name: 'Q2 — Active members',
        sql: `SELECT memberid, CONCAT(firstname, ' ', lastname) AS full_name,\n       email, membershiptype\nFROM members\nWHERE isactive = 1\nORDER BY lastname;` },
      { name: 'Q3 — Currently borrowed books (Active loans)',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS borrower,\n       b.title, l.loandate, l.duedate\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nWHERE l.status = 'Active';` },
      { name: 'Q4 — Overdue loans',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS borrower,\n       b.title, l.duedate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nWHERE l.status = 'Overdue'\nORDER BY l.duedate;` },
      { name: 'Q5 — Books with high stock (5+ copies)',
        sql: `SELECT bookid, title, isbn, totalcopies\nFROM books\nWHERE totalcopies >= 5\nORDER BY totalcopies DESC;` },
      { name: 'Q6 — Loan history of member #1',
        sql: `SELECT l.loanid, b.title, l.loandate, l.duedate, l.returndate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nWHERE l.memberid = 1;` },
      { name: 'Q7 — Books in Fiction/Mystery/Sci-Fi',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE c.categoryname IN ('Fiction', 'Mystery', 'Science Fiction')\nORDER BY c.categoryname, b.title;` },
      { name: 'Q8 — Books by author (Orwell)',
        sql: `SELECT b.title, b.isbn, b.publishyear, c.categoryname\nFROM books b\nJOIN bookauthors ba ON b.bookid = ba.bookid\nJOIN authors a ON ba.authorid = a.authorid\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE a.lastname = 'Orwell';` },
      { name: 'Q9 — Members with unpaid fines',
        sql: `SELECT CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       m.email, f.amount, f.reason\nFROM fines f\nJOIN loans l ON f.loanid = l.loanid\nJOIN members m ON l.memberid = m.memberid\nWHERE f.ispaid = 0;` },
      { name: 'Q10 — Search books by keyword (History)',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE b.title LIKE '%History%';` },
    ],
  },
  {
    sectionLabel: 'JOIN Queries (J1–J3)', labelColor: 'var(--color-gold)',
    queries: [
      { name: 'J1 — Full loan details (4-table JOIN)',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS member,\n       b.title, CONCAT(s.firstname, ' ', s.lastname) AS staff,\n       l.loandate, l.duedate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nJOIN staff s ON l.staffid = s.staffid\nORDER BY l.loandate DESC;` },
      { name: 'J2 — Reservations with member, book, and category',
        sql: `SELECT r.reservationid,\n       CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       b.title, c.categoryname, r.reservationdate, r.status\nFROM reservations r\nJOIN members m ON r.memberid = m.memberid\nJOIN books b ON r.bookid = b.bookid\nJOIN categories c ON b.categoryid = c.categoryid;` },
      { name: 'J3 — Fine details with member and book',
        sql: `SELECT f.fineid, CONCAT(m.firstname, ' ', m.lastname) AS member,\n       b.title, f.amount, f.reason, f.ispaid\nFROM fines f\nJOIN loans l ON f.loanid = l.loanid\nJOIN members m ON l.memberid = m.memberid\nJOIN books b ON l.bookid = b.bookid;` },
    ],
  },
  {
    sectionLabel: 'Aggregate Queries (A1–A2)', labelColor: 'var(--color-blue)',
    queries: [
      { name: 'A1 — Total loans per member (COUNT)',
        sql: `SELECT CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       COUNT(l.loanid) AS total_loans\nFROM members m\nLEFT JOIN loans l ON m.memberid = l.memberid\nGROUP BY m.memberid\nORDER BY total_loans DESC;` },
      { name: 'A2 — Fine summary: SUM and AVG of unpaid amounts',
        sql: `SELECT COUNT(fineid) AS unpaid_count,\n       SUM(amount) AS total_due,\n       AVG(amount) AS average_fine\nFROM fines\nWHERE ispaid = 0;` },
    ],
  },
  {
    sectionLabel: 'Subqueries (S1–S2)', labelColor: 'var(--color-amber)',
    queries: [
      { name: 'S1 — Members who have overdue loans (IN subquery)',
        sql: `SELECT firstname, email\nFROM members\nWHERE memberid IN (\n  SELECT memberid FROM loans WHERE status = 'Overdue'\n);` },
      { name: 'S2 — Categories that have books in the catalog (EXISTS)',
        sql: `SELECT categoryname\nFROM categories\nWHERE categoryid IN (\n  SELECT categoryid FROM books\n);` },
    ],
  },
  {
    sectionLabel: 'UPDATE Queries (U1–U2)', labelColor: 'var(--color-green)',
    queries: [
      { name: 'U1 — Mark loan as returned',
        sql: `UPDATE loans\nSET returndate = '2025-05-04', status = 'Returned'\nWHERE loanid = 19;` },
      { name: 'U2 — Renew member subscription expiry',
        sql: `UPDATE members\nSET expirydate = '2027-01-10'\nWHERE memberid = 1;` },
    ],
  },
  {
    sectionLabel: 'DELETE Queries (D1–D2)', labelColor: 'var(--color-red)',
    queries: [
      { name: 'D1 — Remove cancelled reservations',
        sql: `DELETE FROM reservations\nWHERE status = 'Cancelled';` },
      { name: 'D2 — Remove inactive staff record',
        sql: `DELETE FROM staff\nWHERE staffid = 20;` },
    ],
  },
  {
    sectionLabel: 'N:M Relationship — BookAuthors Bridge Table', labelColor: 'var(--color-teal)',
    queries: [
      { name: 'NM1 — All books with their authors (N:M JOIN)',
        sql: `SELECT b.title, CONCAT(a.firstname, ' ', a.lastname) AS author_name, ba.role\nFROM bookauthors ba\nJOIN books b ON ba.bookid = b.bookid\nJOIN authors a ON ba.authorid = a.authorid\nORDER BY b.title, ba.role;` },
      { name: 'NM2 — Books with co-authors only',
        sql: `SELECT b.title, CONCAT(a.firstname, ' ', a.lastname) AS co_author\nFROM bookauthors ba\nJOIN books b ON ba.bookid = b.bookid\nJOIN authors a ON ba.authorid = a.authorid\nWHERE ba.role = 'Co-Author';` },
      { name: 'NM3 — Authors and how many books they contributed to',
        sql: `SELECT CONCAT(a.firstname, ' ', a.lastname) AS author_name,\n       COUNT(ba.bookid) AS books_contributed\nFROM authors a\nJOIN bookauthors ba ON a.authorid = ba.authorid\nGROUP BY a.authorid\nORDER BY books_contributed DESC;` },
    ],
  },
];

function highlightSqlSyntax(rawSql) {
  const kws = ['SELECT','FROM','WHERE','JOIN','LEFT','ON','GROUP BY','ORDER BY','HAVING','UPDATE',
    'SET','DELETE','INSERT','CREATE','TABLE','REFERENCES','NOT NULL','AUTO_INCREMENT','UNIQUE',
    'VALUES','DROP','AND','OR','IN','NOT','AS','IS','NULL','LIKE','CASE','WHEN','THEN','ELSE',
    'END','COALESCE','DISTINCT','BY','INTO','CONCAT','COUNT','SUM','AVG','MAX','MIN','INNER','OUTER'];
  return rawSql
    .replace(/--[^\n]*/g, m => `<span class="sql-comment">${m}</span>`)
    .replace(new RegExp(`\\b(${kws.join('|')})\\b`, 'g'), m => `<span class="sql-keyword">${m}</span>`)
    .replace(/'([^']*)'/g, m => `<span class="sql-string">${m}</span>`)
    .replace(/\b(\d+)\b/g, m => `<span class="sql-number">${m}</span>`);
}

function renderSqlPage() {
  let qIdx = 0;
  getElement('sql-query-container').innerHTML = SQL_QUERY_SECTIONS.map(section => `
    <div style="margin-bottom:28px">
      <div style="font-size:12px;font-weight:600;color:${section.labelColor};
                  text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-left:2px">
        ${section.sectionLabel}
      </div>
      ${section.queries.map(query => {
        const uid = 'qr_' + (qIdx++);
        return `
          <div class="sql-block">
            <div class="sql-block-bar">
              <span class="sql-block-name">${query.name}</span>
              <div style="display:flex;gap:6px">
                <button class="sql-copy-button"
                  onclick="navigator.clipboard && navigator.clipboard.writeText(this.dataset.sql)"
                  data-sql="${query.sql.replace(/"/g, '&quot;')}">Copy</button>
                <button class="sql-copy-button"
                  style="background:var(--color-gold-subtle);color:var(--color-gold);border-color:var(--color-gold)"
                  onclick="runSqlQuery('${uid}')">▶ Run</button>
              </div>
            </div>
            <pre class="sql-code" id="${uid}-code">${highlightSqlSyntax(query.sql)}</pre>
            <div class="sql-result-area" id="${uid}-result" style="display:none"></div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

/* ============================================================
   SQL ENGINE (in-memory, unchanged)
   ============================================================ */

function getSqlTables() {
  return {
    books:        db.books.map(b => ({
      bookid: b.id, isbn: b.isbn, title: b.title,
      categoryid: b.categoryId, authorid: b.authorId,
      publisher: b.publisher, publishyear: b.publishYear,
      edition: b.edition, totalcopies: b.totalCopies,
    })),
    authors:      db.authors.map(a => ({
      authorid: a.id, firstname: a.firstName, lastname: a.lastName,
      nationality: a.nationality, birthyear: a.birthYear,
    })),
    categories:   db.categories.map(c => ({ categoryid: c.id, categoryname: c.name })),
    members:      db.members.map(m => ({
      memberid: m.id, firstname: m.firstName, lastname: m.lastName,
      email: m.email, phone: m.phone || '',
      membershiptype: m.membershipType, joindate: m.joinDate,
      expirydate: m.expiryDate || '', isactive: m.isActive ? 1 : 0, address: m.address || '',
    })),
    staff:        db.staff.map(s => ({
      staffid: s.id, firstname: s.firstName, lastname: s.lastName,
      email: s.email, role: s.role, hiredate: s.hireDate,
    })),
    loans:        db.loans.map(l => ({
      loanid: l.id, bookid: l.bookId, memberid: l.memberId,
      staffid: l.staffId, loandate: l.loanDate, duedate: l.dueDate,
      returndate: l.returnDate || null, status: l.status,
    })),
    reservations: db.reservations.map(r => ({
      reservationid: r.id, bookid: r.bookId, memberid: r.memberId,
      reservationdate: r.reservationDate, expirydate: r.expiryDate, status: r.status,
    })),
    fines:        db.fines.map(f => ({
      fineid: f.id, loanid: f.loanId, amount: f.amount,
      reason: f.reason, ispaid: f.isPaid ? 1 : 0, paiddate: f.paidDate || null,
    })),
    bookauthors:  db.bookAuthors.map(ba => ({
      bookauthorid: ba.id, bookid: ba.bookId, authorid: ba.authorId, role: ba.role,
    })),
  };
}

function evaluateCondition(row, condition) {
  const norm = condition.trim();
  const isNullMatch = norm.match(/^(\w+(?:\.\w+)?)\s+IS\s+(NOT\s+)?NULL$/i);
  if (isNullMatch) {
    const col = isNullMatch[1].toLowerCase().replace(/.*\./, '');
    const isNull = (row[col] === null || row[col] === undefined || row[col] === '');
    return isNullMatch[2] ? !isNull : isNull;
  }
  const likeMatch = norm.match(/^(\w+(?:\.\w+)?)\s+(?:NOT\s+)?LIKE\s+'([^']*)'\s*$/i);
  if (likeMatch) {
    const col = likeMatch[1].toLowerCase().replace(/.*\./, '');
    const pattern = likeMatch[2].replace(/%/g, '.*').replace(/_/g, '.');
    const matches = new RegExp(`^${pattern}$`, 'i').test(String(row[col] ?? ''));
    return norm.toUpperCase().includes('NOT LIKE') ? !matches : matches;
  }
  const inMatch = norm.match(/^(\w+(?:\.\w+)?)\s+(NOT\s+)?IN\s*\(([^)]+)\)$/i);
  if (inMatch) {
    const col  = inMatch[1].toLowerCase().replace(/.*\./, '');
    const vals = inMatch[3].split(',').map(v => v.trim().replace(/^'|'$/g,'').toLowerCase());
    const rv   = String(row[col] ?? '').toLowerCase();
    return inMatch[2] ? !vals.includes(rv) : vals.includes(rv);
  }
  const btMatch = norm.match(/^(\w+(?:\.\w+)?)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
  if (btMatch) {
    const col = btMatch[1].toLowerCase().replace(/.*\./, '');
    return row[col] >= parseFloat(btMatch[2].replace(/'/g,'')) &&
           row[col] <= parseFloat(btMatch[3].replace(/'/g,''));
  }
  const cmpMatch = norm.match(/^(\w+(?:\.\w+)?)\s*(=|!=|<>|<=|>=|<|>)\s*(.+)$/);
  if (!cmpMatch) return true;
  const col    = cmpMatch[1].toLowerCase().replace(/.*\./, '');
  const op     = cmpMatch[2];
  const strVal = cmpMatch[3].trim().replace(/^'|'$/g,'');

  // Normalise PostgreSQL boolean literals → 1/0 to match the mapped cache values
  const normVal = strVal.toLowerCase() === 'true'  ? '1'
                : strVal.toLowerCase() === 'false' ? '0'
                : strVal;

  const numVal = parseFloat(normVal);
  const rowNum = parseFloat(row[col]);
  if (!isNaN(numVal) && !isNaN(rowNum)) {
    switch(op) {
      case '=':  return rowNum === numVal;
      case '!=': case '<>': return rowNum !== numVal;
      case '<':  return rowNum < numVal;
      case '>':  return rowNum > numVal;
      case '<=': return rowNum <= numVal;
      case '>=': return rowNum >= numVal;
    }
  }
  const a = String(row[col] ?? '').toLowerCase();
  const b = normVal.toLowerCase();
  switch(op) {
    case '=':  return a === b;
    case '!=': case '<>': return a !== b;
    default:   return false;
  }
}

function evaluateWhere(row, whereClause) {
  if (!whereClause) return true;
  return whereClause.split(/\bAND\b/i).every(part =>
    part.split(/\bOR\b/i).some(cond => evaluateCondition(row, cond.trim()))
  );
}

function resolveValue(row, expr) {
  const e = expr.trim().toLowerCase();
  if (e === '*') return 1;
  if (!isNaN(parseFloat(e))) return parseFloat(e);
  return row[e.replace(/^[a-z]+\./, '')] ?? null;
}

function runSelect(sql) {
  const tables = getSqlTables();

  const fromMatch = sql.match(/\bFROM\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/i);
  if (!fromMatch) return { error: 'Could not find FROM clause.' };

  const mainTable = fromMatch[1].toLowerCase();
  const mainAlias = (fromMatch[2] || mainTable).toLowerCase();
  if (!tables[mainTable]) return { error: `Unknown table: ${mainTable}` };

  let rows = tables[mainTable].map(r => {
    const out = {};
    Object.entries(r).forEach(([k, v]) => { out[k] = v; out[`${mainAlias}.${k}`] = v; });
    return out;
  });

  // JOINs
  const joinRe = /\b(?:INNER\s+|LEFT\s+)?JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+(\w+(?:\.\w+)?)\s*=\s*(\w+(?:\.\w+)?)/gi;
  let jm;
  while ((jm = joinRe.exec(sql)) !== null) {
    const jTable = jm[1].toLowerCase();
    const jAlias = (jm[2] || jTable).toLowerCase();
    const lCol   = jm[3].toLowerCase().replace(/.*\./, '');
    const rCol   = jm[4].toLowerCase().replace(/.*\./, '');
    if (!tables[jTable]) continue;
    rows = rows.flatMap(row => {
      const matches = tables[jTable].filter(jr => String(jr[rCol]) === String(row[lCol]));
      if (!matches.length) return [row];
      return matches.map(jr => {
        const merged = { ...row };
        Object.entries(jr).forEach(([k,v]) => { merged[k] = v; merged[`${jAlias}.${k}`] = v; });
        return merged;
      });
    });
  }

  // WHERE
  const whereMatch = sql.match(/\bWHERE\b([\s\S]+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|;|$)/i);
  if (whereMatch) rows = rows.filter(r => evaluateWhere(r, whereMatch[1].trim()));

  // GROUP BY
  const groupMatch = sql.match(/\bGROUP\s+BY\b([\s\S]+?)(?:\bORDER\s+BY\b|\bLIMIT\b|;|$)/i);
  if (groupMatch) {
    const groupCols = groupMatch[1].split(',').map(c => c.trim().toLowerCase().replace(/.*\./, ''));
    const groups = {};
    rows.forEach(row => {
      const key = groupCols.map(c => row[c]).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    rows = Object.values(groups).map(grp => {
      const out = { ...grp[0] };
      out.__group = grp;
      return out;
    });
  }

  // SELECT columns — use 's' (dotAll) flag so '.' matches newlines too
  const selMatch = sql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s/i);
  if (!selMatch) return { error: 'Cannot parse SELECT columns.' };
  const rawCols = selMatch[1].replace(/^\s*DISTINCT\s+/i, '').trim();

  let columns = [];
  if (rawCols.trim() === '*') {
    columns = Object.keys(rows[0] || {}).filter(k => !k.includes('.') && !k.startsWith('__'));
  } else {
    const aggRe = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*(\*|\w+(?:\.\w+)?)\s*\)(?:\s+AS\s+(\w+))?|(CONCAT\([^)]+\))(?:\s+AS\s+(\w+))?|(\w+(?:\.\w+)?)(?:\s+AS\s+(\w+))?/gi;
    let cm;
    while ((cm = aggRe.exec(rawCols)) !== null) {
      if (cm[1]) {
        const fn = cm[1].toUpperCase(), colExpr = cm[2], alias = cm[3] || `${fn.toLowerCase()}_${colExpr}`;
        rows = rows.map(r => {
          const grp = r.__group || [r];
          const vals = grp.map(gr => resolveValue(gr, colExpr)).filter(v => v !== null);
          const result = fn === 'COUNT' ? grp.length
                       : fn === 'SUM'   ? vals.reduce((a,b)=>a+b,0)
                       : fn === 'AVG'   ? vals.reduce((a,b)=>a+b,0)/(vals.length||1)
                       : fn === 'MAX'   ? Math.max(...vals)
                       : fn === 'MIN'   ? Math.min(...vals) : null;
          return { ...r, [alias]: result };
        });
        columns.push(alias);
      } else if (cm[4]) {
        const alias = cm[5] || 'concat';
        const concatInner = cm[4].replace(/CONCAT\s*\(/i,'').replace(/\)\s*$/,'');
        rows = rows.map(r => {
          const parts = concatInner.split(',').map(a => {
            a = a.trim();
            if (a.startsWith("'") && a.endsWith("'")) return a.slice(1,-1);
            return String(r[a.toLowerCase().replace(/.*\./,'')] ?? '');
          });
          return { ...r, [alias]: parts.join('') };
        });
        columns.push(alias);
      } else if (cm[6]) {
        const rawCol = cm[6].toLowerCase().replace(/.*\./, '');
        const alias  = (cm[7] || rawCol).toLowerCase();
        if (alias !== rawCol) rows = rows.map(r => ({ ...r, [alias]: r[rawCol] }));
        columns.push(alias);
      }
    }
  }

  // DISTINCT
  if (/\bDISTINCT\b/i.test(rawCols)) {
    const seen = new Set();
    rows = rows.filter(r => {
      const key = columns.map(c => r[c]).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ORDER BY
  const orderMatch = sql.match(/\bORDER\s+BY\b([\s\S]+?)(?:\bLIMIT\b|;|$)/i);
  if (orderMatch) {
    const parts = orderMatch[1].split(',').map(p => {
      const [col, dir] = p.trim().split(/\s+/);
      return { col: col.toLowerCase().replace(/.*\./, ''), desc: /DESC/i.test(dir || '') };
    });
    rows.sort((a, b) => {
      for (const { col, desc } of parts) {
        const av = a[col], bv = b[col];
        if (av === bv) continue;
        const cmp = (!isNaN(av) && !isNaN(bv)) ? av - bv : String(av).localeCompare(String(bv));
        return desc ? -cmp : cmp;
      }
      return 0;
    });
  }

  // LIMIT
  const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1]));

  const finalRows = rows.map(r => {
    const out = {};
    columns.forEach(c => { out[c] = r[c] ?? null; });
    return out;
  });

  return { columns, rows: finalRows };
}

function runSqlQuery(uid) {
  const codeEl   = getElement(`${uid}-code`);
  const resultEl = getElement(`${uid}-result`);
  if (!codeEl || !resultEl) return;

  const raw = codeEl.textContent.trim();
  // SQL_QUERY_SECTIONS stores newlines as literal \n (two chars: backslash + n).
  // Normalise to real newlines so clause-boundary regexes work correctly.
  const sql = raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/;$/, '').trim();
  resultEl.style.display = 'block';

  const upper = sql.toUpperCase().trimStart();
  if (upper.startsWith('SELECT')) {
    try {
      const { columns, rows, error } = runSelect(sql);
      if (error) { resultEl.innerHTML = `<span style="color:var(--color-red)">⚠ ${error}</span>`; return; }
      if (!rows.length) { resultEl.innerHTML = '<em style="color:var(--color-text-muted)">Query returned 0 rows.</em>'; return; }
      const head = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
      const body = rows.map(r => `<tr>${columns.map(c => `<td>${r[c] ?? 'NULL'}</td>`).join('')}</tr>`).join('');
      resultEl.innerHTML = `<div class="sql-result-scroll"><table class="sql-result-table"><thead>${head}</thead><tbody>${body}</tbody></table><div class="sql-result-count">${rows.length} row(s)</div></div>`;
    } catch(e) {
      resultEl.innerHTML = `<span style="color:var(--color-red)">⚠ Parse error: ${e.message}</span>`;
    }
  } else {
    resultEl.innerHTML = `<em style="color:var(--color-amber)">ℹ UPDATE / DELETE queries are shown here for reference only. Use the UI above to mutate data (which writes to Supabase).</em>`;
  }
}

/* ============================================================
   MEMBER RENDERS
   ============================================================ */

function renderMemberHomePage() {
  const member       = currentUser.member;
  const memberLoans  = db.loans.filter(l => l.memberId === member.id);
  const activeLoans  = memberLoans.filter(l => ['Active', 'Overdue'].includes(l.status));
  const unpaidFines  = db.fines.filter(f => {
    const loan = db.loans.find(l => l.id === f.loanId);
    return loan && loan.memberId === member.id && !f.isPaid;
  });
  const totalUnpaid = unpaidFines.reduce((t, f) => t + f.amount, 0);

  getElement('member-avatar-hero').textContent = getInitials(member.firstName, member.lastName);
  getElement('member-hero-name').textContent   = `Welcome, ${member.firstName}!`;
  getElement('member-hero-info').textContent   = `${member.membershipType} Member · Expiry: ${member.expiryDate}`;
  getElement('member-hero-type').textContent   = member.membershipType;
  getElement('member-hero-status').textContent = member.isActive ? 'Active' : 'Inactive';
  getElement('member-stat-active-loans').textContent = activeLoans.length;
  getElement('member-stat-total-loans').textContent  = memberLoans.length;
  getElement('member-stat-unpaid-fines').textContent = `₱${totalUnpaid.toFixed(0)}`;

  const emptyLoans = `<tr><td colspan="3"><div class="empty-state"><div class="empty-state-icon">📖</div><p>No active loans</p></div></td></tr>`;
  getElement('member-active-loans-table').innerHTML = activeLoans.length
    ? activeLoans.map(l => `
        <tr>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;font-size:13.5px">${getBookTitle(l.bookId)}</td>
          <td style="font-size:13px;color:var(--color-text-secondary)">${l.dueDate}</td>
          <td>${renderStatusBadge(l.status)}</td>
        </tr>
      `).join('')
    : emptyLoans;

  const memberRes = db.reservations.filter(r => r.memberId === member.id);
  const emptyRes  = `<tr><td colspan="3"><div class="empty-state"><div class="empty-state-icon">🔖</div><p>No reservations</p></div></td></tr>`;
  getElement('member-reservations-table').innerHTML = memberRes.length
    ? memberRes.map(r => `
        <tr>
          <td style="font-size:13.5px;font-weight:500">${getBookTitle(r.bookId)}</td>
          <td style="font-size:13px;color:var(--color-text-secondary)">${r.reservationDate}</td>
          <td>${renderStatusBadge(r.status)}</td>
        </tr>
      `).join('')
    : emptyRes;
}

function renderMemberBrowsePage() {
  const q = (getElement('browse-search-input')?.value || '').toLowerCase();
  const filtered = db.books.filter(b =>
    !q || b.title.toLowerCase().includes(q) ||
    getAuthorFullName(b.authorId).toLowerCase().includes(q) ||
    b.isbn.includes(q)
  );

  getElement('browse-catalog-table-body').innerHTML = filtered.map(b => {
    const category    = findCategoryById(b.categoryId);
    const onLoan      = db.loans.filter(l => (l.status === 'Active' || l.status === 'Overdue') && l.bookId === b.id).length;
    const available   = Math.max(0, b.totalCopies - onLoan);
    const reserved    = db.reservations.find(r =>
      r.bookId === b.id && r.memberId === currentUser.member.id && r.status === 'Pending'
    );
    return `
      <tr>
        <td style="font-weight:500">${b.title}</td>
        <td style="font-size:13px">${getAuthorFullName(b.authorId)}</td>
        <td>${category ? renderBadge(category.name, 'blue') : ''}</td>
        <td style="font-size:13px;color:var(--color-text-secondary)">${b.publishYear}</td>
        <td>${available > 0 ? renderBadge(`${available} available`, 'green') : renderBadge('All borrowed', 'red')}</td>
        <td>${!reserved
          ? `<button class="btn btn-gold btn-sm" onclick="memberReserveBook(${b.id})">Reserve</button>`
          : `<span style="font-size:12px;color:var(--color-amber)">Reserved</span>`}</td>
      </tr>
    `;
  }).join('');
}

function renderMemberHistoryPage() {
  const memberLoans = db.loans.filter(l => l.memberId === currentUser.member.id);
  const empty = `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📋</div><p>No loan history yet</p></div></td></tr>`;
  getElement('member-loan-history-table-body').innerHTML = memberLoans.length
    ? memberLoans.map(l => `
        <tr>
          <td style="font-weight:500;font-size:13.5px">${getBookTitle(l.bookId)}</td>
          <td style="font-size:13px;color:var(--color-text-secondary)">${l.loanDate}</td>
          <td style="font-size:13px;color:var(--color-text-secondary)">${l.dueDate}</td>
          <td style="font-size:13px;color:var(--color-text-muted)">${l.returnDate || '—'}</td>
          <td>${renderStatusBadge(l.status)}</td>
        </tr>
      `).join('')
    : empty;
}

function renderMemberFinesPage() {
  const memberFines = db.fines.filter(f => {
    const loan = db.loans.find(l => l.id === f.loanId);
    return loan && loan.memberId === currentUser.member.id;
  });
  const empty = `<tr><td colspan="4"><div class="empty-state"><div class="empty-state-icon">✓</div><p>No fines on your account</p></div></td></tr>`;
  getElement('member-fines-table-body').innerHTML = memberFines.length
    ? memberFines.map(f => {
        const loan = db.loans.find(l => l.id === f.loanId);
        return `
          <tr>
            <td style="font-weight:500;font-size:13.5px">${loan ? getBookTitle(loan.bookId) : '—'}</td>
            <td><span style="font-weight:700;color:${f.isPaid ? 'var(--color-green)' : 'var(--color-red)'}">₱${f.amount.toFixed(2)}</span></td>
            <td style="font-size:13px;color:var(--color-text-secondary)">${f.reason}</td>
            <td>${renderBadge(f.isPaid ? 'Paid' : 'Unpaid', f.isPaid ? 'green' : 'red')}</td>
          </tr>
        `;
      }).join('')
    : empty;
}

function renderMemberProfilePage() {
  const m = currentUser.member;
  const fields = [
    ['Membership Type', m.membershipType],
    ['Phone',          m.phone    || '—'],
    ['Join Date',      m.joinDate],
    ['Expiry Date',    m.expiryDate],
    ['Address',        m.address  || '—'],
    ['Status',         m.isActive ? 'Active' : 'Inactive'],
  ];
  getElement('profile-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:56px;height:56px;border-radius:50%;background-color:var(--color-teal-subtle);
                  color:var(--color-teal);display:flex;align-items:center;justify-content:center;
                  font-size:20px;font-weight:700">${getInitials(m.firstName, m.lastName)}</div>
      <div>
        <div style="font-size:20px;font-weight:600">${m.firstName} ${m.lastName}</div>
        <div style="font-size:13.5px;color:var(--color-text-secondary)">${m.email}</div>
      </div>
    </div>
    <div style="display:grid;gap:12px">
      ${fields.map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;
                    border-bottom:1px solid var(--color-border-subtle)">
          <span style="font-size:13px;color:var(--color-text-muted)">${label}</span>
          <span style="font-size:13.5px;font-weight:500">${val}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   CRUD — BOOKS
   ============================================================ */

async function saveBook() {
  const bookId = parseInt(getElement('book-modal-id').value) || 0;
  const bookData = {
    isbn:        getElement('book-modal-isbn').value,
    title:       getElement('book-modal-title-input').value,
    categoryId:  parseInt(getElement('book-modal-category').value),
    publisher:   getElement('book-modal-publisher').value,
    publishYear: parseInt(getElement('book-modal-year').value),
    edition:     parseInt(getElement('book-modal-edition').value) || 1,
    totalCopies: parseInt(getElement('book-modal-copies').value)  || 1,
    authorId:    parseInt(getElement('book-modal-author').value),
  };

  if (!bookData.title || !bookData.isbn) {
    showToast('Title and ISBN are required.', 'error');
    return;
  }

  try {
    showLoading('Saving book…');
    if (bookId) {
      await updateBook(bookId, bookData);
      const idx = db.books.findIndex(b => b.id === bookId);
      if (idx !== -1) Object.assign(db.books[idx], bookData);
      showToast('Book updated!');
    } else {
      const newBook = await insertBook(bookData);
      db.books.push(newBook);
      showToast('Book added!');
    }
    hideLoading();
    closeModal('book-modal');
    renderBooksPage();
  } catch(err) {
    hideLoading();
    showToast('Error saving book: ' + (err.message || err), 'error');
  }
}

function openEditBookModal(bookId) {
  const book = db.books.find(b => b.id === bookId);
  if (!book) return;
  getElement('book-modal-title').textContent = 'Edit Book';
  getElement('book-modal-id').value = bookId;
  openModal('book-modal');
  getElement('book-modal-isbn').value        = book.isbn;
  getElement('book-modal-title-input').value = book.title;
  getElement('book-modal-category').value    = book.categoryId;
  getElement('book-modal-publisher').value   = book.publisher  || '';
  getElement('book-modal-year').value        = book.publishYear || '';
  getElement('book-modal-edition').value     = book.edition;
  getElement('book-modal-copies').value      = book.totalCopies;
  getElement('book-modal-author').value      = book.authorId   || '';
}

async function deleteBook(bookId) {
  if (!confirm('Delete this book?')) return;
  try {
    showLoading('Deleting…');
    await deleteBookById(bookId);
    db.books = db.books.filter(b => b.id !== bookId);
    hideLoading();
    showToast('Book deleted.', 'info');
    renderBooksPage();
  } catch(err) {
    hideLoading();
    showToast('Error deleting book: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — MEMBERS
   ============================================================ */

async function saveMember() {
  const memberId = parseInt(getElement('member-modal-id').value) || 0;
  const memberData = {
    firstName:      getElement('member-modal-first-name').value,
    lastName:       getElement('member-modal-last-name').value,
    email:          getElement('member-modal-email').value,
    phone:          getElement('member-modal-phone').value,
    membershipType: getElement('member-modal-type').value,
    joinDate:       getElement('member-modal-join-date').value,
    expiryDate:     getElement('member-modal-expiry-date').value,
    isActive:       true,
    password:       'member123',
  };

  if (!memberData.firstName || !memberData.email) {
    showToast('Name and email are required.', 'error');
    return;
  }

  try {
    showLoading('Saving member…');
    if (memberId) {
      await updateMember(memberId, memberData);
      const idx = db.members.findIndex(m => m.id === memberId);
      if (idx !== -1) Object.assign(db.members[idx], memberData);
      showToast('Member updated!');
    } else {
      const newMember = await insertMember(memberData);
      db.members.push(newMember);
      showToast('Member added!');
    }
    hideLoading();
    closeModal('member-modal');
    renderMembersAdminPage();
  } catch(err) {
    hideLoading();
    showToast('Error saving member: ' + (err.message || err), 'error');
  }
}

function openEditMemberModal(memberId) {
  const m = db.members.find(m => m.id === memberId);
  if (!m) return;
  getElement('member-modal-title').textContent = 'Edit Member';
  getElement('member-modal-id').value = memberId;
  openModal('member-modal');
  getElement('member-modal-first-name').value      = m.firstName;
  getElement('member-modal-last-name').value       = m.lastName;
  getElement('member-modal-email').value           = m.email;
  getElement('member-modal-phone').value           = m.phone || '';
  getElement('member-modal-membership-type').value = m.membershipType;
  getElement('member-modal-join-date').value       = m.joinDate;
  getElement('member-modal-expiry-date').value     = m.expiryDate;
}

async function toggleMemberActiveStatus(memberId) {
  const member = db.members.find(m => m.id === memberId);
  if (!member) return;
  const newStatus = !member.isActive;
  try {
    await updateMember(memberId, { isActive: newStatus });
    member.isActive = newStatus;
    showToast(newStatus ? 'Member reactivated.' : 'Member deactivated.', 'info');
    renderMembersAdminPage();
  } catch(err) {
    showToast('Error updating member: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — LOANS
   ============================================================ */

async function saveLoan() {
  const memberId = parseInt(getElement('loan-modal-member').value);
  const bookId   = parseInt(getElement('loan-modal-book').value);
  const staffId  = parseInt(getElement('loan-modal-staff').value);
  const loanDate = getElement('loan-modal-loan-date').value;
  const dueDate  = getElement('loan-modal-due-date').value;

  try {
    showLoading('Creating loan…');
    const newLoan = await insertLoan({ bookId, memberId, staffId, loanDate, dueDate });
    db.loans.push(newLoan);
    hideLoading();
    showToast('Loan created!');
    closeModal('loan-modal');
    renderLoansAdminPage();
    renderDashboard();
  } catch(err) {
    hideLoading();
    showToast('Error creating loan: ' + (err.message || err), 'error');
  }
}

async function markLoanAsReturned(loanId) {
  const loan = db.loans.find(l => l.id === loanId);
  if (!loan) return;
  const today = getTodayDateString();
  try {
    await updateLoan(loanId, { returnDate: today, status: 'Returned' });
    loan.returnDate = today;
    loan.status     = 'Returned';
    showToast(`Loan #${loanId} returned.`);
    renderLoansAdminPage();
    renderDashboard();
  } catch(err) {
    showToast('Error returning loan: ' + (err.message || err), 'error');
  }
}

async function deleteLoan(loanId) {
  if (!confirm('Delete loan record?')) return;
  try {
    await deleteLoanById(loanId);
    db.loans = db.loans.filter(l => l.id !== loanId);
    showToast('Loan deleted.', 'info');
    renderLoansAdminPage();
    renderDashboard();
  } catch(err) {
    showToast('Error deleting loan: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — RESERVATIONS
   ============================================================ */

async function saveReservation() {
  const memberId        = parseInt(getElement('reservation-modal-member').value);
  const bookId          = parseInt(getElement('reservation-modal-book').value);
  const reservationDate = getElement('reservation-modal-date').value;
  const expiryDate      = getElement('reservation-modal-expiry').value;

  try {
    showLoading('Creating reservation…');
    const newRes = await insertReservation({ bookId, memberId, reservationDate, expiryDate });
    db.reservations.push(newRes);
    hideLoading();
    showToast('Reservation created!');
    closeModal('reservation-modal');
    renderReservationsPage();
  } catch(err) {
    hideLoading();
    showToast('Error creating reservation: ' + (err.message || err), 'error');
  }
}

async function cancelReservation(reservationId) {
  const res = db.reservations.find(r => r.id === reservationId);
  if (!res) return;
  try {
    await updateReservation(reservationId, { status: 'Cancelled' });
    res.status = 'Cancelled';
    showToast('Reservation cancelled.', 'info');
    renderReservationsPage();
  } catch(err) {
    showToast('Error cancelling reservation: ' + (err.message || err), 'error');
  }
}

async function memberReserveBook(bookId) {
  const member = currentUser.member;
  const today  = getTodayDateString();
  try {
    showLoading('Reserving…');
    const newRes = await insertReservation({
      bookId,
      memberId:        member.id,
      reservationDate: today,
      expiryDate:      addDaysToDate(today, 7),
    });
    db.reservations.push(newRes);
    hideLoading();
    showToast("Book reserved! We'll hold it for 7 days.", 'success');
    renderMemberBrowsePage();
  } catch(err) {
    hideLoading();
    showToast('Error reserving book: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — FINES
   ============================================================ */

async function saveFine() {
  const loanId = parseInt(getElement('fine-modal-loan').value);
  const amount = parseFloat(getElement('fine-modal-amount').value);
  const reason = getElement('fine-modal-reason').value;

  try {
    showLoading('Adding fine…');
    const newFine = await insertFine({ loanId, amount, reason });
    db.fines.push(newFine);
    hideLoading();
    showToast('Fine added!');
    closeModal('fine-modal');
    renderFinesPage();
  } catch(err) {
    hideLoading();
    showToast('Error adding fine: ' + (err.message || err), 'error');
  }
}

async function markFineAsPaid(fineId) {
  const fine = db.fines.find(f => f.id === fineId);
  if (!fine) return;
  const today = getTodayDateString();
  try {
    await updateFine(fineId, { isPaid: true, paidDate: today });
    fine.isPaid   = true;
    fine.paidDate = today;
    showToast('Fine marked as paid.');
    renderFinesPage();
  } catch(err) {
    showToast('Error updating fine: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — STAFF
   ============================================================ */

async function saveStaff() {
  const staffId = parseInt(getElement('staff-modal-id').value) || 0;
  const staffData = {
    firstName: getElement('staff-modal-first-name').value,
    lastName:  getElement('staff-modal-last-name').value,
    email:     getElement('staff-modal-email').value,
    role:      getElement('staff-modal-role').value,
    hireDate:  getElement('staff-modal-hire-date').value,
  };

  if (!staffData.firstName || !staffData.email) {
    showToast('Name and email are required.', 'error');
    return;
  }

  try {
    showLoading('Saving staff…');
    if (staffId) {
      await updateStaff(staffId, staffData);
      const idx = db.staff.findIndex(s => s.id === staffId);
      if (idx !== -1) Object.assign(db.staff[idx], staffData);
      showToast('Staff updated!');
    } else {
      const newStaff = await insertStaff(staffData);
      db.staff.push(newStaff);
      showToast('Staff added!');
    }
    hideLoading();
    closeModal('staff-modal');
    renderStaffPage();
  } catch(err) {
    hideLoading();
    showToast('Error saving staff: ' + (err.message || err), 'error');
  }
}

function openEditStaffModal(staffId) {
  const s = db.staff.find(s => s.id === staffId);
  if (!s) return;
  getElement('staff-modal-title').textContent = 'Edit Staff';
  getElement('staff-modal-id').value = staffId;
  openModal('staff-modal');
  getElement('staff-modal-first-name').value = s.firstName;
  getElement('staff-modal-last-name').value  = s.lastName;
  getElement('staff-modal-email').value      = s.email;
  getElement('staff-modal-role').value       = s.role;
  getElement('staff-modal-hire-date').value  = s.hireDate;
}

async function deleteStaff(staffId) {
  if (!confirm('Remove this staff member?')) return;
  try {
    await deleteStaffById(staffId);
    db.staff = db.staff.filter(s => s.id !== staffId);
    showToast('Staff removed.', 'info');
    renderStaffPage();
  } catch(err) {
    showToast('Error removing staff: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — AUTHORS
   ============================================================ */

async function saveAuthor() {
  const authorId = parseInt(getElement('author-modal-id').value) || 0;
  const authorData = {
    firstName:   getElement('author-modal-first-name').value.trim(),
    lastName:    getElement('author-modal-last-name').value.trim(),
    nationality: getElement('author-modal-nationality').value.trim(),
    birthYear:   parseInt(getElement('author-modal-birth-year').value),
  };

  if (!authorData.firstName || !authorData.lastName) {
    showToast('First and Last name are required.', 'error');
    return;
  }

  try {
    showLoading('Saving author…');
    if (authorId) {
      await updateAuthor(authorId, authorData);
      const idx = db.authors.findIndex(a => a.id === authorId);
      if (idx !== -1) Object.assign(db.authors[idx], authorData);
      showToast('Author updated!');
    } else {
      const newAuthor = await insertAuthor(authorData);
      db.authors.push(newAuthor);
      showToast('Author added!');
    }
    hideLoading();
    closeModal('author-modal');
    renderAuthorsPage();
  } catch(err) {
    hideLoading();
    showToast('Error saving author: ' + (err.message || err), 'error');
  }
}

async function deleteAuthor(authorId) {
  if (!confirm('Remove this author?')) return;
  try {
    await deleteAuthorById(authorId);
    db.authors = db.authors.filter(a => a.id !== authorId);
    showToast('Author removed.', 'info');
    renderAuthorsPage();
  } catch(err) {
    showToast('Error removing author: ' + (err.message || err), 'error');
  }
}

/* ============================================================
   CRUD — MEMBER PROFILE
   ============================================================ */

async function saveProfile() {
  const member = currentUser.member;
  const patch = {
    firstName: getElement('profile-modal-first-name').value || member.firstName,
    lastName:  getElement('profile-modal-last-name').value  || member.lastName,
    phone:     getElement('profile-modal-phone').value,
    address:   getElement('profile-modal-address').value,
  };

  try {
    await updateMember(member.id, patch);
    Object.assign(member, patch);
    getElement('sidebar-name').textContent   = `${member.firstName} ${member.lastName}`;
    getElement('sidebar-avatar').textContent = getInitials(member.firstName, member.lastName);
    showToast('Profile updated!');
    closeModal('profile-modal');
    renderMemberProfilePage();
  } catch(err) {
    showToast('Error updating profile: ' + (err.message || err), 'error');
  }
}