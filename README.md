# MERN Hotel Menu Ordering System

This is a full-stack web application for a hotel menu and ordering system, built using the **MERN (MongoDB, Express, React, Node.js)** stack. The application allows users to browse a menu, add items to a cart, and place orders. It includes an admin dashboard for managing the menu and tracking order statuses in real-time.

-----

### Features

  * **User Authentication:** Secure registration and login for customers and administrators.
  * **Dynamic Menu:** Browse a wide range of food and beverage items with images, prices, and categories.
  * **Shopping Cart:** A persistent cart to manage selected items before placing an order.
  * **Order Management:** Users can view their order history and cancel an order within a specific time window.
  * **Admin Dashboard:** Manage the menu by adding, updating, and deleting items. Track all incoming orders and update their status (e.g., Pending, Preparing, Completed).

-----

### Technologies Used

  * **Frontend:**
      * **React:** For the user interface.
      * **HTML & CSS:** For structure and styling.
  * **Backend:**
      * **Node.js & Express:** For the server-side logic and RESTful API.
  * **Database:**
      * **MongoDB:** NoSQL database for storing application data.
      * **Mongoose:** ODM (Object Data Modeling) library for MongoDB and Node.js.
  * **Authentication:**
      * **JWT (JSON Web Tokens):** For secure user authentication.
      * **Bcrypt:** For password hashing.
  * **Development Tools:**
      * **Git & GitHub:** For version control.

-----

### Installation and Setup

To run this project locally, you must have **Node.js** and **MongoDB** installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Install dependencies for the server:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
      * Create a `.env` file in the project's root directory.
      * Add your MongoDB connection string and a JWT secret.
    <!-- end list -->
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=a_very_secure_secret_key
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
5.  **Access the application:**
      * The backend server will run on `http://localhost:3001`.
      * Open your browser and navigate to `http://localhost:3000` to view the application.

-----

### Usage

  * **User:** Sign up or log in, browse the menu, add items to the cart, and place an order. You can view your order history on the Profile page.
  * **Admin:** Log in with an admin account (you can create one manually in your MongoDB database). The admin dashboard is accessible from the navigation bar, allowing you to manage the menu and update order statuses.

-----

### License

This project is licensed under the MIT License.
