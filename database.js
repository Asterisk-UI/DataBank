/* ============================================================
   database.js — In-memory data store for the Data Bank Library System

   Data sourced from AstralArchiveDB SQL population script.
   ============================================================ */

/* ── ADMINISTRATOR CREDENTIALS ── */
const ADMIN_CREDENTIALS = {
  email:    'admin@lexis.edu',
  password: 'admin123',
};

/* ── NEXT-ID COUNTERS ── */
const nextAvailableId = {
  books:        21,
  authors:      21,
  categories:   21,
  members:      41,
  loans:        21,
  reservations: 21,
  fines:        21,
  staff:        21,
  bookAuthors:  23,
};

/* ── CATEGORIES (20 Records) ── */
const categories = [
  { id:  1, name: 'Fiction'        },
  { id:  2, name: 'Non-Fiction'    },
  { id:  3, name: 'Science'        },
  { id:  4, name: 'Technology'     },
  { id:  5, name: 'History'        },
  { id:  6, name: 'Philosophy'     },
  { id:  7, name: 'Mathematics'    },
  { id:  8, name: 'Business'       },
  { id:  9, name: 'Self-Help'      },
  { id: 10, name: 'Children'       },
  { id: 11, name: 'Mystery'        },
  { id: 12, name: 'Biography'      },
  { id: 13, name: 'Poetry'         },
  { id: 14, name: 'Art'            },
  { id: 15, name: 'Music'          },
  { id: 16, name: 'Travel'         },
  { id: 17, name: 'Health'         },
  { id: 18, name: 'Religion'       },
  { id: 19, name: 'Politics'       },
  { id: 20, name: 'Science Fiction'},
];

/* ── AUTHORS (20 Records) ── */
const authors = [
  { id:  1, firstName: 'George',     lastName: 'Orwell',          nationality: 'British',    birthYear: 1903 },
  { id:  2, firstName: 'J.K.',       lastName: 'Rowling',         nationality: 'British',    birthYear: 1965 },
  { id:  3, firstName: 'Stephen',    lastName: 'Hawking',         nationality: 'British',    birthYear: 1942 },
  { id:  4, firstName: 'Yuval Noah', lastName: 'Harari',          nationality: 'Israeli',    birthYear: 1976 },
  { id:  5, firstName: 'J.R.R.',     lastName: 'Tolkien',         nationality: 'British',    birthYear: 1892 },
  { id:  6, firstName: 'Himeko',     lastName: 'Murata',          nationality: 'Japanese',   birthYear: 1995 },
  { id:  7, firstName: 'Welt',       lastName: 'Yang',            nationality: 'German',     birthYear: 1950 },
  { id:  8, firstName: 'Dan',        lastName: 'Heng',            nationality: 'Chinese',    birthYear: 1998 },
  { id:  9, firstName: 'March',      lastName: 'Seventh',         nationality: 'Unknown',    birthYear: 2005 },
  { id: 10, firstName: 'Kafka',      lastName: 'Stelle',          nationality: 'Italian',    birthYear: 1988 },
  { id: 11, firstName: 'Isaac',      lastName: 'Asimov',          nationality: 'Russian',    birthYear: 1920 },
  { id: 12, firstName: 'Agatha',     lastName: 'Christie',        nationality: 'British',    birthYear: 1890 },
  { id: 13, firstName: 'Ernest',     lastName: 'Hemingway',       nationality: 'American',   birthYear: 1899 },
  { id: 14, firstName: 'Mark',       lastName: 'Twain',           nationality: 'American',   birthYear: 1835 },
  { id: 15, firstName: 'Fyodor',     lastName: 'Dostoevsky',      nationality: 'Russian',    birthYear: 1821 },
  { id: 16, firstName: 'Leo',        lastName: 'Tolstoy',         nationality: 'Russian',    birthYear: 1828 },
  { id: 17, firstName: 'Virginia',   lastName: 'Woolf',           nationality: 'British',    birthYear: 1882 },
  { id: 18, firstName: 'James',      lastName: 'Joyce',           nationality: 'Irish',      birthYear: 1882 },
  { id: 19, firstName: 'Gabriel',    lastName: 'Garcia Marquez',  nationality: 'Colombian',  birthYear: 1927 },
  { id: 20, firstName: 'Haruki',     lastName: 'Murakami',        nationality: 'Japanese',   birthYear: 1949 },
];

