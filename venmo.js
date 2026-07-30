"use strict";

const VENMO_USERNAME = "Crystal-Christy";
const SALES_STORAGE_KEY = "lemonadeSales";
const TIP_PRODUCT_NAME = "Tip";
const TIP_AMOUNT = 1;
const GAME_BEST_SCORE_KEY = "lemonadeBestScore";
const GAME_DURATION_SECONDS = 20;
const GAME_STARTING_LIVES = 3;
const GAME_PLAYER_SIZE = 72;
const GAME_PLAYER_BOTTOM = 16;
const GAME_SPAWN_INTERVAL_MS = 650;
const GAME_ITEM_POOL = Object.freeze([
  {
    name: "lemon",
    icon: String.fromCodePoint(0x1F34B),
    points: 1,
    speedMin: 180,
    speedMax: 250,
    size: 42,
    bad: false
  },
  {
    name: "strawberry",
    icon: String.fromCodePoint(0x1F353),
    points: 2,
    speedMin: 190,
    speedMax: 260,
    size: 42,
    bad: false
  },
  {
    name: "peach",
    icon: String.fromCodePoint(0x1F351),
    points: 2,
    speedMin: 190,
    speedMax: 255,
    size: 42,
    bad: false
  },
  {
    name: "water",
    icon: String.fromCodePoint(0x1F4A7),
    points: 1,
    speedMin: 230,
    speedMax: 300,
    size: 36,
    bad: false
  },
  {
    name: "pickle",
    icon: String.fromCodePoint(0x1F952),
    points: -2,
    speedMin: 220,
    speedMax: 290,
    size: 44,
    bad: true
  }
]);
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
const gameState = {
  running: false,
  score: 0,
  timeLeft: GAME_DURATION_SECONDS,
  lives: GAME_STARTING_LIVES,
  best: 0,
  items: [],
  playerX: 0,
  animationFrameId: 0,
  spawnIntervalId: 0,
  clockIntervalId: 0,
  lastFrameTime: null
};

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

function loadGameBestScore() {
  try {
    const savedBest = Number.parseInt(localStorage.getItem(GAME_BEST_SCORE_KEY), 10);
    return Number.isFinite(savedBest) && savedBest > 0 ? savedBest : 0;
  } catch (error) {
    console.warn("Could not load game score:", error);
    return 0;
  }
}

