/* =====================================================
   FOODGENIE - FRONTEND JAVASCRIPT
   Backend: FastAPI at 127.0.0.1:8000
===================================================== */

const API = " https://foodgenie-xo2j.onrender.com";

let cart = [];
let groceryCart = [];
let currentRestaurants = [];
let displayedRestaurants = [];
let orderHistory = [];
let chatbotVoiceEnabled = true;
let activeRecognition = null;

let authMode = "login";
let selectedRestaurant = "";
let currentSearch = "";


// ================= DEMO RECIPE DATA =================

const recipes = [
    {
        id: 1,
        name: "Paneer Butter Masala",
        category: "Vegetarian",
        time: "30 min",
        difficulty: "Medium",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
        description: "Creamy tomato-based paneer curry.",
        steps: [
            "Melt butter in a pan and sauté the chopped tomatoes until soft.",
            "Add ginger-garlic paste and cook until the raw smell disappears.",
            "Blend the tomato mixture into a smooth puree.",
            "Return the puree to the pan; add spices, salt and a little water.",
            "Stir in cream and paneer cubes; simmer for 5–7 minutes.",
            "Finish with a little butter and serve hot with naan or rice."
        ],
        ingredients: [
            { name: "Paneer", price: 100 },
            { name: "Tomatoes", price: 30 },
            { name: "Cream", price: 50 },
            { name: "Butter", price: 40 }
        ]
    },
    {
        id: 2,
        name: "Veg Fried Rice",
        category: "Chinese",
        time: "20 min",
        difficulty: "Easy",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
        description: "Quick vegetable fried rice.",
        steps: [
            "Rinse and cook the rice; spread it out to cool so the grains stay separate.",
            "Heat oil in a wok and sauté chopped garlic and vegetables.",
            "Add soy sauce, salt and pepper; toss on high heat.",
            "Add the cooled rice and mix gently until heated through.",
            "Taste, adjust seasoning and garnish with spring onion."
        ],
        ingredients: [
            { name: "Rice", price: 40 },
            { name: "Carrot", price: 20 },
            { name: "Capsicum", price: 25 },
            { name: "Soy Sauce", price: 35 }
        ]
    },
    {
        id: 3,
        name: "Fresh Garden Salad",
        category: "Healthy",
        time: "15 min",
        difficulty: "Easy",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
        description: "A refreshing and healthy salad.",
        steps: [
            "Wash and dry the lettuce and all vegetables thoroughly.",
            "Chop cucumber and tomatoes into bite-sized pieces.",
            "Tear the lettuce and combine everything in a bowl.",
            "Whisk olive oil with lemon juice, salt and pepper.",
            "Pour the dressing over the salad, toss and serve immediately."
        ],
        ingredients: [
            { name: "Lettuce", price: 40 },
            { name: "Cucumber", price: 20 },
            { name: "Tomato", price: 20 },
            { name: "Olive Oil", price: 70 }
        ]
    },
    {
        id: 4,
        name: "Homemade Pizza",
        category: "Italian",
        time: "40 min",
        difficulty: "Medium",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        description: "Cheesy homemade pizza.",
        steps: [
            "Preheat the oven to 220°C (425°F).",
            "Place the pizza base on a baking tray and spread tomato sauce over it.",
            "Add chopped vegetables and a generous layer of cheese.",
            "Bake for 10–15 minutes, until the cheese melts and the crust turns golden.",
            "Allow it to cool briefly, slice and serve."
        ],
        ingredients: [
            { name: "Pizza Base", price: 60 },
            { name: "Cheese", price: 90 },
            { name: "Tomato Sauce", price: 35 },
            { name: "Vegetables", price: 40 }
        ]
    },
    {
        id: 5,
        name: "Chocolate Dessert",
        category: "Dessert",
        time: "25 min",
        difficulty: "Easy",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
        description: "A delicious chocolate treat.",
        steps: [
            "Preheat the oven to 180°C (350°F) and grease a small baking tin.",
            "Mix flour, sugar and melted chocolate in a bowl.",
            "Add milk gradually and stir into a smooth batter.",
            "Pour the batter into the tin and bake for 20–25 minutes.",
            "Cool before slicing; serve as it is or with a little cream."
        ],
        ingredients: [
            { name: "Chocolate", price: 80 },
            { name: "Flour", price: 30 },
            { name: "Sugar", price: 25 },
            { name: "Milk", price: 30 }
        ]
    },
    {
        id: 6,
        name: "Chicken Biryani",
        category: "Non-Vegetarian",
        time: "50 min",
        difficulty: "Hard",
        image: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800",
        description: "Aromatic chicken biryani.",
        steps: [
            "Marinate chicken with yogurt, salt, chilli, turmeric and biryani spices for at least 20 minutes.",
            "Wash and soak the rice for 20 minutes, then boil until about 70% cooked.",
            "Fry sliced onions until golden; add ginger-garlic paste and the marinated chicken.",
            "Cook the chicken until nearly done and the masala is fragrant.",
            "Layer the partially cooked rice over the chicken; add herbs and a little water if needed.",
            "Cover tightly and cook on low heat for 15–20 minutes until the rice and chicken are fully cooked.",
            "Rest for 5 minutes, gently fluff and serve hot."
        ],
        ingredients: [
            { name: "Rice", price: 40 },
            { name: "Chicken", price: 150 },
            { name: "Yogurt", price: 35 },
            { name: "Spices", price: 45 }
        ]
    }
];


