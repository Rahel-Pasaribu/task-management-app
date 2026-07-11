# Task Management App

Technical Test — Front-End & Back-End Developer Intern @ Moonlay Technologies

Aplikasi task management sederhana: user bisa login, melihat, menambah,
mengedit, menghapus task, mengubah status, dan menentukan assignee dari
setiap task. Dilengkapi bonus fitur AI Chatbot untuk tanya-jawab seputar
data task.

## Tech Stack

| Layer     | Teknologi                                      |
|-----------|-------------------------------------------------|
| Frontend  | Next.js 14 (App Router) + Tailwind CSS           |
| Backend   | Python + FastAPI                                 |
| Database  | PostgreSQL (SQLAlchemy ORM)                       |
| Auth      | JWT (login sederhana, user hardcode/seed)         |
| Bonus     | AI Chatbot (Gemini/OpenAI, dengan fallback rule-based)|

Backend sudah diuji end-to-end (login, CRUD task, ubah status, chatbot)
terhadap PostgreSQL sungguhan sebelum dikumpulkan.

---

## Struktur Folder

```
task-management-app/
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── main.py         # entrypoint, CORS, router registration
│   │   ├── config.py       # environment settings
│   │   ├── database.py     # SQLAlchemy engine & session
│   │   ├── models.py       # model User & Task
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT + password hashing
│   │   ├── seed.py         # seed user & sample task
│   │   └── routers/
│   │       ├── auth.py     # POST /auth/login, GET /auth/me
│   │       ├── users.py    # GET /users
│   │       ├── tasks.py    # CRUD /tasks
│   │       └── chatbot.py  # POST /chatbot/query (bonus)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── page.js          # halaman login
│   │   ├── tasks/page.js    # halaman daftar & kelola task (protected)
│   │   └── layout.js
│   ├── components/          # TaskCard, TaskForm, ChatbotWidget, dll
│   ├── context/AuthContext.js
│   ├── lib/api.js           # wrapper fetch ke backend
│   └── package.json
└── docs/
    ├── schema.sql            # DDL referensi tabel PostgreSQL
    ├── ERD.png / ERD.pdf     # Entity Relationship Diagram
    └── postman_collection.json
```

---

## Cara Menjalankan

### 1. Database (PostgreSQL)

Pastikan PostgreSQL sudah terinstall & berjalan, lalu buat database:

```sql
CREATE DATABASE taskdb;
```

Tabel akan dibuat otomatis oleh backend saat pertama kali start
(`Base.metadata.create_all`), jadi tidak perlu menjalankan `schema.sql`
secara manual — file itu disediakan hanya sebagai referensi/dokumentasi.

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env, sesuaikan DATABASE_URL dengan kredensial PostgreSQL Anda

# seed user & sample task
python -m app.seed

# jalankan server
uvicorn app.main:app --reload --port 8000
```

API berjalan di `http://localhost:8000`. Dokumentasi interaktif otomatis
tersedia di `http://localhost:8000/docs` (Swagger) — di luar Postman
collection yang diminta di soal.

**Akun demo (hasil seed):**

| Username | Password  |
|----------|-----------|
| admin    | admin123  |
| budi     | budi123   |
| sari     | sari123   |

### 3. Frontend (Next.js)

```bash
cd frontend
npm install

cp .env.local.example .env.local
# pastikan NEXT_PUBLIC_API_URL mengarah ke backend, default http://localhost:8000

npm run dev
```

Buka `http://localhost:3000`, login dengan salah satu akun demo di atas.

### 4. Import Postman Collection

Import `docs/postman_collection.json` ke Postman. Jalankan request
**Auth > Login** terlebih dahulu — token JWT otomatis tersimpan ke variabel
collection (`access_token`) via test script, sehingga request lain
(Tasks, Users, Chatbot) otomatis terautentikasi.

---

## Endpoint API

| Method | Endpoint             | Deskripsi                                  | Auth |
|--------|-----------------------|---------------------------------------------|------|
| POST   | /auth/login            | Login, mengembalikan JWT                    | ❌   |
| GET    | /auth/me                | Info user yang sedang login                 | ✅   |
| GET    | /users                  | Daftar seluruh user (untuk dropdown assignee)| ✅   |
| GET    | /tasks                  | Daftar seluruh task (filter opsional)        | ✅   |
| GET    | /tasks/{id}             | Detail satu task                             | ✅   |
| POST   | /tasks                  | Tambah task baru                             | ✅   |
| PUT    | /tasks/{id}             | Edit task                                    | ✅   |
| PATCH  | /tasks/{id}/status      | Ubah status task saja                        | ✅   |
| DELETE | /tasks/{id}             | Hapus task                                   | ✅   |
| POST   | /chatbot/query          | Tanya jawab seputar data task (bonus)        | ✅   |

Semua endpoint ber-auth memerlukan header `Authorization: Bearer <token>`.

---

## Skema Database & ERD

Dua tabel utama: `users` dan `tasks`, relasi one-to-many (satu user bisa
menjadi assignee di banyak task) melalui `tasks.assignee_id -> users.id`.
Lihat `docs/ERD.png`, `docs/ERD.pdf`, atau `docs/schema.sql` untuk detail.

---

## Fitur Bonus: AI Chatbot

