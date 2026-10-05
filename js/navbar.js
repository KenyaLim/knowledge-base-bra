

document.addEventListener("DOMContentLoaded", function () {

    const page = document.body.dataset.page === "material"
        ? new URLSearchParams(window.location.search).get("slug") || "material"
        : document.body.dataset.page || "dashboard";
    const navbarContainer = document.getElementById("navbar");
    const sidebarContainer = document.getElementById("sidebar");

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

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

        const promanMarker = "/proman/";
        const promanIndex = path.indexOf(promanMarker);

        if (promanIndex !== -1) {
            return path.substring(0, promanIndex + 1);
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
                    <a href="${ROOT}materials.html" class="navbar-link">Materials</a>
                    <a href="${ROOT}admin.html" class="navbar-link" id="navbar-admin-link" hidden>Admin</a>
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
    }

        const appGroups = [
            {
                id: "stage",
                title: "STAGE",
                modules: [
                    {
                        id: "stage-order",
                        title: "Order",
                        icon: "ph-shopping-cart",
                        children: [
                            { title: "Order Detail", page: "stage-order", url: "erp/0-order/order.html" }
                        ]
                    },
                    {
                        id: "stage-costing",
                        title: "Costing",
                        icon: "ph-money",
                        children: [
                            { title: "Costing Detail", page: "costing", url: "erp/costing/costing.html" }
                        ]
                    },
                    {
                        id: "stage-mrp",
                        title: "MRP",
                        icon: "ph-chart-bar",
                        children: [
                            { title: "Process Selection", page: "mrp-process-selection", url: "erp/1-mrp/procselect.html" },
                            { title: "Specifications", page: "mrp-specifications", url: "erp/1-mrp/matrequire.html" },
                            { title: "General BOM", page: "mrp-general-bom", url: "erp/1-mrp/genbom.html" },
                            { title: "Process Material", page: "mrp-process-material", url: "erp/1-mrp/procmat.html" },
                            { title: "Material List", page: "mrp-material-list", url: "erp/1-mrp/matlist.html" }
                        ]
                    },
                    {
                        id: "stage-purchase",
                        title: "Purchase",
                        icon: "ph-receipt",
                        children: [
                            { title: "Purchase Order", page: "purchase-order", url: "erp/2-purchase/purchase-order.html" },
                            { title: "Domestic / Import", page: "purchase-material", url: "erp/2-purchase/imporekspor.html" }
                        ]
                    },
                    {
                        id: "stage-inventory",
                        title: "Inventory",
                        icon: "ph-box-arrow-down",
                        children: [
                            { title: "Issue / Receipt", page: "inventory-stock", url: "erp/inventory/issuereceipt.html" }                        ]
                    },
                    {
                        id: "stage-packing",
                        title: "Packing",
                        icon: "ph-package",
                        children: [
                            { title: "Packing Instruction", page: "shipment-packing", url: "erp/packing/packing.html" }
                        ]
                    },
                    {
                        id: "stage-shipping",
                        title: "Shipping",
                        icon: "ph-truck",
                        children: [
                            { title: "Export", page: "shipment-export", url: "erp/shipment/export.html" },
                            { title: "Invoice", page: "shipment-invoice", url: "erp/shipment/invoice.html" }
                        ]
                    },
                    {
                        id: "stage-address",
                        title: "Address",
                        icon: "ph-address-book",
                        children: [
                            { title: "Address", page: "stage-address", url: "erp/address/address.html" }
                        ]
                    }
                ]
            },
            {
                id: "proman",
                title: "PROMAN",
                modules: [
                    {
                        id: "proman-time-study",
                        title: "Time Study",
                        icon: "ph-timer",
                        children: [
                            { title: "Time Study", page: "proman-time-study", url: "proman/timestudy/timestud.html" }
                        ]
                    },
                    {
                        id: "proman-fabric-trims-inward",
                        title: "Fabric & Trims Inward",
                        icon: "ph-package",
                        children: [
                            { title: "Fabric Trims Inward Detail", page: "proman-fabric-trims-inward", url: "proman/fabrictime/fabtime.html" }
                        ]
                    },
                    {
                        id: "proman-fabric-issue",
                        title: "Fabric Issue",
                        icon: "ph-arrow-square-up",
                        children: [
                            { title: "Fabric Issue Detail", page: "proman-fabric-issue", url: "proman/fabricissue/fab.html" }
                        ]
                    },
                    {
                        id: "proman-cutting",
                        title: "Cutting",
                        icon: "ph-scissors",
                        children: [
                            { title: "Cutting Detail", page: "proman-cutting", url: "proman/cutting/cut.html" }
                        ]
                    },
                    {
                        id: "proman-production",
                        title: "Production",
                        icon: "ph-factory",
                        children: [
                            { title: "Production Detail", page: "proman-production", url: "proman/production/prod.html" }
                        ]
                    },
                    {
                        id: "proman-quality-control",
                        title: "Quality Control",
                        icon: "ph-check-circle",
                        children: [
                            { title: "Quality Control Detail", page: "proman-quality-control", url: "proman/qc/qc.html" }
                        ]
                    }
                ]
            },
            {
                // id: "other",
                // title: "",
                modules: [
                    {
                        id: "faq",
                        title: "FAQ",
                        icon: "ph-question",
                        children: [
                            { title: "Frequently Asked Questions", page: "faq", url: "getting-started/faq.html" }
                        ]
                    }
                ]
            }
        ];

    if (navbarContainer) {
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
                const adminLink = document.getElementById("navbar-admin-link");
                if (adminLink && session.isAdmin) adminLink.hidden = false;
                if (welcomeElement) welcomeElement.textContent = `Welcome, ${email}`;
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


    function moduleHasActivePage(module) {
        return Array.isArray(module.children) && module.children.some(function (child) {
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

                    </a>

                    ${appGroups.map(function (group) {
                        return `
                            <section class="sidebar-app-group sidebar-app-group-${group.id}">
                                <h2 class="sidebar-app-heading">${escapeHtml(group.title)}</h2>
                                ${group.modules.map(function (module) {

                        const active = moduleHasActivePage(module);
                        return `
                            <div class="sidebar-module ${active ? "module-active" : ""}" data-module-id="${escapeHtml(module.id)}">

                                <button
                                    type="button"
                                    class="sidebar-module-button"
                                    aria-expanded="${active}"
                                >

                                    <span class="sidebar-module-left">

                                        <span class="sidebar-main-icon">
                                            <i class="ph ${module.icon}"></i>
                                        </span>

                                        <span>${escapeHtml(module.title)}</span>

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
                                                    ${escapeHtml(child.title)}
                                                </a>
                                            </li>
                                        `;

                                    }).join("")}

                                </ul>

                            </div>
                            `;
                                }).join("")}
                            </section>
                        `;
                    }).join("")}

                </div>

                <div class="sidebar-footer">

                    <span class="status-dot"></span>

                </div>

            </div>
        `;

    }

    document.addEventListener("click", function (event) {
        const image = event.target.closest(".documentation img, .cms-image-preview");
        if (!image || image.hidden || !image.currentSrc) return;

        let preview = document.getElementById("imagePreviewDialog");
        if (!preview) {
            preview = document.createElement("dialog");
            preview.id = "imagePreviewDialog";
            preview.className = "image-preview-dialog";
            preview.innerHTML = '<button type="button" class="image-preview-close" aria-label="Close image preview"><i class="ph ph-x"></i></button><img alt="">';
            document.body.appendChild(preview);
            preview.querySelector(".image-preview-close").addEventListener("click", function () { preview.close(); });
            preview.addEventListener("click", function (closeEvent) {
                if (closeEvent.target === preview) preview.close();
            });
        }

        const previewImage = preview.querySelector("img");
        previewImage.src = image.currentSrc;
        previewImage.alt = image.alt || "Image preview";
        preview.showModal();
    });

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
    const searchStatus = document.getElementById("searchStatus");
    const searchResults = document.getElementById("searchResults");

    if (searchInput && searchButton) {
        const searchableItems = Array.from(document.querySelectorAll(
            ".card-grid > .card, .module-grid > .module-card"
        ));
        const documentationIndex = [
            { title: "Order Entry Detail", text: "SPI, order number, buyer, order date, order quantity, ship date, assortment, buyer PO, destination, style, color, size.", url: "erp/0-order/order.html" },
            { title: "MRP - Raw Material Specifications", text: "MRP, BOM, Fabric, Trims, article, color, size, position, consumption, SPI, PO number, F8 filter.", url: "erp/1-mrp/material-requirement.html" },
            { title: "Purchase Order", text: "Regular, Combined, General, Domestic, Import, supplier, buyer, order number, material, quantity, currency, PO number.", url: "erp/2-purchase/purchase-order.html" },
            { title: "RM Purchase", text: "Raw material purchase, supplier, buyer, order number, SPI, material, quantity, currency, PO number, BOM.", url: "erp/2-purchase/purchase-material.html" },
            { title: "Purchase Goods Receipt", text: "GRN, Goods Receipt Note, PO Number, SPI, material, quantity, partial delivery, pending quantity.", url: "erp/inventory/goods-receipt.html" },
            { title: "Inventory RM Receive / GRN", text: "Inventory, Supplier, Receive, GRN, QC, Good, Stock, Reject, Return to Supplier, IDMP, ODPD, PO Number, SPI.", url: "erp/inventory/goods-receipt.html" },
            { title: "Inventory Stock", text: "RM Issue, Stock, Issue, Production, Roll Wise, Rack Wise, Stock Report, material, quantity, status stock, storage location.", url: "erp/inventory/stock.html" },
            { title: "Shipment - Export", text: "Shipment, Export, destination, ship date, quantity, shipping documents.", url: "erp/shipment/export.html" }
        ];

        function clearHighlights(item) {
            item.querySelectorAll("mark.search-highlight").forEach(function (mark) {
                mark.replaceWith(document.createTextNode(mark.textContent));
            });
        }

        function highlightMatches(item, keyword) {
            if (!keyword) return;

            const matcher = new RegExp(
                keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "gi"
            );
            const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            let node;

            while ((node = walker.nextNode())) {
                if (node.parentElement.closest(".search-highlight")) continue;
                if (matcher.test(node.nodeValue)) textNodes.push(node);
                matcher.lastIndex = 0;
            }

            textNodes.forEach(function (textNode) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;
                matcher.lastIndex = 0;

                while ((match = matcher.exec(textNode.nodeValue))) {
                    fragment.appendChild(document.createTextNode(
                        textNode.nodeValue.slice(lastIndex, match.index)
                    ));
                    const mark = document.createElement("mark");
                    mark.className = "search-highlight";
                    mark.textContent = match[0];
                    fragment.appendChild(mark);
                    lastIndex = match.index + match[0].length;
                }

                fragment.appendChild(document.createTextNode(
                    textNode.nodeValue.slice(lastIndex)
                ));
                textNode.replaceWith(fragment);
            });
        }

        function highlightHtml(value, keyword) {
            const safeValue = escapeHtml(value);
            if (!keyword) return safeValue;
            const matcher = new RegExp(
                keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "gi"
            );
            return safeValue.replace(matcher, "<mark class=\"search-highlight\">$&</mark>");
        }

        function renderDocumentationResults(keyword) {
            if (!searchResults) return 0;
            searchResults.innerHTML = "";
            if (!keyword) return 0;

            const matches = documentationIndex.filter(function (entry) {
                return `${entry.title} ${entry.text}`.toLocaleLowerCase().includes(keyword);
            });

            matches.forEach(function (entry) {
                const result = document.createElement("a");
                result.className = "search-result";
                result.href = entry.url;
                result.innerHTML = `<strong>${highlightHtml(entry.title, keyword)}</strong><span>${highlightHtml(entry.text, keyword)}</span><i class="ph ph-arrow-up-right"></i>`;
                searchResults.appendChild(result);
            });
            return matches.length;
        }

        function runSearch() {
            const keyword = searchInput.value.trim().toLocaleLowerCase();
            let visibleCount = 0;
            const documentationCount = renderDocumentationResults(keyword);

            searchableItems.forEach(function (item) {
                clearHighlights(item);
                const matches = !keyword || item.textContent.toLocaleLowerCase().includes(keyword);
                item.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                    highlightMatches(item, keyword);
                }
            });

            document.querySelectorAll(".card-grid, .module-grid").forEach(function (grid) {
                grid.hidden = keyword !== "" && !Array.from(grid.children).some(function (item) {
                    return !item.hidden;
                });
            });

            if (!searchStatus) return;
            const totalCount = visibleCount + documentationCount;
            if (!keyword) {
                searchStatus.textContent = "";
            } else if (totalCount === 0) {
                searchStatus.textContent = `No results found for "${searchInput.value.trim()}".`;
            } else {
                searchStatus.textContent = `${totalCount} result${totalCount === 1 ? "" : "s"} found.`;
            }
        }

        searchButton.addEventListener("click", runSearch);
        searchInput.addEventListener("input", runSearch);

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                runSearch();
            }

        });
    }

});