// ================= UTILITIES =================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return Number(value || 0).toLocaleString("en-IN");
}

function getCost(item) {
    return Number(item.cost ?? item["approx_cost(for two people)"] ?? 0);
}

function getName(item) {
    return item.name || "Restaurant";
}

const FALLBACK_FOOD_IMAGE =
    "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=900";

function imageWithFallback(url) {
    return escapeHTML(url || FALLBACK_FOOD_IMAGE);
}

function handleImageError(image) {
    image.onerror = null;
    image.src = FALLBACK_FOOD_IMAGE;
    image.classList.add("image-fallback");
}

function extractBudgetFromText(text) {
    const match = String(text).match(
        /(?:under|below|less than|upto|up to|within|budget(?: of)?)\s*₹?\s*(\d+)/i
    );

    return match ? Number(match[1]) : null;
}

async function apiRequest(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(`${API}${endpoint}`, {
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            }
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to FoodGenie backend. Please start the FastAPI server."
        );
    }

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    return response.json();
}

function showNotification(message) {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.classList.remove("hidden");

    clearTimeout(window.foodGenieNotificationTimer);

    window.foodGenieNotificationTimer = setTimeout(() => {
        notification.classList.add("hidden");
    }, 3000);
}

function setLoading(element, message) {
    if (element) {
        element.innerHTML = `
            <div class="empty-state">
                <span>✨</span>
                <h3>${escapeHTML(message)}</h3>
            </div>
        `;
    }
}
// ================= NAVIGATION =================

