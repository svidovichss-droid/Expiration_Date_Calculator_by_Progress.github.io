// Конфигурация приложения
const CONFIG = {
    JSON_URL: 'https://raw.githubusercontent.com/svidovichss-droid/ProgressSAP.github.io/main/data.json',
    CACHE_KEY: 'products_cache',
    ETAG_KEY: 'products_etag',
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах
    FALLBACK_DATA: [
        {
            "Код продукции": "000001",
            "Полное наименование (русское)": "Тестовый продукт 1",
            "Срок годности": 365,
            "Штук в упаковке": 10,
            "Штрихкод упаковки": "1234567890123",
            "Производитель": "Тестовый производитель",
            "Название стандарта": "ГОСТ 12345-2020"
        },
        {
            "Код продукции": "000002",
            "Полное наименование (русское)": "Тестовый продукт 2",
            "Срок годности": 180,
            "Штук в упаковке": 5,
            "Штрихкод упаковки": "9876543210987",
            "Производитель": "Другой производитель",
            "Название стандарта": "ТУ 45678-2021"
        }
    ],
    SEARCH_CONFIG: {
        MIN_QUERY_LENGTH: 2,
        MAX_RESULTS: 20,
        FUZZY_THRESHOLD: 0.7,
        WEIGHTS: {
            CODE_EXACT: 10,
            CODE_PARTIAL: 5,
            NAME_EXACT: 8,
            NAME_PARTIAL: 3,
            MANUFACTURER: 2,
            STANDARD: 1
        }
    }
};

// Глобальные переменные
let products = {};
let warningMessageAdded = false;
let isOnline = true;
let searchIndex = [];
let searchTimeout = null;
let lastSearchResults = [];

// DOM elements
const productSearch = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const standardNotificationContainer = document.getElementById('standardNotificationContainer');
const dataStatus = document.getElementById('dataStatus');
const offlineStatus = document.getElementById('offlineStatus');
const calculateButton = document.getElementById('calculateButton');
const printButton = document.getElementById('printButton');
const refreshFooterButton = document.getElementById('refreshFooterButton');
const lastUpdateInfo = document.getElementById('lastUpdateInfo');
const lastUpdateTime = document.getElementById('lastUpdateTime');

