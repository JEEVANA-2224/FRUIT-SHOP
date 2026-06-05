
/* ==========================================================================
   FRESH FRUIT BAZAAR - CORE APPLICATION SCRIPT (app.js)
   ========================================================================== */

// --- Default Data Initialization ---
const DEFAULT_FRUITS = [
    {
        id: 1,
        name: "Crisp Red Apple",
        category: "other",
        price: 180.00,
        unit: "kg",
        stock: 45,
        image: "images/apple.png"
    },
    {
        id: 2,
        name: "Ripe Banana",
        category: "other",
        price: 60.00,
        unit: "kg",
        stock: 60,
        image: "images/banana.png"
    },
    {
        id: 3,
        name: "Juicy Orange",
        category: "citrus",
        price: 120.00,
        unit: "kg",
        stock: 35,
        image: "images/orange.png"
    },
    {
        id: 4,
        name: "Fresh Red Litchi",
        category: "berries",
        price: 250.00,
        unit: "kg",
        stock: 20,
        image: "images/litchi.png"
    },
    {
        id: 5,
        name: "Alphonso Mango",
        category: "tropical",
        price: 150.00,
        unit: "kg",
        stock: 50,
        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&q=80"
    },
    {
        id: 6,
        name: "Sweet Custard Apple",
        category: "tropical",
        price: 200.00,
        unit: "kg",
        stock: 15,
        image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&q=80"
    },
    {
        id: 7,
        name: "Tangy Wood Apple",
        category: "citrus",
        price: 100.00,
        unit: "piece",
        stock: 30,
        image: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=500&q=80"
    },
    {
        id: 8,
        name: "Seedless Black Grapes",
        category: "berries",
        price: 140.00,
        unit: "kg",
        stock: 40,
        image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80"
    }
];

// --- Application State ---
let fruits = [];
let cart = [];
let sales = [];
let currentCategory = "all";
let searchFilter = "";
let paymentCountdownInterval = null;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initDateTime();
    loadLocalStorageData();
    renderFruitsGrid();
    renderCart();
    renderInventoryTable();
    loadMonthFilter();
    loadSalesReport();
});

// --- Theme & Navigation Helper ---
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeUI(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const textSpan = document.getElementById("theme-text");
    if (theme === "dark") {
        textSpan.textContent = "Light Mode";
    } else {
        textSpan.textContent = "Dark Mode";
    }
}

function initDateTime() {
    const updateTime = () => {
        const now = new Date();
        
        // Time format
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        seconds = seconds < 10 ? '0'+seconds : seconds;
        document.getElementById("current-time").textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
        
        // Date format
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById("current-date").textContent = now.toLocaleDateString('en-US', options);
    };
    
    updateTime();
    setInterval(updateTime, 1000);
}

function switchTab(tabId) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    
    // Show selected screen
    document.getElementById(`screen-${tabId}`).classList.add("active");
    document.getElementById(`btn-${tabId}`).classList.add("active");
    
    // Update Header Context
    const title = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");
    const searchContainer = document.getElementById("search-container");
    
    if (tabId === "pos") {
        title.textContent = "POS Billing Dashboard";
        subtitle.textContent = "Add fresh fruits to cart and checkout instantly.";
        searchContainer.style.display = "block";
    } else if (tabId === "inventory") {
        title.textContent = "Inventory Management";
        subtitle.textContent = "Create, read, update and delete products from inventory.";
        searchContainer.style.display = "none";
        renderInventoryTable();
    } else if (tabId === "reports") {
        title.textContent = "Financial Analytics";
        subtitle.textContent = "View monthly sales performance, metrics, and receipts ledger.";
        searchContainer.style.display = "none";
        loadSalesReport();
    }
}

// --- Data Synchronization ---
function loadLocalStorageData() {
    // Inventory
    if (!localStorage.getItem("fruits_inventory")) {
        localStorage.setItem("fruits_inventory", JSON.stringify(DEFAULT_FRUITS));
    }
    fruits = JSON.parse(localStorage.getItem("fruits_inventory"));

    // Cart
    cart = JSON.parse(localStorage.getItem("current_cart")) || [];

    // Sales
    sales = JSON.parse(localStorage.getItem("sales_history")) || [];
}

