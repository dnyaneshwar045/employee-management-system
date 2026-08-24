import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

export default function App() {
  // UTHENTICATION STATE
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");

  // EMPLOYEE STATE
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    position: "",
    salary: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    const data = await response.json();
    if (response.ok) {
      setToken(data.token);
      localStorage.setItem("token", data.token); // Save token to browser
      setAuthError("");
    } else {
      setAuthError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  // 2. Fetch with Authorization Header
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5000/employees", {
        headers: { Authorization: token },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else if (response.status === 401 || response.status === 403) {
        handleLogout();
      }
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const url = editingId
      ? `http://localhost:5000/employees/${editingId}`
      : "http://localhost:5000/employees";

    await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(form),
    });

    setForm({ name: "", mobile: "", email: "", position: "", salary: "" });
    setEditingId(null);
    await fetchEmployees();
    setIsProcessing(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await fetch(`http://localhost:5000/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      fetchEmployees();
    }
  };

  const handleEdit = (emp) => {
    setForm(emp);
    setEditingId(emp._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!emp.name) return false;
    return emp.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED 
  if (!token) {
    return (
      <div
        className="container"
        style={{ maxWidth: "400px", marginTop: "100px" }}
      >
        <h2>Admin Login</h2>
        <div className="form-container">
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <input
              name="username"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              required
            />
            {authError && (
              <p style={{ color: "#e74c3c", margin: 0 }}>{authError}</p>
            )}
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER MAIN APP IF AUTHENTICATED 
  return (
    <div className="container">
      {/* Updated Header Container */}
      <div
        className="header-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Employee Management System</h2>
        <button
          className="btn-logout"
          onClick={handleLogout}
          style={{ padding: "8px 15px" }}
        >
          Logout
        </button>
      </div>

      {/* 3D Form Card */}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
          />
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            placeholder="Mobile"
            required
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            required
          />
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="Position"
            required
          />
          <input
            name="salary"
            value={form.salary}
            onChange={handleChange}
            placeholder="Salary"
            type="number"
            required
          />
          <button type="submit" disabled={isProcessing}>
            {isProcessing
              ? "Processing..."
              : editingId
                ? "Update Employee"
                : "Add Employee"}
          </button>
        </form>
      </div>

      {/* The Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search employees by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            boxSizing: "border-box",
            backgroundColor: "white",
            color: "black",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Responsive Table Data */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="5">No records found.</td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.position}</td>
                  <td>₹{emp.salary}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(emp)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(emp._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
