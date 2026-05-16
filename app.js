/* ============================================================
   AUTH SCREEN INITIALIZATION (TOP LEVEL)
   ============================================================ */
   window.onload = function() {
    // Sets the number of books on the auth screen to match the database
    if (getElement('auth-stat-books')) {
      getElement('auth-stat-books').textContent = db.books.length;
    }
    
    // Bonus: If you also want to populate the Members and Staff stats next to it!
    if (getElement('auth-stat-members')) {
      getElement('auth-stat-members').textContent = db.members.filter(m => m.isActive).length;
    }
    if (getElement('auth-stat-staff')) {
      getElement('auth-stat-staff').textContent = db.staff.length;
    }
  };

/* ============================================================
   app.js — DATA BANK — Library Management System
   Application logic: auth, navigation, rendering, CRUD
   Depends on: database.js (must be loaded first)
   ============================================================ */

'use strict';

/* ============================================================
   APPLICATION STATE
   ============================================================ */

/** The currently logged-in user. Null when nobody is signed in.
    Shape: { role: 'admin' | 'member', member?: MemberObject } */
let currentUser = null;

/** Timer reference for the auto-hide toast notification */
let toastHideTimer = null;

/* ============================================================
   UTILITY — DOM & DATA LOOKUPS
   ============================================================ */

/** Returns the DOM element with the given ID. */
function getElement(elementId) {
  return document.getElementById(elementId);
}

/** Finds one book by its ID, or returns undefined. */
function findBookById(bookId) {
  return db.books.find(book => book.id === bookId);
}

/** Finds one author by their ID, or returns undefined. */
function findAuthorById(authorId) {
  return db.authors.find(author => author.id === authorId);
}

/** Finds one category by its ID, or returns undefined. */
function findCategoryById(categoryId) {
  return db.categories.find(category => category.id === categoryId);
}

/** Finds one member by their ID, or returns undefined. */
function findMemberById(memberId) {
  return db.members.find(member => member.id === memberId);
}

/** Finds one staff member by their ID, or returns undefined. */
function findStaffById(staffId) {
  return db.staff.find(staffMember => staffMember.id === staffId);
}

/** Returns the full name of a member, or "—" if not found. */
function getMemberFullName(memberId) {
  const member = findMemberById(memberId);
  return member ? `${member.firstName} ${member.lastName}` : '—';
}

/** Returns the title of a book, or "—" if not found. */
function getBookTitle(bookId) {
  const book = findBookById(bookId);
  return book ? book.title : '—';
}

/** Returns the full name of an author, or "—" if not found. */
function getAuthorFullName(authorId) {
  const author = findAuthorById(authorId);
  return author ? `${author.firstName} ${author.lastName}` : '—';
}

/** Returns today's date as a YYYY-MM-DD string. */
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

/** Returns a future date by adding N days to a given date string. */
function addDaysToDate(dateString, numberOfDays) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + numberOfDays);
  return date.toISOString().split('T')[0];
}

/** Returns the first letter of first and last name as uppercase initials. */
function getInitials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

/* ============================================================
   UTILITY — BADGES & TOASTS
   ============================================================ */

/** Renders a colored badge pill with the given text and color name. */
function renderBadge(labelText, colorName) {
  return `<span class="badge badge-${colorName}">${labelText}</span>`;
}

/** Renders a status badge whose color is decided by the status value. */
function renderStatusBadge(statusText) {
  const greenStatuses  = ['Active', 'Fulfilled', 'Paid'];
  const redStatuses    = ['Overdue', 'Cancelled', 'Unpaid'];
  const tealStatuses   = ['Returned', 'Inactive'];

  if (greenStatuses.includes(statusText))  return renderBadge(statusText, 'green');
  if (redStatuses.includes(statusText))    return renderBadge(statusText, 'red');
  if (tealStatuses.includes(statusText))   return renderBadge(statusText, 'teal');
  if (statusText === 'Pending')            return renderBadge(statusText, 'amber');

  return renderBadge(statusText, 'gray');
}

/** Shows a dismissing toast notification at the bottom of the screen. */
function showToast(message, type = 'success') {
  const toastElement = getElement('toast-notification');
  toastElement.textContent = message;
  toastElement.className = `toast-notification toast-${type} show`;

  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 3000);
}

/* ============================================================
   MODALS
   ============================================================ */

/** Opens a modal by adding the "open" class to its overlay element. */
function openModal(modalId) {
  const modalOverlay = getElement(modalId);
  modalOverlay.classList.add('open');
  populateModalDropdowns(modalId);
}

/** Closes a modal by removing the "open" class. */
function closeModal(modalId) {
  getElement(modalId).classList.remove('open');
}