function saveFruitsState() {
    localStorage.setItem("fruits_inventory", JSON.stringify(fruits));
}

function saveCartState() {
    localStorage.setItem("current_cart", JSON.stringify(cart));
}

function saveSalesState() {
    localStorage.setItem("sales_history", JSON.stringify(sales));
}

// --- POS Section & Cart Logic ---
function filterCategory(category) {
    currentCategory = category;
    document.querySelectorAll(".category-chip").forEach(chip => {
        chip.classList.remove("active");
        if (chip.textContent.toLowerCase().includes(category) || (category === 'all' && chip.textContent.includes('All'))) {
            chip.classList.add("active");
        }
    });
    renderFruitsGrid();
}

function filterFruits(value) {
    searchFilter = value.toLowerCase().trim();
    renderFruitsGrid();
}

function renderFruitsGrid() {
    const grid = document.getElementById("fruits-grid");
    grid.innerHTML = "";
    
    const filtered = fruits.filter(fruit => {
        const matchesCategory = currentCategory === "all" || fruit.category === currentCategory;
        const matchesSearch = fruit.name.toLowerCase().includes(searchFilter);
        return matchesCategory && matchesSearch;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-cart-state" style="grid-column: 1/-1;">
                <i class="fa-solid fa-face-frown"></i>
                <p>No fruits found</p>
                <span>Try searching for something else or add new fruits in menu management</span>
            </div>
        `;
        return;
    }
    
    filtered.forEach(fruit => {
        const inCartItem = cart.find(item => item.id === fruit.id);
        const cartQty = inCartItem ? inCartItem.quantity : 0;
        const availableStock = fruit.stock - cartQty;
        
        let stockClass = "in-stock";
        let stockText = `${availableStock} ${fruit.unit}s left`;
        
        if (availableStock <= 0) {
            stockClass = "out-of-stock";
            stockText = "Out of Stock";
        } else if (availableStock <= 5) {
            stockClass = "low-stock";
            stockText = "Low Stock";
        }

        const card = document.createElement("div");
        card.className = "fruit-card";
        card.onclick = () => {
            if (availableStock > 0) {
                addToCart(fruit.id);
            }
        };
        
        // Image display logic: check if local or remote image exists
        let imgHtml = "";
        if (fruit.image && fruit.image.trim() !== "") {
            imgHtml = `<img src="${fruit.image}" alt="${fruit.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        card.innerHTML = `
            <div class="fruit-img-container">
                ${imgHtml}
                <div class="fruit-placeholder-icon" style="display: ${fruit.image ? 'none' : 'flex'}">
                    <i class="fa-solid fa-apple-whole"></i>
                </div>
                <span class="fruit-category-badge">${fruit.category}</span>
            </div>
            <div class="fruit-info">
                <h4>${fruit.name}</h4>
                <span class="stock-tag ${stockClass}">${stockText}</span>
                <div class="price-row">
                    <div class="fruit-price">₹${fruit.price.toFixed(2)} <span>/${fruit.unit}</span></div>
                    <button class="add-card-btn" ${availableStock <= 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(fruitId) {
    const fruit = fruits.find(f => f.id === fruitId);
    if (!fruit) return;
    
    const cartIndex = cart.findIndex(item => item.id === fruitId);
    const cartQty = cartIndex > -1 ? cart[cartIndex].quantity : 0;
    
    if (fruit.stock - cartQty <= 0) {
        alert("Stock limit reached!");
        return;
    }
    
    if (cartIndex > -1) {
        cart[cartIndex].quantity += 1;
    } else {
        cart.push({
            id: fruit.id,
            name: fruit.name,
            price: fruit.price,
            unit: fruit.unit,
            image: fruit.image,
            quantity: 1
        });
    }
    
    saveCartState();
    renderCart();
    renderFruitsGrid();
}

function updateCartQty(fruitId, amount) {
    const cartIndex = cart.findIndex(item => item.id === fruitId);
    if (cartIndex === -1) return;
    
    const fruit = fruits.find(f => f.id === fruitId);
    
    if (amount > 0) {
        // Check stock
        if (fruit.stock - cart[cartIndex].quantity <= 0) {
            alert("No more stock available!");
            return;
        }
        cart[cartIndex].quantity += 1;
    } else {
        cart[cartIndex].quantity -= 1;
        if (cart[cartIndex].quantity <= 0) {
            cart.splice(cartIndex, 1);
        }
    }
    
    saveCartState();
    renderCart();
    renderFruitsGrid();
}

function clearCart() {
    cart = [];
    saveCartState();
    renderCart();
    renderFruitsGrid();
}

function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const checkoutBtn = document.getElementById("btn-checkout");
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-state">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Cart is empty</p>
                <span>Click on fruits to add them here</span>
            </div>
        `;
        document.getElementById("cart-subtotal").textContent = "₹0.00";
        document.getElementById("cart-tax").textContent = "₹0.00";
        document.getElementById("cart-total").textContent = "₹0.00";
        checkoutBtn.disabled = true;
        return;
    }
    
    cartContainer.innerHTML = "";
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        
        let imgHtml = "";
        if (item.image && item.image.trim() !== "") {
            imgHtml = `<img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        
        itemEl.innerHTML = `
            ${imgHtml}
            <div class="cart-item-fallback-icon" style="display: ${item.image ? 'none' : 'flex'}">
                <i class="fa-solid fa-apple-whole"></i>
            </div>
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">₹${item.price.toFixed(2)} / ${item.unit}</span>
            </div>
            <div class="cart-item-actions">
                <span class="cart-item-total">₹${itemTotal.toFixed(2)}</span>
                <div class="qty-controller">
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        cartContainer.appendChild(itemEl);
    });
    
    const tax = subtotal * 0.05; // 5% GST
    const total = subtotal + tax;
    
    document.getElementById("cart-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("cart-tax").textContent = `₹${tax.toFixed(2)}`;
    document.getElementById("cart-total").textContent = `₹${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// --- Payment Module & UPI QR Generation ---
function openPaymentModal() {
    let subtotal = 0;
    cart.forEach(item => subtotal += (item.price * item.quantity));
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    document.getElementById("pay-total-amount").textContent = `₹${total.toFixed(2)}`;
    
    // Generate UPI URL for QR
    // upi://pay?pa=address&pn=name&am=amount&cu=INR
    const upiPA = "fruitbazaar@upi";
    const upiPN = "Fresh Fruit Bazaar";
    const upiURL = `upi://pay?pa=${upiPA}&pn=${encodeURIComponent(upiPN)}&am=${total.toFixed(2)}&cu=INR&tn=FreshFruitsPurchase`;
    
    // QR Server API details (highly reliable visual output)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(upiURL)}`;
    
    const svgContainer = document.getElementById("qrcode-svg-container");
    
    // Set a high-quality stylized SVG mockup first in case image load takes time or offline, then load the real API image
    svgContainer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; padding: 10px;">
            <img id="qr-img-element" src="${qrCodeUrl}" style="width: 100%; height: 100%; object-fit: contain;" alt="UPI Payment QR Code" onerror="renderQRFallback()">
        </div>
    `;
    
    // Setup Countdown Timer
    let secondsLeft = 300; // 5 minutes
    const countdownEl = document.getElementById("payment-timer-countdown");
    countdownEl.textContent = "05:00";
    
    if (paymentCountdownInterval) clearInterval(paymentCountdownInterval);
    paymentCountdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(paymentCountdownInterval);
            alert("Payment Session Expired!");
            closePaymentModal();
            return;
        }
        const min = Math.floor(secondsLeft / 60);
        let sec = secondsLeft % 60;
        sec = sec < 10 ? '0' + sec : sec;
        countdownEl.textContent = `0${min}:${sec}`;
    }, 1000);
    
    document.getElementById("payment-modal").classList.add("active");
}

function renderQRFallback() {
    // Render a premium styled vector SVG QR fallback (for offline operations)
    const svgContainer = document.getElementById("qrcode-svg-container");
    svgContainer.innerHTML = `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; padding: 10px;">
            <!-- Background grids resembling QR -->
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <!-- Anchor points (top-left, top-right, bottom-left) -->
            <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
            <rect x="14" y="14" width="17" height="17" fill="white" />
            <rect x="17" y="17" width="11" height="11" fill="#10b981" />
            
            <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
            <rect x="69" y="14" width="17" height="17" fill="white" />
            <rect x="72" y="17" width="11" height="11" fill="#10b981" />
            
            <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
            <rect x="14" y="69" width="17" height="17" fill="white" />
            <rect x="17" y="72" width="11" height="11" fill="#10b981" />
            
            <!-- Simulated QR pattern dots -->
            <rect x="42" y="15" width="5" height="5" fill="#0f172a" />
            <rect x="52" y="20" width="5" height="10" fill="#0f172a" />
            <rect x="42" y="30" width="10" height="5" fill="#0f172a" />
            
            <rect x="10" y="45" width="10" height="5" fill="#0f172a" />
            <rect x="25" y="45" width="5" height="10" fill="#0f172a" />
            <rect x="15" y="55" width="10" height="5" fill="#0f172a" />
            
            <rect x="45" y="45" width="15" height="15" fill="#0f172a" />
            <rect x="49" y="49" width="7" height="7" fill="white" />
            <rect x="51" y="51" width="3" height="3" fill="#10b981" />
            
            <rect x="65" y="42" width="10" height="5" fill="#0f172a" />
            <rect x="78" y="45" width="12" height="10" fill="#0f172a" />
            
            <rect x="42" y="70" width="10" height="15" fill="#0f172a" />
            <rect x="65" y="75" width="15" height="5" fill="#0f172a" />
            <rect x="75" y="65" width="5" height="20" fill="#0f172a" />
            
            <text x="50" y="96" text-anchor="middle" font-size="5" font-weight="bold" fill="#10b981">UPI PAYMENT</text>
        </svg>
    `;
}

function closePaymentModal() {
    document.getElementById("payment-modal").classList.remove("active");
    if (paymentCountdownInterval) {
        clearInterval(paymentCountdownInterval);
        paymentCountdownInterval = null;
    }
}

function processPayment(method) {
    if (cart.length === 0) return;
    
    // 1. Deduct Stock in inventory
    cart.forEach(item => {
        const invFruit = fruits.find(f => f.id === item.id);
        if (invFruit) {
            invFruit.stock = Math.max(0, invFruit.stock - item.quantity);
        }
    });
    saveFruitsState();
    
    // 2. Generate Receipt ID & Timestamp
    const receiptNum = "TXN" + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const formattedDateStr = now.toLocaleDateString("en-US", {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    
    // Calculate final totals
    let subtotal = 0;
    cart.forEach(item => subtotal += (item.price * item.quantity));
    const tax = subtotal * 0.05;
    const cgst = tax / 2;
    const sgst = tax / 2;
    const total = subtotal + tax;
    
    // 3. Save Sale Record
    const saleRecord = {
        orderId: receiptNum,
        timestamp: now.toISOString(),
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        subtotal: subtotal,
        tax: tax,
        total: total,
        method: method
    };
    
    sales.push(saleRecord);
    saveSalesState();
    
    // 4. Populate Print Invoice Data
    document.getElementById("rec-id").textContent = `#${receiptNum}`;
    document.getElementById("rec-date").textContent = formattedDateStr;
    document.getElementById("rec-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("rec-cgst").textContent = `₹${cgst.toFixed(2)}`;
    document.getElementById("rec-sgst").textContent = `₹${sgst.toFixed(2)}`;
    document.getElementById("rec-total").textContent = `₹${total.toFixed(2)}`;
    document.getElementById("rec-payment-method").textContent = method === 'UPI' ? 'UPI / QR Code' : method;
    document.getElementById("rec-barcode-num").textContent = receiptNum;
    
    const receiptItemsContainer = document.getElementById("receipt-items-list");
    receiptItemsContainer.innerHTML = "";
    
    cart.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "receipt-item-row";
        itemRow.innerHTML = `
            <span class="col-item">${item.name}</span>
            <span class="col-qty">${item.quantity}</span>
            <span class="col-price">${item.price.toFixed(2)}</span>
            <span class="col-total">${(item.price * item.quantity).toFixed(2)}</span>
        `;
        receiptItemsContainer.appendChild(itemRow);
    });
    
    // Close payment modal
    closePaymentModal();
    
    // Clear the cart
    clearCart();
    
    // 5. Trigger Print
    setTimeout(() => {
        window.print();
    }, 500);
}

// --- Menu CRUD Administrative Panel ---
function renderInventoryTable() {
    const listBody = document.getElementById("inventory-list");
    listBody.innerHTML = "";
    
    fruits.forEach(fruit => {
        let stockBadge = "in-stock";
        let stockText = `${fruit.stock} ${fruit.unit}s`;
        
        if (fruit.stock <= 0) {
            stockBadge = "out-stock";
            stockText = "Out of Stock";
        } else if (fruit.stock <= 5) {
            stockBadge = "low-stock";
            stockText = `Low Stock (${fruit.stock})`;
        }
        
        let imgHtml = "";
        if (fruit.image && fruit.image.trim() !== "") {
            imgHtml = `<img src="${fruit.image}" alt="${fruit.name}" class="inventory-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                ${imgHtml}
                <div class="inventory-fallback-icon" style="display: ${fruit.image ? 'none' : 'flex'}">
                    <i class="fa-solid fa-apple-whole"></i>
                </div>
            </td>
            <td><strong>${fruit.name}</strong></td>
            <td style="text-transform: capitalize;">${fruit.category}</td>
            <td>₹${fruit.price.toFixed(2)}</td>
            <td>per ${fruit.unit}</td>
            <td><span class="badge ${stockBadge}">${stockText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="openEditFruitForm(${fruit.id})" title="Edit Item">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteFruit(${fruit.id})" title="Delete Item">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        listBody.appendChild(tr);
    });
}

function openAddFruitForm() {
    document.getElementById("form-modal-title").textContent = "Add New Fruit";
    document.getElementById("fruit-form").reset();
    document.getElementById("form-fruit-id").value = "";
    document.getElementById("fruit-modal").classList.add("active");
}

function openEditFruitForm(id) {
    const fruit = fruits.find(f => f.id === id);
    if (!fruit) return;
    
    document.getElementById("form-modal-title").textContent = "Edit Fruit Details";
    document.getElementById("form-fruit-id").value = fruit.id;
    document.getElementById("form-fruit-name").value = fruit.name;
    document.getElementById("form-fruit-category").value = fruit.category;
    document.getElementById("form-fruit-unit").value = fruit.unit;
    document.getElementById("form-fruit-price").value = fruit.price;
    document.getElementById("form-fruit-stock").value = fruit.stock;
    document.getElementById("form-fruit-image").value = fruit.image || "";
    
    document.getElementById("fruit-modal").classList.add("active");
}

function closeFruitModal() {
    document.getElementById("fruit-modal").classList.remove("active");
}

function saveFruit(event) {
    event.preventDefault();
    
    const idInput = document.getElementById("form-fruit-id").value;
    const name = document.getElementById("form-fruit-name").value.trim();
    const category = document.getElementById("form-fruit-category").value;
    const unit = document.getElementById("form-fruit-unit").value;
    const price = parseFloat(document.getElementById("form-fruit-price").value);
    const stock = parseInt(document.getElementById("form-fruit-stock").value);
    let image = document.getElementById("form-fruit-image").value.trim();
    
    if (image === "") {
        // assign a smart local image path if user created a standard name
        if (name.toLowerCase().includes("apple") && !name.toLowerCase().includes("custard") && !name.toLowerCase().includes("wood")) {
            image = "images/apple.png";
        } else if (name.toLowerCase().includes("banana")) {
            image = "images/banana.png";
        } else if (name.toLowerCase().includes("orange")) {
            image = "images/orange.png";
        } else if (name.toLowerCase().includes("litchi")) {
            image = "images/litchi.png";
        } else {
            image = "";
        }
    }
    
    if (idInput) {
        // Edit Mode
        const index = fruits.findIndex(f => f.id === parseInt(idInput));
        if (index > -1) {
            fruits[index] = {
                ...fruits[index],
                name, category, unit, price, stock, image
            };
        }
    } else {
        // Add Mode
        const newId = fruits.length > 0 ? Math.max(...fruits.map(f => f.id)) + 1 : 1;
        fruits.push({
            id: newId,
            name, category, unit, price, stock, image
        });
    }
    
    saveFruitsState();
    closeFruitModal();
    renderInventoryTable();
    renderFruitsGrid();
    alert("Fruit details saved successfully!");
}

function deleteFruit(id) {
    const index = fruits.findIndex(f => f.id === id);
    if (index === -1) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${fruits[index].name}"?`);
    if (confirmDelete) {
        // Remove from cart if exists
        const cartIdx = cart.findIndex(c => c.id === id);
        if (cartIdx > -1) {
            cart.splice(cartIdx, 1);
            saveCartState();
            renderCart();
        }
        
        fruits.splice(index, 1);
        saveFruitsState();
        renderInventoryTable();
        renderFruitsGrid();
        alert("Fruit deleted from inventory.");
    }
}

// --- Sales Reports Module ---
function loadMonthFilter() {
    const select = document.getElementById("report-month-filter");
    select.innerHTML = "";
    
    // Find all distinct months in sales records
    const months = new Set();
    
    // Add current month in case sales ledger is empty
    const currentMonthKey = getCurrentMonthKey(new Date());
    months.add(currentMonthKey);
    
    sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        months.add(getCurrentMonthKey(saleDate));
    });
    
    // Sort months chronologically descending
    const sortedMonths = Array.from(months).sort().reverse();
    
    sortedMonths.forEach(m => {
        const option = document.createElement("option");
        option.value = m;
        
        // Convert YYYY-MM to word representation
        const [year, month] = m.split("-");
        const dateObj = new Date(year, parseInt(month) - 1, 1);
        option.textContent = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        select.appendChild(option);
    });
}

function getCurrentMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function loadSalesReport() {
    const selectedMonth = document.getElementById("report-month-filter").value;
    if (!selectedMonth) return;
    
    // Filter sales by selected month
    const monthlySales = sales.filter(sale => {
        const saleMonth = getCurrentMonthKey(new Date(sale.timestamp));
        return saleMonth === selectedMonth;
    });
    
    // 1. Calculate Summary Cards
    let totalRevenue = 0;
    let totalFruitsSold = 0;
    
    monthlySales.forEach(sale => {
        totalRevenue += sale.total;
        sale.items.forEach(item => {
            totalFruitsSold += item.quantity;
        });
    });
    
    document.getElementById("report-total-revenue").textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById("report-total-orders").textContent = monthlySales.length;
    document.getElementById("report-total-fruits").textContent = `${totalFruitsSold.toFixed(1)} unit/kg`;
    
    // 2. CSS Chart: Popular Items count
    const popularItemsContainer = document.getElementById("report-chart");
    popularItemsContainer.innerHTML = "";
    
    // Aggregate items quantity
    const itemAggregation = {};
    monthlySales.forEach(sale => {
        sale.items.forEach(item => {
            if (itemAggregation[item.name]) {
                itemAggregation[item.name] += item.quantity;
            } else {
                itemAggregation[item.name] = item.quantity;
            }
        });
    });
    
    // Convert to array and sort
    const sortedAggItems = Object.keys(itemAggregation).map(name => ({
        name: name,
        quantity: itemAggregation[name]
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5); // top 5 items
    
    if (sortedAggItems.length === 0) {
        popularItemsContainer.innerHTML = `
            <div class="chart-empty-state">
                <i class="fa-solid fa-chart-bar" style="font-size: 2rem; opacity: 0.2; margin-bottom: 0.5rem; display: block;"></i>
                No sales recorded in this month
            </div>
        `;
    } else {
        const maxQty = sortedAggItems[0].quantity;
        sortedAggItems.forEach(item => {
            const pct = (item.quantity / maxQty) * 100;
            const row = document.createElement("div");
            row.className = "chart-row";
            row.innerHTML = `
                <div class="chart-label-row">
                    <span>${item.name}</span>
                    <span>${item.quantity.toFixed(1)} units</span>
                </div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: 0%" data-pct="${pct}"></div>
                </div>
            `;
            popularItemsContainer.appendChild(row);
        });
        
        // Trigger CSS animations after loading
        setTimeout(() => {
            document.querySelectorAll(".chart-bar-fill").forEach(fill => {
                fill.style.width = fill.getAttribute("data-pct") + "%";
            });
        }, 100);
    }
    
    // 3. Render Sales Logs Ledger
    const logList = document.getElementById("sales-log-list");
    logList.innerHTML = "";
    
    // Display in reverse chronological order
    const sortedMonthlySales = [...monthlySales].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (sortedMonthlySales.length === 0) {
        logList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transactions available for this month.</td>
            </tr>
        `;
        return;
    }
    
    sortedMonthlySales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const dateStr = saleDate.toLocaleDateString("en-GB") + " " + saleDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Summarize items
        const itemSummary = sale.items.map(i => `${i.name} (x${i.quantity})`).join(", ");
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${sale.orderId}</strong></td>
            <td>${dateStr}</td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemSummary}">
                ${itemSummary}
            </td>
            <td><strong>₹${sale.total.toFixed(2)}</strong></td>
            <td><span class="badge in-stock">${sale.method}</span></td>
            <td>
                <button class="btn-print-icon" onclick="reprintReceipt('${sale.orderId}')" title="Reprint Bill">
                    <i class="fa-solid fa-print"></i>
                </button>
            </td>
        `;
        logList.appendChild(tr);
    });
}

function reprintReceipt(orderId) {
    const sale = sales.find(s => s.orderId === orderId);
    if (!sale) return;
    
    const saleDate = new Date(sale.timestamp);
    const formattedDateStr = saleDate.toLocaleDateString("en-US", {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    
    const cgst = sale.tax / 2;
    const sgst = sale.tax / 2;
    
    // Fill values in print DOM
    document.getElementById("rec-id").textContent = `#${sale.orderId}`;
    document.getElementById("rec-date").textContent = formattedDateStr;
    document.getElementById("rec-subtotal").textContent = `₹${sale.subtotal.toFixed(2)}`;
    document.getElementById("rec-cgst").textContent = `₹${cgst.toFixed(2)}`;
    document.getElementById("rec-sgst").textContent = `₹${sgst.toFixed(2)}`;
    document.getElementById("rec-total").textContent = `₹${sale.total.toFixed(2)}`;
    document.getElementById("rec-payment-method").textContent = sale.method === 'UPI' ? 'UPI / QR Code' : sale.method;
    document.getElementById("rec-barcode-num").textContent = sale.orderId;
    
    const receiptItemsContainer = document.getElementById("receipt-items-list");
    receiptItemsContainer.innerHTML = "";
    
    sale.items.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "receipt-item-row";
        itemRow.innerHTML = `
            <span class="col-item">${item.name}</span>
            <span class="col-qty">${item.quantity}</span>
            <span class="col-price">${item.price.toFixed(2)}</span>
            <span class="col-total">${(item.price * item.quantity).toFixed(2)}</span>
        `;
        receiptItemsContainer.appendChild(itemRow);
    });
    
    setTimeout(() => {
        window.print();
    }, 200);
}
