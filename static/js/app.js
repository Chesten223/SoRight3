document.addEventListener('alpine:init', () => {
    
    // --- 语言包 ---
    const translations = {
        en: {
            welcome: "Welcome Back.",
            subtitle: "Optimize your neural pathways.",
            streak: "Day Streak",
            hours: "Hours Today",
            training: "Adaptive Training",
            training_desc: "AI-driven diagnosis to fix weak spots.",
            exam: "Real Exam Sim",
            exam_desc: "Full pressure, no hints.",
            notebooks: "Notebooks",
            new_book: "New Book",
            settings: "Settings",
            appearance: "Appearance",
            language: "Language",
            start_focus: "START FOCUS",
            stop_focus: "STOP FOCUS",
            pomo_title: "Pomodoro",
            playing: "Now Playing",
            exit: "Exit",
            ai_assist: "AI Assist"
        },
        zh: {
            welcome: "欢迎回来",
            subtitle: "准备好优化你的神经回路了吗？",
            streak: "连续打卡",
            hours: "今日时长",
            training: "智能拆解训练",
            training_desc: "AI 诊断思维盲区，自适应难度降级。",
            exam: "真题实战模拟",
            exam_desc: "全真环境，无提示，无辅助。",
            notebooks: "错题本",
            new_book: "新建错题本",
            settings: "系统设置",
            appearance: "外观显示",
            language: "语言设置",
            start_focus: "开始专注",
            stop_focus: "停止专注",
            pomo_title: "番茄钟",
            playing: "正在播放",
            exit: "退出",
            ai_assist: "AI 助教"
        }
    };

    // --- Global Controller ---
    Alpine.data('globalApp', () => ({
        barOpen: false,
        showSettings: false,
        lang: localStorage.getItem('appLang') || 'zh', // 默认中文
        
        // 翻译辅助函数
        t(key) { return translations[this.lang][key] || key; },
        setLang(l) { this.lang = l; localStorage.setItem('appLang', l); },

        // 设置与状态
        settings: JSON.parse(localStorage.getItem('appSettings')) || { 
            mode: 'light', // light | dark
            bgImage: '' // 空字符串 = 默认背景
        },

        // 音乐数据
        music: {
            isPlaying: false,
            currentIdx: 0,
            list: [
                { title: "Chill Lofi", artist: "Lofi Girl", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3", cover: "https://picsum.photos/seed/1/200" },
                { title: "Focus Flow", artist: "Physics Mode", url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", cover: "https://picsum.photos/seed/2/200" },
                { title: "Alpha Waves", artist: "Brain Power", url: "https://cdn.pixabay.com/download/audio/2021/11/23/audio_035a336ce6.mp3", cover: "https://picsum.photos/seed/3/200" }
            ]
        },

        // 番茄钟 (持久化版)
        pomo: { active: false, timeLeft: 25 * 60, totalTime: 25 * 60, interval: null },
        pomoString: '25:00',

        // 数据统计
        timeString: '',
        studySeconds: parseInt(localStorage.getItem('todayStudyTime')) || 0,
        studyTimeString: '00:00',

        initGlobal() {
            this.applySettings();
            
            // 恢复番茄钟状态 (如果有未完成的)
            // 简单起见，这里只做页面内持久化，不做跨页面时间差计算，因为 layout 不刷新
            
            // 时钟 & 学习计时
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

        // --- 设置逻辑 ---
        saveSettings() {
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.applySettings();
        },
        setMode(m) { this.settings.mode = m; this.saveSettings(); },
        setBg(url) { this.settings.bgImage = url; this.saveSettings(); },
        
        applySettings() {
            const root = document.documentElement;
            // 切换 class
            if (this.settings.mode === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        },

        // --- 音乐逻辑 ---
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

        // --- 番茄钟逻辑 ---
        togglePomo() {
            if (this.pomo.active) {
                this.pomo.active = false;
                clearInterval(this.pomo.interval);
            } else {
                this.pomo.active = true;
                this.pomo.interval = setInterval(() => {
                    if (this.pomo.timeLeft > 0) {
                        this.pomo.timeLeft--;
                        const m = Math.floor(this.pomo.timeLeft / 60).toString().padStart(2, '0');
                        const s = (this.pomo.timeLeft % 60).toString().padStart(2, '0');
                        this.pomoString = `${m}:${s}`;
                    } else {
                        this.pomo.active = false;
                        clearInterval(this.pomo.interval);
                        if(navigator.vibrate) navigator.vibrate([500, 200, 500]);
                        alert(this.lang === 'zh' ? "专注完成！" : "Focus Session Complete!");
                        this.pomo.timeLeft = 25 * 60;
                        this.pomoString = "25:00";
                    }
                }, 1000);
            }
        }
    }));

    // --- Dashboard App ---
    Alpine.data('dashboardApp', () => ({
        showNewBookModal: false,
        newBookName: '',
        async createBook() {
            if (!this.newBookName.trim()) return;
            const res = await fetch('/api/create_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.newBookName }) });
            const data = await res.json();
            if (data.success) location.reload();
            else alert(data.msg);
        }
    }));

    // --- Quiz App ---
    Alpine.data('quizApp', (mode, book) => ({
        // (逻辑与之前相同，省略重复部分以保证长度，核心在于它不负责 Pomo/Music，只负责题目)
        mode: mode,
        bookName: book,
        loading: true,
        aiOpen: false,
        showExplanation: false,
        question: {},
        selectedOption: null,
        submitted: false,
        feedback: {},
        userMsg: '',
        chatHistory: [],
        
        init() { this.loadNext(); },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        selectOption(id) { if(!this.submitted) this.selectedOption = id; },
        
        async loadNext(targetId=null) {
            this.loading = true;
            this.showExplanation = false;
            setTimeout(async () => {
                this.submitted = false;
                this.selectedOption = null;
                this.feedback = {};
                let url = `/api/get_question?mode=${this.mode}`;
                if (targetId) url += `&q_id=${targetId}`;
                if (this.bookName) url += `&book=${this.bookName}`;
                try {
                    const res = await fetch(url);
                    if(!res.ok) { alert("Empty!"); window.location.href='/'; return; }
                    this.question = await res.json();
                } catch(e) { console.error(e); }
                finally { 
                    this.loading = false; 
                    this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
                }
            }, 300);
        },
        
        // 样式逻辑
        getOptionClass(id) {
            let base = 'bg-white/5 dark:bg-black/20 border-transparent hover:bg-white/10 dark:hover:bg-white/5 ';
            if (this.selectedOption === id && !this.submitted) return 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500';
            if (this.submitted) {
                if (id === this.feedback.correct_id) return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400';
                if (id === this.selectedOption) return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400';
                return 'opacity-40 grayscale';
            }
            return base + 'border border-gray-200 dark:border-gray-700';
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