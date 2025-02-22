// Инициализация карты
const map = L.map('map').setView([0, 0], 2);

// Добавление слоя OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Массив для хранения слоев маршрута
let routeLayers = [];

// Добавляем константы для URL API
const API_URLS = {
    local: 'http://localhost:5001/bollo-tracker/europe-west1/seaRoute',
    production: 'https://searoute-4agq4fs52q-ew.a.run.app'
};

// Добавляем переключатель API
const apiEnvironment = document.createElement('div');
apiEnvironment.innerHTML = `
    <div style="position: fixed; top: 10px; right: 10px; z-index: 1000; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(5px); padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        <label>
            <input type="checkbox" id="useLocalApi"> Use Local API
        </label>
    </div>
`;
document.body.appendChild(apiEnvironment);

// Replace the hardcoded routes array with a function to load from CSV
let routes = [];

// Function to load routes from CSV
async function loadRoutesFromCSV() {
    try {
        const response = await fetch('test_route.csv');
        const csvText = await response.text();
        
        // Split into lines and remove header
        const lines = csvText.split('\n').filter(line => line.trim());
        const [header, ...dataLines] = lines;
        
        // Parse each line into a route object
        routes = dataLines.map((line, index) => {
            const [
                fromCountry, fromPort, fromLat, fromLng,
                toCountry, toPort, toLat, toLng
            ] = line.split(';');
            
            return {
                id: index + 1,
                name: `${fromPort} to ${toPort}`,
                from: {
                    port: fromPort,
                    lat: parseFloat(fromLat),
                    lng: parseFloat(fromLng)
                },
                to: {
                    port: toPort,
                    lat: parseFloat(toLat),
                    lng: parseFloat(toLng)
                }
            };
        });

        // Update the route list in the UI
        updateRouteList();
    } catch (error) {
        console.error('Error loading routes from CSV:', error);
    }
}

// Function to update the route list in the UI
function updateRouteList() {
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = ''; // Clear existing routes
    
    routes.forEach(route => {
        const div = document.createElement('div');
        div.className = 'route-item';
        div.innerHTML = `
            <input type="checkbox" name="route${route.id}" id="route${route.id}" value="${route.id}">
            <label for="route${route.id}">${route.name}</label>
        `;
        
        // Добавляем обработчик клика на весь элемент
        div.addEventListener('click', (e) => {
            // Предотвращаем стандартное поведение для избежания двойного срабатывания
            e.preventDefault();
            
            const checkbox = div.querySelector(`#route${route.id}`);
            checkbox.checked = !checkbox.checked;
            // Генерируем событие change для корректной работы других обработчиков
            checkbox.dispatchEvent(new Event('change'));
        });
        
        routeList.appendChild(div);
    });
}

// Заменяем создание statsContainer
const statsSection = document.createElement('div');
statsSection.className = 'stats-section';
statsSection.id = 'batchStats';
document.body.appendChild(statsSection);

// Заменяем создание route-selector и кнопки
const routeSelector = document.querySelector('.route-selector');
const updateButton = document.createElement('button');
updateButton.id = 'updateAllRoutes';
updateButton.className = 'update-button';
updateButton.textContent = 'Обновить все маршруты';

// Создаем контейнер для кнопок выбора
const selectionButtons = document.createElement('div');
selectionButtons.className = 'selection-buttons';

// Создаем кнопку "Выбрать всё"
const selectAllButton = document.createElement('button');
selectAllButton.className = 'select-button';
selectAllButton.textContent = 'Выбрать всё';
selectAllButton.addEventListener('click', () => {
    document.querySelectorAll('#routeList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
    });
});

// Создаем кнопку "Очистить всё"
const clearAllButton = document.createElement('button');
clearAllButton.className = 'select-button';
clearAllButton.textContent = 'Очистить всё';
clearAllButton.addEventListener('click', () => {
    document.querySelectorAll('#routeList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
    });
});

// Добавляем кнопки в контейнер
selectionButtons.appendChild(selectAllButton);
selectionButtons.appendChild(clearAllButton);

// Создаем контейнер для списка маршрутов
const routeListWrapper = document.createElement('div');
routeListWrapper.className = 'route-list-wrapper';
routeListWrapper.appendChild(document.getElementById('routeList'));

// Добавляем элементы в правильном порядке
routeSelector.appendChild(updateButton);
routeSelector.appendChild(selectionButtons);
routeSelector.appendChild(routeListWrapper);

// Добавляем обработчик события для кнопки
updateButton.addEventListener('click', updateAllRoutes);

