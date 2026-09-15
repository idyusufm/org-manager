# Si Maqom — Aplikasi Pengelola Makam

Aplikasi web untuk pengurus makam (hingga ~20 pengguna) mengelola:
- **Kas** — catatan pemasukan/pengeluaran dengan saldo otomatis, bisa diedit dan dihapus
- **Agenda** — kegiatan harian dan acara, dengan kategori dan penanggung jawab (dipilih dari daftar pengurus)
- **Pengurus** — struktur organisasi (nama, jabatan, no. HP) dan daftar tugas
- **Profil** — nama tampilan pengguna

Dibangun dengan React + Vite, Firebase (Auth + Firestore) untuk data, dan di-deploy gratis di GitHub Pages lewat GitHub Actions.

---

## Cara login & persetujuan akun

Tidak ada pendaftaran terbuka. Siapa pun bisa masuk dengan **Google** atau **email/kata sandi**, tapi mereka baru bisa mengakses data setelah **disetujui admin**:

1. Pengguna baru masuk (Google atau email) → sistem otomatis membuat kode verifikasi 6 digit dan menampilkan layar "Menunggu Persetujuan"
2. Admin membuka menu ☰ → **Persetujuan Akun**, melihat daftar permintaan beserta kodenya
3. Admin bisa:
   - Tekan **✅** untuk langsung menyetujui, atau
   - Membagikan kode ke pengguna lewat WhatsApp/chat lain, lalu pengguna memasukkan kode itu sendiri
4. Setelah disetujui, email masuk ke koleksi `allowedEmails` dan pengguna langsung bisa memakai aplikasi

Yang bisa menjadi **admin** (bisa melihat & menyetujui permintaan) adalah akun yang punya field `admin: true` pada dokumennya di koleksi `allowedEmails`.

---

## 1. Membuat proyek Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → beri nama (mis. `simakam`) → selesaikan setup.
2. Klik ikon web (`</>`) untuk mendaftarkan web app → catat nilai `firebaseConfig` yang muncul (dipakai di langkah 2).
3. **Build → Authentication → Get started** → aktifkan dua metode sign-in:
   - **Email/Password**
   - **Google**
4. **Authentication → Settings → Authorized domains** → tambahkan domain tempat app di-hosting (mis. `namamu.github.io`, dan domain kustom jika ada).
5. **Build → Firestore Database → Create database** → mode production, pilih region terdekat.
6. Buka tab **Rules**, ganti isinya dengan konfigurasi di bawah, lalu **Publish**.

### Menjadikan akunmu sendiri sebagai admin
Di **Firestore Database → Data**, buat koleksi `allowedEmails` (jika belum ada), lalu buat dokumen dengan:
- **Document ID** = emailmu, huruf kecil semua (mis. `namamu@gmail.com`)
- Tambahkan field `admin` bertipe **boolean** = `true`

### Firestore Rules

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

function isAllowed() {
  return request.auth != null &&
    request.auth.token.email != null &&
    exists(/databases/$(database)/documents/allowedEmails/$(request.auth.token.email));
}

function isAdmin() {
  return isAllowed() &&
    get(/databases/$(database)/documents/allowedEmails/$(request.auth.token.email)).data.admin == true;
}

match /allowedEmails/{email} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
  allow create: if request.auth != null &&
    request.auth.token.email == email &&
    exists(/databases/$(database)/documents/pendingApprovals/$(email)) &&
    request.resource.data.code == get(/databases/$(database)/documents/pendingApprovals/$(email)).data.code;
}

match /pendingApprovals/{email} {
  allow create: if request.auth != null && request.auth.token.email == email;
  allow read: if isAdmin();
  allow delete: if isAdmin();
  allow update: if false;
}

match /transactions/{id} { allow read, write: if isAllowed(); }
match /events/{id}       { allow read, write: if isAllowed(); }
match /members/{id}      { allow read, write: if isAllowed(); }
match /tasks/{id}        { allow read, write: if isAllowed(); }

}
}


---

## 2. Menjalankan di komputer lokal (opsional)

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari `firebaseConfig`:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...


```bash
npm run dev       # server lokal
npm run build      # build produksi ke /dist
npm run preview    # pratinjau hasil build
```

---

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/simaqom.git
git push -u origin main
```

## 4. Menambahkan Firebase config sebagai GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**, tambahkan enam nilai berikut (nama harus persis sama, nilai dari `firebaseConfig`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 5. Mengaktifkan GitHub Pages

Repo → **Settings → Pages** → **Source: GitHub Actions**. Setiap push ke `main` otomatis build & deploy lewat `.github/workflows/deploy.yml`.

Situs akan tersedia di:

https://USERNAME.github.io/simaqom/


### Domain kustom (opsional)
Jika memakai subdomain gratis (mis. dari DigitalPlat FreeDomain atau is-a.dev):
1. Arahkan DNS subdomain tersebut (CNAME) ke `USERNAME.github.io`
2. Repo → **Settings → Pages → Custom domain** → masukkan subdomain tersebut
3. Tambahkan file `public/CNAME` berisi subdomain itu saja, commit, agar tetap terpasang setiap kali build ulang
4. Tambahkan subdomain itu ke **Firebase Console → Authentication → Settings → Authorized domains**, jika tidak, login Google akan gagal di domain itu

---

## Struktur data di Firestore

| Koleksi | Field |
|---|---|
| `transactions` | `description`, `amount` (+pemasukan / −pengeluaran), `date`, `createdBy`, `createdAt` |
| `events` | `title`, `category` (Harian/Acara/Lainnya), `pj`, `date`, `createdBy`, `createdAt` |
| `members` | `name`, `role`, `phone` |
| `tasks` | `title`, `owner`, `done`, `createdAt` |
| `allowedEmails` | dokumen per email yang disetujui; field `admin` (boolean, opsional), `code`, `name`, `approvedAt` |
| `pendingApprovals` | dokumen per email yang menunggu; field `code`, `name`, `createdAt` — dihapus otomatis setelah disetujui/ditolak |

Semua koleksi ini otomatis terbentuk saat pertama kali dipakai — tidak perlu dibuat manual, kecuali `allowedEmails` untuk akun admin pertamamu.

---

## Catatan keamanan

- Setiap akun yang disetujui (ada di `allowedEmails`) punya akses penuh baca/tulis ke semua data Kas, Agenda, dan Pengurus. Ini cukup untuk tim kecil yang saling percaya.
- Hanya akun dengan `admin: true` yang bisa melihat kode verifikasi dan menyetujui/menolak permintaan baru.
- Jika ingin membatasi akses lebih detail (mis. hanya bendahara yang bisa mengubah Kas), perlu penyesuaian lebih lanjut di `firestore.rules`.
