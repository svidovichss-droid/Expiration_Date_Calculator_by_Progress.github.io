/* Jekyll Architect Theme Styles - Light Theme */
:root {
    --primary-color: #3498db;
    --secondary-color: #2980b9;
    --accent-color: #e74c3c;
    --light-color: #ffffff;
    --dark-color: #2c3e50;
    --text-color: #2c3e50;
    --border-color: #e1e8ed;
    --shadow-color: rgba(0, 0, 0, 0.08);
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --error-color: #e74c3c;
    --info-color: #3498db;
    --background-color: #f8fafc;
    --card-background: #ffffff;
    --header-background: #1a1a2e;
    --footer-background: #1a1a2e;
    --header-text-color: #ffffff;
    --footer-text-color: #ffffff;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* ОСНОВНЫЕ ИЗМЕНЕНИЯ ДЛЯ ПОДВАЛА И ШАПКИ */
html, body {
    height: 100%;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: var(--text-color);
    background-color: var(--background-color);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 15px;
    flex: 1;
}

/* Header styles - ТЁМНАЯ ШАПКА (ИСПРАВЛЕНА) */
.header {
    background: linear-gradient(135deg, var(--header-background) 0%, #16213e 100%);
    color: var(--header-text-color);
    padding: 2rem 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: visible; /* Изменено с hidden на visible */
    border-bottom: none;
    width: 100%;
    margin: 0;
}

.header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%233498db' fill-opacity='0.1' d='M0,128L48,117.3C96,107,192,85,288,112C384,139,480,213,576,218.7C672,224,768,160,864,138.7C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
    background-size: cover;
    background-position: center;
    opacity: 0.3;
}

.header-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: auto;
}

.header h1 {
    color: var(--header-text-color);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    margin: 0;
    font-size: 2rem;
    line-height: 1.2;
}

.header p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
}

.logo {
    color: var(--header-text-color);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    text-align: right;
}

.logo div:first-child {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3498db, #2980b9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.25rem;
}

.logo div:last-child {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
}

/* Основной контент - исправленные отступы */
.main-content {
    flex: 1;
    width: 100%;
    padding: 0;
    margin: 0;
}

.container.mt-4 {
    margin-top: 2rem !important;
    padding-bottom: 2rem;
}

/* Card styles */
.card {
    background: var(--card-background);
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--shadow-color);
    overflow: hidden;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color);
}

.card:hover {
    box-shadow: 0 8px 25px var(--shadow-color);
    transform: translateY(-2px);
}

.card-header {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.card-body {
    padding: 1.5rem;
}

/* Minimalistic print button */
.print-btn-minimal {
    background: #f8fafc;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.75rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 0.5rem;
}

.print-btn-minimal:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
    color: #374151;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.print-btn-minimal:active:not(:disabled) {
    transform: translateY(0);
}

.print-btn-minimal:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    opacity: 0.5;
}

.print-btn-minimal i {
    font-size: 1.25rem;
}

/* Show print button only when there's something to print */
.print-btn-minimal.active {
    display: flex !important;
}

/* Form elements */
input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    font-family: inherit;
    background-color: var(--light-color);
    color: var(--text-color);
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

input[readonly] {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
}

input:disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
    opacity: 0.7;
}

/* Button styles */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px var(--shadow-color);
    text-decoration: none;
    font-family: inherit;
}

.btn:hover {
    background-color: var(--secondary-color);
    box-shadow: 0 4px 12px var(--shadow-color);
    transform: translateY(-1px);
}

.btn:active {
    box-shadow: 0 2px 4px var(--shadow-color);
    transform: translateY(0);
}

.btn:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-primary {
    background-color: var(--primary-color);
}

.btn-primary:hover {
    background-color: var(--secondary-color);
}

.btn-success {
    background-color: var(--success-color);
}

.btn-success:hover {
    background-color: #219653;
}

.btn-large {
    padding: 1rem 2rem;
    font-size: 1.25rem;
}

/* Grid system */
.grid {
    display: grid;
    gap: 1.5rem;
}

.grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Utility classes */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-5 { margin-top: 1.5rem; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.5rem; }

.ml-1 { margin-left: 0.25rem; }
.ml-2 { margin-left: 0.5rem; }
.ml-3 { margin-left: 0.75rem; }
.ml-4 { margin-left: 1rem; }
.ml-5 { margin-left: 1.5rem; }

.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.mr-4 { margin-right: 1rem; }
.mr-5 { margin-right: 1.5rem; }

.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.5rem; }

.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }

.w-full { width: 100%; }
.h-full { height: 100%; }

.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }

.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }

.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }

.cursor-pointer { cursor: pointer; }
.cursor-not-allowed { cursor: not-allowed; }