function showHome() {
    document.getElementById("homePage")?.classList.remove("hidden");
    document.getElementById("recipesPage")?.classList.add("hidden");
    document.getElementById("mobileMenu")?.classList.add("hidden");
    document.getElementById("bookingsPage")?.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showRecipes() {
    document.getElementById("homePage")?.classList.add("hidden");
    document.getElementById("recipesPage")?.classList.remove("hidden");
    document.getElementById("bookingsPage")?.classList.add("hidden");
    document.getElementById("mobileMenu")?.classList.add("hidden");

    renderRecipes("allRecipesGrid");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMobileMenu() {
    document.getElementById("mobileMenu")?.classList.toggle("hidden");
}


// ================= FOOD SEARCH =================

async function searchFood(query = null, explicitBudget = null) {
    const input = document.getElementById("query");

    const q = String(query ?? input?.value ?? "").trim();

    if (!q) {
        showNotification("Please enter a food or cuisine to search.");
        return;
    }

    if (input) input.value = q;

    currentSearch = q;

    showHome();

    const results = document.getElementById("results");
    const status = document.getElementById("searchStatus");

    setLoading(results, "Finding delicious restaurants...");

    if (status) {
        status.textContent = `Searching for "${q}"...`;
    }

    try {
        const params = new URLSearchParams({
            query: q,
            top_n: "30"
        });

        // Budget can come from chatbot query or the budget dropdown.
        const parsedBudget = extractBudgetFromText(q);

        const dropdownBudget = Number(
            document.getElementById("budgetFilter")?.value || 0
        );

        const budget = explicitBudget !== null
            ? Number(explicitBudget)
            : parsedBudget !== null
                ? parsedBudget
                : dropdownBudget || null;

        if (budget !== null && budget > 0) {
            params.set("max_price", String(budget));
        }

        const data = await apiRequest(
            `/recommend?${params.toString()}`
        );

        if (!Array.isArray(data)) {
            throw new Error("Unexpected recommendation response.");
        }

        // Frontend safety filter: never display results over the budget.
        let filteredData = data;

        if (budget !== null && budget > 0) {
            filteredData = data.filter(item => getCost(item) <= budget);
        }

        currentRestaurants = filteredData;
        displayedRestaurants = filteredData;

        renderRestaurants();

        if (status) {
            status.textContent = filteredData.length
                ? `${filteredData.length} restaurants found for "${q}"`
                : `No restaurants found within ₹${money(budget)}.`;
        }

        document.getElementById("restaurants")?.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        if (results) {
            results.innerHTML = `
                <div class="empty-state">
                    <span>⚠️</span>
                    <h3>Unable to load restaurants</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }

        if (status) {
            status.textContent = "Search could not be completed.";
        }
    }
}

function quickSearch(query) {
    searchFood(query);
}


// ================= RESTAURANT FILTERS =================

function applyRestaurantFilters() {
    renderRestaurants();
}

function renderRestaurants() {
    const container = document.getElementById("results");
    if (!container) return;

    let items = [...currentRestaurants];

    const budget = Number(
        document.getElementById("budgetFilter")?.value || 0
    );

    const sort =
        document.getElementById("sortFilter")?.value || "recommended";

    // Strict budget filtering.
    if (budget > 0) {
        items = items.filter(item => getCost(item) <= budget);
    }

    if (sort === "rating") {
        items.sort(
            (a, b) => Number(b.rate || 0) - Number(a.rate || 0)
        );
    } else if (sort === "cost_low") {
        items.sort(
            (a, b) => getCost(a) - getCost(b)
        );
    } else if (sort === "cost_high") {
        items.sort(
            (a, b) => getCost(b) - getCost(a)
        );
    }

    // Keep the exact displayed order for card button indexes.
    displayedRestaurants = items;

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🔎</span>
                <h3>No restaurants match your budget</h3>
                <p>Try increasing your budget or changing your search.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, index) => `
        <article class="card restaurant-card">

            <img
                src="${imageWithFallback(item.image)}"
                alt="${escapeHTML(getName(item))}"
                loading="lazy"
                onerror="handleImageError(this)"
            >

            <div class="restaurant-card-content">

                <h3>${escapeHTML(getName(item))}</h3>

                <p>
                    📍 ${escapeHTML(item.location || "Location unavailable")}
                </p>

                <p>
                    🍴 ${escapeHTML(item.cuisines || "Cuisine unavailable")}
                </p>

                <p>
                    ⭐ ${escapeHTML(item.rate || "Not rated")}
                </p>

                <p>
                    ₹${money(getCost(item))} for two
                </p>

                <p>
                    🍽️ ${escapeHTML(
                        (item.popular_dishes || [])
                            .slice(0, 3)
                            .join(", ") || "No dishes listed"
                    )}
                </p>

                <div class="restaurant-actions">

                    <button
                        type="button"
                        onclick="openRestaurantDetails(${index})"
                    >
                        View Restaurant
                    </button>

                    <button
                        type="button"
                        onclick="addRestaurantToCart(${index})"
                    >
                        Add to Cart
                    </button>

                </div>

            </div>
        </article>
    `).join("");
}


// ================= RESTAURANT DETAILS =================

async function openRestaurantDetails(index) {
    const item = displayedRestaurants[index];

    if (!item) {
        showNotification("Restaurant not found.");
        return;
    }

    selectedRestaurant = getName(item);

    const modal = document.getElementById("restaurantModal");
    const content = document.getElementById("restaurantDetails");

    modal?.classList.remove("hidden");

    setLoading(content, "Loading restaurant details...");

    try {
        const data = await apiRequest(
            `/restaurant-detail?name=${encodeURIComponent(selectedRestaurant)}`
        );

        if (!data.found) {
            throw new Error("Restaurant details not found.");
        }

        // Preserve the selected restaurant data for cart and details.
        const restaurant = {
            ...item,
            ...data
        };

        content.innerHTML = `
            <img
                src="${imageWithFallback(data.image || item.image)}"
                alt="${escapeHTML(data.name || selectedRestaurant)}"
                style="width:100%;height:230px;object-fit:cover;border-radius:14px;"
                onerror="handleImageError(this)"
            >

            <h2>${escapeHTML(data.name || selectedRestaurant)}</h2>

            <p>
                📍 ${escapeHTML(data.location || item.location || "Not available")}
            </p>

            <p>
                🍴 ${escapeHTML(data.cuisines || item.cuisines || "Not available")}
            </p>

            <p>
                ⭐ ${escapeHTML(data.rate || item.rate || "Not rated")}
            </p>

            <p>
                ₹${money(data.cost ?? getCost(item))} for two
            </p>

            <p>
                🏷️ ${escapeHTML(data.rest_type || "Restaurant")}
            </p>

            <h3>Popular Dishes</h3>

            <p>
                ${escapeHTML(
                    (data.popular_dishes || item.popular_dishes || [])
                        .join(", ") || "Not available"
                )}
            </p>

            <div class="restaurant-actions">

                <button
                    type="button"
                    onclick="addSelectedRestaurantToCart()"
                >
                    Add to Cart
                </button>

                <button
                    type="button"
                    onclick="openBooking()"
                >
                    Book a Table
                </button>

            </div>
        `;

        window.selectedRestaurantData = restaurant;

    } catch (error) {
        // If the detail endpoint fails, still show the available card data.
        content.innerHTML = `
            <img
                src="${imageWithFallback(item.image)}"
                alt="${escapeHTML(getName(item))}"
                style="width:100%;height:230px;object-fit:cover;border-radius:14px;"
                onerror="handleImageError(this)"
            >

            <h2>${escapeHTML(getName(item))}</h2>

            <p>📍 ${escapeHTML(item.location || "Not available")}</p>
            <p>🍴 ${escapeHTML(item.cuisines || "Not available")}</p>
            <p>⭐ ${escapeHTML(item.rate || "Not rated")}</p>
            <p>₹${money(getCost(item))} for two</p>

            <p>${escapeHTML(error.message)}</p>

            <button
                type="button"
                onclick="addRestaurantToCart(${index})"
            >
                Add to Cart
            </button>
        `;
    }
}

function addSelectedRestaurantToCart() {
    if (!window.selectedRestaurantData) {
        showNotification("Please select a restaurant first.");
        return;
    }

    addToCart(window.selectedRestaurantData);
}

function closeRestaurantDetails() {
    document.getElementById("restaurantModal")?.classList.add("hidden");
}


// ================= FOOD CART =================

function addRestaurantToCart(index) {
    const item = displayedRestaurants[index];

    if (!item) {
        showNotification("Restaurant not found.");
        return;
    }

    const existing = cart.find(
        entry =>
            entry.name === getName(item) &&
            entry.location === (item.location || "")
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name: getName(item),
            location: item.location || "",
            price: getCost(item),
            quantity: 1
        });
    }

    updateCart();

    showNotification(`${getName(item)} added to your cart!`);
}

function addToCart(item) {
    const name = getName(item);

    const existing = cart.find(
        entry =>
            entry.name === name &&
            entry.location === (item.location || "")
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name,
            location: item.location || "",
            price: Number(item.price ?? item.cost ?? 0),
            quantity: 1
        });
    }

    updateCart();

    showNotification(`${name} added to your cart!`);
}

function changeCartQuantity(index, amount) {
    if (!cart[index]) return;

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCart();
}

function removeCartItem(index) {
    if (index < 0 || index >= cart.length) return;

    cart.splice(index, 1);

    updateCart();
}

function updateCart() {
    const container = document.getElementById("cartItems");
    const totalElement = document.getElementById("total");
    const countElement = document.getElementById("cartCount");

    const count = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    if (countElement) {
        countElement.textContent = count;
    }

    if (totalElement) {
        totalElement.textContent = money(total);
    }

    if (!container) return;

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>🛒</span>
                <h3>Your cart is empty</h3>
                <p>Discover something delicious!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">

            <div class="cart-item-info">
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.location)}</p>
                <p>₹${money(item.price)} per order (for two)</p>
            </div>

            <div class="cart-quantity-controls">

                <button
                    type="button"
                    onclick="changeCartQuantity(${index}, -1)"
                >−</button>

                <span>${item.quantity}</span>

                <button
                    type="button"
                    onclick="changeCartQuantity(${index}, 1)"
                >+</button>

            </div>

            <button
                type="button"
                onclick="removeCartItem(${index})"
            >
                Remove
            </button>

            <strong>
                ₹${money(item.price * item.quantity)}
            </strong>

        </div>
    `).join("");
}

function openCart() {
    updateCart();
    document.getElementById("cartModal")?.classList.remove("hidden");
}

function closeCart() {
    document.getElementById("cartModal")?.classList.add("hidden");
}
// ================= CHECKOUT =================

function placeOrder() {
    if (!cart.length) {
        showNotification("Your cart is empty!");
        return;
    }

    closeCart();

    document.getElementById("checkoutModal")
        ?.classList.remove("hidden");
}

function closeCheckout() {
    document.getElementById("checkoutModal")
        ?.classList.add("hidden");
}

async function submitCheckout(event) {
    event.preventDefault();

    if (!cart.length) {
        showNotification("Your cart is empty!");
        return;
    }

    const form = document.getElementById("checkoutForm");
    if (!form) return;

    const formData = new FormData(form);

    const name = formData.get("name");
    const phone = formData.get("phone");
    const city = formData.get("city");
    const pincode = formData.get("pincode");
    const addressLine = formData.get("address");
    const payment = formData.get("payment");

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const button = form.querySelector('button[type="submit"]');

    if (button) {
        button.disabled = true;
        button.textContent = "Placing Order...";
    }

    try {
        const result = await apiRequest("/place-order", {
            method: "POST",
            body: JSON.stringify({
                items: cart,
                total,
                payment,
                address: {
                    name,
                    phone,
                    city,
                    pincode,
                    address: addressLine
                }
            })
        });

        if (!result.success) {
            throw new Error("Order could not be placed.");
        }

        orderHistory.unshift(result.order);

        cart = [];
        updateCart();

        closeCheckout();
        form.reset();

        renderOrderHistory();

        showNotification(
            `Order placed successfully! ID: ${result.order.id}`
        );

    } catch (error) {
        showNotification(error.message);

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Confirm Order";
        }
    }
}


// ================= ORDER HISTORY =================

function renderOrderHistory() {
    const container = document.getElementById("orderHistory");
    if (!container) return;

    if (!orderHistory.length) {
        container.innerHTML = "<p>No orders placed in this session.</p>";
        return;
    }

    container.innerHTML = orderHistory.map(order => `
        <div class="card">

            <h3>Order ${escapeHTML(order.id)}</h3>

            <p>Status: ${escapeHTML(order.status || "Placed")}</p>

            <p>Total: ₹${money(order.total)}</p>

            <p>Payment: ${escapeHTML(order.payment || "Not specified")}</p>

        </div>
    `).join("");

    document.getElementById("orderHistorySection")
        ?.classList.remove("hidden");
}


// ================= RECIPES =================

function renderRecipes(containerId = "recipesGrid") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = recipes.map(recipe => `
        <article class="card recipe-card">

            <img
                src="${imageWithFallback(recipe.image)}"
                alt="${escapeHTML(recipe.name)}"
                loading="lazy"
                onerror="handleImageError(this)"
            >

            <div class="recipe-card-content">

                <h3>${escapeHTML(recipe.name)}</h3>

                <p>${escapeHTML(recipe.description)}</p>

                <p>⏱️ ${escapeHTML(recipe.time)}</p>

                <p>Difficulty: ${escapeHTML(recipe.difficulty)}</p>

                <button
                    type="button"
                    onclick="openRecipe(${recipe.id})"
                >
                    View Recipe
                </button>

            </div>

        </article>
    `).join("");
}


// ================= RECIPE DETAILS =================

function openRecipe(id) {
    const recipe = recipes.find(item => item.id === id);

    if (!recipe) {
        showNotification("Recipe not found.");
        return;
    }

    const container = document.getElementById("restaurantDetails");
    const modal = document.getElementById("restaurantModal");

    if (!container) return;

    container.innerHTML = `
        <div class="recipe-detail">

            <img
                src="${imageWithFallback(recipe.image)}"
                alt="${escapeHTML(recipe.name)}"
                class="recipe-detail-image"
                onerror="handleImageError(this)"
            >

            <h2>${escapeHTML(recipe.name)}</h2>

            <p>${escapeHTML(recipe.description)}</p>

            <div class="recipe-meta">
                <span>⏱️ ${escapeHTML(recipe.time)}</span>
                <span>Difficulty: ${escapeHTML(recipe.difficulty)}</span>
            </div>

            <h3>Ingredients</h3>

            <div class="recipe-ingredients">

                ${recipe.ingredients.map((ingredient, index) => `
                    <div class="recipe-ingredient-row">

                        <span>
                            ${escapeHTML(ingredient.name)}
                            — ₹${money(ingredient.price)}
                        </span>

                        <button
                            type="button"
                            onclick="addIngredientToGroceryCart(${id}, ${index})"
                        >
                            Add
                        </button>

                    </div>
                `).join("")}

            </div>

            <button
                type="button"
                class="primary-btn"
                onclick="addAllIngredients(${id})"
            >
                Add All Ingredients to Grocery Cart
            </button>

            <h3 class="recipe-steps-heading">How to Prepare</h3>

            <div class="recipe-steps">

                ${recipe.steps.map((step, index) => `
                    <div class="recipe-step">

                        <span class="recipe-step-number">
                            ${index + 1}
                        </span>

                        <p>${escapeHTML(step)}</p>

                    </div>
                `).join("")}

            </div>

            <div class="recipe-tip">
                <strong>Chef's Tip</strong>
                <p>
                    Prepare all ingredients before starting.
                    Taste and adjust seasoning as you cook.
                </p>
            </div>

        </div>
    `;

    modal?.classList.remove("hidden");
}


// ================= GROCERY CART =================

function addIngredientToGroceryCart(recipeId, ingredientIndex) {
    const recipe = recipes.find(item => item.id === recipeId);

    const ingredient = recipe?.ingredients[ingredientIndex];

    if (!ingredient) return;

    addGroceryItem(ingredient);

    showNotification(
        `${ingredient.name} added to Grocery Cart!`
    );
}

function addAllIngredients(recipeId) {
    const recipe = recipes.find(item => item.id === recipeId);

    if (!recipe) return;

    recipe.ingredients.forEach(ingredient => {
        addGroceryItem(ingredient, false);
    });

    updateGroceryCart();

    showNotification(
        `${recipe.name} ingredients added to Grocery Cart!`
    );
}

function addGroceryItem(item, refresh = true) {
    const existing = groceryCart.find(
        entry => entry.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        groceryCart.push({
            name: item.name,
            price: Number(item.price || 0),
            quantity: 1
        });
    }

    if (refresh) {
        updateGroceryCart();
    }
}

function changeGroceryQuantity(index, amount) {
    const item = groceryCart[index];

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        groceryCart.splice(index, 1);
    }

    updateGroceryCart();
}