/** Populates select dropdowns inside a modal before it opens. */
function populateModalDropdowns(modalId) {
  if (modalId === 'loan-modal') {
    getElement('loan-modal-member').innerHTML = db.members
      .filter(member => member.isActive)
      .map(member => `<option value="${member.id}">${member.firstName} ${member.lastName}</option>`)
      .join('');

    getElement('loan-modal-book').innerHTML = db.books
      .map(book => `<option value="${book.id}">${book.title}</option>`)
      .join('');

    getElement('loan-modal-staff').innerHTML = db.staff
      .map(staffMember => `<option value="${staffMember.id}">${staffMember.firstName} ${staffMember.lastName}</option>`)
      .join('');

    getElement('loan-modal-loan-date').value = getTodayDateString();
    getElement('loan-modal-due-date').value  = addDaysToDate(getTodayDateString(), 14);
  }

  if (modalId === 'reservation-modal') {
    getElement('reservation-modal-member').innerHTML = db.members
      .filter(member => member.isActive)
      .map(member => `<option value="${member.id}">${member.firstName} ${member.lastName}</option>`)
      .join('');

    getElement('reservation-modal-book').innerHTML = db.books
      .map(book => `<option value="${book.id}">${book.title}</option>`)
      .join('');

    getElement('reservation-modal-date').value   = getTodayDateString();
    getElement('reservation-modal-expiry').value = addDaysToDate(getTodayDateString(), 7);
  }

  if (modalId === 'book-modal') {
    getElement('book-modal-category').innerHTML = db.categories
      .map(category => `<option value="${category.id}">${category.name}</option>`)
      .join('');

    getElement('book-modal-author').innerHTML = db.authors
      .map(author => `<option value="${author.id}">${author.firstName} ${author.lastName}</option>`)
      .join('');
  }

  if (modalId === 'profile-modal' && currentUser?.role === 'member') {
    const member = currentUser.member;
    getElement('profile-modal-first-name').value = member.firstName;
    getElement('profile-modal-last-name').value  = member.lastName;
    getElement('profile-modal-phone').value      = member.phone   || '';
    getElement('profile-modal-address').value    = member.address || '';
  }
  
  if (modalId === 'fine-modal') {
    getElement('fine-modal-loan').innerHTML = db.loans
      .filter(loan => loan.status === 'Active' || loan.status === 'Overdue')
      .map(loan => {
        const member = findMemberById(loan.memberId);
        const book = findBookById(loan.bookId);
        return `<option value="${loan.id}">
          ${member ? member.lastName : 'Unknown'} — ${book ? book.title : 'Unknown'}
        </option>`;
      })
      .join('');
  }
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */

/** The role the user has selected on the login screen: 'admin' or 'member'. */
let selectedLoginRole = 'member';

/** Highlights the chosen role card and records the selection. */
function selectLoginRole(roleName) {
  selectedLoginRole = roleName;
  getElement('role-card-member').classList.toggle('selected', roleName === 'member');
  getElement('role-card-admin').classList.toggle('selected',  roleName === 'admin');
}

/** Switches between the Sign In and Register tabs on the auth screen. */
function switchAuthTab(tabName) {
  const tabs = getElement('auth-tabs').querySelectorAll('.auth-tab');
  tabs[0].classList.toggle('active', tabName === 'login');
  tabs[1].classList.toggle('active', tabName === 'signup');

  getElement('login-form').style.display  = tabName === 'login'  ? '' : 'none';
  getElement('signup-form').style.display = tabName === 'signup' ? '' : 'none';
}

/** Reads the login form and signs the user in if credentials are valid. */
function handleLogin() {
  const emailAddress = getElement('login-email').value.trim();
  const password     = getElement('login-password').value;
  const errorMessage = getElement('login-error');

  errorMessage.style.display = 'none';

  if (!emailAddress || !password) {
    errorMessage.textContent  = 'Please enter your email and password.';
    errorMessage.style.display = 'block';
    return;
  }

  if (selectedLoginRole === 'admin') {
    const adminEmailMatches    = emailAddress === ADMIN_CREDENTIALS.email;
    const adminPasswordMatches = password     === ADMIN_CREDENTIALS.password;

    if (adminEmailMatches && adminPasswordMatches) {
      currentUser = { role: 'admin' };
      enterApp();
    } else {
      errorMessage.textContent  = 'Invalid admin credentials.';
      errorMessage.style.display = 'block';
    }
    return;
  }

  const matchingMember = db.members.find(
    member => member.email === emailAddress && member.password === password
  );

  if (!matchingMember) {
    errorMessage.textContent  = 'No account found with those credentials.';
    errorMessage.style.display = 'block';
    return;
  }

  if (!matchingMember.isActive) {
    errorMessage.textContent  = 'This account is inactive. Please contact the library.';
    errorMessage.style.display = 'block';
    return;
  }

  currentUser = { role: 'member', member: matchingMember };
  enterApp();
}

/** Reads the signup form and creates a new member account if all fields are valid. */
function handleSignup() {
  const firstName      = getElement('signup-first-name').value.trim();
  const lastName       = getElement('signup-last-name').value.trim();
  const emailAddress   = getElement('signup-email').value.trim();
  const phoneNumber    = getElement('signup-phone').value.trim();
  const membershipType = getElement('signup-membership-type').value;
  const password       = getElement('signup-password').value;
  const passwordConfirm = getElement('signup-confirm-password').value;

  const errorElement   = getElement('signup-error');
  const successElement = getElement('signup-success');

  errorElement.style.display   = 'none';
  successElement.style.display = 'none';

  if (!firstName || !lastName || !emailAddress || !password) {
    errorElement.textContent  = 'Please fill in all required fields.';
    errorElement.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorElement.textContent  = 'Password must be at least 6 characters.';
    errorElement.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    errorElement.textContent  = 'Passwords do not match.';
    errorElement.style.display = 'block';
    return;
  }

  const emailAlreadyRegistered = db.members.find(
    member => member.email === emailAddress
  );

  if (emailAlreadyRegistered) {
    errorElement.textContent  = 'An account with this email already exists.';
    errorElement.style.display = 'block';
    return;
  }

  const todayDate    = getTodayDateString();
  const expiryDate   = addDaysToDate(todayDate, 365);

  const newMember = {
    id:             db.nextAvailableId.members++,
    firstName,
    lastName,
    email:          emailAddress,
    password,
    phone:          phoneNumber,
    membershipType,
    joinDate:       todayDate,
    expiryDate,
    isActive:       true,
    address:        '',
  };

  db.members.push(newMember);
  saveDatabase();

  successElement.textContent  = `Account created! You can now sign in as ${firstName} ${lastName}.`;
  successElement.style.display = 'block';

  // Clear all fields
  ['signup-first-name', 'signup-last-name', 'signup-email',
   'signup-phone', 'signup-password', 'signup-confirm-password']
    .forEach(fieldId => { getElement(fieldId).value = ''; });

  setTimeout(() => switchAuthTab('login'), 2000);
}

/* ============================================================
   APP ENTRY & LOGOUT
   ============================================================ */

/** Navigation definitions: admin sees everything, members see their own section. */
const ADMIN_NAVIGATION = [
  {
    sectionLabel: 'Overview',
    items: [
      { pageId: 'dashboard', icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    sectionLabel: 'Catalog',
    items: [
      { pageId: 'books',   icon: '📚', label: 'Books'   },
      { pageId: 'authors', icon: '✍️', label: 'Authors' },
    ],
  },
  {
    sectionLabel: 'Circulation',
    items: [
      { pageId: 'members-admin',      icon: '👥', label: 'Members'      },
      { pageId: 'loans-admin',        icon: '📋', label: 'Loans'        },
      { pageId: 'reservations-admin', icon: '🔖', label: 'Reservations' },
      { pageId: 'fines-admin',        icon: '💰', label: 'Fines'        },
    ],
  },
  {
    sectionLabel: 'System',
    items: [
      { pageId: 'staff', icon: '🛡️', label: 'Staff'       },
      { pageId: 'sql',   icon: '⌨️', label: 'SQL Queries' },
    ],
  },
];

const MEMBER_NAVIGATION = [
  {
    sectionLabel: 'My Library',
    items: [
      { pageId: 'member-home',    icon: '⊞', label: 'My Dashboard' },
      { pageId: 'member-browse',  icon: '📚', label: 'Browse Books' },
      { pageId: 'member-history', icon: '📋', label: 'Loan History' },
      { pageId: 'member-fines',   icon: '💰', label: 'My Fines'     },
      { pageId: 'member-profile', icon: '👤', label: 'My Profile'   },
    ],
  },
];

/** Shows the main application, builds the sidebar, and navigates to the first page. */
function enterApp() {
  getElement('auth-screen').style.display = 'none';
  getElement('app-screen').classList.add('visible');

  const userIsAdmin    = currentUser.role === 'admin';
  const navigationDef  = userIsAdmin ? ADMIN_NAVIGATION : MEMBER_NAVIGATION;

  buildSidebarNavigation(navigationDef);
  updateSidebarUserCard(userIsAdmin);
  showOverdueNotificationIfNeeded();

  const firstPageId = userIsAdmin ? 'dashboard' : 'member-home';
  showPage(firstPageId, getElement(`nav-${firstPageId}`));
}

/** Builds the sidebar navigation HTML from the navigation definition array. */
function buildSidebarNavigation(navigationDefinition) {
  const sidebarNav = getElement('sidebar-nav');

  sidebarNav.innerHTML = navigationDefinition.map(section => `
    <div class="nav-section">${section.sectionLabel}</div>
    ${section.items.map(item => `
      <div class="nav-item" id="nav-${item.pageId}" onclick="showPage('${item.pageId}', this)">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
      </div>
    `).join('')}
  `).join('');
}

/** Updates the sidebar user card with the current user's name and avatar. */
function updateSidebarUserCard(userIsAdmin) {
  const avatarElement = getElement('sidebar-avatar');
  const nameElement   = getElement('sidebar-name');
  const roleElement   = getElement('sidebar-role');
  const topbarName    = getElement('topbar-user-name');

  if (userIsAdmin) {
    avatarElement.textContent           = 'AD';
    avatarElement.style.backgroundColor = 'var(--color-gold-subtle)';
    avatarElement.style.color           = 'var(--color-gold)';
    nameElement.textContent             = 'Administrator';
    roleElement.textContent             = 'Admin Account';
    topbarName.textContent              = 'Admin';
  } else {
    const member = currentUser.member;
    const initials = getInitials(member.firstName, member.lastName);

    avatarElement.textContent           = initials;
    avatarElement.style.backgroundColor = 'var(--color-teal-subtle)';
    avatarElement.style.color           = 'var(--color-teal)';
    nameElement.textContent             = `${member.firstName} ${member.lastName}`;
    roleElement.textContent             = `${member.membershipType} Member`;
    topbarName.textContent              = member.firstName;
  }
}

/** Shows the red notification dot if there are any overdue loans. */
function showOverdueNotificationIfNeeded() {
  const overdueCount = db.loans.filter(loan => loan.status === 'Overdue').length;
  if (overdueCount > 0) {
    getElement('notification-dot').style.display = 'block';
  }
}

/** Signs the user out and returns to the login screen. */
function handleLogout() {
  currentUser = null;
  getElement('app-screen').classList.remove('visible');
  getElement('auth-screen').style.display = 'flex';

  getElement('login-email').value       = '';
  getElement('login-password').value    = '';
  getElement('login-error').style.display = 'none';

  selectLoginRole('member');
}

/* ============================================================
   NAVIGATION — PAGE ROUTING
   ============================================================ */

/** Maps each page ID to its human-readable title shown in the topbar. */
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

/** Maps each page ID to the render function that populates it. */
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

/** Deactivates all pages and nav items, then activates the selected one. */
function showPage(pageId, clickedNavElement) {
  document.querySelectorAll('.page').forEach(
    pageElement => pageElement.classList.remove('active')
  );
  document.querySelectorAll('.nav-item').forEach(
    navItem => navItem.classList.remove('active')
  );

  const pageElement = getElement(`page-${pageId}`);
  if (pageElement) pageElement.classList.add('active');
  if (clickedNavElement) clickedNavElement.classList.add('active');

  getElement('topbar-title').textContent = PAGE_TITLES[pageId] || pageId;

  const renderFunction = PAGE_RENDER_FUNCTIONS[pageId];
  if (renderFunction) renderFunction();
}

/* ============================================================
   ADMIN RENDERS
   ============================================================ */

function renderDashboard() {
  const activeLoansCount  = db.loans.filter(loan => loan.status === 'Active').length;
  const overdueLoansCount = db.loans.filter(loan => loan.status === 'Overdue').length;
  const totalUnpaidFines  = db.fines
    .filter(fine => !fine.isPaid)
    .reduce((total, fine) => total + fine.amount, 0);

  const currentHour = new Date().getHours();
  const greeting    = currentHour < 12 ? 'Good morning'
                    : currentHour < 18 ? 'Good afternoon'
                    : 'Good evening';

  getElement('dashboard-greeting').textContent = `${greeting}, Admin 👋`;

  const statsConfig = [
    {
      icon:        '📚',
      label:       'Total Books',
      value:       db.books.length,
      meta:        `${db.categories.length} categories`,
      background:  'var(--color-gold-subtle)',
      iconColor:   'var(--color-gold)',
    },
    {
      icon:        '👥',
      label:       'Members',
      value:       db.members.filter(member => member.isActive).length,
      meta:        'Active accounts',
      background:  'var(--color-teal-subtle)',
      iconColor:   'var(--color-teal)',
    },
    {
      icon:        '📋',
      label:       'Active Loans',
      value:       activeLoansCount,
      meta:        `${overdueLoansCount} overdue`,
      background:  'var(--color-blue-subtle)',
      iconColor:   'var(--color-blue)',
    },
    {
      icon:        '💰',
      label:       'Unpaid Fines',
      value:       `₱${totalUnpaidFines.toLocaleString()}`,
      meta:        `${db.fines.filter(fine => !fine.isPaid).length} pending`,
      background:  'var(--color-red-subtle)',
      iconColor:   'var(--color-red)',
    },
  ];

  getElement('admin-stats-row').innerHTML = statsConfig.map((stat, index) => `
    <div class="stat-card" style="animation-delay: ${index * 0.07}s">
      <div class="stat-top">
        <div><div class="stat-label">${stat.label}</div></div>
        <div class="stat-icon" style="background-color: ${stat.background}; color: ${stat.iconColor}">
          ${stat.icon}
        </div>
      </div>
      <div class="stat-value" style="color: ${stat.iconColor}">${stat.value}</div>
      <div class="stat-meta">${stat.meta}</div>
    </div>
  `).join('');

  const recentLoans = [...db.loans].reverse().slice(0, 7);
  getElement('dashboard-recent-loans').innerHTML = recentLoans.map(loan => `
    <tr>
      <td>${getMemberFullName(loan.memberId)}</td>
      <td style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">
        ${getBookTitle(loan.bookId)}
      </td>
      <td>${renderStatusBadge(loan.status)}</td>
    </tr>
  `).join('');

  const overdueLoans = db.loans.filter(loan => loan.status === 'Overdue');
  const emptyOverdueMessage = `
    <tr><td colspan="3">
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <p>No overdue loans</p>
      </div>
    </td></tr>
  `;

  getElement('dashboard-overdue-loans').innerHTML = overdueLoans.length
    ? overdueLoans.map(loan => `
        <tr>
          <td>${getMemberFullName(loan.memberId)}</td>
          <td style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">
            ${getBookTitle(loan.bookId)}
          </td>
          <td style="color: var(--color-red); font-size:12.5px">${loan.dueDate}</td>
        </tr>
      `).join('')
    : emptyOverdueMessage;
}

function renderBooksPage() {
  const searchQuery = (getElement('book-search')?.value || '').toLowerCase();
  const filteredBooks = db.books.filter(book =>
    !searchQuery ||
    book.title.toLowerCase().includes(searchQuery) ||
    book.isbn.includes(searchQuery)
  );

  const emptyState = `
    <tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p>No books found</p>
      </div>
    </td></tr>
  `;

  getElement('books-table-body').innerHTML = filteredBooks.length
    ? filteredBooks.map(book => {
        const author   = findAuthorById(book.authorId);
        const category = findCategoryById(book.categoryId);

        return `
          <tr>
            <td style="font-family:monospace; font-size:12px; color:var(--color-text-muted)">${book.isbn}</td>
            <td style="font-weight:500">${book.title}</td>
            <td>${author ? getAuthorFullName(book.authorId) : '—'}</td>
            <td>${category ? renderBadge(category.name, 'blue') : ''}</td>
            <td style="color:var(--color-text-secondary)">${book.publishYear}</td>
            <td><span style="font-weight:600; color:var(--color-teal)">${book.totalCopies}</span></td>
            <td>
              <div style="display:flex; gap:6px">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditBookModal(${book.id})" title="Edit">✎</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBook(${book.id})" title="Delete">✕</button>
              </div>
            </td>
          </tr>
        `;
      }).join('')
    : emptyState;
}

function renderAuthorsPage() {
  const authorsTbody = getElement('authors-table-body'); // Matches HTML line 245
  
  if (!authorsTbody) {
    console.error("Could not find authors-table-body in HTML");
    return;
  }

  authorsTbody.innerHTML = db.authors.map(author => {
    const booksByAuthor = db.books.filter(book => book.authorId === author.id).length;

    return `
      <tr>
        <td style="font-weight:500">${author.firstName} ${author.lastName}</td>
        <td>${author.nationality || '—'}</td>
        <td>${author.birthYear   || '—'}</td>
        <td>${booksByAuthor}</td>
        <td>
           <button class="btn btn-danger btn-sm" onclick="deleteAuthor(${author.id})">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderMembersAdminPage() {
  const searchQuery = (getElement('member-search')?.value || '').toLowerCase();
  const filteredMembers = db.members.filter(member =>
    !searchQuery ||
    `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(searchQuery)
  );

  const membershipTypeColors = {
    Student: 'teal',
    Faculty: 'gold',
    Public:  'blue',
  };

  getElement('members-table-body').innerHTML = filteredMembers.map(member => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:10px">
          <div style="width:30px; height:30px; border-radius:50%;
                      background-color:var(--color-teal-subtle); color:var(--color-teal);
                      display:flex; align-items:center; justify-content:center;
                      font-size:11px; font-weight:600; flex-shrink:0">
            ${getInitials(member.firstName, member.lastName)}
          </div>
          <span style="font-weight:500">${member.firstName} ${member.lastName}</span>
        </div>
      </td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${member.email}</td>
      <td>${renderBadge(member.membershipType, membershipTypeColors[member.membershipType] || 'gray')}</td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${member.expiryDate}</td>
      <td>${renderBadge(member.isActive ? 'Active' : 'Inactive', member.isActive ? 'green' : 'red')}</td>
      <td>
        <div style="display:flex; gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditMemberModal(${member.id})">✎</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="toggleMemberActiveStatus(${member.id})">
            ${member.isActive ? '✕' : '↺'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderLoansAdminPage() {
  const searchQuery = (getElement('loan-search')?.value || '').toLowerCase();
  const filteredLoans = db.loans.filter(loan =>
    !searchQuery ||
    getMemberFullName(loan.memberId).toLowerCase().includes(searchQuery) ||
    getBookTitle(loan.bookId).toLowerCase().includes(searchQuery)
  );

  getElement('loans-table-body').innerHTML = filteredLoans.map(loan => `
    <tr>
      <td style="font-weight:500">${getMemberFullName(loan.memberId)}</td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">
        ${getBookTitle(loan.bookId)}
      </td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${loan.loanDate}</td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${loan.dueDate}</td>
      <td style="font-size:13px; color:var(--color-text-muted)">${loan.returnDate || '—'}</td>
      <td>${renderStatusBadge(loan.status)}</td>
      <td>
        <div style="display:flex; gap:6px">
          ${loan.status === 'Active' || loan.status === 'Overdue'
            ? `<button class="btn btn-success btn-sm" onclick="markLoanAsReturned(${loan.id})">Return</button>`
            : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteLoan(${loan.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderReservationsPage() {
  getElement('reservations-table-body').innerHTML = db.reservations.map(reservation => {
    const member = findMemberById(reservation.memberId);
    const book   = findBookById(reservation.bookId);

    return `
      <tr>
        <td style="font-weight:500">${member ? `${member.firstName} ${member.lastName}` : '—'}</td>
        <td style="font-size:13px">${book ? book.title : '—'}</td>
        <td style="font-size:13px; color:var(--color-text-secondary)">${reservation.reservationDate}</td>
        <td style="font-size:13px; color:var(--color-text-secondary)">${reservation.expiryDate}</td>
        <td>${renderStatusBadge(reservation.status)}</td>
        <td>
          ${reservation.status === 'Pending'
            ? `<button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">Cancel</button>`
            : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderFinesPage() {
  getElement('fines-table-body').innerHTML = db.fines.map(fine => {
    const associatedLoan = db.loans.find(loan => loan.id === fine.loanId);
    const memberName     = associatedLoan ? getMemberFullName(associatedLoan.memberId) : '—';
    const bookTitle      = associatedLoan ? getBookTitle(associatedLoan.bookId)        : '—';

    return `
      <tr>
        <td style="font-weight:500">${memberName}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px">
          ${bookTitle}
        </td>
        <td>
          <span style="font-weight:700; color:${fine.isPaid ? 'var(--color-green)' : 'var(--color-red)'}">
            ₱${fine.amount.toFixed(2)}
          </span>
        </td>
        <td style="font-size:13px; color:var(--color-text-secondary)">${fine.reason}</td>
        <td>${renderBadge(fine.isPaid ? 'Paid' : 'Unpaid', fine.isPaid ? 'green' : 'red')}</td>
        <td>
          ${!fine.isPaid
            ? `<button class="btn btn-success btn-sm" onclick="markFineAsPaid(${fine.id})">Mark Paid</button>`
            : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderStaffPage() {
  const roleColors = {
    Librarian: 'gold',
    Assistant: 'teal',
    Admin:     'blue',
  };

  getElement('staff-table-body').innerHTML = db.staff.map(staffMember => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:10px">
          <div style="width:30px; height:30px; border-radius:50%;
                      background-color:var(--color-gold-subtle); color:var(--color-gold);
                      display:flex; align-items:center; justify-content:center;
                      font-size:11px; font-weight:600">
            ${getInitials(staffMember.firstName, staffMember.lastName)}
          </div>
          <span style="font-weight:500">${staffMember.firstName} ${staffMember.lastName}</span>
        </div>
      </td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${staffMember.email}</td>
      <td>${renderBadge(staffMember.role, roleColors[staffMember.role] || 'gray')}</td>
      <td style="font-size:13px; color:var(--color-text-secondary)">${staffMember.hireDate}</td>
      <td>
        <div style="display:flex; gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditStaffModal(${staffMember.id})">✎</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteStaff(${staffMember.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   SQL PAGE RENDER
   ============================================================ */

/** All SQL query sections displayed on the SQL Queries page.
 *  All column names use the engine's internal snake_case-free keys (e.g. bookid, categoryid).
 *  CONCAT() is used for string concatenation — the engine supports it.
 */
const SQL_QUERY_SECTIONS = [
  {
    sectionLabel: 'SELECT Queries (Q1–Q10)',
    labelColor:   'var(--color-teal)',
    queries: [
      {
        name: 'Q1 — Books with categories',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nORDER BY c.categoryname, b.title;`,
      },
      {
        name: 'Q2 — Active members',
        sql: `SELECT memberid, CONCAT(firstname, ' ', lastname) AS full_name,\n       email, membershiptype\nFROM members\nWHERE isactive = 1\nORDER BY lastname;`,
      },
      {
        name: 'Q3 — Currently borrowed books (Active loans)',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS borrower,\n       b.title, l.loandate, l.duedate\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nWHERE l.status = 'Active';`,
      },
      {
        name: 'Q4 — Overdue loans',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS borrower,\n       b.title, l.duedate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nWHERE l.status = 'Overdue'\nORDER BY l.duedate;`,
      },
      {
        name: 'Q5 — Books with high stock (5 or more copies)',
        sql: `SELECT bookid, title, isbn, totalcopies\nFROM books\nWHERE totalcopies >= 5\nORDER BY totalcopies DESC;`,
      },
      {
        name: 'Q6 — Loan history of member #1',
        sql: `SELECT l.loanid, b.title, l.loandate, l.duedate, l.returndate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nWHERE l.memberid = 1;`,
      },
      {
        name: 'Q7 — Books in Fiction or Mystery category',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE c.categoryname IN ('Fiction', 'Mystery', 'Science Fiction')\nORDER BY c.categoryname, b.title;`,
      },
      {
        name: 'Q8 — Books by author (Orwell)',
        sql: `SELECT b.title, b.isbn, b.publishyear, c.categoryname\nFROM books b\nJOIN bookauthors ba ON b.bookid = ba.bookid\nJOIN authors a ON ba.authorid = a.authorid\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE a.lastname = 'Orwell';`,
      },
      {
        name: 'Q9 — Members with unpaid fines',
        sql: `SELECT CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       m.email, f.amount, f.reason\nFROM fines f\nJOIN loans l ON f.loanid = l.loanid\nJOIN members m ON l.memberid = m.memberid\nWHERE f.ispaid = 0;`,
      },
      {
        name: 'Q10 — Search books by keyword (History)',
        sql: `SELECT b.bookid, b.title, b.isbn, c.categoryname\nFROM books b\nJOIN categories c ON b.categoryid = c.categoryid\nWHERE b.title LIKE '%History%';`,
      },
    ],
  },
  {
    sectionLabel: 'JOIN Queries (J1–J3)',
    labelColor:   'var(--color-gold)',
    queries: [
      {
        name: 'J1 — Full loan details (4-table JOIN)',
        sql: `SELECT l.loanid, CONCAT(m.firstname, ' ', m.lastname) AS member,\n       b.title, CONCAT(s.firstname, ' ', s.lastname) AS staff,\n       l.loandate, l.duedate, l.status\nFROM loans l\nJOIN books b ON l.bookid = b.bookid\nJOIN members m ON l.memberid = m.memberid\nJOIN staff s ON l.staffid = s.staffid\nORDER BY l.loandate DESC;`,
      },
      {
        name: 'J2 — Reservations with member, book, and category',
        sql: `SELECT r.reservationid,\n       CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       b.title, c.categoryname, r.reservationdate, r.status\nFROM reservations r\nJOIN members m ON r.memberid = m.memberid\nJOIN books b ON r.bookid = b.bookid\nJOIN categories c ON b.categoryid = c.categoryid;`,
      },
      {
        name: 'J3 — Fine details with member and book',
        sql: `SELECT f.fineid, CONCAT(m.firstname, ' ', m.lastname) AS member,\n       b.title, f.amount, f.reason, f.ispaid\nFROM fines f\nJOIN loans l ON f.loanid = l.loanid\nJOIN members m ON l.memberid = m.memberid\nJOIN books b ON l.bookid = b.bookid;`,
      },
    ],
  },
  {
    sectionLabel: 'Aggregate Queries (A1–A2)',
    labelColor:   'var(--color-blue)',
    queries: [
      {
        name: 'A1 — Total loans per member (COUNT)',
        sql: `SELECT CONCAT(m.firstname, ' ', m.lastname) AS member_name,\n       COUNT(l.loanid) AS total_loans\nFROM members m\nLEFT JOIN loans l ON m.memberid = l.memberid\nGROUP BY m.memberid\nORDER BY total_loans DESC;`,
      },
      {
        name: 'A2 — Fine summary: SUM and AVG of unpaid amounts',
        sql: `SELECT COUNT(fineid) AS unpaid_count,\n       SUM(amount) AS total_due,\n       AVG(amount) AS average_fine\nFROM fines\nWHERE ispaid = 0;`,
      },
    ],
  },
  {
    sectionLabel: 'Subqueries (S1–S2)',
    labelColor:   'var(--color-amber)',
    queries: [
      {
        name: 'S1 — Members who have overdue loans (IN subquery)',
        sql: `SELECT firstname, email\nFROM members\nWHERE memberid IN (\n  SELECT memberid FROM loans WHERE status = 'Overdue'\n);`,
      },
      {
        name: 'S2 — Categories that have books in the catalog (EXISTS subquery)',
        sql: `SELECT categoryname\nFROM categories\nWHERE categoryid IN (\n  SELECT categoryid FROM books\n);`,
      },
    ],
  },
  {
    sectionLabel: 'UPDATE Queries (U1–U2)',
    labelColor:   'var(--color-green)',
    queries: [
      {
        name: 'U1 — Mark loan as returned',
        sql: `UPDATE loans\nSET returndate = '2025-05-04', status = 'Returned'\nWHERE loanid = 19;`,
      },
      {
        name: 'U2 — Renew member subscription expiry',
        sql: `UPDATE members\nSET expirydate = '2027-01-10'\nWHERE memberid = 1;`,
      },
    ],
  },
  {
    sectionLabel: 'DELETE Queries (D1–D2)',
    labelColor:   'var(--color-red)',
    queries: [
      {
        name: 'D1 — Remove cancelled reservations',
        sql: `DELETE FROM reservations\nWHERE status = 'Cancelled';`,
      },
      {
        name: 'D2 — Remove inactive staff record',
        sql: `DELETE FROM staff\nWHERE staffid = 20;`,
      },
    ],
  },
  {
    sectionLabel: 'N:M Relationship — BookAuthors Bridge Table',
    labelColor:   'var(--color-teal)',
    queries: [
      {
        name: 'NM1 — All books with their authors (N:M JOIN)',
        sql: `SELECT b.title, CONCAT(a.firstname, ' ', a.lastname) AS author_name, ba.role\nFROM bookauthors ba\nJOIN books b ON ba.bookid = b.bookid\nJOIN authors a ON ba.authorid = a.authorid\nORDER BY b.title, ba.role;`,
      },
      {
        name: 'NM2 — Books with co-authors only',
        sql: `SELECT b.title, CONCAT(a.firstname, ' ', a.lastname) AS co_author\nFROM bookauthors ba\nJOIN books b ON ba.bookid = b.bookid\nJOIN authors a ON ba.authorid = a.authorid\nWHERE ba.role = 'Co-Author';`,
      },
      {
        name: 'NM3 — Authors and how many books they contributed to (COUNT)',
        sql: `SELECT CONCAT(a.firstname, ' ', a.lastname) AS author_name,\n       COUNT(ba.bookid) AS books_contributed\nFROM authors a\nJOIN bookauthors ba ON a.authorid = ba.authorid\nGROUP BY a.authorid\nORDER BY books_contributed DESC;`,
      },
    ],
  },
];

/** Highlights SQL keywords, strings, comments, and numbers with <span> color tags. */
function highlightSqlSyntax(rawSql) {
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'ON', 'GROUP BY', 'ORDER BY',
    'HAVING', 'UPDATE', 'SET', 'DELETE', 'INSERT', 'CREATE', 'TABLE',
    'REFERENCES', 'NOT NULL', 'AUTO_INCREMENT', 'UNIQUE', 'VALUES', 'DROP',
    'AND', 'OR', 'IN', 'NOT', 'AS', 'IS', 'NULL', 'LIKE', 'CASE', 'WHEN',
    'THEN', 'ELSE', 'END', 'COALESCE', 'DISTINCT', 'BY', 'INTO', 'INTERVAL',
    'YEAR', 'DATE_ADD', 'DATEDIFF', 'CURDATE', 'CONCAT', 'COUNT', 'SUM',
    'AVG', 'MAX', 'MIN', 'INNER', 'OUTER',
  ];

  return rawSql
    .replace(/--[^\n]*/g,                    match => `<span class="sql-comment">${match}</span>`)
    .replace(new RegExp(`\\b(${sqlKeywords.join('|')})\\b`, 'g'),
                                             match => `<span class="sql-keyword">${match}</span>`)
    .replace(/'([^']*)'/g,                   match => `<span class="sql-string">${match}</span>`)
    .replace(/\b(\d+)\b/g,                   match => `<span class="sql-number">${match}</span>`);
}

/** Renders all SQL query sections into the SQL page container. */
function renderSqlPage() {
  let qIdx = 0;
  getElement('sql-query-container').innerHTML = SQL_QUERY_SECTIONS.map(section => `
    <div style="margin-bottom:28px">
      <div style="font-size:12px; font-weight:600; color:${section.labelColor};
                  text-transform:uppercase; letter-spacing:.08em;
                  margin-bottom:10px; padding-left:2px">
        ${section.sectionLabel}
      </div>
      ${section.queries.map((query, qi) => {
        const uid = 'qr_' + (qIdx++);
        return `
        <div class="sql-block">
          <div class="sql-block-bar">
            <span class="sql-block-name">${query.name}</span>
            <div style="display:flex;gap:6px">
              <button
                class="sql-copy-button"
                onclick="navigator.clipboard && navigator.clipboard.writeText(this.dataset.sql)"
                data-sql="${query.sql.replace(/"/g, '&quot;')}">
                Copy
              </button>
              <button
                class="sql-copy-button"
                style="background:var(--color-gold-subtle);color:var(--color-gold);border-color:var(--color-gold)"
                onclick="runQueryInline(this.dataset.sql, '${uid}'); loadAndRunSql(this.dataset.sql);"
                data-sql="${query.sql.replace(/"/g, '&quot;')}">
                Run &#9654;
              </button>
            </div>
          </div>
          <pre class="sql-code-block">${highlightSqlSyntax(query.sql)}</pre>
          <div id="${uid}" style="display:none; margin:0 0 4px 0; background:#070709;
               border:1px solid #1a1a24; border-top:none; border-radius:0 0 6px 6px;
               padding:12px 14px; font-family:'Share Tech Mono',monospace;
               overflow-x:auto; max-height:320px; overflow-y:auto;
               font-size:12.5px">
          </div>
        </div>
      `}).join('')}
    </div>
  `).join('');
}

/** Run a query and show result in a per-query result panel */
function runQueryInline(sqlText, resultDivId) {
  const resultDiv = getElement(resultDivId);
  if (!resultDiv) return;
  resultDiv.style.display = 'block';

  const cleanSql = sqlText.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const upper = cleanSql.toUpperCase().trimStart();

  try {
    if (upper.startsWith('SELECT')) {
      const result = runSelect(cleanSql);
      if (result.error) {
        resultDiv.innerHTML = '<span style="color:var(--color-red)">⚠ ' + result.error + '</span>';
      } else {
        resultDiv.innerHTML = renderSqlTable(result.rows);
      }
    } else if (upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
      const type = upper.startsWith('UPDATE') ? 'UPDATE' : 'DELETE';
      resultDiv.innerHTML = '<span style="color:var(--color-amber)">' + runMutationSQL(cleanSql, type) + '</span>'
        + '<div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">⚠ Demo mode — data is not actually modified.</div>';
    } else {
      resultDiv.innerHTML = '<span style="color:var(--color-text-muted)">✓ Statement recognized (DDL/DML not executed in demo mode).</span>';
    }
  } catch(err) {
    resultDiv.innerHTML = '<span style="color:var(--color-red)">⚠ Parse error: ' + err.message + '</span>';
  }
}

/* ============================================================
   SQL ENGINE — In-memory SQL simulator connected to db
   Supports: SELECT with WHERE, JOIN, ORDER BY, GROUP BY,
             LIMIT, DISTINCT, aggregate functions, UPDATE, DELETE
   ============================================================ */

/** The in-memory "database" tables available to the SQL engine */
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
    categories:   db.categories.map(c => ({
      categoryid: c.id, categoryname: c.name,
    })),
    members:      db.members.map(m => ({
      memberid: m.id, firstname: m.firstName, lastname: m.lastName,
      email: m.email, phone: m.phone || '',
      membershiptype: m.membershipType, joindate: m.joinDate,
      expirydate: m.expiryDate || '', isactive: m.isActive ? 1 : 0,
      address: m.address || '',
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
      reservationdate: r.reservationDate, expirydate: r.expiryDate,
      status: r.status,
    })),
    fines:        db.fines.map(f => ({
      fineid: f.id, loanid: f.loanId, amount: f.amount,
      reason: f.reason, ispaid: f.isPaid ? 1 : 0,
      paiddate: f.paidDate || null,
    })),
    bookauthors:  db.bookAuthors.map(ba => ({
      bookauthorid: ba.id, bookid: ba.bookId, authorid: ba.authorId, role: ba.role,
    })),
  };
}

/** Tokenize a SQL string into simple parts */
function sqlTokenize(sql) {
  return sql
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([(),*=<>!])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(t => t.length > 0);
}

/** Parse a simple condition like col OP value */
function evaluateCondition(row, condition) {
  const norm = condition.trim();

  // Handle IS NULL / IS NOT NULL
  const isNullMatch = norm.match(/^(\w+(?:\.\w+)?)\s+IS\s+(NOT\s+)?NULL$/i);
  if (isNullMatch) {
    const col = isNullMatch[1].toLowerCase().replace(/.*\./, '');
    const val = row[col];
    const isNull = (val === null || val === undefined || val === '');
    return isNullMatch[2] ? !isNull : isNull;
  }

  // Handle LIKE
  const likeMatch = norm.match(/^(\w+(?:\.\w+)?)\s+(?:NOT\s+)?LIKE\s+'([^']*)'\s*$/i);
  if (likeMatch) {
    const col = likeMatch[1].toLowerCase().replace(/.*\./, '');
    const pattern = likeMatch[2].replace(/%/g, '.*').replace(/_/g, '.');
    const regex = new RegExp(`^${pattern}$`, 'i');
    const val = String(row[col] ?? '');
    const matches = regex.test(val);
    return norm.toUpperCase().includes('NOT LIKE') ? !matches : matches;
  }

  // Handle IN (...)
  const inMatch = norm.match(/^(\w+(?:\.\w+)?)\s+(NOT\s+)?IN\s*\(([^)]+)\)$/i);
  if (inMatch) {
    const col = inMatch[1].toLowerCase().replace(/.*\./, '');
    const vals = inMatch[3].split(',').map(v => v.trim().replace(/^'|'$/g, '').toLowerCase());
    const rowVal = String(row[col] ?? '').toLowerCase();
    return inMatch[2] ? !vals.includes(rowVal) : vals.includes(rowVal);
  }

  // Handle BETWEEN
  const betweenMatch = norm.match(/^(\w+(?:\.\w+)?)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
  if (betweenMatch) {
    const col = betweenMatch[1].toLowerCase().replace(/.*\./, '');
    const lo = parseFloat(betweenMatch[2].replace(/'/g, ''));
    const hi = parseFloat(betweenMatch[3].replace(/'/g, ''));
    return row[col] >= lo && row[col] <= hi;
  }

  // Standard comparison: col OP value
  const cmpMatch = norm.match(/^(\w+(?:\.\w+)?)\s*(=|!=|<>|<=|>=|<|>)\s*(.+)$/);
  if (!cmpMatch) return true;

  const col = cmpMatch[1].toLowerCase().replace(/.*\./, '');
  const op  = cmpMatch[2];
  let rawVal = cmpMatch[3].trim();
  const strVal = rawVal.replace(/^'|'$/g, '');
  const numVal = parseFloat(strVal);
  const rowRaw = row[col];
  const rowNum = parseFloat(rowRaw);

  const compareStr = (a, b, op) => {
    switch(op) {
      case '=':  return String(a).toLowerCase() === String(b).toLowerCase();
      case '!=': case '<>': return String(a).toLowerCase() !== String(b).toLowerCase();
      default:   return String(a).toLowerCase() < String(b).toLowerCase();
    }
  };

  if (!isNaN(numVal) && !isNaN(rowNum)) {
    switch(op) {
      case '=':  return rowNum === numVal;
      case '!=': case '<>': return rowNum !== numVal;
      case '<':  return rowNum <  numVal;
      case '>':  return rowNum >  numVal;
      case '<=': return rowNum <= numVal;
      case '>=': return rowNum >= numVal;
    }
  }

  return compareStr(rowRaw, strVal, op);
}

/** Evaluate a WHERE clause string against a row */
function evaluateWhere(row, whereClause) {
  if (!whereClause) return true;

  // Split on AND (top-level only, no parentheses support yet)
  const andParts = whereClause.split(/\bAND\b/i);
  for (const part of andParts) {
    const orParts = part.split(/\bOR\b/i);
    const orResult = orParts.some(cond => evaluateCondition(row, cond.trim()));
    if (!orResult) return false;
  }
  return true;
}

/** Extract the value expression for GROUP BY aggregates */
function resolveValue(row, expr) {
  const e = expr.trim().toLowerCase();
  if (e === '*') return 1;
  if (!isNaN(parseFloat(e))) return parseFloat(e);
  // Strip table alias
  const col = e.replace(/^[a-z]+\./, '');
  return row[col] ?? null;
}

/** Run a SELECT statement against the in-memory tables */
function runSelect(sql) {
  const tables = getSqlTables();
  const upper  = sql.toUpperCase();

  // ── Parse FROM + optional alias ──────────────────────────
  const fromMatch = sql.match(/\bFROM\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/i);
  if (!fromMatch) return { error: 'Could not find FROM clause.' };

  const mainTableName = fromMatch[1].toLowerCase();
  if (!tables[mainTableName]) return { error: `Unknown table: '${fromMatch[1]}'` };

  let rows = tables[mainTableName].map(r => ({...r}));

  // ── Parse JOINs ──────────────────────────────────────────
  const joinRegex = /(?:(?:INNER|LEFT|RIGHT|OUTER)\s+)?JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+([\w.]+)\s*=\s*([\w.]+)/gi;
  let joinMatch;
  while ((joinMatch = joinRegex.exec(sql)) !== null) {
    const joinTable = joinMatch[1].toLowerCase();
    if (!tables[joinTable]) return { error: `Unknown join table: '${joinMatch[1]}'` };

    const leftCol  = joinMatch[3].toLowerCase().replace(/.*\./, '');
    const rightCol = joinMatch[4].toLowerCase().replace(/.*\./, '');

    const newRows = [];
    for (const leftRow of rows) {
      const matched = tables[joinTable].filter(
        r => String(r[rightCol]).toLowerCase() === String(leftRow[leftCol]).toLowerCase()
          || String(r[leftCol]).toLowerCase() === String(leftRow[rightCol]).toLowerCase()
      );
      if (matched.length > 0) {
        for (const rightRow of matched) newRows.push({...leftRow, ...rightRow});
      } else if (upper.includes('LEFT JOIN')) {
        newRows.push({...leftRow});
      }
    }
    rows = newRows;
  }

  // ── Parse WHERE ───────────────────────────────────────────
  const whereMatch = sql.match(/\bWHERE\b(.+?)(?:\bGROUP BY\b|\bORDER BY\b|\bHAVING\b|\bLIMIT\b|$)/i);
  if (whereMatch) {
    let whereClause = whereMatch[1].trim();
    // Resolve IN (subquery) by executing inner SELECT first
    whereClause = whereClause.replace(/\bIN\s*\(\s*(SELECT[\s\S]+?)\)/gi, (_, subSql) => {
      try {
        const subResult = runSelect(subSql.trim());
        if (subResult.rows && subResult.rows.length > 0) {
          const firstKey = Object.keys(subResult.rows[0])[0];
          const vals = subResult.rows.map(r => {
            const v = r[firstKey];
            return typeof v === 'string' ? "'" + v + "'" : String(v ?? 'NULL');
          }).join(',');
          return 'IN (' + vals + ')';
        }
        return "IN ('__NO_MATCH__')";
      } catch(e) { return "IN ('__NO_MATCH__')"; }
    });
    rows = rows.filter(row => evaluateWhere(row, whereClause));
  }

  // ── Parse SELECT columns ──────────────────────────────────
  const selectMatch = sql.match(/^SELECT\s+(DISTINCT\s+)?([\s\S]+?)\s+FROM\b/i);
  if (!selectMatch) return { error: 'Malformed SELECT clause.' };

  const isDistinct = !!selectMatch[1];
  const rawCols    = selectMatch[2];

  // Split by comma but not inside parens
  const colDefs = [];
  let depth = 0, cur = '';
  for (const ch of rawCols) {
    if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth--; cur += ch; }
    else if (ch === ',' && depth === 0) { colDefs.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) colDefs.push(cur.trim());

  // ── Group by ──────────────────────────────────────────────
  const groupByMatch = sql.match(/\bGROUP\s+BY\b(.+?)(?:\bHAVING\b|\bORDER BY\b|\bLIMIT\b|$)/i);
  let groupedRows = null;

  const aggFuncRe = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(/i;
  const hasAgg    = colDefs.some(c => aggFuncRe.test(c));

  if (groupByMatch || hasAgg) {
    const groupKeys = groupByMatch
      ? groupByMatch[1].split(',').map(k => k.trim().toLowerCase().replace(/.*\./, ''))
      : [];

    const groups = {};
    for (const row of rows) {
      const key = groupKeys.map(k => row[k] ?? '').join('||');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    groupedRows = Object.values(groups).map(groupRows => {
      const repr = {...groupRows[0]};
      // Compute aggregates
      for (const colDef of colDefs) {
        const aggMatch = colDef.match(/\b(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*([^)]+)\s*\)/i);
        if (!aggMatch) continue;
        const fn   = aggMatch[1].toUpperCase();
        const arg  = aggMatch[2].trim().toLowerCase().replace(/.*\./, '');
        const vals = groupRows.map(r => parseFloat(r[arg])).filter(v => !isNaN(v));

        // Alias
        const aliasMatch = colDef.match(/\bAS\s+(\w+)\s*$/i);
        const alias = aliasMatch ? aliasMatch[1].toLowerCase() : colDef.toLowerCase().replace(/[^a-z0-9_]/g,'_');

        let result;
        switch (fn) {
          case 'COUNT': result = arg === '*' ? groupRows.length : groupRows.filter(r => r[arg] !== null && r[arg] !== undefined).length; break;
          case 'SUM':   result = vals.reduce((a,b) => a+b, 0); break;
          case 'AVG':   result = vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : null; break;
          case 'MAX':   result = vals.length ? Math.max(...vals) : null; break;
          case 'MIN':   result = vals.length ? Math.min(...vals) : null; break;
        }
        repr[alias] = result;
      }
      return repr;
    });
    rows = groupedRows;
  }

  // ── Project columns ───────────────────────────────────────
  const projected = rows.map(row => {
    if (rawCols.trim() === '*') return row;
    const out = {};
    for (const colDef of colDefs) {
      const aliasMatch = colDef.match(/\bAS\s+(\w+)\s*$/i);
      const alias      = aliasMatch ? aliasMatch[1] : null;

      // Aggregate already computed into row
      const aggMatch = colDef.match(/\b(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*([^)]+)\s*\)/i);
      if (aggMatch) {
        const key = alias ? alias.toLowerCase() : colDef.toLowerCase().replace(/[^a-z0-9_]/g,'_');
        out[alias || key] = row[key] ?? row[colDef.toLowerCase().replace(/[^a-z0-9_]/g,'_')];
        continue;
      }

      // CONCAT
      const concatMatch = colDef.match(/CONCAT\s*\(([^)]+)\)/i);
      if (concatMatch) {
        const parts = concatMatch[1].split(',').map(p => {
          p = p.trim();
          if (p.startsWith("'") && p.endsWith("'")) return p.slice(1, -1);
          const col = p.toLowerCase().replace(/.*\./, '');
          return row[col] ?? '';
        });
        const key = alias || 'concat_result';
        out[key] = parts.join('');
        continue;
      }

      // Plain column (possibly with alias prefix)
      const colName = (colDef.replace(/\bAS\s+\w+\s*$/i, '').trim()).toLowerCase().replace(/.*\./, '');
      const key     = alias || colName;
      out[key]      = row[colName] ?? null;
    }
    return out;
  });

  // ── ORDER BY ──────────────────────────────────────────────
  const orderMatch = sql.match(/\bORDER\s+BY\s+(.+?)(?:\bLIMIT\b|$)/i);
  if (orderMatch) {
    const orderCols = orderMatch[1].split(',').map(s => s.trim());
    projected.sort((a, b) => {
      for (const oc of orderCols) {
        const parts = oc.split(/\s+/);
        const col   = parts[0].toLowerCase().replace(/.*\./, '');
        const dir   = (parts[1] || 'ASC').toUpperCase();
        const av    = a[col], bv = b[col];
        if (av === bv) continue;
        const cmp = (typeof av === 'number' && typeof bv === 'number')
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''));
        return dir === 'DESC' ? -cmp : cmp;
      }
      return 0;
    });
  }

  // ── DISTINCT ──────────────────────────────────────────────
  let finalRows = projected;
  if (isDistinct) {
    const seen = new Set();
    finalRows = projected.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── LIMIT ─────────────────────────────────────────────────
  const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i);
  if (limitMatch) finalRows = finalRows.slice(0, parseInt(limitMatch[1]));

  return { rows: finalRows };
}

/** Run a simple UPDATE/DELETE statement and show affected count */
function runMutationSQL(sql, type) {
  const tables = getSqlTables();
  const fromMatch = sql.match(/(?:UPDATE|FROM)\s+(\w+)/i);
  if (!fromMatch) return `Executed ${type} (table not parsed).`;
  const tbl   = fromMatch[1].toLowerCase();
  const tRows = tables[tbl];
  if (!tRows)   return `Unknown table '${fromMatch[1]}'.`;

  const whereMatch = sql.match(/\bWHERE\b(.+?)(?:;|$)/i);
  const affected   = whereMatch
    ? tRows.filter(row => evaluateWhere(row, whereMatch[1].trim())).length
    : tRows.length;

  return `${type} executed (simulated). ${affected} row(s) would be affected in '${fromMatch[1]}'.`;
}

/** Render query results as an HTML table */
function renderSqlTable(rows) {
  if (!rows || rows.length === 0) {
    return `<div style="color:var(--color-text-muted); padding:8px; font-size:13px">
      ✓ Query executed — 0 rows returned.
    </div>`;
  }

  const cols = Object.keys(rows[0]);
  const MAX_ROWS = 50;
  const displayed = rows.slice(0, MAX_ROWS);

  const headerHtml = cols.map(c =>
    `<th style="padding:7px 12px; text-align:left; border-bottom:1px solid var(--color-border);
               font-size:11px; text-transform:uppercase; letter-spacing:.06em;
               color:var(--color-text-muted); white-space:nowrap">${c}</th>`
  ).join('');

  const bodyHtml = displayed.map((row, i) =>
    `<tr style="background:${i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)'}">
      ${cols.map(c => {
        const val = row[c];
        let display = val === null || val === undefined ? '<span style="color:var(--color-text-muted)">NULL</span>' : String(val);
        return `<td style="padding:6px 12px; font-size:12.5px; border-bottom:1px solid rgba(255,255,255,.04); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${display}</td>`;
      }).join('')}
    </tr>`
  ).join('');

  const note = rows.length > MAX_ROWS
    ? `<div style="font-size:11px;color:var(--color-text-muted);padding:6px 12px">Showing first ${MAX_ROWS} of ${rows.length} rows</div>`
    : '';

  return `
    <div style="font-size:12px; color:var(--color-green); margin-bottom:8px; padding:0 4px">
      ✓ ${rows.length} row(s) returned
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%; border-collapse:collapse; font-family:'Share Tech Mono',monospace">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
    ${note}`;
}

/** Loads a query into the SQL runner textarea, scrolls to it, and executes it */
function loadAndRunSql(sqlText) {
  const input = getElement('sql-runner-input');
  input.value = sqlText;
  input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  executeLocalSQL();
}

/** Main entry point for the SQL Command Runner */
function executeLocalSQL() {
  const rawSql    = getElement('sql-runner-input').value.trim();
  const resultArea = getElement('sql-runner-results');
  resultArea.style.display = 'block';

  if (!rawSql) {
    resultArea.innerHTML = `<span style="color:var(--color-text-muted)">Enter a SQL query above and click Run Query.</span>`;
    return;
  }

  // Strip comments
  const cleanSql = rawSql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const upper    = cleanSql.toUpperCase().trimStart();

  try {
    if (upper.startsWith('SELECT')) {
      const result = runSelect(cleanSql);
      if (result.error) {
        resultArea.innerHTML = `<span style="color:var(--color-red)">⚠ ${result.error}</span>`;
      } else {
        resultArea.innerHTML = renderSqlTable(result.rows);
      }
    } else if (upper.startsWith('UPDATE')) {
      resultArea.innerHTML = `<span style="color:var(--color-amber)">${runMutationSQL(cleanSql, 'UPDATE')}</span>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">Note: This is a read-only demo — actual data is not modified.</div>`;
    } else if (upper.startsWith('DELETE')) {
      resultArea.innerHTML = `<span style="color:var(--color-amber)">${runMutationSQL(cleanSql, 'DELETE')}</span>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">Note: This is a read-only demo — actual data is not modified.</div>`;
    } else if (upper.startsWith('INSERT') || upper.startsWith('CREATE') || upper.startsWith('DROP') || upper.startsWith('USE')) {
      resultArea.innerHTML = `<span style="color:var(--color-amber)">✓ DDL/DML statement recognized.</span>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">Note: CREATE/INSERT/DROP are not executed in demo mode.</div>`;
    } else {
      resultArea.innerHTML = `<span style="color:var(--color-red)">⚠ Unsupported statement type. Try a SELECT, UPDATE, or DELETE query.</span>`;
    }
  } catch(err) {
    resultArea.innerHTML = `<span style="color:var(--color-red)">⚠ Parse error: ${err.message}</span>`;
  }
}

/* ============================================================
   MEMBER RENDERS
   ============================================================ */

function renderMemberHomePage() {
  const member       = currentUser.member;
  const memberLoans  = db.loans.filter(loan => loan.memberId === member.id);
  const activeLoans  = memberLoans.filter(loan => ['Active', 'Overdue'].includes(loan.status));
  const unpaidFines  = db.fines.filter(fine => {
    const associatedLoan = db.loans.find(loan => loan.id === fine.loanId);
    return associatedLoan && associatedLoan.memberId === member.id && !fine.isPaid;
  });
  const totalUnpaidAmount = unpaidFines.reduce((total, fine) => total + fine.amount, 0);

  getElement('member-avatar-hero').textContent  = getInitials(member.firstName, member.lastName);
  getElement('member-hero-name').textContent    = `Welcome, ${member.firstName}!`;
  getElement('member-hero-info').textContent    = `${member.membershipType} Member · Expiry: ${member.expiryDate}`;
  getElement('member-hero-type').textContent    = member.membershipType;
  getElement('member-hero-status').textContent  = member.isActive ? 'Active' : 'Inactive';

  getElement('member-stat-active-loans').textContent = activeLoans.length;
  getElement('member-stat-total-loans').textContent  = memberLoans.length;
  getElement('member-stat-fines').textContent        = `₱${totalUnpaidAmount.toFixed(0)}`;

  const emptyLoansMessage = `
    <tr><td colspan="3">
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <p>No active loans</p>
      </div>
    </td></tr>
  `;

  getElement('member-current-loans').innerHTML = activeLoans.length
    ? activeLoans.map(loan => `
        <tr>
          <td style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; font-size:13.5px">
            ${getBookTitle(loan.bookId)}
          </td>
          <td style="font-size:13px; color:var(--color-text-secondary)">${loan.dueDate}</td>
          <td>${renderStatusBadge(loan.status)}</td>
        </tr>
      `).join('')
    : emptyLoansMessage;

  const memberReservations = db.reservations.filter(reservation => reservation.memberId === member.id);
  const emptyReservationsMessage = `
    <tr><td colspan="3">
      <div class="empty-state">
        <div class="empty-state-icon">🔖</div>
        <p>No reservations</p>
      </div>
    </td></tr>
  `;

  getElement('member-reservations').innerHTML = memberReservations.length
    ? memberReservations.map(reservation => `
        <tr>
          <td style="font-size:13.5px; font-weight:500">${getBookTitle(reservation.bookId)}</td>
          <td style="font-size:13px; color:var(--color-text-secondary)">${reservation.reservationDate}</td>
          <td>${renderStatusBadge(reservation.status)}</td>
        </tr>
      `).join('')
    : emptyReservationsMessage;
}

function renderMemberBrowsePage() {
  const searchQuery    = (getElement('browse-search')?.value || '').toLowerCase();
  const filteredBooks  = db.books.filter(book =>
    !searchQuery ||
    book.title.toLowerCase().includes(searchQuery) ||
    getAuthorFullName(book.authorId).toLowerCase().includes(searchQuery) ||
    book.isbn.includes(searchQuery)
  );

  getElement('browse-tbody').innerHTML = filteredBooks.map(book => {
    const category     = findCategoryById(book.categoryId);
    const copiesOnLoan = db.loans.filter(
      loan => (loan.status === 'Active' || loan.status === 'Overdue') && loan.bookId === book.id
    ).length;
    const availableCopies = Math.max(0, book.totalCopies - copiesOnLoan);
    const alreadyReservedByCurrentMember = db.reservations.find(
      reservation =>
        reservation.bookId   === book.id &&
        reservation.memberId === currentUser.member.id &&
        reservation.status   === 'Pending'
    );

    return `
      <tr>
        <td style="font-weight:500">${book.title}</td>
        <td style="font-size:13px">${getAuthorFullName(book.authorId)}</td>
        <td>${category ? renderBadge(category.name, 'blue') : ''}</td>
        <td style="font-size:13px; color:var(--color-text-secondary)">${book.publishYear}</td>
        <td>
          ${availableCopies > 0
            ? renderBadge(`${availableCopies} available`, 'green')
            : renderBadge('All borrowed', 'red')}
        </td>
        <td>
          ${!alreadyReservedByCurrentMember
            ? `<button class="btn btn-gold btn-sm" onclick="memberReserveBook(${book.id})">Reserve</button>`
            : `<span style="font-size:12px; color:var(--color-amber)">Reserved</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderMemberHistoryPage() {
  const member      = currentUser.member;
  const memberLoans = db.loans.filter(loan => loan.memberId === member.id);

  const emptyMessage = `
    <tr><td colspan="5">
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>No loan history yet</p>
      </div>
    </td></tr>
  `;

  getElement('member-history-tbody').innerHTML = memberLoans.length
    ? memberLoans.map(loan => `
        <tr>
          <td style="font-weight:500; font-size:13.5px">${getBookTitle(loan.bookId)}</td>
          <td style="font-size:13px; color:var(--color-text-secondary)">${loan.loanDate}</td>
          <td style="font-size:13px; color:var(--color-text-secondary)">${loan.dueDate}</td>
          <td style="font-size:13px; color:var(--color-text-muted)">${loan.returnDate || '—'}</td>
          <td>${renderStatusBadge(loan.status)}</td>
        </tr>
      `).join('')
    : emptyMessage;
}

function renderMemberFinesPage() {
  const member       = currentUser.member;
  const memberFines  = db.fines.filter(fine => {
    const associatedLoan = db.loans.find(loan => loan.id === fine.loanId);
    return associatedLoan && associatedLoan.memberId === member.id;
  });

  const emptyMessage = `
    <tr><td colspan="4">
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <p>No fines on your account</p>
      </div>
    </td></tr>
  `;

  getElement('member-fines-tbody').innerHTML = memberFines.length
    ? memberFines.map(fine => {
        const associatedLoan = db.loans.find(loan => loan.id === fine.loanId);
        return `
          <tr>
            <td style="font-weight:500; font-size:13.5px">
              ${associatedLoan ? getBookTitle(associatedLoan.bookId) : '—'}
            </td>
            <td>
              <span style="font-weight:700; color:${fine.isPaid ? 'var(--color-green)' : 'var(--color-red)'}">
                ₱${fine.amount.toFixed(2)}
              </span>
            </td>
            <td style="font-size:13px; color:var(--color-text-secondary)">${fine.reason}</td>
            <td>${renderBadge(fine.isPaid ? 'Paid' : 'Unpaid', fine.isPaid ? 'green' : 'red')}</td>
          </tr>
        `;
      }).join('')
    : emptyMessage;
}

function renderMemberProfilePage() {
  const member = currentUser.member;

  const profileFields = [
    ['Membership Type', member.membershipType],
    ['Phone',          member.phone    || '—'],
    ['Join Date',      member.joinDate],
    ['Expiry Date',    member.expiryDate],
    ['Address',        member.address  || '—'],
    ['Status',         member.isActive ? 'Active' : 'Inactive'],
  ];

  getElement('profile-content').innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px">
      <div style="width:56px; height:56px; border-radius:50%;
                  background-color:var(--color-teal-subtle); color:var(--color-teal);
                  display:flex; align-items:center; justify-content:center;
                  font-size:20px; font-weight:700">
        ${getInitials(member.firstName, member.lastName)}
      </div>
      <div>
        <div style="font-size:20px; font-weight:600">${member.firstName} ${member.lastName}</div>
        <div style="font-size:13.5px; color:var(--color-text-secondary)">${member.email}</div>
      </div>
    </div>
    <div style="display:grid; gap:12px">
      ${profileFields.map(([fieldLabel, fieldValue]) => `
        <div style="display:flex; justify-content:space-between; padding:10px 0;
                    border-bottom:1px solid var(--color-border-subtle)">
          <span style="font-size:13px; color:var(--color-text-muted)">${fieldLabel}</span>
          <span style="font-size:13.5px; font-weight:500">${fieldValue}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ============================================================
   CRUD — BOOKS
   ============================================================ */

function saveBook() {
  const bookId = parseInt(getElement('book-modal-id').value) || 0;

  const bookData = {
    isbn:        getElement('book-modal-isbn').value,
    title:       getElement('book-modal-title').value,
    categoryId:  parseInt(getElement('book-modal-category').value),
    publisher:   getElement('book-modal-publisher').value,
    publishYear: parseInt(getElement('book-modal-year').value),
    edition:     parseInt(getElement('book-modal-edition').value)     || 1,
    totalCopies: parseInt(getElement('book-modal-total-copies').value) || 1,
    authorId:    parseInt(getElement('book-modal-author').value),
  };

  if (!bookData.title || !bookData.isbn) {
    showToast('Title and ISBN are required.', 'error');
    return;
  }

  if (bookId) {
    const existingBook = db.books.find(book => book.id === bookId);
    if (existingBook) Object.assign(existingBook, bookData);
    showToast('Book updated!');
  } else {
    bookData.id = db.nextAvailableId.books++;
    db.books.push(bookData);
    showToast('Book added!');
  }

  saveDatabase();
  closeModal('book-modal');
  renderBooksPage();
}

function openEditBookModal(bookId) {
  const book = db.books.find(targetBook => targetBook.id === bookId);
  if (!book) return;

  getElement('book-modal-title-heading').textContent     = 'Edit Book';
  getElement('book-modal-id').value                      = bookId;
  openModal('book-modal');

  getElement('book-modal-isbn').value         = book.isbn;
  getElement('book-modal-title').value        = book.title;
  getElement('book-modal-category').value     = book.categoryId;
  getElement('book-modal-publisher').value    = book.publisher   || '';
  getElement('book-modal-year').value         = book.publishYear || '';
  getElement('book-modal-edition').value      = book.edition;
  getElement('book-modal-total-copies').value = book.totalCopies;
  getElement('book-modal-author').value       = book.authorId    || '';
}

function deleteBook(bookId) {
  if (!confirm('Delete this book?')) return;

  db.books = db.books.filter(book => book.id !== bookId);
  saveDatabase();
  showToast('Book deleted.', 'info');
  renderBooksPage();
}

/* ============================================================
   CRUD — MEMBERS
   ============================================================ */

function saveMember() {
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

  if (memberId) {
    const existingMember = db.members.find(member => member.id === memberId);
    if (existingMember) Object.assign(existingMember, memberData);
    showToast('Member updated!');
  } else {
    memberData.id = db.nextAvailableId.members++;
    db.members.push(memberData);
    showToast('Member added!');
  }

  saveDatabase();
  closeModal('member-modal');
  renderMembersAdminPage();
}

function openEditMemberModal(memberId) {
  const member = db.members.find(targetMember => targetMember.id === memberId);
  if (!member) return;

  getElement('member-modal-title').textContent = 'Edit Member';
  getElement('member-modal-id').value          = memberId;
  openModal('member-modal');

  getElement('member-modal-first-name').value       = member.firstName;
  getElement('member-modal-last-name').value        = member.lastName;
  getElement('member-modal-email').value            = member.email;
  getElement('member-modal-phone').value            = member.phone || '';
  getElement('member-modal-membership-type').value  = member.membershipType;
  getElement('member-modal-join-date').value        = member.joinDate;
  getElement('member-modal-expiry-date').value      = member.expiryDate;
}

function toggleMemberActiveStatus(memberId) {
  const member = db.members.find(targetMember => targetMember.id === memberId);
  if (!member) return;

  member.isActive = !member.isActive;
  saveDatabase();
  showToast(member.isActive ? 'Member reactivated.' : 'Member deactivated.', 'info');
  renderMembersAdminPage();
}

/* ============================================================
   CRUD — LOANS
   ============================================================ */

function saveLoan() {
  const memberId  = parseInt(getElement('loan-modal-member').value);
  const bookId    = parseInt(getElement('loan-modal-book').value);
  const staffId   = parseInt(getElement('loan-modal-staff').value);
  const loanDate  = getElement('loan-modal-loan-date').value;
  const dueDate   = getElement('loan-modal-due-date').value;

  db.loans.push({
    id:         db.nextAvailableId.loans++,
    bookId,
    memberId,
    staffId,
    loanDate,
    dueDate,
    returnDate: null,
    status:     'Active',
  });

  saveDatabase();
  showToast('Loan created!');
  closeModal('loan-modal');
  renderLoansAdminPage();
  renderDashboard();
}

function markLoanAsReturned(loanId) {
  const loan = db.loans.find(targetLoan => targetLoan.id === loanId);
  if (!loan) return;

  loan.returnDate = getTodayDateString();
  loan.status     = 'Returned';
  saveDatabase();
  showToast(`Loan #${loanId} returned.`);
  renderLoansAdminPage();
  renderDashboard();
}

function deleteLoan(loanId) {
  if (!confirm('Delete loan record?')) return;

  db.loans = db.loans.filter(loan => loan.id !== loanId);
  saveDatabase();
  showToast('Loan deleted.', 'info');
  renderLoansAdminPage();
  renderDashboard();
}

/* ============================================================
   CRUD — RESERVATIONS
   ============================================================ */

function saveReservation() {
  const memberId        = parseInt(getElement('reservation-modal-member').value);
  const bookId          = parseInt(getElement('reservation-modal-book').value);
  const reservationDate = getElement('reservation-modal-date').value;
  const expiryDate      = getElement('reservation-modal-expiry').value;

  db.reservations.push({
    id: db.nextAvailableId.reservations++,
    bookId,
    memberId,
    reservationDate,
    expiryDate,
    status: 'Pending',
  });

  saveDatabase();
  showToast('Reservation created!');
  closeModal('reservation-modal');
  renderReservationsPage();
}

function cancelReservation(reservationId) {
  const reservation = db.reservations.find(
    targetReservation => targetReservation.id === reservationId
  );
  if (reservation) {
    reservation.status = 'Cancelled';
    saveDatabase();
  }

  showToast('Reservation cancelled.', 'info');
  renderReservationsPage();
}

/** Lets a logged-in member quickly reserve a book from the Browse page. */
function memberReserveBook(bookId) {
  const member = currentUser.member;

  db.reservations.push({
    id:               db.nextAvailableId.reservations++,
    bookId,
    memberId:         member.id,
    reservationDate:  getTodayDateString(),
    expiryDate:       addDaysToDate(getTodayDateString(), 7),
    status:           'Pending',
  });

  saveDatabase();
  showToast("Book reserved! We'll hold it for 7 days.", 'success');
  renderMemberBrowsePage();
}

/* ============================================================
   CRUD — FINES
   ============================================================ */

function saveFine() {
  const loanId = parseInt(getElement('fine-modal-loan').value);
  const amount = parseFloat(getElement('fine-modal-amount').value);
  const reason = getElement('fine-modal-reason').value;

  db.fines.push({
    id:       db.nextAvailableId.fines++,
    loanId,
    amount,
    reason,
    isPaid:   false,
    paidDate: null,
  });

  saveDatabase();
  showToast('Fine added!');
  closeModal('fine-modal');
  renderFinesPage();
}

function markFineAsPaid(fineId) {
  const fine = db.fines.find(targetFine => targetFine.id === fineId);
  if (fine) {
    fine.isPaid   = true;
    fine.paidDate = getTodayDateString();
    saveDatabase();
  }

  showToast('Fine marked as paid.');
  renderFinesPage();
}

/* ============================================================
   CRUD — STAFF
   ============================================================ */

function saveStaff() {
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

  if (staffId) {
    const existingStaff = db.staff.find(staffMember => staffMember.id === staffId);
    if (existingStaff) Object.assign(existingStaff, staffData);
    showToast('Staff updated!');
  } else {
    staffData.id = db.nextAvailableId.staff++;
    db.staff.push(staffData);
    showToast('Staff added!');
  }

  saveDatabase();
  closeModal('staff-modal');
  renderStaffPage();
}

function openEditStaffModal(staffId) {
  const staffMember = db.staff.find(targetStaff => targetStaff.id === staffId);
  if (!staffMember) return;

  getElement('staff-modal-title').textContent = 'Edit Staff';
  getElement('staff-modal-id').value          = staffId;
  openModal('staff-modal');

  getElement('staff-modal-first-name').value = staffMember.firstName;
  getElement('staff-modal-last-name').value  = staffMember.lastName;
  getElement('staff-modal-email').value      = staffMember.email;
  getElement('staff-modal-role').value       = staffMember.role;
  getElement('staff-modal-hire-date').value  = staffMember.hireDate;
}

function deleteStaff(staffId) {
  if (!confirm('Remove this staff member?')) return;

  db.staff = db.staff.filter(staffMember => staffMember.id !== staffId);
  saveDatabase();
  showToast('Staff removed.', 'info');
  renderStaffPage();
}

/* ============================================================
   CRUD — MEMBER PROFILE
   ============================================================ */

function saveProfile() {
  const member = currentUser.member;

  member.firstName = getElement('profile-modal-first-name').value || member.firstName;
  member.lastName  = getElement('profile-modal-last-name').value  || member.lastName;
  member.phone     = getElement('profile-modal-phone').value;
  member.address   = getElement('profile-modal-address').value;

  getElement('sidebar-name').textContent   = `${member.firstName} ${member.lastName}`;
  getElement('sidebar-avatar').textContent = getInitials(member.firstName, member.lastName);

  saveDatabase();
  showToast('Profile updated!');
  closeModal('profile-modal');
  renderMemberProfilePage();
}

/* ============================================================
   CRUD — AUTHORS
   ============================================================ */

function saveAuthor() {
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

  if (authorId) {
    const existingAuthor = db.authors.find(a => a.id === authorId);
    if (existingAuthor) Object.assign(existingAuthor, authorData);
    showToast('Author updated!');
  } else {
    authorData.id = db.nextAvailableId.authors++;
    db.authors.push(authorData);
    showToast('Author added!');
  }

  saveDatabase();
  closeModal('author-modal');
  renderAuthorsPage();
}

function deleteAuthor(authorId) {
  if (!confirm('Remove this author?')) return;

  db.authors = db.authors.filter(author => author.id !== authorId);
  saveDatabase();
  showToast('Author removed.', 'info');
  renderAuthorsPage();
}