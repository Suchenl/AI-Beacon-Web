
import React, { useState, useEffect, useRef } from 'react';
import { View, Paper, Pillar, Topic, FileSystemFileHandle, Comment } from './types';
import { INITIAL_PILLARS } from './constants';
import { ViewHome } from './ViewHome';
import { ViewPillar } from './ViewPillar';
import { ViewResearch } from './ViewResearch';
import { ViewTutor } from './ViewTutor';
import {
    getSelectedModel,
    setSelectedModel,
    getAvailableModels,
    getModelConfig,
    isModelAvailable,
    getApiKeyForModel,
    type AIModel
} from './aiProvider';
import { ViewDaily } from './ViewDaily';
import * as fileSystem from './fileSystem';

// State interface for the custom confirmation dialog
interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

function App() {
    // Initialize view state: check if this is a refresh (sessionStorage has marker) or new session
    const [currentView, setCurrentView] = useState<View>(() => {
        const isRefresh = sessionStorage.getItem('ai_beacon_session_active') === 'true';
        if (isRefresh) {
            // Refresh: restore previous state
            const saved = sessionStorage.getItem('ai_beacon_current_view');
            return (saved as View) || View.HOME;
        } else {
            // New session: go to home
            return View.HOME;
        }
    });

    const [activePillarId, setActivePillarId] = useState<string | null>(() => {
        const isRefresh = sessionStorage.getItem('ai_beacon_session_active') === 'true';
        if (isRefresh) {
            return sessionStorage.getItem('ai_beacon_active_pillar_id');
        }
        return null;
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [language, setLanguage] = useState<'en' | 'cn'>('en');
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const scrollRestoredRef = useRef(false);

    // User Identity State
    const [userName, setUserName] = useState<string>('');

    // Centralized Data State
    const [pillars, setPillars] = useState<Pillar[]>([]);

    // --- ATTACHED MODE STATE ---
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
    const [syncStatus, setSyncStatus] = useState<'local' | 'saving' | 'synced' | 'error'>('local');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [selectedModel, setSelectedModelState] = useState<AIModel>(() => getSelectedModel() || 'gemini-2.5-flash');

    // Custom Confirmation Modal State
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Auto-link confirmation dialog state
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const linkDialogDataRef = useRef<Pillar[] | null>(null);

    // Tutor Floating Dialog State
    const [isTutorOpen, setIsTutorOpen] = useState(false);
    const [isTutorMinimized, setIsTutorMinimized] = useState(false);
    const [tutorWidth, setTutorWidth] = useState(450); // Default width in pixels
    const [tutorHeight, setTutorHeight] = useState(600); // Default height in pixels
    const [tutorPosition, setTutorPosition] = useState({ x: window.innerWidth - 470, y: 100 });
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null); // se = southeast (corner), e = east (right), s = south (bottom)
    const resizeStartX = useRef<number>(0);
    const resizeStartY = useRef<number>(0);
    const resizeStartWidth = useRef<number>(450);
    const resizeStartHeight = useRef<number>(600);
    const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Tutor Chat Messages State - persisted in sessionStorage
    const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>(() => {
        const saved = sessionStorage.getItem('ai_beacon_tutor_messages');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [{ id: 'intro', role: 'model', text: 'Welcome to AI Beacon. I can explain any paper or concept across the 5 pillars of AI: Perception, Reasoning, Agents, Alignment, and Efficiency. What would you like to learn?' }];
            }
        }
        return [{ id: 'intro', role: 'model', text: 'Welcome to AI Beacon. I can explain any paper or concept across the 5 pillars of AI: Perception, Reasoning, Agents, Alignment, and Efficiency. What would you like to learn?' }];
    });

    // Persist tutor messages to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('ai_beacon_tutor_messages', JSON.stringify(tutorMessages));
    }, [tutorMessages]);

    // Localization Map
    const t = {
        daily: language === 'cn' ? '每日论文' : 'Daily Papers',
        radar: language === 'cn' ? '雷达' : 'Radar',
        tutor: language === 'cn' ? '导师' : 'Tutor',
        editOn: language === 'cn' ? '编辑开启' : 'Editing ON',
        editMode: language === 'cn' ? '编辑模式' : 'Edit Mode',
        settingsDB: language === 'cn' ? '数据库' : 'Database',
        openDB: language === 'cn' ? '📂 打开数据库文件' : '📂 Open DB File',
        unlinkDB: language === 'cn' ? '❌ 断开链接' : '❌ Unlink File',
        saveAs: language === 'cn' ? '💾 另存为...' : '💾 Save As...',
        saveDB: language === 'cn' ? '💾 保存数据库' : '💾 Save DB',
        settingsSys: language === 'cn' ? '系统' : 'System',
        apiKey: language === 'cn' ? '🔑 API 密钥设置' : '🔑 API Key Settings',
        footerTitle: language === 'cn' ? 'AI Beacon • 个人知识库' : 'AI Beacon • Personal Knowledge Base',
        footerSub: language === 'cn' ? '本地优先 & 安全' : 'Local-First & Secure',
        delPillarTitle: language === 'cn' ? '删除支柱' : 'Delete Pillar',
        delPillarMsg: language === 'cn' ? '您确定要删除整个支柱吗？这将永久删除其中的所有主题和论文。' : 'Are you sure you want to delete this entire PILLAR? This will permanently delete all topics and papers inside it.',
        delTopicTitle: language === 'cn' ? '删除主题' : 'Delete Topic',
        delTopicMsg: language === 'cn' ? '您确定要删除此主题吗？该主题内的所有论文都将丢失。' : 'Are you sure you want to delete this TOPIC? All papers within this topic will be lost.',
        delPaperTitle: language === 'cn' ? '删除论文' : 'Delete Paper',
        delPaperMsg: language === 'cn' ? '您确定要删除这篇论文吗？' : 'Are you sure you want to delete this paper?',
        cancel: language === 'cn' ? '取消' : 'Cancel',
        delete: language === 'cn' ? '删除' : 'Delete',
        apiTitle: language === 'cn' ? 'API 配置' : 'API Configuration',
        apiDesc: language === 'cn' ? '要启用AI功能，请选择模型并输入对应的 API 密钥。我们将以 .env.local 文件保存在您的磁盘上。' : 'To enable AI features, select a model and enter the corresponding API Key below. We will save it as .env.local on your disk.',
        selectModel: language === 'cn' ? '选择模型' : 'Select Model',
        model: language === 'cn' ? '模型' : 'Model',
        pasteKey: language === 'cn' ? '粘贴 API 密钥' : 'Paste API Key',
        createConfig: language === 'cn' ? '📝 创建配置文件' : '📝 Create Config File',
        browserBlock: language === 'cn' ? '如果浏览器阻止文件创建，请在终端中使用 node src/setup.js 脚本。' : 'If your browser blocks file creation, please use the node src/setup.js script in your terminal instead.',
        getKey: language === 'cn' ? '在此处获取免费密钥' : 'Get a Free Key here',
        syncEnabled: language === 'cn' ? '✅ 自动同步已启用。\n更改将直接保存到您的磁盘文件。' : '✅ Auto-Sync Enabled.\nChanges will be saved directly to your disk file.',
        snapshotMode: language === 'cn' ? '⚠️ 快照模式。\n此浏览器上下文 (HTTP) 不支持自动同步。\n您正在编辑副本。请手动保存以保留更改。' : '⚠️ Snapshot Mode.\nAuto-Sync is not supported in this browser context (HTTP).\nYou are editing a copy. Save manually to persist changes.',
        saved: language === 'cn' ? '✅ 数据库已保存并链接。未来的更改将自动同步。' : '✅ Database saved and linked. Future changes will auto-sync.',
        linkPromptTitle: language === 'cn' ? '关联知识库文件' : 'Link Knowledge Base File',
        linkPromptMsg: language === 'cn' ? '检测到 public/knowledge-base.json 文件。\n\n是否要关联此文件以启用自动同步？\n\n点击"关联"后，将弹出文件选择器，请选择 public/knowledge-base.json 文件。\n关联后，您的更改将自动保存到该文件。' : 'Detected public/knowledge-base.json file.\n\nWould you like to link this file to enable auto-sync?\n\nAfter clicking "Link", a file picker will appear. Please select the public/knowledge-base.json file.\nAfter linking, your changes will be automatically saved to this file.',
        link: language === 'cn' ? '关联' : 'Link',
        skip: language === 'cn' ? '跳过' : 'Skip',
        dontAskAgain: language === 'cn' ? '不再询问' : "Don't ask again",
        configCreated: language === 'cn' ? '✅ 配置文件已创建或下载。\n\n如果您在本地运行，文件可能已自动保存。\n\n如果文件被下载了，请将 ".env.local" 手动移动到项目根目录，然后刷新页面。' : '✅ Config file created or downloaded.\n\nIf running locally, it may have saved automatically.\n\nIf it was downloaded, please manually move ".env.local" to your project root folder and reload.',
        configFailed: language === 'cn' ? '❌ 创建失败。请手动创建 .env.local 文件。' : '❌ Creation failed. Please manually create a .env.local file.',
        pasteFirst: language === 'cn' ? '请先粘贴您的 API 密钥。' : 'Please paste your API Key first.',
        userName: language === 'cn' ? '用户名' : 'User Name',
        userNamePh: language === 'cn' ? '输入昵称...' : 'Enter your name...',
    };

    // Mark session as active on mount (for refresh detection)
    useEffect(() => {
        sessionStorage.setItem('ai_beacon_session_active', 'true');

        // Disable browser's automatic scroll restoration since we handle it manually
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    }, []);

    // Fine-tune scroll position after data and view are loaded (initial restore happens in index.html)
    useEffect(() => {
        // Only fine-tune once, when we have data and view is set
        if (pillars.length > 0 && !scrollRestoredRef.current) {
            const savedScrollPosition = sessionStorage.getItem('ai_beacon_scroll_position');
            if (savedScrollPosition) {
                scrollRestoredRef.current = true;
                const scrollPos = parseInt(savedScrollPosition, 10);

                // Function to check if scroll position is close enough (within 5px tolerance)
                const isScrollPositionCorrect = (current: number, target: number) => {
                    return Math.abs(current - target) <= 5;
                };

                // Fine-tune scroll position after DOM is fully rendered
                // (Initial restore already happened in index.html, this is just to ensure it's correct)
                const fineTuneScroll = () => {
                    const currentScroll = window.scrollY;
                    if (!isScrollPositionCorrect(currentScroll, scrollPos) && scrollPos > 0) {
                        // Only adjust if significantly off
                        document.documentElement.scrollTop = scrollPos;
                        document.body.scrollTop = scrollPos;
                        window.scrollTo({ top: scrollPos, left: 0, behavior: 'auto' });
                    }
                    // Ensure content is visible after scroll position is set
                    document.body.classList.add('scroll-restored');
                };

                // Wait for content to be fully rendered, then fine-tune if needed
                if (document.readyState === 'complete') {
                    setTimeout(fineTuneScroll, 100);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(fineTuneScroll, 100);
                    }, { once: true });
                }
            } else {
                scrollRestoredRef.current = true; // Mark as processed even if no saved position
                // No saved position, ensure content is visible
                document.body.classList.add('scroll-restored');
            }
        }
    }, [pillars.length, currentView, activePillarId]);

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('ai_beacon_scroll_position', window.scrollY.toString());
        };

        // Throttle scroll events for better performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        return () => window.removeEventListener('scroll', throttledScroll);
    }, []);

    // Click outside to close settings
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle dialog dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;
            setTutorPosition(prev => ({
                x: Math.max(0, Math.min(window.innerWidth - tutorWidth, prev.x + deltaX)),
                y: Math.max(0, Math.min(window.innerHeight - 100, prev.y + deltaY))
            }));
            dragStartPos.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, tutorWidth]);

    // Handle dialog resize
    useEffect(() => {
        if (!isResizing || !resizeDirection) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartX.current;
            const deltaY = e.clientY - resizeStartY.current;
            
            let newWidth = resizeStartWidth.current;
            let newHeight = resizeStartHeight.current;
            
            if (resizeDirection === 'se' || resizeDirection === 'e') {
                newWidth = Math.max(350, Math.min(900, resizeStartWidth.current + deltaX));
            }
            if (resizeDirection === 'se' || resizeDirection === 's') {
                newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStartHeight.current + deltaY));
            }
            
            setTutorWidth(newWidth);
            setTutorHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDirection(null);
        };

        const cursorMap = {
            'se': 'nwse-resize',
            'e': 'ew-resize',
            's': 'ns-resize'
        };
        const cursor = cursorMap[resizeDirection] || 'nwse-resize';

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = cursor;
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resizeDirection]);

    const handleDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('input, button, a')) return; // Don't drag if clicking on interactive elements
        e.preventDefault();
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'e' | 's' = 'se') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        resizeStartX.current = e.clientX;
        resizeStartY.current = e.clientY;
        resizeStartWidth.current = tutorWidth;
        resizeStartHeight.current = tutorHeight;
    };

    // Check for API Key on Mount
    useEffect(() => {
        const currentModel = getSelectedModel() || 'gemini-2.5-flash';
        const config = getModelConfig(currentModel);
        if (config) {
            const apiKey = getApiKeyForModel(currentModel);
            if (!apiKey) {
                setShowSetupModal(true);
            }
        } else {
            // Fallback: check for any API key
            const hasKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;
            if (!hasKey) {
                setShowSetupModal(true);
            }
        }
    }, []);

    // Track if we should attempt auto-link on first change
    const autoLinkAttemptedRef = useRef(false);
    const initialPillarsRef = useRef<string>('');
    const autoLinkPromptShownRef = useRef(false);

    // Initialize from external knowledge base file
    useEffect(() => {
        const initializeData = async () => {
            let loadedPillars: Pillar[] | null = null;
            let loadedFromPublic = false;

            // 0. First, try to restore file handle from IndexedDB
            let restoredHandle: FileSystemFileHandle | null = null;
            try {
                restoredHandle = await fileSystem.getFileHandleFromIndexedDB('knowledge-base');
                if (restoredHandle) {
                    setFileHandle(restoredHandle);
                    setSyncStatus('synced');
                    console.log('✅ File handle restored from IndexedDB');
                    // Try to load data from the restored file handle
                    try {
                        const file = await restoredHandle.getFile();
                        const text = await file.text();
                        loadedPillars = JSON.parse(text);
                        console.log('✅ Loaded data from restored file handle');
                    } catch (e) {
                        console.warn('Failed to load data from restored file handle:', e);
                    }
                }
            } catch (e) {
                console.warn('Failed to restore file handle from IndexedDB:', e);
            }

            // 1. If we don't have data yet, try to load from default knowledge base file (public/knowledge-base.json)
            if (!loadedPillars) {
                try {
                    loadedPillars = await fileSystem.loadDefaultKnowledgeBase();
                    if (loadedPillars) {
                        loadedFromPublic = true;
                        console.log('✅ Loaded from default knowledge base file');
                    }
                } catch (e) {
                    console.warn('Failed to load default knowledge base file:', e);
                }
            }

            // 2. Fallback to localStorage if knowledge base file not available
            if (!loadedPillars) {
                const saved = localStorage.getItem('ai_beacon_data_v2');
                if (saved) {
                    try {
                        loadedPillars = JSON.parse(saved);
                        console.log('✅ Loaded from localStorage');
                    } catch (e) {
                        console.error("Failed to load saved data from localStorage", e);
                    }
                }
            }

            // 3. Final fallback to INITIAL_PILLARS (hardcoded constants)
            if (!loadedPillars) {
                loadedPillars = INITIAL_PILLARS;
                console.log('✅ Using hardcoded INITIAL_PILLARS as fallback');
            }

            // HYDRATION: Backfill missing abstracts for papers that exist in INITIAL_PILLARS
            const hydratedPillars = loadedPillars.map((p: Pillar) => {
                const initPillar = INITIAL_PILLARS.find(ip => ip.id === p.id);
                if (!initPillar) return p;

                return {
                    ...p,
                    topics: p.topics.map((t: Topic) => {
                        const initTopic = initPillar.topics.find(it => it.id === t.id);
                        if (!initTopic) return t;

                        return {
                            ...t,
                            papers: t.papers.map((pp: Paper) => {
                                const initPaper = initTopic.papers.find(ip => ip.id === pp.id);
                                if (initPaper && initPaper.abstract &&
                                    (!pp.abstract || pp.abstract === pp.summary || pp.abstract === "No full abstract available.")) {
                                    return { ...pp, abstract: initPaper.abstract };
                                }
                                return pp;
                            })
                        };
                    })
                };
            });

            setPillars(hydratedPillars);
            // Store initial state for comparison
            initialPillarsRef.current = JSON.stringify(hydratedPillars);

            // 4. Load User Name
            const savedName = localStorage.getItem('ai_beacon_username');
            if (savedName) setUserName(savedName);

            // 5. If loaded from public/knowledge-base.json and not already linked, ask user if they want to link
            // Only show dialog if we don't have a file handle (either restored or newly linked)
            if (loadedFromPublic && !fileHandle && !autoLinkPromptShownRef.current) {
                const linkDisabled = localStorage.getItem('ai_beacon_auto_link_disabled') === 'true';
                if (!linkDisabled) {
                    autoLinkPromptShownRef.current = true;
                    linkDialogDataRef.current = hydratedPillars;
                    // Use setTimeout to ensure the dialog shows after the component is fully rendered
                    setTimeout(() => {
                        setShowLinkDialog(true);
                    }, 100);
                }
            }
        };

        initializeData();
    }, []);

    // Auto-link to default knowledge base when user makes first change (if not already linked)
    useEffect(() => {
        // Skip if already linked, already attempted, or no data
        if (fileHandle || autoLinkAttemptedRef.current || pillars.length === 0) return;

        // Check if data has changed from initial state (user made a change)
        const currentData = JSON.stringify(pillars);
        if (currentData === initialPillarsRef.current) return; // No changes yet

        // User has made a change, attempt auto-link
        const attemptAutoLink = async () => {
            autoLinkAttemptedRef.current = true;

            // Check if auto-link is enabled (default: true)
            const autoLinkEnabled = localStorage.getItem('ai_beacon_auto_link') !== 'false';
            if (!autoLinkEnabled) return;

            try {
                const linkResult = await fileSystem.autoLinkDefaultKnowledgeBase();
                if (linkResult) {
                    setFileHandle(linkResult.handle);
                    setSyncStatus(linkResult.mode === 'synced' ? 'synced' : 'local');
                    console.log('✅ Auto-linked to default knowledge base file');
                    // Save the preference
                    localStorage.setItem('ai_beacon_auto_link', 'true');
                    // Save current data to the linked file
                    await fileSystem.saveToHandle(linkResult.handle, pillars);
                    // Persist handle so future sessions reuse it automatically
                    if (linkResult.handle) {
                        await fileSystem.saveFileHandleToIndexedDB(linkResult.handle, 'knowledge-base');
                    }
                }
            } catch (e) {
                console.warn('Auto-link failed or cancelled:', e);
                // Don't show error to user, just silently fail
            }
        };

        attemptAutoLink();
    }, [pillars, fileHandle]);

    // --- PERSISTENCE ENGINE ---

    // 1. Always save to localStorage (Hot Backup)
    useEffect(() => {
        if (pillars.length > 0) {
            localStorage.setItem('ai_beacon_data_v2', JSON.stringify(pillars));
        }
    }, [pillars]);

    // Save username to local storage
    useEffect(() => {
        if (userName) {
            localStorage.setItem('ai_beacon_username', userName);
        }
    }, [userName]);

    // 2. Auto-Sync to Disk (Attached Mode)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!fileHandle || pillars.length === 0) return;

        setSyncStatus('saving');

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await fileSystem.saveToHandle(fileHandle, pillars);
                setSyncStatus('synced');
            } catch (err) {
                console.error("Auto-sync failed", err);
                setSyncStatus('error');
            }
        }, 1000); // 1 second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [pillars, fileHandle]);


    // --- FILE OPERATIONS ---

    const handleOpenDB = async () => {
        setShowSettings(false);
        const result = await fileSystem.openDatabase();
        if (result) {
            setPillars(result.data);
            setFileHandle(result.handle);
            setSyncStatus(result.mode === 'synced' ? 'synced' : 'local');
            // Don't force navigation to home, let user stay on current page

            // Save file handle to IndexedDB if we have one
            if (result.handle) {
                await fileSystem.saveFileHandleToIndexedDB(result.handle, 'knowledge-base');
            }

            if (result.mode === 'synced') {
                alert(t.syncEnabled);
            } else {
                alert(t.snapshotMode);
            }
        }
    };

    const handleSaveAs = async () => {
        setShowSettings(false);
        const result = await fileSystem.saveDatabase(pillars, 'my-ai-beacon-db.json');
        if (result) {
            setFileHandle(result.handle);
            setSyncStatus(result.mode === 'synced' ? 'synced' : 'local');

            // Save file handle to IndexedDB if we have one
            if (result.handle) {
                await fileSystem.saveFileHandleToIndexedDB(result.handle, 'knowledge-base');
            }

            if (result.mode === 'synced') {
                alert(t.saved);
            }
        }
    };

    const handleUnlink = async () => {
        setShowSettings(false);
        setFileHandle(null);
        setSyncStatus('local');
        // Remove file handle from IndexedDB
        await fileSystem.removeFileHandleFromIndexedDB('knowledge-base');
    };

    const handleLinkKnowledgeBase = async () => {
        setShowLinkDialog(false);
        if (!linkDialogDataRef.current) return;

        try {
            // Try to get file handle for knowledge-base.json
            const result = await fileSystem.autoLinkDefaultKnowledgeBase();
            if (result && result.handle) {
                setFileHandle(result.handle);
                setSyncStatus(result.mode === 'synced' ? 'synced' : 'local');
                // Save current data to the linked file
                await fileSystem.saveToHandle(result.handle, linkDialogDataRef.current);
                // Save file handle to IndexedDB for persistence
                await fileSystem.saveFileHandleToIndexedDB(result.handle, 'knowledge-base');
                console.log('✅ Linked to knowledge-base.json and saved to IndexedDB');
            }
        } catch (e) {
            console.warn('Failed to link knowledge-base.json:', e);
        }
        setDontAskAgain(false); // Reset checkbox state
        linkDialogDataRef.current = null;
    };

    const handleSkipLink = () => {
        setShowLinkDialog(false);
        // Only disable auto-link if user checked "don't ask again"
        if (dontAskAgain) {
            localStorage.setItem('ai_beacon_auto_link_disabled', 'true');
        }
        setDontAskAgain(false); // Reset checkbox state
        linkDialogDataRef.current = null;
    };

    const handleCreateConfigFile = async () => {
        if (!apiKeyInput.trim()) {
            alert(t.pasteFirst);
            return;
        }
        const config = getModelConfig(selectedModel);
        if (!config) {
            alert('Invalid model selected');
            return;
        }
        const content = `${config.requiresApiKey}=${apiKeyInput.trim()}`;
        const success = await fileSystem.saveTextFile(content, '.env.local');

        if (success) {
            // Changed alert to explain that if fallback occurred, they need to move the file
            alert(t.configCreated);
            window.location.reload();
        } else {
            alert(t.configFailed);
        }
    };


    // --- CRUD Operations ---

    const handleAddPillar = () => {
        const newPillar: Pillar = {
            id: `custom-${Date.now()}`,
            title: 'VI. New Frontier',
            subtitle: 'Subtitle Here',
            color: 'indigo',
            description: 'Description of this new field.',
            topics: []
        };
        setPillars(prev => [...prev, newPillar]);
    };

    const handleImportPillar = (importedPillar: Pillar) => {
        const newPillar = { ...importedPillar, id: `imported-${Date.now()}-${Math.random()}` };
        setPillars(prev => [...prev, newPillar]);
    };

    const handleDeletePillar = (pillarId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t.delPillarTitle,
            message: t.delPillarMsg,
            onConfirm: () => {
                setPillars(prev => prev.filter(p => p.id !== pillarId));
                if (activePillarId === pillarId) setCurrentView(View.HOME);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleAddTopic = (pillarId: string) => {
        setPillars(prev => prev.map(p => {
            if (p.id === pillarId) {
                return {
                    ...p,
                    topics: [...p.topics, {
                        id: `topic-${Date.now()}`,
                        title: 'New Research Topic',
                        description: 'Description of this topic...',
                        papers: []
                    }]
                };
            }
            return p;
        }));
    };

    const handleImportTopic = (pillarId: string, importedTopic: Topic) => {
        const newTopic = { ...importedTopic, id: `imported-topic-${Date.now()}` };
        setPillars(prev => prev.map(p => {
            if (p.id === pillarId) {
                return { ...p, topics: [...p.topics, newTopic] };
            }
            return p;
        }));
    };

    const handleDeleteTopic = (pillarId: string, topicId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t.delTopicTitle,
            message: t.delTopicMsg,
            onConfirm: () => {
                setPillars(prev => prev.map(p => {
                    if (p.id === pillarId) {
                        return { ...p, topics: p.topics.filter(t => t.id !== topicId) };
                    }
                    return p;
                }));
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleAddPaper = (pillarId: string, topicId: string, paper: Paper) => {
        setPillars(prev => prev.map(p => {
            if (p.id === pillarId) {
                return {
                    ...p,
                    topics: p.topics.map(t => {
                        if (t.id === topicId) {
                            return { ...t, papers: [paper, ...t.papers] }; // Add to top
                        }
                        return t;
                    })
                };
            }
            return p;
        }));
    };

    const handleAddPaperToPillar = (pillarId: string, topicName: string, paper: Paper) => {
        setPillars(prev => prev.map(p => {
            if (p.id !== pillarId) return p;

            const existingTopicIndex = p.topics.findIndex(t => t.title === topicName || t.id === topicName);

            if (existingTopicIndex >= 0) {
                // Add to existing
                const updatedTopics = [...p.topics];
                updatedTopics[existingTopicIndex] = {
                    ...updatedTopics[existingTopicIndex],
                    papers: [paper, ...updatedTopics[existingTopicIndex].papers]
                };
                return { ...p, topics: updatedTopics };
            } else {
                // Create new
                const newTopic: Topic = {
                    id: `topic-${Date.now()}`,
                    title: topicName,
                    description: 'Created from Daily Papers',
                    papers: [paper]
                };
                return { ...p, topics: [...p.topics, newTopic] };
            }
        }));
    };

    const handleUpdatePaper = (pillarId: string, topicId: string, paperId: string, updates: Partial<Paper>) => {
        setPillars(prev => prev.map(p => {
            if (p.id === pillarId) {
                return {
                    ...p,
                    topics: p.topics.map(t => {
                        if (t.id === topicId) {
                            return {
                                ...t,
                                papers: t.papers.map(pp => pp.id === paperId ? { ...pp, ...updates } : pp)
                            };
                        }
                        return t;
                    })
                };
            }
            return p;
        }));
    };

    const handleDeletePaper = (pillarId: string, topicId: string, paperId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t.delPaperTitle,
            message: t.delPaperMsg,
            onConfirm: () => {
                setPillars(prev => prev.map(p => {
                    if (p.id === pillarId) {
                        return {
                            ...p,
                            topics: p.topics.map(t => {
                                if (t.id === topicId) {
                                    return { ...t, papers: t.papers.filter(pp => pp.id !== paperId) };
                                }
                                return t;
                            })
                        };
                    }
                    return p;
                }));
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUpdatePillarMeta = (pillarId: string, updates: Partial<Pillar>) => {
        setPillars(prev => prev.map(p => p.id === pillarId ? { ...p, ...updates } : p));
    };

    const handleUpdateTopicMeta = (pillarId: string, topicId: string, updates: Partial<Topic>) => {
        setPillars(prev => prev.map(p => {
            if (p.id === pillarId) {
                return {
                    ...p,
                    topics: p.topics.map(t => t.id === topicId ? { ...t, ...updates } : t)
                };
            }
            return p;
        }));
    };

    // --- COMMENTS HANDLERS ---
    const handleAddComment = (pillarId: string, topicId: string, paperId: string, text: string) => {
        const newComment: Comment = {
            id: `c-${Date.now()}`,
            userName: userName || 'Anonymous',
            text: text,
            timestamp: Date.now()
        };

        setPillars(prev => prev.map(p => {
            if (p.id !== pillarId) return p;
            return {
                ...p,
                topics: p.topics.map(t => {
                    if (t.id !== topicId) return t;
                    return {
                        ...t,
                        papers: t.papers.map(pp => {
                            if (pp.id !== paperId) return pp;
                            return { ...pp, comments: [...(pp.comments || []), newComment] };
                        })
                    }
                })
            }
        }));
    };

    const handleDeleteComment = (pillarId: string, topicId: string, paperId: string, commentId: string) => {
        setPillars(prev => prev.map(p => {
            if (p.id !== pillarId) return p;
            return {
                ...p,
                topics: p.topics.map(t => {
                    if (t.id !== topicId) return t;
                    return {
                        ...t,
                        papers: t.papers.map(pp => {
                            if (pp.id !== paperId) return pp;
                            return { ...pp, comments: (pp.comments || []).filter(c => c.id !== commentId) };
                        })
                    }
                })
            }
        }));
    };

    // --- Navigation ---

    const handleNavigate = (view: View, pillarId?: string) => {
        setCurrentView(view);
        if (pillarId) {
            setActivePillarId(pillarId);
            sessionStorage.setItem('ai_beacon_active_pillar_id', pillarId);
        } else {
            setActivePillarId(null);
            sessionStorage.removeItem('ai_beacon_active_pillar_id');
        }
        sessionStorage.setItem('ai_beacon_current_view', view);
        // Clear scroll position when navigating (user action), so refresh will start at top for new page
        sessionStorage.removeItem('ai_beacon_scroll_position');
        // Reset scroll restore flag so it can restore on next refresh
        scrollRestoredRef.current = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderView = () => {
        switch (currentView) {
            case View.HOME:
                return (
                    <ViewHome
                        pillars={pillars}
                        onChangeView={handleNavigate}
                        isEditMode={isEditMode}
                        onAddPillar={handleAddPillar}
                        onImportPillar={handleImportPillar}
                        onDeletePillar={handleDeletePillar}
                        language={language}
                    />
                );

            case View.PILLAR_DETAIL:
                const pillar = pillars.find(p => p.id === activePillarId);
                if (!pillar) return <ViewHome pillars={pillars} onChangeView={handleNavigate} isEditMode={isEditMode} language={language} />;
                return (
                    <ViewPillar
                        pillar={pillar}
                        isEditMode={isEditMode}
                        onAddTopic={() => handleAddTopic(pillar.id)}
                        onImportTopic={(t) => handleImportTopic(pillar.id, t)}
                        onDeleteTopic={(tId) => handleDeleteTopic(pillar.id, tId)}
                        onUpdateTopic={(tId, updates) => handleUpdateTopicMeta(pillar.id, tId, updates)}
                        onAddPaper={(tId, paper) => handleAddPaper(pillar.id, tId, paper)}
                        onUpdatePaper={(tId, pId, updates) => handleUpdatePaper(pillar.id, tId, pId, updates)}
                        onDeletePaper={(tId, pId) => handleDeletePaper(pillar.id, tId, pId)}
                        onUpdatePillar={(updates) => handleUpdatePillarMeta(pillar.id, updates)}
                        onAddComment={(tId, pId, txt) => handleAddComment(pillar.id, tId, pId, txt)}
                        onDeleteComment={(tId, pId, cId) => handleDeleteComment(pillar.id, tId, pId, cId)}
                        language={language}
                        userName={userName}
                    />
                );

            case View.RESEARCH:
                return <ViewResearch />;

            case View.DAILY:
                return <ViewDaily pillars={pillars} onAddPaperToPillar={handleAddPaperToPillar} language={language} />;

            default:
                return <ViewHome pillars={pillars} onChangeView={handleNavigate} isEditMode={isEditMode} language={language} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans">
            {/* Navigation Header */}
            <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
                            onClick={() => handleNavigate(View.HOME)}
                        >
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-white group-hover:text-indigo-600 transition-colors shadow-lg shadow-indigo-900/20">
                                AI
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">Beacon</span>
                        </div>

                        {/* Quick Pillar Index (Desktop/Tablet - Left aligned next to logo) */}
                        <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-1">
                            {pillars.map(p => {
                                const isActive = currentView === View.PILLAR_DETAIL && activePillarId === p.id;
                                const shortTitle = p.title.split('.')[0].trim(); // Gets Roman Numeral (I, II, etc)

                                let activeClass = 'bg-slate-700 text-white ring-1 ring-slate-600';
                                if (p.color === 'cyan') activeClass = 'text-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/50';
                                if (p.color === 'indigo') activeClass = 'text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/50';
                                if (p.color === 'emerald') activeClass = 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/50';
                                if (p.color === 'rose') activeClass = 'text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/50';
                                if (p.color === 'amber') activeClass = 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/50';

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleNavigate(View.PILLAR_DETAIL, p.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isActive
                                            ? activeClass
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                                            }`}
                                        title={p.title}
                                    >
                                        {shortTitle}
                                    </button>
                                );
                            })}
                        </div>

                        {/* File System Status */}
                        {fileHandle && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-indigo-500/30 text-xs ml-2 shrink-0">
                                <span>
                                    {syncStatus === 'saving' ? '⏳' : syncStatus === 'synced' ? '✅' : '⚠️'}
                                </span>
                                <span className="text-indigo-300 font-mono truncate max-w-[120px]">
                                    {fileHandle.name}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 ml-4 shrink-0">
                        <NavButton active={currentView === View.DAILY} onClick={() => handleNavigate(View.DAILY)} icon="📰">{t.daily}</NavButton>
                        <NavButton active={currentView === View.RESEARCH} onClick={() => handleNavigate(View.RESEARCH)} icon="📡">{t.radar}</NavButton>
                        <NavButton active={isTutorOpen} onClick={() => setIsTutorOpen(!isTutorOpen)} icon="🎓">{t.tutor}</NavButton>

                        {/* Language Toggle */}
                        <button
                            onClick={() => setLanguage(prev => prev === 'en' ? 'cn' : 'en')}
                            className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 rounded bg-slate-800"
                        >
                            {language === 'en' ? 'EN' : 'CN'}
                        </button>

                        <div className="h-6 w-px bg-slate-700 mx-1"></div>

                        {/* Settings Dropdown */}
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                            </button>

                            {showSettings && (
                                <div className="absolute right-0 top-12 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-[100] animate-fade-in">
                                    <div className="px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.settingsDB}</div>
                                    {!fileHandle ? (
                                        <button onClick={handleOpenDB} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                            {t.openDB}
                                        </button>
                                    ) : (
                                        <button onClick={handleUnlink} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2">
                                            {t.unlinkDB}
                                        </button>
                                    )}
                                    <button onClick={handleSaveAs} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                        {fileHandle ? t.saveAs : t.saveDB}
                                    </button>

                                    <div className="px-4 py-2 border-b border-slate-800 border-t mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.settingsSys}</div>

                                    {/* Model Selection */}
                                    <div className="px-4 py-3 border-b border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.selectModel}</label>
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => {
                                                const newModel = e.target.value as AIModel;
                                                setSelectedModelState(newModel);
                                                setSelectedModel(newModel);
                                            }}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            {getAvailableModels().map(model => {
                                                const config = getModelConfig(model);
                                                const available = isModelAvailable(model);
                                                return (
                                                    <option key={model} value={model} disabled={!available}>
                                                        {config?.displayName || model} {available ? '' : '(API Key Missing)'}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="mt-2 text-xs text-slate-500">
                                            {getModelConfig(selectedModel)?.provider === 'gemini' && (
                                                <span>{language === 'cn' ? '需要 Gemini API Key' : 'Requires Gemini API Key'}</span>
                                            )}
                                            {getModelConfig(selectedModel)?.provider === 'openai' && (
                                                <span>{language === 'cn' ? '需要 OpenAI API Key' : 'Requires OpenAI API Key'}</span>
                                            )}
                                            {getModelConfig(selectedModel)?.provider === 'anthropic' && (
                                                <span>{language === 'cn' ? '需要 Anthropic API Key' : 'Requires Anthropic API Key'}</span>
                                            )}
                                            {getModelConfig(selectedModel)?.provider === 'qwen' && (
                                                <span>{language === 'cn' ? '需要 Qwen (DashScope) API Key' : 'Requires Qwen (DashScope) API Key'}</span>
                                            )}
                                            {getModelConfig(selectedModel)?.provider === 'grok' && (
                                                <span>{language === 'cn' ? '需要 xAI Grok API Key' : 'Requires xAI Grok API Key'}</span>
                                            )}
                                        </div>
                                    </div>

                                    <button onClick={() => { setShowSettings(false); setShowSetupModal(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                        {t.apiKey}
                                    </button>

                                    <div className="px-4 py-3 border-t border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.userName}</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder={t.userNamePh}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all ${isEditMode
                                ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            title="Toggle Edit Mode"
                        >
                            {isEditMode ? <span className="sm:hidden">✎</span> : <span className="sm:hidden">👁</span>}
                            <span className="hidden sm:inline">{isEditMode ? t.editOn : t.editMode}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>

            {/* Tutor Floating Dialog */}
            {isTutorOpen && (
                <div
                    className="fixed bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-[100]"
                    style={{
                        width: isTutorMinimized ? '300px' : `${tutorWidth}px`,
                        height: isTutorMinimized ? 'auto' : `${tutorHeight}px`,
                        left: `${tutorPosition.x}px`,
                        top: `${tutorPosition.y}px`,
                        transition: isDragging || isResizing ? 'none' : 'width 0.2s, height 0.2s'
                    }}
                >
                    {/* Dialog Header - Draggable */}
                    <div
                        onMouseDown={handleDragStart}
                        className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/90 backdrop-blur cursor-move select-none"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎓</span>
                            <h2 className="text-lg font-bold text-white">AI Tutor</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTutorMinimized(!isTutorMinimized);
                                }}
                                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                                title={isTutorMinimized ? 'Expand' : 'Minimize'}
                            >
                                {isTutorMinimized ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTutorOpen(false);
                                }}
                                className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Dialog Content */}
                    {!isTutorMinimized && (
                        <div className="flex-1 overflow-hidden" style={{ height: `${tutorHeight - 60}px` }}>
                            <ViewTutor 
                                messages={tutorMessages}
                                onMessagesChange={setTutorMessages}
                                pillars={pillars}
                                selectedModel={selectedModel}
                            />
                        </div>
                    )}

                    {/* Resize Handles - Corner and edges */}
                    {!isTutorMinimized && (
                        <>
                            {/* Bottom-right corner resize handle */}
                            <div
                                onMouseDown={(e) => handleResizeStart(e, 'se')}
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-slate-800 hover:bg-slate-600 active:bg-slate-500 transition-colors rounded-tl-lg z-10"
                                style={{
                                    clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
                                }}
                                title="Drag to resize"
                            >
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-slate-400"></div>
                                <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b border-slate-300"></div>
                            </div>
                            {/* Right edge resize handle */}
                            <div
                                onMouseDown={(e) => handleResizeStart(e, 'e')}
                                className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-slate-700/50 z-10"
                                title="Drag to resize width"
                            />
                            {/* Bottom edge resize handle */}
                            <div
                                onMouseDown={(e) => handleResizeStart(e, 's')}
                                className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-slate-700/50 z-10"
                                title="Drag to resize height"
                            />
                        </>
                    )}
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 mt-auto bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm">
                    <p className="mb-2 font-medium">{t.footerTitle}</p>
                    <p className="text-xs opacity-60">{t.footerSub}</p>
                </div>
            </footer>

            {/* Confirmation Modal */}
            {confirmDialog.isOpen && (
                <ConfirmationModal
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    t={t}
                />
            )}

            {/* API Key Setup Modal */}
            {showSetupModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
                    <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">
                        <button onClick={() => setShowSetupModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>

                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">🔑</div>
                            <h2 className="text-2xl font-bold text-white mb-2">{t.apiTitle}</h2>
                            <p className="text-slate-400 text-sm">
                                {t.apiDesc}
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-6">
                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">{t.pasteKey}</label>
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                                placeholder="AIzaSy..."
                            />
                            <div className="mt-4">
                                <button
                                    onClick={handleCreateConfigFile}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <span>{t.createConfig}</span>
                                </button>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    {t.browserBlock}
                                </p>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-600">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-400">{t.getKey}</a>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Knowledge Base Dialog */}
            {showLinkDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
                    <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">📂</div>
                            <h2 className="text-xl font-bold text-white mb-2">{t.linkPromptTitle}</h2>
                            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                                {t.linkPromptMsg}
                            </p>
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-slate-900 cursor-pointer"
                                />
                                <span className="text-sm">{t.dontAskAgain}</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleSkipLink}
                                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
                            >
                                {t.skip}
                            </button>
                            <button
                                onClick={handleLinkKnowledgeBase}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-colors text-sm"
                            >
                                {t.link}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const NavButton: React.FC<{ children: React.ReactNode; active: boolean; onClick: () => void; icon: string }> = ({ children, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${active
            ? 'bg-slate-800 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
    >
        <span className="text-base">{icon}</span>
        <span className="hidden md:inline">{children}</span>
    </button>
);

const ConfirmationModal: React.FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; t: any }> = ({ title, message, onConfirm, onCancel, t }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[250] p-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-red-500 text-2xl">⚠️</span>
                <span>{title}</span>
            </h3>
            <p className="text-slate-300 mb-8 leading-relaxed text-sm">
                {message}
            </p>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
                >
                    {t.cancel}
                </button>
                <button
                    onClick={onConfirm}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 transition-colors text-sm"
                >
                    {t.delete}
                </button>
            </div>
        </div>
    </div>
);

export default App;
