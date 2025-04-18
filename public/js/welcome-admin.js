// src/public/js/welcome-admin.js
async function checkAdminSession() {
    try {
        const response = await fetch('/api/auth/current', { credentials: 'include' });
        const result = await response.json();
        if (!response.ok || result.type !== 'admin') {
            alert('You must be an admin to access this page');
            window.location.href = '/';
        }
    } catch (err) {
        console.error('Error checking session:', err);
        alert('Error checking session: ' + err.message);
        window.location.href = '/';
    }
}

async function fetchBookings() {
    try {
        const response = await fetch('/api/admin/bookings', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch bookings');
        }
        const bookings = await response.json();
        const tbody = document.querySelector('#bookings-table tbody');
        tbody.innerHTML = '';
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.username}</td>
                <td>${booking.package_name}</td>
                <td>${booking.place_name}</td>
                <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                <td>${new Date(booking.start_date).toLocaleDateString()}</td> <!-- Format start_date -->
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        alert('Error fetching bookings: ' + err.message);
    }
}

async function fetchPackages() {
    try {
        const response = await fetch('/api/admin/packages', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch packages');
        }
        const packages = await response.json();

        const viewTbody = document.querySelector('#view-packages-table tbody');
        viewTbody.innerHTML = '';
        packages.forEach(pkg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pkg.id}</td>
                <td>${pkg.place_name}</td>
                <td>${pkg.package_name}</td>
                <td>${pkg.days}</td>
                <td>${pkg.nights}</td>
                <td>${pkg.price}</td>
                <td>${pkg.hotel}</td>
                <td>${pkg.flights}</td>
                <td>${pkg.cabs}</td>
                <td>${pkg.food}</td>
                <td>${pkg.description || 'N/A'}</td>
                <td>${new Date(pkg.start_date).toLocaleDateString()}</td> <!-- Format start_date -->
            `;
            viewTbody.appendChild(row);
        });

        const editTbody = document.querySelector('#edit-packages-table tbody');
        editTbody.innerHTML = '';
        packages.forEach(pkg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pkg.id}</td>
                <td>${pkg.place_name}</td>
                <td>${pkg.package_name}</td>
                <td>${pkg.days}</td>
                <td>${pkg.nights}</td>
                <td>${pkg.price}</td>
                <td>${pkg.hotel}</td>
                <td>${pkg.flights}</td>
                <td>${pkg.cabs}</td>
                <td>${pkg.food}</td>
                <td>${pkg.description || 'N/A'}</td>
                <td>${new Date(pkg.start_date).toLocaleDateString()}</td> <!-- Format start_date -->
                <td>
                    <button onclick="editPackage('${pkg.id}', '${pkg.place_name}', '${pkg.package_name}', '${pkg.days}', '${pkg.nights}', '${pkg.price}', '${pkg.hotel}', '${pkg.flights}', '${pkg.cabs}', '${pkg.food}', '${pkg.description || ''}', '${pkg.start_date}')">Edit</button>
                    <button onclick="deletePackage('${pkg.id}')">Delete</button>
                </td>
            `;
            editTbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching packages:', err);
        alert('Error fetching packages: ' + err.message);
    }
}