function removeGroceryItem(index) {
    if (index < 0 || index >= groceryCart.length) return;

    groceryCart.splice(index, 1);

    updateGroceryCart();

    showNotification("Ingredient removed from Grocery Cart.");
}


// ================= UPDATE GROCERY CART =================

function updateGroceryCart() {
    const container = document.getElementById("groceryCartItems");

    const totalElement = document.getElementById("groceryTotal");

    const itemCount = groceryCart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const total = groceryCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Update grocery cart navbar badge.
    const groceryButton = document.querySelector(".grocery-nav-btn");

    if (groceryButton) {
        let countElement = document.getElementById("groceryCartCount");

        if (!countElement) {
            countElement = document.createElement("span");

            countElement.id = "groceryCartCount";
            countElement.className = "cart-count grocery-cart-count";

            groceryButton.appendChild(countElement);
        }

        countElement.textContent = itemCount;

        countElement.classList.toggle(
            "hidden",
            itemCount === 0
        );
    }

    if (totalElement) {
        totalElement.textContent = money(total);
    }

    if (!container) return;

    if (!groceryCart.length) {
        container.innerHTML = `
            <div class="empty-state">

                <span>🥬</span>

                <h3>Your Grocery Cart is empty</h3>

                <p>
                    Add ingredients from any recipe to see them here.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = groceryCart.map((item, index) => `
        <div class="grocery-cart-item">

            <div class="grocery-item-info">

                <h4>${escapeHTML(item.name)}</h4>

                <p>₹${money(item.price)} each</p>

            </div>

            <div class="grocery-quantity-controls">

                <button
                    type="button"
                    aria-label="Decrease quantity"
                    onclick="changeGroceryQuantity(${index}, -1)"
                >
                    −
                </button>

                <span>${item.quantity}</span>

                <button
                    type="button"
                    aria-label="Increase quantity"
                    onclick="changeGroceryQuantity(${index}, 1)"
                >
                    +
                </button>

            </div>

            <strong>
                ₹${money(item.price * item.quantity)}
            </strong>

            <button
                type="button"
                class="grocery-remove-btn"
                onclick="removeGroceryItem(${index})"
            >
                Remove
            </button>

        </div>
    `).join("");
}


// ================= OPEN / CLOSE GROCERY CART =================

function openGroceryCart() {
    updateGroceryCart();

    document.getElementById("groceryCartModal")
        ?.classList.remove("hidden");
}

function closeGroceryCart() {
    document.getElementById("groceryCartModal")
        ?.classList.add("hidden");
}


// ================= GROCERY CHECKOUT =================

function checkoutGroceries() {
    if (!groceryCart.length) {
        showNotification("Your grocery cart is empty.");
        return;
    }

    showNotification(
        "Grocery checkout is not connected to a backend yet."
    );
}
// ================= TABLE BOOKING =================

function openBooking(restaurant = selectedRestaurant) {
    closeRestaurantDetails();

    const input = document.getElementById("bookingRestaurant");

    if (input && restaurant) {
        input.value = restaurant;
    }

    const dateInput = document.getElementById("bookingDate");

    if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
    }

    document.getElementById("bookingModal")
        ?.classList.remove("hidden");
}

function closeBooking() {
    document.getElementById("bookingModal")
        ?.classList.add("hidden");
}

async function submitBooking(event) {
    event.preventDefault();

    const form = document.getElementById("bookingForm");
    if (!form) return;

    const formData = new FormData(form);

    const button = form.querySelector('button[type="submit"]');

    if (button) {
        button.disabled = true;
        button.textContent = "Confirming...";
    }

    try {
        const result = await apiRequest("/book-table", {
            method: "POST",
            body: JSON.stringify({
                restaurant: formData.get("restaurant"),
                name: formData.get("name"),
                phone: formData.get("phone"),
                date: formData.get("date"),
                time: formData.get("time"),
                guests: Number(formData.get("guests")),
                requests: formData.get("requests")
            })
        });

        if (!result.success) {
            throw new Error("Booking could not be completed.");
        }

        closeBooking();
        form.reset();

        showNotification(
            `Table booked! Booking ID: ${result.booking.id}`
        );

    } catch (error) {
        showNotification(error.message);

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Confirm Booking";
        }
    }
}


// ================= LOGIN / SIGNUP =================

function openAuth() {
    document.getElementById("authModal")
        ?.classList.remove("hidden");
}

function closeAuth() {
    document.getElementById("authModal")
        ?.classList.add("hidden");
}

function toggleAuthMode() {
    authMode = authMode === "login" ? "signup" : "login";

    const title = document.getElementById("authTitle");
    const description = document.getElementById("authDescription");
    const nameField = document.getElementById("authNameField");
    const nameInput = document.getElementById("authName");
    const switchText = document.getElementById("authSwitchText");
    const switchButton = document.getElementById("authSwitchButton");

    if (title) {
        title.textContent = authMode === "login"
            ? "Welcome Back!"
            : "Create Your Account";
    }

    if (description) {
        description.textContent = authMode === "login"
            ? "Sign in to continue your food journey."
            : "Join FoodGenie and discover delicious meals.";
    }

    nameField?.classList.toggle("hidden", authMode === "login");

    if (nameInput) {
        nameInput.required = authMode === "signup";
    }

    if (switchText) {
        switchText.textContent = authMode === "login"
            ? "Don't have an account?"
            : "Already have an account?";
    }

    if (switchButton) {
        switchButton.textContent = authMode === "login"
            ? "Sign Up"
            : "Sign In";
    }
}

function handleAuth(event) {
    event.preventDefault();

    const email = document.getElementById("authEmail")?.value.trim();
    const password = document.getElementById("authPassword")?.value;

    if (!email || !password) {
        showNotification("Please enter your email and password.");
        return;
    }

    if (authMode === "signup") {
        const name = document.getElementById("authName")?.value.trim();

        localStorage.setItem("foodgenieDemoUser", JSON.stringify({
            name,
            email
        }));

        showNotification("Demo account created successfully!");

    } else {
        const saved = JSON.parse(
            localStorage.getItem("foodgenieDemoUser") || "null"
        );

        if (!saved || saved.email !== email) {
            showNotification(
                "No matching demo account found. Please sign up first."
            );
            return;
        }

        showNotification(`Welcome back, ${saved.name}!`);
    }

    closeAuth();
    event.target.reset();

    // This is a frontend demo, not production authentication.
}


// ================= CHATBOT =================

function toggleChat() {
    document.getElementById("chatWindow")
        ?.classList.toggle("hidden");
}

function addChatMessage(message, type = "bot") {
    const container = document.getElementById("chatMessages");
    if (!container) return null;

    const div = document.createElement("div");

    div.className = type === "user"
        ? "user-message"
        : "bot-message";

    div.textContent = message;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Speak chatbot replies automatically.
    if (type === "bot") {
        speakChatResponse(message);
    }

    return div;
}

function addChatRestaurantCards(restaurants) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "chat-restaurant-results";

    restaurants.forEach(item => {
        const index = displayedRestaurants.indexOf(item);

        if (index < 0) return;

        const card = document.createElement("article");
        card.className = "chat-restaurant-card";

        const image = document.createElement("img");
        image.src = item.image || FALLBACK_FOOD_IMAGE;
        image.alt = getName(item);
        image.onerror = function () {
            handleImageError(this);
        };

        const details = document.createElement("div");
        details.className = "chat-restaurant-info";

        const name = document.createElement("h4");
        name.textContent = getName(item);

        const location = document.createElement("p");
        location.textContent = `📍 ${item.location || "Location unavailable"}`;

        const rating = document.createElement("p");
        rating.textContent = `⭐ ${item.rate || "Not rated"}`;

        const price = document.createElement("p");
        price.textContent = `₹${money(getCost(item))} for two`;

        const actions = document.createElement("div");
        actions.className = "chat-restaurant-actions";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.textContent = "View Restaurant";
        viewButton.addEventListener("click", () => {
            openRestaurantDetails(index);
        });

        const cartButton = document.createElement("button");
        cartButton.type = "button";
        cartButton.textContent = "Add to Cart";
        cartButton.addEventListener("click", () => {
            addRestaurantToCart(index);
        });

        details.append(name, location, rating, price);
        actions.append(viewButton, cartButton);
        card.append(image, details, actions);
        wrapper.appendChild(card);
    });

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}


// ================= CHATBOT SEARCH =================

async function chatSearch() {
    const input = document.getElementById("chatInput");
    const query = input?.value.trim();

    if (!query) return;

    addChatMessage(query, "user");
    input.value = "";

    const normalized = query.toLowerCase();

    if (
        normalized.includes("recipe") ||
        normalized.includes("how to cook")
    ) {
        addChatMessage(
            "You can explore our recipes and step-by-step cooking instructions!"
        );

        showRecipes();
        return;
    }

    if (
        normalized === "hi" ||
        normalized === "hello" ||
        normalized.includes("hey")
    ) {
        addChatMessage(
            "Hello! 👋 Welcome to FoodGenie. Tell me what you want to eat and your budget."
        );
        return;
    }

    if (normalized.includes("grocery cart")) {
        openGroceryCart();
        return;
    }

    if (normalized.includes("cart")) {
        openCart();
        return;
    }

    addChatMessage("🔎 Finding restaurants for you...");

    try {
        const budget = extractBudgetFromText(query);

        // Remove budget phrase from food search query.
        const foodQuery = query
            .replace(
                /(?:under|below|less than|upto|up to|within|budget(?: of)?)\s*₹?\s*\d+/i,
                ""
            )
            .trim() || query;

        const params = new URLSearchParams({
            query: foodQuery,
            top_n: "30"
        });

        if (budget !== null) {
            params.set("max_price", String(budget));
        }

        const data = await apiRequest(
            `/recommend?${params.toString()}`
        );

        if (!Array.isArray(data)) {
            throw new Error("Unexpected recommendation response.");
        }

        let results = data;

        if (budget !== null) {
            results = results.filter(
                item => getCost(item) <= budget
            );
        }

        if (!results.length) {
            addChatMessage(
                budget !== null
                    ? `I couldn't find restaurants within ₹${money(budget)}. Try a higher budget.`
                    : "I couldn't find matching restaurants. Try another food or cuisine."
            );
            return;
        }

        currentRestaurants = results;
        displayedRestaurants = results;

        // Show recommendations in main restaurant section too.
        renderRestaurants();

        addChatMessage(
            budget !== null
                ? `Found ${results.length} restaurants within ₹${money(budget)} for two!`
                : `Found ${results.length} restaurant recommendations for you!`
        );

        addChatRestaurantCards(results.slice(0, 5));

    } catch (error) {
        addChatMessage(error.message);
    }
}


