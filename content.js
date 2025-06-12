const currencyPatterns = [
    { regex: /(\$\s*)([\d.,]+)/g, code: "USD" },
    { regex: /([\d.,]+)(\s*USD|\s*usd|\s*dollar|\s*dolar|\$)/g, code: "USD" },
    { regex: /(₺\s*)([\d.,]+)/g, code: "TRY" },
    { regex: /([\d.,]+)(\s*TRY|\s*try|\s*tl|\s*TL|\s*lirə|\s*lira|₺)/g, code: "TRY" },
    { regex: /(₽\s*)([\d.,]+)/g, code: "RUB" },
    { regex: /([\d.,]+)(\s*RUB|\s*rub|\s*rubl|\s*руб|₽)/g, code: "RUB" }
];

function convertToAZN(amount, rate) {
    return (parseFloat(amount.replace(",", ".")) * rate).toFixed(2) + " ₼";
}

function createTooltip(text) {
    const tooltip = document.createElement("div");
    tooltip.className = "azn-tooltip";
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    return tooltip;
}

document.addEventListener("mouseover", (e) => {
    const el = e.target;
    if (!el.textContent) return;

    let matchFound = false;
    let value, currency;

    for (const pattern of currencyPatterns) {
        const matches = [...el.textContent.matchAll(pattern.regex)];
        if (matches.length > 0) {
            matchFound = true;
            const match = matches[0];
            value = match[1].startsWith('$') || match[1].startsWith('₺') || match[1].startsWith('₽') 
                ? match[2] 
                : match[1];
            currency = pattern.code;
            break;
        }
    }

    if (!matchFound) return;

    chrome.runtime.sendMessage({ action: "getRates" }, (rates) => {
        if (!rates) {
            console.error("Failed to get rates");
            return;
        }

        try {
            const converted = convertToAZN(value, rates[currency]);
            const tooltip = createTooltip(converted);

            const updatePosition = (event) => {
                tooltip.style.top = event.pageY + 10 + "px";
                tooltip.style.left = event.pageX + 10 + "px";
            };

            const removeTooltip = () => {
                tooltip.remove();
                el.removeEventListener("mousemove", updatePosition);
                el.removeEventListener("mouseout", removeTooltip);
            };

            updatePosition(e);
            el.addEventListener("mousemove", updatePosition);
            el.addEventListener("mouseout", removeTooltip);
        } catch (error) {
            console.error("Conversion error:", error);
        }
    });
});