// Вспомогательные функции для интеллектуального поиска
const SearchUtils = {
    // Нормализация текста для поиска
    normalizeText: (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Удаляем диакритические знаки
            .replace(/[^\wа-яА-ЯёЁ0-9\s]/g, ' ') // Заменяем спецсимволы на пробелы
            .replace(/\s+/g, ' ') // Удаляем лишние пробелы
            .trim();
    },

    // Вычисление расстояния Левенштейна для нечеткого поиска
    levenshteinDistance: (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[b.length][a.length];
    },

    // Сходство строк (0-1)
    stringSimilarity: (a, b) => {
        if (!a || !b) return 0;
        const distance = SearchUtils.levenshteinDistance(a, b);
        const maxLength = Math.max(a.length, b.length);
        return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
    },

    // Поиск вхождения подстроки с учетом транслитерации
    smartContains: (text, query) => {
        if (!text || !query) return false;
        
        const normalizedText = SearchUtils.normalizeText(text);
        const normalizedQuery = SearchUtils.normalizeText(query);
        
        // Прямое вхождение
        if (normalizedText.includes(normalizedQuery)) {
            return true;
        }
        
        // Разбиваем на слова
        const textWords = normalizedText.split(/\s+/);
        const queryWords = normalizedQuery.split(/\s+/);
        
        // Проверяем все слова запроса
        for (const queryWord of queryWords) {
            let found = false;
            for (const textWord of textWords) {
                if (textWord.includes(queryWord) || 
                    SearchUtils.stringSimilarity(textWord, queryWord) > CONFIG.SEARCH_CONFIG.FUZZY_THRESHOLD) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        
        return true;
    },

    // Подсчет релевантности
    calculateRelevance: (product, query) => {
        let relevance = 0;
        const normalizedQuery = SearchUtils.normalizeText(query);
        
        // Поиск по коду продукции
        if (product.code && normalizedQuery) {
            if (product.code === normalizedQuery) {
                relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.CODE_EXACT;
            } else if (product.code.includes(normalizedQuery)) {
                relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.CODE_PARTIAL;
            }
        }
        
        // Поиск по названию
        if (product.normalizedName) {
            if (product.normalizedName.includes(normalizedQuery)) {
                relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.NAME_EXACT;
            } else if (SearchUtils.smartContains(product.name, query)) {
                relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.NAME_PARTIAL;
            }
        }
        
        // Поиск по производителю
        if (product.manufacturer && SearchUtils.smartContains(product.manufacturer, query)) {
            relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.MANUFACTURER;
        }
        
        // Поиск по стандарту
        if (product.standard && SearchUtils.smartContains(product.standard, query)) {
            relevance += CONFIG.SEARCH_CONFIG.WEIGHTS.STANDARD;
        }
        
        return relevance;
    },

    // Поиск с подсказками (автодополнение)
    getSearchSuggestions: (query) => {
        if (query.length < CONFIG.SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            return [];
        }

        const normalizedQuery = SearchUtils.normalizeText(query);
        const suggestions = new Set();

        // Поиск по началу слов
        for (const item of searchIndex) {
            if (item.normalizedName.startsWith(normalizedQuery)) {
                suggestions.add(item.normalizedName);
            }
            
            // Разбиваем на слова и проверяем начало каждого слова
            const words = item.normalizedName.split(/\s+/);
            for (const word of words) {
                if (word.startsWith(normalizedQuery)) {
                    suggestions.add(word);
                }
            }
        }

        return Array.from(suggestions).slice(0, 5);
    },

    // Выделение найденных фрагментов в тексте
    highlightMatches: (text, query) => {
        if (!text || !query) return text;
        
        const normalizedText = text.toLowerCase();
        const normalizedQuery = query.toLowerCase();
        
        // Если есть точное совпадение
        if (normalizedText.includes(normalizedQuery)) {
            const startIndex = normalizedText.indexOf(normalizedQuery);
            return text.substring(0, startIndex) + 
                   `<mark class="bg-yellow-200 px-1 rounded">${text.substring(startIndex, startIndex + query.length)}</mark>` +
                   text.substring(startIndex + query.length);
        }
        
        // Разбиваем запрос на слова и выделяем их
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        let result = text;
        
        for (const word of queryWords) {
            const regex = new RegExp(`(${word})`, 'gi');
            result = result.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
        }
        
        return result;
    }
};

// Регистрация Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('Service Worker зарегистрирован успешно:', registration.scope);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Обнаружено обновление Service Worker');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('Новая версия Service Worker установлена');
                            showNotification('Доступно обновление приложения. Перезагрузите страницу.', 'info');
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('Ошибка регистрации Service Worker:', error);
            });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker контроллер изменился');
            window.location.reload();
        });
    }
}

// Проверка онлайн статуса
function checkOnlineStatus() {
    isOnline = navigator.onLine;
    if (!isOnline && offlineStatus) {
        offlineStatus.classList.remove('hidden');
        showNotification('Работаем в автономном режиме', 'warning');
    } else if (offlineStatus) {
        offlineStatus.classList.add('hidden');
        if (isOnline) {
            showNotification('Подключение к интернету восстановлено', 'success');
        }
    }
    return isOnline;
}

// Утилиты для работы с кэшем
const cacheUtils = {
    saveToCache: (data, etag = null) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: data,
                etag: etag,
                lastUpdate: new Date().toLocaleString('ru-RU')
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
            console.log('Данные сохранены в кэш');
            
            if (etag) {
                localStorage.setItem(CONFIG.ETAG_KEY, etag);
            }
            
            updateLastUpdateInfo(cacheData.lastUpdate);
        } catch (error) {
            console.error('Ошибка сохранения в кэш:', error);
        }
    },

    getFromCache: () => {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const isExpired = Date.now() - cacheData.timestamp > CONFIG.CACHE_EXPIRY;

            if (cacheData.lastUpdate) {
                updateLastUpdateInfo(cacheData.lastUpdate);
            }

            return {
                data: cacheData.data,
                etag: cacheData.etag,
                isExpired: isExpired,
                lastUpdate: cacheData.lastUpdate
            };
        } catch (error) {
            console.error('Ошибка чтения из кэша:', error);
            return null;
        }
    },

    getEtag: () => {
        try {
            return localStorage.getItem(CONFIG.ETAG_KEY);
        } catch (error) {
            console.error('Ошибка чтения ETag:', error);
            return null;
        }
    },

    clearCache: () => {
        try {
            localStorage.removeItem(CONFIG.CACHE_KEY);
            localStorage.removeItem(CONFIG.ETAG_KEY);
            console.log('Кэш очищен');
            hideLastUpdateInfo();
        } catch (error) {
            console.error('Ошибка очистки кэша:', error);
        }
    },

    saveFallbackData: () => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: CONFIG.FALLBACK_DATA,
                etag: 'fallback',
                lastUpdate: new Date().toLocaleString('ru-RU') + ' (офлайн)'
            };
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
            console.log('Fallback данные сохранены в кэш');
            
            updateLastUpdateInfo(cacheData.lastUpdate);
        } catch (error) {
            console.error('Ошибка сохранения fallback данных:', error);
        }
    }
};

