document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday-input');
    const generateBtn = document.getElementById('generate-btn');
    const generateAgainBtn = document.getElementById('generate-again-btn');
    const saveReportBtn = document.getElementById('save-report-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const reportContainer = document.getElementById('report-container');
    const inputSection = document.querySelector('.input-section');

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
        generateBtn.textContent = '正在生成报告...';

        try {
            // Create a timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 200000); // 200 seconds timeout

            // Use relative URL for API calls - works both locally and on Vercel
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ birthday }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || '生成报告失败，请稍后再试。');
            }

            // --- Render Report ---
            renderReport(data);

            // Hide initial form and show 'generate again' button
            inputSection.style.display = 'none';
            generateAgainBtn.style.display = 'block';
            saveReportBtn.style.display = 'block';

        } catch (error) {
            if (error.name === 'AbortError') {
                showError('生成报告超时，请稍后再试。AI生成需要一些时间，请耐心等待。');
            } else if (error.message.includes('fetch')) {
                showError('网络连接错误，请检查网络连接后重试。');
            } else {
                showError(error.message);
            }
        } finally {
            // --- UI Cleanup ---
            loader.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.textContent = '生成报告';
        }
    });

    generateAgainBtn.addEventListener('click', () => {
        // Clear the report
        reportContainer.innerHTML = '';

        // Hide the 'generate again' button
        generateAgainBtn.style.display = 'none';
        saveReportBtn.style.display = 'none';

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

        // Detect if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (isMobile) {
            // Use jsPDF for mobile devices
            generateMobilePDF(birthDate);
        } else {
            // Use print window for desktop
            generateDesktopPDF(birthDate);
        }
    });

    function generateMobilePDF(birthDate) {
        // Check if jsPDF is available
        if (typeof window.jsPDF === 'undefined') {
            alert('PDF生成库未加载完成，请稍后再试');
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
            return;
        }

        const filename = `儿童命理报告_${birthDate.replace(/-/g, '')}.pdf`;
        
        try {
            // Extract all content from the report
            const reportData = extractReportData();
            
            // Create PDF using jsPDF
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Set up fonts and colors
            doc.setFont('helvetica');
            
            // Generate PDF content
            generatePDFContent(doc, reportData, birthDate);
            
            // Save the PDF
            doc.save(filename);
            
            // Success
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
            alert('PDF已成功生成并下载！请检查您的下载文件夹。');
            
        } catch (error) {
            console.error('Mobile PDF generation error:', error);
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
            
            // Fallback to text version
            alert('PDF生成失败，正在生成文本版本...');
            generateFallbackMobilePDF(birthDate);
        }
    }

    // Extract report data from DOM
    function extractReportData() {
        const data = {
            coreData: [],
            sections: []
        };

        // Extract core data
        const coreDataGrid = reportContainer.querySelector('.core-data-grid');
        if (coreDataGrid) {
            const cards = coreDataGrid.querySelectorAll('.data-card');
            cards.forEach(card => {
                const value = card.querySelector('.value')?.textContent || '';
                const label = card.querySelector('.label')?.textContent || '';
                data.coreData.push({ label, value });
            });
        }

        // Extract sections
        const sections = reportContainer.querySelectorAll('.report-section');
        sections.forEach(section => {
            const sectionData = {
                title: '',
                content: []
            };

            const h2 = section.querySelector('h2');
            if (h2) {
                sectionData.title = h2.textContent;
            }

            // Extract content blocks
            const blocks = section.children;
            for (let block of blocks) {
                if (block.tagName === 'H2') continue; // Skip title

                if (block.tagName === 'H3') {
                    sectionData.content.push({
                        type: 'subtitle',
                        text: block.textContent
                    });
                } else if (block.tagName === 'P') {
                    sectionData.content.push({
                        type: 'paragraph',
                        text: block.textContent
                    });
                } else if (block.classList && block.classList.contains('content-breakdown')) {
                    const breakdownData = {
                        type: 'breakdown',
                        title: '',
                        items: []
                    };

                    const title = block.querySelector('.breakdown-title');
                    if (title) {
                        breakdownData.title = title.textContent;
                    }

                    const paragraphs = block.querySelectorAll('p');
                    paragraphs.forEach(p => {
                        breakdownData.items.push(p.textContent);
                    });

                    const subtitles = block.querySelectorAll('h4, h5');
                    subtitles.forEach(sub => {
                        breakdownData.items.push(`• ${sub.textContent}`);
                    });

                    sectionData.content.push(breakdownData);
                } else if (block.tagName === 'UL') {
                    const listData = {
                        type: 'list',
                        items: []
                    };

                    const items = block.querySelectorAll('li');
                    items.forEach(li => {
                        listData.items.push(li.textContent);
                    });

                    sectionData.content.push(listData);
                } else if (block.classList && block.classList.contains('chart-container')) {
                    sectionData.content.push({
                        type: 'chart',
                        text: '性格蓝图雷达图 - 请访问网站查看完整交互式图表'
                    });
                }
            }

            data.sections.push(sectionData);
        });

        return data;
    }

    // Generate PDF content using jsPDF
    function generatePDFContent(doc, data, birthDate) {
        let yPosition = 20;
        const pageHeight = 297; // A4 height in mm
        const margin = 20;
        const lineHeight = 7;
        const maxWidth = 170; // Max text width

        // Helper function to add new page if needed
        function checkPageBreak(neededHeight) {
            if (yPosition + neededHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = 20;
            }
        }

        // Helper function to wrap text
        function wrapText(text, maxWidth) {
            return doc.splitTextToSize(text, maxWidth);
        }

        // Title
        doc.setFontSize(20);
        doc.setTextColor(74, 144, 226); // Blue color
        doc.text('儿童命理与发展指南', 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Birth date
        doc.setFontSize(12);
        doc.setTextColor(102, 102, 102); // Gray color
        doc.text(`生日：${birthDate}`, 105, yPosition, { align: 'center' });
        yPosition += 10;

        // Generation date
        doc.setFontSize(10);
        doc.text(`生成日期：${new Date().toLocaleDateString('zh-CN')}`, 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Core data section
        if (data.coreData.length > 0) {
            checkPageBreak(30);
            
            doc.setFontSize(14);
            doc.setTextColor(74, 144, 226);
            doc.text('核心数据', margin, yPosition);
            yPosition += 10;

            // Draw core data in a table-like format
            const cols = 3;
            const colWidth = maxWidth / cols;
            let col = 0;
            let startY = yPosition;

            data.coreData.forEach((item, index) => {
                const x = margin + (col * colWidth);
                
                // Draw border
                doc.setDrawColor(221, 221, 221);
                doc.rect(x, yPosition - 5, colWidth - 2, 15);
                
                // Value
                doc.setFontSize(12);
                doc.setTextColor(74, 144, 226);
                doc.text(item.value, x + colWidth/2, yPosition + 2, { align: 'center' });
                
                // Label
                doc.setFontSize(8);
                doc.setTextColor(102, 102, 102);
                doc.text(item.label, x + colWidth/2, yPosition + 8, { align: 'center' });

                col++;
                if (col >= cols) {
                    col = 0;
                    yPosition += 20;
                }
            });

            if (col > 0) {
                yPosition += 20;
            }
            yPosition += 10;
        }

        // Sections
        data.sections.forEach(section => {
            checkPageBreak(20);

            // Section title
            doc.setFontSize(16);
            doc.setTextColor(74, 144, 226);
            doc.text(section.title, margin, yPosition);
            yPosition += 12;

            // Section content
            section.content.forEach(content => {
                switch (content.type) {
                    case 'subtitle':
                        checkPageBreak(10);
                        doc.setFontSize(12);
                        doc.setTextColor(102, 102, 102);
                        doc.text(content.text, margin, yPosition);
                        yPosition += 8;
                        break;

                    case 'paragraph':
                        checkPageBreak(15);
                        doc.setFontSize(10);
                        doc.setTextColor(85, 85, 85);
                        const wrappedText = wrapText(content.text, maxWidth);
                        wrappedText.forEach(line => {
                            checkPageBreak(lineHeight);
                            doc.text(line, margin, yPosition);
                            yPosition += lineHeight;
                        });
                        yPosition += 3;
                        break;

                    case 'breakdown':
                        checkPageBreak(20);
                        
                        // Breakdown title
                        doc.setFontSize(11);
                        doc.setTextColor(74, 144, 226);
                        doc.text(content.title, margin, yPosition);
                        yPosition += 8;

                        // Breakdown items
                        content.items.forEach(item => {
                            doc.setFontSize(9);
                            doc.setTextColor(85, 85, 85);
                            const wrappedItem = wrapText(item, maxWidth - 10);
                            wrappedItem.forEach(line => {
                                checkPageBreak(lineHeight);
                                doc.text(line, margin + 5, yPosition);
                                yPosition += lineHeight;
                            });
                            yPosition += 2;
                        });
                        yPosition += 5;
                        break;

                    case 'list':
                        checkPageBreak(15);
                        content.items.forEach(item => {
                            doc.setFontSize(9);
                            doc.setTextColor(85, 85, 85);
                            const wrappedItem = wrapText(`• ${item}`, maxWidth - 10);
                            wrappedItem.forEach(line => {
                                checkPageBreak(lineHeight);
                                doc.text(line, margin + 5, yPosition);
                                yPosition += lineHeight;
                            });
                            yPosition += 2;
                        });
                        yPosition += 5;
                        break;

                    case 'chart':
                        checkPageBreak(20);
                        // Draw a placeholder box for chart
                        doc.setDrawColor(74, 144, 226);
                        doc.setFillColor(240, 248, 255);
                        doc.rect(margin, yPosition - 5, maxWidth, 15, 'FD');
                        
                        doc.setFontSize(10);
                        doc.setTextColor(74, 144, 226);
                        doc.text('📊 ' + content.text, margin + 5, yPosition + 5);
                        yPosition += 20;
                        break;
                }
            });

            yPosition += 10; // Space between sections
        });

        // Footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`第 ${i} 页，共 ${totalPages} 页`, 105, pageHeight - 10, { align: 'center' });
        }
    }

    // Fallback method for mobile PDF generation
    function generateFallbackMobilePDF(birthDate) {
        // Create a very simple text-based version
        const textContent = extractTextOnlyContent(reportContainer, birthDate);
        
        // Create blob and download
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `儿童命理报告_${birthDate.replace(/-/g, '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('已生成文本版本报告。如需PDF版本，请使用电脑访问。');
    }



    // Extract text-only content as fallback
    function extractTextOnlyContent(element, birthDate) {
        let text = `儿童命理与发展指南\n生日：${birthDate}\n生成日期：${new Date().toLocaleDateString('zh-CN')}\n\n`;
        text += '=' .repeat(50) + '\n\n';
        
        for (let child of element.children) {
            if (child.classList.contains('report-section')) {
                for (let sectionChild of child.children) {
                    if (sectionChild.tagName === 'H2') {
                        text += `\n【${sectionChild.textContent}】\n`;
                        text += '-'.repeat(30) + '\n';
                    } else if (sectionChild.tagName === 'H3') {
                        text += `\n▶ ${sectionChild.textContent}\n`;
                    } else if (sectionChild.tagName === 'P') {
                        text += `${sectionChild.textContent}\n\n`;
                    } else if (sectionChild.classList && sectionChild.classList.contains('core-data-grid')) {
                        text += '\n【核心数据】\n';
                        for (let card of sectionChild.children) {
                            const value = card.querySelector('.value')?.textContent || '';
                            const label = card.querySelector('.label')?.textContent || '';
                            text += `${label}: ${value}\n`;
                        }
                        text += '\n';
                    } else if (sectionChild.tagName === 'UL') {
                        for (let li of sectionChild.children) {
                            text += `• ${li.textContent}\n`;
                        }
                        text += '\n';
                    }
                }
            }
        }
        
        return text;
    }

    function generateDesktopPDF(birthDate) {
        // Original desktop print solution
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
