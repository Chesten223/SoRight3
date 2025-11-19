document.addEventListener('alpine:init', () => {
    
    // --- 语言包配置 (Translations) ---
    const translations = {
        en: {
            // Dashboard
            welcome: "Welcome Back.",
            subtitle: "Optimize your neural pathways.",
            streak: "Day Streak",
            hours: "Hours Today",
            
            // Card Titles & Descs
            training: "Adaptive Training",
            training_desc: "AI-driven diagnosis.",
            exam: "Real Exam Sim",
            exam_desc: "Full pressure, no hints.",
            daily_review: "Daily Review",
            daily_desc: "Based on forgetting curve.",
            
            // Notebooks
            notebooks: "Notebooks",
            new_book: "New Book",
            
            // Settings & UI
            settings: "Settings",
            appearance: "Appearance",
            language: "Language",
            start_focus: "START FOCUS",
            stop_focus: "STOP FOCUS",
            pomo_title: "Pomodoro",
            playing: "Now Playing",
            exit: "Exit",
            ai_assist: "AI Assist",
            
            // Quiz & Mistake Book Interface
            overview: "Overview",
            folders: "Folders",
            questions_list: "Questions",
            items_suffix: " items",
            loading: "Loading...",
            overall_analysis: "Overall Analysis",
            new_folder_btn: "+ New Folder",
            total_questions: "Total Questions",
            mastery_rate: "Mastery Rate",
            total_errors: "Total Errors",
            top_tags: "Top Tags (Inherited)",
            no_tags: "No tags found in this collection.",
            smart_variant: "Smart Variant Mode",
            confirm: "Confirm",
            analysis: "Analysis",
            next: "Next",
            diagnosis: "Diagnosis",
            correct_label: "Correct:",
            ask_ai: "Ask AI",
            
            // Modals & Toasts
            add_to_notebook: "Add to Notebook",
            new_folder_title: "New Folder",
            name_label: "Name",
            tags_label: "Custom Tags",
            tags_placeholder: "e.g. Physics, Hard",
            cancel: "Cancel",
            create: "Create",
            
            // Notifications
            toast_success: "Success",
            toast_folder_created: "Folder created successfully",
            toast_saved: "Saved",
            toast_added: "Question added to notebook",
            toast_fail: "Failed",
            toast_complete: "Complete",
            toast_finished: "You've finished this collection!",
            toast_empty: "Empty",
            toast_no_qs: "No questions in this folder."
        },
        zh: {
            // 仪表盘
            welcome: "欢迎回来",
            subtitle: "准备好优化你的神经回路了吗？",
            streak: "连续打卡",
            hours: "今日时长",
            
            // 卡片标题与描述
            training: "智能拆解训练",
            training_desc: "AI 诊断思维盲区。",
            exam: "真题实战模拟",
            exam_desc: "全真环境，无提示。",
            daily_review: "每日错题特训",
            daily_desc: "基于遗忘曲线智能推荐。",
            
            // 错题本
            notebooks: "错题本",
            new_book: "新建错题本",
            
            // 设置与界面
            settings: "系统设置",
            appearance: "外观显示",
            language: "语言设置",
            start_focus: "开始专注",
            stop_focus: "停止专注",
            pomo_title: "番茄钟",
            playing: "正在播放",
            exit: "退出",
            ai_assist: "AI 助教",
            
            // 做题与错题本界面
            overview: "数据概览",
            folders: "子目录",
            questions_list: "题目列表",
            items_suffix: " 题",
            loading: "加载中...",
            overall_analysis: "全域数据分析",
            new_folder_btn: "+ 新建文件夹",
            total_questions: "题目总数",
            mastery_rate: "平均熟练度",
            total_errors: "累计错题",
            top_tags: "高频标签 (含继承)",
            no_tags: "本集合暂无标签数据。",
            smart_variant: "智能变式模式",
            confirm: "提交答案",
            analysis: "查看解析",
            next: "下一题",
            diagnosis: "诊断分析",
            correct_label: "正确答案：",
            ask_ai: "询问 AI",
            
            // 弹窗与通知
            add_to_notebook: "加入错题本",
            new_folder_title: "新建文件夹",
            name_label: "名称",
            tags_label: "自定义标签 (选填)",
            tags_placeholder: "例如：力学，易错",
            cancel: "取消",
            create: "创建",
            
            // 通知消息
            toast_success: "操作成功",
            toast_folder_created: "文件夹已创建",
            toast_saved: "已保存",
            toast_added: "已加入错题本",
            toast_fail: "操作失败",
            toast_complete: "恭喜完成",
            toast_finished: "本系列已全部刷完！",
            toast_empty: "空空如也",
            toast_no_qs: "目录下暂时没有题目"
        }
    };

    // --- 全局控制器 (Global Controller) ---
    Alpine.data('globalApp', () => ({
        barOpen: false,
        showSettings: false,
        lang: localStorage.getItem('appLang') || 'zh', 
        
        t(key) { return translations[this.lang][key] || key; },
        setLang(l) { this.lang = l; localStorage.setItem('appLang', l); },

        settings: JSON.parse(localStorage.getItem('appSettings')) || { 
            mode: 'light', 
            bgImage: '' 
        },

        music: {
            isPlaying: false,
            currentIdx: 0,
            list: [
                { title: "Chill Lofi", artist: "Lofi Girl", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3", cover: "https://picsum.photos/seed/1/200" },
                { title: "Focus Flow", artist: "Physics Mode", url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", cover: "https://picsum.photos/seed/2/200" },
                { title: "Alpha Waves", artist: "Brain Power", url: "https://cdn.pixabay.com/download/audio/2021/11/23/audio_035a336ce6.mp3", cover: "https://picsum.photos/seed/3/200" }
            ]
        },

        pomo: { active: false, interval: null, defaultDuration: 25 * 60 },
        pomoString: '25:00',

        timeString: '',
        studySeconds: parseInt(localStorage.getItem('todayStudyTime')) || 0,
        studyTimeString: '00:00',

        initGlobal() {
            this.applySettings();
            this.checkPomoStatus();
            setInterval(() => {
                const now = new Date();
                this.timeString = now.toLocaleTimeString(this.lang === 'zh' ? 'zh-CN' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                this.studySeconds++;
                const h = Math.floor(this.studySeconds / 3600).toString().padStart(2, '0');
                const m = Math.floor((this.studySeconds % 3600) / 60).toString().padStart(2, '0');
                this.studyTimeString = `${h}:${m}`;
                if (this.studySeconds % 60 === 0) localStorage.setItem('todayStudyTime', this.studySeconds);
            }, 1000);
        },

        saveSettings() { localStorage.setItem('appSettings', JSON.stringify(this.settings)); this.applySettings(); },
        setMode(m) { this.settings.mode = m; this.saveSettings(); },
        setBg(url) { this.settings.bgImage = url; this.saveSettings(); },
        applySettings() {
            const root = document.documentElement;
            if (this.settings.mode === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        },

        togglePlay() {
            const audio = this.$refs.audioPlayer;
            if (!audio) return;
            if (this.music.isPlaying) audio.pause(); else audio.play();
            this.music.isPlaying = !this.music.isPlaying;
        },
        nextTrack() {
            this.music.currentIdx = (this.music.currentIdx + 1) % this.music.list.length;
            this.music.isPlaying = false;
            this.$nextTick(() => this.togglePlay());
        },
        prevTrack() {
            this.music.currentIdx = (this.music.currentIdx - 1 + this.music.list.length) % this.music.list.length;
            this.music.isPlaying = false;
            this.$nextTick(() => this.togglePlay());
        },

        checkPomoStatus() {
            const savedTarget = localStorage.getItem('pomoTargetTime');
            if (savedTarget) {
                const targetTime = parseInt(savedTarget);
                const now = Date.now();
                if (targetTime > now) {
                    this.pomo.active = true;
                    this.startPomoTicker(targetTime);
                } else {
                    this.stopPomo(false); 
                }
            }
        },
        togglePomo() {
            if (this.pomo.active) this.stopPomo(true);
            else {
                const now = Date.now();
                const targetTime = now + (this.pomo.defaultDuration * 1000);
                localStorage.setItem('pomoTargetTime', targetTime);
                this.pomo.active = true;
                this.startPomoTicker(targetTime);
            }
        },
        startPomoTicker(targetTime) {
            this.updatePomoDisplay(targetTime);
            if (this.pomo.interval) clearInterval(this.pomo.interval);
            this.pomo.interval = setInterval(() => {
                const shouldContinue = this.updatePomoDisplay(targetTime);
                if (!shouldContinue) this.completePomo();
            }, 1000);
        },
        updatePomoDisplay(targetTime) {
            const now = Date.now();
            const secondsLeft = Math.round((targetTime - now) / 1000);
            if (secondsLeft <= 0) return false;
            const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
            const s = (secondsLeft % 60).toString().padStart(2, '0');
            this.pomoString = `${m}:${s}`;
            return true;
        },
        completePomo() {
            this.stopPomo(false);
            if(navigator.vibrate) navigator.vibrate([500, 200, 500]);
            alert(this.lang === 'zh' ? "专注完成！" : "Focus Session Complete!");
        },
        stopPomo(manual) {
            this.pomo.active = false;
            clearInterval(this.pomo.interval);
            localStorage.removeItem('pomoTargetTime');
            this.pomoString = "25:00";
        }
    }));

    // --- Dashboard App ---
    Alpine.data('dashboardApp', () => ({
        showNewBookModal: false,
        newBookName: '',
        newBookTags: '',
        async createBook() {
            if (!this.newBookName.trim()) return;
            const res = await fetch('/api/create_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.newBookName, parent: 'root', tags: this.newBookTags }) });
            const data = await res.json();
            if (data.success) location.reload();
            else alert(data.msg);
        }
    }));

    // --- Quiz App (Enhanced) ---
    Alpine.data('quizApp', (mode, book) => ({
        mode: mode,
        bookId: book,
        loading: true,
        aiOpen: false,
        showExplanation: false,
        question: {},
        selectedOption: null,
        submitted: false,
        feedback: {},
        userMsg: '',
        chatHistory: [],
        bookData: { info: {}, stats: {}, sub_notebooks: [], questions: [], breadcrumbs: [] },
        currentQIndex: -1,
        showCreateModal: false,
        subBookName: '',
        subBookTags: '',
        showAddToBookModal: false,
        notebooksList: [],
        notify: { show: false, title: '', msg: '' },

        async init() {
            if (this.mode === 'mistake') await this.loadBook(this.bookId);
            else this.loadNext();
        },

        showToast(titleKey, msgKey) {
            // 使用 t() 函数来获取翻译，如果是直接的字符串则显示字符串
            // 注意：在 quizApp 内部无法直接调用 globalApp 的 t()，
            // 所以这里我们简单 hack 一下，或者假设 key 是英文原文
            // 更好的做法是：this.notify.title = translations[localStorage.getItem('appLang')||'zh'][titleKey] || titleKey;
            const lang = localStorage.getItem('appLang') || 'zh';
            this.notify.title = translations[lang][titleKey] || titleKey;
            this.notify.msg = translations[lang][msgKey] || msgKey;
            this.notify.show = true;
            setTimeout(() => { this.notify.show = false; }, 2000);
        },

        async loadBook(targetId) {
            this.loading = true;
            this.bookId = targetId;
            this.currentQIndex = -1; 
            try {
                const res = await fetch(`/api/book_details?book=${targetId}`);
                this.bookData = await res.json();
            } catch(e) { console.error(e); }
            finally { this.loading = false; }
        },

        async jumpToQuestion(index) {
            this.currentQIndex = index;
            await this.loadNext(this.bookData.questions[index].id);
        },

        createSubBook() { this.subBookName = ''; this.subBookTags = ''; this.showCreateModal = true; },
        async confirmCreateSubBook() {
            if (!this.subBookName.trim()) return;
            const res = await fetch('/api/create_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.subBookName, parent: this.bookId, tags: this.subBookTags }) });
            const data = await res.json();
            if (data.success) { 
                this.showCreateModal = false; 
                this.loadBook(this.bookId);
                this.showToast('toast_success', 'toast_folder_created');
            } 
            else alert(data.msg);
        },

        async openAddToBookModal() {
            const res = await fetch('/api/get_notebooks');
            this.notebooksList = await res.json();
            this.showAddToBookModal = true;
        },
        async addToBook(targetBookId) {
            const res = await fetch('/api/add_to_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ book_id: targetBookId, q_id: this.question.id }) });
            const data = await res.json();
            if(data.success) {
                this.showAddToBookModal = false;
                this.showToast('toast_saved', 'toast_added');
            } else {
                alert("Failed.");
            }
        },
        
        toggleAI() { this.aiOpen = !this.aiOpen; },
        selectOption(id) { if(!this.submitted) this.selectedOption = id; },
        
        async loadNext(targetId=null) {
            this.loading = true;
            this.showExplanation = false;
            
            if (this.mode === 'mistake' && !targetId) {
                this.currentQIndex++;
                if (this.currentQIndex >= this.bookData.questions.length) {
                    this.showToast('toast_complete', 'toast_finished');
                    this.currentQIndex = -1;
                    this.loading = false;
                    return;
                }
                targetId = this.bookData.questions[this.currentQIndex].id;
            }

            setTimeout(async () => {
                this.submitted = false;
                this.selectedOption = null;
                this.feedback = {};
                
                let url = `/api/get_question?mode=${this.mode}`;
                if (targetId) url += `&q_id=${targetId}`;
                if (this.mode === 'mistake') url += `&book=${this.bookId}`;
                
                try {
                    const res = await fetch(url);
                    if(!res.ok) { 
                        if(this.mode === 'mistake') { 
                            this.showToast('toast_empty', 'toast_no_qs'); 
                            this.currentQIndex = -1; 
                            return; 
                        }
                        alert("Error loading question"); return; 
                    }
                    this.question = await res.json();
                } catch(e) { console.error(e); }
                finally { 
                    this.loading = false; 
                    this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
                }
            }, 300);
        },
        
        getOptionClass(id) {
            let base = 'backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer overflow-hidden border border-transparent hover:scale-[1.01] active:scale-[0.99] ';
            let theme = 'bg-white/70 hover:bg-white/90 dark:bg-black/20 dark:hover:bg-white/5 dark:border-gray-700 ';
            if (this.selectedOption === id && !this.submitted) return 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500 shadow-md ' + base;
            if (this.submitted) {
                if (id === this.feedback.correct_id) return 'bg-green-500/20 border-green-500 text-green-800 dark:text-green-400 ' + base;
                if (id === this.selectedOption) return 'bg-red-500/20 border-red-500 text-red-800 dark:text-red-400 ' + base;
                return theme + 'opacity-40 grayscale ' + base;
            }
            return theme + base;
        },
        getOptionCircleClass(id) {
            if (this.selectedOption === id && !this.submitted) return 'border-blue-500 text-blue-500 bg-transparent';
            if (this.submitted && id === this.feedback.correct_id) return 'border-green-500 bg-green-500 text-white';
            if (this.submitted && id === this.selectedOption) return 'border-red-500 bg-red-500 text-white';
            return 'border-gray-300 dark:border-gray-600 text-gray-400';
        },

        async submit() {
            if(!this.selectedOption) return;
            const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ q_id: this.question.id, choice: this.selectedOption }) });
            this.feedback = await res.json();
            this.submitted = true;
            this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
            if (!this.feedback.is_correct) setTimeout(() => { this.showExplanation = true; }, 800);
        },
        async sendMessage() {
            if(!this.userMsg.trim()) return;
            const txt = this.userMsg; this.userMsg = '';
            this.chatHistory.push({ role: 'user', text: txt });
            const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: this.question.ai_context }) });
            const data = await res.json();
            this.chatHistory.push({ role: 'ai', text: data.reply });
        }
    }));
});