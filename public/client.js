// Helper function to detect mobile devices
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper function to detect iPad specifically
    function isIPad() {
        return /iPad/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && window.innerWidth >= 768);
    }

    // Helper function to create chart config from raw data
    function createChartConfigFromRawData(rawChartData) {
        if (!rawChartData) return null;
        
        const labelMapping = new Map([
            ['LeadershipAndIndependence', '领导与独立'],
            ['EmpathyAndConnection', '共情与连结'],
            ['CreativityAndExpression', '创意与表达'],
            ['AnalyticalAndStrategicMind', '分析与策略'],
            ['DiligenceAndReliability', '勤奋与可靠'],
            ['AdventurousAndAdaptableSpirit', '冒险与适应']
        ]);

        const labels = Object.keys(rawChartData).map(key => labelMapping.get(key) || key);
        const data = Object.values(rawChartData);

        return {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '性格蓝图分数',
                    data: data,
                    backgroundColor: 'rgba(160, 132, 232, 0.2)',
                    borderColor: 'rgb(95, 153, 247)',
                    pointBackgroundColor: 'rgb(95, 153, 247)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(95, 153, 247)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 10,
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            display: false,
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        color: '#ffffff',
                        backgroundColor: 'rgba(132, 175, 232, 0.8)',
                        borderRadius: 4,
                        font: {
                            weight: 'bold'
                        },
                        padding: 4
                    }
                }
            }
        };
    }

// Helper function to check Web Share API capabilities
function getShareCapabilities() {
    const capabilities = {
        hasWebShare: !!navigator.share,
        canShareFiles: false,
        canShareText: false,
        userAgent: navigator.userAgent,
        isMobile: isMobileDevice()
    };
    
    if (capabilities.hasWebShare && navigator.canShare) {
        // Test file sharing
        try {
            const testFile = new File(['test'], 'test.png', { type: 'image/png' });
            capabilities.canShareFiles = navigator.canShare({ files: [testFile] });
        } catch (e) {
            capabilities.canShareFiles = false;
        }
        
        // Test text sharing
        try {
            capabilities.canShareText = navigator.canShare({ 
                title: 'Test', 
                text: 'Test content' 
            });
        } catch (e) {
            capabilities.canShareText = false;
        }
    }
    
    return capabilities;
}

