// Helper function to detect mobile devices
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
            saveImageBtn.style.display = 'block';


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