// ================= CHATBOT VOICE INPUT =================

function startVoiceSearch() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showNotification(
            "Voice search is not supported in this browser. Try Chrome or Edge."
        );
        return;
    }

    if (activeRecognition) {
        activeRecognition.stop();
        activeRecognition = null;
        return;
    }

    const recognition = new SpeechRecognition();

    activeRecognition = recognition;

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    showNotification("Listening... Speak now 🎤");

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;

        const input = document.getElementById("chatInput");

        if (input) {
            input.value = transcript;
        }

        chatSearch();
    };

    recognition.onerror = event => {
        showNotification(
            event.error === "not-allowed"
                ? "Please allow microphone access in your browser."
                : "Voice recognition could not complete. Please try again."
        );
    };

    recognition.onend = () => {
        activeRecognition = null;
    };

    try {
        recognition.start();
    } catch (error) {
        activeRecognition = null;
        showNotification("Could not start voice search.");
    }
}


// ================= CHATBOT VOICE OUTPUT =================

function speakChatResponse(message) {
    if (!chatbotVoiceEnabled || !("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);

    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
}

function toggleChatVoice() {
    chatbotVoiceEnabled = !chatbotVoiceEnabled;

    if (!chatbotVoiceEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    showNotification(
        chatbotVoiceEnabled
            ? "Chatbot voice enabled 🔊"
            : "Chatbot voice muted 🔇"
    );
}


// ================= EVENT LISTENERS =================

document.addEventListener("DOMContentLoaded", () => {

    updateCart();
    updateGroceryCart();

    renderRecipes("recipesGrid");

    document.getElementById("budgetFilter")?.addEventListener(
        "change",
        applyRestaurantFilters
    );

    document.getElementById("sortFilter")?.addEventListener(
        "change",
        applyRestaurantFilters
    );

    document.getElementById("query")?.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                searchFood();
            }
        }
    );

    document.getElementById("chatInput")?.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                chatSearch();
            }
        }
    );

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.classList.add("hidden");
            }
        });
    });

});

