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
            // Use html2pdf for mobile devices
            generateMobilePDF(birthDate);
        } else {
            // Use print window for desktop
            generateDesktopPDF(birthDate);
        }
    });

    function generateMobilePDF(birthDate) {
        // Check if required libraries are available
        if (typeof window.jsPDF === 'undefined' || typeof html2canvas === 'undefined') {
            alert('PDF生成库未加载完成，请稍后再试');
            saveReportBtn.disabled = false;
            saveReportBtn.textContent = '保存报告';
            return;
        }

        const filename = `儿童命理报告_${birthDate.replace(/-/g, '')}.pdf`;
        
        // Create a mobile-optimized container for PDF generation
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            position: fixed;
            top: -9999px;
            left: 0;
            width: 794px;
            background: white;
            padding: 40px;
            font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
            color: #333;
            line-height: 1.6;
            box-sizing: border-box;
        `;
        
        // Generate PDF-optimized content
        pdfContainer.innerHTML = generatePDFContent(reportContainer, birthDate);
        document.body.appendChild(pdfContainer);
        
        // Wait for DOM to be ready
        setTimeout(() => {
            // Configure html2canvas options for mobile
            const canvasOptions = {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: null, // Auto height
                scrollX: 0,
                scrollY: 0,
                logging: false,
                onclone: function(clonedDoc) {
                    // Ensure fonts are loaded in cloned document
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        * { font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important; }
                        .pdf-chart { 
                            width: 300px; 
                            height: 300px; 
                            margin: 20px auto; 
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: #f8f9ff;
                            border: 2px solid #4A90E2;
                            border-radius: 10px;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            };

            html2canvas(pdfContainer, canvasOptions)
                .then(canvas => {
                    try {
                        const { jsPDF } = window.jsPDF;
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        
                        // Calculate dimensions
                        const imgWidth = 210; // A4 width in mm
                        const pageHeight = 297; // A4 height in mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;

                        // Add first page
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        // Add additional pages if needed
                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }

                        // Save the PDF
                        pdf.save(filename);
                        
                        // Clean up
                        document.body.removeChild(pdfContainer);
                        saveReportBtn.disabled = false;
                        saveReportBtn.textContent = '保存报告';
                        
                        alert('PDF已成功生成并下载！请检查您的下载文件夹。');
                        
                    } catch (pdfError) {
                        console.error('PDF generation error:', pdfError);
                        document.body.removeChild(pdfContainer);
                        saveReportBtn.disabled = false;
                        saveReportBtn.textContent = '保存报告';
                        
                        // Try alternative method
                        generateCanvasPDF(birthDate);
                    }
                })
                .catch(canvasError => {
                    console.error('Canvas generation error:', canvasError);
                    document.body.removeChild(pdfContainer);
                    saveReportBtn.disabled = false;
                    saveReportBtn.textContent = '保存报告';
                    
                    // Try alternative method
                    generateCanvasPDF(birthDate);
                });
        }, 200);
    }

    // Alternative canvas-based PDF generation
    function generateCanvasPDF(birthDate) {
        alert('正在尝试备用PDF生成方法...');
        
        // Create a simplified version using direct canvas drawing
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // PDF dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        
        let yPosition = margin;
        
        // Helper function to add text with word wrap
        function addText(text, fontSize = 12, isBold = false) {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            
            const lines = pdf.splitTextToSize(text, contentWidth);
            
            lines.forEach(line => {
                if (yPosition > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
                pdf.text(line, margin, yPosition);
                yPosition += fontSize * 0.5;
            });
            
            yPosition += 5; // Extra spacing
        }
        
        // Add title
        addText('儿童命理与发展指南', 20, true);
        addText(`生日：${birthDate}`, 14);
        addText(`生成日期：${new Date().toLocaleDateString('zh-CN')}`, 12);
        yPosition += 10;
        
        // Extract and add content from report
        const reportSections = reportContainer.querySelectorAll('.report-section');
        
        reportSections.forEach(section => {
            const h2 = section.querySelector('h2');
            if (h2) {
                addText(h2.textContent, 16, true);
            }
            
            // Add core data if exists
            const coreDataGrid = section.querySelector('.core-data-grid');
            if (coreDataGrid) {
                addText('【核心数据】', 14, true);
                const dataCards = coreDataGrid.querySelectorAll('.data-card');
                dataCards.forEach(card => {
                    const value = card.querySelector('.value')?.textContent || '';
                    const label = card.querySelector('.label')?.textContent || '';
                    addText(`${label}: ${value}`, 12);
                });
                yPosition += 5;
            }
            
            // Add other content
            const paragraphs = section.querySelectorAll('p');
            paragraphs.forEach(p => {
                if (!p.closest('.core-data-grid')) {
                    addText(p.textContent, 12);
                }
            });
            
            // Add content breakdown
            const breakdowns = section.querySelectorAll('.content-breakdown');
            breakdowns.forEach(breakdown => {
                const title = breakdown.querySelector('.breakdown-title');
                if (title) {
                    addText(title.textContent, 14, true);
                }
                
                const description = breakdown.querySelector('.breakdown-description');
                if (description) {
                    addText(description.textContent, 12);
                }
                
                const subtitles = breakdown.querySelectorAll('.breakdown-subtitle');
                subtitles.forEach(subtitle => {
                    addText(`▶ ${subtitle.textContent}`, 12, true);
                    const nextP = subtitle.nextElementSibling;
                    if (nextP && nextP.tagName === 'P') {
                        addText(nextP.textContent, 12);
                    }
                });
            });
            
            // Add lists
            const lists = section.querySelectorAll('ul');
            lists.forEach(ul => {
                const items = ul.querySelectorAll('li');
                items.forEach(li => {
                    addText(`• ${li.textContent}`, 12);
                });
            });
            
            yPosition += 10; // Section spacing
        });
        
        // Add chart placeholder
        if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
        }
        
        pdf.setFillColor(240, 248, 255);
        pdf.rect(margin, yPosition, contentWidth, 40, 'F');
        pdf.setTextColor(74, 144, 226);
        addText('📊 性格蓝图雷达图', 16, true);
        pdf.setTextColor(0, 0, 0);
        addText('完整的交互式图表请在电脑端查看', 12);
        
        // Save PDF
        const filename = `儿童命理报告_${birthDate.replace(/-/g, '')}.pdf`;
        pdf.save(filename);
        
        saveReportBtn.disabled = false;
        saveReportBtn.textContent = '保存报告';
        alert('PDF已生成！如需查看完整图表，请使用电脑访问。');
    }

    // Generate PDF-optimized HTML content
    function generatePDFContent(element, birthDate) {
        let html = `
            <div style="font-family: 'Microsoft YaHei', sans-serif; color: #333; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4A90E2;">
                    <h1 style="color: #4A90E2; font-size: 32px; margin: 0 0 15px 0; font-weight: bold;">儿童命理与发展指南</h1>
                    <p style="color: #666; font-size: 18px; margin: 0;">生日：${birthDate}</p>
                    <p style="color: #999; font-size: 14px; margin-top: 10px;">生成日期：${new Date().toLocaleDateString('zh-CN')}</p>
                </div>
        `;
        
        // Process each section
        for (let child of element.children) {
            if (child.classList.contains('report-section')) {
                html += '<div style="margin-bottom: 30px; page-break-inside: avoid;">';
                
                for (let sectionChild of child.children) {
                    if (sectionChild.tagName === 'H2') {
                        html += `<h2 style="color: #4A90E2; font-size: 24px; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin: 25px 0 20px 0; font-weight: bold;">${sectionChild.textContent}</h2>`;
                    } else if (sectionChild.tagName === 'H3') {
                        html += `<h3 style="color: #666; font-size: 18px; margin: 20px 0 12px 0; font-weight: bold;">${sectionChild.textContent}</h3>`;
                    } else if (sectionChild.tagName === 'P') {
                        html += `<p style="color: #555; margin-bottom: 12px; font-size: 16px; line-height: 1.7;">${sectionChild.textContent}</p>`;
                    } else if (sectionChild.classList && sectionChild.classList.contains('core-data-grid')) {
                        // Create a clean table for core data
                        html += `
                            <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h4 style="text-align: center; color: #4A90E2; margin-bottom: 15px; font-size: 18px;">核心数据</h4>
                                <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                        `;
                        
                        let row = '<tr>';
                        let count = 0;
                        for (let card of sectionChild.children) {
                            const value = card.querySelector('.value')?.textContent || '';
                            const label = card.querySelector('.label')?.textContent || '';
                            row += `
                                <td style="text-align: center; padding: 15px; border: 1px solid #ddd; background: white;">
                                    <div style="font-size: 20px; font-weight: bold; color: #4A90E2; margin-bottom: 5px;">${value}</div>
                                    <div style="font-size: 14px; color: #666;">${label}</div>
                                </td>
                            `;
                            count++;
                            if (count % 3 === 0) {
                                row += '</tr>';
                                html += row;
                                row = '<tr>';
                            }
                        }
                        if (count % 3 !== 0) {
                            while (count % 3 !== 0) {
                                row += '<td style="border: 1px solid #ddd;"></td>';
                                count++;
                            }
                            row += '</tr>';
                            html += row;
                        }
                        html += '</table></div>';
                    } else if (sectionChild.classList && sectionChild.classList.contains('content-breakdown')) {
                        html += '<div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 5px solid #4A90E2;">';
                        for (let breakdownChild of sectionChild.children) {
                            if (breakdownChild.classList && breakdownChild.classList.contains('breakdown-title')) {
                                html += `<h4 style="color: #4A90E2; font-size: 18px; margin: 0 0 12px 0; font-weight: bold;">${breakdownChild.textContent}</h4>`;
                            } else if (breakdownChild.tagName === 'P') {
                                html += `<p style="color: #555; margin-bottom: 12px; font-size: 16px; line-height: 1.7;">${breakdownChild.textContent}</p>`;
                            } else if (breakdownChild.tagName === 'H4') {
                                html += `<h5 style="margin: 18px 0 10px 0; color: #666; font-size: 16px; font-weight: bold;">▶ ${breakdownChild.textContent}</h5>`;
                            }
                        }
                        html += '</div>';
                    } else if (sectionChild.tagName === 'UL') {
                        html += '<ul style="margin: 12px 0; padding-left: 25px; list-style-type: none;">';
                        for (let li of sectionChild.children) {
                            let liContent = li.innerHTML;
                            // Process communication tips with colors
                            liContent = liContent.replace(/<span class="comm-instead">(.*?)<\/span>/g, '<strong style="color: #e74c3c; background: #ffeaea; padding: 2px 4px; border-radius: 3px;">$1</strong>');
                            liContent = liContent.replace(/<span class="comm-try">(.*?)<\/span>/g, '<strong style="color: #27ae60; background: #eafaf1; padding: 2px 4px; border-radius: 3px;">$1</strong>');
                            liContent = liContent.replace(/<span class="comm-why">(.*?)<\/span>/g, '<strong style="color: #8e44ad; background: #f4ecf7; padding: 2px 4px; border-radius: 3px;">$1</strong>');
                            html += `<li style="margin-bottom: 10px; font-size: 16px; line-height: 1.7; padding: 8px; background: white; border-radius: 5px; border-left: 3px solid #4A90E2;">• ${liContent}</li>`;
                        }
                        html += '</ul>';
                    } else if (sectionChild.classList && sectionChild.classList.contains('chart-container')) {
                        html += `
                            <div class="pdf-chart" style="text-align: center; padding: 40px; background: #f8f9ff; border: 3px solid #4A90E2; border-radius: 15px; margin: 25px 0;">
                                <h4 style="color: #4A90E2; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">📊 性格蓝图雷达图</h4>
                                <p style="color: #666; font-size: 16px; margin: 0;">完整的交互式图表请在电脑端查看</p>
                                <p style="color: #999; font-size: 14px; margin-top: 10px;">或访问网站在线版本获取完整体验</p>
                            </div>
                        `;
                    }
                }
                
                html += '</div>';
            }
        }
        
        html += '</div>';
        return html;
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
