document.addEventListener('alpine:init', () => {

    // --- 1. 核心数据仓库 (Shared Music Store) ---
    Alpine.store('musicStore', {
        list: [], 
        fullList: [],
        favorites: JSON.parse(localStorage.getItem('musicFavs')) || [],
        history: JSON.parse(localStorage.getItem('musicHistory')) || [],
        
        init() {
            // ================= [用户自定义区] =================
            const myRadios = [
                { 
                    title: "Lofi HipHop Radio", 
                    artist: "Lofi Girl Mirror", 
                    type: 'radio', 
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
        
        playAtIndex(index) {
            const track = this.list[index];
            this.addToHistory(track);
            document.dispatchEvent(new CustomEvent('play-track', { detail: { index: index } }));
        },

        playTrackObject(track) {
            let idx = this.list.findIndex(t => t.url === track.url);
            if (idx === -1) {
                this.list.push(track);
                idx = this.list.length - 1;
            }
            this.playAtIndex(idx);
        },
        
        addToHistory(track) {
            if (!track) return;
            this.history = this.history.filter(t => t.url !== track.url);
            this.history.unshift(track);
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
            tab_all: "Library",
            tab_noise: "White Noise",
            tab_fav: "Favorites",
            tab_history: "History",
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
            tab_all: "电台与白噪音",
            tab_noise: "纯净白噪音",
            tab_fav: "我的收藏",
            tab_history: "播放历史",
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

        toggleMusicMode() {
            const modes = ['sequence', 'loop', 'shuffle'];
            this.music.mode = modes[(modes.indexOf(this.music.mode) + 1) % modes.length];
        },
        
        async togglePlay(forcePlay = false) {
            const audio = this.$refs.audioPlayer;
            if (!audio) return;

            try {
                if (forcePlay) {
                    audio.load();
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

    // --- 5. Music Modal App ---
    Alpine.data('musicModalApp', () => ({
        showMusicModal: false,
        activeTab: 'all',
        
        getDisplayList() {
            const store = Alpine.store('musicStore');
            if (this.activeTab === 'noise') return store.fullList.filter(t => t.type === 'noise');
            if (this.activeTab === 'fav') return store.fullList.filter(t => store.favorites.includes(t.url));
            if (this.activeTab === 'history') return store.history;
            return store.fullList; 
        },
        
        playTrack(track) {
            Alpine.store('musicStore').playTrackObject(track);
        },
        
        handleAction(track) {
            Alpine.store('musicStore').toggleFavorite(track.url);
        },
        
        isFav(track) { return Alpine.store('musicStore').favorites.includes(track.url); }
    }));

    // --- 6. Quiz App (Enhanced: Notebook Mgmt & Related Notes) ---
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
        
        // Navigation History
        historyStack: [],
        futureStack: [],
        isNavigating: false,
        // Notebook Mgmt States
        showCreateModal: false,
        subBookName: '',
        subBookTags: '',
        showAddToBookModal: false,
        notebooksList: [],
        
        // Context Menu & DragDrop
        ctxMenu: { show: false, x: 0, y: 0, item: null, type: 'folder' }, // 'folder' or 'question'
        renameModal: { show: false, name: '' },
        moveModal: { show: false, currentPath: [], items: [], targetId: 'root' },
        dragSource: null, // { type: 'folder'|'question', index: int }
        
        // Related Notes
        relatedNotes: [],
        
        notify: { show: false, title: '', msg: '' },

        async init() {
            if (this.mode === 'mistake') await this.loadBook(this.bookId);
            else this.loadNext();
            document.addEventListener('click', () => this.ctxMenu.show = false);
        },
        
        goBack() {
            if (this.historyStack.length === 0) return;
            this.isNavigating = true;
            this.futureStack.push(this.bookId);
            const prevId = this.historyStack.pop();
            this.loadBook(prevId);
        },
        goForward() {
            if (this.futureStack.length === 0) return;
            this.isNavigating = true;
            this.historyStack.push(this.bookId);
            const nextId = this.futureStack.pop();
            this.loadBook(nextId);
        },

        showToast(titleKey, msgKey) {
            // 简单兼容直接传字符串的情况
            const lang = localStorage.getItem('appLang') || 'zh';
            const t = translations[lang] || translations['en'];
            this.notify.title = t[titleKey] || titleKey;
            this.notify.msg = t[msgKey] || msgKey;
            this.notify.show = true;
            setTimeout(() => { this.notify.show = false; }, 2000);
        },

        async loadBook(targetId) {
            // --- History Logic Start ---
            if (!this.isNavigating && this.bookId && this.bookId !== targetId) {
                this.historyStack.push(this.bookId);
                this.futureStack = [];
            }
            this.isNavigating = false;
            // --- History Logic End ---

            this.loading = true;
            this.bookId = targetId;
            this.currentQIndex = -1; 
            
            this.bookData = { info: { name: 'Loading...' }, stats: {}, sub_notebooks: [], questions: [], breadcrumbs: [] };

            try {
                const res = await fetch(`/api/book_details?book=${targetId}`);
                this.bookData = await res.json();
            } catch(e) { console.error(e); }
            finally { this.loading = false; }
        },

        // --- Drag & Drop Logic ---
        handleDragStart(e, type, index) {
            this.dragSource = { type, index };
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('opacity-50');
        },
        handleDragEnd(e) {
            e.target.classList.remove('opacity-50');
            // Clean up visual cues
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'border-blue-500', 'border-dashed'));
        },
        handleDragOver(e, type, index) {
            if (!this.dragSource || this.dragSource.type !== type) return; // Only same type sorting
            e.preventDefault();
            e.currentTarget.classList.add('drag-over', 'border-blue-500', 'border-dashed');
        },
        handleDragLeave(e) {
            e.currentTarget.classList.remove('drag-over', 'border-blue-500', 'border-dashed');
        },
        async handleDrop(e, targetType, targetIndex) {
            e.preventDefault();
            this.handleDragEnd(e);
            
            if (!this.dragSource || this.dragSource.type !== targetType || this.dragSource.index === targetIndex) return;

            const listKey = targetType === 'folder' ? 'sub_notebooks' : 'questions';
            const list = this.bookData[listKey];
            
            // 1. Optimistic Update
            const [moved] = list.splice(this.dragSource.index, 1);
            list.splice(targetIndex, 0, moved);
            this.bookData[listKey] = list;

            // 2. Backend Sync
            const payload = { id: this.bookId };
            if (targetType === 'folder') payload.sub_order = list.map(i => i.id);
            else payload.q_order = list.map(i => i.id);
            
            await fetch('/api/notebooks/reorder', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        },

        // --- Context Menu ---
        handleContextMenu(e, item, type) {
            this.ctxMenu.item = item;
            this.ctxMenu.type = type;
            this.ctxMenu.x = e.clientX;
            this.ctxMenu.y = e.clientY;
            this.ctxMenu.show = true;
        },
        
        // --- Rename ---
        openRenameModal() { 
            this.renameModal.name = this.ctxMenu.item.name; 
            this.renameModal.show = true; 
            this.ctxMenu.show = false; 
        },
        async confirmRename() {
            if (!this.renameModal.name.trim()) return;
            const res = await fetch('/api/notebooks/rename', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.ctxMenu.item.id, name: this.renameModal.name }) });
            if ((await res.json()).success) {
                this.showToast("toast_success", "Renamed");
                this.renameModal.show = false;
                this.loadBook(this.bookId);
            }
        },

        // --- Delete ---
        async deleteItem() {
            if(!confirm("Are you sure you want to delete this?")) return;
            // 如果是文件夹调用 delete_notebook，如果是题目暂未实现（可加 remove 接口）
            // 暂时只实现文件夹删除
            if (this.ctxMenu.type === 'folder') {
                const res = await fetch('/api/notebooks/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.ctxMenu.item.id }) });
                if ((await res.json()).success) {
                    this.ctxMenu.show = false;
                    this.loadBook(this.bookId);
                }
            }
        },

        // --- Move (Folders Only for now) ---
        async openMoveModal() {
            this.ctxMenu.show = false;
            this.moveModal.show = true;
            await this.loadMovePicker('root');
        },
        async loadMovePicker(folderId) {
            const res = await fetch(`/api/book_details?book=${folderId}`);
            const data = await res.json();
            this.moveModal.items = data.sub_notebooks || [];
            this.moveModal.currentPath = data.breadcrumbs || [];
            this.moveModal.targetId = folderId;
        },
        async confirmMove() { 
            // 1. 校验参数
            if (!this.ctxMenu.item) {
                alert("No item selected");
                return;
            }
            // 目标文件夹 ID
            const targetId = this.moveModal.targetId;
            // 当前项目 ID
            const itemId = this.ctxMenu.item.id;

            if (targetId === itemId) return; // 不能移给自己
            
            // 2. 发送请求
            const res = await fetch('/api/notes/move', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ 
                    id: itemId, 
                    parent: targetId 
                }) 
            }); 
            
            const d = await res.json();
            
            // 3. 处理结果
            if(d.success) { 
                this.showToast("Success", "Item moved"); 
                
                // 关闭所有相关弹窗
                this.moveModal.show = false; 
                this.ctxMenu.show = false;
                
                // 4. 关键：刷新视图
                // 重新加载当前正在浏览的页面，以移除已移走的项目
                await this.loadNote(this.noteId); 
            } else {
                alert(d.msg || "Move failed");
            }
        },

        // --- Related Notes Logic ---
        async fetchRelatedNotes() {
            this.relatedNotes = [];
            if (!this.question.id) return;
            const res = await fetch(`/api/get_related_notes?q_id=${this.question.id}`);
            this.relatedNotes = await res.json();
        },
        
        // --- Standard Quiz Functions (Modified) ---
        async jumpToQuestion(index) {
            this.currentQIndex = index;
            await this.loadNext(this.bookData.questions[index].id);
        },
        async loadNext(targetId=null) {
            this.loading = true;
            this.showExplanation = false;
            this.relatedNotes = []; // Clear previous notes
            
            if (this.mode === 'mistake' && !targetId) {
                this.currentQIndex++;
                if (this.currentQIndex >= this.bookData.questions.length) { this.showToast('toast_complete', 'toast_finished'); this.currentQIndex = -1; this.loading = false; return; }
                targetId = this.bookData.questions[this.currentQIndex].id;
            }
            setTimeout(async () => {
                this.submitted = false; this.selectedOption = null; this.feedback = {};
                let url = `/api/get_question?mode=${this.mode}`;
                if (targetId) url += `&q_id=${targetId}`;
                if (this.mode === 'mistake') url += `&book=${this.bookId}`;
                try {
                    const res = await fetch(url);
                    if(!res.ok) { if(this.mode === 'mistake') { this.showToast('toast_empty', 'toast_no_qs'); this.currentQIndex = -1; return; } alert("Error"); return; }
                    this.question = await res.json();
                } catch(e) { console.error(e); }
                finally { this.loading = false; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); }
            }, 300);
        },
        
        async submit() {
            if(!this.selectedOption) return;
            const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ q_id: this.question.id, choice: this.selectedOption }) });
            this.feedback = await res.json();
            this.submitted = true;
            this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); });
            
            // Fetch related notes immediately upon submission (so they are ready when Analysis is clicked)
            this.fetchRelatedNotes();
            
            if (!this.feedback.is_correct) setTimeout(() => { this.showExplanation = true; }, 800);
        },
        
        async fetchRelatedNotes() {
            this.relatedNotes = [];
            if (!this.question.id) return;
            try {
                const res = await fetch(`/api/get_related_notes?q_id=${this.question.id}`);
                this.relatedNotes = await res.json();
            } catch(e) { console.error(e); }
        },

        // ... (Helpers: getOptionClass, toggleAI, etc. keep unchanged) ...
        getOptionClass(id) { let base = 'backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer overflow-hidden border border-transparent hover:scale-[1.01] active:scale-[0.99] '; let theme = 'bg-white/70 hover:bg-white/90 dark:bg-black/20 dark:hover:bg-white/5 dark:border-gray-700 '; if (this.selectedOption === id && !this.submitted) return 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500 shadow-md ' + base; if (this.submitted) { if (id === this.feedback.correct_id) return 'bg-green-500/20 border-green-500 text-green-800 dark:text-green-400 ' + base; if (id === this.selectedOption) return 'bg-red-500/20 border-red-500 text-red-800 dark:text-red-400 ' + base; return theme + 'opacity-40 grayscale ' + base; } return theme + base; },
        getOptionCircleClass(id) { if (this.selectedOption === id && !this.submitted) return 'border-blue-500 text-blue-500 bg-transparent'; if (this.submitted && id === this.feedback.correct_id) return 'border-green-500 bg-green-500 text-white'; if (this.submitted && id === this.selectedOption) return 'border-red-500 bg-red-500 text-white'; return 'border-gray-300 dark:border-gray-600 text-gray-400'; },
        async openAddToBookModal() { const res = await fetch('/api/get_notebooks'); this.notebooksList = await res.json(); this.showAddToBookModal = true; },
        async addToBook(targetBookId) { const res = await fetch('/api/add_to_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ book_id: targetBookId, q_id: this.question.id }) }); const data = await res.json(); if(data.success) { this.showAddToBookModal = false; this.showToast('toast_saved', 'toast_added'); } else { alert("Failed."); } },
        createSubBook() { this.subBookName = ''; this.subBookTags = ''; this.showCreateModal = true; },
        async confirmCreateSubBook() { if (!this.subBookName.trim()) return; const res = await fetch('/api/create_book', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: this.subBookName, parent: this.bookId, tags: this.subBookTags }) }); const data = await res.json(); if (data.success) { this.showCreateModal = false; this.loadBook(this.bookId); this.showToast('toast_success', 'toast_folder_created'); } else alert(data.msg); },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        selectOption(id) { if(!this.submitted) this.selectedOption = id; },
        async sendMessage() { if(!this.userMsg.trim()) return; const txt = this.userMsg; this.userMsg = ''; this.chatHistory.push({ role: 'user', text: txt }); const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: this.question.ai_context }) }); const data = await res.json(); this.chatHistory.push({ role: 'ai', text: data.reply }); }
    }));

    // --- 7. Notes App (Ultimate Edition) ---
    Alpine.data('notesApp', (initialId) => ({
        noteId: initialId,
        viewData: { info: {}, items: [], breadcrumbs: [], backlinks: [] },
        editorContent: '',
        renderedContent: '',
        viewMode: 'read', 

        // Navigation History
        historyStack: [],
        futureStack: [],
        isNavigating: false,
        
        // UI States
        showCreateModal: false,
        newItemName: '',
        newItemType: 'file',
        
        // Context Menu States
        ctxMenu: { show: false, x: 0, y: 0, item: null, type: 'item' }, 
        
        // Modals: Rename & Move
        renameModal: { show: false, name: '' },
        moveModal: { show: false, currentPath: [], items: [] },
        
        // Note Link Picker (For [[note:id]])
        showNotePicker: false,
        noteSearchQuery: '',
        noteSearchResults: [],
        
        // Auto Save & Notification
        saveTimer: null,
        lastSavedContent: '',
        showAutoSaveNotify: false,
        saveNotifyText: 'Auto Saved', 
        
        // Drag & Drop
        dragSourceIndex: null,
        
        // Question Import / Picker
        showQuestionPicker: false,
        pickerData: { sub_notebooks: [], questions: [], breadcrumbs: [] }, 
        questionSearchQuery: '',
        allQuestionsList: [],
        
        // Reference Modal (Embedded Question Preview)
        showRefModal: false,
        refQuestion: {},
        refFeedback: {},
        refSelected: null,
        refSubmitted: false,
        refShowExplanation: false, 
        
        // Caches
        questionCache: {}, 
        noteCache: {}, // Cache for Note Names
        
        // AI
        aiOpen: false,
        userMsg: '',
        chatHistory: [],
        notify: { show: false, title: '', msg: '' },

        async init() {
            this.setupListeners();
            // 全局点击关闭右键菜单
            document.addEventListener('click', () => this.ctxMenu.show = false);
            
            // 监听内容变化 -> 自动保存
            this.$watch('editorContent', (val) => {
                if (this.viewData.info.type === 'file' && val !== this.lastSavedContent) {
                    clearTimeout(this.saveTimer);
                    this.saveTimer = setTimeout(() => this.saveNote(true), 2000); 
                }
            });
            
            // 监听笔记搜索输入
            this.$watch('noteSearchQuery', (val) => this.searchNotes(val));
            
            await this.loadNote(this.noteId);
        },

        goBack() {
            if (this.historyStack.length === 0) return;
            this.isNavigating = true;
            this.futureStack.push(this.noteId);
            const prevId = this.historyStack.pop();
            this.loadNote(prevId);
        },
        goForward() {
            if (this.futureStack.length === 0) return;
            this.isNavigating = true;
            this.historyStack.push(this.noteId);
            const nextId = this.futureStack.pop();
            this.loadNote(nextId);
        },

        showToast(title, msg) {
             this.notify.title = title; this.notify.msg = msg; this.notify.show = true;
             setTimeout(() => this.notify.show = false, 2000);
        },

        // 触发左下角绿色呼吸卡片
        triggerAutoSaveNotify(text = 'Auto Saved') {
            this.saveNotifyText = text;
            this.showAutoSaveNotify = false;
            this.$nextTick(() => this.showAutoSaveNotify = true);
            setTimeout(() => this.showAutoSaveNotify = false, 2500); 
        },

        async loadNote(id) {
            // --- History Logic Start ---
            // 如果不是通过前进/后退触发的跳转，且 ID 确实改变了，则记录历史
            if (!this.isNavigating && this.noteId && this.noteId !== id) {
                this.historyStack.push(this.noteId);
                this.futureStack = []; // 新的跳转会清空“未来”
            }
            this.isNavigating = false; // 重置标记
            // --- History Logic End ---

            this.noteId = id;
            const res = await fetch(`/api/notes/view?id=${id}`);
            this.viewData = await res.json();
            if (this.viewData.info.type === 'file') {
                this.editorContent = this.viewData.content || '';
                this.lastSavedContent = this.editorContent;
                this.renderMarkdown();
                this.viewMode = 'read';
            }
        },

        // --- Note Linking Logic ---
        openNotePicker() {
            this.noteSearchQuery = '';
            this.noteSearchResults = [];
            this.showNotePicker = true;
            this.searchNotes(''); // Load defaults
        },
        async searchNotes(q) {
            const res = await fetch(`/api/notes/search?q=${encodeURIComponent(q)}`);
            this.noteSearchResults = await res.json();
        },
        insertNoteLink(note) {
            this.insertText(`[[note:${note.id}]]`);
            this.showNotePicker = false;
            this.noteCache[note.id] = note.name; // Pre-cache name
        },

        // --- Question Picker / Import Logic ---
        async openQuestionPicker() {
            await this.loadPickerData('root');
            this.showQuestionPicker = true;
        },
        async loadPickerData(bookId) {
            try {
                const res = await fetch(`/api/book_details?book=${bookId}`);
                const data = await res.json();
                this.pickerData = {
                    sub_notebooks: data.sub_notebooks || [],
                    questions: data.questions || [],
                    breadcrumbs: data.breadcrumbs || []
                };
            } catch(e) { 
                console.error("Import load failed:", e); 
                this.pickerData = { sub_notebooks: [], questions: [], breadcrumbs: [] };
            }
        },
        insertQuestionRef(qid) {
            this.insertText(`[[${qid}]]`);
            this.showQuestionPicker = false;
        },

        // --- Save Logic ---
        async saveNote(isAuto = false) {
            if(!this.editorContent) return;
            fetch('/api/notes/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: this.noteId, content: this.editorContent }) })
            .then(r=>r.json()).then(d => { 
                if(d.success) {
                    this.lastSavedContent = this.editorContent;
                    if (isAuto) this.triggerAutoSaveNotify("Auto Saved");
                    else this.triggerAutoSaveNotify("Saved Successfully");
                }
            });
        },

        // --- Drag & Drop Logic ---
        handleDragStart(e, index) {
            this.dragSourceIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('dragging');
        },
        handleDragEnd(e) {
            e.target.classList.remove('dragging');
            this.viewData.items.forEach((_, i) => {
                const el = document.getElementById(`note-item-${i}`);
                if(el) el.classList.remove('drag-over');
            });
        },
        handleDragOver(e, index) {
            e.preventDefault();
            const el = document.getElementById(`note-item-${index}`);
            if(el) el.classList.add('drag-over');
        },
        handleDragLeave(e, index) {
            const el = document.getElementById(`note-item-${index}`);
            if(el) el.classList.remove('drag-over');
        },
        async handleDrop(e, targetIndex) {
            e.preventDefault();
            this.handleDragEnd(e);
            
            if (this.dragSourceIndex === null || this.dragSourceIndex === targetIndex) return;

            // 1. 前端立即重排
            const items = this.viewData.items;
            const [movedItem] = items.splice(this.dragSourceIndex, 1);
            items.splice(targetIndex, 0, movedItem);
            this.viewData.items = items;

            // 2. [关键修复] 计算正确的父ID：应该是当前视图的面包屑的最后一个
            let parentId = 'root';
            if (this.viewData.breadcrumbs.length > 0) {
                parentId = this.viewData.breadcrumbs[this.viewData.breadcrumbs.length - 1].id;
            }

            const newOrder = items.map(i => i.id);
            
            await fetch('/api/notes/reorder', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ parent_id: parentId, new_order: newOrder })
            });
        },

        // --- Context Menu Logic ---
        handleContextMenu(e, item) {
            this.ctxMenu.item = item;
            this.ctxMenu.type = 'item';
            this.ctxMenu.x = e.clientX;
            this.ctxMenu.y = e.clientY;
            this.ctxMenu.show = true;
        },
        handleBlankContextMenu(e) {
            this.ctxMenu.item = null;
            this.ctxMenu.type = 'blank';
            this.ctxMenu.x = e.clientX;
            this.ctxMenu.y = e.clientY;
            this.ctxMenu.show = true;
        },

        // --- Sorting Logic ---
        async sortItems(sortBy) {
            const parentId = this.viewData.breadcrumbs.length > 1 
                ? this.viewData.breadcrumbs[this.viewData.breadcrumbs.length - 2].id 
                : 'root';
            
            const res = await fetch('/api/notes/sort', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ parent_id: parentId, sort_by: sortBy })
            });
            
            if ((await res.json()).success) {
                this.showToast("Sorted", `Sorted by ${sortBy}`);
                this.loadNote(this.noteId); 
            }
        },

        // --- Edit & Rename Logic ---
        async updateTitle(e) {
            const newTitle = e.target.value;
            if (!newTitle.trim()) return;
            
            const res = await fetch('/api/notes/rename', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ id: this.viewData.info.id, name: newTitle }) 
            });
            
            const d = await res.json();
            if(d.success) {
                this.viewData.info.name = newTitle; 
                const listItem = this.viewData.items.find(i => i.id === this.viewData.info.id);
                if (listItem) listItem.name = newTitle;
                const crumb = this.viewData.breadcrumbs.find(c => c.id === this.viewData.info.id);
                if (crumb) crumb.name = newTitle;
                this.triggerAutoSaveNotify("Title Updated");
            }
        },
        
        openRenameModal() { 
            this.renameModal.name = this.ctxMenu.item.name; 
            this.renameModal.show = true; 
            this.ctxMenu.show = false; 
        },
        async confirmRename() { 
            if (!this.renameModal.name.trim()) return; 
            const res = await fetch('/api/notes/rename', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ id: this.ctxMenu.item.id, name: this.renameModal.name }) 
            }); 
            if((await res.json()).success) { 
                this.showToast("Success", "Renamed"); 
                this.renameModal.show = false; 
                this.loadNote(this.noteId); 
            } 
        },
        
        // --- Delete Logic ---
        async deleteItem() { 
            if(!confirm(`Delete "${this.ctxMenu.item.name}"?`)) return; 
            const res = await fetch('/api/notes/delete', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ id: this.ctxMenu.item.id }) 
            }); 
            if((await res.json()).success) { 
                this.ctxMenu.show = false; 
                // Return to parent if current file deleted
                if (this.ctxMenu.item.id === this.noteId) {
                    this.loadNote(this.viewData.breadcrumbs.length > 1 ? this.viewData.breadcrumbs[this.viewData.breadcrumbs.length-2].id : 'root'); 
                } else {
                    this.loadNote(this.noteId); 
                }
            } 
        },
        
        // --- Move Logic ---
        async openMoveModal(targetId = 'root') { 
            this.ctxMenu.show = false; 
            this.moveModal.show = true; 
            await this.loadMovePicker(targetId); 
        },
        async loadMovePicker(folderId) { 
            const res = await fetch(`/api/notes/view?id=${folderId}`); 
            const data = await res.json(); 
            this.moveModal.items = data.items.filter(i => i.type === 'folder'); 
            this.moveModal.currentPath = data.breadcrumbs; 
            this.moveModal.targetId = folderId; 
        },
        async confirmMove() { 
            if (this.moveModal.targetId === this.ctxMenu.item.id) return; 
            const res = await fetch('/api/notes/move', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ id: this.ctxMenu.item.id, parent: this.moveModal.targetId }) 
            }); 
            if((await res.json()).success) { 
                this.showToast("Moved", "Success"); 
                this.moveModal.show = false; 
                // 强制刷新
                this.loadNote(this.noteId); 
            } 
        },
        
        createItem() {
            if(!this.newItemName.trim()) return;
            let parentId = 'root';
            if (this.viewData.breadcrumbs.length > 1) {
                parentId = this.viewData.breadcrumbs[this.viewData.breadcrumbs.length - 2].id;
            } else if (this.viewData.info.type === 'folder') {
                parentId = this.viewData.info.id;
            }
            fetch('/api/notes/create', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ name: this.newItemName, type: this.newItemType, parent: parentId }) 
            })
            .then(r=>r.json()).then(d => { 
                if(d.success) { 
                    this.showCreateModal = false; 
                    this.newItemName = ''; 
                    this.loadNote(this.noteId); 
                    this.showToast("Success", "Created"); 
                } else alert(d.msg); 
            });
        },

        // --- Rendering Engine (Markdown + Links) ---
        setViewMode(mode) { 
            this.viewMode = mode; 
            if (mode !== 'read') {
                this.$nextTick(() => { if(this.$refs.editorInput) this.$refs.editorInput.focus(); }); 
            } else {
                this.saveNote(); 
            }
        },
        
        renderMarkdown() { 
            if (!this.editorContent) { 
                this.renderedContent = '<span class="opacity-30 italic">Empty note...</span>'; 
                return; 
            } 
            let html = marked.parse(this.editorContent); 
            
            // 1. Render Note Links [[note:id]]
            html = html.replace(/\[\[note:(.*?)\]\]/g, (match, id) => {
                const nid = id.trim();
                const name = this.noteCache[nid];
                if (name) {
                    return `<button onclick="document.dispatchEvent(new CustomEvent('load-note', {detail: '${nid}'}))" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-500/50 transition-colors cursor-pointer align-baseline transform hover:-translate-y-0.5"><svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>${name}</button>`;
                } else {
                    return `<span class="note-link-placeholder opacity-50 bg-gray-100 dark:bg-white/10 px-1 rounded text-xs" data-nid="${nid}">Loading...</span>`;
                }
            });

            // 2. Render Question Links [[id]]
            html = html.replace(/\[\[(?!note:)(.*?)\]\]/g, (match, id) => { 
                const qid = id.trim(); 
                const qData = this.questionCache[qid]; 
                if (qData && !qData.error) { 
                    return `<div class="group relative my-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl overflow-hidden" onclick="document.dispatchEvent(new CustomEvent('open-ref', {detail: '${qid}'}))">
                                <div class="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">${qid}</span>
                                        <div class="flex gap-1">${(qData.tags || []).map(t => `<span class="text-[10px] opacity-50 font-mono">#${t}</span>`).join('')}</div>
                                    </div>
                                    <div class="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Practice</div>
                                </div>
                                <div class="p-6 prose prose-sm dark:prose-invert max-w-none math-content leading-loose">${qData.content}</div>
                            </div>`; 
                } else { 
                    return `<div class="question-embed-placeholder my-6" data-qid="${qid}"><div class="flex items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"><div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div><span class="text-xs opacity-50 font-mono">Loading ${qid}...</span></div></div>`; 
                } 
            }); 

            this.renderedContent = html; 
            
            this.$nextTick(async () => { 
                await this.updateNoteLinks(); 
                await this.updateQuestionEmbeds(); 
                if(window.MathJax) MathJax.typesetPromise(); 
            }); 
        },
        
        async updateNoteLinks() {
            const Placeholders = document.querySelectorAll('.note-link-placeholder');
            if (Placeholders.length === 0) return;
            const promises = Array.from(Placeholders).map(async (el) => {
                const nid = el.dataset.nid;
                if (this.noteCache[nid]) return; 
                try {
                    const res = await fetch(`/api/notes/info?id=${nid}`);
                    const data = await res.json();
                    if (!data.error) {
                        this.noteCache[nid] = data.name;
                        this.renderMarkdown(); 
                    } else {
                        el.innerHTML = `<span class="text-red-500 text-xs line-through">Deleted</span>`;
                    }
                } catch(e) {}
            });
            await Promise.all(promises);
        },
        
        async updateQuestionEmbeds() { 
            const Placeholders = document.querySelectorAll('.question-embed-placeholder'); 
            if (Placeholders.length === 0) return; 
            const promises = Array.from(Placeholders).map(async (el) => { 
                const qid = el.dataset.qid; 
                if (this.questionCache[qid]) return; 
                try { 
                    const res = await fetch(`/api/get_question?q_id=${qid}`); 
                    const qData = await res.json(); 
                    if (!qData.error) { 
                        this.questionCache[qid] = qData; 
                        this.renderMarkdown(); 
                    } else { 
                        el.innerHTML = `<span class="text-red-500 text-xs">Error: ${qid}</span>`; 
                    } 
                } catch(e) {} 
            }); 
            await Promise.all(promises); 
        },
        
        setupListeners() { 
            document.addEventListener('open-ref', async (e) => { await this.openRefModal(e.detail); }); 
            document.addEventListener('load-note', async (e) => { await this.loadNote(e.detail); }); 
        },

        // ... (Reference Modal Logic Keep Unchanged) ...
        async openRefModal(qid) { this.refSelected = null; this.refSubmitted = false; this.refFeedback = {}; this.refShowExplanation = false; let qData = this.questionCache[qid]; if(!qData) { const res = await fetch(`/api/get_question?q_id=${qid}`); qData = await res.json(); this.questionCache[qid] = qData; } if (qData.error) { this.showToast("Error", "Question not found"); } else { this.refQuestion = qData; this.showRefModal = true; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); } },
        selectRefOption(id) { if(!this.refSubmitted) this.refSelected = id; },
        async submitRef() { if(!this.refSelected) return; const res = await fetch('/api/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ q_id: this.refQuestion.id, choice: this.refSelected }) }); this.refFeedback = await res.json(); this.refSubmitted = true; this.refShowExplanation = true; this.$nextTick(() => { if(window.MathJax) MathJax.typesetPromise(); }); },
        getRefOptionClass(id) { let base = 'group relative p-4 pl-16 rounded-xl transition-all cursor-pointer border '; if (this.refSelected === id && !this.refSubmitted) return base + 'bg-blue-500/10 border-blue-500 text-blue-600 ring-1 ring-blue-500'; if (this.refSubmitted) { if (id === this.refFeedback.correct_id) return base + 'bg-green-500/20 border-green-500 text-green-700'; if (id === this.refSelected) return base + 'bg-red-500/20 border-red-500 text-red-700'; return base + 'opacity-40 grayscale border-transparent'; } return base + 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'; },
        
        // --- Helpers ---
        insertText(prefix, suffix = '') { const el = this.$refs.editorInput; if (!el) return; const start = el.selectionStart; const end = el.selectionEnd; const text = this.editorContent; this.editorContent = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end, text.length); this.renderMarkdown(); this.$nextTick(() => { el.focus(); el.setSelectionRange(start + prefix.length, end + prefix.length); }); },
        toggleAI() { this.aiOpen = !this.aiOpen; },
        async sendMessage() { if(!this.userMsg.trim()) return; const txt = this.userMsg; this.userMsg = ''; this.chatHistory.push({ role: 'user', text: txt }); const context = { note_content: this.editorContent }; const res = await fetch('/api/ai_chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: txt, context: context }) }); const data = await res.json(); this.chatHistory.push({ role: 'ai', text: data.reply }); }
    }));
});