const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="brand">Team Task Manager</div>
      <div className="nav-right">
        <span className="role-chip">{user?.role || "member"}</span>
        <span className="user-name">{user?.name || "User"}</span>
        <button className="btn btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
