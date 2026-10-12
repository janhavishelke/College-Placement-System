const { query, get, run } = require('../config/db');

// Cost of Living indices and monthly living estimates (in INR)
const CITY_COL_MAP = {
    'mumbai': { tier: 'Tier 1 - High', livingCostPerMonth: 28000, colIndex: 1.0 },
    'bangalore': { tier: 'Tier 1 - High', livingCostPerMonth: 27000, colIndex: 0.96 },
    'bengaluru': { tier: 'Tier 1 - High', livingCostPerMonth: 27000, colIndex: 0.96 },
    'gurgaon': { tier: 'Tier 1 - High', livingCostPerMonth: 26000, colIndex: 0.94 },
    'delhi': { tier: 'Tier 1 - High', livingCostPerMonth: 25000, colIndex: 0.92 },
    'pune': { tier: 'Tier 1 - Moderate', livingCostPerMonth: 20000, colIndex: 0.75 },
    'hyderabad': { tier: 'Tier 1 - Moderate', livingCostPerMonth: 19000, colIndex: 0.72 },
    'chennai': { tier: 'Tier 1 - Moderate', livingCostPerMonth: 19000, colIndex: 0.72 },
    'kolkata': { tier: 'Tier 2', livingCostPerMonth: 15000, colIndex: 0.58 },
    'remote': { tier: 'Work from Home', livingCostPerMonth: 10000, colIndex: 0.38 }
};

function calculateFinancials(ctcLpa, baseLpa, bonusLpa, location, workMode, bondMonths) {
    const ctc = parseFloat(ctcLpa) || 0;
    const base = parseFloat(baseLpa) || (ctc * 0.85); // If base not explicitly specified, assume 85%
    const bonus = parseFloat(bonusLpa) || (ctc - base);

    const annualBaseINR = base * 100000;
    
    // PF deduction (approx 12% of basic, basic is ~50% of base => 6% of base)
    const annualPF = annualBaseINR * 0.06;
    const profTax = 2500; // Standard annual professional tax

    // Standard tax deduction estimation under New Tax Regime
    // Up to 7L effectively tax free with rebate; 75k standard deduction
    const taxableIncome = Math.max(0, annualBaseINR - 75000);
    let estimatedTax = 0;
    if (taxableIncome > 700000) {
        if (taxableIncome <= 1000000) {
            estimatedTax = (taxableIncome - 700000) * 0.10 + 20000;
        } else {
            estimatedTax = (taxableIncome - 1000000) * 0.15 + 50000;
        }
    }

    const netAnnualInHandINR = Math.max(0, annualBaseINR - annualPF - profTax - estimatedTax);
    const monthlyInHandINR = Math.round(netAnnualInHandINR / 12);

    // City cost of living lookup
    const locLower = (location || '').toLowerCase();
    let matchedCityKey = Object.keys(CITY_COL_MAP).find(c => locLower.includes(c));
    if (workMode && workMode.toLowerCase().includes('remote')) matchedCityKey = 'remote';
    const cityInfo = matchedCityKey ? CITY_COL_MAP[matchedCityKey] : { tier: 'Tier 2 / General', livingCostPerMonth: 18000, colIndex: 0.70 };

    const estimatedSavingsINR = Math.max(0, monthlyInHandINR - cityInfo.livingCostPerMonth);

    // Flexibility & Bond Scores
    let flexibilityScore = 7;
    if (workMode === 'Remote') flexibilityScore = 10;
    else if (workMode === 'Hybrid') flexibilityScore = 8.5;
    else flexibilityScore = 6;

    let bondScore = 10;
    const bond = parseInt(bondMonths, 10) || 0;
    if (bond > 24) bondScore = 3;
    else if (bond > 12) bondScore = 5;
    else if (bond > 0) bondScore = 7.5;

    return {
        ctcLpa: ctc,
        baseLpa: parseFloat(base.toFixed(2)),
        bonusLpa: parseFloat(bonus.toFixed(2)),
        annualBaseINR,
        annualPF: Math.round(annualPF),
        estimatedTax: Math.round(estimatedTax),
        monthlyInHandINR,
        cityTier: cityInfo.tier,
        estimatedMonthlyLivingCost: cityInfo.livingCostPerMonth,
        estimatedMonthlySavings: estimatedSavingsINR,
        flexibilityScore,
        bondMonths: bond,
        bondScore
    };
}

