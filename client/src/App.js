// App.js

import React, { useState, useEffect, createContext, useContext } from 'react';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3001/api';

const AppContext = createContext();

const useAppContext = () => {
  return useContext(AppContext);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// --- Notification Component ---
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      backgroundColor: backgroundColor,
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 1000,
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
    }}>
      {message}
    </div>
  );
};

// --- Core App Components ---
const MenuItem = ({ item }) => {
  const { addToCart, user, deleteMenuItem, setEditingItem } = useAppContext();
  const isAdmin = user && user.role === 'admin';

  const itemStyle = {
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'transform 0.3s',
  };

  const buttonStyle = {
    backgroundColor: '#3B82F6',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    marginTop: 'auto',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  };

  const adminButtonStyle = {
    ...buttonStyle,
    padding: '0.5rem 1rem',
  };

  return (
    <div style={itemStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
      <img
        src={item.img}
        alt={item.name}
        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }}
        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x160/F0F0F0/888888?text=No+Image`; }}
      />
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.name}</h3>
      <p style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Type: {item.type}</p>
      <p style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '1rem' }}>{formatCurrency(item.price)}</p>

      {isAdmin ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ ...adminButtonStyle, backgroundColor: '#F59E0B' }} onClick={() => setEditingItem(item)}>Edit</button>
          <button style={{ ...adminButtonStyle, backgroundColor: '#EF4444' }} onClick={() => deleteMenuItem(item._id)}>Delete</button>
        </div>
      ) : (
        <button style={buttonStyle} onClick={() => addToCart(item)}>Add to Cart</button>
      )}
    </div>
  );
};

const MenuList = () => {
  const { menuItems, isLoadingMenu, menuError, searchTerm, setSearchTerm, filterType, setFilterType } = useAppContext();

  if (isLoadingMenu) {
    return <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '1.125rem', marginTop: '2.5rem' }}>Loading menu...</div>;
  }

  if (menuError) {
    return <div style={{ textAlign: 'center', color: '#EF4444', fontSize: '1.125rem', marginTop: '2.5rem' }}>Error loading menu: {menuError}</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>Our Delicious Menu</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search for dishes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '9999px', border: '1px solid #D1D5DB', marginBottom: '1rem' }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '9999px', border: '1px solid #D1D5DB' }}
        >
          <option value="">All Types</option>
          <option value="Main Course">Main Course</option>
          <option value="Appetizer">Appetizer</option>
          <option value="Beverage">Beverage</option>
          <option value="Dessert">Dessert</option>
          <option value="Side Dish">Side Dish</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {menuItems.map((item) => (
          <MenuItem key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useAppContext();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={item.img} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', marginRight: '1rem' }} />
        <div>
          <h4 style={{ fontWeight: 'bold', color: '#1F2937' }}>{item.name}</h4>
          <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{formatCurrency(item.price)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button style={{ padding: '0.5rem', backgroundColor: '#E5E7EB', borderRadius: '4px 0 0 4px', border: 'none' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
        <span style={{ padding: '0.5rem 1rem', backgroundColor: '#F3F4F6', color: '#1F2937' }}>{item.quantity}</span>
        <button style={{ padding: '0.5rem', backgroundColor: '#E5E7EB', borderRadius: '0 4px 4px 0', border: 'none' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
        <button style={{ marginLeft: '1rem', color: '#EF4444', border: 'none', background: 'none' }} onClick={() => removeFromCart(item.id)}>X</button>
      </div>
    </div>
  );
};

const Cart = ({ setShowCart }) => {
  const { cart, placeOrder, totalCartPrice, isPlacingOrder, isAuthenticated } = useAppContext();
  const [tableNumber, setTableNumber] = useState('');

  const handlePlaceOrder = async () => {
    if (cart.length > 0) {
      const success = await placeOrder(tableNumber);
      if (success) {
        setShowCart(false);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 }}>
      <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '450px', padding: '1.5rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', overflowY: 'auto', position: 'relative' }}>
        <button style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem', border: 'none', background: 'none' }} onClick={() => setShowCart(false)}>X</button>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Your Cart</h2>

        {cart.length === 0 ? (
          <p style={{ color: '#4B5563', textAlign: 'center', marginTop: '2.5rem' }}>Your cart is empty.</p>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              {cart.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.125rem', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>{formatCurrency(totalCartPrice)}</span>
            </div>
            {isAuthenticated ? (
              <>
                <div style={{ marginTop: '1.5rem' }}>
                  <label htmlFor="table-number" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Table Number:</label>
                  <input
                    id="table-number"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., A5"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || !tableNumber}
                  style={{ width: '100%', backgroundColor: '#10B981', color: '#fff', padding: '0.75rem', borderRadius: '9999px', marginTop: '1.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: isPlacingOrder || !tableNumber ? 0.5 : 1 }}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </>
            ) : (
              <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#EF4444', fontWeight: 'bold' }}>Please sign in to place an order.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const OrderHistory = () => {
  const { orders, cancelOrder, isLoadingOrders, ordersError } = useAppContext();

  if (isLoadingOrders) {
    return <div style={{ textAlign: 'center', color: '#4B5563', fontSize: '1.125rem', marginTop: '2.5rem' }}>Loading orders...</div>;
  }

  if (ordersError) {
    return <div style={{ textAlign: 'center', color: '#EF4444', fontSize: '1.125rem', marginTop: '2.5rem' }}>Error loading orders: {ordersError}</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>Your Order History</h2>
      {orders.length === 0 ? (
        <p style={{ color: '#4B5563', textAlign: 'center', marginTop: '2.5rem' }}>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Order ID: <span style={{ color: '#3B82F6' }}>{order.id.substring(0, 8)}</span></p>
              <p style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Placed On: {new Date(order.placedAt).toLocaleString()}</p>
              <p style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Table: {order.tableNumber || 'N/A'}</p>
              <p style={{ color: '#10B981', fontWeight: 'bold', marginBottom: '1rem' }}>Total: {formatCurrency(order.total)}</p>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Items:</h4>
                <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', color: '#4B5563' }}>
                  {order.items.map((item) => (
                    <li key={item.id}>{item.name} x {item.quantity}</li>
                  ))}
                </ul>
              </div>
              {order.status === 'Cancelled' ? (
                <p style={{ fontWeight: 'bold', color: '#EF4444' }}>Order Cancelled</p>
              ) : order.cancellable && order.status !== 'Completed' ? (
                <button
                  onClick={() => cancelOrder(order.id)}
                  disabled={order.timeRemaining <= 0}
                  style={{ width: '100%', backgroundColor: '#EF4444', color: '#fff', padding: '0.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', opacity: order.timeRemaining <= 0 ? 0.5 : 1 }}
                >
                  Cancel Order ({order.timeRemaining}s)
                </button>
              ) : (
                <p style={{ fontWeight: 'bold', color: order.status === 'Completed' ? '#10B981' : '#4B5563' }}>
                  Status: {order.status === 'Completed' ? 'Completed' : 'Cancellation window closed.'}
                </p>
              )}
                {order.estimatedPrepTime > 0 && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                <p style={{ fontWeight: 'bold', color: '#F97316', marginTop: '0.5rem' }}>
                  Estimated Prep Time: {order.estimatedPrepTime} min
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, profile, isLoadingProfile, profileError, setView } = useAppContext();

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please log in to view your profile.</div>;
  }
  if (isLoadingProfile) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading profile...</div>;
  }
  if (profileError) {
    return <div style={{ textAlign: 'center', color: '#EF4444', marginTop: '5rem' }}>Error loading profile: {profileError}</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>User profile not found.</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>User Profile</h2>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto' }}>
        <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
          <strong style={{ display: 'inline-block', width: '100px' }}>Email:</strong> {profile.email}
        </p>
        <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
          <strong style={{ display: 'inline-block', width: '100px' }}>Role:</strong> {profile.role}
        </p>
        <button
          onClick={() => setView('orders')}
          style={{ width: '100%', backgroundColor: '#3B82F6', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem' }}
        >
          View Order History
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const {
    menuItems, orders, updateOrderStatus,
    isLoadingMenu, isLoadingOrders,
    editingItem, setEditingItem, addMenuItem, updateMenuItem,
  } = useAppContext();

  const [newItemName, setNewItemName] = useState(editingItem?.name || '');
  const [newItemImg, setNewItemImg] = useState(editingItem?.img || '');
  const [newItemPrice, setNewItemPrice] = useState(editingItem?.price || '');
  const [newItemType, setNewItemType] = useState(editingItem?.type || 'Main Course');
  const [isFormLoading, setIsFormLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setNewItemName(editingItem.name);
      setNewItemImg(editingItem.img);
      setNewItemPrice(editingItem.price);
      setNewItemType(editingItem.type);
    } else {
      setNewItemName('');
      setNewItemImg('');
      setNewItemPrice('');
      setNewItemType('Main Course');
    }
  }, [editingItem]);

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    const itemData = {
      name: newItemName,
      img: newItemImg,
      price: parseFloat(newItemPrice),
      type: newItemType,
    };
    if (editingItem) {
      await updateMenuItem(editingItem._id, itemData);
      setEditingItem(null);
    } else {
      await addMenuItem(itemData);
    }
    setIsFormLoading(false);
  };
  
  // New component to manage each order's state
  const OrderCard = ({ order }) => {
    const { updateOrderStatus } = useAppContext();
    const [status, setStatus] = useState(order.status);
    const [prepTime, setPrepTime] = useState(order.estimatedPrepTime);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSave = async () => {
      setIsUpdating(true);
      await updateOrderStatus(order._id, status, prepTime);
      setIsUpdating(false);
    };

    return (
      <div key={order._id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Order ID: <span style={{ color: '#3B82F6' }}>{order._id ? order._id.substring(0, 8) : 'N/A'}</span>
        </p>
        <p style={{ marginBottom: '0.5rem' }}>Table: {order.tableNumber || 'N/A'}</p>
        <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Total: {formatCurrency(order.total)}</p>
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Items:</h4>
          <ul style={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
            {order.items.map((item) => (
              <li key={item.id}>{item.name} x {item.quantity}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          {/* Form field with label and id */}
          <label htmlFor={`status-${order._id}`} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Update Status:</label>
          <select
            id={`status-${order._id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          >
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          {/* Form field with label and id */}
          <label htmlFor={`prep-time-${order._id}`} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estimated Prep Time (min):</label>
          <input
            id={`prep-time-${order._id}`}
            type="number"
            value={prepTime || ''}
            onChange={(e) => setPrepTime(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          style={{ backgroundColor: '#10B981', color: '#fff', padding: '0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 'bold', width: '100%', opacity: isUpdating ? 0.5 : 1}}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    )
  };


  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>Admin Dashboard</h2>
      
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Manage Menu Items</h3>
        <form onSubmit={handleMenuSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h4>
          <input type="text" placeholder="Name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
          <input type="text" placeholder="Image URL" value={newItemImg} onChange={(e) => setNewItemImg(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
          <input type="number" placeholder="Price" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
          <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
            <option>Main Course</option>
            <option>Appetizer</option>
            <option>Beverage</option>
            <option>Dessert</option>
            <option>Side Dish</option>
          </select>
          <button type="submit" disabled={isFormLoading} style={{ backgroundColor: '#4F46E5', color: '#fff', padding: '0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', opacity: isFormLoading ? 0.5 : 1 }}>
            {isFormLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button type="button" onClick={() => setEditingItem(null)} style={{ backgroundColor: '#6B7280', color: '#fff', padding: '0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Manage Orders</h3>
        {isLoadingOrders ? (
          <div style={{ textAlign: 'center', color: '#4B5563' }}>Loading orders...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {orders.length === 0 ? (
                <p style={{ color: '#4B5563', textAlign: 'center', marginTop: '2.5rem' }}>No orders found.</p>
            ) : (
                orders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AuthForm = ({ type, onSubmit, isLoading, message }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '2.5rem auto' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem' }}>
        {type === 'login' ? 'Sign In' : 'Sign Up'}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: '#3B82F6', color: '#fff', padding: '0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 'bold', opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? 'Loading...' : type === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '1rem', textAlign: 'center', color: message.type === 'success' ? '#10B981' : '#EF4444' }}>
          {message.text}
        </p>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [showCart, setShowCart] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('menu');
  const [authMessage, setAuthMessage] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // Admin state
  const [editingItem, setEditingItem] = useState(null);

  // Notification State
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };
  const closeNotification = () => setNotification(null);

  // --- Dynamic CSS Injection ---
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      body { margin: 0; font-family: sans-serif; background-color: #F3F4F6; color: #1F2937; }
      .header-button { padding: 8px 16px; border-radius: 9999px; font-weight: bold; cursor: pointer; border: none; transition: background-color 0.3s; }
      .header-button-primary { background-color: #3B82F6; color: white; }
      .header-button-primary:hover { background-color: #2563EB; }
      .header-button-secondary { background-color: #E5E7EB; color: #1F2937; }
      .header-button-secondary:hover { background-color: #D1D5DB; }
      .header-button-danger { background-color: #EF4444; color: white; }
      .header-button-danger:hover { background-color: #DC2626; }
      .app-link { color: #4B5563; text-decoration: none; font-weight: bold; transition: color 0.3s; }
      .app-link:hover { color: #3B82F6; }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  // Countdown timer
  useEffect(() => {
    let countdownInterval;
    // Condition to only run the timer for user orders, not admin orders
    if (view === 'orders' && orders.length > 0) {
      countdownInterval = setInterval(() => {
        setOrders(prevOrders =>
          prevOrders.map(order => {
            if (order.cancellable) {
              const remainingMs = new Date(order.cancellationWindowEnd).getTime() - Date.now();
              const newTimeRemaining = Math.max(0, Math.floor(remainingMs / 1000));
              if (newTimeRemaining === 0) {
                return { ...order, cancellable: false, timeRemaining: newTimeRemaining };
              }
              return { ...order, timeRemaining: newTimeRemaining };
            }
            return order;
          })
        );
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [orders, view]);

  // Auth effects
  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [token]);

  // --- API Calls ---
  const fetchMenu = async () => {
    setIsLoadingMenu(true);
    setMenuError(null);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        type: filterType,
      }).toString();
      const response = await fetch(`${API_BASE_URL}/menu?${query}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu:", error);
      setMenuError(error.message);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!isAuthenticated || user?.role === 'admin') {
      setIsLoadingOrders(false);
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/user`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrdersError(error.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchAllOrders = async () => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setIsLoadingOrders(false);
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setOrdersError(error.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    if (!isAuthenticated) return;
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  useEffect(() => {
    fetchMenu();
  }, [searchTerm, filterType]);

  useEffect(() => {
    if (isAuthenticated) {
      if (view === 'orders' && user?.role !== 'admin') {
        fetchUserOrders();
      } else if (view === 'admin' && user?.role === 'admin') {
        fetchAllOrders();
      } else if (view === 'profile') {
        fetchProfile();
      }
    }
  }, [isAuthenticated, view, user, token]);

  const totalCartPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item._id);
      if (existingItem) {
        showNotification(`${item.name} quantity updated in cart.`, 'success');
        return prevCart.map((cartItem) =>
          cartItem.id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        showNotification(`${item.name} added to cart!`, 'success');
        return [...prevCart, { ...item, id: item._id, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== id);
      }
      return prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const placeOrder = async (tableNumber) => {
    if (cart.length === 0 || !isAuthenticated || !tableNumber) {
      showNotification('Cannot place order: Cart is empty, not logged in, or table number is missing.', 'error');
      return false;
    }
    setIsPlacingOrder(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
          total: totalCartPrice,
          tableNumber,
        }),
      });
      if (!response.ok) throw new Error(`Failed to place order.`);
      setCart([]);
      setShowCart(false);
      showNotification('Order placed successfully!', 'success');
      fetchUserOrders();
      return true;
    } catch (error) {
      console.error("Error placing order:", error);
      showNotification('Failed to place order.', 'error');
      return false;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to cancel order.');
      showNotification('Order cancelled successfully.', 'success');
      fetchUserOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showNotification('Failed to cancel order.', 'error');
    }
  };

  // --- Admin Functions ---
  const addMenuItem = async (itemData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to add menu item');
      showNotification('Menu item added successfully!', 'success');
      fetchMenu();
    } catch (error) {
      showNotification('Failed to add menu item.', 'error');
    }
  };

  const updateMenuItem = async (id, itemData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to update menu item');
      showNotification('Menu item updated successfully!', 'success');
      fetchMenu();
    } catch (error) {
      showNotification('Failed to update menu item.', 'error');
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to delete menu item');
      showNotification('Menu item deleted successfully!', 'success');
      fetchMenu();
    } catch (error) {
      showNotification('Failed to delete menu item.', 'error');
    }
  };

  const updateOrderStatus = async (orderId, newStatus, newPrepTime) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ status: newStatus, estimatedPrepTime: newPrepTime }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      showNotification(`Order ${orderId ? orderId.substring(0,4) : 'N/A'} status updated to ${newStatus}.`, 'success');
      
      // Update the local state instead of re-fetching everything
      setOrders(prevOrders => prevOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus, estimatedPrepTime: newPrepTime } : order
      ));

    } catch (error) {
      showNotification('Failed to update order status.', 'error');
    }
  };
  
  // --- Auth Handlers ---
  const handleRegister = async (email, password) => {
    setIsAuthLoading(true);
    setAuthMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      setAuthMessage({ text: 'Registration successful! Please sign in.', type: 'success' });
      setView('login');
    } catch (error) {
      setAuthMessage({ text: error.message, type: 'error' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setIsAuthLoading(true);
    setAuthMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      showNotification('Logged in successfully!', 'success');
      setView('menu');
    } catch (error) {
      setAuthMessage({ text: error.message, type: 'error' });
      showNotification('Login failed.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCart([]);
    setOrders([]);
    setView('menu');
    showNotification('Logged out successfully.', 'success');
  };

  const appState = {
    menuItems, cart, orders, totalCartPrice, addToCart, removeFromCart, updateQuantity, placeOrder, cancelOrder,
    isLoadingMenu, menuError, isLoadingOrders, ordersError, isPlacingOrder, isAuthenticated, user, setView,
    profile, isLoadingProfile, profileError,
    setEditingItem, editingItem, addMenuItem, updateMenuItem, deleteMenuItem, updateOrderStatus,
    searchTerm, setSearchTerm, filterType, setFilterType,
  };

  const renderContent = () => {
    switch (view) {
      case 'menu': return <MenuList />;
      case 'orders': return <OrderHistory />;
      case 'profile': return <Profile />;
      case 'login': return <AuthForm type="login" onSubmit={handleLogin} isLoading={isAuthLoading} message={authMessage} />;
      case 'register': return <AuthForm type="register" onSubmit={handleRegister} isLoading={isAuthLoading} message={authMessage} />;
      case 'admin': return <AdminDashboard />;
      default: return <MenuList />;
    }
  };

  const headerStyle = {
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  };

  return (
    <AppContext.Provider value={appState}>
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'sans-serif', color: '#1F2937', position: 'relative' }}>
        <header style={headerStyle}>
          <h1 onClick={() => setView('menu')} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6', cursor: 'pointer' }}>
            Hotel Menu
          </h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" className="app-link" onClick={() => setView('menu')}>Menu</a>
            {isAuthenticated && (
              <a href="#" className="app-link" onClick={() => setView('profile')}>Profile</a>
            )}
            {user && user.role === 'admin' && (
              <a href="#" className="app-link" onClick={() => setView('admin')}>Admin</a>
            )}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated ? (
              <>
                {user && user.email && (
                    <span style={{ fontSize: '0.875rem', backgroundColor: '#E5E7EB', padding: '4px 12px', borderRadius: '9999px' }}>
                        {user.email.substring(0, user.email.indexOf('@'))}
                    </span>
                )}
                <button onClick={handleLogout} className="header-button header-button-danger">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setView('register')} className="header-button header-button-secondary">Sign Up</button>
                <button onClick={() => setView('login')} className="header-button header-button-primary">Sign In</button>
              </>
            )}
            <button onClick={() => setShowCart(true)} style={{ position: 'relative', padding: '8px 16px', borderRadius: '9999px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Cart ({cart.length})
            </button>
          </div>
        </header>

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          {renderContent()}
        </main>

        {showCart && <Cart setShowCart={setShowCart} />}
        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={closeNotification} />
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;