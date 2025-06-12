document.addEventListener('DOMContentLoaded', () => {
    const updateButton = document.getElementById('updateRates');
    const statusDiv = document.getElementById('status');
    const currentRatesDiv = document.getElementById('currentRates');

    // Показываем текущие курсы при загрузке
    chrome.storage.local.get('rates', (data) => {
        if (data.rates) {
            const date = new Date(data.rates.timestamp);
            currentRatesDiv.innerHTML = `
                Son yenilənmə: ${date.toLocaleDateString()}<br>
                USD: ${data.rates.USD} ₼<br>
                TRY: ${data.rates.TRY} ₼<br>
                RUB: ${data.rates.RUB} ₼
            `;
        } else {
            currentRatesDiv.textContent = 'Məzənnələr yenilənməlidir';
        }
    });

    updateButton.addEventListener('click', async () => {
        statusDiv.textContent = 'Məzənnələr yenilənir...';
        updateButton.disabled = true;

        try {
            const response = await chrome.runtime.sendMessage({ action: "updateRates" });
            if (response.success) {
                chrome.storage.local.get('rates', (data) => {
                    const date = new Date(data.rates.timestamp);
                    currentRatesDiv.innerHTML = `
                        Son yenilənmə: ${date.toLocaleDateString()}<br>
                        USD: ${data.rates.USD} ₼<br>
                        TRY: ${data.rates.TRY} ₼<br>
                        RUB: ${data.rates.RUB} ₼
                    `;
                });
                statusDiv.textContent = 'Məzənnələr yeniləndi!';
                statusDiv.style.color = '#4CAF50';
            } else {
                statusDiv.textContent = 'Xəta baş verdi!';
                statusDiv.style.color = '#f44336';
            }
        } catch (error) {
            statusDiv.textContent = 'Xəta baş verdi!';
            statusDiv.style.color = '#f44336';
        }

        updateButton.disabled = false;
    });
});
