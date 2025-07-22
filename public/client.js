document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday-input');
    const generateBtn = document.getElementById('generate-btn');
    const generateAgainBtn = document.getElementById('generate-again-btn');
    const saveReportBtn = document.getElementById('save-report-btn');
    const saveImageBtn = document.getElementById('save-image-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const reportContainer = document.getElementById('report-container');
    const inputSection = document.querySelector('.input-section');

    // Detect if user is on mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // Set default date to a reasonable example
    birthdayInput.value = '2018-05-15';

    generateBtn.addEventListener('click', async () => {
        const birthday = birthdayInput.value;
        if (!birthday) {
            showError('请输入一个有效的出生日期。');
            return;
        }

        // --- UI Reset and Loading ---
        reportContainer.innerHTML = '';
        errorMessage.style.display = 'none';
        loader.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Use relative URL for API calls - works both locally and on Vercel
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ birthday }),
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
            
            if (isMobileDevice) {
                // On mobile, show image save option
                saveImageBtn.style.display = 'block';
                saveReportBtn.style.display = 'none';
            } else {
                // On desktop, show both options
                saveReportBtn.style.display = 'block';
                saveImageBtn.style.display = 'block';
            }


        } catch (error) {
            showError(error.message);
        } finally {
            // --- UI Cleanup ---
            loader.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    generateAgainBtn.addEventListener('click', () => {
        // Clear the report
        reportContainer.innerHTML = '';

        // Hide the save buttons
        generateAgainBtn.style.display = 'none';
        saveReportBtn.style.display = 'none';
        saveImageBtn.style.display = 'none';

        // Show the initial form
        inputSection.style.display = 'flex';

        // Scroll to the top of the page smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    saveReportBtn.addEventListener('click', () => {
        // Show loading state
        saveReportBtn.disabled = true;
        saveReportBtn.textContent = '正在生成PDF...';

        // Get the birth date for filename
        const birthDate = birthdayInput.value;
        
        // Check if content exists
        if (reportContainer.innerHTML.length < 100) {
            alert('报告内容为空，请先生成报告');
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Create the print content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>儿童命理报告_${birthDate.replace(/-/g, '')}</title>
                <style>
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                    body {
                        font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    h1 {
                        color: #4A90E2;
                        text-align: center;
                        border-bottom: 2px solid #4A90E2;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    h2 {
                        color: #4A90E2;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                        margin-top: 30px;
                    }
                    h3 {
                        color: #666;
                        margin-top: 20px;
                    }
                    .data-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .data-card {
                        text-align: center;
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 8px;
                    }
                    .data-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #4A90E2;
                    }
                    .data-label {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                    }
                    .content-block {
                        background-color: #f9f9f9;
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 8px;
                        border-left: 4px solid #4A90E2;
                    }
                    .comm-instead { color: #e74c3c; font-weight: bold; }
                    .comm-try { color: #27ae60; font-weight: bold; }
                    .comm-why { color: #8e44ad; font-weight: bold; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 8px; }
                    p { margin-bottom: 10px; }
                    .chart-container {
                        width: 100%;
                        max-width: 500px;
                        margin: 20px auto;
                        text-align: center;
                    }
                    .chart-canvas {
                        width: 100%;
                        height: 400px;
                    }
                </style>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
            </head>
            <body>
                <h1>儿童命理与发展指南</h1>
                <p style="text-align: center; margin-bottom: 30px; font-size: 16px;">生日：${birthDate}</p>
                ${extractPrintableContent(reportContainer)}
                
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer;">打印/保存为PDF</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">关闭</button>
                </div>

                <script>
                    // Wait for the page to load, then render charts
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            renderChartsForPrint();
                        }, 500);
                    });

                    function renderChartsForPrint() {
                        const canvases = document.querySelectorAll('.chart-canvas');
                        canvases.forEach(canvas => {
                            const chartData = JSON.parse(canvas.dataset.chartData);
                            renderPrintChart(canvas, chartData);
                        });
                    }

                    function renderPrintChart(canvas, chartData) {
                        Chart.register(ChartDataLabels);

                        const labelMapping = {
                            'LeadershipAndIndependence': '领导与独立',
                            'EmpathyAndConnection': '共情与连结',
                            'CreativityAndExpression': '创意与表达',
                            'AnalyticalAndStrategicMind': '分析与策略',
                            'DiligenceAndReliability': '勤奋与可靠',
                            'AdventurousAndAdaptableSpirit': '冒险与适应'
                        };

                        const labels = Object.keys(chartData).map(key => labelMapping[key] || key);
                        const data = Object.values(chartData);

                        new Chart(canvas, {
                            type: 'radar',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: '性格蓝图分数',
                                    data: data,
                                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                                    borderColor: 'rgb(74, 144, 226)',
                                    pointBackgroundColor: 'rgb(74, 144, 226)',
                                    pointBorderColor: '#fff',
                                    pointHoverBackgroundColor: '#fff',
                                    pointHoverBorderColor: 'rgb(74, 144, 226)',
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    r: {
                                        angleLines: { display: true },
                                        suggestedMin: 0,
                                        suggestedMax: 10,
                                        pointLabels: {
                                            font: { size: 12, weight: 'bold' }
                                        },
                                        ticks: { display: false, stepSize: 2 }
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    datalabels: {
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(74, 144, 226, 0.8)',
                                        borderRadius: 4,
                                        font: { weight: 'bold' },
                                        padding: 4
                                    }
                                },
                                animation: false // Disable animation for print
                            }
                        });
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Reset button state
        setTimeout(() => {
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
        }, 1000);
        
        // Show instructions
        alert('新窗口已打开，请点击"打印/保存为PDF"按钮，然后在打印对话框中选择"保存为PDF"。');
    });

    saveImageBtn.addEventListener('click', async () => {
        // Show loading state
        saveImageBtn.disabled = true;
        saveImageBtn.textContent = '正在生成图片...';

        // Get the birth date for filename
        const birthDate = birthdayInput.value;
        const baseFilename = `儿童命理报告_${birthDate.replace(/-/g, '')}`;
        
        // Check if content exists
        if (reportContainer.innerHTML.length < 100) {
            alert('报告内容为空，请先生成报告');
            saveImageBtn.disabled = false;
            saveImageBtn.textContent = '保存为图片';
            return;
        }

        try {
            // Find all chapter sections
            const chapters = [
                { 
                    element: reportContainer.querySelector('[data-chapter="chapter1"]') || reportContainer.querySelector('h2:nth-of-type(1)'),
                    name: '第一章_内在团队',
                    selector: '[data-chapter="chapter1"]'
                },
                { 
                    element: reportContainer.querySelector('[data-chapter="chapter2"]') || reportContainer.querySelector('h2:nth-of-type(2)'),
                    name: '第二章_内在世界',
                    selector: '[data-chapter="chapter2"]'
                },
                { 
                    element: reportContainer.querySelector('[data-chapter="chapter3"]') || reportContainer.querySelector('h2:nth-of-type(3)'),
                    name: '第三章_父母攻略',
                    selector: '[data-chapter="chapter3"]'
                },
                { 
                    element: reportContainer.querySelector('[data-chapter="chapter4"]') || reportContainer.querySelector('h2:nth-of-type(4)'),
                    name: '第四章_点燃激情_结语',
                    selector: '[data-chapter="chapter4"]'
                }
            ];

            // If we can't find chapters by data attributes, try to find by content structure
            if (!chapters[0].element) {
                const allH2s = reportContainer.querySelectorAll('h2');
                if (allH2s.length >= 4) {
                    chapters[0].element = allH2s[0];
                    chapters[1].element = allH2s[1];
                    chapters[2].element = allH2s[2];
                    chapters[3].element = allH2s[3];
                }
            }

            const downloadPromises = [];
            let successCount = 0;

            // Generate each chapter image
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                
                try {
                    const chapterContent = await extractChapterContent(chapter, i, chapters.length);
                    if (chapterContent) {
                        const filename = `${baseFilename}_${chapter.name}.png`;
                        const downloadPromise = generateChapterImage(chapterContent, filename, birthDate, i + 1);
                        downloadPromises.push(downloadPromise);
                    }
                } catch (error) {
                    console.error(`Failed to process chapter ${i + 1}:`, error);
                }
            }

            // Wait for all images to be generated and downloaded
            const results = await Promise.allSettled(downloadPromises);
            
            // Count successful downloads
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    console.error(`Chapter ${index + 1} failed:`, result.reason);
                }
            });

            // Show result message
            if (successCount === chapters.length) {
                alert(`成功生成 ${successCount} 张图片！请检查您的下载文件夹。`);
            } else if (successCount > 0) {
                alert(`成功生成 ${successCount}/${chapters.length} 张图片。部分章节可能内容不足或生成失败。`);
            } else {
                throw new Error('所有章节图片生成失败');
            }
            
        } catch (error) {
            console.error('Image generation failed:', error);
            
            // Fallback: generate single image
            try {
                const filename = `${baseFilename}_完整报告.png`;
                await generateSingleImage(filename, birthDate);
                alert('章节分离失败，已生成完整报告图片。');
            } catch (fallbackError) {
                console.error('Fallback image generation also failed:', fallbackError);
                alert('图片生成失败。建议使用"保存报告"功能获取PDF版本，或截屏保存报告内容。');
            }
        } finally {
            // Reset button state
            saveImageBtn.disabled = false;
            saveImageBtn.textContent = '保存为图片';
        }
    });

    // Function to extract content for a specific chapter
    async function extractChapterContent(chapter, chapterIndex, totalChapters) {
        if (!chapter.element) {
            return null;
        }

        // Create a container for this chapter
        const container = document.createElement('div');
        container.style.cssText = `
            background-color: white;
            padding: 30px;
            font-family: 'Nunito', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
        `;

        // Add header with chapter info
        const header = document.createElement('div');
        header.innerHTML = `
            <h1 style="color: #4A90E2; text-align: center; margin-bottom: 10px; font-size: 28px;">儿童命理与发展指南</h1>
            <p style="text-align: center; margin-bottom: 20px; font-size: 16px; color: #666;">第 ${chapterIndex + 1} 部分 / 共 ${totalChapters} 部分</p>
            <hr style="border: 1px solid #4A90E2; margin-bottom: 20px;">
        `;
        container.appendChild(header);

        // Find the content for this chapter
        let currentElement = chapter.element;
        let nextChapterElement = null;

        // Find the next chapter to know where to stop
        if (chapterIndex < totalChapters - 1) {
            const nextH2s = reportContainer.querySelectorAll('h2');
            if (nextH2s[chapterIndex + 1]) {
                nextChapterElement = nextH2s[chapterIndex + 1];
            }
        }

        // Collect all elements between current chapter and next chapter
        const chapterContent = document.createElement('div');
        let collecting = false;

        for (let element of reportContainer.children) {
            if (element === currentElement) {
                collecting = true;
            }
            
            if (collecting) {
                if (element === nextChapterElement) {
                    break;
                }
                
                const clonedElement = element.cloneNode(true);
                chapterContent.appendChild(clonedElement);
            }
        }

        // Special handling for the last chapter (include conclusion)
        if (chapterIndex === totalChapters - 1) {
            const conclusionElements = reportContainer.querySelectorAll('h2, h3, p, div');
            let foundLastChapter = false;
            
            for (let element of conclusionElements) {
                if (element === currentElement) {
                    foundLastChapter = true;
                    continue;
                }
                
                if (foundLastChapter && element.textContent.includes('结语')) {
                    const clonedElement = element.cloneNode(true);
                    chapterContent.appendChild(clonedElement);
                    
                    // Also include following paragraphs
                    let nextSibling = element.nextElementSibling;
                    while (nextSibling && nextSibling.tagName !== 'H2') {
                        const clonedSibling = nextSibling.cloneNode(true);
                        chapterContent.appendChild(clonedSibling);
                        nextSibling = nextSibling.nextElementSibling;
                    }
                    break;
                }
            }
        }

        container.appendChild(chapterContent);
        return container;
    }

    // Function to generate image for a specific chapter
    async function generateChapterImage(chapterContent, filename, birthDate, chapterNum) {
        // Add to document temporarily for rendering
        chapterContent.style.position = 'absolute';
        chapterContent.style.top = '-9999px';
        chapterContent.style.left = '-9999px';
        document.body.appendChild(chapterContent);

        try {
            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check for charts in this chapter and wait longer if needed
            const charts = chapterContent.querySelectorAll('canvas');
            if (charts.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const options = {
                backgroundColor: '#ffffff',
                scale: 1.5,
                useCORS: true,
                allowTaint: false,
                foreignObjectRendering: false,
                removeContainer: true,
                logging: false,
                width: chapterContent.offsetWidth || 800,
                height: chapterContent.scrollHeight,
                scrollX: 0,
                scrollY: 0
            };

            // Generate the canvas
            const canvas = await html2canvas(chapterContent, options);
            
            // Verify canvas has content
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error(`Chapter ${chapterNum} canvas is empty`);
            }

            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            if (!blob) {
                throw new Error(`Failed to create blob for chapter ${chapterNum}`);
            }

            // Create download URL and trigger download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Clean up with delay to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 1000);

            return { success: true, chapter: chapterNum };

        } finally {
            // Remove temporary element
            document.body.removeChild(chapterContent);
        }
    }

    // Fallback function for single image (simplified version of original)
    async function generateSingleImage(filename, birthDate) {
        const options = {
            backgroundColor: '#ffffff',
            scale: 1.2,
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

        const charts = reportContainer.querySelectorAll('canvas');
        if (charts.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const canvas = await html2canvas(reportContainer, options);
        
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('Generated canvas is empty');
        }

        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (!blob) {
            throw new Error('Failed to create image blob');
        }

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

    // Helper function to extract printable content
    function extractPrintableContent(element) {
        let html = '';
        let chartData = null;
        
        // First, find the chart data from the original report
        const chartCanvas = document.getElementById('polygonChartCanvas');
        if (chartCanvas && chartCanvas.dataset.chartData) {
            chartData = chartCanvas.dataset.chartData;
        }
        
        for (let child of element.children) {
            if (child.classList.contains('report-section')) {
                html += '<div style="margin-bottom: 30px; page-break-inside: avoid;">';
                
                for (let sectionChild of child.children) {
                    if (sectionChild.tagName === 'H2') {
                        html += `<h2>${sectionChild.textContent}</h2>`;
                    } else if (sectionChild.tagName === 'H3') {
                        html += `<h3>${sectionChild.textContent}</h3>`;
                    } else if (sectionChild.tagName === 'P') {
                        html += `<p>${sectionChild.textContent}</p>`;
                    } else if (sectionChild.classList && sectionChild.classList.contains('core-data-grid')) {
                        html += '<div class="data-grid">';
                        for (let card of sectionChild.children) {
                            const value = card.querySelector('.value')?.textContent || '';
                            const label = card.querySelector('.label')?.textContent || '';
                            html += `
                                <div class="data-card">
                                    <div class="data-value">${value}</div>
                                    <div class="data-label">${label}</div>
                                </div>
                            `;
                        }
                        html += '</div>';
                    } else if (sectionChild.classList && sectionChild.classList.contains('content-breakdown')) {
                        html += '<div class="content-block">';
                        for (let breakdownChild of sectionChild.children) {
                            if (breakdownChild.classList && breakdownChild.classList.contains('breakdown-title')) {
                                html += `<h4 style="color: #4A90E2; margin-bottom: 10px;">${breakdownChild.textContent}</h4>`;
                            } else if (breakdownChild.tagName === 'P') {
                                html += `<p>${breakdownChild.textContent}</p>`;
                            } else if (breakdownChild.tagName === 'H4') {
                                html += `<h5 style="margin-top: 15px; color: #666;">▶ ${breakdownChild.textContent}</h5>`;
                            }
                        }
                        html += '</div>';
                    } else if (sectionChild.tagName === 'UL') {
                        html += '<ul>';
                        for (let li of sectionChild.children) {
                            html += `<li>${li.innerHTML}</li>`;
                        }
                        html += '</ul>';
                    } else if (sectionChild.classList && sectionChild.classList.contains('chart-container')) {
                        // Use the chart data we found earlier
                        if (chartData) {
                            html += `
                                <div class="chart-container">
                                    <canvas class="chart-canvas" data-chart-data='${chartData}'></canvas>
                                </div>
                            `;
                        } else {
                            html += `
                                <div class="chart-container">
                                    <p style="text-align: center; color: #666;">雷达图数据未找到</p>
                                </div>
                            `;
                        }
                    }
                }
                
                html += '</div>';
            }
        }
        
        return html;
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
        
        let html = '';
        
        // Add core data section
        html += renderCoreData(calculations);
        
        // Chapter 1: Inner Team
        html += `<div data-chapter="chapter1">`;
        html += renderInnerTeam(report.chapter1_innerTeam);
        html += `</div>`;
        
        // Chapter 2: Inner World  
        html += `<div data-chapter="chapter2">`;
        html += renderInnerWorld(report.chapter2_innerWorld);
        html += `</div>`;
        
        // Chapter 3: Parents Playbook
        html += `<div data-chapter="chapter3">`;
        html += renderParentsPlaybook(report.chapter3_parentsPlaybook);
        html += `</div>`;
        
        // Chapter 4: Igniting Passions + Conclusion
        html += `<div data-chapter="chapter4">`;
        html += renderIgnitingPassions(report.chapter4_ignitingPassions);
        html += renderConclusion(report.conclusion);
        html += `</div>`;
        
        reportContainer.innerHTML = html;
        
        // Render any charts after DOM is updated
        const chartCanvas = reportContainer.querySelector('canvas[data-chart-data]');
        if (chartCanvas) {
            const chartData = JSON.parse(chartCanvas.getAttribute('data-chart-data'));
            renderPolygonChart(chartCanvas, chartData);
        }
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
                <canvas id="polygonChartCanvas" data-chart-data='${JSON.stringify(polygonChart)}'></canvas>
            </div>
        `;

        // We will render the chart AFTER the main HTML is on the page
        setTimeout(() => {
            renderPolygonChart(polygonChart);
        }, 0);

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

        new Chart(ctx, {
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
                        display: false // Hide legend as it's self-explanatory
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
        });
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

        return createSection('第三章：家长行动手册', `
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

            <h3>🤝 人际与友谊风格</h3>
            <p><strong>🌱 当前成长焦点：</strong>${friendshipAndCurrentFocus.socialAndFriendshipStyle}</p>
            <p><strong>未来一年导航：</strong>${friendshipAndCurrentFocus.navigatingTheYearAhead}</p>

            ${karmicLessonFocus && karmicLessonFocus.title ? `
                <h3>特别关注：${karmicLessonFocus.title}</h3>
                <p>${karmicLessonFocus.description}</p>
            ` : ''}

            <h3>💡 引导反思问题</h3>
            <ul>${reflectionQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        `);
    }

    function renderIgnitingPassions(chapter) {
        if (!chapter) return '';
        const { recommendedHobbies, recommendedCareers, reflectionQuestions } = chapter;
        return createSection('第四章：激发热情与潜力 - 兴趣与未来方向', `
            <h3>🎨 推荐爱好领域</h3>
            ${recommendedHobbies.map(tier => `
                <h4>${tier.tier}: ${tier.theme}</h4>
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
