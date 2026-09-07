const articles = [
    {title:"Cara Membuat Invoice", 
    type:"Panduan", 
    url:"pages/artikel/cara-membuat-invoice.html", 
    keywords:"finance invoice membuat tagihan"},

    {title:"Cara Melihat Laporan Keuangan", 
    type:"Panduan", 
    url:"pages/artikel/cara-melihat-laporan-keuangan.html",
    keywords:"finance laporan keuangan"},

    {title:"Invoice Tidak Muncul", 
    type:"FAQ", 
    url:"pages/artikel/faq-invoice-tidak-muncul.html", 
    keywords:"finance invoice faq tidak muncul"},

    {title:"Transaksi Gagal Disimpan", 
    type:"Troubleshooting", 
    url:"pages/artikel/troubleshooting-transaksi-gagal.html", 
    keywords:"finance error transaksi gagal"},

    {title:"Cara Membuat Purchase Order", 
    type:"Panduan", url:"pages/artikel/cara-membuat-purchase-order.html", 
    keywords:"purchasing purchase order po"},

    {title:"Cara Melihat Stok Barang", 
    type:"Panduan", 
    url:"pages/artikel/cara-melihat-stok.html", 
    keywords:"inventory stok barang persediaan"}
  ];
  
  const input = document.getElementById("searchInput");
  const button = document.getElementById("searchButton");
  const results = document.getElementById("searchResults");
  
  function searchContent(){
    const q = input.value.trim().toLowerCase();
    if(!q){ results.innerHTML = ""; return; }
    const found = articles.filter(a => (a.title+" "+a.type+" "+a.keywords).toLowerCase().includes(q));
    results.innerHTML = found.length
      ? found.map(a => `<a class="result" href="${a.url}"><strong>${a.title}</strong><br><small>${a.type}</small></a>`).join("")
      : `<div class="result">Tidak ada artikel yang ditemukan.</div>`;
  }
  button?.addEventListener("click", searchContent);
  input?.addEventListener("keydown", e => { if(e.key === "Enter") searchContent(); });
  