/* ── BOOKS (20 Records) ── */
const books = [
  { id:  1, isbn: '978-0451524935', title: '1984',                              categoryId:  1, authorId:  1, publisher: 'Signet Classic',   publishYear: 1949, edition: 1, totalCopies: 5 },
  { id:  2, isbn: '978-0439708180', title: 'Harry Potter',                      categoryId:  1, authorId:  2, publisher: 'Scholastic',        publishYear: 1997, edition: 1, totalCopies: 8 },
  { id:  3, isbn: '978-0553380163', title: 'A Brief History of Time',           categoryId:  3, authorId:  3, publisher: 'Bantam Books',       publishYear: 1988, edition: 1, totalCopies: 3 },
  { id:  4, isbn: '978-0062316097', title: 'Sapiens',                           categoryId:  5, authorId:  4, publisher: 'Harper',             publishYear: 2011, edition: 1, totalCopies: 4 },
  { id:  5, isbn: '978-0544003415', title: 'The Lord of the Rings',             categoryId: 20, authorId:  5, publisher: 'Mariner Books',      publishYear: 1954, edition: 1, totalCopies: 6 },
  { id:  6, isbn: '978-1234567890', title: 'Star Rail Chronicles',              categoryId:  4, authorId:  6, publisher: 'Astral Press',        publishYear: 2023, edition: 1, totalCopies: 2 },
  { id:  7, isbn: '978-0987654321', title: 'Void Archives',                     categoryId:  6, authorId:  7, publisher: 'St. Fountain',        publishYear: 2021, edition: 1, totalCopies: 1 },
  { id:  8, isbn: '978-1111222233', title: 'Cloud Knight Records',              categoryId:  5, authorId:  8, publisher: 'Luofu Publishing',    publishYear: 2022, edition: 1, totalCopies: 5 },
  { id:  9, isbn: '978-4444555566', title: 'Memories of Six Phases',            categoryId: 11, authorId:  9, publisher: 'Express Media',       publishYear: 2024, edition: 1, totalCopies: 3 },
  { id: 10, isbn: '978-7777888899', title: 'The Stellaron Crisis',              categoryId: 20, authorId: 10, publisher: 'Hunter House',        publishYear: 2020, edition: 1, totalCopies: 2 },
  { id: 11, isbn: '978-0553293357', title: 'Foundation',                        categoryId: 20, authorId: 11, publisher: 'Spectra',             publishYear: 1951, edition: 1, totalCopies: 4 },
  { id: 12, isbn: '978-0007119318', title: 'Murder on the Orient Express',      categoryId: 11, authorId: 12, publisher: 'HarperCollins',       publishYear: 1934, edition: 1, totalCopies: 7 },
  { id: 13, isbn: '978-0684801223', title: 'The Old Man and the Sea',           categoryId:  1, authorId: 13, publisher: 'Scribner',            publishYear: 1952, edition: 1, totalCopies: 4 },
  { id: 14, isbn: '978-0143039433', title: 'The Adventures of Tom Sawyer',      categoryId:  1, authorId: 14, publisher: 'Penguin Classics',    publishYear: 1876, edition: 1, totalCopies: 5 },
  { id: 15, isbn: '978-0140449136', title: 'Crime and Punishment',              categoryId:  1, authorId: 15, publisher: 'Penguin',             publishYear: 1866, edition: 1, totalCopies: 3 },
  { id: 16, isbn: '978-0140447934', title: 'War and Peace',                     categoryId:  1, authorId: 16, publisher: 'Penguin Classics',    publishYear: 1869, edition: 1, totalCopies: 2 },
  { id: 17, isbn: '978-0156628709', title: 'Mrs Dalloway',                      categoryId:  1, authorId: 17, publisher: 'Harcourt',            publishYear: 1925, edition: 1, totalCopies: 4 },
  { id: 18, isbn: '978-0141182803', title: 'Ulysses',                           categoryId:  1, authorId: 18, publisher: 'Penguin',             publishYear: 1922, edition: 1, totalCopies: 2 },
  { id: 19, isbn: '978-0060883287', title: 'One Hundred Years of Solitude',     categoryId:  1, authorId: 19, publisher: 'Harper Perennial',    publishYear: 1967, edition: 1, totalCopies: 5 },
  { id: 20, isbn: '978-1400079278', title: 'Kafka on the Shore',                categoryId:  1, authorId: 20, publisher: 'Vintage',             publishYear: 2002, edition: 1, totalCopies: 4 },
];

