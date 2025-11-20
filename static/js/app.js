document.addEventListener('alpine:init', () => {

    // --- 1. 核心数据仓库 (Shared Music Store) ---
    Alpine.store('musicStore', {
        list: [], 
        fullList: [],
        favorites: JSON.parse(localStorage.getItem('musicFavs')) || [],
        history: JSON.parse(localStorage.getItem('musicHistory')) || [],
        
        init() {
            // ================= [用户自定义区] =================
            // 在这里输入你找到的链接。支持 MP3 直链、Icecast/Shoutcast 流地址。
            
            const myRadios = [
                { 
                    title: "Lofi HipHop Radio", 
                    artist: "Lofi Girl Mirror", 
                    type: 'radio', 
                    // 这是一个非常稳定的 Lofi 流
                    url: "http://stream.zeno.fm/0r0xa792kwzuv", 
                    cover: "https://i.scdn.co/image/ab67616d0000b273538e4b4443b8b93027144d4f" 
                },
                { 
                    title: "Classical Focus", 
                    artist: "Venice Classic", 
                    type: 'radio', 
                    url: "http://175.194.45.24:8000/stream", 
                    cover: "https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=200" 
                },
                { 
                    title: "Deep House", 
                    artist: "Ibiza Global", 
                    type: 'radio', 
                    url: "http://ibizaglobalradio.streaming-pro.com:8024/;stream.mp3", 
                    cover: "https://images.unsplash.com/photo-1571266028243-371695039989?w=200" 
                }
            ];

            const mySounds = [
                { 
                    title: "Light Rain", 
                    artist: "Nature Sounds", 
                    type: 'noise', 
                    url: "https://actions.google.com/sounds/v1/ambiences/gentle_rains_sleep.ogg", 
                    cover: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=200" 
                },
                { 
                    title: "Coffee Shop", 
                    artist: "Ambience", 
                    type: 'noise', 
                    url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg", 
                    cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200" 
                },
                { 
                    title: "White Noise", 
                    artist: "Focus Tool", 
                    type: 'noise', 
                    url: "https://actions.google.com/sounds/v1/ambiences/fire.ogg", 
                    cover: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=200" 
                }
            ];
            // ===================================================

            this.fullList = [...myRadios, ...mySounds];
            this.list = this.fullList;
        },
        
        // 播放指定索引
        playAtIndex(index) {
            const track = this.list[index];
            this.addToHistory(track);
            document.dispatchEvent(new CustomEvent('play-track', { detail: { index: index } }));
        },

        // 播放特定 Track 对象（用于从历史/收藏列表反向查找播放）
        playTrackObject(track) {
            // 尝试在主列表中找到它
            let idx = this.list.findIndex(t => t.url === track.url);
            
            // 如果找不到（比如以前的歌现在删了），临时加到列表末尾播放
            if (idx === -1) {
                this.list.push(track);
                idx = this.list.length - 1;
            }
            
            this.playAtIndex(idx);
        },
        
        addToHistory(track) {
            if (!track) return;
            // 去重：先删掉旧的同名记录
            this.history = this.history.filter(t => t.url !== track.url);
            // 加到最前
            this.history.unshift(track);
            // 只保留最近 20 首
            if (this.history.length > 20) this.history.pop();
            localStorage.setItem('musicHistory', JSON.stringify(this.history));
        },

        toggleFavorite(url) {
            if (this.favorites.includes(url)) {
                this.favorites = this.favorites.filter(u => u !== url);
            } else {
                this.favorites.push(url);
            }
            localStorage.setItem('musicFavs', JSON.stringify(this.favorites));
        }
    });
    
    // 初始化
    Alpine.store('musicStore').init();


    // --- 2. 语言包配置 ---
    const translations = {
        en: {
            welcome: "Welcome Back.",
            subtitle: "Optimize your neural pathways.",
            streak: "Day Streak",
            hours: "Hours Today",
            training: "Adaptive Training",
            training_desc: "AI-driven diagnosis.",
            exam: "Real Exam Sim",
            exam_desc: "Full pressure.",
            daily_review: "Daily Review",
            daily_desc: "Based on forgetting curve.",
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
            ai_assist: "AI Assist",
            // Music
            tab_all: "Library",
            tab_noise: "White Noise",
            tab_fav: "Favorites",
            tab_history: "History",
            // Quiz
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
            top_tags: "Top Tags",
            no_tags: "No tags found.",
            smart_variant: "Smart Variant Mode",
            confirm: "Confirm",
            analysis: "Analysis",
            next: "Next",
            diagnosis: "Diagnosis",
            correct_label: "Correct:",
            ask_ai: "Ask AI",
            add_to_notebook: "Add to Notebook",
            new_folder_title: "New Folder",
            name_label: "Name",
            tags_label: "Custom Tags",
            tags_placeholder: "e.g. Physics",
            cancel: "Cancel",
            create: "Create",
            toast_success: "Success",
            toast_folder_created: "Folder created",
            toast_saved: "Saved",
            toast_added: "Question added",
            toast_fail: "Failed",
            toast_complete: "Complete",
            toast_finished: "Collection Finished!",
            toast_empty: "Empty",
            toast_no_qs: "No questions."
        },
        zh: {
            welcome: "欢迎回来",
            subtitle: "准备好优化你的神经回路了吗？",
            streak: "连续打卡",
            hours: "今日时长",
            training: "智能拆解训练",
            training_desc: "AI 诊断思维盲区。",
            exam: "真题实战模拟",
            exam_desc: "全真环境，无提示。",
            daily_review: "每日错题特训",
            daily_desc: "基于遗忘曲线。",
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
            ai_assist: "AI 助教",
            // Music
            tab_all: "电台与白噪音",
            tab_noise: "纯净白噪音",
            tab_fav: "我的收藏",
            tab_history: "播放历史",
            // Quiz
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
            top_tags: "高频标签",
            no_tags: "暂无标签数据。",
            smart_variant: "智能变式模式",
            confirm: "提交答案",
            analysis: "查看解析",
            next: "下一题",
            diagnosis: "诊断分析",
            correct_label: "正确答案：",
            ask_ai: "询问 AI",
            add_to_notebook: "加入错题本",
            new_folder_title: "新建文件夹",
            name_label: "名称",
            tags_label: "自定义标签",
            tags_placeholder: "例如：力学",
            cancel: "取消",
            create: "创建",
            toast_success: "操作成功",
            toast_folder_created: "文件夹已创建",
            toast_saved: "已保存",
            toast_added: "已加入错题本",
            toast_fail: "操作失败",
            toast_complete: "恭喜完成",
            toast_finished: "已全部刷完！",
            toast_empty: "空空如也",
            toast_no_qs: "目录暂无题目"
        }
    };

    // --- 3. 全局 App (Layout, Pomo, Music Control) ---
    Alpine.data('globalApp', () => ({
        barOpen: false,
        showSettings: false,
        lang: localStorage.getItem('appLang') || 'zh',
        
        t(key) { return translations[this.lang] ? translations[this.lang][key] || key : key; },
        setLang(l) { this.lang = l; localStorage.setItem('appLang', l); },

        settings: JSON.parse(localStorage.getItem('appSettings')) || { mode: 'light', bgImage: '' },

        music: {
            isPlaying: false,
            currentIdx: 0,
            mode: 'sequence', 
            list: Alpine.store('musicStore').list
        },

        pomo: { active: false, interval: null, defaultDuration: 25 * 60 },
        pomoString: '25:00',
        timeString: '',
        studySeconds: parseInt(localStorage.getItem('todayStudyTime')) || 0,
        studyTimeString: '00:00',

        initGlobal() {
            this.applySettings();
            this.checkPomoStatus();
            this.requestNotifyPermission();

            // 监听播放事件：从任意地方切歌
            document.addEventListener('play-track', (e) => {
                this.music.currentIdx = e.detail.index;
                // 强制重置播放器状态，触发 watch
                this.music.isPlaying = false; 
                this.$nextTick(() => this.togglePlay(true));
            });
            
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

        requestNotifyPermission() {
            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        },
        saveSettings() { localStorage.setItem('appSettings', JSON.stringify(this.settings)); this.applySettings(); },
        setMode(m) { this.settings.mode = m; this.saveSettings(); },
        setBg(url) { this.settings.bgImage = url; this.saveSettings(); },
        applySettings() {
            const root = document.documentElement;
            if (this.settings.mode === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');
        },

        // 音乐控制逻辑
        toggleMusicMode() {
            const modes = ['sequence', 'loop', 'shuffle'];
            this.music.mode = modes[(modes.indexOf(this.music.mode) + 1) % modes.length];
        },
        
        // 稳健的播放控制
        async togglePlay(forcePlay = false) {
            const audio = this.$refs.audioPlayer;
            if (!audio) return;

            try {
                if (forcePlay) {
                    audio.load(); // 关键：切换源时必须重载
                    await audio.play();
                    this.music.isPlaying = true;
                } else {
                    if (audio.paused) {
                        await audio.play();
                        this.music.isPlaying = true;
                    } else {
                        audio.pause();
                        this.music.isPlaying = false;
                    }
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    // 忽略快速切歌时的打断错误
                } else if (err.name === 'NotAllowedError') {
                    alert("请点击页面任意位置以激活音频播放。");
                    this.music.isPlaying = false;
                } else {
                    console.error("播放出错:", err);
                    this.music.isPlaying = false;
                    if(err.code === 4 || err.name === 'NotSupportedError') {
                         alert("该电台链接暂时无法连接，请尝试下一首。");
                    }
                }
            }
        },
        
        nextTrack() {
            const len = this.music.list.length;
            if (this.music.mode === 'shuffle') {
                let newIdx = Math.floor(Math.random() * len);
                while(newIdx === this.music.currentIdx && len > 1) newIdx = Math.floor(Math.random() * len);
                this.music.currentIdx = newIdx;
            } else {
                this.music.currentIdx = (this.music.currentIdx + 1) % len;
            }
            this.music.isPlaying = false;
            this.$nextTick(() => this.togglePlay(true));
        },
        prevTrack() {
            const len = this.music.list.length;
            this.music.currentIdx = (this.music.currentIdx - 1 + len) % len;
            this.music.isPlaying = false;
            this.$nextTick(() => this.togglePlay(true));
        },
        handleTrackEnd() {
            if (this.music.mode === 'loop') {
                const audio = this.$refs.audioPlayer;
                audio.currentTime = 0;
                audio.play();
            } else {
                this.nextTrack();
            }
        },

        // 番茄钟逻辑
        checkPomoStatus() {
            const savedTarget = localStorage.getItem('pomoTargetTime');
            if (savedTarget) {
                const targetTime = parseInt(savedTarget);
                if (targetTime > Date.now()) {
                    this.pomo.active = true;
                    this.startPomoTicker(targetTime);
                } else this.stopPomo(false); 
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
                if (!this.updatePomoDisplay(targetTime)) this.completePomo();
            }, 1000);
        },
        updatePomoDisplay(targetTime) {
            const secondsLeft = Math.round((targetTime - Date.now()) / 1000);
            if (secondsLeft <= 0) return false;
            const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
            const s = (secondsLeft % 60).toString().padStart(2, '0');
            this.pomoString = `${m}:${s}`;
            return true;
        },
        completePomo() {
            this.stopPomo(false);
            const alarm = this.$refs.pomoAlarm;
            if (alarm) alarm.play();
            if (Notification.permission === "granted") new Notification(this.t('toast_complete'));
            if(navigator.vibrate) navigator.vibrate([500, 200, 500]);
            alert(this.t('toast_complete'));
        },
        stopPomo(manual) {
            this.pomo.active = false;
            clearInterval(this.pomo.interval);
            localStorage.removeItem('pomoTargetTime');
            this.pomoString = "25:00";
        }
    }));

    // --- 4. Dashboard App ---
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

    // --- 5. Music Modal App (弹窗逻辑) ---
    Alpine.data('musicModalApp', () => ({
        showMusicModal: false,
        activeTab: 'all',
        
        getDisplayList() {
            const store = Alpine.store('musicStore');
            if (this.activeTab === 'noise') return store.fullList.filter(t => t.type === 'noise');
            if (this.activeTab === 'fav') return store.fullList.filter(t => store.favorites.includes(t.url));
            if (this.activeTab === 'history') return store.history;
            return store.fullList; // Default: All
        },
        
        playTrack(track) {
            // 使用 Store 的 helper 方法播放
            Alpine.store('musicStore').playTrackObject(track);
        },
        
        handleAction(track) {
            // 这里可以扩展：如果是搜索结果点加号就是添加，如果是库里点爱心就是收藏
            // 目前只有库模式，所以只做收藏
            Alpine.store('musicStore').toggleFavorite(track.url);
        },
        
        isFav(track) { return Alpine.store('musicStore').favorites.includes(track.url); }
    }));

    // --- 6. Quiz App ---
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
            if (data.success) { this.showCreateModal = false; this.loadBook(this.bookId); this.showToast('toast_success', 'toast_folder_created'); } 
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
            if(data.success) { this.showAddToBookModal = false; this.showToast('toast_saved', 'toast_added'); } else { alert("Failed."); }
        },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        selectOption(id) { if(!this.submitted) this.selectedOption = id; },
        async loadNext(targetId=null) {
            this.loading = true;
            this.showExplanation = false;
            if (this.mode === 'mistake' && !targetId) {
                this.currentQIndex++;
                if (this.currentQIndex >= this.bookData.questions.length) { this.showToast('toast_complete', 'toast_finished'); this.currentQIndex = -1; this.loading = false; return; }
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
                    if(!res.ok) { if(this.mode === 'mistake') { this.showToast('toast_empty', 'toast_no_qs'); this.currentQIndex = -1; return; } alert("Error loading question"); return; }
                    this.question = await res.json();
                } catch(e) { console.error(e); }
                finally { this.loading = false; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); }
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
    // --- 7. Notes App (Final) ---
    Alpine.data('notesApp', (initialId) => ({
        noteId: initialId,
        viewData: { info: {}, items: [], breadcrumbs: [] },
        editorContent: '',
        renderedContent: '',
        viewMode: 'read', 
        
        showCreateModal: false,
        newItemName: '',
        newItemType: 'file',
        
        // Question Picker Logic
        showQuestionPicker: false,
        pickerData: { sub_notebooks: [], questions: [], breadcrumbs: [] },
        
        showRefModal: false,
        refQuestionContent: '',
        
        aiOpen: false,
        userMsg: '',
        chatHistory: [],
        notify: { show: false, title: '', msg: '' },

        async init() {
            this.setupListeners();
            await this.loadNote(this.noteId);
        },

        showToast(title, msg) {
             this.notify.title = title; this.notify.msg = msg; this.notify.show = true;
             setTimeout(() => this.notify.show = false, 2000);
        },

        async loadNote(id) {
            this.noteId = id;
            const res = await fetch(`/api/notes/view?id=${id}`);
            this.viewData = await res.json();
            if (this.viewData.info.type === 'file') {
                this.editorContent = this.viewData.content || '';
                this.renderMarkdown();
                this.viewMode = 'read';
            }
        },

        setViewMode(mode) {
            this.viewMode = mode;
            if (mode !== 'read') this.$nextTick(() => { if(this.$refs.editorInput) this.$refs.editorInput.focus(); });
            else this.saveNote();
        },

        renderMarkdown() {
            if (!this.editorContent) { this.renderedContent = '<span class="opacity-30 italic">Empty note...</span>'; return; }
            let html = marked.parse(this.editorContent);
            html = html.replace(/\[\[(.*?)\]\]/g, (match, id) => {
                return `<button class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-bold hover:underline cursor-pointer transition-colors select-none" onclick="document.dispatchEvent(new CustomEvent('open-ref', {detail: '${id.trim()}'}))"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>${id.trim()}</button>`;
            });
            this.renderedContent = html;
            this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
        },

        insertText(prefix, suffix = '') {
            const el = this.$refs.editorInput;
            if (!el) return;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const text = this.editorContent;
            this.editorContent = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end, text.length);
            this.renderMarkdown();
            this.$nextTick(() => { el.focus(); el.setSelectionRange(start + prefix.length, end + prefix.length); });
        },

        // --- Picker Navigation ---
        async openQuestionPicker() {
            await this.loadPickerData('root');
            this.showQuestionPicker = true;
        },
        
        async loadPickerData(bookId) {
            try {
                const res = await fetch(`/api/book_details?book=${bookId}`);
                const data = await res.json();
                // Mapping backend format to what picker expects
                this.pickerData = {
                    sub_notebooks: data.sub_notebooks || [],
                    questions: data.questions || [],
                    breadcrumbs: data.breadcrumbs || []
                };
            } catch(e) { console.error(e); }
        },

        insertQuestionRef(qid) {
            this.insertText(`[[${qid}]]`);
            this.showQuestionPicker = false;
            // Auto-switch to edit mode to see the code? No, stay in current mode.
            if(this.viewMode === 'read') this.renderMarkdown(); 
        },

        setupListeners() {
            document.addEventListener('open-ref', async (e) => {
                const qid = e.detail;
                const res = await fetch(`/api/get_question?q_id=${qid}`);
                const data = await res.json();
                if (data.error) this.showToast("Error", "Question not found");
                else {
                    this.refQuestionContent = data.content;
                    this.showRefModal = true;
                    this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
                }
            });
        },
        
        handleLinkClick(e) { /* Handled by global listener */ },

        createItem() {
            if(!this.newItemName.trim()) return;
            let parentId = this.noteId;
            if (this.viewData.info.type === 'file') {
                 const crumbs = this.viewData.breadcrumbs;
                 if (crumbs.length >= 2) parentId = crumbs[crumbs.length - 2].id;
                 else parentId = 'root';
            }
            fetch('/api/notes/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.newItemName, type: this.newItemType, parent: parentId }) })
            .then(r=>r.json()).then(d => {
                if(d.success) { this.showCreateModal = false; this.newItemName = ''; this.loadNote(this.noteId); this.showToast("Success", "Created successfully"); } else alert(d.msg);
            });
        },

        saveNote() {
            fetch('/api/notes/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.noteId, content: this.editorContent }) })
            .then(r=>r.json()).then(d => { if(d.success) this.showToast("Saved", "Note saved!"); });
        },

        toggleAI() { this.aiOpen = !this.aiOpen; },
        async sendMessage() {
            if(!this.userMsg.trim()) return;
            const txt = this.userMsg; this.userMsg = '';
            this.chatHistory.push({ role: 'user', text: txt });
            const context = { note_content: this.editorContent };
            const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: context }) });
            const data = await res.json();
            this.chatHistory.push({ role: 'ai', text: data.reply });
        }
    }));
    // --- 7. Notes App (Fixes: LaTeX, Modal UX) ---
    Alpine.data('notesApp', (initialId) => ({
        noteId: initialId,
        viewData: { info: {}, items: [], breadcrumbs: [] },
        editorContent: '',
        renderedContent: '',
        viewMode: 'read', 
        
        showCreateModal: false,
        newItemName: '',
        newItemType: 'file',
        
        showQuestionPicker: false,
        questionSearchQuery: '',
        allQuestionsList: [],
        
        // Reference Modal State
        showRefModal: false,
        refQuestion: {},
        refFeedback: {},
        refSelected: null,
        refSubmitted: false,
        refShowExplanation: false, // [NEW] 控制解析显示
        
        questionCache: {}, 
        aiOpen: false,
        userMsg: '',
        chatHistory: [],
        notify: { show: false, title: '', msg: '' },

        async init() {
            this.setupListeners();
            await this.loadNote(this.noteId);
        },

        showToast(title, msg) {
             this.notify.title = title; this.notify.msg = msg; this.notify.show = true;
             setTimeout(() => this.notify.show = false, 2000);
        },

        async loadNote(id) {
            this.noteId = id;
            const res = await fetch(`/api/notes/view?id=${id}`);
            this.viewData = await res.json();
            if (this.viewData.info.type === 'file') {
                this.editorContent = this.viewData.content || '';
                this.renderMarkdown();
                this.viewMode = 'read';
            }
        },

        setViewMode(mode) {
            this.viewMode = mode;
            if (mode !== 'read') this.$nextTick(() => { if(this.$refs.editorInput) this.$refs.editorInput.focus(); });
            else this.saveNote();
        },

        // --- 渲染逻辑优化：无缝加载 ---
        renderMarkdown() {
            if (!this.editorContent) { 
                this.renderedContent = '<span class="opacity-30 italic">Empty note...</span>'; 
                return; 
            }
            
            let html = marked.parse(this.editorContent);
            
            // 替换 [[id]]
            html = html.replace(/\[\[(.*?)\]\]/g, (match, id) => {
                const qid = id.trim();
                const qData = this.questionCache[qid];
                
                // [优化] 如果缓存里有，直接渲染卡片！不再显示占位符！
                if (qData && !qData.error) {
                    // 直接调用卡片生成 HTML (Inline)
                    return `
                        <div class="group relative my-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl overflow-hidden"
                             onclick="document.dispatchEvent(new CustomEvent('open-ref', {detail: '${qid}'}))">
                            <div class="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">${qid}</span>
                                    <div class="flex gap-1">
                                        ${(qData.tags || []).map(t => `<span class="text-[10px] opacity-50 font-mono">#${t}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Practice</div>
                            </div>
                            <div class="p-6 prose prose-sm dark:prose-invert max-w-none math-content leading-loose">
                                ${qData.content}
                            </div>
                        </div>
                    `;
                } else {
                    // 缓存没有，才显示占位符 (Pending)
                    return `<div class="question-embed-placeholder my-6" data-qid="${qid}">
                                <div class="flex items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span class="text-xs opacity-50 font-mono">Loading ${qid}...</span>
                                </div>
                            </div>`;
                }
            });
            
            this.renderedContent = html;
            
            // 异步补充那些不在缓存里的题目
            this.$nextTick(async () => { 
                await this.updateQuestionEmbeds();
                if(window.MathJax) MathJax.typesetPromise(); 
            });
        },

        async updateQuestionEmbeds() {
            const Placeholders = document.querySelectorAll('.question-embed-placeholder');
            if (Placeholders.length === 0) return;

            const promises = Array.from(Placeholders).map(async (el) => {
                const qid = el.dataset.qid;
                
                // 双重检查，防止重复请求
                if (this.questionCache[qid]) return; 

                try {
                    const res = await fetch(`/api/get_question?q_id=${qid}`);
                    const qData = await res.json();
                    if (!qData.error) {
                        this.questionCache[qid] = qData;
                        // 数据拿到后，重新渲染整个 Markdown 即可
                        // 这样比手动替换 outerHTML 更安全，且利用了上面的缓存优先逻辑
                        this.renderMarkdown();
                    } else {
                        el.innerHTML = `<span class="text-red-500 text-xs">Error: ${qid}</span>`;
                    }
                } catch(e) {}
            });

            await Promise.all(promises);
        },

        setupListeners() {
            document.addEventListener('open-ref', async (e) => {
                const qid = e.detail;
                await this.openRefModal(qid);
            });
        },

        async openRefModal(qid) {
            // 重置状态
            this.refSelected = null;
            this.refSubmitted = false;
            this.refFeedback = {};
            this.refShowExplanation = false; // 默认不显示解析
            
            let qData = this.questionCache[qid];
            if(!qData) {
                const res = await fetch(`/api/get_question?q_id=${qid}`);
                qData = await res.json();
                this.questionCache[qid] = qData;
            }
            
            if (qData.error) {
                this.showToast("Error", "Question not found");
            } else {
                this.refQuestion = qData;
                this.showRefModal = true;
                // 弹窗打开后，渲染里面的公式
                this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
            }
        },

        selectRefOption(id) { 
            if(!this.refSubmitted) this.refSelected = id; 
        },
        
        async submitRef() {
            if(!this.refSelected) return;
            const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ q_id: this.refQuestion.id, choice: this.refSelected }) });
            this.refFeedback = await res.json();
            this.refSubmitted = true;
            this.refShowExplanation = true; // 提交后自动展开解析（可选，也可保持折叠）
            // 渲染解析里的公式
            this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
        },
        
        getRefOptionClass(id) {
            let base = 'group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border ';
            if (this.refSelected === id && !this.refSubmitted) return base + 'bg-blue-500/10 border-blue-500 text-blue-600 ring-1 ring-blue-500';
            if (this.refSubmitted) {
                if (id === this.refFeedback.correct_id) return base + 'bg-green-500/20 border-green-500 text-green-700';
                if (id === this.refSelected) return base + 'bg-red-500/20 border-red-500 text-red-700';
                return base + 'opacity-40 grayscale border-transparent';
            }
            return base + 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5';
        },
        
        // ... (其余函数保持不变) ...
        insertText(prefix, suffix = '') {
            const el = this.$refs.editorInput;
            if (!el) return;
            const start = el.selectionStart; const end = el.selectionEnd;
            const text = this.editorContent;
            this.editorContent = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end, text.length);
            this.renderMarkdown();
            this.$nextTick(() => { el.focus(); el.setSelectionRange(start + prefix.length, end + prefix.length); });
        },
        async openQuestionPicker() {
            if (this.allQuestionsList.length === 0) {
                const res = await fetch(`/api/book_details?book=root`);
                const data = await res.json();
                this.allQuestionsList = data.questions || []; 
            }
            this.showQuestionPicker = true;
        },
        get filteredQuestions() {
            if (!this.questionSearchQuery) return this.allQuestionsList.slice(0, 10);
            const q = this.questionSearchQuery.toLowerCase();
            return this.allQuestionsList.filter(item => (item.summary || '').toLowerCase().includes(q) || item.id.toLowerCase().includes(q)).slice(0, 20);
        },
        insertQuestionRef(qid) { this.insertText(`[[${qid}]]`); this.showQuestionPicker = false; },
        createItem() {
            if(!this.newItemName.trim()) return;
            let parentId = this.noteId;
            if (this.viewData.info.type === 'file') {
                 const crumbs = this.viewData.breadcrumbs;
                 if (crumbs.length >= 2) parentId = crumbs[crumbs.length - 2].id; else parentId = 'root';
            }
            fetch('/api/notes/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.newItemName, type: this.newItemType, parent: parentId }) })
            .then(r=>r.json()).then(d => {
                if(d.success) { this.showCreateModal = false; this.newItemName = ''; this.loadNote(this.noteId); this.showToast("Success", "Created successfully"); } else alert(d.msg);
            });
        },
        saveNote() {
            fetch('/api/notes/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.noteId, content: this.editorContent }) })
            .then(r=>r.json()).then(d => { if(d.success) this.showToast("Saved", "Note saved!"); });
        },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        async sendMessage() {
            if(!this.userMsg.trim()) return;
            const txt = this.userMsg; this.userMsg = '';
            this.chatHistory.push({ role: 'user', text: txt });
            const context = { note_content: this.editorContent };
            const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: context }) });
            const data = await res.json();
            this.chatHistory.push({ role: 'ai', text: data.reply });
        }
    }));
});