.opacity-90 { opacity: 0.9; }
.opacity-70 { opacity: 0.7; }
.opacity-50 { opacity: 0.5; }

.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }

.shadow { box-shadow: 0 1px 3px 0 var(--shadow-color), 0 1px 2px 0 rgba(0, 0, 0, 0.04); }
.shadow-md { box-shadow: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px rgba(0, 0, 0, 0.04); }
.shadow-lg { box-shadow: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px rgba(0, 0, 0, 0.03); }

.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.border-l { border-left-width: 1px; }
.border-r { border-right-width: 1px; }

.border-gray-100 { border-color: #f7fafc; }
.border-gray-200 { border-color: #edf2f7; }
.border-gray-300 { border-color: #e2e8f0; }
.border-blue-200 { border-color: #bee3f8; }
.border-blue-300 { border-color: #90cdf4; }
.border-yellow-200 { border-color: #fefcbf; }
.border-yellow-500 { border-color: #ecc94b; }
.border-purple-200 { border-color: #e9d8fd; }

.bg-white { background-color: white; }
.bg-gray-100 { background-color: #f7fafc; }
.bg-blue-50 { background-color: #ebf8ff; }
.bg-blue-100 { background-color: #bee3f8; }
.bg-yellow-50 { background-color: #fffff0; }
.bg-yellow-100 { background-color: #fefcbf; }
.bg-green-50 { background-color: #f0fff4; }
.bg-red-50 { background-color: #fff5f5; }
.bg-purple-50 { background-color: #faf5ff; }

.text-white { color: white; }
.text-gray-500 { color: #6b7280; }
.text-gray-700 { color: #374151; }
.text-blue-500 { color: #3b82f6; }
.text-blue-600 { color: #2563eb; }
.text-blue-700 { color: #1d4ed8; }
.text-blue-800 { color: #1e40af; }
.text-yellow-600 { color: #d97706; }
.text-yellow-700 { color: #b45309; }
.text-green-700 { color: #047857; }
.text-red-700 { color: #b91c1c; }
.text-purple-600 { color: #7c3aed; }
.text-purple-800 { color: #5b21b6; }

.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }

.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }

/* Animations */
.fade-in {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.slide-up {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Loading spinner */
.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Footer - ТЁМНЫЙ ПОДВАЛ */
.footer {
    background: linear-gradient(135deg, var(--footer-background) 0%, #16213e 100%);
    color: var(--footer-text-color);
    padding: 2rem 0;
    text-align: center;
    margin-top: auto;
    border-top: none;
    width: 100%;
    flex-shrink: 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.footer p {
    color: rgba(255, 255, 255, 0.9);
}

.footer a {
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.3s ease;
}

.footer a:hover {
    color: var(--primary-color);
}

/* Responsive design - исправления для мобильных устройств */
@media (max-width: 768px) {
    .container {
        padding: 0 10px;
    }
    
    .header {
        padding: 1.5rem 0;
    }
    
    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
        padding: 0 1rem;
    }
    
    .header h1 {
        font-size: 1.75rem;
        line-height: 1.3;
    }
    
    .header p {
        font-size: 1rem;
    }
    
    .logo {
        text-align: center;
        margin-top: 0.5rem;
    }
    
    .logo div:first-child {
        font-size: 1.5rem;
    }
    
    .logo div:last-child {
        font-size: 0.8rem;
    }
    
    .container.mt-4 {
        margin-top: 1.5rem !important;
        padding: 0 1rem;
    }
    
    .grid-2 {
        grid-template-columns: 1fr;
    }
    
    .card-body {
        padding: 1rem;
    }
    
    .print-btn-minimal {
        width: 44px;
        height: 44px;
        padding: 0.65rem;
    }
    
    .notification-message {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
    }
    
    .pwa-install-prompt {
        bottom: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .search-results-container {
        max-height: 200px;
    }
    
    .footer .flex {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .footer .flex.space-x-4 {
        flex-direction: row;
        justify-content: center;
    }
    
    .footer .text-sm {
        font-size: 0.8rem;
    }
}

@media (max-width: 480px) {
    .header {
        padding: 1.25rem 0;
    }
    
    .header h1 {
        font-size: 1.5rem;
    }
    
    .header p {
        font-size: 0.9rem;
    }
    
    .card-header {
        padding: 1rem;
    }
    
    .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
    }
    
    .pwa-install-actions {
        flex-direction: column;
    }
    
    .container.mt-4 {
        margin-top: 1rem !important;
    }
    
    .print-btn-minimal {
        width: 40px;
        height: 40px;
        padding: 0.6rem;
    }
    
    .print-btn-minimal i {
        font-size: 1.1rem;
    }
}
