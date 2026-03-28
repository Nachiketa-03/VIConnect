document.getElementById('cgpaForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const currentCgpa = parseFloat(document.getElementById('currentCgpa').value);
    const creditsDone = parseFloat(document.getElementById('creditsDone').value);
    const currentGpa = parseFloat(document.getElementById('currentGpa').value);
    const semesterCredits = parseFloat(document.getElementById('semesterCredits').value);

    if (isNaN(currentCgpa) || isNaN(creditsDone) || isNaN(currentGpa) || isNaN(semesterCredits)) {
        alert("Please enter valid numbers in all fields.");
        return;
    }

    const totalCredits = creditsDone + semesterCredits;
    const weightedCgpa = (currentCgpa * creditsDone + currentGpa * semesterCredits) / totalCredits;
    const change = weightedCgpa - currentCgpa;

    // Update display
    document.getElementById('totalCgpa').textContent = weightedCgpa.toFixed(2);
    document.getElementById('totalCredits').textContent = totalCredits;

    const changeEl = document.getElementById('cgpaChange');
    changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(3);
    changeEl.style.color = change >= 0 ? '#10b981' : '#ef4444';

    // Animate gauge
    const percentage = (weightedCgpa / 10) * 314;
    const gaugeFill = document.getElementById('gaugeFill');
    gaugeFill.style.strokeDasharray = `${percentage} 314`;

    // Color based on CGPA
    let color = '#ef4444';
    if (weightedCgpa >= 9) color = '#10b981';
    else if (weightedCgpa >= 8) color = '#3b82f6';
    else if (weightedCgpa >= 7) color = '#f59e0b';
    else if (weightedCgpa >= 6) color = '#f97316';
    gaugeFill.style.stroke = color;

    // Show result
    document.getElementById('resultDisplay').style.opacity = '1';
    document.getElementById('resultDisplay').style.transform = 'translateY(0)';
});

// Reset handler
document.getElementById('resetButton').addEventListener('click', function() {
    document.getElementById('totalCgpa').textContent = '0.00';
    document.getElementById('totalCredits').textContent = '—';
    document.getElementById('cgpaChange').textContent = '—';
    document.getElementById('cgpaChange').style.color = '';
    document.getElementById('gaugeFill').style.strokeDasharray = '0 314';
    document.getElementById('resultDisplay').style.opacity = '0.5';
    document.getElementById('targetResult').innerHTML = '';
});

// Target CGPA calculator
function calculateTarget() {
    const currentCgpa = parseFloat(document.getElementById('currentCgpa').value);
    const creditsDone = parseFloat(document.getElementById('creditsDone').value);
    const semesterCredits = parseFloat(document.getElementById('semesterCredits').value);
    const targetCgpa = parseFloat(document.getElementById('targetCgpa').value);

    const resultEl = document.getElementById('targetResult');

    if (isNaN(targetCgpa) || isNaN(currentCgpa) || isNaN(creditsDone) || isNaN(semesterCredits)) {
        resultEl.innerHTML = '<p style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> Fill in all calculator fields and target CGPA first.</p>';
        return;
    }

    const totalCredits = creditsDone + semesterCredits;
    const requiredGpa = ((targetCgpa * totalCredits) - (currentCgpa * creditsDone)) / semesterCredits;

    if (requiredGpa > 10) {
        resultEl.innerHTML = '<p style="color:#ef4444;"><i class="fas fa-times-circle"></i> Not achievable this semester. Target CGPA too high.</p>';
    } else if (requiredGpa < 0) {
        resultEl.innerHTML = '<p style="color:#10b981;"><i class="fas fa-check-circle"></i> You\'ve already exceeded your target! Great job!</p>';
    } else {
        resultEl.innerHTML = `<p style="color:#3b82f6;"><i class="fas fa-bullseye"></i> You need a GPA of <strong>${requiredGpa.toFixed(2)}</strong> this semester to reach ${targetCgpa} CGPA.</p>`;
    }
}

function goBack() {
    if (window.vitNavigate) window.vitNavigate('/dashboard');
    else window.location.href = '/dashboard';
}
    