document.addEventListener('DOMContentLoaded', () => {
    const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);

    const eventsDropdown = document.querySelector('.events-dropdown');
    if (eventsDropdown) {
        const trigger = eventsDropdown.querySelector('.events-trigger');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            eventsDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => eventsDropdown.classList.remove('open'));
    }
    if (!isLocal) {
        document.body.classList.add('readonly-mode');
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    const medalGrid = document.querySelector('.medal-grid');
    const eventsList = document.getElementById('events-list');
    const eventForm = document.getElementById('event-form');

    // Initial Fetch
    fetchData();

    function fetchData() {
        const dataUrl = isLocal ? '/api/data' : 'data.json?t=' + Date.now();
        fetch(dataUrl)
            .then(response => response.json())
            .then(data => {
                updateMedalTable(data.medals);
                updateEventsList(data.events);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function updateMedalTable(medals) {
        // India
        document.getElementById('india-gold').textContent = medals.India.gold;
        document.getElementById('india-silver').textContent = medals.India.silver;
        document.getElementById('india-bronze').textContent = medals.India.bronze;

        // Nepal
        document.getElementById('nepal-gold').textContent = medals.Nepal.gold;
        document.getElementById('nepal-silver').textContent = medals.Nepal.silver;
        document.getElementById('nepal-bronze').textContent = medals.Nepal.bronze;

        // USA
        document.getElementById('usa-gold').textContent = medals.USA.gold;
        document.getElementById('usa-silver').textContent = medals.USA.silver;
        document.getElementById('usa-bronze').textContent = medals.USA.bronze;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function updateEventsList(events) {
        eventsList.innerHTML = '';
        // Show most recent first
        events.slice().reverse().forEach(event => {
            const li = document.createElement('li');
            li.className = 'event-item';
            
            const medalEmoji = event.medal === 'gold' ? '🥇' : (event.medal === 'silver' ? '🥈' : '🥉');
            const winnerFlag = event.winner === 'India' ? '🇮🇳' : (event.winner === 'Nepal' ? '🇳🇵' : '🇺🇸');
            const winnerText = event.winnerName ? `${escapeHtml(event.winnerName)} (${event.winner} ${winnerFlag})` : `${event.winner} ${winnerFlag}`;

            li.innerHTML = `
                <div class="event-details">
                    <span class="event-name">${escapeHtml(event.name)}</span>
                    <span class="event-winner">Winner: ${winnerText}</span>
                </div>
                <div class="event-medal" title="${event.medal}">${medalEmoji}</div>
            `;
            eventsList.appendChild(li);
        });
    }

    if (isLocal) {
        document.querySelectorAll('.btn-flag').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-flag').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('winner-country').value = btn.dataset.country;
            });
        });
        document.querySelectorAll('.btn-medal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-medal').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('medal-type').value = btn.dataset.medal;
            });
        });

        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('event-name').value.trim();
            const winner = document.getElementById('winner-country').value;
            const medal = document.getElementById('medal-type').value;
            const winnerName = document.getElementById('winner-name').value.trim();

            if (!winner || !medal) {
                alert('Please select a country and medal.');
                return;
            }

            fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, winner, medal, winnerName: winnerName || undefined })
            })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (ok && data.success) {
                    updateMedalTable(data.medals);
                    updateEventsList(data.events);
                    eventForm.reset();
                    document.querySelectorAll('.btn-flag, .btn-medal').forEach(b => b.classList.remove('selected'));
                    document.getElementById('winner-country').value = '';
                    document.getElementById('medal-type').value = '';
                } else {
                    alert(data.error || 'Error saving event');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Network error. Is the server running?');
            });
        });

        document.getElementById('push-results').addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target;
            link.textContent = 'Pushing...';
            fetch('/api/push', { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    link.textContent = data.success ? 'Pushed!' : 'Failed';
                    if (data.success) setTimeout(() => link.textContent = 'Update results in repo', 2000);
                })
                .catch(() => { link.textContent = 'Failed'; });
        });
    }
});
