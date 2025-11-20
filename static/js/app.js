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

    // --- 3. Global App (Handles Layout, Music, Toast) ---
    Alpine.data('globalApp', () => ({
        barOpen: false,
        showSettings: false,
        lang: localStorage.getItem('appLang') || 'zh',
        settings: JSON.parse(localStorage.getItem('appSettings')) || { mode: 'light', bgImage: '' },
        music: { isPlaying: false, currentIdx: 0, mode: 'sequence', list: Alpine.store('musicStore').list },
        pomo: { active: false, interval: null, defaultDuration: 25 * 60 },
        pomoString: '25:00', timeString: '', studySeconds: parseInt(localStorage.getItem('todayStudyTime')) || 0, studyTimeString: '00:00',
        
        // [NEW] Global Toast State
        notify: { show: false, title: '', msg: '' },

        t(key) { return translations[this.lang] ? translations[this.lang][key] || key : key; },
        setLang(l) { this.lang = l; localStorage.setItem('appLang', l); },

        initGlobal() {
            this.applySettings();
            this.checkPomoStatus();
            document.addEventListener('play-track', (e) => {
                this.music.currentIdx = e.detail.index;
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

        // [NEW] Global Toast Handler
        handleGlobalToast(detail) {
            this.notify.title = detail.title || 'Notice';
            this.notify.msg = detail.msg || '';
            this.notify.show = true;
            setTimeout(() => { this.notify.show = false; }, 2000);
        },

        saveSettings() { localStorage.setItem('appSettings', JSON.stringify(this.settings)); this.applySettings(); },
        setMode(m) { this.settings.mode = m; this.saveSettings(); },
        setBg(url) { this.settings.bgImage = url; this.saveSettings(); },
        applySettings() {
            const root = document.documentElement;
            if (this.settings.mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
        },
        toggleMusicMode() { const modes = ['sequence', 'loop', 'shuffle']; this.music.mode = modes[(modes.indexOf(this.music.mode) + 1) % modes.length]; },
        async togglePlay(forcePlay = false) {
            const audio = this.$refs.audioPlayer;
            if (!audio) return;
            try {
                if (forcePlay) { audio.load(); await audio.play(); this.music.isPlaying = true; } 
                else { if (audio.paused) { await audio.play(); this.music.isPlaying = true; } else { audio.pause(); this.music.isPlaying = false; } }
            } catch (err) { this.music.isPlaying = false; }
        },
        nextTrack() {
            const len = this.music.list.length;
            if (this.music.mode === 'shuffle') { this.music.currentIdx = Math.floor(Math.random() * len); } 
            else { this.music.currentIdx = (this.music.currentIdx + 1) % len; }
            this.music.isPlaying = false; this.$nextTick(() => this.togglePlay(true));
        },
        prevTrack() { const len = this.music.list.length; this.music.currentIdx = (this.music.currentIdx - 1 + len) % len; this.music.isPlaying = false; this.$nextTick(() => this.togglePlay(true)); },
        handleTrackEnd() { if (this.music.mode === 'loop') { this.$refs.audioPlayer.currentTime = 0; this.$refs.audioPlayer.play(); } else { this.nextTrack(); } },
        
        checkPomoStatus() {
            const savedTarget = localStorage.getItem('pomoTargetTime');
            if (savedTarget && parseInt(savedTarget) > Date.now()) { this.pomo.active = true; this.startPomoTicker(parseInt(savedTarget)); } else this.stopPomo(false); 
        },
        togglePomo() {
            if (this.pomo.active) this.stopPomo(true);
            else {
                const targetTime = Date.now() + (this.pomo.defaultDuration * 1000);
                localStorage.setItem('pomoTargetTime', targetTime);
                this.pomo.active = true;
                this.startPomoTicker(targetTime);
            }
        },
        startPomoTicker(targetTime) {
            this.updatePomoDisplay(targetTime);
            if (this.pomo.interval) clearInterval(this.pomo.interval);
            this.pomo.interval = setInterval(() => { if (!this.updatePomoDisplay(targetTime)) this.completePomo(); }, 1000);
        },
        updatePomoDisplay(targetTime) {
            const secondsLeft = Math.round((targetTime - Date.now()) / 1000);
            if (secondsLeft <= 0) return false;
            const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
            const s = (secondsLeft % 60).toString().padStart(2, '0');
            this.pomoString = `${m}:${s}`;
            return true;
        },
        completePomo() { this.stopPomo(false); const alarm = this.$refs.pomoAlarm; if (alarm) alarm.play(); alert("Focus Complete!"); },
        stopPomo(manual) { this.pomo.active = false; clearInterval(this.pomo.interval); localStorage.removeItem('pomoTargetTime'); this.pomoString = "25:00"; }
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
    // --- 7. Notes App (Final: Drag/Drop, Context Menu, Instant Rename) ---
    Alpine.data('notesApp', (initialId) => ({
        noteId: initialId,
        viewData: { info: {}, items: [], breadcrumbs: [] },
        editorContent: '', renderedContent: '', viewMode: 'read', 
        
        showCreateModal: false, newItemName: '', newItemType: 'file',
        contextMenu: { show: false, x: 0, y: 0, item: null, type: 'item' },
        modals: { rename: { show: false, newName: '', item: null }, delete: { show: false, item: null }, move: { show: false, item: null, currentFolders: [], breadcrumbs: [], selectedTarget: null } },
        dragState: { draggingId: null, draggingIndex: null },

        showQuestionPicker: false, questionSearchQuery: '', allQuestionsList: [],
        showRefModal: false, refQuestion: {}, refFeedback: {}, refSelected: null, refSubmitted: false, refShowExplanation: false, 
        questionCache: {}, aiOpen: false, userMsg: '', chatHistory: [],

        // [NOTE] Local notify object REMOVED, using global now

        async init() {
            this.setupListeners();
            await this.loadNote(this.noteId);
            document.addEventListener('click', () => this.closeContextMenu());
        },

        // [CHANGED] Helper to trigger Global Toast
        showToast(title, msg) { window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, msg } })); },

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

        // [UPDATED] Inline Rename with Instant UI Update
        async renameCurrentNote() {
            const newName = this.viewData.info.name;
            if (!newName || !newName.trim()) return;
            const id = this.viewData.info.id;

            const res = await fetch('/api/notes/rename', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: id, name: newName })
            });
            
            if((await res.json()).success) {
                this.showToast('Success', 'Renamed');
                // Instant Update: Update local items array if current note is in the list
                const itemIndex = this.viewData.items.findIndex(i => i.id === id);
                if (itemIndex !== -1) {
                    this.viewData.items[itemIndex].name = newName;
                }
            }
        },

        // --- Context Menu & Actions ---
        openContextMenu(e, item) { this.contextMenu.type = 'item'; this.contextMenu.item = item; this.setMenuPosition(e); },
        openEmptyContextMenu(e) { this.contextMenu.type = 'empty'; this.contextMenu.item = null; this.setMenuPosition(e); },
        setMenuPosition(e) { this.contextMenu.x = e.clientX; this.contextMenu.y = e.clientY; if (window.innerHeight - e.clientY < 200) this.contextMenu.y -= 200; this.contextMenu.show = true; },
        closeContextMenu() { this.contextMenu.show = false; },

        promptRename() { this.modals.rename.item = this.contextMenu.item; this.modals.rename.newName = this.contextMenu.item.name; this.modals.rename.show = true; this.closeContextMenu(); },
        
        // [UPDATED] Rename with Instant Update
        async submitRename() {
            const target = this.modals.rename.item;
            const name = this.modals.rename.newName;
            if (!name.trim()) return;
            const res = await fetch('/api/notes/rename', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: target.id, name: name }) });
            if((await res.json()).success) {
                this.modals.rename.show = false;
                // Update Local List Instantly
                const idx = this.viewData.items.findIndex(i => i.id === target.id);
                if (idx !== -1) this.viewData.items[idx].name = name;
                // If renaming current open file, update header
                if (this.viewData.info.id === target.id) this.viewData.info.name = name;
                
                this.showToast('Success', 'Renamed');
            }
        },
        
        promptDelete() { this.modals.delete.item = this.contextMenu.item; this.modals.delete.show = true; this.closeContextMenu(); },
        async submitDelete() {
            const target = this.modals.delete.item;
            const res = await fetch('/api/notes/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: target.id }) });
            if((await res.json()).success) {
                this.modals.delete.show = false;
                if (this.noteId === target.id) {
                    const parentId = this.viewData.breadcrumbs.length >= 2 ? this.viewData.breadcrumbs[this.viewData.breadcrumbs.length - 2].id : 'root';
                    this.loadNote(parentId);
                } else {
                    this.viewData.items = this.viewData.items.filter(i => i.id !== target.id); // Instant remove
                }
                this.showToast('Success', 'Deleted');
            }
        },
        
        async promptMove() { this.modals.move.item = this.contextMenu.item; this.modals.move.show = true; this.modals.move.selectedTarget = null; this.closeContextMenu(); await this.loadMoveFolder('root'); },
        async loadMoveFolder(folderId) {
            try { const res = await fetch(`/api/notes/view?id=${folderId}`); const data = await res.json();
                this.modals.move.currentFolders = data.items.filter(i => i.type === 'folder' && i.id !== this.modals.move.item.id);
                if (folderId === 'root') { this.modals.move.breadcrumbs = []; this.modals.move.selectedTarget = 'root'; } else this.modals.move.breadcrumbs = data.breadcrumbs || [];
            } catch(e) { console.error(e); }
        },
        selectMoveTarget(folder) { this.modals.move.selectedTarget = folder.id; },
        async submitMove() {
            const res = await fetch('/api/notes/move', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.modals.move.item.id, target: this.modals.move.selectedTarget }) });
            if ((await res.json()).success) {
                this.modals.move.show = false;
                this.viewData.items = this.viewData.items.filter(i => i.id !== this.modals.move.item.id); // Instant remove from current view
                this.showToast('Success', 'Moved successfully');
            }
        },

        // --- Drag & Drop ---
        handleDragStart(e, item, index) { this.dragState.draggingId = item.id; this.dragState.draggingIndex = index; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); },
        handleDragOver(e, index) { if (this.dragState.draggingIndex === index) return; },
        handleDrop(e, dropIndex) {
            const dragIndex = this.dragState.draggingIndex; if (dragIndex === null || dragIndex === dropIndex) return;
            const items = this.viewData.items; const itemToMove = items[dragIndex];
            items.splice(dragIndex, 1); items.splice(dropIndex, 0, itemToMove); // Instant UI update
            this.handleDragEnd(); this.saveOrder();
        },
        handleDragEnd() { this.dragState.draggingId = null; this.dragState.draggingIndex = null; },
        async saveOrder() {
            let parentId = this.viewData.info.id; if (this.viewData.info.type === 'file') { const crumbs = this.viewData.breadcrumbs; parentId = crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : 'root'; }
            await fetch('/api/notes/reorder', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ parent_id: parentId, order: this.viewData.items.map(i => i.id) }) });
        },
        async sortItems(method) {
            if (method === 'name') this.viewData.items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
            else if (method === 'date') this.viewData.items.sort((a, b) => b.created_at - a.created_at);
            this.closeContextMenu(); this.saveOrder(); this.showToast('Sorted', `By ${method}`);
        },

        // --- Editor & Standard Logic ---
        setViewMode(mode) { this.viewMode = mode; if (mode !== 'read') this.$nextTick(() => { if(this.$refs.editorInput) this.$refs.editorInput.focus(); }); else this.saveNote(); },
        renderMarkdown() {
            if (!this.editorContent) { this.renderedContent = '<span class="opacity-30 italic">Empty note...</span>'; return; }
            let html = marked.parse(this.editorContent);
            html = html.replace(/\[\[(.*?)\]\]/g, (match, id) => {
                const qid = id.trim(); const qData = this.questionCache[qid];
                if (qData && !qData.error) return `<div class="group relative my-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl overflow-hidden" onclick="document.dispatchEvent(new CustomEvent('open-ref', {detail: '${qid}'}))"><div class="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center"><div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">${qid}</span></div><div class="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Practice</div></div><div class="p-6 prose prose-sm dark:prose-invert max-w-none math-content leading-loose">${qData.content}</div></div>`;
                return `<div class="question-embed-placeholder my-6" data-qid="${qid}"><div class="flex items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"><div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div><span class="text-xs opacity-50 font-mono">Loading ${qid}...</span></div></div>`;
            });
            this.renderedContent = html; this.$nextTick(async () => { await this.updateQuestionEmbeds(); if(window.MathJax) MathJax.typesetPromise(); });
        },
        async updateQuestionEmbeds() {
            const Placeholders = document.querySelectorAll('.question-embed-placeholder'); if (Placeholders.length === 0) return;
            const promises = Array.from(Placeholders).map(async (el) => { const qid = el.dataset.qid; if (this.questionCache[qid]) return; try { const res = await fetch(`/api/get_question?q_id=${qid}`); const qData = await res.json(); if (!qData.error) { this.questionCache[qid] = qData; this.renderMarkdown(); } else { el.innerHTML = `<span class="text-red-500 text-xs">Error: ${qid}</span>`; } } catch(e) {} }); await Promise.all(promises);
        },
        setupListeners() { document.addEventListener('open-ref', async (e) => { await this.openRefModal(e.detail); }); },
        async openRefModal(qid) { this.refSelected = null; this.refSubmitted = false; this.refFeedback = {}; this.refShowExplanation = false; let qData = this.questionCache[qid]; if(!qData) { const res = await fetch(`/api/get_question?q_id=${qid}`); qData = await res.json(); this.questionCache[qid] = qData; } if (qData.error) { this.showToast("Error", "Question not found"); } else { this.refQuestion = qData; this.showRefModal = true; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); } },
        selectRefOption(id) { if(!this.refSubmitted) this.refSelected = id; },
        async submitRef() { if(!this.refSelected) return; const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ q_id: this.refQuestion.id, choice: this.refSelected }) }); this.refFeedback = await res.json(); this.refSubmitted = true; this.refShowExplanation = true; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); },
        getRefOptionClass(id) { return this.refSelected===id && !this.refSubmitted ? 'bg-blue-500/10 border-blue-500 text-blue-600 ring-1 ring-blue-500 group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border' : (this.refSubmitted ? (id===this.refFeedback.correct_id ? 'bg-green-500/20 border-green-500 text-green-700 group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border' : (id===this.refSelected ? 'bg-red-500/20 border-red-500 text-red-700 group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border' : 'opacity-40 grayscale border-transparent group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border')) : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border'); },
        insertText(prefix, suffix = '') { const el = this.$refs.editorInput; if (!el) return; const s = el.selectionStart; const e = el.selectionEnd; const t = this.editorContent; this.editorContent = t.substring(0, s) + prefix + t.substring(s, e) + suffix + t.substring(e, t.length); this.renderMarkdown(); this.$nextTick(() => { el.focus(); el.setSelectionRange(s + prefix.length, e + prefix.length); }); },
        async openQuestionPicker() { if (this.allQuestionsList.length === 0) { const res = await fetch(`/api/book_details?book=root`); const data = await res.json(); this.allQuestionsList = data.questions || []; } this.showQuestionPicker = true; },
        get filteredQuestions() { if (!this.questionSearchQuery) return this.allQuestionsList.slice(0, 10); const q = this.questionSearchQuery.toLowerCase(); return this.allQuestionsList.filter(i => (i.summary || '').toLowerCase().includes(q) || i.id.toLowerCase().includes(q)).slice(0, 20); },
        insertQuestionRef(qid) { this.insertText(`[[${qid}]]`); this.showQuestionPicker = false; },
        createItem() {
            if(!this.newItemName.trim()) return;
            let parentId = this.noteId; if (this.viewData.info.type === 'file') { const crumbs = this.viewData.breadcrumbs; parentId = crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : 'root'; }
            fetch('/api/notes/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.newItemName, type: this.newItemType, parent: parentId }) })
            .then(r=>r.json()).then(d => { if(d.success) { this.showCreateModal = false; this.newItemName = ''; this.loadNote(parentId); this.showToast("Success", "Created successfully"); } });
        },
        saveNote() { fetch('/api/notes/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.noteId, content: this.editorContent }) }).then(r=>r.json()).then(d => { if(d.success) this.showToast("Saved", "Note saved!"); }); },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        async sendMessage() { if(!this.userMsg.trim()) return; const txt = this.userMsg; this.userMsg = ''; this.chatHistory.push({ role: 'user', text: txt }); const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: { note_content: this.editorContent } }) }); const data = await res.json(); this.chatHistory.push({ role: 'ai', text: data.reply }); }
    }));
});