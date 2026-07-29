// ==============================
// VENMO SETTINGS
// ==============================

const venmoUsername = "Crystal-Christy";

// =========================
// STATS
// =========================

let stats = JSON.parse(
    localStorage.getItem("lemonadeStats")
) || {
    money: 0,
    orders: 0,
    items: 0,

    classic: 0,
    strawberry: 0,
    raspberry: 0,
    peach: 0,
    pickle: 0,
    water: 0
};


function saveStats() {

    localStorage.setItem(
        "lemonadeStats",
        JSON.stringify(stats)
    );

}

// =========================
// OPEN STATS
// =========================

function openStats() {

    updateStats();

    document.getElementById("statsModal")
        .style.display = "flex";

}


// =========================
// CLOSE STATS
// =========================

function closeStats() {

    document.getElementById("statsModal")
        .style.display = "none";

}


// =========================
// UPDATE STATS DISPLAY
// =========================

function updateStats() {

    document.getElementById("statMoney")
        .textContent =
        "$" + stats.money.toFixed(2);

    document.getElementById("statOrders")
        .textContent =
        stats.orders;

    document.getElementById("statItems")
        .textContent =
        stats.items;


    document.getElementById("statClassic")
        .textContent =
        stats.classic;

    document.getElementById("statStrawberry")
        .textContent =
        stats.strawberry;

    document.getElementById("statRaspberry")
        .textContent =
        stats.raspberry;

    document.getElementById("statPeach")
        .textContent =
        stats.peach;

    document.getElementById("statPickle")
        .textContent =
        stats.pickle;

    document.getElementById("statWater")
        .textContent =
        stats.water;

}


// =========================
// RECORD SALE
// =========================

function recordSale() {

    if (cart.length === 0) {
        return;
    }


    let total = 0;
    let items = 0;


    cart.forEach(item => {

        total +=
            item.price * item.quantity;

        items +=
            item.quantity;


        // Product tracking

        if (item.name === "Classic Lemonade") {

            stats.classic += item.quantity;

        }

        else if (
            item.name === "Strawberry Lemonade"
        ) {

            stats.strawberry += item.quantity;

        }

        else if (
            item.name === "Raspberry Lemonade"
        ) {

            stats.raspberry += item.quantity;

        }

        else if (
            item.name === "Peach Lemonade"
        ) {

            stats.peach += item.quantity;

        }

        else if (item.name === "Pickle") {

            stats.pickle += item.quantity;

        }

        else if (item.name === "Water") {

            stats.water += item.quantity;

        }

    });


    stats.money += total;

    stats.items += items;

    stats.orders++;


    saveStats();

    updateStats();

}

// ==============================
// OPEN VENMO PAYMENT
// ==============================

function openVenmoPayment() {
    const total = getOrderTotal();

    document.getElementById("venmoUsername").textContent =
        "@" + venmoUsername;

    document.getElementById("venmoAmount").textContent =
        total.toFixed(2);

    document.getElementById("venmoModal").style.display = "block";
}


// ==============================
// CLOSE MODAL
// ==============================

function closeVenmoPayment() {
    document.getElementById("venmoModal").style.display = "none";
}


// ==============================
// OPEN VENMO
// ==============================

function openVenmoApp() {
    const total = getOrderTotal();

    const venmoURL =
        "https://venmo.com/u/" +
        venmoUsername;

    window.open(venmoURL, "_blank");
}


// ==============================
// CUSTOMER SAYS THEY PAID
// ==============================

function confirmPayment() {
    const status = document.getElementById("paymentStatus");

    status.textContent =
        "✅ Payment marked as sent. We'll verify it before completing your order.";

    status.style.color = "green";

    closeVenmoPayment();
}


// ==============================
// GET ORDER TOTAL
// ==============================

function getOrderTotal() {

    // Change this to whatever your
    // existing cart total variable is.

    const totalElement =
        document.getElementById("orderTotal");

    return parseFloat(totalElement.textContent) || 0;
}


// ==============================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ==============================

window.onclick = function(event) {

    const modal =
        document.getElementById("venmoModal");

    if (event.target === modal) {
        closeVenmoPayment();
    }
    let cart = [];

    function addToCart(button) {
        const card = button.closest(".card");

        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);

        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                name: name,
                price: price,
                quantity: 1
            });
        }

        updateCart();

        // Small visual confirmation
        button.textContent = "✓ Added!";

        setTimeout(() => {
            button.textContent = "Add to Cart";
        }, 1000);
    }

    function updateCart() {
        console.log("Cart:", cart);
    }
};
