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
    ]
};

// Глобальные переменные
let products = {};
let warningMessageAdded = false;
let isOnline = true;

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

// Регистрация Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('Service Worker зарегистрирован успешно:', registration.scope);
                
                // Проверяем наличие обновлений Service Worker
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

        // Отслеживаем изменения Service Worker
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
    // Сохранить данные в кэш
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
            
            // Обновляем информацию о последнем обновлении
            updateLastUpdateInfo(cacheData.lastUpdate);
        } catch (error) {
            console.error('Ошибка сохранения в кэш:', error);
        }
    },

    // Получить данные из кэша
    getFromCache: () => {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const isExpired = Date.now() - cacheData.timestamp > CONFIG.CACHE_EXPIRY;

            // Показываем информацию о последнем обновлении
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

    // Получить ETag из localStorage
    getEtag: () => {
        try {
            return localStorage.getItem(CONFIG.ETAG_KEY);
        } catch (error) {
            console.error('Ошибка чтения ETag:', error);
            return null;
        }
    },

    // Очистить кэш
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

    // Сохранить fallback данные
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

// Показать анимацию загрузки на кнопке обновления в футере
function showRefreshLoading() {
    if (refreshFooterButton) {
        refreshFooterButton.classList.add('refreshing');
        refreshFooterButton.disabled = true;
    }
}

// Скрыть анимацию загрузки на кнопке обновления в футере
function hideRefreshLoading() {
    if (refreshFooterButton) {
        refreshFooterButton.classList.remove('refreshing');
        refreshFooterButton.disabled = false;
    }
}

// Проверка обновлений на сервере
async function checkForUpdates(cachedEtag) {
    try {
        // Если оффлайн, не проверяем обновления
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
            return false; // Нет обновлений
        }

        if (response.status === 200) {
            const newEtag = response.headers.get('ETag');
            if (newEtag && newEtag !== cachedEtag) {
                console.log('Обнаружены обновления на сервере');
                return true; // Есть обновления
            }
        }

        return false;
    } catch (error) {
        console.error('Ошибка проверки обновлений:', error);
        return false; // При ошибке считаем, что обновлений нет
    }
}

// Загрузка данных о продуктах
async function loadProductsData() {
    try {
        // Показываем индикатор загрузки
        if (dataStatus) dataStatus.classList.remove('hidden');
        
        // Проверяем онлайн статус
        checkOnlineStatus();
        
        // Проверяем кэш
        const cached = cacheUtils.getFromCache();
        const cachedEtag = cacheUtils.getEtag();
        
        let shouldUseCache = false;
        let shouldUpdateCache = false;

        if (cached && !cached.isExpired) {
            // Кэш актуален, проверяем обновления на сервере (только если онлайн)
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
                // Оффлайн режим - используем кэш
                console.log('Оффлайн режим, используем данные из кэша');
                processProductsData(cached.data);
                shouldUseCache = true;
            }
        } else if (cached) {
            // Кэш просрочен, но данные есть
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
                // Оффлайн режим - используем просроченный кэш
                console.log('Оффлайн режим, используем просроченные данные из кэша');
                processProductsData(cached.data);
                shouldUseCache = true;
            }
        } else {
            // Нет кэша
            if (isOnline) {
                console.log('Кэш отсутствует, загружаем данные с сервера');
                shouldUpdateCache = true;
            } else {
                // Оффлайн и нет кэша - используем fallback данные
                console.log('Оффлайн режим и нет кэша, используем fallback данные');
                cacheUtils.saveFallbackData();
                processProductsData(CONFIG.FALLBACK_DATA);
                showNotification('Работаем в автономном режиме с тестовыми данными', 'warning');
                shouldUseCache = true;
            }
        }

        // Загружаем новые данные если нужно
        if (shouldUpdateCache) {
            const response = await fetch(CONFIG.JSON_URL, {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const productsData = await response.json();
            const newEtag = response.headers.get('ETag');
            
            // Сохраняем в кэш
            cacheUtils.saveToCache(productsData, newEtag);
            
            // Обрабатываем данные
            processProductsData(productsData);
            
            // Показываем уведомление об успешной загрузке
            if (cached) {
                showNotification('Данные успешно обновлены', 'success');
            }
        }

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        
        // Пытаемся использовать кэш, даже если он просрочен
        const cached = cacheUtils.getFromCache();
        if (cached) {
            console.log('Используем данные из кэша из-за ошибки сети');
            processProductsData(cached.data);
            showNotification('Не удалось загрузить актуальные данные. Используются кэшированные данные.', 'warning');
        } else {
            // Нет кэша и не удалось загрузить данные - используем fallback
            console.log('Нет кэша, используем fallback данные');
            cacheUtils.saveFallbackData();
            processProductsData(CONFIG.FALLBACK_DATA);
            showNotification('Не удалось загрузить данные. Используются тестовые данные.', 'error');
        }
    } finally {
        // Скрываем индикатор загрузки
        if (dataStatus) {
            dataStatus.classList.add('hidden');
        }
    }
}

