const facilities = [
    { id: 1, name: "FITTY A/C Gymnasium - Men", price: 6490, category: "gym", icon: "fa-dumbbell", gender: "men" },
    { id: 2, name: "Trendset A/C Gymnasium - Men", price: 5310, category: "gym", icon: "fa-dumbbell", gender: "men" },
    { id: 3, name: "Indoor A/C Gymnasium - Men", price: 5310, category: "gym", icon: "fa-dumbbell", gender: "men" },
    { id: 4, name: "Indoor A/C Gymnasium Women (C & D Block)", price: 5310, category: "gym", icon: "fa-dumbbell", gender: "women" },
    { id: 5, name: "A/C Gymnasium - Women (G Block)", price: 5310, category: "gym", icon: "fa-dumbbell", gender: "women" },
    { id: 6, name: "A/C Gymnasium - Women (A & B Block)", price: 4425, category: "gym", icon: "fa-dumbbell", gender: "women" },
    { id: 7, name: "Swimming Men/Women", price: 5310, category: "aquatic", icon: "fa-person-swimming", gender: "unisex" },
    { id: 8, name: "Synthetic Tennis Men/Women", price: 4425, category: "racquet", icon: "fa-baseball", gender: "unisex" },
    { id: 9, name: "Badminton Indoor Men/Women", price: 4425, category: "racquet", icon: "fa-table-tennis-paddle-ball", gender: "unisex" },
    { id: 10, name: "A/C Squash Men/Women", price: 4425, category: "racquet", icon: "fa-table-tennis-paddle-ball", gender: "unisex" },
    { id: 11, name: "A/C Snooker Men/Women", price: 4425, category: "other", icon: "fa-circle", gender: "unisex" },
    { id: 12, name: "Karate Men/Women", price: 3540, category: "other", icon: "fa-hand-fist", gender: "unisex" }
];

let currentFacility = null;
let qrcode = null;
let currentTransactionId = null;
let activeFilter = 'all';

