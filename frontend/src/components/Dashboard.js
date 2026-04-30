import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import Navbar from "./Navbar";

const emptyStats = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0,
};

const statCards = [
  { key: "totalTasks", label: "Total Tasks", icon: "📋", tone: "primary" },
  { key: "completedTasks", label: "Completed", icon: "✅", tone: "success" },
  { key: "pendingTasks", label: "Pending", icon: "⏳", tone: "warning" },
  { key: "overdueTasks", label: "Overdue", icon: "⚠️", tone: "danger" },
];

const Dashboard = ({ user, onLogout }) => {
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    dueDate: "",
    status: "todo",
  });
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    members: [],
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        api.get("/tasks/dashboard/stats"),
        api.get("/tasks"),
        api.get("/projects"),
      ]);

      setStats(statsRes.data || emptyStats);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

      if (isAdmin) {
        const usersRes = await api.get("/users");
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
        onLogout();
      } else {
        setError(err?.response?.data?.message || "Failed to load dashboard data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, onLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tasksByProject = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      map[project._id] = {
        project,
        tasks: [],
      };
    });

    tasks.forEach((task) => {
      const projectId = task.projectId?._id || task.projectId || "unassigned";
      if (!map[projectId]) {
        map[projectId] = {
          project: { _id: "unassigned", name: "Unassigned", description: "" },
          tasks: [],
        };
      }
      map[projectId].tasks.push(task);
    });

    return Object.values(map);
  }, [projects, tasks]);

  const createProject = async (event) => {
    event.preventDefault();
    try {
      setIsCreatingProject(true);
      await api.post("/projects", projectForm);
      setProjectForm({ name: "", description: "", members: [] });
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Project creation failed");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      setIsCreatingTask(true);
      await api.post("/tasks", taskForm);
      setTaskForm({
        title: "",
        description: "",
        projectId: "",
        assignedTo: "",
        dueDate: "",
        status: "todo",
      });
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Task creation failed");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      setUpdatingTaskId(taskId);
      await api.put(`/tasks/${taskId}`, { status });
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update task");
    } finally {
      setUpdatingTaskId("");
    }
  };

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={onLogout} />
      <main className="container">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p className="muted">
            {isAdmin ? "Manage projects and assign tasks." : "Track your assigned tasks."}
          </p>
        </div>

        {error && <p className="error">{error}</p>}

        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Overview</h2>
            <p className="muted">Quick status of your task pipeline.</p>
          </div>
          <div className="stats-grid">
            {statCards.map((card) => (
              <article key={card.key} className={`stat-card stat-${card.tone}`}>
                <div className="stat-top">
                  <span className="stat-icon" aria-hidden="true">
                    {card.icon}
                  </span>
                  <span>{card.label}</span>
                </div>
                <strong>{stats[card.key]}</strong>
              </article>
            ))}
          </div>
        </section>

        {isAdmin && (
          <section className="dashboard-section grid-two">
            <article className="card">
              <h2>Create Project</h2>
              <p className="muted form-subtitle">Create team workspaces and add members.</p>
              <form className="form" onSubmit={createProject}>
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, name: event.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm({ ...projectForm, description: event.target.value })
                  }
                />
                <select
                  multiple
                  value={projectForm.members}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      members: Array.from(event.target.selectedOptions, (option) => option.value),
                    })
                  }
                >
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isCreatingProject}
                >
                  {isCreatingProject ? "Creating..." : "Create Project"}
                </button>
              </form>
            </article>

            <article className="card">
              <h2>Assign Task</h2>
              <p className="muted form-subtitle">Assign work to members with due dates.</p>
              <form className="form" onSubmit={createTask}>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, description: event.target.value })
                  }
                />
                <select
                  value={taskForm.projectId}
                  onChange={(event) => setTaskForm({ ...taskForm, projectId: event.target.value })}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  value={taskForm.assignedTo}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, assignedTo: event.target.value })
                  }
                  required
                >
                  <option value="">Assign To</option>
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </button>
              </form>
            </article>
          </section>
        )}

        <section className="dashboard-section card">
          <h2>Tasks by Project</h2>
          <p className="muted form-subtitle">Browse all tasks grouped by project context.</p>
          {isLoading ? (
            <p className="muted">Loading tasks...</p>
          ) : (
            tasksByProject.map((entry) => (
              <div key={entry.project._id} className="project-block">
                <h3>{entry.project.name}</h3>
                {entry.tasks.length === 0 ? (
                  <p className="muted">No tasks in this project yet.</p>
                ) : (
                  <ul className="task-list">
                    {entry.tasks.map((task) => (
                      <li key={task._id} className="task-item">
                        <div className="task-meta">
                          <strong className="task-title">{task.title}</strong>
                          <p className="muted">
                            {task.assignedTo?.name || "Unassigned"} | Due:{" "}
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div className="task-actions">
                          <span className={`status-pill status-${task.status || "todo"}`}>
                            {task.status || "todo"}
                          </span>
                          <select
                            value={task.status || "todo"}
                            disabled={updatingTaskId === task._id}
                            onChange={(event) => updateTaskStatus(task._id, event.target.value)}
                          >
                            <option value="todo">todo</option>
                            <option value="in-progress">in-progress</option>
                            <option value="done">done</option>
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
