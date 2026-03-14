// ========== State ==========
const state = {
    units: { bmr: 'metric', bmi: 'metric', bfp: 'metric', tdee: 'metric' },
    sex: { bmr: 'male', bfp: 'male', tdee: 'male' }
};

// ========== Splash Screen ==========
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash').classList.add('fade-out');
        document.getElementById('app').classList.remove('hidden');
        setTimeout(() => document.getElementById('splash').remove(), 500);
    }, 1200);
});

// ========== Theme Toggle ==========
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('luna-theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('luna-theme', isDark ? 'light' : 'dark');
});

// ========== Tab Navigation ==========
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('calc-' + tab.dataset.calc).classList.add('active');
    });
});

// ========== Unit Toggles ==========
document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const calc = btn.dataset.calc;
        const unit = btn.dataset.unit;
        state.units[calc] = unit;

        btn.parentElement.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const weightUnit = document.getElementById(calc + '-weight-unit');
        const heightUnit = document.getElementById(calc + '-height-unit');
        if (weightUnit) weightUnit.textContent = unit === 'metric' ? 'kg' : 'lbs';
        if (heightUnit) heightUnit.textContent = unit === 'metric' ? 'cm' : 'in';

        const weightInput = document.getElementById(calc + '-weight');
        const heightInput = document.getElementById(calc + '-height');
        if (weightInput) weightInput.placeholder = unit === 'metric' ? '70' : '154';
        if (heightInput) heightInput.placeholder = unit === 'metric' ? '175' : '69';
    });
});

// ========== Sex Toggles ==========
document.querySelectorAll('.sex-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const calc = btn.dataset.calc;
        state.sex[calc] = btn.dataset.sex;
        btn.parentElement.querySelectorAll('.sex-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ========== Helpers ==========
function getVal(id) {
    return parseFloat(document.getElementById(id).value);
}

function toMetric(val, type, calc) {
    if (state.units[calc] === 'imperial') {
        return type === 'weight' ? val * 0.453592 : val * 2.54;
    }
    return val;
}

function validate(fields) {
    let valid = true;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (!el.value || isNaN(parseFloat(el.value)) || parseFloat(el.value) <= 0) {
            el.closest('.input-wrap').classList.add('input-shake');
            setTimeout(() => el.closest('.input-wrap').classList.remove('input-shake'), 400);
            valid = false;
        }
    });
    return valid;
}

function showResult(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== BMR Calculator ==========
function calculateBMR() {
    if (!validate(['bmr-weight', 'bmr-height', 'bmr-age'])) return;

    const weight = toMetric(getVal('bmr-weight'), 'weight', 'bmr');
    const height = toMetric(getVal('bmr-height'), 'height', 'bmr');
    const age = getVal('bmr-age');
    const sex = state.sex.bmr;

    let bmr;
    if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    animateNumber('bmr-value', Math.round(bmr));
    showResult('bmr-result');
}

// ========== BMI Calculator ==========
function calculateBMI() {
    if (!validate(['bmi-weight', 'bmi-height'])) return;

    const weight = toMetric(getVal('bmi-weight'), 'weight', 'bmi');
    const height = toMetric(getVal('bmi-height'), 'height', 'bmi') / 100;

    const bmi = weight / (height * height);
    const rounded = Math.round(bmi * 10) / 10;

    animateNumber('bmi-value', rounded, 1);

    let category, color;
    if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; }
    else if (bmi < 25) { category = 'Normal Weight'; color = '#22c55e'; }
    else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; }
    else { category = 'Obese'; color = '#ef4444'; }

    document.getElementById('bmi-category').textContent = category;
    document.getElementById('bmi-category').style.color = color;

    // Position gauge pointer
    const clampedBmi = Math.min(Math.max(bmi, 10), 40);
    const pct = ((clampedBmi - 10) / 30) * 100;
    document.getElementById('bmi-pointer').style.left = pct + '%';

    showResult('bmi-result');
}