// Обновляем создание кнопки сворачивания
const toggleButton = document.createElement('button');
toggleButton.className = 'toggle-panel-button';
toggleButton.innerHTML = '◀'; // Стрелка влево
toggleButton.title = 'Свернуть панель';

// Обновляем обработчик для кнопки
toggleButton.addEventListener('click', () => {
    const panel = document.querySelector('.route-selector');
    const isCollapsed = panel.classList.toggle('collapsed');
    
    // Меняем стрелку и подсказку в зависимости от состояния
    if (isCollapsed) {
        toggleButton.innerHTML = '▶';
        toggleButton.title = 'Развернуть панель';
    } else {
        toggleButton.innerHTML = '◀';
        toggleButton.title = 'Свернуть панель';
    }
});

// Добавляем кнопку после панели (важно для правильного позиционирования)
routeSelector.parentNode.insertBefore(toggleButton, routeSelector.nextSibling);

// Добавляем функцию для форматирования времени
function formatTime(ms) {
    return `${Math.round(ms)}ms`;
}

// Добавляем функцию для создания popup контента
function createPortPopupContent(portInfo, isStart = true) {
    return `
        <div class="port-popup">
            <h3>${portInfo.port}</h3>
            <div class="port-details">
                <div class="detail-item">
                    <span class="label">Тип:</span>
                    <span class="value">${isStart ? 'Порт отправления' : 'Порт назначения'}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Координаты:</span>
                    <span class="value">${portInfo.lat.toFixed(4)}°, ${portInfo.lng.toFixed(4)}°</span>
                </div>
            </div>
        </div>
    `;
}

// Обновляем функцию calculateRoute, добавляя параметр isBatchUpdate
async function calculateRoute(route, retryCount = 0, isBatchUpdate = false) {
    const timing = {
        apiRequest: 0,
        rendering: 0,
        processing: 0,
        total: 0
    };
    const startTotal = performance.now();

    try {
        const routeOptions = {
            doNotUseBabAlMandab: route.options?.doNotUseBabAlMandab || false
        };

        // Замеряем время запроса к API
        const apiStartTime = performance.now();
        const apiUrl = document.getElementById('useLocalApi').checked ? 
            API_URLS.local : 
            API_URLS.production;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                departurePort: { lat: route.from.lat, lng: route.from.lng },
                destinationPort: { lat: route.to.lat, lng: route.to.lng },
                currentPosition: route.currentPosition,
                options: routeOptions
            })
        });

        const data = await response.json();
        timing.apiRequest = performance.now() - apiStartTime;

        if (data.success) {
            const renderStartTime = performance.now();
            
            // Сохраняем старое значение processing
            const processingBefore = timing.processing;

            // Обработка маршрутов
            if (data.pastRoute && data.pastRoute.length > 0) {
                const processStart = performance.now();
                const pastSegments = processRoutePoints(data.pastRoute);
                timing.processing += performance.now() - processStart;

                // Отдельно замеряем время отрисовки
                const drawStart = performance.now();
                pastSegments.forEach(segment => {
                    const pastPath = L.polyline(segment, {
                        color: getRouteColor(route.id),
                        weight: 3,
                        opacity: 0.8,
                        noClip: true
                    }).addTo(map);
                    pastPath.routeId = route.id;
                    routeLayers.push(pastPath);
                });
                timing.rendering += performance.now() - drawStart;
            }

            // Аналогично для будущего маршрута
            if (data.futureRoute && data.futureRoute.length > 0) {
                const processStart = performance.now();
                const futureSegments = processRoutePoints(data.futureRoute);
                timing.processing += performance.now() - processStart;

                const drawStart = performance.now();
                futureSegments.forEach(segment => {
                    const futurePath = L.polyline(segment, {
                        color: getRouteColor(route.id),
                        weight: 3,
                        opacity: 0.6,
                        dashArray: '5, 10',
                        noClip: true
                    }).addTo(map);
                    futurePath.routeId = route.id;
                    routeLayers.push(futurePath);
                });
                timing.rendering += performance.now() - drawStart;
            }

            // Замеряем время отрисовки маркеров
            const markersStart = performance.now();
            // Добавляем маркеры портов с уникальными идентификаторами
            const startMarker = L.marker([route.from.lat, route.from.lng], {
                title: route.from.port,
                icon: L.divIcon({
                    className: 'port-marker',
                    html: `<span style="color: ${getRouteColor(route.id)}">●</span>`,
                    iconSize: [20, 20]
                })
            }).bindPopup(createPortPopupContent(route.from, true), {
                className: 'port-popup-container',
                maxWidth: 300,
                offset: [0, -10]
            }).addTo(map);
            startMarker.routeId = route.id;
            routeLayers.push(startMarker);

            // Добавляем маркер текущей позиции
            if (route.currentPosition) {
                const currentPosMarker = L.marker(
                    [route.currentPosition.lat, route.currentPosition.lng],
                    {
                        title: 'Current Position',
                        icon: L.divIcon({
                            className: 'port-marker current-position',
                            html: '⚓',
                            iconSize: [20, 20]
                        })
                    }
                ).bindPopup(`
                    <div class="port-popup">
                        <h3>Текущая позиция</h3>
                        <div class="port-details">
                            <div class="detail-item">
                                <span class="label">Координаты:</span>
                                <span class="value">${route.currentPosition.lat.toFixed(4)}°, ${route.currentPosition.lng.toFixed(4)}°</span>
                            </div>
                        </div>
                    </div>
                `, {
                    className: 'port-popup-container',
                    maxWidth: 300,
                    offset: [0, -10]
                }).addTo(map);
                currentPosMarker.routeId = route.id;
                routeLayers.push(currentPosMarker);
            }

            const endMarker = L.marker([route.to.lat, route.to.lng], {
                title: route.to.port,
                icon: L.divIcon({
                    className: 'port-marker',
                    html: `<span style="color: ${getRouteColor(route.id)}">●</span>`,
                    iconSize: [20, 20]
                })
            }).bindPopup(createPortPopupContent(route.to, false), {
                className: 'port-popup-container',
                maxWidth: 300,
                offset: [0, -10]
            }).addTo(map);
            endMarker.routeId = route.id;
            routeLayers.push(endMarker);
            timing.rendering += performance.now() - markersStart;

            // Заменяем прямой вызов fitMapToAllRoutes() на условный
            if (!isBatchUpdate) {
                fitMapToAllRoutes();
            }

            timing.total = performance.now() - startTotal;

            return {
                success: true,
                executionTime: data.executionTime,
                timing: timing,
                routeId: route.id
            };
        } else {
            throw new Error(data.error || 'Failed to calculate route');
        }
    } catch (error) {
        timing.total = performance.now() - startTotal;
        return {
            success: false,
            routeId: route.id,
            timing: timing,
            error: error.message
        };
    }
}

