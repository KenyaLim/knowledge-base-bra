const isModulePage =
    window.location.pathname.includes("/modul/");

const navbarPath = isModulePage
    ? "../navbar.html"
    : "navbar.html";

fetch(navbarPath)
    .then(response => response.text())
    .then(data => {

        document.getElementById("navbar").innerHTML = data;

        const prefix = isModulePage ? "../" : "";

        document.getElementById("homeLink").href =
            prefix + "index.html";

        document.getElementById("homeNav").href =
            prefix + "index.html";

        document.getElementById("aboutNav").href =
            prefix + "index.html#about";

        document.getElementById("moduleNav").href =
            prefix + "index.html#modules";

        document.getElementById("faqNav").href =
            prefix + "index.html#faq";
    });