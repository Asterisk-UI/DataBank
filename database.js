/* ============================================================
   database.js — Supabase client for the Data Bank Library System

   Replace SUPABASE_URL and SUPABASE_ANON_KEY with values from:
   Supabase Dashboard → Project Settings → API
   ============================================================ */

const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';

/* Initialise the Supabase client (loaded via CDN in index.html) */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── ADMIN CREDENTIALS (kept client-side; move to a DB table + bcrypt for production) ── */
const ADMIN_CREDENTIALS = {
  email:    'admin@lexis.edu',
  password: 'admin123',
};

/* ============================================================
   DATA ACCESS LAYER
   Every function is async and returns plain JS objects so
   the rest of app.js can use them just like the old `db.*`
   arrays—just with `await`.
   ============================================================ */

/* ── CATEGORIES ── */
async function fetchCategories() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('categoryid, categoryname')
    .order('categoryid');
  if (error) { console.error('fetchCategories:', error); return []; }
  return data.map(r => ({ id: r.categoryid, name: r.categoryname }));
}

/* ── AUTHORS ── */
async function fetchAuthors() {
  const { data, error } = await supabaseClient
    .from('authors')
    .select('authorid, firstname, lastname, nationality, birthyear')
    .order('lastname');
  if (error) { console.error('fetchAuthors:', error); return []; }
  return data.map(r => ({
    id:          r.authorid,
    firstName:   r.firstname,
    lastName:    r.lastname,
    nationality: r.nationality,
    birthYear:   r.birthyear,
  }));
}

