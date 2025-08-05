document.addEventListener('DOMContentLoaded', () => {
    const printerRowsContainer = document.getElementById('printer-rows');
    const globalInputs = document.querySelectorAll('.global-input');
    const NUM_PRINTERS = 20;

    const defaultGlobalSettings = {
        'electricity-price': 3.5,
        'handling-cost': 50,
        'implicit-cost': 10
    };

    const defaultPrinterData = {
        name: '印表機',
        p: 25000, // 購入價格
        l: 8760,  // 預估壽命
        t: '0d1h30m',     // 列印時間
        w: 300,   // 平均功耗
        m: 120    // 耗材費用
    };

    function parseTimeToHours(timeString) {
        if (!timeString || typeof timeString !== 'string') return 0;

        let totalHours = 0;
        const timeStringLower = timeString.toLowerCase();

        const daysMatch = timeStringLower.match(/(\d+\.?\d*)\s*d/);
        const hoursMatch = timeStringLower.match(/(\d+\.?\d*)\s*h/);
        const minutesMatch = timeStringLower.match(/(\d+\.?\d*)\s*m/);

        if (daysMatch) {
            totalHours += parseFloat(daysMatch[1]) * 24;
        }
        if (hoursMatch) {
            totalHours += parseFloat(hoursMatch[1]);
        }
        if (minutesMatch) {
            totalHours += parseFloat(minutesMatch[1]) / 60;
        }

        if (!daysMatch && !hoursMatch && !minutesMatch) {
            const fallbackHours = parseFloat(timeString);
            return isNaN(fallbackHours) ? 0 : fallbackHours;
        }

        return totalHours;
    }

    function calculateCost(p, l, t, w, m, e, h, i) {
        if (l === 0) return Infinity;
        const machineDepreciation = (p / l) * t;
        const electricityCost = (w / 1000) * t * e;
        const baseCost = machineDepreciation + electricityCost + m + h;
        const totalCost = baseCost * (1 + (i / 100));
        return totalCost;
    }

    function updateAllCosts() {
        const e = parseFloat(document.getElementById('electricity-price').value) || 0;
        const h = parseFloat(document.getElementById('handling-cost').value) || 0;
        const i = parseFloat(document.getElementById('implicit-cost').value) || 0;

        for (let j = 0; j < NUM_PRINTERS; j++) {
            const p = parseFloat(document.getElementById(`p-${j}`).value) || 0;
            const l = parseFloat(document.getElementById(`l-${j}`).value) || 0;
            const t_string = document.getElementById(`t-${j}`).value;
            const t = parseTimeToHours(t_string);
            const w = parseFloat(document.getElementById(`w-${j}`).value) || 0;
            const m = parseFloat(document.getElementById(`m-${j}`).value) || 0;

            const totalCost = calculateCost(p, l, t, w, m, e, h, i);
            const costOutput = document.getElementById(`c-${j}`);
            costOutput.textContent = isFinite(totalCost) ? `NT$ ${totalCost.toFixed(2)}` : 'N/A';
        }
    }

    function saveState() {
        const state = {
            global: {},
            printers: []
        };
        globalInputs.forEach(input => {
            state.global[input.id] = input.value;
        });

        for (let i = 0; i < NUM_PRINTERS; i++) {
            state.printers.push({
                name: document.getElementById(`name-${i}`).value,
                p: document.getElementById(`p-${i}`).value,
                l: document.getElementById(`l-${i}`).value,
                t: document.getElementById(`t-${i}`).value,
                w: document.getElementById(`w-${i}`).value,
                m: document.getElementById(`m-${i}`).value
            });
        }
        localStorage.setItem('3dPrinterCostCalculatorState', JSON.stringify(state));
    }

    function loadState() {
        const state = JSON.parse(localStorage.getItem('3dPrinterCostCalculatorState'));
        if (!state) return null;

        Object.keys(state.global).forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = state.global[id];
        });

        return state.printers;
    }

    function createRow(index, data) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" id="name-${index}" class="printer-name-input" value="${data.name}"></td>
            <td><input type="number" id="p-${index}" value="${data.p}"></td>
            <td><input type="number" id="l-${index}" value="${data.l}"></td>
            <td><input type="text" id="t-${index}" value="${data.t}"></td>
            <td><input type="number" id="w-${index}" value="${data.w}"></td>
            <td><input type="number" id="m-${index}" value="${data.m}"></td>
            <td id="c-${index}" class="cost-output"></td>
        `;
        printerRowsContainer.appendChild(tr);

        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                updateAllCosts();
                saveState();
            });
        });
    }

    // --- Initialization ---
    const savedPrinters = loadState();

    for (let i = 0; i < NUM_PRINTERS; i++) {
        let printerData = (savedPrinters && savedPrinters[i])
            ? savedPrinters[i]
            : { ...defaultPrinterData, name: `${defaultPrinterData.name} ${i + 1}` };
        createRow(i, printerData);
    }

    globalInputs.forEach(input => {
        input.addEventListener('input', () => {
            updateAllCosts();
            saveState();
        });
    });

    updateAllCosts();

    // --- Reset Button Logic ---
    const resetButton = document.getElementById('reset-defaults-btn');
    resetButton.addEventListener('click', () => {
        if (confirm('您確定要清除所有已儲存的資料並恢復為預設值嗎？此操作無法復原。')) {
            localStorage.removeItem('3dPrinterCostCalculatorState');
            location.reload();
        }
    });
});

