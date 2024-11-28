const API_BASE = 'https://taskmaster-lnyd.onrender.com';

const registerForm = document.getElementById('registerForm');

const token = localStorage.getItem('token') || '';

// if (!token) {
//     alert('Please login to view this page.');
//     window.location.href = 'login.html';
// }


// Register User
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    
        const data = await res.json();
        // alert(data.message || 'Account created successfully!');
        if (res.ok) {
            alert('Registration successful! Redirecting to the task page...');
            window.location.href = 'login.html';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.log('Account creation failed');
    }
    
});


document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (data.token) {
            // Save the token to local storage
            localStorage.setItem('token', data.token); 
            console.log('Token saved to local storage:', data.token); // Debugging

            alert('Login successful!');
            window.location.href = 'tasks.html'; // Redirect to tasks.html
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        alert('An error occurred. Please try again.');
    }
});


// Create Task
document.getElementById('taskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const deadline = document.getElementById('deadline').value;
    const priority = document.getElementById('priority').value;

    const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, title, description, deadline, priority }),
    });

    const task = await res.json();
    alert('Task created successfully!');
    
    if (task) {
        document.getElementById('taskForm').reset();
        fetchTasks(); // Refresh the task list
    }
});

async function fetchTasks() {
    // console.log('Fetching task with token:', token);

    const res = await fetch(`${API_BASE}/tasks?token=${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const tasks = await res.json();

    if (!Array.isArray(tasks)) {
        console.error('Invalid response:', tasks);
        // alert('Failed to fetch tasks. Please try again.');
        return;
    }

    const taskList = document.getElementById('taskList');
    if (tasks.length === 0) {
        taskList.innerHTML = '<li>No tasks available. Create one now!</li>';
    } else {
        taskList.innerHTML = tasks
            .map(task => `
            <li>
                <h3>${task.title}</h3>
                <p> <strong>Description:</strong> ${task.description} </p>
                <p> <strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Deadline: </strong> ${task.deadline}</p>
                <button onclick="editTask('${task._id}')">Edit</button>
                <button onclick="deleteTask('${task._id}')">Delete</button>
            </li>`)
            .join('');
    }
}

fetchTasks();

// Edit Task
function editTask(taskId) {
    const title = prompt('Enter new title:');
    const description = prompt('Enter new description:');
    const deadline = prompt('Enter new deadline (YYYY-MM-DD):');
    const priority = prompt('Enter new priority (low, medium, high):');

    if (!title || !priority) {
        alert('Title and priority are required!');
        return;
    }

    fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token,
            title,
            description,
            deadline,
            priority,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.error) {
                alert(`Error updating task: ${data.error}`);
            } else {
                alert('Task updated successfully!');
                fetchTasks(); // Refresh the task list
            }
        })
        .catch((err) => {
            console.error('Error updating task:', err);
            alert('Failed to update task. Please try again.');
        });
}

// Delete Task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.error) {
                alert(`Error deleting task: ${data.error}`);
            } else {
                alert('Task deleted successfully!');
                fetchTasks(); // Refresh the task list
            }
        })
        .catch((err) => {
            console.error('Error deleting task:', err);
            alert('Failed to delete task. Please try again.');
        });
}