// Обновить информацию о последнем обновлении
function updateLastUpdateInfo(timeString) {
    if (lastUpdateInfo && lastUpdateTime) {
        lastUpdateTime.textContent = timeString;
        lastUpdateInfo.classList.remove('hidden');
    }
}

// Скрыть информацию о последнем обновлении
function hideLastUpdateInfo() {
    if (lastUpdateInfo) {
        lastUpdateInfo.classList.add('hidden');
    }
}

// Показать/скрыть анимацию загрузки на кнопке обновления
function showRefreshLoading() {
    if (refreshFooterButton) {
        refreshFooterButton.classList.add('refreshing');
        refreshFooterButton.disabled = true;
    }
}

function hideRefreshLoading() {
    if (refreshFooterButton) {
        refreshFooterButton.classList.remove('refreshing');
        refreshFooterButton.disabled = false;
    }
}

// Проверка обновлений на сервере
async function checkForUpdates(cachedEtag) {
    try {
        if (!checkOnlineStatus()) {
            console.log('Оффлайн режим, пропускаем проверку обновлений');
            return false;
        }

        const response = await fetch(CONFIG.JSON_URL, {
            method: 'HEAD',
            headers: cachedEtag ? { 'If-None-Match': cachedEtag } : {},
            cache: 'no-cache'
        });

        if (response.status === 304) {
            console.log('Данные не изменились на сервере');
            return false;
        }

        if (response.status === 200) {
            const newEtag = response.headers.get('ETag');
            if (newEtag && newEtag !== cachedEtag) {
                console.log('Обнаружены обновления на сервере');
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Ошибка проверки обновлений:', error);
        return false;
    }
}

// Построение поискового индекса
function buildSearchIndex(productsData) {
    searchIndex = [];
    
    for (const code in products) {
        const product = products[code];
        searchIndex.push({
            code: code,
            name: product["Полное наименование (русское)"],
            normalizedName: SearchUtils.normalizeText(product["Полное наименование (русское)"]),
            manufacturer: product["Производитель"],
            standard: product["Название стандарта"],
            product: product
        });
    }
    
    console.log(`Поисковый индекс построен: ${searchIndex.length} товаров`);
}

// Интеллектуальный поиск продуктов
function intelligentSearch(query) {
    if (!query || query.length < CONFIG.SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        return [];
    }

    const results = [];
    
    // Поиск по индексу
    for (const item of searchIndex) {
        const relevance = SearchUtils.calculateRelevance(item, query);
        
        if (relevance > 0) {
            results.push({
                code: item.code,
                product: item.product,
                relevance: relevance,
                highlightedName: SearchUtils.highlightMatches(item.name, query)
            });
        }
    }
    
    // Сортировка по релевантности
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Ограничение количества результатов
    return results.slice(0, CONFIG.SEARCH_CONFIG.MAX_RESULTS);
}

// Отображение результатов поиска
function displaySearchResults(results) {
    if (searchResults) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-3 text-gray-500 text-center';
            noResults.textContent = 'Ничего не найдено. Попробуйте изменить запрос.';
            noResults.setAttribute('role', 'option');
            searchResults.appendChild(noResults);
        } else {
            results.forEach((result, index) => {
                const div = document.createElement('div');
                div.className = `p-3 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100 last:border-0 search-result-item ${index === 0 ? 'bg-blue-50' : ''}`;
                div.setAttribute('role', 'option');
                div.setAttribute('data-code', result.code);
                div.innerHTML = `
                <div class="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                  <i class="fas fa-box text-blue-600"></i>
                </div>
                <div class="flex-grow min-w-0">
                  <div class="font-medium text-blue-800 mb-1 search-result-name">${result.highlightedName}</div>
                  <div class="text-sm text-gray-500 truncate">
                    <span class="inline-block mr-3">
                      <i class="fas fa-barcode mr-1"></i>
                      <span class="product-code">${result.code}</span>
                    </span>
                    <span class="inline-block mr-3">
                      <i class="fas fa-calendar-day mr-1"></i>
                      <span class="shelf-life">${result.product["Срок годности"]} дней</span>
                    </span>
                    <span class="inline-block">
                      <i class="fas fa-industry mr-1"></i>
                      <span class="manufacturer">${result.product["Производитель"] || "Не указан"}</span>
                    </span>
                  </div>
                  ${result.relevance >= 10 ? '<div class="mt-1 text-xs text-green-600"><i class="fas fa-bolt mr-1"></i>Высокая релевантность</div>' : ''}
                </div>
                `;
                div.onclick = () => selectProduct(result.code);
                searchResults.appendChild(div);
            });
            
            // Добавляем подсказку о навигации
            const hint = document.createElement('div');
            hint.className = 'p-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50';
            hint.innerHTML = '<i class="fas fa-info-circle mr-1"></i> Используйте ↑↓ для навигации, Enter для выбора';
            searchResults.appendChild(hint);
        }
        
        searchResults.classList.remove('hidden');
        lastSearchResults = results;
    }
}

