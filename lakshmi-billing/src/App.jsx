import React, { useState } from "react";
import { isLoggedIn } from "./lib/auth";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Quotations from "./pages/Quotations";
import Proformas from "./pages/Proformas";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [page, setPage] = useState("dashboard");

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    customers: <Customers />,
    products: <Products />,
    quotations: <Quotations />,
    proformas: <Proformas />,
    invoices: <Invoices />,
    settings: <Settings />,
  };

  return (
    <Layout page={page} setPage={setPage} onLogout={() => setLoggedIn(false)}>
      {pages[page]}
    </Layout>
  );
}