// ================= MY BOOKINGS PAGE =================

function showBookings() {
    document.getElementById("homePage")?.classList.add("hidden");
    document.getElementById("recipesPage")?.classList.add("hidden");
    document.getElementById("bookingsPage")?.classList.remove("hidden");
    document.getElementById("mobileMenu")?.classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}


async function loadMyBookings(event) {
    event.preventDefault();

    const phone = document
        .getElementById("bookingLookupPhone")
        ?.value.trim();

    const container = document.getElementById("myBookingsResults");

    if (!phone || !container) return;

    container.innerHTML = "<p>Loading your bookings...</p>";

    try {
        const data = await apiRequest(
            `/my-bookings?phone=${encodeURIComponent(phone)}`
        );

        if (!data.success || !Array.isArray(data.bookings)) {
            throw new Error("Unable to retrieve bookings.");
        }

        if (!data.bookings.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📅</span>
                    <h3>No bookings found</h3>
                    <p>No reservations were found for this phone number.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.bookings.map(booking => `
            <article class="booking-history-card">

                <div class="booking-history-header">
                    <h3>${escapeHTML(booking.restaurant)}</h3>
                    <span class="booking-status">
                        ${escapeHTML(booking.status)}
                    </span>
                </div>

                <p><strong>Booking ID:</strong>
                    ${escapeHTML(booking.id)}
                </p>

                <p><strong>Name:</strong>
                    ${escapeHTML(booking.name)}
                </p>

                <p><strong>Date:</strong>
                    ${escapeHTML(booking.date)}
                </p>

                <p><strong>Time:</strong>
                    ${escapeHTML(booking.time)}
                </p>

                <p><strong>Guests:</strong>
                    ${escapeHTML(String(booking.guests))}
                </p>

                <p><strong>Special Requests:</strong>
                    ${escapeHTML(booking.requests || "None")}
                </p>

            </article>
        `).join("");

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Something went wrong</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}