// Обработка поиска с задержкой
function handleSearchInput() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    const query = productSearch.value.trim();
    
    if (query.length >= CONFIG.SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        searchTimeout = setTimeout(() => {
            const results = intelligentSearch(query);
            displaySearchResults(results);
        }, 300); // Задержка 300мс для уменьшения количества запросов
    } else if (searchResults) {
        searchResults.classList.add('hidden');
        clearFields();
    }
}

// Навигация по результатам поиска с клавиатуры
function handleKeyboardNavigation(e) {
    if (!searchResults || searchResults.classList.contains('hidden')) {
        return;
    }
    
    const items = searchResults.querySelectorAll('.search-result-item');
    if (items.length === 0) return;
    
    let currentIndex = -1;
    
    // Находим текущий выбранный элемент
    items.forEach((item, index) => {
        if (item.classList.contains('bg-blue-100')) {
            currentIndex = index;
        }
    });
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (currentIndex < items.length - 1) {
                items.forEach(item => item.classList.remove('bg-blue-100'));
                const newIndex = currentIndex === -1 ? 0 : currentIndex + 1;
                items[newIndex].classList.add('bg-blue-100');
                items[newIndex].scrollIntoView({ block: 'nearest' });
            }
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (currentIndex > 0) {
                items.forEach(item => item.classList.remove('bg-blue-100'));
                const newIndex = currentIndex - 1;
                items[newIndex].classList.add('bg-blue-100');
                items[newIndex].scrollIntoView({ block: 'nearest' });
            }
            break;
            
        case 'Enter':
            e.preventDefault();
            if (currentIndex >= 0) {
                const code = items[currentIndex].getAttribute('data-code');
                if (code) {
                    selectProduct(code);
                    productSearch.blur();
                }
            } else if (lastSearchResults.length > 0) {
                // Выбираем первый результат
                selectProduct(lastSearchResults[0].code);
                productSearch.blur();
            }
            break;
            
        case 'Escape':
            searchResults.classList.add('hidden');
            break;
    }
}

