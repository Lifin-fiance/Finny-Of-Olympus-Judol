// File: /js/component.js
// Deskripsi: Skrip untuk memuat komponen HTML secara dinamis.
// Versi ini secara otomatis menjalankan skrip yang ada di dalam file komponen.

/**
 * Memuat konten dari file HTML ke dalam elemen target dan menjalankan skrip di dalamnya.
 * @param {string} url - Path ke file komponen HTML yang akan dimuat.
 * @param {string} elementId - ID dari elemen div placeholder di mana komponen akan disisipkan.
 */
const loadComponent = (url, elementId) => {
  // Menggunakan fetch API untuk mengambil konten file
  fetch(url)
    .then(response => {
      // Memeriksa apakah request berhasil (status code 200-299)
      if (!response.ok) {
        throw new Error(`Gagal memuat komponen: ${response.statusText}`);
      }
      // Mengembalikan konten sebagai teks (HTML)
      return response.text();
    })
    .then(data => {
      const container = document.getElementById(elementId);
      if (!container) {
        // Jika elemen tidak ditemukan, hentikan proses untuk komponen ini.
        // Ini berguna jika komponen bersifat opsional di beberapa halaman.
        return;
      }
      
      // Masukkan HTML ke dalam container
      container.innerHTML = data;

      // Cari semua tag <script> yang baru saja dimasukkan ke dalam container
      const scripts = container.querySelectorAll("script");
      
      // Jalankan setiap skrip satu per satu
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        
        // Salin konten dari skrip lama ke skrip baru
        newScript.textContent = oldScript.textContent;
        
        // Tambahkan skrip baru ke akhir body agar dieksekusi oleh browser
        document.body.appendChild(newScript);
        
        // Hapus skrip lama dari container agar tidak ada duplikasi
        oldScript.remove();
      });
    })
    .catch(error => {
      // Menampilkan pesan error di console jika terjadi masalah
      console.error(`Terjadi kesalahan saat memuat komponen dari ${url}:`, error);
    });
};

// Menjalankan skrip setelah seluruh konten DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  // --- Konfigurasi Path Komponen ---
  // Sesuaikan path ini berdasarkan struktur folder proyek Anda.
  // Contoh ini mengasumsikan halaman HTML utama berada di root folder.
  const basePath = './components/'; // Ubah jika perlu

  // --- Memuat Komponen ---
  // Muat komponen navbar, footer, dan chatbot ke placeholder masing-masing.
  loadComponent(`${basePath}navbar.html`, 'navbar-container');
  loadComponent(`${basePath}footer-default.html`, 'footer-default');
  loadComponent(`${basePath}navbar-default.html`, 'navbar-default'); // Memanggil komponen chatbot
});