exports.compareOffers = async (req, res) => {
    try {
        const { offers } = req.body; // Array of 2 to 3 offers

        if (!Array.isArray(offers) || offers.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least 2 offers to compare.'
            });
        }

        const comparedOffers = offers.map((offer, idx) => {
            const financials = calculateFinancials(
                offer.ctc,
                offer.baseSalary || offer.base,
                offer.bonus,
                offer.location,
                offer.workMode,
                offer.bondMonths
            );

            // Composite Offer Score out of 100
            // 40% In-Hand Pay, 25% Savings, 20% Flexibility, 15% Bond Freedom
            const payScore = Math.min(40, (financials.monthlyInHandINR / 100000) * 40);
            const savingsScore = Math.min(25, (financials.estimatedMonthlySavings / 70000) * 25);
            const flexScore = (financials.flexibilityScore / 10) * 20;
            const bondFreedomScore = (financials.bondScore / 10) * 15;
            const compositeScore = Math.round(payScore + savingsScore + flexScore + bondFreedomScore);

            const pros = [];
            const cons = [];

            if (financials.ctcLpa >= 6.5) pros.push('Competitive Total CTC');
            if (financials.monthlyInHandINR >= 45000) pros.push('Strong guaranteed monthly in-hand salary');
            if (offer.workMode === 'Hybrid' || offer.workMode === 'Remote') pros.push(`${offer.workMode} work flexibility`);
            if (financials.bondMonths === 0) pros.push('No bond or service agreement lock-in');
            if (financials.estimatedMonthlySavings >= 25000) pros.push('High monthly disposable savings margin');

            if (financials.bondMonths >= 24) cons.push(`Strict ${financials.bondMonths}-month service agreement bond`);
            if (financials.bonusLpa >= 1.5) cons.push('High variable component linked to annual performance');
            if (financials.cityTier.includes('High') && offer.workMode !== 'Remote') cons.push('Higher living costs in metropolitan center');
            if (offer.workMode === 'On-Site') cons.push('Full-time on-site presence required');

            return {
                id: offer.id || `offer-${idx + 1}`,
                companyName: offer.companyName,
                jobRole: offer.jobRole,
                location: offer.location,
                workMode: offer.workMode || 'On-Site',
                benefits: offer.benefits || 'Standard Medical Insurance, PF, Gratuity',
                financials,
                compositeScore,
                pros,
                cons
            };
        });

        // Determine highlights
        let bestCtcOffer = comparedOffers[0];
        let bestInHandOffer = comparedOffers[0];
        let bestSavingsOffer = comparedOffers[0];
        let highestRatedOffer = comparedOffers[0];

        comparedOffers.forEach(o => {
            if (o.financials.ctcLpa > bestCtcOffer.financials.ctcLpa) bestCtcOffer = o;
            if (o.financials.monthlyInHandINR > bestInHandOffer.financials.monthlyInHandINR) bestInHandOffer = o;
            if (o.financials.estimatedMonthlySavings > bestSavingsOffer.financials.estimatedMonthlySavings) bestSavingsOffer = o;
            if (o.compositeScore > highestRatedOffer.compositeScore) highestRatedOffer = o;
        });

        return res.status(200).json({
            success: true,
            summary: {
                bestCtc: `${bestCtcOffer.companyName} (${bestCtcOffer.financials.ctcLpa} LPA)`,
                bestInHand: `${bestInHandOffer.companyName} (₹${bestInHandOffer.financials.monthlyInHandINR.toLocaleString('en-IN')}/mo)`,
                bestSavings: `${bestSavingsOffer.companyName} (₹${bestSavingsOffer.financials.estimatedMonthlySavings.toLocaleString('en-IN')}/mo net savings)`,
                recommendedOffer: highestRatedOffer.companyName,
                recommendationVerdict: `Based on compensation structure, cost-of-living adjusted savings, and career flexibility, **${highestRatedOffer.companyName}** scores highest (${highestRatedOffer.compositeScore}/100).`
            },
            comparedOffers
        });
    } catch (err) {
        console.error('Compare offers error:', err);
        return res.status(500).json({ success: false, message: 'Server error comparing offers.' });
    }
};

exports.saveOffer = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { companyName, jobRole, ctc, baseSalary, bonus, location, workMode, bondMonths, benefits, notes } = req.body;

        if (!companyName || !jobRole || !ctc) {
            return res.status(400).json({ success: false, message: 'Company name, job role, and CTC are required.' });
        }

        const result = await run(
            `INSERT INTO saved_offers 
             (student_id, company_name, job_role, ctc, base_salary, bonus, location, work_mode, bond_months, benefits, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                companyName.trim(),
                jobRole.trim(),
                parseFloat(ctc) || 0,
                parseFloat(baseSalary) || 0,
                parseFloat(bonus) || 0,
                location ? location.trim() : 'Mumbai',
                workMode || 'On-Site',
                parseInt(bondMonths, 10) || 0,
                benefits ? benefits.trim() : '',
                notes ? notes.trim() : ''
            ]
        );

        return res.status(201).json({ success: true, message: 'Offer saved successfully for comparison!', offerId: result.lastID });
    } catch (err) {
        console.error('Save offer error:', err);
        return res.status(500).json({ success: false, message: 'Server error saving offer.' });
    }
};

exports.getSavedOffers = async (req, res) => {
    try {
        const studentId = req.user.id;
        const offers = await query('SELECT * FROM saved_offers WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
        return res.status(200).json({ success: true, count: offers.length, offers });
    } catch (err) {
        console.error('Get saved offers error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving saved offers.' });
    }
};

exports.deleteSavedOffer = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        await run('DELETE FROM saved_offers WHERE id = ? AND student_id = ?', [id, studentId]);
        return res.status(200).json({ success: true, message: 'Offer deleted successfully.' });
    } catch (err) {
        console.error('Delete saved offer error:', err);
        return res.status(500).json({ success: false, message: 'Server error deleting offer.' });
    }
};
