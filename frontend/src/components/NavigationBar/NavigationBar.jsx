import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ...existing imports...

function NavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/">TexCare 360</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/machines">Machines</Nav.Link>
            <Nav.Link as={Link} to="/technicians">Technicians</Nav.Link>
            <Nav.Link as={Link} to="/maintenance-logs">Maintenance Logs</Nav.Link>
            <Nav.Link as={Link} to="/inventory">Inventory</Nav.Link>
          </Nav>
          {/* Add the logout button here */}
          {user && (
            <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>
              Logout
            </button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;