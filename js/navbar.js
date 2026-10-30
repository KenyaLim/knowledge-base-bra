

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

        if (path.startsWith("/docs/")) return "/";
        const marker = "/erp/";
        const markerIndex = path.indexOf(marker);

        if (markerIndex !== -1) {
            return path.substring(0, markerIndex + 1);
        }

        const stageMarker = "/stage/";
        const stageIndex = path.indexOf(stageMarker);

        if (stageIndex !== -1) {
            return path.substring(0, stageIndex + 1);
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
    function navigationUrl(url) {
        const value = String(url || "");
        return value.startsWith("/") || value.startsWith("http") ? value : `${ROOT}${value.replace(/^\/+/, "")}`;
    }

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
                // home: { title: "", page: "stage-home", url: "stage/home.html" },
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
                            { title: "Issue / Receipt", page: "inventory-stock", url: "erp/inventory/issuereceipt.html" },
                            { title: "Allowance", page: "inventory-allowance", url: "erp/inventory/allowance.html" },
                            { title: "ASN", page: "inventory-asn", url: "erp/inventory/asn.html" },
                            { title: "C&F Export", page: "inventory-cfrep", url: "erp/inventory/cfrep.html" },
                            { title: "Item Master", page: "inventory-item-master", url: "erp/inventory/itemmaster.html" },
                            { title: "Material Transfer", page: "inventory-material-transfer", url: "erp/inventory/materialtransfer.html" },
                            { title: "Opening Stock", page: "inventory-opening-stock", url: "erp/inventory/opstock.html" },
                            { title: "Other Issue", page: "inventory-other-issue", url: "erp/inventory/otherissue.html" },
                            { title: "QC & BP", page: "inventory-qcbp", url: "erp/inventory/qcbp.html" },
                            { title: "Sample Issue", page: "inventory-sample-issue", url: "erp/inventory/sampleissue.html" },
                            { title: "Stock Reconciliation", page: "inventory-stock-reconciliation", url: "erp/inventory/stockrec.html" }
                        ]
                    },
                    {
                        id: "stage-packing",
                        title: "Packing",
                        icon: "ph-package",
                        children: [
                            { title: "Packing Instruction", page: "shipment-packing", url: "erp/packing/packing.html" },
                            { title: "Carton Packing", page: "packing-carton", url: "erp/packing/cartonpack.html" },
                            { title: "Fabric & Accessories", page: "packing-fabric-accessories", url: "erp/packing/fabricnacc.html" }
                        ]
                    },
                    {
                        id: "stage-shipping",
                        title: "Shipping",
                        icon: "ph-truck",
                        children: [
                            { title: "Export", page: "shipment-export", url: "erp/shipment/export.html" },
                            { title: "Invoice", page: "shipment-invoice", url: "erp/shipment/invoice.html" },
                            { title: "Export Contract", page: "shipment-export-control", url: "erp/packing/exportcon.html" },
                            { title: "Fabric Packing List", page: "shipment-list-fabric", url: "erp/packing/packinglistfabric.html" },
                            { title: "Garment Packing List", page: "shipment-list-garment", url: "erp/packing/packinglistgarmen.html" }
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
                // home: { title: "", page: "proman-home", url: "proman/home.html" },
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
            }
        ];

    window.KB_DEFAULT_NAVIGATION = appGroups.filter(function (group) {
        return group.id === "stage" || group.id === "proman";
    }).flatMap(function (group) {
        const groupKey = "group-" + group.id;
        const groupItems = [{
            key: groupKey,
            scope: group.id === "proman" ? "proman" : "stage",
            title: group.title || group.id.toUpperCase(),
            icon: "",
            sort_order: 0
        }];
        if (group.home) {
            groupItems.push({
                key: group.id + "-home",
                parent_key: groupKey,
                scope: group.id === "proman" ? "proman" : "stage",
                title: group.home.title || "Home",
                icon: "ph-house-line",
                page: group.home.page,
                url: group.home.url,
                sort_order: 0
            });
        }
        return groupItems.concat((group.modules || []).flatMap(function (module, moduleIndex) {
            const parentKey = group.id + "-" + module.id;
            return [{
                key: parentKey,
                parent_key: groupKey,
                scope: group.id === "proman" ? "proman" : "stage",
                    title: module.title,
                    icon: module.icon || "ph-folder",
                sort_order: (moduleIndex + 1) * 100
            }].concat((module.children || []).map(function (child, childIndex) {
                return {
                    key: parentKey + "-" + child.page,
                    parent_key: parentKey,
                    scope: group.id === "proman" ? "proman" : "stage",
                    title: child.title,
                    page: child.page,
                    url: child.url,
                    sort_order: childIndex
                };
            }));
        }));
    });

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
                                    ${group.home ? `
                                        <a href="${ROOT}${group.home.url}" class="sidebar-direct-link ${page === group.home.page ? "active" : ""}" aria-label="${escapeHtml(group.title)} Home">
                                            <span class="sidebar-main-icon"><i class="ph ph-house-line"></i></span>
                                        </a>
                                    ` : ""}

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

    function bindSidebarAccordions() {
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
    }

    async function loadCmsNavigation() {
        if (!sidebarContainer) return;
        try {
            const response = await fetch("/api/cms/navigation", {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(8000)
            });
            if (!response.ok) throw new Error(`Navigation request failed: ${response.status}`);
            const payload = await response.json();
            const rawItems = Array.isArray(payload.items) ? payload.items : [];
            const byId = new Map(rawItems.filter(function (item) { return item && item.id; }).map(function (item) { return [item.id, item]; }));
            const items = rawItems.filter(function (item) {
                const scope = String(item.scope || "").toLowerCase();
                if (!item || !item.id || !["stage", "proman"].includes(scope) || !String(item.title || "").trim()) return false;
                if (!item.page) return !item.url || !String(item.url).trim();
                if (!String(item.url || "").trim() || /^(?:[a-z]+:|\/\/)/i.test(item.url) || String(item.url).includes("\\")) return false;
                const parent = item.parent_id ? byId.get(item.parent_id) : null;
                return parent ? parent.scope === item.scope && !parent.page : true;
            });

            const sortedItems = items.slice().sort(function (left, right) {
                return Number(left.sort_order || 0) - Number(right.sort_order || 0)
                    || String(left.title || "").localeCompare(String(right.title || ""));
            });
            const roots = sortedItems.filter(function (item) {
                return !item.parent_id && ["stage", "proman"].includes(String(item.scope || "").toLowerCase());
            });
            const scopes = ["stage", "proman"];
            if (rawItems.length && !roots.length) throw new Error("Navigation has no valid roots");

            function childrenOf(parentId) {
                return sortedItems.filter(function (item) {
                    return item.parent_id === parentId;
                });
            }

            const sidebarScroll = sidebarContainer.querySelector(".sidebar-scroll");
            const dashboard = sidebarScroll.querySelector(".sidebar-dashboard")?.outerHTML || "";
            const otherGroups = Array.from(sidebarScroll.querySelectorAll(".sidebar-app-group")).filter(function (group) { return !group.classList.contains("sidebar-app-group-stage") && !group.classList.contains("sidebar-app-group-proman"); }).map(function (group) { return group.outerHTML; }).join("");
            sidebarScroll.innerHTML = `${dashboard}
                ${scopes.map(function (scope) {
                      const scopeRoots = roots.filter(function (item) {
                          return String(item.scope || "").toLowerCase() === scope;
                      });
                      if (!scopeRoots.length) return "";
                       const wrappers = scopeRoots.filter(function (item) { return !item.page && item.title.toLowerCase() === scope; });
                       const root = { title: scope.toUpperCase() };
                       const children = wrappers.flatMap(function (rootItem) { return childrenOf(rootItem.id); });
                     const directPages = children.filter(function (item) { return item.page && item.url; });
                     const modules = scopeRoots.filter(function (item) { return !item.page && !wrappers.includes(item); }).concat(children.filter(function (item) { return !item.page; })).sort(function (a, b) { return a.sort_order - b.sort_order || a.title.localeCompare(b.title); });
                    return `
                        <section class="sidebar-app-group sidebar-app-group-${scope}">
                            <h2 class="sidebar-app-heading">${escapeHtml(root.title || scope.toUpperCase())}</h2>
                            ${directPages.map(function (item) {
                                return `<a href="${navigationUrl(item.url)}" class="sidebar-direct-link ${item.page === page ? "active" : ""}" aria-label="${escapeHtml(item.title)}"><span class="sidebar-main-icon"><i class="ph ${escapeHtml(item.icon || "ph-house-line")}"></i></span>${item.title.toLowerCase() === "home" ? "" : `<span>${escapeHtml(item.title)}</span>`}</a>`;
                            }).join("")}
                            ${modules.map(function (module) {
                                const children = childrenOf(module.id);
                                if (module.page && module.url) {
                                    return `<a href="${navigationUrl(module.url)}" class="sidebar-direct-link ${module.page === page ? "active" : ""}">${escapeHtml(module.title)}</a>`;
                                }
                                const moduleActive = children.some(function (child) { return child.page === page; });
                                return `<div class="sidebar-module ${moduleActive ? "module-active" : ""}">
                                    <button type="button" class="sidebar-module-button" aria-expanded="${moduleActive}">
                                        <span class="sidebar-module-left">
                                            <span class="sidebar-main-icon"><i class="ph ${escapeHtml(module.icon || "ph-link")}"></i></span>
                                            <span>${escapeHtml(module.title)}</span>
                                        </span>
                                        <i class="ph ph-caret-down sidebar-caret ${moduleActive ? "rotate" : ""}"></i>
                                    </button>
                                    <ul class="sidebar-children ${moduleActive ? "open" : ""}">
                                        ${children.filter(function (child) { return child.page && child.url; }).map(function (child) {
                                            return `<li><a href="${navigationUrl(child.url)}" class="${child.page === page ? "active" : ""}">${escapeHtml(child.title)}</a></li>`;
                                        }).join("")}
                                    </ul>
                                </div>`;
                            }).join("")}
                        </section>
                    `;
                }).join("")}
            `;
            sidebarScroll.insertAdjacentHTML("beforeend", otherGroups);
            bindSidebarAccordions();
        } catch (error) {
            console.warn("CMS navigation is unavailable; using the built-in navigation.", error);
        }
    }

    bindSidebarAccordions();
    loadCmsNavigation();
    document.addEventListener("kb:navigation-changed", loadCmsNavigation);

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
        const modulePages = appGroups.flatMap(function (group) {
            return group.modules.flatMap(function (module) {
                return module.children.map(function (child) {
                    return {
                        title: child.title,
                        module: module.title,
                        page: child.page,
                        url: `${ROOT}${child.url}`
                    };
                });
            });
        });
        let documentationIndex = [];
        let searchIndexReady = false;
        let searchIndexError = false;

        function normalizeSearchText(value) {
            return String(value || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLocaleLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .trim();
        }

        function getSearchTerms(value) {
            return normalizeSearchText(value).split(/\s+/).filter(Boolean);
        }

        function matchesSearch(value, terms) {
            const normalizedValue = normalizeSearchText(value);
            return terms.every(function (term) {
                return normalizedValue.includes(term);
            });
        }

        async function loadDocumentationIndex() {
            const [materialsResult, ...pageResults] = await Promise.allSettled([
                fetch("/api/cms/content").then(function (response) {
                    if (!response.ok) throw new Error("Could not load CMS search content");
                    return response.json();
                }),
                ...modulePages.map(function (page) {
                    return fetch(page.url).then(function (response) {
                        if (!response.ok) throw new Error(`Could not load ${page.title}`);
                        return response.text();
                    });
                })
            ]);
            const materials = materialsResult.status === "fulfilled"
                ? materialsResult.value
                : [];
            const materialsBySlug = new Map(
                materials.map(function (material) {
                    return [material.slug, material];
                })
            );

            documentationIndex = modulePages.map(function (page, index) {
                const result = pageResults[index];
                if (result.status !== "fulfilled") {
                    searchIndexError = true;
                    return null;
                }

                const parsedPage = new DOMParser().parseFromString(result.value, "text/html");
                const slug = parsedPage.body.dataset.cmsSlug
                    || `erp-${parsedPage.body.dataset.page || page.page}`;
                const material = materialsBySlug.get(slug);
                const pageTitle = parsedPage.querySelector("main h1, .hero h1")?.textContent.trim() || "";
                const pageText = Array.from(parsedPage.querySelectorAll("[contenteditable], .doc-block"))
                    .map(function (element) { return element.textContent; })
                    .join(" ");
                const searchableContent = Array.from(parsedPage.querySelectorAll("[contenteditable], .doc-block"))
                    .map(function (element) { return element.innerHTML; })
                    .join("\n");
                const storedText = material
                    ? `${material.title} ${material.summary} ${new DOMParser().parseFromString(material.content, "text/html").body.textContent}`
                    : "";

                return {
                    title: [page.module, page.title, material ? material.title : pageTitle].filter(Boolean).join(" "),
                    text: material ? storedText : pageText,
                    html: material ? material.content : searchableContent,
                    summary: material?.summary || pageText.replace(/\s+/g, " ").trim().slice(0, 240),
                    url: page.url
                };
            }).filter(Boolean);

            if (materialsResult.status === "rejected") searchIndexError = true;
            searchIndexReady = true;
            runSearch();
        }

        function clearHighlights(item) {
            item.querySelectorAll("mark.search-highlight").forEach(function (mark) {
                mark.replaceWith(document.createTextNode(mark.textContent));
            });
        }

        function highlightMatches(item, terms) {
            if (!terms.length) return;

            const matcher = new RegExp(
                terms.map(function (term) {
                    return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                }).join("|"),
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

        function highlightHtml(value, terms) {
            const safeValue = escapeHtml(value);
            if (!terms.length) return safeValue;
            const matcher = new RegExp(
                terms.map(function (term) {
                    return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                }).join("|"),
                "gi"
            );
            return safeValue.replace(matcher, "<mark class=\"search-highlight\">$&</mark>");
        }

        function getSearchExcerpt(entry, terms) {
            const contentText = entry.text.replace(/\s+/g, " ").trim();
            const contentMatch = terms
                .map(function (term) { return contentText.toLocaleLowerCase().indexOf(term); })
                .filter(function (index) { return index !== -1; })
                .sort(function (left, right) { return left - right; })[0];
            const text = contentMatch !== undefined ? contentText : (entry.summary || contentText);
            const firstMatch = terms
                .map(function (term) { return text.toLocaleLowerCase().indexOf(term); })
                .filter(function (index) { return index !== -1; })
                .sort(function (left, right) { return left - right; })[0];
            if (firstMatch === undefined || text.length <= 240) return text;
            const start = Math.max(0, firstMatch - 70);
            const end = Math.min(text.length, start + 240);
            return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
        }

        function renderDocumentationResults(terms) {
            if (!searchResults) return 0;
            searchResults.innerHTML = "";
            if (!terms.length) return 0;

            const matches = documentationIndex.filter(function (entry) {
                return matchesSearch(`${entry.title} ${entry.text}`, terms);
            });

            matches.forEach(function (entry) {
                const result = document.createElement("a");
                result.className = "search-result";
                const params = new URLSearchParams();
                params.set("search", terms.join(" "));
                result.href = `${entry.url}${entry.url.includes("?") ? "&" : "?"}${params.toString()}#search-match`;
                result.innerHTML = `<strong>${highlightHtml(entry.title, terms)}</strong><span>${highlightHtml(getSearchExcerpt(entry, terms), terms)}</span><i class="ph ph-arrow-up-right"></i>`;
                searchResults.appendChild(result);
            });
            return matches.length;
        }

        function highlightLinkedSearch() {
            const params = new URLSearchParams(window.location.search);
            const terms = getSearchTerms(params.get("search"));
            if (!terms.length) return;

            const documentation = document.querySelector("main .doc-block [contenteditable], main .doc-block")
                || document.querySelector("main .doc-block");
            if (!documentation) return;

            const match = terms.find(function (term) {
                return normalizeSearchText(documentation.textContent).includes(term);
            });
            if (!match) return;

            const matcher = new RegExp(terms.map(function (term) {
                return term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
            }).join("|"), "gi");
            const walker = document.createTreeWalker(documentation, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (node.parentElement.closest("script, style, .erp-editor-toolbar")) continue;
                matcher.lastIndex = 0;
                const found = matcher.exec(node.nodeValue);
                if (!found) continue;

                const mark = document.createElement("mark");
                mark.className = "search-highlight search-target";
                const range = document.createRange();
                range.setStart(node, found.index);
                range.setEnd(node, found.index + found[0].length);
                range.surroundContents(mark);
                mark.id = "search-match";
                mark.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        }

        if (new URLSearchParams(window.location.search).has("search")) {
            let attempts = 0;
            const highlightTimer = window.setInterval(function () {
                attempts += 1;
                highlightLinkedSearch();
                if (document.getElementById("search-match") || attempts >= 40) {
                    window.clearInterval(highlightTimer);
                }
            }, 250);
        }

        function runSearch() {
            const terms = getSearchTerms(searchInput.value);
            let visibleCount = 0;
            const documentationCount = renderDocumentationResults(terms);

            searchableItems.forEach(function (item) {
                clearHighlights(item);
                const matches = !terms.length || matchesSearch(item.textContent, terms);
                item.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                    highlightMatches(item, terms);
                }
            });

            document.querySelectorAll(".card-grid, .module-grid").forEach(function (grid) {
                grid.hidden = terms.length > 0 && !Array.from(grid.children).some(function (item) {
                    return !item.hidden;
                });
            });

            if (!searchStatus) return;
            const totalCount = visibleCount + documentationCount;
            if (!terms.length) {
                searchStatus.textContent = searchIndexReady && searchIndexError
                    ? "Some documentation could not be loaded for search."
                    : "";
            } else if (!searchIndexReady) {
                searchStatus.textContent = "Loading documentation...";
            } else if (totalCount === 0) {
                searchStatus.textContent = `No results found for "${searchInput.value.trim()}".`;
            } else {
                searchStatus.textContent = `${totalCount} result${totalCount === 1 ? "" : "s"} found.${searchIndexError ? " Some documentation could not be loaded." : ""}`;
            }
        }

        searchButton.addEventListener("click", runSearch);
        searchInput.addEventListener("input", runSearch);

        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                runSearch();
            }

        });

        searchIndexReady = false;
        searchStatus.textContent = "Loading documentation...";
        loadDocumentationIndex().catch(function (error) {
            searchIndexReady = true;
            searchIndexError = true;
            searchStatus.textContent = `Could not load documentation for search: ${error.message}`;
        });
    }

});