// ========== BFP Calculator ==========
function calculateBFP() {
    if (!validate(['bfp-weight', 'bfp-height', 'bfp-age'])) return;

    const weight = toMetric(getVal('bfp-weight'), 'weight', 'bfp');
    const height = toMetric(getVal('bfp-height'), 'height', 'bfp') / 100;
    const age = getVal('bfp-age');
    const sex = state.sex.bfp;

    const bmi = weight / (height * height);
    let bfp;
    if (sex === 'male') {
        bfp = 1.20 * bmi + 0.23 * age - 16.2;
    } else {
        bfp = 1.20 * bmi + 0.23 * age - 5.4;
    }

    bfp = Math.max(2, Math.round(bfp * 10) / 10);
    animateNumber('bfp-value', bfp, 1);

    let category;
    if (sex === 'male') {
        if (bfp <= 5) category = 'Essential Fat';
        else if (bfp <= 13) category = 'Athletes';
        else if (bfp <= 17) category = 'Fitness';
        else if (bfp <= 24) category = 'Average';
        else category = 'Above Average';
    } else {
        if (bfp <= 13) category = 'Essential Fat';
        else if (bfp <= 20) category = 'Athletes';
        else if (bfp <= 24) category = 'Fitness';
        else if (bfp <= 31) category = 'Average';
        else category = 'Above Average';
    }

    document.getElementById('bfp-category').textContent = category;
    showResult('bfp-result');
}

// ========== TDEE Calculator ==========
function calculateTDEE() {
    if (!validate(['tdee-weight', 'tdee-height', 'tdee-age'])) return;

    const weight = toMetric(getVal('tdee-weight'), 'weight', 'tdee');
    const height = toMetric(getVal('tdee-height'), 'height', 'tdee');
    const age = getVal('tdee-age');
    const sex = state.sex.tdee;
    const activity = parseFloat(document.getElementById('tdee-activity').value);

    let bmr;
    if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const tdee = Math.round(bmr * activity);

    animateNumber('tdee-value', tdee);
    document.getElementById('tdee-lose').textContent = (tdee - 500).toLocaleString();
    document.getElementById('tdee-maintain').textContent = tdee.toLocaleString();
    document.getElementById('tdee-gain').textContent = (tdee + 500).toLocaleString();
    showResult('tdee-result');
}

// ========== Macro Calculator ==========
function calculateMacros() {
    if (!validate(['macro-calories'])) return;

    const calories = getVal('macro-calories');
    const goal = document.getElementById('macro-goal').value;

    let proteinPct, carbsPct, fatsPct;
    if (goal === 'lose') {
        proteinPct = 0.40; carbsPct = 0.30; fatsPct = 0.30;
    } else if (goal === 'gain') {
        proteinPct = 0.30; carbsPct = 0.45; fatsPct = 0.25;
    } else {
        proteinPct = 0.30; carbsPct = 0.40; fatsPct = 0.30;
    }

    const proteinCal = Math.round(calories * proteinPct);
    const carbsCal = Math.round(calories * carbsPct);
    const fatsCal = Math.round(calories * fatsPct);

    const proteinG = Math.round(proteinCal / 4);
    const carbsG = Math.round(carbsCal / 4);
    const fatsG = Math.round(fatsCal / 9);

    document.getElementById('protein-pct').textContent = Math.round(proteinPct * 100) + '%';
    document.getElementById('carbs-pct').textContent = Math.round(carbsPct * 100) + '%';
    document.getElementById('fats-pct').textContent = Math.round(fatsPct * 100) + '%';

    document.getElementById('protein-g').textContent = proteinG + 'g';
    document.getElementById('carbs-g').textContent = carbsG + 'g';
    document.getElementById('fats-g').textContent = fatsG + 'g';

    document.getElementById('protein-cal').textContent = proteinCal + ' kcal';
    document.getElementById('carbs-cal').textContent = carbsCal + ' kcal';
    document.getElementById('fats-cal').textContent = fatsCal + ' kcal';

    // Animate rings
    const circumference = 326.73;
    animateRing('ring-protein', proteinPct, circumference);
    animateRing('ring-carbs', carbsPct, circumference);
    animateRing('ring-fats', fatsPct, circumference);

    document.getElementById('macro-result').classList.remove('hidden');
}

function animateRing(id, pct, circumference) {
    const ring = document.getElementById(id).querySelector('.ring-progress');
    const offset = circumference - (circumference * pct);
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
}

// ========== Animate Number ==========
function animateNumber(id, target, decimals = 0) {
    const el = document.getElementById(id);
    const start = 0;
    const duration = 800;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        el.textContent = current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ========== PWA Install ==========
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    installBtn.classList.remove('hidden');

    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    });
});

// ========== Service Worker ==========
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
