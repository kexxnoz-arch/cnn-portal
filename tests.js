// Модуль авто-тестов и экспорта файлов E:\cnnPortal
function toggleTestPanel() {
            const panel = document.getElementById('testSuiteSection');
            panel.classList.toggle('hidden');
            lucide.createIcons();
        }

        function logToTestConsole(msg, colorClass = 'text-gray-300') {
            const log = document.getElementById('testConsoleLog');
            if (!log) return;
            const timeStr = new Date().toLocaleTimeString('ru-RU');
            const line = document.createElement('div');
            line.className = `${colorClass} leading-relaxed`;
            line.textContent = `[${timeStr}] ${msg}`;
            log.prepend(line);
        }

        function clearTestLog() {
            const log = document.getElementById('testConsoleLog');
            if (log) log.innerHTML = '';
        }

        function advanceSimulatedTimeDays(days) {
            state.timeOffsetMs += days * DAY_MS;
            const totalDaysOffset = Math.round(state.timeOffsetMs / DAY_MS);
            document.getElementById('timeOffsetBadge').textContent = `Смещение: +${totalDaysOffset} дн.`;

            logToTestConsole(`⏩ Время перемотано вперед на +${days} дн. (общее смещение: +${totalDaysOffset} дн.)`, 'text-cnn-orange font-semibold');
            const deletedCount = purgeExpiredContracts(false);
            if (deletedCount === 0) {
                updateUI();
                showToast(`Время перемотано на +${days} дн.`, 'Проверьте обновленные статусы и точный остаток времени');
            }
        }

        function spawnExpiringSoonTestContract() {
            const now = getCurrentTimeMs();
            const testContract = {
                id: 'c-exp-' + Date.now(),
                codeword: 'ТЕСТ-18Ч',
                partner: 'Тестовый партнер (Проверка 18 часов)',
                fullText: 'Тестовый контракт со сроком ровно 18 часов. Слева от кодового слова отображается «18 ч.» без округления и статус «Скоро истекает».',
                pinned: false,
                expiresAt: now + (18 * HOUR_MS),
                createdAt: new Date().toLocaleDateString('ru-RU')
            };
            state.contracts.unshift(testContract);
            saveDatabase();
            updateUI();
            logToTestConsole(`✅ Создан контракт «${testContract.codeword}» на 18 часов -> Отображается ровно «18 ч.» и статус «Скоро истекает»`, 'text-amber-300');
            showToast('Создан контракт на 18 ч.', 'Слева отображается ровно «18 ч.» без округления');
        }

        function spawnFiveSecondTestContract() {
            const now = getCurrentTimeMs();
            const testContract = {
                id: 'c-5sec-' + Date.now(),
                codeword: 'ТЕСТ-5СЕК',
                partner: 'Тест авто-удаления (5 секунд)',
                fullText: 'Этот контракт создан на 5 секунд. Как только таймер дойдет до 0, он автоматически удалится с главной страницы.',
                pinned: false,
                expiresAt: now + 5000,
                createdAt: new Date().toLocaleDateString('ru-RU')
            };
            state.contracts.unshift(testContract);
            saveDatabase();
            updateUI();
            logToTestConsole(`⏱️ Создан контракт «ТЕСТ-5СЕК» со сроком 5 секунд. Наблюдайте за верхней строкой списка — через 5 сек он автоматически удалится!`, 'text-emerald-400 font-semibold');
            showToast('Создан контракт «ТЕСТ-5СЕК»', 'Он автоматически удалится через 5 секунд!');
        }

        function resetTestEnvironment() {
            state.timeOffsetMs = 0;
            document.getElementById('timeOffsetBadge').textContent = 'Смещение: +0 дн.';
            state.contracts = createDefaultContracts();
            saveDatabase();
            updateUI();
            logToTestConsole('🔄 Общая база контрактов и смещение времени сброшены к исходным значениям.', 'text-gray-400');
            showToast('Тестовая среда сброшена');
        }

        function runAutomatedContractTests() {
            clearTestLog();
            logToTestConsole('🚀 Запуск автоматических тестов системы контрактов (4 теста)...', 'text-white font-bold');

            const now = getCurrentTimeMs();

            const cActive = { id: 'ut-1', codeword: 'UT-ACTIVE', partner: 'Unit Test 1', fullText: 'Text', expiresAt: now + (5 * DAY_MS) };
            const days1 = getContractDaysLeft(cActive);
            const label1 = formatDaysRemaining(cActive);
            const isActiveStatus = days1 >= 2 && label1 === '5 дн.';
            logToTestConsole(
                isActiveStatus
                    ? `✅ [ТЕСТ 1 ПРОЙДЕН] Контракт на 5 дней имеет статус «Активен» и выводит ровно «${label1}».`
                    : `❌ [ТЕСТ 1 ОШИБКА] Получено: ${label1}`,
                isActiveStatus ? 'text-emerald-400' : 'text-red-400'
            );

            const cExpiring = { id: 'ut-2', codeword: 'UT-EXPIRING', partner: 'Unit Test 2', fullText: 'Text', expiresAt: now + (18 * HOUR_MS) };
            const days2 = getContractDaysLeft(cExpiring);
            const label2 = formatDaysRemaining(cExpiring);
            const isExpiringStatus = days2 > 0 && days2 < 2 && label2 === '18 ч.';
            logToTestConsole(
                isExpiringStatus
                    ? `✅ [ТЕСТ 2 ПРОЙДЕН] Контракт на 18 часов выводит ровное число часов «${label2}» без округления и статус «Скоро истекает».`
                    : `❌ [ТЕСТ 2 ОШИБКА] Получено: ${label2}`,
                isExpiringStatus ? 'text-emerald-400' : 'text-red-400'
            );

            const expiredContractId = 'ut-expired-' + Date.now();
            state.contracts.unshift({
                id: expiredContractId,
                codeword: 'АВТО-УДАЛЕНИЕ-ТЕСТ',
                partner: 'Истекший Контракт ООО',
                fullText: 'Должен быть автоматически удален',
                expiresAt: now - 1000
            });
            purgeExpiredContracts(true);
            const stillExists = state.contracts.some(c => c.id === expiredContractId);
            logToTestConsole(
                !stillExists
                    ? '✅ [ТЕСТ 3 ПРОЙДЕН] Контракт с истекшим временем (0 ч.) автоматически удален из базы и скрыт с главной страницы.'
                    : '❌ [ТЕСТ 3 ОШИБКА] Истекший контракт не был удален.',
                !stillExists ? 'text-emerald-400' : 'text-red-400'
            );

            logToTestConsole('⏳ [ТЕСТ 4 В ПРОЦЕССЕ] Создан живой контракт «LIVE-ТЕСТ-4С» на 4 секунды для визуальной проверки...', 'text-cnn-orange');
            const liveId = 'ut-live-' + Date.now();
            state.contracts.unshift({
                id: liveId,
                codeword: 'LIVE-ТЕСТ-4С',
                partner: 'Визуальный тест авто-удаления (4 сек)',
                fullText: 'Этот контракт автоматически исчезнет через 4 секунды.',
                expiresAt: getCurrentTimeMs() + 4000,
                createdAt: new Date().toLocaleDateString('ru-RU')
            });
            saveDatabase();
            updateUI();

            setTimeout(() => {
                purgeExpiredContracts(false);
                const existsAfter4s = state.contracts.some(c => c.id === liveId);
                logToTestConsole(
                    !existsAfter4s
                        ? '✅ [ТЕСТ 4 ПРОЙДЕН] Живой контракт «LIVE-ТЕСТ-4С» автоматически удалился по истечении 4 секунд!'
                        : '❌ [ТЕСТ 4 ОШИБКА] Контракт все еще в списке.',
                    !existsAfter4s ? 'text-emerald-400 font-bold' : 'text-red-400'
                );
            }, 4200);
        }

        function getSplitFilesMap() {
            const styleEl = document.querySelector('style');
            const styleContent = styleEl ? styleEl.innerHTML.trim() : '';

            const scripts = document.querySelectorAll('script');
            const mainScriptEl = scripts[scripts.length - 1];
            const allScriptContent = mainScriptEl ? mainScriptEl.innerHTML.trim() : '';
            const splitMarker = '