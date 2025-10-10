const CACHE_NAME = 'progress-calculator-v2.5';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/script.js',
    '/styles.css',
    '/manifest.json',
    '/data.json',
    '/fallback.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка начата');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Кэширование основных файлов');
                return cache.addAll(CACHE_URLS.map(url => {
                    try {
                        return new Request(url, { mode: 'no-cors' });
                    } catch (error) {
                        console.log('Ошибка создания Request для:', url, error);
                        return url;
                    }
                })).catch(error => {
                    console.log('Не удалось закэшировать некоторые файлы:', error);
                    // Продолжаем работу даже если некоторые файлы не закэшировались
                    return Promise.resolve();
                });
            })
            .then(() => {
                console.log('Service Worker: Установка завершена');
                // Активируем Service Worker сразу
                return self.skipWaiting();
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация начата');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Удаление старого кэша', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Активация завершена');
            // Берём под контроль все вкладки сразу
            return self.clients.claim();
        })
    );
});

// Перехват запросов - ОБНОВЛЕННАЯ СТРАТЕГИЯ ДЛЯ PWA
self.addEventListener('fetch', (event) => {
    // Игнорируем запросы к Google Analytics и другим внешним сервисам
    if (event.request.url.includes('google-analytics') || 
        event.request.url.includes('gtag')) {
        return;
    }

    // Для навигационных запросов (HTML страницы) - стратегия "сначала кэш, потом сеть"
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('Service Worker: Возвращаем кэшированную страницу');
                        return cachedResponse;
                    }
                    
                    // Если нет в кэше, пробуем загрузить из сети
                    return fetch(event.request)
                        .then((networkResponse) => {
                            // Клонируем ответ для кэширования
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                            return networkResponse;
                        })
                        .catch(() => {
                            // Если сеть недоступна и нет в кэше, возвращаем запасную страницу
                            return caches.match('/index.html')
                                .then((fallbackResponse) => {
                                    if (fallbackResponse) {
                                        return fallbackResponse;
                                    }
                                    // Если даже запасной страницы нет, возвращаем простой HTML
                                    return new Response(
                                        '<html><body><h1>Калькулятор срока годности</h1><p>Приложение загружается...</p></body></html>',
                                        { headers: { 'Content-Type': 'text/html' } }
                                    );
                                });
                        });
                })
        );
        return;
    }

    // Для JSON данных используем стратегию "Сначала сеть, потом кэш"
    if (event.request.url.includes('data.json')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Клонируем ответ, так как он может быть использован только один раз
                    const responseClone = response.clone();
                    
                    // Сохраняем свежие данные в кэш
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    
                    return response;
                })
                .catch(() => {
                    // Если сеть недоступна, используем кэшированные данные
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                console.log('Service Worker: Используем кэшированные данные JSON');
                                return cachedResponse;
                            }
                            // Если нет кэшированных данных, возвращаем fallback
                            console.log('Service Worker: Используем fallback данные JSON');
                            return new Response(JSON.stringify([
                                {
                                    "Код продукции": "000001",
                                    "Полное наименование (русское)": "Тестовый продукт 1 (офлайн)",
                                    "Срок годности": 365,
                                    "Штук в упаковке": 10,
                                    "Штрихкод упаковки": "1234567890123",
                                    "Производитель": "Тестовый производитель",
                                    "Название стандарта": "ГОСТ 12345-2020"
                                },
                                {
                                    "Код продукции": "000002", 
                                    "Полное наименование (русское)": "Тестовый продукт 2 (офлайн)",
                                    "Срок годности": 180,
                                    "Штук в упаковке": 5,
                                    "Штрихкод упаковки": "9876543210987",
                                    "Производитель": "Другой производитель",
                                    "Название стандарта": "ТУ 45678-2021"
                                }
                            ]), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                })
        );
        return;
    }

    // Для остальных файлов используем стратегию "Сначала кэш, потом сеть"
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кэшированную версию или делаем запрос к сети
                if (response) {
                    console.log('Service Worker: Возвращаем кэшированный ресурс', event.request.url);
                    return response;
                }
                
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Кэшируем новый ресурс
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('Service Worker: Ошибка загрузки', event.request.url, error);
                        // Для CSS и JS возвращаем пустые ответы чтобы не ломать страницу
                        if (event.request.url.includes('.css')) {
                            return new Response('', { headers: { 'Content-Type': 'text/css' } });
                        }
                        if (event.request.url.includes('.js')) {
                            return new Response('// Fallback JS', { headers: { 'Content-Type': 'application/javascript' } });
                        }
                    });
            })
    );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Фоновая синхронизация');
        // Здесь можно добавить логику для фоновой синхронизации данных
    }
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-data-update') {
        console.log('Service Worker: Периодическое обновление данных');
        // Обновление данных в фоновом режиме
    }
});

// Обработка сообщений от основного скрипта
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