// Helper function to show save instructions
function showSaveInstructions() {
    const capabilities = getShareCapabilities();
    
    if (isMobileDevice()) {
        let message = `图片已保存到下载文件夹！📱\n\n`;
        
        if (!capabilities.hasWebShare) {
            message += `您的浏览器不支持直接分享功能。\n\n`;
        } else if (!capabilities.canShareFiles && !capabilities.canShareText) {
            message += `分享功能受限，使用传统下载方式。\n\n`;
        }
        
        message += `移动端用户操作步骤：
1️⃣ 打开"文件管理器"或"下载"应用
2️⃣ 找到刚才下载的图片文件
3️⃣ 长按图片，选择"保存到相册"
4️⃣ 或点击"分享"按钮，选择"保存到照片"

💡 提示：部分手机可能需要在"设置"中允许浏览器访问存储权限。`;
        
        alert(message);
    } else {
        alert(`图片已保存到下载文件夹！💻

电脑用户：
您可以在浏览器的下载文件夹中找到保存的图片文件。
通常位置：下载 > ${document.querySelector('#birthday-input').value ? `儿童命理报告_${document.querySelector('#birthday-input').value.replace(/-/g, '')}.png` : '儿童命理报告.png'}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday-input');
    const generateBtn = document.getElementById('generate-btn');
    const generateAgainBtn = document.getElementById('generate-again-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const reportContainer = document.getElementById('report-container');
    const inputSection = document.querySelector('.input-section');

    let progressInterval = null;
    function startProgressBar() {
        const progressBar = document.getElementById('loader-progress-inner');
        let width = 0;
        progressBar.style.width = '0%';
        progressInterval = setInterval(() => {
            if (width < 90) {
                width += Math.random() * 2 + 0.5; // Simulate slow progress
                progressBar.style.width = width + '%';
            }
        }, 400);
    }
    function finishProgressBar() {
        const progressBar = document.getElementById('loader-progress-inner');
        if (progressInterval) clearInterval(progressInterval);
        progressBar.style.width = '100%';
        setTimeout(() => { progressBar.style.width = '0%'; }, 500);
    }

    // Set default date to a reasonable example
    birthdayInput.value = '2018-05-15';
    
    // Update button text based on device type and capabilities
    const initialCapabilities = getShareCapabilities();
    console.log('Initial share capabilities:', initialCapabilities);
    
    if (isMobileDevice()) {
        if (initialCapabilities.canShareFiles || initialCapabilities.canShareText) {
            saveImageBtn.textContent = '分享/保存图片';
        } else {
            saveImageBtn.textContent = '保存图片';
        }
    } else {
        saveImageBtn.textContent = '保存为图片';
    }
    
    // Set date range: from 90 years ago to today
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 90);
    const minDateStr = minDate.toISOString().split('T')[0]; // 90 years ago in YYYY-MM-DD format
    
    birthdayInput.setAttribute('min', minDateStr);
    birthdayInput.setAttribute('max', maxDate);

    generateBtn.addEventListener('click', async () => {
        const birthday = birthdayInput.value;
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        const gender = genderRadio ? genderRadio.value : null;
        
        if (!birthday) {
            showError('请输入一个有效的出生日期。');
            return;
        }
        
        if (!gender) {
            showError('请选择性别。');
            return;
        }

        // --- UI Reset and Loading ---
        reportContainer.innerHTML = '';
        errorMessage.style.display = 'none';
        loader.style.display = 'block';
        startProgressBar();
        generateBtn.disabled = true;

        try {
            // Use relative URL for API calls - works both locally and on Vercel
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ birthday, gender }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || '生成报告失败，请稍后再试。');
            }

            // --- Render Report ---
            renderReport(data);

            // Hide initial form and show appropriate save buttons
            inputSection.style.display = 'none';
            generateAgainBtn.style.display = 'block';
            savePdfBtn.style.display = 'block';
            saveImageBtn.style.display = 'block';

            // Update button text based on device
            if (isIPad()) {
                saveImageBtn.textContent = getShareCapabilities().canShareFiles ? '分享/保存图片' : '保存图片';
                savePdfBtn.textContent = '打印为PDF';
            } else if (isMobileDevice()) {
                saveImageBtn.textContent = getShareCapabilities().canShareFiles ? '分享/保存图片' : '保存图片';
                savePdfBtn.textContent = '分享/保存PDF';
            } else {
                saveImageBtn.textContent = '保存为图片';
                savePdfBtn.textContent = '保存为PDF';
            }


        } catch (error) {
            showError(error.message);
        } finally {
            // --- UI Cleanup ---
            loader.style.display = 'none';
            finishProgressBar();
            generateBtn.disabled = false;
        }
    });

    generateAgainBtn.addEventListener('click', () => {
        // Clear the report
        reportContainer.innerHTML = '';

        // Hide the save buttons
        generateAgainBtn.style.display = 'none';
        savePdfBtn.style.display = 'none';
        saveImageBtn.style.display = 'none';
        
        // Reset form inputs
        birthdayInput.value = '2018-05-15';
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        genderRadios.forEach(radio => radio.checked = false);
        
        // Show the input section again
        inputSection.style.display = 'flex';

        // Scroll to the top of the page smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    saveImageBtn.addEventListener('click', async () => {
        // Show loading state
        saveImageBtn.disabled = true;
        if (isMobileDevice()) {
            saveImageBtn.textContent = '正在准备分享...';
        } else {
            saveImageBtn.textContent = '正在生成图片...';
        }

        // Get the birth date for filename
        const birthDate = birthdayInput.value;
        const filename = `儿童命理报告_${birthDate.replace(/-/g, '')}.png`;
        
        // Check if content exists
        if (reportContainer.innerHTML.length < 100) {
            alert('报告内容为空，请先生成报告');
            saveImageBtn.disabled = false;
            saveImageBtn.textContent = '保存为图片';
            return;
        }

        try {
            // Create a simpler approach - capture the existing report container directly
            const options = {
                backgroundColor: '#ffffff',
                scale: 1.5, // Reduced scale for better compatibility
                useCORS: true,
                allowTaint: false,
                foreignObjectRendering: false,
                removeContainer: true,
                logging: false,
                width: reportContainer.offsetWidth || 800,
                height: reportContainer.scrollHeight,
                scrollX: 0,
                scrollY: 0
            };

            // First, ensure all charts are fully rendered
            const charts = reportContainer.querySelectorAll('canvas');
            if (charts.length > 0) {
                // Wait a bit longer for charts to be ready
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Generate the canvas
            const canvas = await html2canvas(reportContainer, options);
            
            // Verify canvas has content
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Generated canvas is empty');
            }

            // Convert to blob first to ensure proper format
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            // Check Web Share API capabilities
            const shareCapabilities = getShareCapabilities();
            let shareAttempted = false;
            
            console.log('Share capabilities:', shareCapabilities);
            
            if (shareCapabilities.hasWebShare) {
                console.log('Web Share API available, attempting to share...');
                
                try {
                    const file = new File([blob], filename, { type: 'image/png' });
                    const shareData = {
                        files: [file],
                        title: '儿童命理报告',
                        text: '我的孩子的数字命理与发展指南报告'
                    };

                    // Check if sharing files is supported
                    if (shareCapabilities.canShareFiles) {
                        console.log('File sharing supported, opening share dialog...');
                        shareAttempted = true;
                        await navigator.share(shareData);
                        alert('图片分享成功！您可以选择保存到相册或分享给他人。📱✨');
                        return; // Success, exit early
                    } else {
                        console.log('File sharing not supported, trying text/URL sharing...');
                        
                        // Try sharing without files as fallback
                        const textShareData = {
                            title: '儿童命理报告',
                            text: '我刚刚生成了我孩子的数字命理与发展指南报告！查看详细内容请下载图片。'
                        };
                        
                        if (shareCapabilities.canShareText) {
                            console.log('Text sharing supported, opening share dialog...');
                            shareAttempted = true;
                            await navigator.share(textShareData);
                            alert('分享成功！图片将同时下载到您的设备，请查看下载文件夹。📱');
                            // Continue to download as backup
                        } else {
                            console.log('Neither file nor text sharing supported');
                        }
                    }
                } catch (shareError) {
                    console.log('Web Share API failed:', shareError);
                    
                    // Check if user cancelled the share dialog
                    if (shareError.name === 'AbortError') {
                        console.log('User cancelled share dialog');
                        alert('分享已取消。图片将下载到您的设备。📱');
                        // Continue to download
                    } else {
                        console.log('Share API error, falling back to download');
                        // Fall through to traditional download
                    }
                }
            } else {
                console.log('Web Share API not available');
            }

            // Fallback: Traditional download method
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Only show detailed instructions if share was not attempted or successful
            if (!shareAttempted) {
                showSaveInstructions();
            }
            
        } catch (error) {
            console.error('Image generation failed:', error);
            
            // Fallback: try a simpler text-only approach
            try {
                await generateSimpleTextImage(birthDate, filename);
                if (isMobileDevice()) {
                    alert('已生成简化版本的图片报告。📱\n请在下载文件夹中查找，然后保存到相册。');
                } else {
                    alert('已生成简化版本的图片报告。💻\n已保存到下载文件夹。');
                }
            } catch (fallbackError) {
                console.error('Fallback image generation also failed:', fallbackError);
                if (isMobileDevice()) {
                    alert('图片生成失败。📱\n\n替代方案：\n1️⃣ 使用手机截屏功能保存报告\n2️⃣ 长按报告内容选择"保存图片"（如果支持）');
                } else {
                    alert('图片生成失败。💻\n\n替代方案：\n1️⃣ 使用浏览器的打印功能保存为PDF\n2️⃣ 使用截图工具保存报告内容');
                }
            }
        } finally {
            // Reset button state
            saveImageBtn.disabled = false;
            if (isMobileDevice()) {
                saveImageBtn.textContent = '分享/保存图片';
            } else {
                saveImageBtn.textContent = '保存为图片';
            }
        }
    });

    // PDF Download functionality
    savePdfBtn.addEventListener('click', async () => {
        // Show loading state
        savePdfBtn.disabled = true;
        if (isIPad()) {
            savePdfBtn.textContent = '正在准备打印...';
        } else if (isMobileDevice()) {
            savePdfBtn.textContent = '正在准备分享...';
        } else {
            savePdfBtn.textContent = '正在生成PDF...';
        }

        // Get the birth date for filename
        const birthDate = birthdayInput.value;
        const filename = `儿童命理报告_${birthDate.replace(/-/g, '')}.pdf`;
        
        // Check if content exists
        if (reportContainer.innerHTML.length < 100) {
            alert('报告内容为空，请先生成报告');
            savePdfBtn.disabled = false;
            savePdfBtn.textContent = '保存为PDF';
            return;
        }

        try {
            // For mobile devices, try a different approach
            if (isMobileDevice()) {
                console.log('Mobile device detected, using mobile-friendly PDF approach');
                
                // Check Web Share API capabilities for PDF
                const shareCapabilities = getShareCapabilities();
                
                if (shareCapabilities.hasWebShare && shareCapabilities.canShareFiles) {
                    try {
                        // For iPhone, try to generate a static HTML with embedded chart image
                        if (/iPhone/.test(navigator.userAgent)) {
                            console.log('iPhone detected, generating static PDF content...');
                            const staticPdfContent = await generateStaticMobilePDFContent();
                            const pdfBlob = new Blob([staticPdfContent], { type: 'text/html' });
                            const htmlFile = new File([pdfBlob], filename.replace('.pdf', '.html'), { type: 'text/html' });
                            
                            const shareData = {
                                files: [htmlFile],
                                title: '儿童命理报告 - PDF版本',
                                text: '我的孩子的数字命理与发展指南报告（iPhone优化版）'
                            };

                            await navigator.share(shareData);
                            alert('报告分享成功！📱✨\n\n📄 iPhone用户操作：\n1️⃣ 打开分享的文件\n2️⃣ 点击分享按钮\n3️⃣ 选择"打印"\n4️⃣ 选择"保存为PDF"\n\n💡 此版本已针对iPhone优化，图表将正常显示');
                            return;
                        } else {
                            // For Android and other devices, use static content for better compatibility
                            console.log('Android/Other device detected, using static PDF content...');
                            const staticPdfContent = await generateStaticMobilePDFContent();
                            const pdfBlob = new Blob([staticPdfContent], { type: 'text/html' });
                            const htmlFile = new File([pdfBlob], filename.replace('.pdf', '.html'), { type: 'text/html' });
                            
                            const shareData = {
                                files: [htmlFile],
                                title: '儿童命理报告 - PDF版本',
                                text: '我的孩子的数字命理与发展指南报告（Android优化版）'
                            };

                            await navigator.share(shareData);
                            alert('报告分享成功！📱✨\n\n📄 Android用户操作：\n1️⃣ 打开分享的文件\n2️⃣ 点击分享按钮\n3️⃣ 选择"打印"\n4️⃣ 选择"保存为PDF"\n\n💡 此版本已针对Android优化，图表将正常显示');
                            return;
                        }
                        
                    } catch (shareError) {
                        console.log('Mobile share failed, falling back to traditional method:', shareError);
                    }
                }
                
                // Mobile fallback: Use a simplified print approach
                try {
                    if (/iPhone/.test(navigator.userAgent) || /Android/.test(navigator.userAgent)) {
                        await generateStaticMobilePDF();
                    } else {
                        await generateMobilePDF();
                    }
                    return;
                } catch (mobileError) {
                    console.log('Mobile PDF generation failed, trying desktop method:', mobileError);
                    // Fall through to desktop method
                }
            }
            
            // Desktop method or mobile fallback
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                if (isMobileDevice()) {
                    throw new Error('无法打开打印窗口。请尝试使用"保存为图片"功能作为替代。');
                } else {
                    throw new Error('弹窗被阻止，请允许弹窗后重试');
                }
            }

            // Wait for charts to be fully rendered
            const charts = reportContainer.querySelectorAll('canvas');
            if (charts.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

                    // Get chart data before generating PDF content
        let chartDataForPDF = null;
        
        // First try to get from canvas dataset
        const polygonCanvas = document.getElementById('polygonChartCanvas');
        if (polygonCanvas && polygonCanvas.dataset.chartData) {
            try {
                chartDataForPDF = JSON.parse(polygonCanvas.dataset.chartData);
                console.log('Chart data found from canvas for desktop PDF:', chartDataForPDF);
            } catch (e) {
                console.error('Failed to parse chart data from canvas for desktop PDF:', e);
            }
        }
        
        // Fallback to global stored data
        if (!chartDataForPDF && window.polygonChartDataForPDF) {
            console.log('Using global chart data for desktop PDF:', window.polygonChartDataForPDF);
            // Create chart config from raw data
            chartDataForPDF = createChartConfigFromRawData(window.polygonChartDataForPDF);
        }
        
        if (!chartDataForPDF) {
            console.warn('No chart data found for desktop PDF');
        }

            // Get the report content
            const reportContent = reportContainer.innerHTML;
            
            // Create print-optimized HTML
            const printHTML = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <title>儿童命理报告</title>
                    <style>
                        @page {
                            margin: 15mm;
                            size: A4;
                        }
                        body {
                            font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background: white;
                            margin: 0;
                            padding: 0;
                        }
                        .report-container {
                            max-width: none;
                            padding: 0;
                            margin: 0;
                        }
                        h1, h2, h3 {
                            color: #4A90E2;
                            page-break-after: avoid;
                        }
                        .core-data-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 10px;
                            margin: 20px 0;
                        }
                        .data-card {
                            border: 2px solid #e8eaf6;
                            border-radius: 10px;
                            padding: 15px;
                            text-align: center;
                            background: white;
                        }
                        .data-card .label {
                            font-size: 0.9em;
                            color: #666;
                            margin-bottom: 5px;
                        }
                        .data-card .value {
                            font-size: 1.5em;
                            font-weight: bold;
                            color: #4A90E2;
                        }
                        .chart-container {
                            text-align: center;
                            margin: 20px 0;
                            page-break-inside: avoid;
                        }
                        .chart-container canvas {
                            max-width: 400px;
                            max-height: 400px;
                        }
                        .content-breakdown {
                            margin: 20px 0;
                            page-break-inside: avoid;
                        }
                        .breakdown-title {
                            font-size: 1.3em;
                            font-weight: bold;
                            color: #4A90E2;
                            margin: 15px 0 10px 0;
                        }
                        .breakdown-subtitle {
                            font-size: 1.1em;
                            font-weight: bold;
                            color: #667eea;
                            margin: 10px 0 5px 0;
                        }
                        .comm-instead { color: #e74c3c; }
                        .comm-try { color: #27ae60; }
                        .comm-why { color: #8e44ad; }
                        ul, ol {
                            padding-left: 20px;
                        }
                        li {
                            margin-bottom: 5px;
                        }
                        .report-section {
                            margin: 25px 0;
                            page-break-inside: avoid;
                        }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        ${reportContent}
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
                    <script>
                        // Chart data embedded directly in desktop PDF
                        const embeddedChartData = ${chartDataForPDF ? JSON.stringify(chartDataForPDF) : 'null'};
                        
                        // Re-render charts in the print window
                        document.addEventListener('DOMContentLoaded', function() {
                            console.log('Desktop PDF DOMContentLoaded, embedded chart data:', embeddedChartData);
                            
                            // Wait for Chart.js to load
                            setTimeout(function() {
                                const printCharts = document.querySelectorAll('canvas');
                                console.log('Found canvases in desktop PDF:', printCharts.length);
                                
                                if (embeddedChartData && printCharts.length > 0) {
                                    printCharts.forEach((canvas, index) => {
                                        if (canvas.id === 'polygonChartCanvas' || index === 0) {
                                            try {
                                                console.log('Attempting to render chart in desktop PDF...');
                                                if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                                                    Chart.register(ChartDataLabels);
                                                    new Chart(canvas, embeddedChartData);
                                                    console.log('Chart rendered successfully in desktop PDF');
                                                } else {
                                                    console.error('Chart.js or ChartDataLabels not loaded in desktop PDF');
                                                    throw new Error('Chart.js libraries not available');
                                                }
                                            } catch (e) {
                                                console.error('Desktop chart rendering failed:', e);
                                                // Fallback: show chart data as text
                                                const ctx = canvas.getContext('2d');
                                                ctx.fillStyle = '#4A90E2';
                                                ctx.font = '16px Arial';
                                                ctx.textAlign = 'center';
                                                ctx.fillText('雷达图数据', canvas.width / 2, canvas.height / 2 - 10);
                                                ctx.fillText('(图表渲染失败)', canvas.width / 2, canvas.height / 2 + 10);
                                            }
                                        }
                                    });
                                } else {
                                    console.warn('No embedded chart data or canvases found in desktop PDF');
                                    // Try fallback method - get from parent window
                                    if (window.opener) {
                                        try {
                                            const parentCharts = window.opener.document.querySelectorAll('canvas[id="polygonChartCanvas"]');
                                            if (parentCharts.length > 0 && printCharts.length > 0) {
                                                const parentChart = parentCharts[0];
                                                if (parentChart.dataset.chartData) {
                                                    const chartData = JSON.parse(parentChart.dataset.chartData);
                                                    if (typeof Chart !== 'undefined') {
                                                        Chart.register(ChartDataLabels);
                                                        new Chart(printCharts[0], chartData);
                                                        console.log('Chart rendered from parent window data in desktop PDF');
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.error('Fallback chart rendering failed in desktop PDF:', e);
                                        }
                                    }
                                }
                                
                                // Auto-trigger print dialog after a short delay
                                setTimeout(function() {
                                    window.print();
                                    // Close the window after printing (optional)
                                    setTimeout(function() {
                                        window.close();
                                    }, 1000);
                                }, 1500); // Increased delay to ensure charts render
                            }, 1000);
                        });
                    </script>
                </body>
                </html>
            `;

            // Write content to the new window
            printWindow.document.write(printHTML);
            printWindow.document.close();

            // Success message
            if (isMobileDevice()) {
                alert('PDF打印窗口已打开！📱\n\n📄 操作步骤：\n1️⃣ 在打印对话框中选择"保存为PDF"\n2️⃣ 选择保存位置\n3️⃣ 点击保存\n\n💡 如果无法保存PDF，建议使用"保存为图片"功能');
            } else {
                alert('PDF打印窗口已打开！\n\n📄 操作步骤：\n1️⃣ 在打印对话框中选择"保存为PDF"\n2️⃣ 选择保存位置\n3️⃣ 点击保存\n\n💡 如果没有自动弹出打印对话框，请手动按 Ctrl+P (Windows) 或 Cmd+P (Mac)');
            }

        } catch (error) {
            console.error('PDF generation failed:', error);
            if (isIPad()) {
                alert(`iPad PDF生成失败：${error.message}\n\n🔧 iPad替代方案：\n1️⃣ 使用"保存为图片"功能\n3️2️⃣ 在电脑端打开网站生成PDF\n4️⃣ 尝试在Safari中手动打印当前页面`);
            } else if (/Android/.test(navigator.userAgent)) {
                alert(`Android PDF生成失败：${error.message}\n\n🔧 Android替代方案：\n1️⃣ 使用"保存/复制图片"功能\n3️2️⃣ 在电脑端打开网站生成PDF\n4️⃣ 尝试在浏览器中手动打印当前页面`);
            } else if (/iPhone/.test(navigator.userAgent)) {
                alert(`iPhone PDF生成失败：${error.message}\n\n🔧 iPhone替代方案：\n1️⃣ 使用"保存为图片"功能\n2️⃣ 使用手机截屏保存报告\n3️⃣ 在电脑端打开网站生成PDF\n4️⃣ 尝试在Safari中手动打印当前页面`);
            } else if (isMobileDevice()) {
                alert(`移动端PDF生成失败：${error.message}\n\n🔧 移动端替代方案：\n1️⃣ 使用"保存为图片"功能\n2️⃣ 使用手机截屏保存报告\n3️⃣ 在电脑端打开网站生成PDF`);
            } else {
                alert(`PDF生成失败：${error.message}\n\n🔧 替代方案：\n1️⃣ 使用浏览器菜单：文件 → 打印 → 保存为PDF\n2️⃣ 按快捷键：Ctrl+P (Windows) 或 Cmd+P (Mac)\n3️⃣ 使用"保存为图片"功能作为备选`);
            }
        } finally {
            // Reset button state
            savePdfBtn.disabled = false;
            if (isIPad()) {
                savePdfBtn.textContent = '打印为PDF';
            } else if (isMobileDevice()) {
                savePdfBtn.textContent = '分享/保存PDF';
            } else {
                savePdfBtn.textContent = '保存为PDF';
            }
        }
    });

    // Mobile-optimized static PDF generation
    async function generateStaticMobilePDFContent() {
        console.log('Generating static PDF content for mobile devices...');
        
        // Wait for charts to be fully rendered
        const charts = reportContainer.querySelectorAll('canvas');
        if (charts.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Get chart as image data
        let chartImageData = null;
        const polygonCanvas = document.getElementById('polygonChartCanvas');
        if (polygonCanvas) {
            try {
                // Convert canvas to base64 image
                chartImageData = polygonCanvas.toDataURL('image/png', 1.0);
                console.log('Chart image data generated for mobile PDF');
            } catch (e) {
                console.error('Failed to generate chart image for mobile PDF:', e);
            }
        }

        // Get the report content and replace canvas with image
        let reportContent = reportContainer.innerHTML;
        
        if (chartImageData) {
            // Replace canvas with img tag
            reportContent = reportContent.replace(
                /<canvas[^>]*id="polygonChartCanvas"[^>]*><\/canvas>/g,
                `<img src="${chartImageData}" alt="性格蓝图雷达图" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`
            );
        }

        // Create mobile-optimized HTML for PDF
        const mobileHTML = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>儿童命理报告 - 移动端版</title>
                <style>
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                        background: white;
                        margin: 0;
                        padding: 10px;
                        font-size: 14px;
                        -webkit-text-size-adjust: 100%;
                    }
                    .report-container {
                        max-width: none;
                        padding: 0;
                        margin: 0;
                    }
                    h1 { font-size: 1.8em; color: #4A90E2; text-align: center; }
                    h2 { font-size: 1.4em; color: #4A90E2; margin: 20px 0 10px 0; }
                    h3 { font-size: 1.2em; color: #667eea; }
                    .core-data-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                        margin: 15px 0;
                    }
                    .data-card {
                        border: 1px solid #e8eaf6;
                        border-radius: 8px;
                        padding: 10px;
                        text-align: center;
                        background: #f8f9ff;
                    }
                    .data-card .label {
                        font-size: 0.8em;
                        color: #666;
                        margin-bottom: 3px;
                    }
                    .data-card .value {
                        font-size: 1.3em;
                        font-weight: bold;
                        color: #4A90E2;
                    }
                    .chart-container {
                        text-align: center;
                        margin: 15px 0;
                        page-break-inside: avoid;
                    }
                    .chart-container img {
                        max-width: 100%;
                        height: auto;
                        border: 1px solid #e8eaf6;
                        border-radius: 8px;
                        padding: 10px;
                        background: white;
                    }
                    .content-breakdown {
                        margin: 15px 0;
                        page-break-inside: avoid;
                    }
                    .breakdown-title {
                        font-size: 1.1em;
                        font-weight: bold;
                        color: #4A90E2;
                        margin: 12px 0 8px 0;
                    }
                    .breakdown-subtitle {
                        font-size: 1em;
                        font-weight: bold;
                        color: #667eea;
                        margin: 8px 0 5px 0;
                    }
                    .comm-instead { color: #e74c3c; font-weight: bold; }
                    .comm-try { color: #27ae60; font-weight: bold; }
                    .comm-why { color: #8e44ad; font-weight: bold; }
                    ul, ol { padding-left: 15px; }
                    li { margin-bottom: 3px; font-size: 0.9em; }
                    .report-section { 
                        margin: 20px 0; 
                        page-break-inside: avoid;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 15px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                        h1, h2, h3 { page-break-after: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    ${reportContent}
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.8em;">
                    <p>📱 移动端优化版本 | 数字命理与发展指南</p>
                </div>
            </body>
            </html>
        `;
        
        return mobileHTML;
    }

    // Mobile PDF generation helper functions
    async function generateMobilePDFContent() {
        // Wait for charts to be fully rendered
        const charts = reportContainer.querySelectorAll('canvas');
        if (charts.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Get chart data before generating PDF content
        let chartDataForPDF = null;
        
        // First try to get from canvas dataset
        const polygonCanvas = document.getElementById('polygonChartCanvas');
        if (polygonCanvas && polygonCanvas.dataset.chartData) {
            try {
                chartDataForPDF = JSON.parse(polygonCanvas.dataset.chartData);
                console.log('Chart data found from canvas for mobile PDF:', chartDataForPDF);
            } catch (e) {
                console.error('Failed to parse chart data from canvas for mobile PDF:', e);
            }
        }
        
        // Fallback to global stored data
        if (!chartDataForPDF && window.polygonChartDataForPDF) {
            console.log('Using global chart data for mobile PDF:', window.polygonChartDataForPDF);
            // Create chart config from raw data
            chartDataForPDF = createChartConfigFromRawData(window.polygonChartDataForPDF);
        }
        
        if (!chartDataForPDF) {
            console.warn('No chart data found for mobile PDF');
        }

        // Get the report content
        const reportContent = reportContainer.innerHTML;
        
        // Create mobile-optimized HTML for PDF
        const mobileHTML = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>儿童命理报告</title>
                <style>
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                    body {
                        font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                        background: white;
                        margin: 0;
                        padding: 10px;
                        font-size: 14px;
                    }
                    .report-container {
                        max-width: none;
                        padding: 0;
                        margin: 0;
                    }
                    h1 { font-size: 1.8em; color: #4A90E2; text-align: center; }
                    h2 { font-size: 1.4em; color: #4A90E2; margin: 20px 0 10px 0; }
                    h3 { font-size: 1.2em; color: #667eea; }
                    .core-data-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                        margin: 15px 0;
                    }
                    .data-card {
                        border: 1px solid #e8eaf6;
                        border-radius: 8px;
                        padding: 10px;
                        text-align: center;
                        background: #f8f9ff;
                    }
                    .data-card .label {
                        font-size: 0.8em;
                        color: #666;
                        margin-bottom: 3px;
                    }
                    .data-card .value {
                        font-size: 1.3em;
                        font-weight: bold;
                        color: #4A90E2;
                    }
                    .chart-container {
                        text-align: center;
                        margin: 15px 0;
                        page-break-inside: avoid;
                    }
                    .chart-container canvas {
                        max-width: 100%;
                        height: auto;
                    }
                    .content-breakdown {
                        margin: 15px 0;
                        page-break-inside: avoid;
                    }
                    .breakdown-title {
                        font-size: 1.1em;
                        font-weight: bold;
                        color: #4A90E2;
                        margin: 12px 0 8px 0;
                    }
                    .breakdown-subtitle {
                        font-size: 1em;
                        font-weight: bold;
                        color: #667eea;
                        margin: 8px 0 5px 0;
                    }
                    .comm-instead { color: #e74c3c; font-weight: bold; }
                    .comm-try { color: #27ae60; font-weight: bold; }
                    .comm-why { color: #8e44ad; font-weight: bold; }
                    ul, ol { padding-left: 15px; }
                    li { margin-bottom: 3px; font-size: 0.9em; }
                    .report-section { 
                        margin: 20px 0; 
                        page-break-inside: avoid;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 15px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                        h1, h2, h3 { page-break-after: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    ${reportContent}
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.8em;">
                    <p>📱 移动端生成 | 数字命理与发展指南</p>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
                <script>
                    // Chart data embedded directly in mobile PDF
                    const embeddedChartData = ${chartDataForPDF ? JSON.stringify(chartDataForPDF) : 'null'};
                    
                    // Re-render charts in the mobile PDF window
                    document.addEventListener('DOMContentLoaded', function() {
                        console.log('Mobile PDF DOMContentLoaded, embedded chart data:', embeddedChartData);
                        
                        setTimeout(function() {
                            const printCharts = document.querySelectorAll('canvas');
                            console.log('Found canvases in mobile PDF:', printCharts.length);
                            
                            if (embeddedChartData && printCharts.length > 0) {
                                printCharts.forEach((canvas, index) => {
                                    if (canvas.id === 'polygonChartCanvas' || index === 0) {
                                        try {
                                            console.log('Attempting to render chart in mobile PDF...');
                                            if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
                                                Chart.register(ChartDataLabels);
                                                new Chart(canvas, embeddedChartData);
                                                console.log('Chart rendered successfully in mobile PDF');
                                            } else {
                                                console.error('Chart.js or ChartDataLabels not loaded');
                                                throw new Error('Chart.js libraries not available');
                                            }
                                        } catch (e) {
                                            console.error('Mobile chart rendering failed:', e);
                                            // Fallback: draw chart data as text
                                            const ctx = canvas.getContext('2d');
                                            ctx.fillStyle = '#4A90E2';
                                            ctx.font = '14px Arial';
                                            ctx.textAlign = 'center';
                                            ctx.fillText('雷达图数据', canvas.width / 2, canvas.height / 2 - 8);
                                            ctx.fillText('(图表渲染失败)', canvas.width / 2, canvas.height / 2 + 8);
                                        }
                                    }
                                });
                            } else {
                                console.warn('No embedded chart data or canvases found');
                                // Try fallback method - get from parent window
                                if (window.opener) {
                                    try {
                                        const parentCharts = window.opener.document.querySelectorAll('canvas[id="polygonChartCanvas"]');
                                        if (parentCharts.length > 0 && printCharts.length > 0) {
                                            const parentChart = parentCharts[0];
                                            if (parentChart.dataset.chartData) {
                                                const chartData = JSON.parse(parentChart.dataset.chartData);
                                                if (typeof Chart !== 'undefined') {
                                                    Chart.register(ChartDataLabels);
                                                    new Chart(printCharts[0], chartData);
                                                    console.log('Chart rendered from parent window data');
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Fallback chart rendering failed:', e);
                                    }
                                }
                            }
                        }, 1500); // Increased delay for mobile
                    });
                </script>
            </body>
            </html>
        `;
        
        return mobileHTML;
    }

    async function generateMobilePDF() {
        console.log('Generating mobile PDF using simplified print method...');
        
        // Create a simplified print window for mobile
        const printContent = await generateMobilePDFContent();
        
        // Check if it's iPad (iPad has larger screen and different behavior)
        const isIPadDevice = isIPad();
        
        if (isIPadDevice) {
            console.log('iPad detected, using iPad-specific approach');
            
            // For iPad, try multiple approaches
            console.log('Trying iPad-specific PDF generation...');
            
            // Method 1: Try blob URL first (most reliable for iPad)
            const blob = new Blob([printContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            let printWindow = window.open(blobUrl, '_blank');
            
            if (printWindow) {
                console.log('iPad: Blob URL approach successful');
                
                // For iPad, don't auto-trigger print immediately
                setTimeout(() => {
                    try {
                        // Try to trigger print after a longer delay for iPad
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on iPad:', e);
                    }
                }, 3000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 iPad保存为PDF步骤：\n1️⃣ 在新窗口中点击分享按钮（□）\n2️⃣ 选择"打印"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置\n\n💡 如果没有自动弹出打印对话框，请手动点击分享按钮');
                
                // Clean up blob URL after a delay
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 10000);
            } else {
                console.log('iPad: Blob URL failed, trying data URL');
                
                // Method 2: Try data URL as fallback
                const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
                printWindow = window.open(dataUrl, '_blank');
                
                if (printWindow) {
                    console.log('iPad: Data URL approach successful');
                    alert('报告已在新窗口中打开！📱\n\n📄 iPad保存为PDF步骤：\n1️⃣ 在新窗口中点击分享按钮（□）\n2️⃣ 选择"打印"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置');
                } else {
                    console.log('iPad: Both methods failed, throwing error');
                    throw new Error('iPad无法打开新窗口，请尝试使用"保存为图片"功能');
                }
            }
        } else {
            // For iPhone and other mobile devices, use data URL approach
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
            
            // Open in new window/tab
            const printWindow = window.open(dataUrl, '_blank');
            
            if (printWindow) {
                // Give it time to load, then try to trigger print
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on mobile:', e);
                    }
                }, 2000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 保存为PDF步骤：\n1️⃣ 在新窗口中点击菜单（⋮）\n2️⃣ 选择"打印"或"分享"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置');
            } else {
                throw new Error('无法打开新窗口，请允许弹窗或尝试其他方法');
            }
        }
    }

    async function generateStaticMobilePDF() {
        console.log('Generating static mobile PDF using optimized method...');
        
        // Create static print content
        const printContent = await generateStaticMobilePDFContent();
        
        // Check device type
        const isIPadDevice = isIPad();
        const isAndroid = /Android/.test(navigator.userAgent);
        const isiPhone = /iPhone/.test(navigator.userAgent);
        
        if (isIPadDevice) {
            console.log('iPad detected, using blob URL approach');
            
            // For iPad, try blob URL approach
            const blob = new Blob([printContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            let printWindow = window.open(blobUrl, '_blank');
            
            if (printWindow) {
                console.log('iPad: Static content blob URL approach successful');
                
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on iPad:', e);
                    }
                }, 2000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 iPad保存为PDF步骤：\n1️⃣ 在新窗口中点击分享按钮（□）\n2️⃣ 选择"打印"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置\n\n💡 此版本已针对iPad优化，图表将正常显示');
                
                // Clean up blob URL after a delay
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 10000);
            } else {
                throw new Error('iPad无法打开新窗口，请尝试使用"保存为图片"功能');
            }
        } else if (isAndroid) {
            console.log('Android detected, using data URL approach');
            
            // For Android, use data URL approach with static content
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
            
            const printWindow = window.open(dataUrl, '_blank');
            
            if (printWindow) {
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on Android:', e);
                    }
                }, 2000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 Android保存为PDF步骤：\n1️⃣ 在新窗口中点击菜单按钮\n2️⃣ 选择"打印"或"分享"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置\n\n💡 此版本已针对Android优化，图表将正常显示');
            } else {
                throw new Error('Android无法打开新窗口，请尝试使用"保存为图片"功能');
            }
        } else if (isiPhone) {
            console.log('iPhone detected, using data URL approach');
            
            // For iPhone, use data URL approach with static content
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
            
            const printWindow = window.open(dataUrl, '_blank');
            
            if (printWindow) {
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on iPhone:', e);
                    }
                }, 2000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 iPhone保存为PDF步骤：\n1️⃣ 在新窗口中点击分享按钮\n2️⃣ 选择"打印"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置\n\n💡 此版本已针对iPhone优化，图表将正常显示');
            } else {
                throw new Error('iPhone无法打开新窗口，请尝试使用"保存为图片"功能');
            }
        } else {
            // For other mobile devices
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);
            
            const printWindow = window.open(dataUrl, '_blank');
            
            if (printWindow) {
                setTimeout(() => {
                    try {
                        printWindow.print();
                    } catch (e) {
                        console.log('Auto-print failed on mobile:', e);
                    }
                }, 2000);
                
                alert('报告已在新窗口中打开！📱\n\n📄 保存为PDF步骤：\n1️⃣ 在新窗口中点击菜单按钮\n2️⃣ 选择"打印"或"分享"\n3️⃣ 选择"保存为PDF"\n4️⃣ 选择保存位置\n\n💡 此版本已针对移动端优化，图表将正常显示');
            } else {
                throw new Error('无法打开新窗口，请尝试使用"保存为图片"功能');
            }
        }
    }

    // Fallback function for simple text-based image
    async function generateSimpleTextImage(birthDate, filename) {
        // Create a simple canvas with text content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 1200;
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text styles
        ctx.fillStyle = '#333333';
        ctx.font = '24px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        // Add title
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.fillText('数字命理与发展指南', canvas.width / 2, 60);
        
        ctx.fillStyle = '#666666';
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText(`生日: ${birthDate}`, canvas.width / 2, 100);
        
        // Add a line
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 120);
        ctx.lineTo(700, 120);
        ctx.stroke();
        
        // Extract text content from report
        const textContent = reportContainer.innerText || reportContainer.textContent || '';
        const lines = textContent.split('\n').filter(line => line.trim().length > 0);
        
        // Add text content
        ctx.fillStyle = '#333333';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'left';
        
        let y = 160;
        const lineHeight = 20;
        const maxWidth = 700;
        const margin = 50;
        
        for (let i = 0; i < Math.min(lines.length, 50); i++) { // Limit to 50 lines
            const line = lines[i].trim();
            if (line.length > 0) {
                // Word wrap
                const words = line.split(' ');
                let currentLine = '';
                
                for (const word of words) {
                    const testLine = currentLine + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    
                    if (metrics.width > maxWidth && currentLine !== '') {
                        ctx.fillText(currentLine, margin, y);
                        currentLine = word + ' ';
                        y += lineHeight;
                    } else {
                        currentLine = testLine;
                    }
                    
                    if (y > canvas.height - 50) break; // Don't exceed canvas
                }
                
                if (currentLine.trim() !== '') {
                    ctx.fillText(currentLine, margin, y);
                    y += lineHeight;
                }
                
                if (y > canvas.height - 50) break;
            }
        }
        
        // Convert to blob and download
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function renderReport(data) {
        if (!data || !data.report) {
            showError("无法解析报告内容，收到的数据为空。");
            return;
        }
        
        const { report, calculations } = data;

        reportContainer.innerHTML = `
            ${renderCoreData(calculations)}
            ${renderInnerTeam(report.chapter1_innerTeam)}
            ${renderInnerWorld(report.chapter2_innerWorld)}
            ${renderParentsPlaybook(report.chapter3_parentsPlaybook)}
            ${renderIgnitingPassions(report.chapter4_ignitingPassions)}
            ${renderConclusion(report.conclusion)}
        `;
    }

    function createBreakdownBlock(title, description, subsections = []) {
        const subsectionsHtml = subsections.map(sub => `
            <h4 class="breakdown-subtitle">${sub.title}</h4>
            <p>${sub.content}</p>
        `).join('');

        return `
            <div class="content-breakdown">
                <h3 class="breakdown-title">${title}</h3>
                ${description ? `<p class="breakdown-description">${description}</p>` : ''}
                ${subsectionsHtml}
            </div>
        `;
    }

    function createSection(title, content) {
        return `
            <div class="report-section">
                <h2>${title}</h2>
                ${content}
            </div>
        `;
    }

    function renderCoreData(calcs) {
        if (!calcs) return '';

        return createSection('核心数据分析', `
            <div class="core-data-grid">
                <div class="data-card">
                    <div class="value">${calcs.lifePath.number}</div>
                    <div class="label">生命灵数</div>
                </div>
                <div class="data-card">
                    <div class="value">${calcs.birthday}</div>
                    <div class="label">生日数</div>
                </div>
                <div class="data-card">
                    <div class="value">${calcs.mainPersonality}</div>
                    <div class="label">主性格数</div>
                </div>
                <div class="data-card">
                    <div class="value">${calcs.challenges.main}</div>
                    <div class="label">主挑战数</div>
                </div>
                <div class="data-card">
                    <div class="value">${calcs.personalYear}</div>
                    <div class="label">个人流年</div>
                </div>
                 <div class="data-card">
                    <div class="value">${calcs.age}</div>
                    <div class="label">当前年龄</div>
                </div>
            </div>
        `);
    }

    function renderInnerTeam(chapter) {
        if (!chapter) return '';
        const { polygonChart, introduction, teamCaptain, supportingCast, coreDynamic, reflectionQuestions } = chapter;
        
        // Prepare canvas for the chart
        const chartHtml = `
            <h3>性格蓝图</h3>
            <div class="chart-container">
                <canvas id="polygonChartCanvas"></canvas>
            </div>
        `;

        // We will render the chart AFTER the main HTML is on the page
        setTimeout(() => {
            renderPolygonChart(polygonChart);
        }, 0);

        // Store chart data immediately for PDF generation
        if (polygonChart) {
            // Store raw chart data for later use
            window.polygonChartDataForPDF = polygonChart;
        }

        const teamCaptainHtml = createBreakdownBlock(
            teamCaptain.archetype, 
            teamCaptain.description, 
            [
                { title: '表现方式', content: teamCaptain.whatItLooksLike },
                { title: '深层原因', content: teamCaptain.theWhyBehindIt }
            ]
        );

        return createSection('第一章：内在团队 - 认识孩子的核心性格', `
            ${chartHtml}
            <p>${introduction}</p>
            
            <h3>团队核心</h3>
            ${teamCaptainHtml}

            <h3>关键支援角色</h3>
            <ul>
                ${supportingCast.map(member => `
                    <li>
                        <strong>${member.archetype}</strong> (${member.sourceNumber})<br>
                        ${member.description}
                    </li>
                `).join('')}
            </ul>

            <h3>核心动态</h3>
            <p>${coreDynamic}</p>
            
            <h3>💡 引导反思问题</h3>
            <ul>${reflectionQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        `);
    }

    function renderPolygonChart(chartData) {
        const ctx = document.getElementById('polygonChartCanvas');
        if (!ctx || !chartData) return;

        // Register the datalabels plugin
        Chart.register(ChartDataLabels);

        const labelMapping = new Map([
            ['LeadershipAndIndependence', '领导与独立'],
            ['EmpathyAndConnection', '共情与连结'],
            ['CreativityAndExpression', '创意与表达'],
            ['AnalyticalAndStrategicMind', '分析与策略'],
            ['DiligenceAndReliability', '勤奋与可靠'],
            ['AdventurousAndAdaptableSpirit', '冒险与适应']
        ]);

        const labels = Object.keys(chartData).map(key => labelMapping.get(key) || key);
        const data = Object.values(chartData);

        const isMobile = window.innerWidth <= 768;

        const chartConfig = {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '性格蓝图分数',
                    data: data,
                    backgroundColor: 'rgba(160, 132, 232, 0.2)', // Soft purple fill
                    borderColor: 'rgb(95, 153, 247)',      // Solid purple line
                    pointBackgroundColor: 'rgb(95, 153, 247)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(95, 153, 247)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 10,
                        pointLabels: {
                            font: {
                                size: isMobile ? 10 : 14,
                                weight: 'bold'
                            }
                        },
                         ticks: {
                            display: false, // Hide the scale numbers
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // Legend as it's self-explanatory
                    },
                    datalabels: {
                        color: '#ffffff',
                        backgroundColor: 'rgba(132, 175, 232, 0.8)', // Matching purple for labels
                        borderRadius: 4,
                        font: {
                            weight: 'bold'
                        },
                        padding: 4
                    }
                }
            }
        };

        // Create the chart
        new Chart(ctx, chartConfig);
        
        // Store chart data for PDF generation
        ctx.dataset.chartData = JSON.stringify(chartConfig);
    }

    function renderInnerWorld(chapter) {
        if (!chapter) return '';
        const { greatestStrength, coreChallenge, hiddenFear, reflectionQuestions } = chapter;
        return createSection('第二章：内心世界 - 天赋、挑战与内在驱动力', `
            <h3>🌟 核心优势</h3>
            ${createBreakdownBlock(greatestStrength.name, greatestStrength.description)}
            
            <h3>⛰️ 人生关键课题</h3>
            ${createBreakdownBlock(coreChallenge.name, coreChallenge.description)}

            <h3>🌊 隐藏的恐惧</h3>
            ${createBreakdownBlock(hiddenFear.name, hiddenFear.description)}

            <h3>💡 引导反思问题</h3>
            <ul>${reflectionQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        `);
    }

    function renderParentsPlaybook(chapter) {
        if (!chapter) return '';
        const { introduction, parentingMindset, learningEnvironmentAndStyle, guidanceCommunicationAndBoundaries, friendshipAndCurrentFocus, karmicLessonFocus, reflectionQuestions } = chapter;
        
        const renderCommKeys = (keys) => keys.map(key => `
            <li>
                <strong class="comm-instead">不要说:</strong> "${key.insteadOf}"<br>
                <strong class="comm-try">试试说:</strong> "${key.tryThis}"<br>
                <strong class="comm-why">为什么有效:</strong> ${key.whyItWorks}
            </li>
        `).join('');

        let html = `
            <p>${introduction}</p>

            <h3>🎯 家长角色定位</h3>
            ${createBreakdownBlock(parentingMindset.name, parentingMindset.description)}

            <h3>🛠️ 学习与成长环境</h3>
            <h4>${learningEnvironmentAndStyle.environmentKeys.name}</h4>
            <ul>${learningEnvironmentAndStyle.environmentKeys.points.map(p => `<li>${p}</li>`).join('')}</ul>
            <h4>🔑 沟通锦囊 (激发潜能)</h4>
            <ul>${renderCommKeys(learningEnvironmentAndStyle.communicationKeys_Potential)}</ul>
            
            <h3>引导、沟通与界限</h3>
            <p><strong>边界与责任的沟通：</strong>${guidanceCommunicationAndBoundaries.disciplineAndBoundaries}</p>
            <h4>沟通关键 (设定界限)</h4>
            <ul>${renderCommKeys(guidanceCommunicationAndBoundaries.communicationKeys_Boundaries)}</ul>

            ${karmicLessonFocus && karmicLessonFocus.title ? `
                <h3>${karmicLessonFocus.title}</h3>
                <p>${karmicLessonFocus.description}</p>
            ` : ''}

            <h3>💡 引导反思问题</h3>
            <ul>${reflectionQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        `;

        // Friendship and Current Focus
        if (chapter.friendshipAndCurrentFocus) {
            html += createBreakdownBlock(
                '🌱 社交与成长',
                '',
                [
                    { title: '当前成长焦点', content: chapter.friendshipAndCurrentFocus.socialAndFriendshipStyle },
                    { title: '未来一年导航', content: chapter.friendshipAndCurrentFocus.navigatingTheYearAhead }
                ]
            );
        }

        return createSection('第三章：家长行动手册', html);
    }

    function renderIgnitingPassions(chapter) {
        if (!chapter) return '';
        const { recommendedHobbies, recommendedCareers, reflectionQuestions } = chapter;
        return createSection('第四章：激发热情与潜力 - 兴趣与未来方向', `
            <h3>🎨 推荐爱好领域</h3>
            ${recommendedHobbies.map(tier => `
                <h4>${
                    (tier.tier.includes('：') || tier.tier.includes(':')) 
                      ? tier.tier + ' ' + tier.theme 
                      : tier.tier + ': ' + tier.theme
                }</h4>
                <div class="hobby-divider"></div>
                <ul>${tier.items.map(item => `<li>${item}</li>`).join('')}</ul>
            `).join('')}
            
            <h3>🌟 未来职业探索</h3>
            ${recommendedCareers.map(tier => `
                <h4>${tier.tier}</h4>
                <ul>${tier.items.map(item => `<li>${item}</li>`).join('')}</ul>
            `).join('')}

            <h3>💡 引导反思问题</h3>
            <ul>${reflectionQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        `);
    }

    function renderConclusion(conclusion) {
        if (!conclusion) return '';
        return createSection('✨ 报告结语', `<p>${conclusion}</p>`);
    }
});