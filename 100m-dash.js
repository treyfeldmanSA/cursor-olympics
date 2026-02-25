document.addEventListener('DOMContentLoaded', () => {
    const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);
    if (!isLocal) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    const eventsDropdown = document.querySelector('.events-dropdown');
    if (eventsDropdown) {
        const trigger = eventsDropdown.querySelector('.events-trigger');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            eventsDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => eventsDropdown.classList.remove('open'));
    }

    // --- Timer Logic (milliseconds for speed event) ---
    let timerInterval;
    let msElapsed = 0;
    const maxMs = 5 * 60 * 1000; // 5 minutes

    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-timer');
    const stopBtn = document.getElementById('stop-timer');
    const recordFinishBtn = document.getElementById('record-finish');

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = Math.floor((ms % 1000) / 1);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
    }

    function getCurrentTimeSeconds() {
        return Math.round(msElapsed) / 1000;
    }

    function updateTimer() {
        timerDisplay.textContent = formatTime(msElapsed);
        if (msElapsed >= maxMs) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerDisplay.style.color = '#dc3545';
            recordFinishBtn.disabled = true;
            startBtn.disabled = true;
            stopBtn.disabled = true;
        }
    }

    startBtn.addEventListener('click', () => {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            msElapsed += 10;
            updateTimer();
        }, 10);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        recordFinishBtn.disabled = false;
    });

    stopBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        recordFinishBtn.disabled = true;
    });

    document.getElementById('reset-event').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        msElapsed = 0;
        updateTimer();
        timerDisplay.style.color = '#333';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        recordFinishBtn.disabled = true;
        results = [];
        renderResults();
    });


    // --- Results & Podium Logic ---
    const resultsList = document.getElementById('results-list');
    let results = [];

    function renderResults() {
        resultsList.innerHTML = '';
        if (results.length === 0) {
            resultsList.innerHTML = '<li class="empty-state">Click "Record Finish" when each participant crosses the line.</li>';
            return;
        }

        results.sort((a, b) => a.time - b.time);

        results.forEach(result => {
            const li = document.createElement('li');
            li.className = 'result-item';
            li.dataset.id = result.id;
            if (result.verified === true) li.classList.add('verified');
            if (result.verified === false) li.classList.add('disqualified');

            const flag = result.country === 'India' ? '🇮🇳' : (result.country === 'Nepal' ? '🇳🇵' : (result.country === 'USA' ? '🇺🇸' : ''));

            li.innerHTML = `
                <div class="result-time">${formatResultTime(result.time)}</div>
                <div class="result-edit">
                    <input type="text" class="edit-name" placeholder="Name" value="${escapeHtml(result.name)}" data-id="${result.id}">
                    <div class="result-flags" data-id="${result.id}">
                        <button type="button" class="btn-flag-small ${result.country === 'India' ? 'selected' : ''}" data-country="India">🇮🇳</button>
                        <button type="button" class="btn-flag-small ${result.country === 'Nepal' ? 'selected' : ''}" data-country="Nepal">🇳🇵</button>
                        <button type="button" class="btn-flag-small ${result.country === 'USA' ? 'selected' : ''}" data-country="USA">🇺🇸</button>
                    </div>
                </div>
                <div class="result-actions">
                    ${result.verified === null ? `
                        <button class="btn-verify" data-id="${result.id}">✓</button>
                        <button class="btn-disqualify" data-id="${result.id}">✗</button>
                    ` : (result.verified ? '<span class="status-verified">✓</span>' : '<span class="status-disqualified">✗</span>')}
                </div>
            `;
            resultsList.appendChild(li);
        });

        updatePodium();
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatResultTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3);
        return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
    }

    function updatePodium() {
        const verifiedResults = results.filter(r => r.verified === true).sort((a, b) => a.time - b.time);
        const winners = [verifiedResults[0], verifiedResults[1], verifiedResults[2]];
        const podiumIds = ['winner-gold', 'winner-silver', 'winner-bronze'];

        podiumIds.forEach((id, index) => {
            const el = document.getElementById(id);
            if (winners[index]) {
                const r = winners[index];
                const flag = r.country === 'India' ? '🇮🇳' : (r.country === 'Nepal' ? '🇳🇵' : (r.country === 'USA' ? '🇺🇸' : ''));
                el.innerHTML = `<div class="podium-name">${escapeHtml(r.name || '—')}</div><div class="podium-flag">${flag}</div><div class="podium-time">${formatResultTime(r.time)}</div>`;
            } else {
                el.innerHTML = '';
            }
        });
    }

    function verifyResult(id) {
        const r = results.find(x => x.id === id);
        if (r) { r.verified = true; renderResults(); }
    }

    function disqualifyResult(id) {
        const r = results.find(x => x.id === id);
        if (r) { r.verified = false; renderResults(); }
    }

    recordFinishBtn.addEventListener('click', () => {
        const timeSec = getCurrentTimeSeconds();
        results.push({
            id: Date.now(),
            name: '',
            country: '',
            time: timeSec,
            verified: null
        });
        renderResults();
    });

    document.getElementById('submit-results').addEventListener('click', async () => {
        const verified = results.filter(r => r.verified === true).sort((a, b) => a.time - b.time);
        const [gold, silver, bronze] = [verified[0], verified[1], verified[2]];
        if (!gold || !silver || !bronze) {
            alert('Please verify all three podium winners before submitting.');
            return;
        }
        const eventName = 'Individual Speed Coding 100m';
        try {
            await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: eventName, winner: gold.country, medal: 'gold', winnerName: gold.name }) });
            await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: eventName, winner: silver.country, medal: 'silver', winnerName: silver.name }) });
            await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: eventName, winner: bronze.country, medal: 'bronze', winnerName: bronze.name }) });
            window.location.href = 'index.html';
        } catch (e) {
            alert('Failed to submit results.');
        }
    });

    // Event delegation for edits and buttons
    resultsList.addEventListener('input', (e) => {
        const nameInput = e.target.closest('.edit-name');
        if (nameInput) {
            const id = parseInt(nameInput.dataset.id);
            const r = results.find(x => x.id === id);
            if (r) r.name = nameInput.value;
        }
    });
    resultsList.addEventListener('click', (e) => {
        const flagBtn = e.target.closest('.btn-flag-small');
        if (flagBtn) {
            e.preventDefault();
            const id = parseInt(flagBtn.closest('.result-flags').dataset.id);
            const r = results.find(x => x.id === id);
            if (r) {
                r.country = flagBtn.dataset.country;
                flagBtn.closest('.result-flags').querySelectorAll('.btn-flag-small').forEach(b => b.classList.remove('selected'));
                flagBtn.classList.add('selected');
            }
        }
    });
    resultsList.addEventListener('click', (e) => {
        const verifyBtn = e.target.closest('.btn-verify');
        const disqualifyBtn = e.target.closest('.btn-disqualify');
        if (verifyBtn) verifyResult(parseInt(verifyBtn.dataset.id));
        if (disqualifyBtn) disqualifyResult(parseInt(disqualifyBtn.dataset.id));
    });
});