const categoryColors = {
    gym: { gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', badge: '#7c3aed' },
    aquatic: { gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', badge: '#06b6d4' },
    racquet: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', badge: '#f59e0b' },
    other: { gradient: 'linear-gradient(135deg, #10b981, #059669)', badge: '#10b981' }
};

const genderIcons = {
    men: '<i class="fas fa-mars"></i>',
    women: '<i class="fas fa-venus"></i>',
    unisex: '<i class="fas fa-venus-mars"></i>'
};

function renderFacilities(list) {
    const container = document.getElementById('facilities-container');
    const empty = document.getElementById('emptyState');
    container.innerHTML = '';

    if (list.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    list.forEach((facility, index) => {
        const colors = categoryColors[facility.category];
        const card = document.createElement('div');
        card.className = 'facility-card';
        card.style.animationDelay = `${index * 0.06}s`;
        card.innerHTML = `
            <div class="card-icon-bar" style="background: ${colors.gradient};">
                <i class="fas ${facility.icon}"></i>
            </div>
            <div class="card-body">
                <div class="card-tags">
                    <span class="tag category-tag" style="background: ${colors.badge}22; color: ${colors.badge};">${facility.category}</span>
                    <span class="tag gender-tag">${genderIcons[facility.gender]} ${facility.gender}</span>
                </div>
                <h3>${facility.name}</h3>
                <div class="price-row">
                    <span class="price">₹${facility.price.toLocaleString()}</span>
                    <span class="per-sem">/ semester</span>
                </div>
                <button class="register-btn" onclick="initiatePayment(${facility.id})">
                    <i class="fas fa-credit-card"></i> Register Now
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function getFilteredList() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    return facilities.filter(f => {
        const matchCategory = activeFilter === 'all' || f.category === activeFilter;
        const matchSearch = f.name.toLowerCase().includes(query);
        return matchCategory && matchSearch;
    });
}

function filterFacilities() {
    renderFacilities(getFilteredList());
}

function setFilter(category, btn) {
    activeFilter = category;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterFacilities();
}

// Initial render
renderFacilities(facilities);

// ====== Payment Logic ======
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function initiatePayment(facilityId) {
    currentFacility = facilities.find(f => f.id === facilityId);
    currentTransactionId = generateTransactionId();

    const modal = document.getElementById('paymentModal');
    const qrContainer = modal.querySelector('#qrcode');
    qrContainer.innerHTML = '';

    const paymentData = {
        facilityName: currentFacility.name,
        amount: currentFacility.price,
        transactionId: currentTransactionId,
        timestamp: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 15 * 60000).toISOString()
    };

    modal.querySelector('#paymentAmount').textContent = currentFacility.price.toLocaleString();

    new QRCode(qrContainer, {
        text: JSON.stringify(paymentData),
        width: 200,
        height: 200,
        colorDark: "#1e1b4b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    modal.style.display = 'flex';
}

function simulatePayment(isSuccess) {
    closePaymentModal();
    generatePaymentBill(isSuccess);
}

function generatePaymentBill(isSuccess) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const billNumber = 'BILL-' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const billHTML = `
        <div class="bill-container ${isSuccess ? 'success-bill' : 'failure-bill'}">
            <div class="bill-icon ${isSuccess ? 'success-icon' : 'failure-icon'}">
                <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </div>
            <h3 class="bill-title">${isSuccess ? 'Payment Successful!' : 'Payment Failed'}</h3>
            
            <div class="bill-details">
                <div class="bill-row"><span>Bill Number</span><strong>${billNumber}</strong></div>
                <div class="bill-row"><span>Transaction ID</span><strong style="font-size:11px;">${currentTransactionId}</strong></div>
                <div class="bill-row"><span>Date & Time</span><strong>${date} ${time}</strong></div>
                <div class="bill-row"><span>Facility</span><strong>${currentFacility.name}</strong></div>
                <div class="bill-row total"><span>Amount Paid</span><strong>₹${currentFacility.price.toLocaleString()}/-</strong></div>
            </div>

            <div class="bill-footer">
                ${isSuccess ?
                    `<p class="validity"><i class="fas fa-calendar-check"></i> Valid for one semester</p>
                     <p class="thank-you">Thank you for your registration!</p>` :
                    `<p class="failure-message"><i class="fas fa-exclamation-triangle"></i> Transaction failed. Please try again.</p>`
                }
            </div>

            <div class="bill-actions">
                ${isSuccess ? '<button onclick="printBill()" class="print-btn"><i class="fas fa-print"></i> Print</button>' : ''}
                <button onclick="closeModal()" class="close-btn"><i class="fas fa-times"></i> Close</button>
            </div>
        </div>
    `;

    document.getElementById('receiptContent').innerHTML = billHTML;
    document.getElementById('receiptModal').style.display = 'flex';
}

function printBill() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const billContent = document.querySelector('.bill-container').cloneNode(true);
    const actionButtons = billContent.querySelector('.bill-actions');
    if (actionButtons) actionButtons.remove();

    printWindow.document.write(`
        <html><head><title>Payment Bill</title>
        <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 20px; }
            .bill-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .bill-icon { text-align: center; font-size: 40px; margin-bottom: 10px; }
            .success-icon { color: #10b981; }
            .failure-icon { color: #ef4444; }
            .bill-title { text-align: center; }
            .bill-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .bill-footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px solid #ddd; }
            .validity { color: #10b981; font-weight: bold; }
            @media print { .bill-actions { display: none; } }
        </style></head><body>${billContent.outerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function closePaymentModal() { document.getElementById('paymentModal').style.display = 'none'; }
function closeModal() { document.getElementById('receiptModal').style.display = 'none'; }

window.onclick = function(event) {
    if (event.target === document.getElementById('paymentModal')) closePaymentModal();
    if (event.target === document.getElementById('receiptModal')) closeModal();
}; 