// Загрузка данных о продуктах
async function loadProductsData() {
    try {
        if (dataStatus) dataStatus.classList.remove('hidden');
        
        checkOnlineStatus();
        
        const cached = cacheUtils.getFromCache();
        const cachedEtag = cacheUtils.getEtag();
        
        let shouldUseCache = false;
        let shouldUpdateCache = false;

        if (cached && !cached.isExpired) {
            if (isOnline) {
                const hasUpdates = await checkForUpdates(cachedEtag);
                
                if (!hasUpdates) {
                    console.log('Используем актуальные данные из кэша');
                    processProductsData(cached.data);
                    shouldUseCache = true;
                } else {
                    console.log('Обнаружены обновления, загружаем новые данные');
                    shouldUpdateCache = true;
                }
            } else {
                console.log('Оффлайн режим, используем данные из кэша');
                processProductsData(cached.data);
                shouldUseCache = true;
            }
        } else if (cached) {
            if (isOnline) {
                console.log('Кэш просрочен, проверяем обновления');
                const hasUpdates = await checkForUpdates(cachedEtag);
                
                if (!hasUpdates) {
                    console.log('Обновлений нет, обновляем timestamp кэша');
                    cacheUtils.saveToCache(cached.data, cachedEtag);
                    processProductsData(cached.data);
                    shouldUseCache = true;
                } else {
                    console.log('Обнаружены обновления, загружаем новые данные');
                    shouldUpdateCache = true;
                }
            } else {
                console.log('Оффлайн режим, используем просроченные данные из кэша');
                processProductsData(cached.data);
                shouldUseCache = true;
            }
        } else {
            if (isOnline) {
                console.log('Кэш отсутствует, загружаем данные с сервера');
                shouldUpdateCache = true;
            } else {
                console.log('Оффлайн режим и нет кэша, используем fallback данные');
                cacheUtils.saveFallbackData();
                processProductsData(CONFIG.FALLBACK_DATA);
                showNotification('Работаем в автономном режиме с тестовыми данными', 'warning');
                shouldUseCache = true;
            }
        }

        if (shouldUpdateCache) {
            const response = await fetch(CONFIG.JSON_URL, {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const productsData = await response.json();
            const newEtag = response.headers.get('ETag');
            
            cacheUtils.saveToCache(productsData, newEtag);
            processProductsData(productsData);
            
            if (cached) {
                showNotification('Данные успешно обновлены', 'success');
            }
        }

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        
        const cached = cacheUtils.getFromCache();
        if (cached) {
            console.log('Используем данные из кэша из-за ошибки сети');
            processProductsData(cached.data);
            showNotification('Не удалось загрузить актуальные данные. Используются кэшированные данные.', 'warning');
        } else {
            console.log('Нет кэша, используем fallback данные');
            cacheUtils.saveFallbackData();
            processProductsData(CONFIG.FALLBACK_DATA);
            showNotification('Не удалось загрузить данные. Используются тестовые данные.', 'error');
        }
    } finally {
        if (dataStatus) {
            dataStatus.classList.add('hidden');
        }
    }
}

// Обработка данных о продуктах
function processProductsData(productsData) {
    products = {};
    
    productsData.forEach(product => {
        products[product["Код продукции"]] = {
            "Полное наименование (русское)": product["Полное наименование (русское)"],
            "Срок годности": product["Срок годности"],
            "Штук в упаковке": product["Штук в упаковке"],
            "Штрихкод упаковки": product["Штрихкод упаковки"],
            "Производитель": product["Производитель"],
            "Название стандарта": product["Название стандарта"]
        };
    });
    
    // Строим поисковый индекс
    buildSearchIndex(products);
    
    // Активируем поля ввода
    activateInputFields();
}

// Активация полей ввода
function activateInputFields() {
    if (productSearch) {
        productSearch.disabled = false;
        productSearch.placeholder = "Введите код, название или производителя...";
    }
    if (calculateButton) calculateButton.disabled = false;
    if (printButton) printButton.classList.remove('hidden');
}

// Принудительное обновление данных
async function forceRefreshData() {
    console.log('Принудительное обновление данных');
    
    if (!checkOnlineStatus()) {
        showNotification('Нет подключения к интернету. Обновление невозможно.', 'error');
        return;
    }
    
    showRefreshLoading();
    
    try {
        cacheUtils.clearCache();
        await loadProductsData();
        showNotification('Данные успешно обновлены', 'success');
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        showNotification('Ошибка при обновлении данных', 'error');
    } finally {
        hideRefreshLoading();
    }
}

// Поиск продуктов
if (productSearch) {
    productSearch.addEventListener('input', handleSearchInput);
    productSearch.addEventListener('keydown', handleKeyboardNavigation);
    
    // Фокус на поле поиска при загрузке
    productSearch.addEventListener('focus', function() {
        if (this.value.length >= CONFIG.SEARCH_CONFIG.MIN_QUERY_LENGTH && lastSearchResults.length > 0) {
            searchResults.classList.remove('hidden');
        }
    });
}

// Очистка полей
function clearFields() {
    const fields = [
        'productCode', 'productName', 'shelfLife', 
        'quantityPerPack', 'groupBarcode', 'manufacturerBarcode'
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
    });
    
    const warningMsg = document.getElementById('warningMessage');
    if (warningMsg) {
        warningMsg.remove();
        warningMessageAdded = false;
    }
    
    if (printButton) {
        printButton.disabled = true;
    }
    
    if (standardNotificationContainer) {
        standardNotificationContainer.innerHTML = '';
    }
}

// Закрытие результатов поиска при клике вне области
document.addEventListener('click', function(e) {
    if (productSearch && searchResults) {
        if (!productSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    }
});

// Выбор продукта из результатов поиска
function selectProduct(code) {
    const product = products[code];
    
    const productCodeElem = document.getElementById('productCode');
    const productNameElem = document.getElementById('productName');
    const shelfLifeElem = document.getElementById('shelfLife');
    const quantityPerPackElem = document.getElementById('quantityPerPack');
    const groupBarcodeElem = document.getElementById('groupBarcode');
    const manufacturerBarcodeElem = document.getElementById('manufacturerBarcode');
    
    if (productCodeElem) productCodeElem.value = code;
    if (productNameElem) productNameElem.value = product["Полное наименование (русское)"];
    if (shelfLifeElem) shelfLifeElem.value = product["Срок годности"];
    if (quantityPerPackElem) quantityPerPackElem.value = product["Штук в упаковке"] || "";
    if (groupBarcodeElem) groupBarcodeElem.value = product["Штрихкод упаковки"] || "";
    if (manufacturerBarcodeElem) manufacturerBarcodeElem.value = product["Производитель"] || "";

    if (productSearch) productSearch.value = '';
    if (searchResults) searchResults.classList.add('hidden');

    if (product["Название стандарта"] && standardNotificationContainer) {
        showStandardNotification("Статус: " + product["Название стандарта"]);
    }
    
    // Активируем кнопку печати
    if (printButton) {
        printButton.disabled = false;
    }
    
    // Показываем подсказку о расчете
    if (!warningMessageAdded) {
        const warningMessage = document.createElement('div');
        warningMessage.id = 'warningMessage';
        warningMessage.className = 'mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700';
        warningMessage.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-lightbulb mr-2"></i>
                <div>
                    <strong>Продукт выбран!</strong> Теперь укажите дату производства и нажмите "Рассчитать срок годности".
                </div>
            </div>
        `;
        
        const calculateButton = document.querySelector('button[onclick="calculateExpiry()"]');
        if (calculateButton) {
            calculateButton.parentNode.insertBefore(warningMessage, calculateButton);
            warningMessageAdded = true;
        }
    }
}

// Показать стандартное уведомление
function showStandardNotification(standard) {
    if (!standardNotificationContainer) return;
    
    standardNotificationContainer.innerHTML = '';
    
    if (!standard || standard === 'Не указано') return;
    
    const notification = document.createElement('div');
    notification.className = 'p-3 rounded-lg shadow-md bg-blue-100 border border-blue-300 text-blue-800 slide-in';
    notification.setAttribute('aria-live', 'polite');
    notification.innerHTML = `
        <div class="flex items-start">
            <i class="fas fa-certificate mr-2 mt-1 text-blue-600"></i>
            <div class="flex-grow break-words">${standard}</div>
        </div>
    `;
    standardNotificationContainer.appendChild(notification);
}

// Расчет срока годности
function calculateExpiry() {
    const shelfLifeElem = document.getElementById('shelfLife');
    const productionDateElem = document.getElementById('productionDate');
    const expiryDateElem = document.getElementById('expiryDate');
    const resultDiv = document.getElementById('result');
    
    if (!shelfLifeElem || !productionDateElem || !expiryDateElem || !resultDiv) return;
    
    const shelfLife = parseInt(shelfLifeElem.value);
    const productionDate = productionDateElem.value;

    if (!shelfLife || !productionDate) {
        showNotification('Пожалуйста, выберите продукт и укажите дату производства', 'error');
        return;
    }

    const production = new Date(productionDate);
    const expiryDate = new Date(production);
    expiryDate.setDate(production.getDate() + shelfLife);

    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    const formattedDate = expiryDate.toLocaleDateString('ru-RU', options);

    expiryDateElem.textContent = formattedDate;

    resultDiv.classList.remove('hidden');
    resultDiv.classList.add('fade-in');

    const warningMsg = document.getElementById('warningMessage');
    if (warningMsg) {
        warningMsg.remove();
        warningMessageAdded = false;
    }

    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Печать результатов
function printResults() {
    const productCode = document.getElementById('productCode').value;
    const productName = document.getElementById('productName').value;
    const shelfLife = document.getElementById('shelfLife').value;
    const quantityPerPack = document.getElementById('quantityPerPack').value;
    const groupBarcode = document.getElementById('groupBarcode').value;
    const manufacturerBarcode = document.getElementById('manufacturerBarcode').value;
    const productionDate = document.getElementById('productionDate').value;
    const expiryDate = document.getElementById('expiryDate').textContent;

    if (!productCode || !productName) {
        showNotification('Нет данных для печати. Сначала выберите продукт.', 'error');
        return;
    }

    const printContent = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Расчет срока годности</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 15mm;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #000;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                }
                .print-header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #2c3e50;
                }
                .print-info {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .print-info th, .print-info td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                .print-info th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    width: 30%;
                }
                .print-info td {
                    background-color: #fff;
                }
                .print-result {
                    background-color: #e8f4fd;
                    border: 2px solid #3498db;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                .print-result h3 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                }
                .print-result .expiry-date {
                    font-size: 20px;
                    font-weight: bold;
                    color: #e74c3c;
                }
                .print-footer {
                    margin-top: 40px;
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .company-info {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 16px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="company-info">АО "ПРОГРЕСС"</div>
            
            <div class="print-header">
                <h1>РАСЧЕТ СРОКА ГОДНОСТИ ПРОДУКЦИИ</h1>
            </div>

            <table class="print-info">
                <tr>
                    <th>Код продукции</th>
                    <td>${productCode}</td>
                </tr>
                <tr>
                    <th>Наименование продукции</th>
                    <td>${productName}</td>
                </tr>
                <tr>
                    <th>Срок годности</th>
                    <td>${shelfLife} дней</td>
                </tr>
                <tr>
                    <th>Штук в упаковке</th>
                    <td>${quantityPerPack || 'Не указано'}</td>
                </tr>
                <tr>
                    <th>Штрихкод упаковки</th>
                    <td>${groupBarcode || 'Не указано'}</td>
                </tr>
                <tr>
                    <th>Производитель</th>
                    <td>${manufacturerBarcode || 'Не указано'}</td>
                </tr>
                <tr>
                    <th>Дата производства</th>
                    <td>${productionDate}</td>
                </tr>
            </table>

            <div class="print-result">
                <h3>Дата окончания срока годности:</h3>
                <div class="expiry-date">${expiryDate || 'Не рассчитано'}</div>
            </div>

            <div class="print-footer">
                Дата и время печати: ${new Date().toLocaleString('ru-RU')}
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = function() {
        printWindow.print();
        setTimeout(function() {
            printWindow.close();
        }, 100);
    };
}

// Показать уведомление
function showNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.notification-message');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification-message fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 transform translate-x-0 opacity-100 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'info' ? 'bg-blue-500' : 'bg-red-500'
    }`;
    notification.setAttribute('aria-live', 'assertive');
    notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${
          type === 'success' ? 'fa-check-circle' : 
          type === 'warning' ? 'fa-exclamation-triangle' : 
          type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle'
      } mr-2"></i>
      ${message}
    </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Устанавливаем сегодняшнюю дату по умолчанию
    const productionDateElem = document.getElementById('productionDate');
    if (productionDateElem) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        productionDateElem.value = `${year}-${month}-${day}`;
    }
    
    // Регистрируем Service Worker
    registerServiceWorker();
    
    // Слушатели событий онлайн/оффлайн
    window.addEventListener('online', () => {
        console.log('Онлайн статус: онлайн');
        checkOnlineStatus();
        setTimeout(() => {
            loadProductsData();
        }, 1000);
    });
    
    window.addEventListener('offline', () => {
        console.log('Онлайн статус: оффлайн');
        checkOnlineStatus();
    });
    
    // Загружаем данные о продуктах
    loadProductsData();
});

// Экспортируем функции для глобального использования
window.calculateExpiry = calculateExpiry;
window.forceRefreshData = forceRefreshData;
window.printResults = printResults;
