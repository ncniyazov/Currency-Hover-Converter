async function fetchRates() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const url = `https://www.cbar.az/currencies/${dd}.${mm}.${yyyy}.xml`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response failed');
        
        const xml = await response.text();
        
        // Парсим XML с помощью регулярных выражений, так как DOMParser недоступен в Service Worker
        const rates = {};
        const currencies = ['USD', 'TRY', 'RUB'];
        
        for (const currency of currencies) {
            const match = xml.match(new RegExp(`<Valute[^>]*Code="${currency}"[^>]*>[\\s\\S]*?<Value>([\\d.]+)<\\/Value>`));
            if (match) {
                rates[currency] = parseFloat(match[1]);
            }
        }

        if (Object.keys(rates).length === 3) {
            rates.timestamp = Date.now();
            return rates;
        }
        throw new Error('Failed to parse all rates');
    } catch (error) {
        console.error('Error fetching rates:', error);
        return null;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getRates") {
        // Сначала проверяем сохраненные курсы
        chrome.storage.local.get('rates', async (data) => {
            if (data.rates && Date.now() - data.rates.timestamp < 24 * 60 * 60 * 1000) {
                sendResponse(data.rates);
            } else {
                const rates = await fetchRates();
                if (rates) {
                    chrome.storage.local.set({ rates });
                }
                sendResponse(rates);
            }
        });
        return true;
    }

    if (message.action === "updateRates") {
        fetchRates().then(rates => {
            if (rates) {
                chrome.storage.local.set({ rates }, () => {
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: false });
            }
        });
        return true;
    }
});