/* ── MEMBERS (40 Records) ── */
const members = [
  { id:  1, firstName: 'Jolina',      lastName: 'Acdan',      email: 'jolinamaejose.acdan@plv.edu.ph',           password: 'pass3',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  2, firstName: 'Justine',     lastName: 'Alamer',     email: 'justinedesengano.alamer@plv.edu.ph',       password: 'pass4',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  3, firstName: 'Neille',      lastName: 'Alberto',    email: 'neillearghie.alberto@plv.edu.ph',          password: 'pass5',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  4, firstName: 'Vince',       lastName: 'Atalio',     email: 'vinceehrl.atalio@plv.edu.ph',              password: 'pass6',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  5, firstName: 'Carl',        lastName: 'Asuliz',     email: 'carljoshua.asuliz@plv.edu.ph',             password: 'pass7',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  6, firstName: 'Jerriel',     lastName: 'Barcoma',    email: 'jerriel.barcoma@plv.edu.ph',               password: 'pass8',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  7, firstName: 'John',        lastName: 'Berba',      email: 'johnandrei.berba@plv.edu.ph',              password: 'pass9',  phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  8, firstName: 'Jedidiah',    lastName: 'Bernardo',   email: 'jedidiahdaniel.bernardo@plv.edu.ph',       password: 'pass10', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id:  9, firstName: 'Serg',        lastName: 'Bravo',      email: 'sergraye.bravo@plv.edu.ph',                password: 'pass11', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 10, firstName: 'Justin',      lastName: 'Canilao',    email: 'justinrain.canilao@plv.edu.ph',            password: 'pass12', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 11, firstName: 'Lord',        lastName: 'Casimiro',   email: 'lordrandall.casimiro@plv.edu.ph',          password: 'pass13', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 12, firstName: 'Phoebe',      lastName: 'Damaso',     email: 'phoebekate.damaso@plv.edu.ph',             password: 'pass14', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 13, firstName: 'Rafael',      lastName: 'Danganan',   email: 'rafaelmariano.danganan@plv.edu.ph',        password: 'pass15', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 14, firstName: 'Adrian',      lastName: 'De Vera',    email: 'adrian.devera@plv.edu.ph',                 password: 'pass16', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 15, firstName: 'David',       lastName: 'Dela Cruz',  email: 'davidalan.delacruz@plv.edu.ph',            password: 'pass17', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 16, firstName: 'Christian',   lastName: 'Deyro',      email: 'christianluis.deyro@plv.edu.ph',           password: 'pass18', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 17, firstName: 'Carl',        lastName: 'Espino',     email: 'carljustin.espino@plv.edu.ph',             password: 'pass19', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 18, firstName: 'Jan',         lastName: 'Espiritu',   email: 'janmarc.espiritu@plv.edu.ph',              password: 'pass20', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 19, firstName: 'John',        lastName: 'Gavino',     email: 'johnmark.gavino@plv.edu.ph',               password: 'pass21', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 20, firstName: 'Mig',         lastName: 'Juliano',    email: 'migcedrik.juliano@plv.edu.ph',             password: 'pass22', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 21, firstName: 'Lawrence',    lastName: 'Literatus',  email: 'lawrence.literatus@plv.edu.ph',            password: 'pass23', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 22, firstName: 'Reymark',     lastName: 'Magsipoc',   email: 'reymark.magsipoc@plv.edu.ph',              password: 'pass24', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 23, firstName: 'Sean',        lastName: 'Malaque',    email: 'seankendrick.malaque@plv.edu.ph',          password: 'pass25', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 24, firstName: 'Raven',       lastName: 'Malate',     email: 'ravenshane.malate@plv.edu.ph',             password: 'pass26', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 25, firstName: 'John',        lastName: 'Mauricio',   email: 'johncarl.mauricio@plv.edu.ph',             password: 'pass27', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 26, firstName: 'Rafael',      lastName: 'Medina',     email: 'rafaelluis.medina@plv.edu.ph',             password: 'pass28', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 27, firstName: 'Margarette',  lastName: 'Mello',      email: 'margarettejem.mello@plv.edu.ph',           password: 'pass29', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 28, firstName: 'Jhaelord',    lastName: 'Obugan',     email: 'jhaelordlaurence.obugan@plv.edu.ph',       password: 'pass30', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 29, firstName: 'Jester',      lastName: 'Pascual',    email: 'jestershane.pascual@plv.edu.ph',           password: 'pass31', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 30, firstName: 'Rizalyn',     lastName: 'Rapada',     email: 'rizalyncristelle.rapada@plv.edu.ph',       password: 'pass32', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 31, firstName: 'Robert',      lastName: 'Ravillas',   email: 'robertryan.ravillas@plv.edu.ph',           password: 'pass33', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 32, firstName: 'Danya',       lastName: 'Raymundo',   email: 'danyacharisse.raymundo@plv.edu.ph',        password: 'pass34', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 33, firstName: 'Jake',        lastName: 'Rivera',     email: 'jake.rivera@plv.edu.ph',                   password: 'pass35', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 34, firstName: 'Koby',        lastName: 'Sales',      email: 'konybrian.sales@plv.edu.ph',               password: 'pass36', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 35, firstName: 'Irish',       lastName: 'Sanchez',    email: 'irish.sanchez@plv.edu.ph',                 password: 'pass37', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 36, firstName: 'Maxell',      lastName: 'Sanchez',    email: 'maxell.sanchez@plv.edu.ph',                password: 'pass38', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 37, firstName: 'Kysiah',      lastName: 'Sevilla',    email: 'kysiah.samera@plv.edu.ph',                 password: 'pass39', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 38, firstName: 'John',        lastName: 'Sinlao',     email: 'johnrey.falcotelo@plv.edu.ph',             password: 'pass40', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 39, firstName: 'Clarenz',     lastName: 'Vergaño',    email: 'clarenzvonkenneth.vergano@plv.edu.ph',     password: 'pass41', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
  { id: 40, firstName: 'Kenneth',     lastName: 'Ycot',       email: 'kenneth.priela@plv.edu.ph',                password: 'pass42', phone: '', membershipType: 'Student', joinDate: '2025-01-10', expiryDate: '2027-01-10', isActive: true,  address: '' },
];

/* ── STAFF (20 Records) ── */
const staff = [
  { id:  1, firstName: 'Caelus',   lastName: 'Trailblazer', email: 'caelus@astral.edu',   role: 'Admin',          hireDate: '2024-05-01' },
  { id:  2, firstName: 'Stelle',   lastName: 'Trailblazer', email: 'stelle@astral.edu',   role: 'Librarian',      hireDate: '2024-05-02' },
  { id:  3, firstName: 'Pom-Pom',  lastName: 'Conductor',   email: 'pompom@astral.edu',   role: 'Manager',        hireDate: '2024-01-01' },
  { id:  4, firstName: 'Arlan',    lastName: 'Security',    email: 'arlan@herta.edu',     role: 'IT Support',     hireDate: '2024-06-10' },
  { id:  5, firstName: 'Asta',     lastName: 'Lead',        email: 'asta@herta.edu',      role: 'Head Librarian', hireDate: '2024-06-11' },
  { id:  6, firstName: 'Robert',   lastName: 'Staff1',      email: 'r1@astral.edu',       role: 'Librarian',      hireDate: '2025-01-01' },
  { id:  7, firstName: 'Susan',    lastName: 'Staff2',      email: 's2@astral.edu',       role: 'Assistant',      hireDate: '2025-01-05' },
  { id:  8, firstName: 'Michael',  lastName: 'Staff3',      email: 'm3@astral.edu',       role: 'Librarian',      hireDate: '2025-01-10' },
  { id:  9, firstName: 'Sarah',    lastName: 'Staff4',      email: 's4@astral.edu',       role: 'Librarian',      hireDate: '2025-01-15' },
  { id: 10, firstName: 'David',    lastName: 'Staff5',      email: 'd5@astral.edu',       role: 'Assistant',      hireDate: '2025-01-20' },
  { id: 11, firstName: 'Emma',     lastName: 'Staff6',      email: 'e6@astral.edu',       role: 'Librarian',      hireDate: '2025-02-01' },
  { id: 12, firstName: 'James',    lastName: 'Staff7',      email: 'j7@astral.edu',       role: 'Admin',          hireDate: '2025-02-05' },
  { id: 13, firstName: 'Linda',    lastName: 'Staff8',      email: 'l8@astral.edu',       role: 'Assistant',      hireDate: '2025-02-10' },
  { id: 14, firstName: 'Joseph',   lastName: 'Staff9',      email: 'j9@astral.edu',       role: 'Librarian',      hireDate: '2025-02-15' },
  { id: 15, firstName: 'Karen',    lastName: 'Staff10',     email: 'k10@astral.edu',      role: 'Assistant',      hireDate: '2025-02-20' },
  { id: 16, firstName: 'Nancy',    lastName: 'Staff11',     email: 'n11@astral.edu',      role: 'Librarian',      hireDate: '2025-03-01' },
  { id: 17, firstName: 'George',   lastName: 'Staff12',     email: 'g12@astral.edu',      role: 'Assistant',      hireDate: '2025-03-05' },
  { id: 18, firstName: 'Betty',    lastName: 'Staff13',     email: 'b13@astral.edu',      role: 'Librarian',      hireDate: '2025-03-10' },
  { id: 19, firstName: 'Donald',   lastName: 'Staff14',     email: 'd14@astral.edu',      role: 'Assistant',      hireDate: '2025-03-15' },
  { id: 20, firstName: 'Dorothy',  lastName: 'Staff15',     email: 'd15@astral.edu',      role: 'Librarian',      hireDate: '2025-03-20' },
];

/* ── LOANS (20 Records) ── */
const loans = [
  { id:  1, bookId:  1, memberId:  1, staffId: 2, loanDate: '2025-04-01', dueDate: '2025-04-15', returnDate: '2025-04-14', status: 'Returned' },
  { id:  2, bookId:  2, memberId:  2, staffId: 2, loanDate: '2025-04-05', dueDate: '2025-04-19', returnDate: '2025-04-20', status: 'Returned' },
  { id:  3, bookId:  3, memberId:  3, staffId: 2, loanDate: '2025-04-10', dueDate: '2025-04-24', returnDate: null,         status: 'Active'   },
  { id:  4, bookId:  4, memberId:  4, staffId: 2, loanDate: '2025-04-12', dueDate: '2025-04-26', returnDate: null,         status: 'Active'   },
  { id:  5, bookId:  5, memberId:  5, staffId: 2, loanDate: '2025-04-15', dueDate: '2025-04-29', returnDate: null,         status: 'Active'   },
  { id:  6, bookId:  6, memberId:  6, staffId: 2, loanDate: '2025-04-18', dueDate: '2025-05-02', returnDate: '2025-04-30', status: 'Returned' },
  { id:  7, bookId:  7, memberId:  7, staffId: 2, loanDate: '2025-04-20', dueDate: '2025-05-04', returnDate: null,         status: 'Overdue'  },
  { id:  8, bookId:  8, memberId:  8, staffId: 2, loanDate: '2025-04-22', dueDate: '2025-05-06', returnDate: null,         status: 'Active'   },
  { id:  9, bookId:  9, memberId:  9, staffId: 2, loanDate: '2025-04-25', dueDate: '2025-05-09', returnDate: null,         status: 'Active'   },
  { id: 10, bookId: 10, memberId: 10, staffId: 2, loanDate: '2025-04-28', dueDate: '2025-05-12', returnDate: null,         status: 'Active'   },
  { id: 11, bookId: 11, memberId: 11, staffId: 2, loanDate: '2025-05-01', dueDate: '2025-05-15', returnDate: null,         status: 'Active'   },
  { id: 12, bookId: 12, memberId: 12, staffId: 2, loanDate: '2025-05-02', dueDate: '2025-05-16', returnDate: null,         status: 'Active'   },
  { id: 13, bookId: 13, memberId: 13, staffId: 2, loanDate: '2025-05-03', dueDate: '2025-05-17', returnDate: null,         status: 'Active'   },
  { id: 14, bookId: 14, memberId: 14, staffId: 2, loanDate: '2025-05-04', dueDate: '2025-05-18', returnDate: null,         status: 'Active'   },
  { id: 15, bookId: 15, memberId: 15, staffId: 2, loanDate: '2025-05-05', dueDate: '2025-05-19', returnDate: null,         status: 'Active'   },
  { id: 16, bookId: 16, memberId: 16, staffId: 2, loanDate: '2025-05-05', dueDate: '2025-05-19', returnDate: null,         status: 'Active'   },
  { id: 17, bookId: 17, memberId: 17, staffId: 2, loanDate: '2025-05-06', dueDate: '2025-05-20', returnDate: null,         status: 'Active'   },
  { id: 18, bookId: 18, memberId: 18, staffId: 2, loanDate: '2025-05-06', dueDate: '2025-05-20', returnDate: null,         status: 'Active'   },
  { id: 19, bookId: 19, memberId: 19, staffId: 2, loanDate: '2025-05-07', dueDate: '2025-05-21', returnDate: null,         status: 'Active'   },
  { id: 20, bookId: 20, memberId: 20, staffId: 2, loanDate: '2025-05-07', dueDate: '2025-05-21', returnDate: null,         status: 'Active'   },
];

/* ── RESERVATIONS (20 Records) ── */
const reservations = [
  { id:  1, bookId:  1, memberId:  2, reservationDate: '2025-05-01', expiryDate: '2025-05-08', status: 'Pending' },
  { id:  2, bookId:  5, memberId: 10, reservationDate: '2025-05-02', expiryDate: '2025-05-09', status: 'Pending' },
  { id:  3, bookId:  3, memberId:  1, reservationDate: '2025-05-03', expiryDate: '2025-05-10', status: 'Pending' },
  { id:  4, bookId:  8, memberId:  4, reservationDate: '2025-05-04', expiryDate: '2025-05-11', status: 'Pending' },
  { id:  5, bookId: 12, memberId:  7, reservationDate: '2025-05-05', expiryDate: '2025-05-12', status: 'Pending' },
  { id:  6, bookId: 15, memberId:  9, reservationDate: '2025-05-06', expiryDate: '2025-05-13', status: 'Pending' },
  { id:  7, bookId: 18, memberId:  3, reservationDate: '2025-05-06', expiryDate: '2025-05-13', status: 'Pending' },
  { id:  8, bookId: 20, memberId: 11, reservationDate: '2025-05-07', expiryDate: '2025-05-14', status: 'Pending' },
  { id:  9, bookId:  2, memberId: 13, reservationDate: '2025-05-07', expiryDate: '2025-05-14', status: 'Pending' },
  { id: 10, bookId:  4, memberId: 15, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 11, bookId:  6, memberId: 17, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 12, bookId:  7, memberId: 19, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 13, bookId:  9, memberId:  2, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 14, bookId: 11, memberId:  4, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 15, bookId: 13, memberId:  6, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 16, bookId: 14, memberId:  8, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 17, bookId: 16, memberId: 10, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 18, bookId: 17, memberId: 12, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 19, bookId: 19, memberId: 14, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
  { id: 20, bookId: 10, memberId: 16, reservationDate: '2025-05-08', expiryDate: '2025-05-15', status: 'Pending' },
];

/* ── FINES (20 Records) ── */
const fines = [
  { id:  1, loanId:  1, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: '2025-04-15' },
  { id:  2, loanId:  2, amount:  5.00, reason: 'Late return',       isPaid: true,  paidDate: '2025-04-22' },
  { id:  3, loanId:  7, amount: 25.50, reason: 'Overdue - 7 days',  isPaid: false, paidDate: null         },
  { id:  4, loanId:  6, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: '2025-05-01' },
  { id:  5, loanId:  3, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id:  6, loanId:  4, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id:  7, loanId:  5, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id:  8, loanId:  8, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id:  9, loanId:  9, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 10, loanId: 10, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 11, loanId: 11, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 12, loanId: 12, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 13, loanId: 13, amount: 10.00, reason: 'Damaged cover',     isPaid: false, paidDate: null         },
  { id: 14, loanId: 14, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 15, loanId: 15, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 16, loanId: 16, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 17, loanId: 17, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 18, loanId: 18, amount: 15.00, reason: 'Late return',       isPaid: false, paidDate: null         },
  { id: 19, loanId: 19, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
  { id: 20, loanId: 20, amount:  0.00, reason: 'N/A',              isPaid: true,  paidDate: null         },
];

/* ── BOOK-AUTHORS (N:M bridge — 22 Records) ── */
const bookAuthors = [
  { id:  1, bookId:  1, authorId:  1, role: 'Primary'   }, // 1984 → Orwell
  { id:  2, bookId:  2, authorId:  2, role: 'Primary'   }, // Harry Potter → Rowling
  { id:  3, bookId:  3, authorId:  3, role: 'Primary'   }, // A Brief History of Time → Hawking
  { id:  4, bookId:  4, authorId:  4, role: 'Primary'   }, // Sapiens → Harari
  { id:  5, bookId:  5, authorId:  5, role: 'Primary'   }, // The Lord of the Rings → Tolkien
  { id:  6, bookId:  6, authorId:  6, role: 'Primary'   }, // Star Rail Chronicles → Murata
  { id:  7, bookId:  6, authorId:  7, role: 'Co-Author' }, // Star Rail Chronicles → Yang
  { id:  8, bookId:  7, authorId:  7, role: 'Primary'   }, // Void Archives → Yang
  { id:  9, bookId:  8, authorId:  8, role: 'Primary'   }, // Cloud Knight Records → Dan Heng
  { id: 10, bookId:  9, authorId:  9, role: 'Primary'   }, // Memories of Six Phases → March
  { id: 11, bookId:  9, authorId: 10, role: 'Co-Author' }, // Memories of Six Phases → Stelle
  { id: 12, bookId: 10, authorId: 10, role: 'Primary'   }, // The Stellaron Crisis → Stelle
  { id: 13, bookId: 11, authorId: 11, role: 'Primary'   }, // Foundation → Asimov
  { id: 14, bookId: 12, authorId: 12, role: 'Primary'   }, // Murder on the Orient Express → Christie
  { id: 15, bookId: 13, authorId: 13, role: 'Primary'   }, // The Old Man and the Sea → Hemingway
  { id: 16, bookId: 14, authorId: 14, role: 'Primary'   }, // The Adventures of Tom Sawyer → Twain
  { id: 17, bookId: 15, authorId: 15, role: 'Primary'   }, // Crime and Punishment → Dostoevsky
  { id: 18, bookId: 16, authorId: 16, role: 'Primary'   }, // War and Peace → Tolstoy
  { id: 19, bookId: 17, authorId: 17, role: 'Primary'   }, // Mrs Dalloway → Woolf
  { id: 20, bookId: 18, authorId: 18, role: 'Primary'   }, // Ulysses → Joyce
  { id: 21, bookId: 19, authorId: 19, role: 'Primary'   }, // One Hundred Years of Solitude → Garcia Marquez
  { id: 22, bookId: 20, authorId: 20, role: 'Primary'   }, // Kafka on the Shore → Murakami
];

/* ── DATABASE BUNDLE ── */
let db = {
  nextAvailableId,
  categories,
  authors,
  books,
  bookAuthors,
  members,
  staff,
  loans,
  reservations,
  fines,
};

// Local storage initialization
if (typeof localStorage !== 'undefined') {
  const storedDb = localStorage.getItem('library_db');
  if (storedDb) {
    try {
      db = JSON.parse(storedDb);
    } catch (e) {
      console.error('Failed to parse database from local storage', e);
      localStorage.setItem('library_db', JSON.stringify(db));
    }
  } else {
    localStorage.setItem('library_db', JSON.stringify(db));
  }
}

// Global save function
function saveDatabase() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('library_db', JSON.stringify(db));
  }
}