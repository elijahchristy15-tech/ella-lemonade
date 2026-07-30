"use strict";

const VENMO_USERNAME = "Crystal-Christy";
const SALES_STORAGE_KEY = "lemonadeSales";
const TIP_PRODUCT_NAME = "Tip";
const TIP_AMOUNT = 1;
const EMPTY_STATS = Object.freeze({
  money: 0,
  orders: 0,
  items: 0,
  classic: 0,
  strawberry: 0,
  raspberry: 0,
  peach: 0,
  pickle: 0,
  water: 0,
  tip: 0
});

let cart = [];

function cloneEmptyStats() {
  return { ...EMPTY_STATS };
}

function loadSales() {
  try {
    const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
    const parsedSales = storedSales ? JSON.parse(storedSales) : [];

    return Array.isArray(parsedSales) ? parsedSales : [];
  } catch (error) {
    console.warn("Could not load local sales:", error);
    return [];
  }
}

function saveSales(sales) {
  try {
    localStorage.setItem(
      SALES_STORAGE_KEY,
      JSON.stringify(sales)
    );
  } catch (error) {
    console.warn("Could not save local sales:", error);
  }
}

function renderStats(stats) {
  document.getElementById("statMoney").textContent = "$" + stats.money.toFixed(2);
  document.getElementById("statOrders").textContent = String(stats.orders);
  document.getElementById("statItems").textContent = String(stats.items);
  document.getElementById("statClassic").textContent = String(stats.classic);
  document.getElementById("statStrawberry").textContent = String(stats.strawberry);
  document.getElementById("statRaspberry").textContent = String(stats.raspberry);
  document.getElementById("statPeach").textContent = String(stats.peach);
  document.getElementById("statPickle").textContent = String(stats.pickle);
  document.getElementById("statWater").textContent = String(stats.water);
  document.getElementById("statTip").textContent = String(stats.tip);
}

function applyItemToStats(stats, sale) {
  const quantity = Number(sale.quantity) || 0;
  const amount = Number(sale.amount) || 0;

  stats.money += amount;
  stats.items += quantity;

  if (sale.product === "Classic Lemonade") {
    stats.classic += quantity;
  } else if (sale.product === "Strawberry Lemonade") {
    stats.strawberry += quantity;
  } else if (sale.product === "Raspberry Lemonade") {
    stats.raspberry += quantity;
  } else if (sale.product === "Peach Lemonade") {
    stats.peach += quantity;
  } else if (sale.product === "Pickle") {
    stats.pickle += quantity;
  } else if (sale.product === "Water") {
    stats.water += quantity;
  } else if (sale.product === TIP_PRODUCT_NAME) {
    stats.tip += quantity;
  }
}

function buildStatsFromSales(sales) {
  const stats = cloneEmptyStats();
  const orderIds = new Set();

  sales.forEach((sale) => {
    applyItemToStats(stats, sale);

    if (sale.order_id) {
      orderIds.add(sale.order_id);
    }
  });

  stats.orders = orderIds.size;

  return stats;
}

function updateStats() {
  renderStats(buildStatsFromSales(loadSales()));
}

function toggleFlavors() {
  const list = document.getElementById("flavor-list");
  list.classList.toggle("hidden");
}

function getFlavorName() {
  const flavor = prompt(
    "Choose a flavor:\n\n" +
      "1 - Strawberry\n" +
      "2 - Raspberry\n" +
      "3 - Peach"
  );

  if (!flavor) {
    return null;
  }

  if (flavor === "1") {
    return "Strawberry Lemonade";
  }

  if (flavor === "2") {
    return "Raspberry Lemonade";
  }

  if (flavor === "3") {
    return "Peach Lemonade";
  }

  alert("Please enter 1, 2, or 3.");
  return null;
}

function addCartItem(name, price, quantity = 1) {
  const normalizedPrice = Number(price);
  const normalizedQuantity = Number(quantity) || 0;

  if (!name || !Number.isFinite(normalizedPrice) || normalizedQuantity <= 0) {
    return;
  }

  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.quantity += normalizedQuantity;
  } else {
    cart.push({
      name: name,
      price: normalizedPrice,
      quantity: normalizedQuantity
    });
  }

  updateCart();
}

function addToCart(button) {
  const card = button.closest(".card");
  let name = card.dataset.name;
  const price = Number.parseFloat(card.dataset.price);

  if (name === "Flavored Lemonade") {
    name = getFlavorName();

    if (!name) {
      return;
    }
  }

  addCartItem(name, price);

  button.textContent = "Added!";

  window.setTimeout(() => {
    button.textContent = "Add to Cart";
  }, 1000);
}

