// ==============================
// VENMO SETTINGS
// ==============================

const venmoUsername = "Crystal-Christy";


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
