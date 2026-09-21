/*
    navbar.js

    File ini menangani:
    1. Navbar
    2. Sidebar
    3. Active page
    4. Accordion sidebar
    5. Mobile sidebar

    Setiap halaman cukup memiliki:
    <div id="navbar"></div>
    <aside id="sidebar"></aside>

    Lalu:
    <script src="../js/navbar.js"></script>
*/

document.addEventListener("DOMContentLoaded", function () {

    const page = document.body.dataset.page || "dashboard";

    const navbarContainer = document.getElementById("navbar");
    const sidebarContainer = document.getElementById("sidebar");

    /*
        Menentukan lokasi root website.

        index.html:
        js/navbar.js -> ../

        erp/purchase/index.html:
        js/navbar.js -> ../../../
    */
    function getRootPath() {
        const path = window.location.pathname;

        const marker = "/erp/";
        const markerIndex = path.indexOf(marker);

        if (markerIndex !== -1) {
            return path.substring(0, markerIndex + 1);
        }

        const gettingStartedMarker = "/getting-started/";
        const gsIndex = path.indexOf(gettingStartedMarker);

        if (gsIndex !== -1) {
            return path.substring(0, gsIndex + 1);
        }

        return "./";
    }

    const ROOT = getRootPath();

    if (navbarContainer) {
        navbarContainer.innerHTML = `
            <header class="top-navbar">

                <div class="navbar-left">

                    <button
                        id="mobile-menu-btn"
                        class="mobile-menu-btn"
                        aria-label="Open navigation"
                    >
                        <i class="ph ph-list"></i>
                    </button>

                    <a href="${ROOT}index.html" class="navbar-logo">

                        <span class="navbar-logo-icon">
                            <i class="ph ph-squares-four"></i>
                        </span>

                        <span>Dashboard</span>

                    </a>

                </div>

                <div class="navbar-right">
                    <div class="navbar-user" aria-live="polite">
                        <i class="ph ph-user-circle"></i>
                        <span id="navbar-user-name">Loading...</span>
                        <span id="navbar-user-email"></span>
                    </div>
                    <form class="navbar-logout-form" action="/api/logout" method="POST">
                        <button type="submit" class="navbar-signin">
                            Logout
                        </button>
                    </form>
                </div>

            </header>
        `;

        fetch("/api/session", { headers: { Accept: "application/json" } })
            .then(function (response) {
                if (!response.ok) throw new Error("Session unavailable");
                return response.json();
            })
            .then(function (session) {
                const nameElement = document.getElementById("navbar-user-name");
                const emailElement = document.getElementById("navbar-user-email");
                const welcomeElement = document.getElementById("welcomeMessage");
                const email = session.email || "";
                const name = session.name || email;

                if (nameElement) nameElement.textContent = name;
                if (emailElement && session.name) emailElement.textContent = email;
                if (welcomeElement) {
                    welcomeElement.textContent = `Welcome, ${email}`;
                }
            })
            .catch(function () {
                const nameElement = document.getElementById("navbar-user-name");
                if (nameElement) nameElement.textContent = "Signed in";
            });

        let idleTimer;
        const logoutForm = document.querySelector(".navbar-logout-form");

        function resetIdleTimer() {
            window.clearTimeout(idleTimer);
            idleTimer = window.setTimeout(function () {
                if (logoutForm) logoutForm.submit();
            }, 30 * 60 * 1000);
        }

        ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(function (eventName) {
            document.addEventListener(eventName, resetIdleTimer, { passive: true });
        });
        resetIdleTimer();
    }

    /*
        =========================
        SIDEBAR DATA
        =========================

        Tambah modul baru cukup di bagian ini.
    */

    const modules = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: "ph-rocket",
            children: [
                // {
                //     title: "Installation",
                //     page: "installation",
                //     url: "getting-started/installation.html"
                // },
                {
                    title: "Quick Configuration",
                    page: "configuration",
                    url: "getting-started/configuration.html"
                },
                {
                    title: "FAQ",
                    page: "Frequently Asked Questions",
                    url: "getting-started/faq.html"
                }
            ]
        },

        {
            id: "stage",
            title: "Order",
            icon: "ph-shopping-cart",
            children: [
                {
                    title: "Overview",
                    page: "stage",
                    url: "erp/stage/index.html"
                },
                {
                    title: "Order",
                    page: "stage-order",
                    url: "erp/stage/order.html"
                },
                {
                    title: "Packing",
                    page: "stage-packing",
                    url: "erp/stage/packing.html"
                }
            ]
        },

        {
            id: "mrp",
            title: "MRP",
            icon: "ph-chart-bar",
            children: [
                {
                    title: "Overview",
                    page: "mrp",
                    url: "erp/mrp/index.html"
                },
                {
                    title: "Material Requirement",
                    page: "mrp-material",
                    url: "erp/mrp/material-requirement.html"
                }
            ]
        },

        {
            id: "purchase",
            title: "Purchase",
            icon: "ph-receipt",
            children: [
                {
                    title: "Overview",
                    page: "purchase",
                    url: "erp/purchase/index.html"
                },
                {
                    title: "Purchase Order",
                    page: "purchase-order",
                    url: "erp/purchase/purchase-order.html"
                },
                {
                    title: "Purchase Material",
                    page: "purchase-material",
                    url: "erp/purchase/purchase-material.html"
                },
                {
                    title: "Goods Receipt",
                    page: "goods-receipt",
                    url: "erp/purchase/goods-receipt.html"
                }
            ]
        },

        {
            id: "inventory",
            title: "Inventory",
            icon: "ph-package",
            children: [
                {
                    title: "Overview",
                    page: "inventory",
                    url: "erp/inventory/index.html"
                },
                {
                    title: "Stock",
                    page: "inventory-stock",
                    url: "erp/inventory/stock.html"
                },
                {
                    title: "Goods Receipt",
                    page: "inventory-grn",
                    url: "erp/inventory/goods-receipt.html"
                }
            ]
        },

        {
            id: "production",
            title: "Production",
            icon: "ph-factory",
            children: [
                {
                    title: "Overview",
                    page: "production",
                    url: "erp/production/index.html"
                },
                {
                    title: "Cutting",
                    page: "production-cutting",
                    url: "erp/production/cutting.html"
                },
                {
                    title: "Sewing",
                    page: "production-sewing",
                    url: "erp/production/sewing.html"
                }
            ]
        },

        {
            id: "shipment",
            title: "Shipment",
            icon: "ph-truck",
            children: [
                {
                    title: "Overview",
                    page: "shipment",
                    url: "erp/shipment/index.html"
                },
                {
                    title: "Packing",
                    page: "shipment-packing",
                    url: "erp/shipment/packing.html"
                },
                {
                    title: "Export",
                    page: "shipment-export",
                    url: "erp/shipment/export.html"
                }
            ]
        }
    ];

    /*
        Cari modul yang sedang aktif.
    */

    function moduleHasActivePage(module) {
        return module.children.some(function (child) {
            return child.page === page;
        });
    }

    /*
        =========================
        SIDEBAR
        =========================
    */

    if (sidebarContainer) {

        sidebarContainer.innerHTML = `
            <div class="sidebar-inner">

                <div class="sidebar-scroll">

                    <a
                        href="${ROOT}index.html"
                        class="sidebar-dashboard ${page === "dashboard" ? "active" : ""}"
                    >
                        <span class="sidebar-main-icon">
                            <i class="ph-fill ph-house-line"></i>
                        </span>

                        <span></span>
                    </a>


                    ${modules.map(function (module) {

                        const active = moduleHasActivePage(module);

                        return `
                            <div class="sidebar-module ${active ? "module-active" : ""}">

                                <button
                                    type="button"
                                    class="sidebar-module-button"
                                    aria-expanded="${active}"
                                >

                                    <span class="sidebar-module-left">

                                        <span class="sidebar-main-icon">
                                            <i class="ph ${module.icon}"></i>
                                        </span>

                                        <span>${module.title}</span>

                                    </span>

                                    <i class="ph ph-caret-down sidebar-caret ${active ? "rotate" : ""}"></i>

                                </button>

                                <ul class="sidebar-children ${active ? "open" : ""}">

                                    ${module.children.map(function (child) {

                                        const childActive = child.page === page;

                                        return `
                                            <li>
                                                <a
                                                    href="${ROOT}${child.url}"
                                                    class="${childActive ? "active" : ""}"
                                                >
                                                    ${child.title}
                                                </a>
                                            </li>
                                        `;

                                    }).join("")}

                                </ul>

                            </div>
                        `;

                    }).join("")}

                </div>

                <div class="sidebar-footer">

                    <span class="status-dot"></span>

                </div>

            </div>
        `;
    }

    /*
        =========================
        ACCORDION
        =========================
    */

    document.querySelectorAll(".sidebar-module-button").forEach(function (button) {

        button.addEventListener("click", function () {

            const module = button.closest(".sidebar-module");
            const children = module.querySelector(".sidebar-children");
            const caret = button.querySelector(".sidebar-caret");

            const isOpen = children.classList.contains("open");

            children.classList.toggle("open", !isOpen);
            caret.classList.toggle("rotate", !isOpen);

            button.setAttribute("aria-expanded", String(!isOpen));
        });
    });

    /*
        =========================
        MOBILE MENU
        =========================
    */

    const mobileButton = document.getElementById("mobile-menu-btn");

    if (mobileButton && sidebarContainer) {

        const overlay = document.createElement("div");

        overlay.className = "mobile-overlay";
        overlay.id = "mobile-overlay";

        document.body.appendChild(overlay);

        function openSidebar() {
            sidebarContainer.classList.add("mobile-open");
            overlay.classList.add("show");
        }

        function closeSidebar() {
            sidebarContainer.classList.remove("mobile-open");
            overlay.classList.remove("show");
        }

        mobileButton.addEventListener("click", openSidebar);
        overlay.addEventListener("click", closeSidebar);
    }

    /*
        =========================
        SEARCH
        =========================
    */

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (searchInput && searchButton) {

        function runSearch() {

            const keyword = searchInput.value.trim();

            if (!keyword) return;

            alert("Search: " + keyword);
        }

        searchButton.addEventListener("click", runSearch);

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                runSearch();
            }

        });
    }

});