function saveGameBestScore(score) {
  try {
    localStorage.setItem(GAME_BEST_SCORE_KEY, String(score));
  } catch (error) {
    console.warn("Could not save game score:", error);
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

function getGameBoard() {
  return document.getElementById("gameBoard");
}

function getGamePlayer() {
  return document.getElementById("gamePlayer");
}

function isGameOpen() {
  return document.getElementById("gameModal").style.display === "flex";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderGameHud() {
  document.getElementById("gameScore").textContent = String(gameState.score);
  document.getElementById("gameTime").textContent = String(gameState.timeLeft);
  document.getElementById("gameLives").textContent = String(gameState.lives);
  document.getElementById("gameBest").textContent = String(gameState.best);
}

function setGameStatus(message) {
  document.getElementById("gameStatus").textContent = message;
}

function clearGameItems() {
  gameState.items.forEach((item) => {
    item.element.remove();
  });
  gameState.items = [];
}

function removeGameItemAt(index) {
  const item = gameState.items[index];

  if (!item) {
    return;
  }

  item.element.remove();
  gameState.items.splice(index, 1);
}

function setGamePlayerPosition(nextX) {
  const board = getGameBoard();
  const maxX = Math.max(0, board.clientWidth - GAME_PLAYER_SIZE);
  const player = getGamePlayer();

  gameState.playerX = clamp(nextX, 0, maxX);
  player.style.transform = "translateX(" + gameState.playerX.toFixed(1) + "px)";
}

function centerGamePlayer() {
  const board = getGameBoard();
  setGamePlayerPosition((board.clientWidth - GAME_PLAYER_SIZE) / 2);
}

function moveGamePlayerFromClientX(clientX) {
  const board = getGameBoard();
  const boardRect = board.getBoundingClientRect();
  const nextX = clientX - boardRect.left - GAME_PLAYER_SIZE / 2;

  setGamePlayerPosition(nextX);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickGameItemType() {
  const itemIndex = Math.floor(Math.random() * GAME_ITEM_POOL.length);
  return GAME_ITEM_POOL[itemIndex];
}

function positionGameItem(item) {
  item.element.style.transform =
    "translate(" + item.x.toFixed(1) + "px, " + item.y.toFixed(1) + "px)";
}

function spawnGameItem() {
  if (!gameState.running) {
    return;
  }

  const board = getGameBoard();
  const itemType = pickGameItemType();
  const itemElement = document.createElement("div");
  const size = itemType.size;
  const maxX = Math.max(0, board.clientWidth - size);
  const item = {
    x: Math.random() * maxX,
    y: -size,
    size: size,
    speed: randomBetween(itemType.speedMin, itemType.speedMax),
    points: itemType.points,
    bad: itemType.bad,
    name: itemType.name,
    element: itemElement
  };

  itemElement.className = "game-item " + (item.bad ? "bad" : "good");
  itemElement.style.width = size + "px";
  itemElement.style.height = size + "px";
  itemElement.style.fontSize = Math.round(size * 0.72) + "px";
  itemElement.textContent = itemType.icon;

  board.appendChild(itemElement);
  positionGameItem(item);
  gameState.items.push(item);
}

function didCatchGameItem(item, boardHeight) {
  const playerLeft = gameState.playerX;
  const playerRight = playerLeft + GAME_PLAYER_SIZE;
  const playerTop = boardHeight - GAME_PLAYER_BOTTOM - GAME_PLAYER_SIZE;
  const playerBottom = playerTop + GAME_PLAYER_SIZE;
  const hitPadding = 10;

  return (
    item.x + item.size - hitPadding > playerLeft &&
    item.x + hitPadding < playerRight &&
    item.y + item.size - hitPadding > playerTop &&
    item.y + hitPadding < playerBottom
  );
}

function stopGameLoop() {
  gameState.running = false;

  if (gameState.animationFrameId) {
    window.cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = 0;
  }

  if (gameState.spawnIntervalId) {
    window.clearInterval(gameState.spawnIntervalId);
    gameState.spawnIntervalId = 0;
  }

  if (gameState.clockIntervalId) {
    window.clearInterval(gameState.clockIntervalId);
    gameState.clockIntervalId = 0;
  }

  gameState.lastFrameTime = null;
}

function getGameCatchMessage(item) {
  if (item.name === "water") {
    return "Nice pour.";
  }

  if (item.points > 1) {
    return "Flavor boost.";
  }

  return "Fresh catch.";
}

function finishGame(message) {
  stopGameLoop();
  clearGameItems();

  if (gameState.score > gameState.best) {
    gameState.best = gameState.score;
    saveGameBestScore(gameState.best);
    message = "New best score: " + gameState.best + ". " + message;
  }

  renderGameHud();
  setGameStatus(message);
  document.getElementById("gameStartButton").textContent = "Play Again";
}

function handleGameCatch(item) {
  if (item.bad) {
    gameState.lives -= 1;
    setGameStatus("Pickles do not go in lemonade.");

    if (gameState.lives <= 0) {
      gameState.lives = 0;
      renderGameHud();
      finishGame("Shift over. The pickles won this round.");
      return;
    }
  } else {
    gameState.score += item.points;
    setGameStatus(getGameCatchMessage(item));
  }

  renderGameHud();
}

function updateGameItems(deltaMs) {
  const board = getGameBoard();
  const boardHeight = board.clientHeight;

  for (let index = gameState.items.length - 1; index >= 0; index -= 1) {
    const item = gameState.items[index];

    item.y += item.speed * (deltaMs / 1000);

    if (didCatchGameItem(item, boardHeight)) {
      handleGameCatch(item);
      removeGameItemAt(index);

      if (!gameState.running) {
        return;
      }

      continue;
    }

    if (item.y > boardHeight + item.size) {
      removeGameItemAt(index);
      continue;
    }

    positionGameItem(item);
  }
}

function stepGame(frameTime) {
  if (!gameState.running) {
    return;
  }

  if (gameState.lastFrameTime === null) {
    gameState.lastFrameTime = frameTime;
  }

  const deltaMs = Math.min(32, frameTime - gameState.lastFrameTime);
  gameState.lastFrameTime = frameTime;

  updateGameItems(deltaMs);

  if (gameState.running) {
    gameState.animationFrameId = window.requestAnimationFrame(stepGame);
  }
}

function tickGameClock() {
  if (!gameState.running) {
    return;
  }

  gameState.timeLeft -= 1;

  if (gameState.timeLeft <= 0) {
    gameState.timeLeft = 0;
    renderGameHud();
    finishGame("Time is up. Final score: " + gameState.score + ".");
    return;
  }

  renderGameHud();
}

function resetGamePanel() {
  stopGameLoop();
  clearGameItems();
  gameState.best = loadGameBestScore();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION_SECONDS;
  gameState.lives = GAME_STARTING_LIVES;
  renderGameHud();
  setGameStatus("Catch fruit and water for the stand. Dodge the pickles.");
  document.getElementById("gameStartButton").textContent = "Start Game";
  centerGamePlayer();
}

function openGame() {
  closeCart();
  closeCheckout();
  closeStats();
  document.getElementById("gameModal").style.display = "flex";
  window.requestAnimationFrame(resetGamePanel);
}

function closeGame() {
  if (!isGameOpen()) {
    return;
  }

  resetGamePanel();
  document.getElementById("gameModal").style.display = "none";
}

function startGame() {
  stopGameLoop();
  clearGameItems();
  gameState.best = loadGameBestScore();
  gameState.score = 0;
  gameState.timeLeft = GAME_DURATION_SECONDS;
  gameState.lives = GAME_STARTING_LIVES;
  gameState.running = true;
  gameState.lastFrameTime = null;
  renderGameHud();
  setGameStatus("Catch the ingredients. Keep the pickles out.");
  document.getElementById("gameStartButton").textContent = "Restart Game";
  centerGamePlayer();
  spawnGameItem();
  gameState.spawnIntervalId = window.setInterval(spawnGameItem, GAME_SPAWN_INTERVAL_MS);
  gameState.clockIntervalId = window.setInterval(tickGameClock, 1000);
  gameState.animationFrameId = window.requestAnimationFrame(stepGame);
}

function handleGamePointer(event) {
  if (!isGameOpen()) {
    return;
  }

  moveGamePlayerFromClientX(event.clientX);
}

function handleGameTouch(event) {
  if (!isGameOpen() || event.touches.length === 0) {
    return;
  }

  event.preventDefault();
  moveGamePlayerFromClientX(event.touches[0].clientX);
}

function handleGameKeyboard(event) {
  if (!isGameOpen()) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setGamePlayerPosition(gameState.playerX - 36);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    setGamePlayerPosition(gameState.playerX + 36);
    return;
  }

  if ((event.key === " " || event.key === "Enter") && !gameState.running) {
    event.preventDefault();
    startGame();
  }
}

function handleGameResize() {
  if (!isGameOpen()) {
    return;
  }

  if (gameState.running) {
    setGamePlayerPosition(gameState.playerX);
  } else {
    centerGamePlayer();
  }
}

function initializeGameControls() {
  const board = getGameBoard();

  board.addEventListener("mousemove", handleGamePointer);
  board.addEventListener("mousedown", handleGamePointer);
  board.addEventListener("touchstart", handleGameTouch, { passive: false });
  board.addEventListener("touchmove", handleGameTouch, { passive: false });
  window.addEventListener("keydown", handleGameKeyboard);
  window.addEventListener("resize", handleGameResize);
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
  const gameModal = document.getElementById("gameModal");
  const statsModal = document.getElementById("statsModal");

  if (event.target === cartModal) {
    closeCart();
  }

  if (event.target === checkoutModal) {
    closeCheckout();
  }

  if (event.target === gameModal) {
    closeGame();
  }

  if (event.target === statsModal) {
    closeStats();
  }
});

gameState.best = loadGameBestScore();
renderGameHud();
initializeGameControls();
updateCart();
updateStats();