function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  let total = 0;
  let itemCount = 0;

  cartItems.innerHTML = "";

  cart.forEach((item, index) => {
    const itemPrice = Number(item.price) || 0;
    const itemTotal = itemPrice * item.quantity;
    const itemElement = document.createElement("div");

    total += itemTotal;
    itemCount += item.quantity;

    itemElement.className = "cart-item";
    itemElement.innerHTML =
      '<div class="cart-item-info">' +
      '  <div class="cart-item-name">' + item.name + "</div>" +
      '  <div class="cart-item-price">$' + itemPrice.toFixed(2) + " each</div>" +
      "</div>" +
      '<div class="quantity-controls">' +
      '  <button type="button" onclick="changeQuantity(' + index + ', -1)">&minus;</button>' +
      '  <span class="quantity">' + item.quantity + "</span>" +
      '  <button type="button" onclick="changeQuantity(' + index + ', 1)">+</button>' +
      "</div>";

    cartItems.appendChild(itemElement);
  });

  cartCount.textContent = String(itemCount);
  cartTotal.textContent = total.toFixed(2);
}

function changeQuantity(index, amount) {
  const item = cart[index];

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }

  updateCart();
}

function openCart() {
  updateCart();
  document.getElementById("cartModal").style.display = "flex";
}

function closeCart() {
  document.getElementById("cartModal").style.display = "none";
}

function openCheckout() {
  const checkoutSummary = document.getElementById("checkoutSummary");
  const checkoutTotal = document.getElementById("checkoutTotal");
  const paymentStatus = document.getElementById("paymentStatus");
  let summary = "";
  let total = 0;

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  paymentStatus.textContent = "";
  paymentStatus.style.color = "";

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    total += itemTotal;
    summary +=
      "<p><strong>" +
      item.name +
      "</strong> x " +
      item.quantity +
      " - $" +
      itemTotal.toFixed(2) +
      "</p>";
  });

  checkoutSummary.innerHTML = summary;
  checkoutTotal.textContent = total.toFixed(2);

  closeCart();
  document.getElementById("checkoutModal").style.display = "flex";
}

function closeCheckout() {
  document.getElementById("checkoutModal").style.display = "none";
}

function payWithVenmo() {
  const venmoUrl = "https://venmo.com/u/" + VENMO_USERNAME;
  window.open(venmoUrl, "_blank", "noopener");
}

function TipJar() {
  const TipUrl = "https://venmo.com/u/" + VENMO_USERNAME
  window.open(TipUrl, "_blank", "noopener")
}

function AddTip() {
  addCartItem(TIP_PRODUCT_NAME, TIP_AMOUNT);
}


function recordSale() {
  if (cart.length === 0) {
    return false;
  }

  const orderId =
    window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : "order-" + Date.now();

  const existingSales = loadSales();
  const newSales = cart.map((item) => ({
    order_id: orderId,
    product: item.name,
    quantity: item.quantity,
    amount: (Number(item.price) || 0) * item.quantity,
    created_at: new Date().toISOString()
  }));

  saveSales(existingSales.concat(newSales));
  updateStats();

  return true;
}

function confirmPayment() {
  const paymentStatus = document.getElementById("paymentStatus");

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const success = recordSale();

  if (!success) {
    return;
  }

  paymentStatus.textContent = "Payment marked as sent! Saved on this device.";
  paymentStatus.style.color = "green";

  cart = [];
  updateCart();

  document.getElementById("checkoutSummary").innerHTML = "<p>Thanks! Your order was recorded.</p>";
  document.getElementById("checkoutTotal").textContent = "0.00";
}

function openStats() {
  updateStats();
  document.getElementById("statsModal").style.display = "flex";
}

function closeStats() {
  document.getElementById("statsModal").style.display = "none";
}

function resetStats() {
  const confirmed = confirm("Are you sure you want to reset all sales?");

  if (!confirmed) {
    return;
  }

  saveSales([]);
  updateStats();
  alert("Stats have been reset!");
}

window.addEventListener("click", (event) => {
  const cartModal = document.getElementById("cartModal");
  const checkoutModal = document.getElementById("checkoutModal");
  const statsModal = document.getElementById("statsModal");

  if (event.target === cartModal) {
    closeCart();
  }

  if (event.target === checkoutModal) {
    closeCheckout();
  }

  if (event.target === statsModal) {
    closeStats();
  }
});

updateCart();
updateStats();