// Обработка данных о продуктах
function processProductsData(productsData) {
    products = {}; // Очищаем предыдущие данные
    
    // Преобразуем массив в объект для быстрого поиска по коду
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
    
    // Активируем поля ввода
    activateInputFields();
}

// Активация полей ввода
function activateInputFields() {
    if (productSearch) productSearch.disabled = false;
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
    
    // Показываем анимацию загрузки
    showRefreshLoading();
    
    try {
        // Очищаем кэш и загружаем заново
        cacheUtils.clearCache();
        await loadProductsData();
        showNotification('Данные успешно обновлены', 'success');
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        showNotification('Ошибка при обновлении данных', 'error');
    } finally {
        // Скрываем анимацию загрузки
        hideRefreshLoading();
    }
}

// Поиск продуктов
if (productSearch) {
    productSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchResults) searchResults.innerHTML = '';
        if (standardNotificationContainer) standardNotificationContainer.innerHTML = '';
        
        if (searchTerm.length < 2) {
            if (searchResults) searchResults.classList.add('hidden');
            clearFields();
            return;
        }

        let resultsFound = false;

        for (const code in products) {
            const product = products[code];
            if (code.includes(searchTerm) ||
                product["Полное наименование (русское)"].toLowerCase().includes(searchTerm)) {

                const div = document.createElement('div');
                div.className = 'p-3 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100 last:border-0';
                div.setAttribute('role', 'option');
                div.innerHTML = `
                <div class="bg-blue-100 p-2 rounded-lg mr-3">
                  <i class="fas fa-box text-blue-600"></i>
                </div>
                <div>
                  <div class="font-medium text-blue-800">${product["Полное наименование (русское)"]}</div>
                  <div class="text-sm text-gray-500">Код: <span class="product-code">${code}</span> | Срок: <span class="shelf-life">${product["Срок годности"]} дней</span></div>
                </div>
                `;
                div.onclick = function() {
                    selectProduct(code);
                };
                if (searchResults) searchResults.appendChild(div);
                resultsFound = true;
            }
        }

        if (searchResults) {
            if (resultsFound) {
                searchResults.classList.remove('hidden');
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'p-3 text-gray-500 text-center';
                noResults.textContent = 'Ничего не найдено';
                noResults.setAttribute('role', 'option');
                searchResults.appendChild(noResults);
                searchResults.classList.remove('hidden');
            }
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
    
    // Деактивируем кнопку печати при очистке полей
    if (printButton) {
        printButton.disabled = true;
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
    
    // Активируем кнопку печати при выборе продукта
    if (printButton) {
        printButton.disabled = false;
    }
    
    if (!warningMessageAdded) {
        const warningMessage = document.createElement('div');
        warningMessage.id = 'warningMessage';
        warningMessage.className = 'mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700';
        warningMessage.textContent = 'Важно! Для завершения процесса нажмите кнопку "Рассчитать срок годности".';
        
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

    // Проверяем, есть ли данные для печати
    if (!productCode || !productName) {
        showNotification('Нет данных для печати. Сначала выберите продукт.', 'error');
        return;
    }

    // Создаем содержимое для печати
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

    // Открываем новое окно для печати
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Запускаем печать после загрузки содержимого
    printWindow.onload = function() {
        printWindow.print();
        // Закрываем окно после печати
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
        // Автоматически обновляем данные при восстановлении соединения
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
