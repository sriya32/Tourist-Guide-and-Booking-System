// src/public/js/welcome-user.js
let userId;
async function checkUserSession() {
    try {
        const response = await fetch('/api/auth/current', { credentials: 'include' });
        const result = await response.json();
        console.log('Response from /api/auth/current:', result);
        if (!response.ok || result.type !== 'user') {
            console.log('User not authenticated or not a user, redirecting to login');
            alert('You must be a user to access this page');
            window.location.href = '/';
            return false;
        } else {
            userId = parseInt(result.id);
            console.log('User ID set:', userId);
            if (!userId) {
                console.error('User ID is undefined after setting');
                alert('Failed to set user ID');
                window.location.href = '/';
                return false;
            }
            return true;
        }
    } catch (err) {
        console.error('Error checking session:', err);
        alert('Error checking session: ' + err.message);
        window.location.href = '/';
        return false;
    }
}

async function fetchBookings() {
    try {
        if (!userId) {
            throw new Error('User ID is not set');
        }
        const response = await fetch(`/api/bookings/${userId}`, { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/';
                return;
            }
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
        if (!userId) {
            throw new Error('User ID is not set');
        }
        const response = await fetch('/api/packages', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/';
                return;
            }
            throw new Error(errorData.error || 'Failed to fetch packages');
        }
        const packages = await response.json();
        const tbody = document.querySelector('#packages-table tbody');
        tbody.innerHTML = '';
        packages.forEach(pkg => {
            console.log('Package ID:', pkg.id);
            if (!pkg.id) {
                console.error('Package ID is undefined for package:', pkg);
                return;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pkg.place_name}</td>
                <td>${pkg.package_name}</td>
                <td>${pkg.days}</td>
                <td>${pkg.nights}</td>
                <td>${pkg.price}</td>
                <td>${pkg.hotel}</td>
                <td>${pkg.flights}</td>
                <td>${pkg.cabs}</td>
                <td>${pkg.food}</td>
                <td>${new Date(pkg.start_date).toLocaleDateString()}</td> <!-- Format start_date -->
                <td><button onclick="bookPackage(${pkg.id})">Book</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching packages:', err);
        alert('Error fetching packages: ' + err.message);
    }
}

async function fetchPlaces() {
    try {
        if (!userId) {
            throw new Error('User ID is not set');
        }
        const response = await fetch('/api/places', { credentials: 'include' });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/';
                return;
            }
            throw new Error(errorData.error || 'Failed to fetch places');
        }
        const places = await response.json();
        const tbody = document.querySelector('#places-table tbody');
        tbody.innerHTML = '';
        places.forEach(place => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${place.name}</td>
                <td>${place.description || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching places:', err);
        alert('Error fetching places: ' + err.message);
    }
}

async function bookPackage(packageId) {
    try {
        console.log('Booking package with userId:', userId, 'and packageId:', packageId);
        if (!userId || !packageId) {
            throw new Error('User ID and Package ID are required');
        }
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId, package_id: packageId })
        });
        const result = await response.json();
        if (response.ok) {
            alert('Package booked successfully');
            fetchBookings();
        } else {
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                window.location.href = '/';
                return;
            }
            throw new Error(result.error || 'Failed to book package');
        }
    } catch (err) {
        console.error('Error booking package:', err);
        alert('Error booking package: ' + err.message);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.sidebar ul li a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.sidebar ul li a[onclick="showSection('${sectionId}')"]`).classList.add('active');

    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`${sectionId}-section`).style.display = 'block';

    if (sectionId === 'bookings') {
        fetchBookings();
    } else if (sectionId === 'packages') {
        fetchPackages();
    } else if (sectionId === 'places') {
        fetchPlaces();
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

// Ensure checkUserSession completes before showing sections
checkUserSession().then(success => {
    if (success) {
        showSection('bookings'); // Show bookings section by default
    } else {
        console.log('checkUserSession failed, user redirected to login');
    }
});