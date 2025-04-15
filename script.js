document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sections = {
        dashboard: document.getElementById('dashboard-section'),
        log: document.getElementById('log-section'),
        profile: document.getElementById('profile-section'),
        ask: document.getElementById('ask-section')
    };
    
    const tabs = {
        dashboard: document.getElementById('dashboard-tab'),
        log: document.getElementById('log-tab'),
        profile: document.getElementById('profile-tab'),
        ask: document.getElementById('ask-tab')
    };
    
    // Chart initialization
    const ctx = document.getElementById('sugarChart').getContext('2d');
    let sugarChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Blood Sugar (mg/dL)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: 70,
                    suggestedMax: 200
                }
            }
        }
    });
    
    // User data
    let userData = {
        profile: {
            firstName: '',
            lastName: '',
            age: null,
            gender: '',
            diabetesType: 'type2',
            medications: 'Metformin',
            allergies: ''
        },
        readings: []
    };
    
    // Simulated database
    function loadUserData() {
        const savedData = localStorage.getItem('glucocareUserData');
        if (savedData) {
            userData = JSON.parse(savedData);
        } else {
            // Default sample data
            const today = new Date();
            const dates = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dates.push(date);
                
                // Add some sample readings
                userData.readings.push({
                    date: date.toISOString().split('T')[0],
                    time: 'fasting',
                    level: Math.floor(Math.random() * 60) + 80,
                    notes: ''
                });
                
                userData.readings.push({
                    date: date.toISOString().split('T')[0],
                    time: 'post-lunch',
                    level: Math.floor(Math.random() * 80) + 120,
                    notes: ''
                });
            }
        }
        
        updateDashboard();
        populateProfileForm();
    }
    
    function saveUserData() {
        localStorage.setItem('glucocareUserData', JSON.stringify(userData));
    }
    
    // Tab navigation
    function showSection(section) {
        Object.values(sections).forEach(sec => sec.style.display = 'none');
        Object.values(tabs).forEach(tab => tab.classList.remove('active'));
        
        sections[section].style.display = 'block';
        tabs[section].classList.add('active');
    }
    
    Object.keys(tabs).forEach(tab => {
        tabs[tab].addEventListener('click', () => showSection(tab));
    });
    
    // Quick actions
    document.getElementById('quick-log').addEventListener('click', () => showSection('log'));
    document.getElementById('quick-ask').addEventListener('click', () => showSection('ask'));
    document.getElementById('quick-diet').addEventListener('click', () => {
        showSection('ask');
        document.getElementById('user-question').value = "What should I eat today?";
        document.getElementById('ask-button').click();
    });
    
    // Blood sugar form
    document.getElementById('blood-sugar-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const reading = {
            date: document.getElementById('measurement-date').value,
            time: document.getElementById('measurement-time').value,
            level: parseInt(document.getElementById('sugar-level').value),
            notes: document.getElementById('notes').value
        };
        
        userData.readings.push(reading);
        saveUserData();
        
        // Reset form
        this.reset();
        document.getElementById('measurement-date').value = new Date().toISOString().split('T')[0];
        
        // Update dashboard
        updateDashboard();
        
        // Show success message
        alert('Blood sugar reading logged successfully!');
        showSection('dashboard');
    });
    
    // Profile form
    function populateProfileForm() {
        const profile = userData.profile;
        document.getElementById('first-name').value = profile.firstName;
        document.getElementById('last-name').value = profile.lastName;
        document.getElementById('age').value = profile.age;
        document.getElementById('gender').value = profile.gender;
        document.getElementById('diabetes-type').value = profile.diabetesType;
        document.getElementById('medications').value = profile.medications;
        document.getElementById('allergies').value = profile.allergies;
        
        // Update user name display
        document.getElementById('user-name').textContent = `${profile.firstName} ${profile.lastName}`;
    }
    
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        userData.profile = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            diabetesType: document.getElementById('diabetes-type').value,
            medications: document.getElementById('medications').value,
            allergies: document.getElementById('allergies').value
        };
        
        saveUserData();
        populateProfileForm();
        updateDashboard();
        
        alert('Profile updated successfully!');
        showSection('dashboard');
    });
    
    // Ask GlucoCare
    document.getElementById('ask-button').addEventListener('click', function() {
        const question = document.getElementById('user-question').value.trim();
        if (!question) {
            alert('Please enter a question');
            return;
        }
        
        const answer = generateAnswer(question);
        document.getElementById('ai-answer').textContent = answer;
        document.getElementById('answer-section').style.display = 'block';
    });
    
    // Quick questions
    document.querySelectorAll('.quick-question').forEach(button => {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            document.getElementById('user-question').value = question;
            document.getElementById('ask-button').click();
        });
    });
    
    // Update dashboard
    function updateDashboard() {
        // Update user name
        document.getElementById('user-name').textContent = 
            `${userData.profile.firstName} ${userData.profile.lastName}`;
        
        // Update chart
        updateChart();
        
        // Update current status
        updateCurrentStatus();
        
        // Update recommendations
        updateRecommendations();
    }
    
    function updateChart() {
        // Get last 7 days of data
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const recentReadings = userData.readings
            .filter(r => new Date(r.date) >= lastWeek)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Group by date for chart
        const dates = [...new Set(recentReadings.map(r => r.date))];
        const averageByDate = dates.map(date => {
            const dayReadings = recentReadings.filter(r => r.date === date);
            const avg = dayReadings.reduce((sum, r) => sum + r.level, 0) / dayReadings.length;
            return Math.round(avg);
        });
        
        // Update chart
        sugarChart.data.labels = dates.map(date => 
            new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        sugarChart.data.datasets[0].data = averageByDate;
        sugarChart.update();
    }
    
    function updateCurrentStatus() {
        // Get latest reading
        if (userData.readings.length === 0) {
            document.getElementById('current-status').textContent = 'No readings available';
            return;
        }
        
        const latestReading = userData.readings.reduce((latest, current) => 
            new Date(current.date) > new Date(latest.date) ? current : latest);
        
        const level = latestReading.level;
        let status, message, alertClass, alertTitle, alertMessage;
        
        if (level < 70) {
            status = 'Low Blood Sugar (Hypoglycemia)';
            message = 'Your blood sugar is below normal levels.';
            alertClass = 'alert-danger';
            alertTitle = 'Warning: Low Blood Sugar';
            alertMessage = 'Consume 15-20 grams of fast-acting carbohydrates (glucose tablets, juice, regular soda). Recheck after 15 minutes. If still low, repeat treatment.';
        } else if (level >= 70 && level <= 130) {
            status = 'Normal Blood Sugar';
            message = 'Your blood sugar is within the normal range.';
            alertClass = 'alert-success';
            alertTitle = 'Good Control';
            alertMessage = 'Keep up the good work with your diet and medication regimen.';
        } else if (level > 130 && level <= 180) {
            status = 'Slightly High Blood Sugar';
            message = 'Your blood sugar is above the target range.';
            alertClass = 'alert-warning';
            alertTitle = 'Moderate Elevation';
            alertMessage = 'Consider light physical activity and review your recent food intake. If persistent, consult your doctor.';
        } else {
            status = 'High Blood Sugar (Hyperglycemia)';
            message = 'Your blood sugar is significantly above normal levels.';
            alertClass = 'alert-danger';
            alertTitle = 'Warning: High Blood Sugar';
            alertMessage = 'Drink water, engage in light physical activity if no ketones are present. If consistently high, contact your healthcare provider.';
        }
        
        document.getElementById('current-status').textContent = status;
        document.getElementById('status-message').textContent = 
            `Your latest reading (${latestReading.time.replace('-', ' ')}) was ${level} mg/dL on ${latestReading.date}. ${message}`;
        
        const alertEl = document.getElementById('status-alert');
        alertEl.className = `alert ${alertClass}`;
        document.getElementById('alert-title').textContent = alertTitle;
        document.getElementById('alert-message').textContent = alertMessage;
        alertEl.style.display = 'block';
    }
    
    function updateRecommendations() {
        // Get latest reading to base recommendations on
        const latestReading = userData.readings.length > 0 ? 
            userData.readings.reduce((latest, current) => 
                new Date(current.date) > new Date(latest.date) ? current : latest) : 
            { level: 100, time: 'fasting' };
        
        // Diet suggestions
        const dietList = document.getElementById('diet-suggestions');
        dietList.innerHTML = '';
        
        const dietSuggestions = getDietSuggestions(latestReading.level, latestReading.time, userData.profile.diabetesType);
        dietSuggestions.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            dietList.appendChild(li);
        });
        
        // Medicine reminders
        const medList = document.getElementById('medicine-reminders');
        medList.innerHTML = '';
        
        const medReminders = getMedicineReminders(userData.profile.medications, latestReading.level);
        medReminders.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            medList.appendChild(li);
        });
    }
    
    function getDietSuggestions(level, time, diabetesType) {
        const suggestions = [];
        
        if (level < 70) {
            suggestions.push(
                "Immediately consume 15-20g fast-acting carbs (4oz juice, 4 glucose tablets)",
                "Follow with protein+carbs snack if next meal >1hr away (cheese+crackers, peanut butter sandwich)"
            );
        } else if (level >= 70 && level <= 130) {
            suggestions.push(
                "Maintain balanced meals with lean protein, healthy fats, and complex carbs",
                "Good choices: vegetables, whole grains, fish, chicken, nuts, legumes"
            );
            
            if (time.includes('post-')) {
                suggestions.push("Consider a light walk to help maintain levels");
            }
        } else if (level > 130 && level <= 180) {
            suggestions.push(
                "Choose low-glycemic foods: non-starchy vegetables, berries, nuts, seeds",
                "Increase fiber intake with foods like chia seeds, flaxseeds, avocados",
                "Avoid processed carbs and sugary drinks"
            );
            
            if (time === 'fasting') {
                suggestions.push("Consider a protein-rich breakfast (eggs, Greek yogurt) with healthy fats");
            }
        } else {
            suggestions.push(
                "Focus on non-starchy vegetables and lean proteins",
                "Avoid all sugary foods and refined carbohydrates",
                "Drink plenty of water to help flush excess sugar"
            );
        }
        
        // Add diabetes-type specific suggestions
        if (diabetesType === 'type1') {
            suggestions.push("Pay attention to carb counting for insulin dosing");
        } else if (diabetesType === 'type2') {
            suggestions.push("Focus on portion control and regular meal timing");
        } else if (diabetesType === 'gestational') {
            suggestions.push("Ensure adequate folate and iron intake from leafy greens and lean meats");
        }
        
        return suggestions;
    }
    
    function getMedicineReminders(medications, level) {
        const reminders = [];
        const medsList = medications.split(',').map(m => m.trim().toLowerCase());
        
        if (medsList.includes('metformin')) {
            reminders.push("Take Metformin with meals to reduce stomach upset");
            if (level > 150) {
                reminders.push("Monitor for symptoms of hyperglycemia despite Metformin");
            }
        }
        
        if (medsList.includes('insulin')) {
            if (level < 70) {
                reminders.push("Check insulin dose - may need adjustment for lows");
            } else if (level > 180) {
                reminders.push("May need correction dose of insulin - consult your dosing plan");
            } else {
                reminders.push("Continue regular insulin regimen as prescribed");
            }
        }
        
        if (medsList.some(m => m.includes('glipizide') || m.includes('glyburide'))) {
            reminders.push("Take sulfonylurea medication 30 minutes before meals");
            if (level < 80) {
                reminders.push("Watch for hypoglycemia with sulfonylureas - have fast-acting carbs available");
            }
        }
        
        if (reminders.length === 0 && medications) {
            reminders.push(`Continue taking your medications (${medications}) as prescribed`);
        } else if (reminders.length === 0) {
            reminders.push("No medications recorded - consult your doctor if you need medication advice");
        }
        
        return reminders;
    }
    
    // AI answer generation (simulated)
    function generateAnswer(question) {
        const lowerQ = question.toLowerCase();
        const latestReading = userData.readings.length > 0 ? 
            userData.readings.reduce((latest, current) => 
                new Date(current.date) > new Date(latest.date) ? current : latest) : 
            null;
        
        const currentLevel = latestReading ? latestReading.level : 100;
        const diabetesType = userData.profile.diabetesType;
        
        // Diet questions
        if (lowerQ.includes('diet') || lowerQ.includes('eat') || lowerQ.includes('food')) {
            if (lowerQ.includes('high') || currentLevel > 180) {
                return `With your current blood sugar level (${currentLevel} mg/dL), focus on:
- Non-starchy vegetables (leafy greens, broccoli, cauliflower)
- Lean proteins (chicken, fish, tofu)
- Healthy fats (avocados, nuts, olive oil)
- High-fiber foods (chia seeds, flaxseeds)
Avoid all sugary foods, fruits, and refined carbohydrates. Drink plenty of water.`;
            } else if (lowerQ.includes('low') || currentLevel < 70) {
                return `For low blood sugar (${currentLevel} mg/dL):
1. Immediately consume 15-20g fast-acting carbs:
   - 4oz fruit juice
   - 4 glucose tablets
   - 1 tbsp honey
2. Wait 15 minutes and recheck
3. If still low, repeat treatment
4. Once stable, eat a snack with protein+carbs if next meal >1hr away`;
            } else {
                return `General diet recommendations for ${diabetesType} diabetes:
- Balanced meals with lean protein, healthy fats, and complex carbs
- Focus on low-glycemic foods: non-starchy vegetables, berries, nuts, seeds
- Portion control and regular meal timing
- Stay hydrated with water and unsweetened beverages`;
            }
        }
        
        // Condition questions
        else if (lowerQ.includes('condition') || lowerQ.includes('how am i') || 
                lowerQ.includes('status') || lowerQ.includes('normal')) {
            if (!latestReading) {
                return "No blood sugar readings available. Please log your readings to get an assessment.";
            }
            
            let condition;
            if (currentLevel < 70) condition = "low (hypoglycemia)";
            else if (currentLevel <= 130) condition = "normal";
            else if (currentLevel <= 180) condition = "slightly high";
            else condition = "high (hyperglycemia)";
            
            return `Your most recent blood sugar reading was ${currentLevel} mg/dL, which is ${condition} for ${latestReading.time.replace('-', ' ')}.
For ${diabetesType} diabetes, general targets are:
- Fasting: 80-130 mg/dL
- Post-meal: <180 mg/dL
${currentLevel < 70 ? 'Treat low blood sugar immediately.' : 
 currentLevel > 180 ? 'Monitor for symptoms of hyperglycemia.' : 
 'Maintain your current management plan.'}`;
        }
        
        // Medicine questions
        else if (lowerQ.includes('medicine') || lowerQ.includes('medication') || 
                lowerQ.includes('pill') || lowerQ.includes('drug')) {
            if (!userData.profile.medications) {
                return "No medications recorded in your profile. Please update your profile with your current medications for personalized advice.";
            }
            
            return `Based on your medications (${userData.profile.medications}) and current level (${currentLevel} mg/dL):
${getMedicineReminders(userData.profile.medications, currentLevel).join('\n')}
Always consult your doctor before making any changes to your medication regimen.`;
        }
        
        // General diabetes questions
        else if (lowerQ.includes('diabetes') || lowerQ.includes('symptom')) {
            return `Information about ${diabetesType} diabetes:
${diabetesType === 'type1' ? 
'Type 1 diabetes is an autoimmune condition requiring insulin therapy. Watch for symptoms of high/low blood sugar.' : 
diabetesType === 'type2' ? 
'Type 2 diabetes involves insulin resistance. Management includes diet, exercise, medications, and possibly insulin.' : 
diabetesType === 'gestational' ? 
'Gestational diabetes occurs during pregnancy and usually resolves after delivery, but increases future diabetes risk.' : 
'Pre-diabetes means blood sugar is higher than normal but not yet diabetic. Lifestyle changes can prevent progression.'}

Common symptoms to watch for:
- High blood sugar: Increased thirst, frequent urination, fatigue, blurred vision
- Low blood sugar: Shakiness, sweating, confusion, dizziness, hunger`;
        }
        
        // Default response
        return `I'll help with your question about "${question}".
Based on your profile (${diabetesType} diabetes, latest reading ${currentLevel} mg/dL):

For more specific advice, please:
1. Ensure your profile information is up to date
2. Log your recent blood sugar readings
3. Ask more detailed questions about diet, medications, or symptoms

Remember to consult your healthcare provider for personalized medical advice.`;
    }
    
    // Initialize date field with today's date
    document.getElementById('measurement-date').value = new Date().toISOString().split('T')[0];
    
    // Load user data and initialize dashboard
    loadUserData();
});