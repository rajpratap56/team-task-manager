import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    status: "todo",
    dueDate: "",
  });
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    members: [],
  });
  const [error, setError] = useState("");

  const groupedTasks = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      tasks: tasks.filter((task) => task.projectId?._id === project._id),
    }));
  }, [projects, tasks]);

  const fetchDashboard = useCallback(async () => {
    const [statsRes, tasksRes, projectsRes] = await Promise.all([
      api.get("/tasks/dashboard/stats"),
      api.get("/tasks"),
      api.get("/projects"),
    ]);
    setStats(statsRes.data);
    setTasks(tasksRes.data);
    setProjects(projectsRes.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    const usersRes = await api.get("/users");
    setUsers(usersRes.data);
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      try {
        await fetchDashboard();
        await fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    })();
  }, [fetchDashboard, fetchUsers]);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects", projectForm);
      setProjectForm({ name: "", description: "", members: [] });
      await fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Project creation failed");
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks", taskForm);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        assignedTo: "",
        status: "todo",
        dueDate: "",
      });
      await fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Task creation failed");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Task update failed");
    }
  };

  return (
    <div className="page">
      <div className="header">
        <h2>Dashboard</h2>
        <div>
          <span>{user?.name} ({user?.role}) </span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats-grid">
        <div>Total: {stats.totalTasks}</div>
        <div>Completed: {stats.completedTasks}</div>
        <div>Pending: {stats.pendingTasks}</div>
        <div>Overdue: {stats.overdueTasks}</div>
      </div>

      {isAdmin && (
        <>
          <section className="card">
            <h3>Create Project</h3>
            <form onSubmit={createProject}>
              <input
                placeholder="Project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
              />
              <select
                multiple
                value={projectForm.members}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    members: Array.from(e.target.selectedOptions, (opt) => opt.value),
                  })
                }
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <button type="submit">Create Project</button>
            </form>
          </section>

          <section className="card">
            <h3>Assign Task</h3>
            <form onSubmit={createTask}>
              <input
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
              <select
                value={taskForm.projectId}
                onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                required
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                required
              >
                <option value="">Assign to</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
              <button type="submit">Create Task</button>
            </form>
          </section>
        </>
      )}

      <section className="card">
        <h3>Tasks by Project</h3>
        {groupedTasks.length === 0 && <p>No projects found.</p>}
        {groupedTasks.map((project) => (
          <div key={project._id}>
            <h4>{project.name}</h4>
            {project.tasks.length === 0 && <p>No tasks in this project.</p>}
            <ul>
              {project.tasks.map((task) => (
                <li key={task._id}>
                  <strong>{task.title}</strong> - {task.status} - Assigned to{" "}
                  {task.assignedTo?.name || "N/A"}
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                  >
                    <option value="todo">todo</option>
                    <option value="in-progress">in-progress</option>
                    <option value="done">done</option>
                  </select>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardPage;
