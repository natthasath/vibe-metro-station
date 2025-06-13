// Global variables
let trainData = {};
let currentView = 'gallery';
let currentLineData = null;
let isDataLoaded = false;

// List of JSON files to load from station folder
const jsonFiles = [
    'bts_sukhumvit.json',
    'bts_silom.json',
    'bts_gold.json',
    'mrt_blue.json',
    'mrt_purple.json',
    'mrt_yellow.json',
    'mrt_pink.json',
    'srt_airport_rail_link.json',
    'srt_red_lines.json'
];

// Load JSON data from files
async function loadTrainData() {
    try {
        showLoading();
        
        const loadPromises = jsonFiles.map(async (filename) => {
            try {
                const response = await fetch(`station/${filename}`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
                }
                const data = await response.json();
                
                // Extract key from filename (remove .json extension)
                const key = filename.replace('.json', '').replace(/_/g, '-');
                
                return { key, data };
            } catch (error) {
                console.error(`Error loading ${filename}:`, error);
                return null;
            }
        });

        const results = await Promise.all(loadPromises);
        
        // Process loaded data
        results.forEach(result => {
            if (result && result.data) {
                // Convert JSON structure to display format
                const convertedData = convertJsonToDisplayFormat(result.data);
                trainData[result.key] = convertedData;
            }
        });

        if (Object.keys(trainData).length === 0) {
            throw new Error('No train data could be loaded');
        }

        isDataLoaded = true;
        hideLoading();
        displayTrainCards();
        setupSearchHandlers();
        
        console.log('Train data loaded successfully:', Object.keys(trainData));
        
    } catch (error) {
        console.error('Error loading train data:', error);
        showError('ไม่สามารถโหลดข้อมูลรถไฟฟ้าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    }
}

// Convert JSON format to display format
function convertJsonToDisplayFormat(jsonData) {
    try {
        const lineInfo = jsonData.line_info || {};
        const stations = jsonData.stations || [];

        return {
            name: lineInfo.thai_name || 'ไม่ทราบชื่อสาย',
            nameEn: lineInfo.english_name || 'Unknown Line',
            description: getLineDescription(lineInfo.line_code || ''),
            color: lineInfo.color_code || '#666666',
            type: lineInfo.train_type || 'Unknown',
            totalStations: lineInfo.total_stations || stations.length,
            length: `${lineInfo.total_distance_km || 0} km`,
            stations: stations.map((station, index) => ({
                code: station.station_id || `S${index + 1}`,
                nameTh: station.thai_name || 'ไม่ทราบชื่อ',
                nameEn: station.english_name || 'Unknown Station'
            }))
        };
    } catch (error) {
        console.error('Error converting JSON data:', error);
        return {
            name: 'ข้อมูลไม่ถูกต้อง',
            nameEn: 'Invalid Data',
            description: 'ไม่สามารถอ่านข้อมูลได้',
            color: '#666666',
            type: 'Unknown',
            totalStations: 0,
            length: '0 km',
            stations: []
        };
    }
}

// Get line description based on line code
function getLineDescription(lineCode) {
    const descriptions = {
        'sukhumvit': 'สายหลักของ BTS ที่เชื่อมต่อพื้นที่สำคัญของกรุงเทพฯ จากเหนือจรดตะวันออก',
        'silom': 'สายที่เชื่อมต่อย่านธุรกิจสีลม สาทร กับพื้นที่ทางตะวันตกของกรุงเทพฯ',
        'gold_line': 'สายรถไฟฟ้าขนาดเล็กที่เชื่อมต่อกรุงธนบุรีกับไอคอนสยาม',
        'blue_line': 'สายหลักของ MRT ที่เป็นรูปแบบวงแหวนเชื่อมต่อพื้นที่สำคัญรอบกรุงเทพฯ',
        'purple_line': 'สายที่เชื่อมต่อจังหวัดนนทบุรีเข้ากับใจกลางกรุงเทพฯ',
        'yellow_line': 'สายใหม่ที่เชื่อมต่อพื้นที่ภาคตะวันออกของกรุงเทพฯ และสมุทรปราการ',
        'pink_line': 'สายโมโนเรลที่เชื่อมต่อพื้นที่ทางเหนือของกรุงเทพฯ และนนทบุรี',
        'arl': 'รถไฟฟ้าเชื่อมต่อสนามบินสุวรรณภูมิกับใจกลางกรุงเทพฯ',
        'srt_red_lines': 'รถไฟฟ้าชานเมืองเชื่อมต่อกรุงเทพฯ กับจังหวัดปริมณฑล'
    };
    
    return descriptions[lineCode] || 'ข้อมูลเส้นทางรถไฟฟ้า';
}

// Show loading state
function showLoading() {
    const trainGallery = document.getElementById('trainGallery');
    if (trainGallery) {
        trainGallery.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>กำลังโหลดข้อมูลรถไฟฟ้า...</p>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading() {
    // Loading will be replaced by train cards
}

// Show error state
function showError(message) {
    const trainGallery = document.getElementById('trainGallery');
    if (trainGallery) {
        trainGallery.innerHTML = `
            <div class="error">
                <h3>❌ เกิดข้อผิดพลาด</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">โหลดใหม่</button>
            </div>
        `;
    }
}

// Interchange stations mapping
const interchangeStations = {
    'สยาม': ['BTS สายสุขุมวิท', 'BTS สายสีลม'],
    'อโศก': ['BTS สายสุขุมวิท', 'MRT สายสีน้ำเงิน'],
    'ศาลาแดง': ['BTS สายสีลม', 'MRT สายสีน้ำเงิน'],
    'หมอชิต': ['BTS สายสุขุมวิท', 'MRT สายสีน้ำเงิน'],
    'ลาดพร้าว': ['MRT สายสีน้ำเงิน', 'MRT สายสีเหลือง'],
    'เตาปูน': ['MRT สายสีน้ำเงิน', 'MRT สายสีม่วง'],
    'บางซื่อ': ['MRT สายสีน้ำเงิน', 'SRT สายสีแดงเข้ม'],
    'กรุงธนบุรี': ['BTS สายสีลม', 'BTS สายทอง'],
    'พญาไท': ['BTS สายสุขุมวิท', 'Airport Rail Link'],
    'สำโรง': ['BTS สายสุขุมวิท', 'MRT สายสีเหลือง']
};

// Check if station is interchange
function isInterchangeStation(stationName, currentLineName) {
    try {
        if (!stationName || !currentLineName || typeof stationName !== 'string' || typeof currentLineName !== 'string') {
            return false;
        }
        
        return interchangeStations[stationName] && 
               Array.isArray(interchangeStations[stationName]) &&
               interchangeStations[stationName].includes(currentLineName) &&
               interchangeStations[stationName].length > 1;
    } catch (error) {
        console.warn('Error checking interchange station:', stationName, currentLineName, error);
        return false;
    }
}

// Initialize the application
function init() {
    try {
        console.log('Initializing Thai Train App...');
        loadTrainData();
        console.log('Thai Train App initialization started');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน กรุณาโหลดหน้าใหม่');
    }
}

// Display train cards in gallery
function displayTrainCards(searchTerm = '') {
    try {
        if (!isDataLoaded) {
            return;
        }

        const gallery = document.getElementById('trainGallery');
        if (!gallery) {
            console.error('Gallery element not found');
            return;
        }
        
        gallery.innerHTML = '';

        Object.keys(trainData).forEach(lineKey => {
            try {
                const line = trainData[lineKey];
                
                if (!line || !line.name || !line.nameEn) {
                    console.warn('Invalid line data for key:', lineKey);
                    return;
                }
                
                if (searchTerm && 
                    !line.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                    !line.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !line.type.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return;
                }

                const card = document.createElement('div');
                card.className = `train-card ${lineKey}`;
                card.onclick = () => showStations(lineKey);
                
                card.innerHTML = `
                    <h3>${line.name}</h3>
                    <div class="line-info">
                        <div class="line-badge"></div>
                        <span>${line.nameEn}</span>
                    </div>
                    <div class="description">${line.description || ''}</div>
                    <div class="stats">
                        <span><strong>${line.totalStations || 0}</strong> สถานี</span>
                        <span><strong>${line.length || ''}</strong></span>
                        <span><strong>${line.type || ''}</strong></span>
                    </div>
                `;
                
                gallery.appendChild(card);
            } catch (error) {
                console.error('Error creating card for line:', lineKey, error);
            }
        });

        if (gallery.children.length === 0) {
            gallery.innerHTML = '<div class="search-results-info">❌ ไม่พบรายการที่ตรงกับการค้นหา</div>';
        }
    } catch (error) {
        console.error('Error displaying train cards:', error);
        const gallery = document.getElementById('trainGallery');
        if (gallery) {
            gallery.innerHTML = '<div class="search-results-info">❌ เกิดข้อผิดพลาดในการแสดงข้อมูล</div>';
        }
    }
}

// Show stations for selected line
function showStations(lineKey) {
    try {
        if (!lineKey || !trainData[lineKey]) {
            console.error('Invalid line key:', lineKey);
            return;
        }
        
        currentLineData = trainData[lineKey];
        currentView = 'stations';
        
        if (!currentLineData || !currentLineData.name) {
            console.error('Invalid line data:', currentLineData);
            return;
        }
        
        document.getElementById('gallery-view').style.display = 'none';
        document.getElementById('stations-view').style.display = 'block';
        
        // Update line header
        const lineHeader = document.getElementById('lineHeader');
        lineHeader.className = `line-header ${lineKey}`;
        
        const lineTitleElement = document.getElementById('lineTitle');
        const lineSubtitleElement = document.getElementById('lineSubtitle');
        
        if (lineTitleElement && lineSubtitleElement) {
            lineTitleElement.textContent = currentLineData.name || 'ไม่ทราบชื่อสาย';
            lineSubtitleElement.textContent = `${currentLineData.nameEn || ''} • ${currentLineData.totalStations || 0} สถานี • ${currentLineData.length || ''}`;
        }
        
        displayStations();
    } catch (error) {
        console.error('Error showing stations:', error);
        const stationsTimeline = document.getElementById('stationsTimeline');
        if (stationsTimeline) {
            stationsTimeline.innerHTML = '<div class="search-results-info">❌ เกิดข้อผิดพลาดในการแสดงข้อมูลสถานี</div>';
        }
    }
}

// Display stations timeline
function displayStations(searchTerm = '') {
    const stationsTimeline = document.getElementById('stationsTimeline');
    stationsTimeline.innerHTML = '';
    
    // Safety check
    if (!currentLineData || !currentLineData.stations || !Array.isArray(currentLineData.stations)) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'search-results-info';
        errorDiv.innerHTML = '❌ ข้อมูลสถานีไม่พร้อมใช้งาน';
        stationsTimeline.appendChild(errorDiv);
        return;
    }
    
    // Filter stations
    const stations = currentLineData.stations.filter(station => {
        try {
            if (!station || typeof station !== 'object') return false;
            if (!station.nameTh || !station.nameEn || !station.code) return false;
            
            if (!searchTerm) return true;
            
            // Search in station names and codes
            return (station.nameTh && station.nameTh.toLowerCase().includes(searchTerm.toLowerCase())) ||
                   (station.nameEn && station.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                   (station.code && station.code.toLowerCase().includes(searchTerm.toLowerCase()));
        } catch (error) {
            console.warn('Error filtering station:', station, error);
            return false;
        }
    });

    // Check if we have valid stations
    if (!stations || stations.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'search-results-info';
        if (searchTerm) {
            noResults.innerHTML = `❌ ไม่พบสถานีที่ตรงกับ "${searchTerm}"<br><small>ลองค้นหาด้วยชื่อสถานี</small>`;
        } else {
            noResults.innerHTML = '❌ ไม่มีข้อมูลสถานีในสายนี้';
        }
        stationsTimeline.appendChild(noResults);
        return;
    }

    // Create timeline container
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-container';
    
    // Add direction indicator
    try {
        const firstStation = stations[0];
        const lastStation = stations[stations.length - 1];
        
        if (firstStation && lastStation && firstStation.nameTh && lastStation.nameTh) {
            const directionDiv = document.createElement('div');
            directionDiv.className = 'timeline-direction';
            directionDiv.innerHTML = `
                <span>${firstStation.nameTh}</span>
                <span class="direction-arrow">➤</span>
                <span>${lastStation.nameTh}</span>
            `;
            timelineContainer.appendChild(directionDiv);
        }
    } catch (error) {
        console.warn('Error creating direction indicator:', error);
    }
    
    // Add timeline line
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);

    // Show search results info if searching
    if (searchTerm && stations.length > 0) {
        const searchInfo = document.createElement('div');
        searchInfo.className = 'search-results-info';
        searchInfo.textContent = `พบ ${stations.length} สถานีที่ตรงกับ "${searchTerm}"`;
        timelineContainer.appendChild(searchInfo);
    }

    // Process each station
    stations.forEach((station, index) => {
        try {
            if (!station || !station.nameTh || !station.nameEn || !station.code) {
                console.warn('Invalid station data:', station);
                return;
            }
            
            const stationItem = document.createElement('div');
            stationItem.className = 'station-item';
            
            const isInterchange = isInterchangeStation(station.nameTh, currentLineData.name);
            const connectorClass = isInterchange ? 'station-connector interchange' : 'station-connector';
            
            stationItem.innerHTML = `
                <div class="${connectorClass}"></div>
                <div class="station-card">
                    <div class="station-number">${index + 1}/${stations.length}</div>
                    <div class="station-header">
                        <div class="station-info">
                            <div class="station-code">${station.code}</div>
                            <div class="station-name-th">${station.nameTh}${isInterchange ? ' 🔄' : ''}</div>
                            <div class="station-name-en">${station.nameEn}${isInterchange ? ' • Interchange' : ''}</div>
                        </div>
                    </div>
                </div>
            `;
            
            timelineContainer.appendChild(stationItem);
        } catch (error) {
            console.error('Error processing station:', station, error);
        }
    });
    
    stationsTimeline.appendChild(timelineContainer);
}

// Show gallery view
function showGallery() {
    try {
        currentView = 'gallery';
        
        const stationsView = document.getElementById('stations-view');
        const galleryView = document.getElementById('gallery-view');
        const stationSearchBox = document.getElementById('stationSearchBox');
        const searchBox = document.getElementById('searchBox');
        
        if (stationsView) stationsView.style.display = 'none';
        if (galleryView) galleryView.style.display = 'block';
        if (stationSearchBox) stationSearchBox.value = '';
        if (searchBox) searchBox.focus();
        
        currentLineData = null;
    } catch (error) {
        console.error('Error showing gallery:', error);
    }
}

// Setup search handlers
function setupSearchHandlers() {
    try {
        const searchBox = document.getElementById('searchBox');
        const stationSearchBox = document.getElementById('stationSearchBox');
        
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                try {
                    displayTrainCards(e.target.value || '');
                } catch (error) {
                    console.error('Error in gallery search:', error);
                }
            });
        }
        
        if (stationSearchBox) {
            stationSearchBox.addEventListener('input', (e) => {
                try {
                    displayStations(e.target.value || '');
                } catch (error) {
                    console.error('Error in station search:', error);
                    const stationsTimeline = document.getElementById('stationsTimeline');
                    if (stationsTimeline) {
                        stationsTimeline.innerHTML = '<div class="search-results-info">❌ เกิดข้อผิดพลาดในการค้นหา</div>';
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error setting up search handlers:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    return true;
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});