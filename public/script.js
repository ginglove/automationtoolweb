document.addEventListener("DOMContentLoaded", async function () {
    // Get the current page URL
    const currentPath = window.location.pathname;

    const userInfo = document.getElementById("user-info");
    const loginLink = document.getElementById("login-link");
    const logoutLink = document.getElementById("logout-link");
    const accountBtn = document.getElementById("account-btn");
    const accountMenu = document.getElementById("account-menu");

    const loginModal = document.getElementById("login-modal");
    const closeLogin = document.getElementById("close-login");

    const coursesList = document.getElementById("courses-list");
    const categoryLinks = document.querySelectorAll("#category-list a");

    ///Cart
    const cartIcon = document.getElementById("cart-icon");
    const cartCount = document.getElementById("cart-count");
    const cartImage = document.getElementById("cart-image");
    const cartItems = document.getElementById("cart-items");
    const cartDropdown = document.getElementById("cart-dropdown");
    const cartBtn = document.getElementById("cart-btn");
    const cartModal = document.getElementById("cart-modal");
    const closeCart = document.getElementById("close-cart");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");


    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const logoutMenu = document.getElementById("logout-menu");

    // ✅ Show cart modal when clicking cart icon
    cartBtn.addEventListener("click", (event) => {
        event.preventDefault();
        cartModal.style.display = "flex";
        updateCartDisplay();
    });

    // ✅ Close cart modal
    closeCart.addEventListener("click", () => {
        cartModal.style.display = "none";
    });

    // ✅ Close when clicking outside the cart
    window.addEventListener("click", (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = "none";
        }
    });


    async function fetchCourses(category = "all") {

        try {
            const response = await fetch(`/api/courses?category=${encodeURIComponent(category)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const courses = await response.json();

            if (courses.length === 0) {
                coursesList.innerHTML = "<p>No courses available in this category.</p>";
                return;
            }

            displayCourses(courses);
        } catch (error) {
            console.error("🔴 Error fetching courses:", error);
            coursesList.innerHTML = `<p>Error loading courses. Please try again later.</p>`;
        }
    }
    function displayCourses(courses) {
        coursesList.innerHTML = "";
        courses.forEach(course => {
            if (!course.id) {
                console.error("❌ Error: Course is missing an ID!", course);
                return;
            }

            const courseElement = document.createElement("div");
            courseElement.classList.add("course-card");
            courseElement.innerHTML = `
                <img src="${course.image}" alt="${course.title}" class="course-image">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <p class="course-price">Price: ${course.price.toLocaleString()} VND</p>
                <button class="add-to-cart" 
                    data-id="${course.id}" 
                    data-title="${course.title}" 
                    data-price="${course.price}" 
                    data-image="${course.image}" 
                    data-category="${course.category}">
                    Add to Cart
                </button>
            `;
            coursesList.appendChild(courseElement);
        });
        // ✅ Ensure Course is Passed with Category in Event Listener
        document.addEventListener("click", function (event) {
            if (event.target.classList.contains("add-to-cart")) {
                const button = event.target;
                const courseId = button.getAttribute("data-id");
                const courseTitle = button.getAttribute("data-title");
                const coursePrice = parseFloat(button.getAttribute("data-price"));
                const courseImage = button.getAttribute("data-image");
                const courseCategory = button.getAttribute("data-category");

                if (!courseId || courseId === "undefined") {
                    console.error("❌ Error: 'Add to Cart' clicked but ID is undefined!", {
                        button, courseId, courseTitle, coursePrice, courseCategory
                    });
                    return;
                }

                addToCart(courseId, courseTitle, coursePrice, courseImage, courseCategory);
            }
        });
    }
    // ✅ Category Click Events
    categoryLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            // ✅ Remove 'active' class from all
            categoryLinks.forEach(link => link.classList.remove("active-category"));

            // ✅ Add 'active' class to selected
            this.classList.add("active-category");

            // ✅ Get category from clicked element
            const selectedCategory = this.getAttribute("data-category").toLowerCase();

            // ✅ Fetch courses based on selected category
            fetchCourses(selectedCategory);
        });
    });

    // ✅ Add course to cart
    function addToCart(id, title, price, image, category) {
        if (!id || id === "undefined") {
            console.error("❌ Error: Cannot add course with undefined ID!", { id, title, price, image, category });
            return;
        }

        const existingCourse = cart.find(course => course.id === id && course.category === category);

        if (!existingCourse) {
            cart.push({ id, title, price, image, category });
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartDisplay();
            showPopupMessage(`"${title}" (${category}) added to cart!`, "success");
        } else {
            showPopupMessage(`"${title}" (${category}) is already in cart!`, "error");
        }
    }

    // ✅ Function to show a custom pop-up message
    function showPopupMessage(message, type) {
        const popup = document.createElement("div");
        popup.classList.add("popup-message", type);
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => popup.remove(), 500);
        }, 2000);
    }
    // ✅ Update cart display inside pop-up
    function updateCartDisplay() {
        const cartItems = document.getElementById("cart-items");
        const cartTotal = document.getElementById("cart-total");
        const cartBadge = document.getElementById("cart-count");
        let total = 0;

        // Clear previous content
        cartItems.innerHTML = "";

        if (cart.length === 0) {
            cartItems.innerHTML = "<p>Your cart is empty.</p>";
            cartTotal.innerHTML = `<strong>Total: </strong> <span class="cart-price">0 VND</span>`;
            cartBadge.style.display = "none"; // ✅ Hide badge when cart is empty
            return;
        }

        // Loop through cart items and calculate total
        cart.forEach(course => {
            if (!course.id) {
                console.error("❌ Error: Missing ID for course in cart", course);
                return;
            }

            total += course.price;
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            cartItem.innerHTML = `
                <img src="${course.image}" alt="${course.title}" class="cart-image">
                <p>[${course.category}] - ${course.title} - <strong>${course.price.toLocaleString()} VND</strong></p>
                <button class="remove-item" data-id="${course.id}" data-category="${course.category}">Remove</button>
            `;
            cartItems.appendChild(cartItem);
        });

        // ✅ Update total price in correct format
        cartTotal.innerHTML = `<strong>Total: </strong> <span class="cart-price">${total.toLocaleString()} VND</span>`;

        // ✅ Update cart badge count
        cartBadge.style.display = "inline-block";
        cartBadge.textContent = cart.length;

        // ✅ Attach event listeners to remove buttons
        document.querySelectorAll(".remove-item").forEach(button => {
            button.addEventListener("click", (event) => {
                const courseId = event.target.getAttribute("data-id");
                const courseCategory = event.target.getAttribute("data-category");
                removeFromCart(courseId, courseCategory);
            });
        });
    }


    function removeFromCart(id, category) {
        if (!id) {
            console.error("❌ Error: Cannot remove course with undefined ID!");
            return;
        }

        cart = cart.filter(course => !(course.id === id && course.category === category));
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
    }
    // ✅ Handle Checkout Process
    checkoutBtn.addEventListener("click", async function () {
        if (cart.length === 0) {
            showPopupMessage("Your cart is empty!", "error");
            return;
        }

        const orderData = {
            items: cart,
            totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
        };

        try {
            const response = await fetch("/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                showPopupMessage("Checkout successful! Redirecting...", "success");

                // ✅ Clear cart after successful checkout
                localStorage.removeItem("cart");
                cart = [];

                // ✅ Update order history
                fetchOrderHistory();

                // ✅ Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = "/order"; // Redirect to order history page
                }, 3000);
            } else {
                showPopupMessage("Checkout failed: " + data.message, "error");
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            showPopupMessage("Server error, please try again!", "error");
        }
    });
    async function fetchOrderHistory() {
        try {
            const userResponse = await fetch("/api/user");
            const userData = await userResponse.json();

            if (!userData.loggedIn) {
                console.warn("🚫 User not logged in - hiding order history.");
                document.getElementById("order-history-section").style.display = "none";
                return;
            }

            console.log("🟢 Fetching order history for user:", userData.username);
            const response = await fetch("/api/orders");
            const data = await response.json();

            console.log("📦 API response for order history:", data); // ✅ Debugging log

            if (!data.success || !data.orders || data.orders.length === 0) {
                console.warn("⚠️ No orders found for user.");
                document.getElementById("order-history").innerHTML = "<p class='no-orders'>You have no orders yet.</p>"; return;
            }

            displayOrderHistory(data.orders);
        } catch (error) {
            console.error("🔴 Error fetching order history:", error);
        }
    }
    function displayOrderHistory(orders) {
        const orderHistoryContainer = document.getElementById("order-history");
        orderHistoryContainer.innerHTML = "";

        orders.forEach(order => {
            const orderElement = document.createElement("div");
            orderElement.classList.add("order-card");

            orderElement.innerHTML = `
                <div class="order-header">
                    <span class="order-date">📅 Order Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                    <span class="order-total">💰 Total: ${order.totalPrice.toLocaleString()} VND</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.title}" class="order-image">
                            <div class="order-details">
                                <p class="order-title">${item.title}</p>
                                <p class="order-price">${item.price.toLocaleString()} VND</p>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
            orderHistoryContainer.appendChild(orderElement);
        });
    }
    // Fetch courses and update cart on page load
    fetchCourses();
    updateCartDisplay();

    // accountBtn.addEventListener("click", function (event) {
    //     event.preventDefault(); // Prevent default link behavior
    //     accountMenu.classList.toggle("show-dropdown");
    // });

    // ✅ Ensure elements exist before adding event listeners
    if (loginLink && loginModal && closeLogin) {
        // Show login pop-up when clicking "Login"
        loginLink.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent page reload
            loginModal.style.display = "flex";
        });

        // Close login pop-up when clicking close button
        closeLogin.addEventListener("click", function () {
            loginModal.style.display = "none";
        });

        // Close login pop-up when clicking outside the modal
        window.addEventListener("click", function (event) {
            if (event.target === loginModal) {
                loginModal.style.display = "none";
            }
        });
    } else {
        console.warn("One or more login modal elements are missing in the DOM.");
    }

    // Close login pop-up when clicking close button
    closeLogin.addEventListener("click", function () {
        loginModal.style.display = "none";
    });

    // Close login pop-up when clicking outside the modal
    window.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        }
    });

    try {
        const response = await fetch("/api/user");
        const data = await response.json();

        if (data.loggedIn) {
            logoutMenu.style.display = "block"; // Show Logout if logged in
            loginLink.style.display = "none"; // Hide Login
        } else {
            logoutMenu.style.display = "none"; // Hide Logout if not logged in
            loginLink.style.display = "block"; // Show Login
        }
    } catch (error) {
        console.error("Error checking login status:", error);
    }

    // ✅ Handle Logout Click
    if (logoutLink) {
        logoutLink.addEventListener("click", async function (event) {
            event.preventDefault();
            try {
                const response = await fetch("/logout", { method: "POST" });
                const data = await response.json();

                if (data.success) {
                    showLogoutPopup();
                }
            } catch (error) {
                console.error("Logout failed:", error);
                showPopupMessage("❌ Logout failed. Try again!", "error");
            }
        });
    }
    // ✅ Logout Pop-Up Function (Same Style as Register)
    function showLogoutPopup() {
        const overlay = document.createElement("div");
        overlay.classList.add("popup-overlay");

        const popup = document.createElement("div");
        popup.classList.add("popup-container");

        popup.innerHTML = `
        <h2>✅ Logout Successful</h2>
        <p>You will be redirected to the homepage in <span id="logout-countdown">3</span> seconds...</p>
        <button id="logout-close-btn">OK</button>
    `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        let countdown = 3;
        const countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById("logout-countdown").textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = "/"; // Redirect to homepage
            }
        }, 1000);

        document.getElementById("logout-close-btn").addEventListener("click", () => {
            document.body.removeChild(overlay);
            window.location.href = "/";
        });
    }
    // Remove active class from all menu items
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.classList.remove("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!accountBtn.contains(event.target) && !accountMenu.contains(event.target)) {
            accountMenu.classList.remove("show-dropdown");
        }
    });

    // Add active class to the current page link
    if (currentPath === "/") {
        document.getElementById("nav-home").classList.add("active");
    } else if (currentPath.includes("/register")) {
        document.getElementById("nav-register").classList.add("active");
    } else if (currentPath.includes("/about")) {
        document.getElementById("nav-about").classList.add("active");
    } else if (currentPath.includes("/introduction")) {
        document.getElementById("nav-introduction").classList.add("active");
    }
    if (currentPath.includes("/dashboard")) {
        document.getElementById("nav-dashboard").classList.add("active");
    } else if (currentPath.includes("/register")) {
        document.getElementById("nav-register").classList.add("active");
    } else if (currentPath.includes("/about")) {
        document.getElementById("nav-about").classList.add("active");
    } else if (currentPath.includes("/introduction")) {
        document.getElementById("nav-introduction").classList.add("active");
    }

});