async function fetchPlaces() {
    try {
        const response = await fetch('/api/admin/places', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch places');
        }
        const places = await response.json();
        const datalist = document.getElementById('places-list');
        datalist.innerHTML = '';
        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place.name;
            datalist.appendChild(option);
        });
    } catch (err) {
        console.error('Error fetching places:', err);
        alert('Error fetching places: ' + err.message);
    }
}async function fetchNotifications() {
    try {
        const response = await fetch('/api/admin/notifications', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notifications');
        }
        const notifications = await response.json();
        const tbody = document.querySelector('#notifications-table tbody');
        tbody.innerHTML = '';
        notifications.forEach(notif => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${notif.package_id}</td>
                <td>${notif.package_name}</td>
                <td>${notif.message}</td>
                <td>${new Date(notif.date).toLocaleDateString()}</td> <!-- Format date -->
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        alert('Error fetching notifications: ' + err.message);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`${sectionId}-section`).style.display = 'block';

    document.querySelectorAll('.sidebar ul li a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.sidebar ul li a[onclick="showSection('${sectionId}')"]`).classList.add('active');

    if (sectionId === 'bookings') fetchBookings();
    if (sectionId === 'packages') {
        fetchPlaces();
        fetchPackages();
    }
    if (sectionId === 'notifications') fetchNotifications();
}

function showPackageSection(section) {
    document.querySelectorAll('.package-content').forEach(el => el.style.display = 'none');
    if (section === 'add') {
        document.getElementById('add-package-section').style.display = 'block';
    } else if (section === 'edit') {
        document.getElementById('edit-delete-package-section').style.display = 'block';
        fetchPackages();
    } else if (section === 'view') {
        document.getElementById('view-package-section').style.display = 'block';
        fetchPackages();
    }
}

function editPackage(id, place_name, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date) {
    document.getElementById('package-id').value = id;
    document.getElementById('place-id').value = place_name;
    document.getElementById('package-name').value = package_name;
    document.getElementById('days').value = days;
    document.getElementById('nights').value = nights;
    document.getElementById('price').value = price;
    document.getElementById('hotel').value = hotel;
    document.getElementById('flights').value = flights;
    document.getElementById('cabs').value = cabs;
    document.getElementById('food').value = food;
    document.getElementById('description').value = description || '';
    document.getElementById('start-date').value = start_date;
    showPackageSection('add');
}

async function savePackage() {
    const id = document.getElementById('package-id').value;
    const place_id = document.getElementById('place-id').value;
    const package_name = document.getElementById('package-name').value;
    const days = document.getElementById('days').value;
    const nights = document.getElementById('nights').value;
    const price = document.getElementById('price').value;
    const hotel = document.getElementById('hotel').value;
    const flights = document.getElementById('flights').value;
    const cabs = document.getElementById('cabs').value;
    const food = document.getElementById('food').value;
    const description = document.getElementById('description').value;
    const start_date = document.getElementById('start-date').value;

    if (!place_id || !package_name || !days || !nights || !price || !hotel || !flights || !cabs || !food || !start_date) {
        alert('All fields except description are required');
        return;
    }

    try {
        let response;
        if (id) {
            response = await fetch(`/api/admin/packages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ place_id, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date })
            });
        } else {
            response = await fetch('/api/admin/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ place_id, package_name, days, nights, price, hotel, flights, cabs, food, description, start_date })
            });
        }
        const result = await response.json();
        if (response.ok) {
            alert('Package Saved');
            clearPackageForm();
            fetchPackages();
        } else {
            alert(result.error || 'Failed to save package');
        }
    } catch (err) {
        console.error('Error saving package:', err);
        alert('Error saving package: ' + err.message);
    }
}

function clearPackageForm() {
    document.getElementById('package-id').value = '';
    document.getElementById('place-id').value = '';
    document.getElementById('package-name').value = '';
    document.getElementById('days').value = '';
    document.getElementById('nights').value = '';
    document.getElementById('price').value = '';
    document.getElementById('hotel').value = 'Yes';
    document.getElementById('flights').value = 'Yes';
    document.getElementById('cabs').value = 'Yes';
    document.getElementById('food').value = 'Yes';
    document.getElementById('description').value = '';
    document.getElementById('start-date').value = '';
}

async function deletePackage(id) {
    if (confirm('Are you sure you want to delete this package?')) {
        try {
            const response = await fetch(`/api/admin/packages/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                fetchPackages();
            } else {
                alert(result.error);
            }
        } catch (err) {
            console.error('Error deleting package:', err);
            alert('Error deleting package');
        }
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (err) {
        console.error('Error logging out:', err);
        window.location.href = '/';
    }
}

checkAdminSession();
fetchBookings();