// Функция для обработки точек маршрута при пересечении 180-го меридиана
function processRoutePoints(route) {
    if (route.length < 2) return route;

    const segments = [];
    let currentSegment = [route[0]];
    
    for (let i = 1; i < route.length; i++) {
        const prev = route[i - 1];
        const curr = route[i];
        
        // Проверяем, пересекает ли сегмент 180-й меридиан
        if (Math.abs(prev.lng - curr.lng) > 180) {
            // Добавляем точки разрыва на 180-м меридиане
            const lat = prev.lat + (curr.lat - prev.lat) * 
                (Math.abs(180 - Math.abs(prev.lng)) / Math.abs(curr.lng - prev.lng));
            
            if (prev.lng < 0) {
                currentSegment.push({ lat, lng: -180 });
                segments.push(currentSegment);
                currentSegment = [{ lat, lng: 180 }];
            } else {
                currentSegment.push({ lat, lng: 180 });
                segments.push(currentSegment);
                currentSegment = [{ lat, lng: -180 }];
            }
        }
        
        currentSegment.push(curr);
    }
    
    segments.push(currentSegment);
    return segments;
}

// Функция для вычисления расстояния между двумя точками
function getDistance(p1, p2) {
    const R = 6371; // Радиус Земли в км
    const dLat = toRad(p2.lat - p1.lat);
    const dLon = toRad(p2.lng - p1.lng);
    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}