async function insertAuthor(authorData) {
  const { data, error } = await supabaseClient
    .from('authors')
    .insert([{
      firstname:   authorData.firstName,
      lastname:    authorData.lastName,
      nationality: authorData.nationality,
      birthyear:   authorData.birthYear,
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...authorData, id: data.authorid };
}

async function updateAuthor(authorId, authorData) {
  const { error } = await supabaseClient
    .from('authors')
    .update({
      firstname:   authorData.firstName,
      lastname:    authorData.lastName,
      nationality: authorData.nationality,
      birthyear:   authorData.birthYear,
    })
    .eq('authorid', authorId);
  if (error) throw error;
}

async function deleteAuthorById(authorId) {
  const { error } = await supabaseClient
    .from('authors')
    .delete()
    .eq('authorid', authorId);
  if (error) throw error;
}

/* ── BOOKS ── */
async function fetchBooks() {
  const { data, error } = await supabaseClient
    .from('books')
    .select('bookid, isbn, title, categoryid, authorid, publisher, publishyear, edition, totalcopies')
    .order('bookid');
  if (error) { console.error('fetchBooks:', error); return []; }
  return data.map(r => ({
    id:          r.bookid,
    isbn:        r.isbn,
    title:       r.title,
    categoryId:  r.categoryid,
    authorId:    r.authorid,
    publisher:   r.publisher,
    publishYear: r.publishyear,
    edition:     r.edition,
    totalCopies: r.totalcopies,
  }));
}

async function insertBook(bookData) {
  const { data, error } = await supabaseClient
    .from('books')
    .insert([{
      isbn:        bookData.isbn,
      title:       bookData.title,
      categoryid:  bookData.categoryId,
      authorid:    bookData.authorId,
      publisher:   bookData.publisher,
      publishyear: bookData.publishYear,
      edition:     bookData.edition,
      totalcopies: bookData.totalCopies,
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...bookData, id: data.bookid };
}

async function updateBook(bookId, bookData) {
  const { error } = await supabaseClient
    .from('books')
    .update({
      isbn:        bookData.isbn,
      title:       bookData.title,
      categoryid:  bookData.categoryId,
      authorid:    bookData.authorId,
      publisher:   bookData.publisher,
      publishyear: bookData.publishYear,
      edition:     bookData.edition,
      totalcopies: bookData.totalCopies,
    })
    .eq('bookid', bookId);
  if (error) throw error;
}

async function deleteBookById(bookId) {
  const { error } = await supabaseClient
    .from('books')
    .delete()
    .eq('bookid', bookId);
  if (error) throw error;
}

/* ── MEMBERS ── */
async function fetchMembers() {
  const { data, error } = await supabaseClient
    .from('members')
    .select('memberid, firstname, lastname, email, password, phone, membershiptype, joindate, expirydate, isactive, address')
    .order('memberid');
  if (error) { console.error('fetchMembers:', error); return []; }
  return data.map(r => ({
    id:             r.memberid,
    firstName:      r.firstname,
    lastName:       r.lastname,
    email:          r.email,
    password:       r.password,
    phone:          r.phone        || '',
    membershipType: r.membershiptype,
    joinDate:       r.joindate,
    expiryDate:     r.expirydate,
    isActive:       r.isactive,
    address:        r.address      || '',
  }));
}

async function insertMember(memberData) {
  const { data, error } = await supabaseClient
    .from('members')
    .insert([{
      firstname:      memberData.firstName,
      lastname:       memberData.lastName,
      email:          memberData.email,
      password:       memberData.password,
      phone:          memberData.phone,
      membershiptype: memberData.membershipType,
      joindate:       memberData.joinDate,
      expirydate:     memberData.expiryDate,
      isactive:       memberData.isActive,
      address:        memberData.address,
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...memberData, id: data.memberid };
}

async function updateMember(memberId, memberData) {
  const payload = {};
  if (memberData.firstName      !== undefined) payload.firstname      = memberData.firstName;
  if (memberData.lastName       !== undefined) payload.lastname       = memberData.lastName;
  if (memberData.email          !== undefined) payload.email          = memberData.email;
  if (memberData.phone          !== undefined) payload.phone          = memberData.phone;
  if (memberData.membershipType !== undefined) payload.membershiptype = memberData.membershipType;
  if (memberData.joinDate       !== undefined) payload.joindate       = memberData.joinDate;
  if (memberData.expiryDate     !== undefined) payload.expirydate     = memberData.expiryDate;
  if (memberData.isActive       !== undefined) payload.isactive       = memberData.isActive;
  if (memberData.address        !== undefined) payload.address        = memberData.address;
  if (memberData.password       !== undefined) payload.password       = memberData.password;

  const { error } = await supabaseClient
    .from('members')
    .update(payload)
    .eq('memberid', memberId);
  if (error) throw error;
}

/* ── STAFF ── */
async function fetchStaff() {
  const { data, error } = await supabaseClient
    .from('staff')
    .select('staffid, firstname, lastname, email, role, hiredate')
    .order('staffid');
  if (error) { console.error('fetchStaff:', error); return []; }
  return data.map(r => ({
    id:        r.staffid,
    firstName: r.firstname,
    lastName:  r.lastname,
    email:     r.email,
    role:      r.role,
    hireDate:  r.hiredate,
  }));
}

async function insertStaff(staffData) {
  const { data, error } = await supabaseClient
    .from('staff')
    .insert([{
      firstname: staffData.firstName,
      lastname:  staffData.lastName,
      email:     staffData.email,
      role:      staffData.role,
      hiredate:  staffData.hireDate,
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...staffData, id: data.staffid };
}

async function updateStaff(staffId, staffData) {
  const { error } = await supabaseClient
    .from('staff')
    .update({
      firstname: staffData.firstName,
      lastname:  staffData.lastName,
      email:     staffData.email,
      role:      staffData.role,
      hiredate:  staffData.hireDate,
    })
    .eq('staffid', staffId);
  if (error) throw error;
}

async function deleteStaffById(staffId) {
  const { error } = await supabaseClient
    .from('staff')
    .delete()
    .eq('staffid', staffId);
  if (error) throw error;
}

/* ── LOANS ── */
async function fetchLoans() {
  const { data, error } = await supabaseClient
    .from('loans')
    .select('loanid, bookid, memberid, staffid, loandate, duedate, returndate, status')
    .order('loanid');
  if (error) { console.error('fetchLoans:', error); return []; }
  return data.map(r => ({
    id:         r.loanid,
    bookId:     r.bookid,
    memberId:   r.memberid,
    staffId:    r.staffid,
    loanDate:   r.loandate,
    dueDate:    r.duedate,
    returnDate: r.returndate,
    status:     r.status,
  }));
}

async function insertLoan(loanData) {
  const { data, error } = await supabaseClient
    .from('loans')
    .insert([{
      bookid:     loanData.bookId,
      memberid:   loanData.memberId,
      staffid:    loanData.staffId,
      loandate:   loanData.loanDate,
      duedate:    loanData.dueDate,
      returndate: null,
      status:     'Active',
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...loanData, id: data.loanid, returnDate: null, status: 'Active' };
}

async function updateLoan(loanId, loanData) {
  const payload = {};
  if (loanData.returnDate !== undefined) payload.returndate = loanData.returnDate;
  if (loanData.status     !== undefined) payload.status     = loanData.status;

  const { error } = await supabaseClient
    .from('loans')
    .update(payload)
    .eq('loanid', loanId);
  if (error) throw error;
}

async function deleteLoanById(loanId) {
  const { error } = await supabaseClient
    .from('loans')
    .delete()
    .eq('loanid', loanId);
  if (error) throw error;
}

/* ── RESERVATIONS ── */
async function fetchReservations() {
  const { data, error } = await supabaseClient
    .from('reservations')
    .select('reservationid, bookid, memberid, reservationdate, expirydate, status')
    .order('reservationid');
  if (error) { console.error('fetchReservations:', error); return []; }
  return data.map(r => ({
    id:              r.reservationid,
    bookId:          r.bookid,
    memberId:        r.memberid,
    reservationDate: r.reservationdate,
    expiryDate:      r.expirydate,
    status:          r.status,
  }));
}

async function insertReservation(resData) {
  const { data, error } = await supabaseClient
    .from('reservations')
    .insert([{
      bookid:          resData.bookId,
      memberid:        resData.memberId,
      reservationdate: resData.reservationDate,
      expirydate:      resData.expiryDate,
      status:          'Pending',
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...resData, id: data.reservationid, status: 'Pending' };
}

async function updateReservation(reservationId, resData) {
  const { error } = await supabaseClient
    .from('reservations')
    .update({ status: resData.status })
    .eq('reservationid', reservationId);
  if (error) throw error;
}

/* ── FINES ── */
async function fetchFines() {
  const { data, error } = await supabaseClient
    .from('fines')
    .select('fineid, loanid, amount, reason, ispaid, paiddate')
    .order('fineid');
  if (error) { console.error('fetchFines:', error); return []; }
  return data.map(r => ({
    id:       r.fineid,
    loanId:   r.loanid,
    amount:   parseFloat(r.amount),
    reason:   r.reason,
    isPaid:   r.ispaid,
    paidDate: r.paiddate,
  }));
}

async function insertFine(fineData) {
  const { data, error } = await supabaseClient
    .from('fines')
    .insert([{
      loanid: fineData.loanId,
      amount: fineData.amount,
      reason: fineData.reason,
      ispaid: false,
      paiddate: null,
    }])
    .select()
    .single();
  if (error) throw error;
  return { ...fineData, id: data.fineid, isPaid: false, paidDate: null };
}

async function updateFine(fineId, fineData) {
  const payload = {};
  if (fineData.isPaid   !== undefined) payload.ispaid   = fineData.isPaid;
  if (fineData.paidDate !== undefined) payload.paiddate = fineData.paidDate;

  const { error } = await supabaseClient
    .from('fines')
    .update(payload)
    .eq('fineid', fineId);
  if (error) throw error;
}

/* ── BOOK-AUTHORS (N:M) ── */
async function fetchBookAuthors() {
  const { data, error } = await supabaseClient
    .from('bookauthors')
    .select('bookauthorid, bookid, authorid, role')
    .order('bookauthorid');
  if (error) { console.error('fetchBookAuthors:', error); return []; }
  return data.map(r => ({
    id:       r.bookauthorid,
    bookId:   r.bookid,
    authorId: r.authorid,
    role:     r.role,
  }));
}

/* ── LOAD ALL DATA INTO A LOCAL CACHE ── */
/* db is a plain object that mirrors the old in-memory structure.
   Call loadDatabase() once at startup; call refreshDb() after mutations
   if you need the cache to stay in sync. */
let db = {
  categories:   [],
  authors:      [],
  books:        [],
  bookAuthors:  [],
  members:      [],
  staff:        [],
  loans:        [],
  reservations: [],
  fines:        [],
};

async function loadDatabase() {
  const [
    categories,
    authors,
    books,
    bookAuthors,
    members,
    staff,
    loans,
    reservations,
    fines,
  ] = await Promise.all([
    fetchCategories(),
    fetchAuthors(),
    fetchBooks(),
    fetchBookAuthors(),
    fetchMembers(),
    fetchStaff(),
    fetchLoans(),
    fetchReservations(),
    fetchFines(),
  ]);

  db.categories   = categories;
  db.authors      = authors;
  db.books        = books;
  db.bookAuthors  = bookAuthors;
  db.members      = members;
  db.staff        = staff;
  db.loans        = loans;
  db.reservations = reservations;
  db.fines        = fines;
}
