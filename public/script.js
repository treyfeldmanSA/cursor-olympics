document.addEventListener('DOMContentLoaded', () => {
    const medalGrid = document.querySelector('.medal-grid');
    const eventsList = document.getElementById('events-list');
    const eventForm = document.getElementById('event-form');

    // Initial Fetch
    fetchData();

    function fetchData() {
        fetch('/api/data')
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

    function updateEventsList(events) {
        eventsList.innerHTML = '';
        // Show most recent first
        events.slice().reverse().forEach(event => {
            const li = document.createElement('li');
            li.className = 'event-item';
            
            const medalEmoji = event.medal === 'gold' ? '🥇' : (event.medal === 'silver' ? '🥈' : '🥉');
            const winnerFlag = event.winner === 'India' ? '🇮🇳' : (event.winner === 'Nepal' ? '🇳🇵' : '🇺🇸');

            li.innerHTML = `
                <div class="event-details">
                    <span class="event-name">${event.name}</span>
                    <span class="event-winner">Winner: ${event.winner} ${winnerFlag}</span>
                </div>
                <div class="event-medal" title="${event.medal}">${medalEmoji}</div>
            `;
            eventsList.appendChild(li);
        });
    }

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('event-name').value;
        const winner = document.getElementById('winner-country').value;
        const medal = document.getElementById('medal-type').value;

        fetch('/api/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, winner, medal })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMedalTable(data.medals); // Update medals from server response
                updateEventsList(data.events); // Update events list
                eventForm.reset();
            } else {
                alert('Error saving event');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});