// Добавляем функцию для получения цвета маршрута
function getRouteColor(routeId) {  
    // Функция для генерации HSL цвета с фиксированной яркостью  
    function generateColor(index) {  
        // Используем золотое сечение для равномерного распределения цветов  
        const goldenRatio = 0.618033988749895;  
        
        // Генерируем оттенок, используя индекс и золотое сечение  
        const hue = ((index * goldenRatio) % 1) * 360;  
        
        // Фиксированные значения насыщенности и яркости для ярких, но не слишком светлых цветов  
        const saturation = 85; // Высокая насыщенность для яркости  
        const lightness = 45;  // Средняя яркость, чтобы цвет был виден на карте  
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;  
    }  

    // Предопределенный набор насыщенных цветов для первых маршрутов  
    const baseColors = [  
        '#FF3D00', // Ярко-красный  
        '#2979FF', // Ярко-синий  
        '#00C853', // Ярко-зеленый  
        '#FF9100', // Ярко-оранжевый  
        '#651FFF', // Фиолетовый  
        '#C51162', // Малиновый  
        '#00B8D4', // Бирюзовый  
        '#FFD600'  // Янтарный  
    ];  

    // Используем предопределенные цвета для первых маршрутов  
    if (routeId < baseColors.length) {  
        return baseColors[routeId];  
    }  
    
    // Для дополнительных маршрутов генерируем новые цвета  
    return generateColor(routeId);  
}  

// Добавляем функцию для подгонки карты под все маршруты
function fitMapToAllRoutes() {
    if (routeLayers.length > 0) {
        const bounds = L.latLngBounds([]);
        let hasValidBounds = false;

        routeLayers.forEach(layer => {
            if (layer.getLatLngs && Array.isArray(layer.getLatLngs())) {
                const latLngs = layer.getLatLngs();
                if (Array.isArray(latLngs[0])) {
                    latLngs.forEach(segment => {
                        if (segment && segment.length > 0) {
                            bounds.extend(L.latLngBounds(segment));
                            hasValidBounds = true;
                        }
                    });
                } else if (latLngs.length > 0) {
                    bounds.extend(L.latLngBounds(latLngs));
                    hasValidBounds = true;
                }
            } else if (layer.getLatLng) {
                bounds.extend(layer.getLatLng());
                hasValidBounds = true;
            }
        });
        
        if (hasValidBounds && bounds.isValid()) {
            // Добавляем небольшую задержку для надежного масштабирования
            setTimeout(() => {
                map.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 12
                });
            }, 250);
        }
    }
}

// Обновляем функцию updateAllRoutes для передачи флага isBatchUpdate
async function updateAllRoutes() {
    const startTime = performance.now();
    let successCount = 0;
    const timings = {
        routes: [],
        total: 0,
        averageApi: 0,
        averageProcessing: 0,
        averageRendering: 0
    };

    const updateButton = document.getElementById('updateAllRoutes');
    updateButton.disabled = true;
    updateButton.textContent = 'Обновление...';

    try {
        // Сначала очищаем все маршруты
        routeLayers.forEach(layer => map.removeLayer(layer));
        routeLayers = [];

        const checkedRoutes = routes.filter(route => 
            document.getElementById(`route${route.id}`).checked
        );

        // Обрабатываем маршруты с флагом isBatchUpdate
        const results = await Promise.all(checkedRoutes.map(async (route) => {
            try {
                const result = await calculateRoute(route, 0, true);
                if (result.success) {
                    successCount++;
                }
                return result;
            } catch (error) {
                console.error(`Error updating route ${route.id}:`, error);
                return null;
            }
        }));

        // Обновляем статистику
        const validResults = results.filter(r => r !== null && r.success);
        timings.routes = validResults.map(r => ({
            routeId: r.routeId,
            api: r.timing.apiRequest,
            processing: r.timing.processing,
            rendering: r.timing.rendering,
            total: r.timing.total
        }));

        if (validResults.length > 0) {
            timings.averageApi = timings.routes.reduce((acc, r) => acc + r.api, 0) / validResults.length;
            timings.averageProcessing = timings.routes.reduce((acc, r) => acc + r.processing, 0) / validResults.length;
            timings.averageRendering = timings.routes.reduce((acc, r) => acc + r.rendering, 0) / validResults.length;
        }
        timings.total = performance.now() - startTime;

        // Обновим вывод статистики, убрав лишние элементы
        const batchStats = document.getElementById('batchStats');
        batchStats.innerHTML = `
            <h3>Общая статистика</h3>
            <div class="stats-item">
                <span>Выбрано маршрутов:</span> ${checkedRoutes.length}
            </div>
            <div class="stats-item">
                <span>Успешно обновлено:</span> ${successCount}
            </div>
            <div class="stats-item">
                <span>Общее время:</span> ${formatTime(timings.total)}
            </div>
        `;

        // Масштабируем карту один раз после отрисовки всех маршрутов
        fitMapToAllRoutes();
    } finally {
        updateButton.disabled = false;
        updateButton.textContent = 'Обновить все маршруты';
    }
}

// Загружаем маршруты при запуске приложения
loadRoutesFromCSV(); 