Chatbot dapat menjawab pertanyaan seperti:
- "Tampilkan semua task yang statusnya belum selesai"
- "Berapa jumlah task yang sudah selesai?"
- "Tugas apa saja yang deadlinenya hari ini?"
- "Siapa assignee dari task [judul task]?"

**Cara kerja** (pola *Retrieval-Augmented Generation* sederhana):

1. Saat menerima pertanyaan, backend mengambil seluruh data task terbaru
   dari PostgreSQL dan meringkasnya menjadi konteks teks singkat (judul,
   status, deadline, assignee).
2. Konteks + pertanyaan dikirim ke **LLM sungguhan** untuk dijawab dalam
   bahasa natural, dengan urutan prioritas:
   1. **Google Gemini** (`GEMINI_API_KEY`) — model `gemini-2.0-flash`
      secara default. **Direkomendasikan** karena Google menyediakan free
      tier, jadi bisa dicoba tanpa biaya. Dapatkan API key gratis di
      https://aistudio.google.com/apikey.
   2. **OpenAI** (`OPENAI_API_KEY`) — dipakai kalau Gemini key kosong.
      Model `gpt-4o-mini` secara default (berbayar).
   
   Model hanya diberi ringkasan data yang relevan (bukan akses bebas ke
   database) agar jawaban tetap akurat dan tidak berhalusinasi.
3. Jika **kedua API key kosong** (misal saat demo tanpa koneksi internet
   atau belum sempat setup API key), atau panggilan ke LLM gagal (kuota
   habis/koneksi error), backend otomatis **fallback ke mode
   rule-based**: mencocokkan pola kata kunci umum (belum selesai, jumlah
   selesai, deadline hari ini, siapa assignee dari task X) dan menjawab
   langsung dari database tanpa memanggil LLM eksternal. Ini memastikan
   fitur chatbot tetap bisa dicoba end-to-end kapan saja.

**Menjalankan fitur chatbot:**
- **Tanpa API key**: fitur langsung aktif dalam mode rule-based, tidak
  perlu setup tambahan — cukup jalankan backend seperti biasa.
- **Dengan LLM sungguhan (direkomendasikan untuk penilaian)**:
  1. Buat API key gratis di https://aistudio.google.com/apikey
  2. Isi `GEMINI_API_KEY=<key kamu>` di `backend/.env`
  3. Restart backend (`uvicorn app.main:app --reload --port 8000`)
  4. Chatbot sekarang benar-benar memanggil Gemini API untuk menjawab

Widget chatbot muncul sebagai tombol bulat di pojok kanan bawah pada
halaman `/tasks` (lihat `frontend/components/ChatbotWidget.js`).

---

## Catatan & Asumsi

Karena beberapa bagian soal bersifat terbuka ("boleh hardcode user",
"sesuai kebutuhan aplikasi"), berikut asumsi yang saya ambil selama
pengerjaan:

1. **Login "hardcode"** diimplementasikan sebagai user yang di-seed ke
   database (`app/seed.py`) dengan password ter-hash (bcrypt), bukan
   ditulis literal di source code frontend. Ini dipilih supaya autentikasi
   JWT tetap realistis (password benar-benar diverifikasi ke backend),
   sambil tetap sesuai instruksi "boleh hardcode" karena kredensialnya
   sudah ditentukan di awal (admin/admin123, dll — lihat tabel akun
   demo di atas), tidak perlu ada fitur registrasi.
2. **Primary key** tabel menggunakan UUID (bukan auto-increment integer)
   agar lebih aman untuk API publik dan konsisten dengan praktik umum
   di backend modern.
3. **Assignee** dimodelkan sebagai relasi FK ke tabel `users`
   (bukan sekadar string nama bebas), supaya dropdown assignee di
   frontend benar-benar diambil dari endpoint `GET /users` sesuai
   instruksi soal, dan data tetap konsisten (tidak ada typo nama).
4. **Endpoint filter** (`status`, `assignee_id` sebagai query param di
   `GET /tasks`) ditambahkan sebagai pelengkap, di luar requirement wajib,
   untuk mendukung fitur pencarian/filter yang saya buat di frontend.
5. **Endpoint `PATCH /tasks/{id}/status`** ditambahkan terpisah dari
   `PUT /tasks/{id}` supaya perubahan status cepat (dropdown status di
   tiap card) tidak perlu mengirim seluruh field task.
6. **Migrasi database**: untuk kebutuhan technical test ini saya
   menggunakan `Base.metadata.create_all()` (auto create table saat
   startup) alih-alih Alembic migration, demi kemudahan setup penguji.
   Untuk lingkungan produksi sebaiknya menggunakan proper migration tool.
7. **Chatbot** mendukung Google Gemini (punya free tier, direkomendasikan
   untuk demo) dan OpenAI sebagai LLM, dan tetap berfungsi tanpa API key
   berbayar berkat fallback rule-based — supaya penguji tanpa API key
   tetap bisa mencoba fitur bonus ini secara langsung.
8. Frontend `node_modules` dan `.next` sengaja tidak disertakan dalam
   deliverable (mengikuti praktik umum) — jalankan `npm install` terlebih
   dahulu sesuai instruksi di atas.

---

## Kredensial Demo Ringkas

```
Backend:  http://localhost:8000
Frontend: http://localhost:3000

Login:
  admin / admin123
  budi  / budi123
  sari  / sari123
```
