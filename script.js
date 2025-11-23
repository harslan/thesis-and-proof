// Thesis & Proof - Interactive Features with Live Price Updates

// Portfolio positions configuration
const positions = {
    ERJ: {
        ticker: 'ERJ',
        entry: 64.18,
        entryDate: 'Oct 24, 2025',
        convictionScore: 47
    },
    EFXT: {
        ticker: 'EFXT',
        entry: 12.46,
        entryDate: 'Oct 24, 2025',
        convictionScore: 44
    }
};

// Fetch stock price using Yahoo Finance (free, no API key required)
async function fetchStockPrice(ticker) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`);
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            // Get the most recent price
            const price = result.meta.regularMarketPrice;
            return price;
        }
        
        return null;
    } catch (error) {
        console.log(`Error fetching ${ticker}:`, error);
        return null;
    }
}

// Calculate return percentage
function calculateReturn(entry, current) {
    return ((current - entry) / entry * 100).toFixed(1);
}

// Update DOM with new prices
function updatePositionCard(ticker, currentPrice) {
    const position = positions[ticker];
    if (!position || !currentPrice) return;
    
    const returnPct = calculateReturn(position.entry, currentPrice);
    
    // Find the position card for this ticker
    const cards = document.querySelectorAll('.position-card');
    cards.forEach(card => {
        const tickerElement = card.querySelector('.position-ticker');
        if (tickerElement && tickerElement.textContent === ticker) {
            // Update current price
            const metrics = card.querySelectorAll('.metric-value');
            if (metrics.length >= 2) {
                metrics[1].textContent = `$${currentPrice.toFixed(2)}`;
            }
            
            // Update return percentage
            if (metrics.length >= 3) {
                const returnValue = `${returnPct >= 0 ? '+' : ''}${returnPct}%`;
                metrics[2].textContent = returnValue;
                metrics[2].className = returnPct >= 0 ? 'metric-value positive' : 'metric-value negative';
            }
        }
    });
    
    console.log(`✓ Updated ${ticker}: $${currentPrice.toFixed(2)} (${returnPct >= 0 ? '+' : ''}${returnPct}%)`);
}

// Update all positions
async function updateAllPrices() {
    console.log('🔄 Fetching live stock prices...');
    
    // Show loading state
    const statusDiv = document.getElementById('price-update-status');
    if (statusDiv) {
        statusDiv.textContent = 'Updating prices...';
        statusDiv.style.color = '#666';
    }
    
    let successCount = 0;
    
    for (const ticker of Object.keys(positions)) {
        const price = await fetchStockPrice(ticker);
        
        if (price) {
            updatePositionCard(ticker, price);
            successCount++;
        } else {
            console.log(`⚠ ${ticker}: Could not fetch price, keeping cached value`);
        }
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Update timestamp
    updateTimestamp(successCount === Object.keys(positions).length);
    
    console.log(`✓ Price update complete (${successCount}/${Object.keys(positions).length} successful)`);
}

// Add timestamp to show when prices were last updated
function updateTimestamp(success = true) {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
    });
    
    let statusDiv = document.getElementById('price-update-status');
    if (!statusDiv) {
        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'price-update-status';
            statusDiv.style.cssText = `
                margin-top: 1rem; 
                font-size: 0.875rem; 
                color: ${success ? '#10b981' : '#f59e0b'}; 
                text-align: center;
                font-weight: 500;
            `;
            heroStats.parentNode.insertBefore(statusDiv, heroStats.nextSibling);
        }
    }
    
    if (statusDiv) {
        statusDiv.textContent = success 
            ? `✓ Live prices • Updated ${timeString}` 
            : `⚠ Using cached prices • Last attempted ${timeString}`;
        statusDiv.style.color = success ? '#10b981' : '#f59e0b';
    }
}

// Add manual refresh button
function addRefreshButton() {
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats && !document.getElementById('refresh-prices-btn')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 1.5rem; text-align: center;';
        
        const button = document.createElement('button');
        button.id = 'refresh-prices-btn';
        button.innerHTML = '↻ Refresh Prices';
        button.style.cssText = `
            padding: 0.625rem 1.25rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;
        
        button.onmouseover = () => {
            button.style.background = '#1d4ed8';
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        };
        button.onmouseout = () => {
            button.style.background = '#2563eb';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        };
        
        button.onclick = async () => {
            button.disabled = true;
            button.innerHTML = '⟳ Updating...';
            await updateAllPrices();
            button.innerHTML = '↻ Refresh Prices';
            button.disabled = false;
        };
        
        buttonContainer.appendChild(button);
        heroStats.parentNode.insertBefore(buttonContainer, heroStats.nextSibling);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Thesis & Proof - Initializing...');
    
    // Add refresh button
    addRefreshButton();
    
    // Update prices immediately on load (with small delay to let page render)
    setTimeout(() => {
        updateAllPrices();
    }, 1000);
    
    // Refresh prices every 5 minutes while page is open
    setInterval(updateAllPrices, 5 * 60 * 1000);
    
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animate numbers on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe all position cards
    document.querySelectorAll('.position-card').forEach(card => {
        observer.observe(card);
    });

    // Add active state to nav links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    function setActiveNav() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', setActiveNav);
    setActiveNav(); // Set initial state;
});
